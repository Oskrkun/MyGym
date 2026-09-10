// js/app.js

import { getRoutines, getCurrentRoutinePointer, saveCurrentRoutinePointer, getDayState, saveDayState } from './storage.js';
import { getExerciseById } from './db.js';
import { startRestTimer, stopRestTimer } from './timer.js';
import { renderHeatmap } from './heatmap.js';
import { initAdminPanel } from './admin.js';

let currentRoutineId = getCurrentRoutinePointer();

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  renderRoutineSelector();
  renderWorkoutView();
  renderHeatmap();
  initAdminPanel(() => {
    renderRoutineSelector();
    renderWorkoutView();
  });

  const stopTimerBtn = document.getElementById('stopTimerBtn');
  if (stopTimerBtn) stopTimerBtn.addEventListener('click', stopRestTimer);
});

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.style.display = 'none');

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.style.display = 'block';

      if (btn.dataset.tab === 'progressTab') {
        renderHeatmap();
      }
    });
  });
}

function renderRoutineSelector() {
  const selector = document.getElementById('routineSelect');
  if (!selector) return;

  const routines = getRoutines();
  selector.innerHTML = '';

  routines.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    if (r.id === currentRoutineId) opt.selected = true;
    selector.appendChild(opt);
  });

  selector.addEventListener('change', (e) => {
    currentRoutineId = Number(e.target.value);
    saveCurrentRoutinePointer(currentRoutineId);
    renderWorkoutView();
  });
}

function renderWorkoutView() {
  const container = document.getElementById('workoutContainer');
  if (!container) return;

  const routines = getRoutines();
  const routine = routines.find(r => r.id === currentRoutineId);
  if (!routine) {
    container.innerHTML = '<p>No se encontró la rutina seleccionada.</p>';
    return;
  }

  const dayState = getDayState(currentRoutineId);
  container.innerHTML = '';

  routine.exercises.forEach((exItem, exIdx) => {
    const exercise = getExerciseById(exItem.exerciseId);
    if (!exercise) return;

    const state = dayState[exIdx] || { completed: [], weights: [] };
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${exercise.name}</span>
        <small>${exercise.group}</small>
      </div>
      <div class="sets-grid">
        ${Array.from({ length: exItem.sets }).map((_, setIdx) => `
          <div class="set-row">
            <span>Serie ${setIdx + 1}</span>
            <input type="number" class="set-input weight-input" placeholder="kg" value="${state.weights[setIdx] || ''}" data-ex="${exIdx}" data-set="${setIdx}">
            <button class="check-btn ${state.completed[setIdx] ? 'completed' : ''}" data-ex="${exIdx}" data-set="${setIdx}">
              ✓
            </button>
          </div>
        `).join('')}
      </div>
    `;

    // Eventos de Check y Peso
    card.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eIdx = Number(e.currentTarget.dataset.ex);
        const sIdx = Number(e.currentTarget.dataset.set);

        dayState[eIdx].completed[sIdx] = !dayState[eIdx].completed[sIdx];
        saveDayState(currentRoutineId, dayState);
        renderWorkoutView();

        if (dayState[eIdx].completed[sIdx]) {
          startRestTimer((left) => {
            const display = document.getElementById('timerDisplay');
            if (display) display.textContent = `${left}s`;
          });
        }
      });
    });

    card.querySelectorAll('.weight-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const eIdx = Number(e.target.dataset.ex);
        const sIdx = Number(e.target.dataset.set);
        dayState[eIdx].weights[sIdx] = e.target.value;
        saveDayState(currentRoutineId, dayState);
      });
    });

    container.appendChild(card);
  });
}