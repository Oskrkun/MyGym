// js/app.js
import { getRoutines, getCurrentRoutinePointer, saveCurrentRoutinePointer, getDayState, saveDayState, getGlobalHistory, saveGlobalHistory } from './storage.js';
import { getExerciseById } from './db.js';
import { startRestTimer, stopRestTimer, pauseRestTimer, addTimeRestTimer } from './timer.js';
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

  // Eventos de controles del temporizador
  document.getElementById('stopTimerBtn')?.addEventListener('click', stopRestTimer);
  document.getElementById('pauseTimerBtn')?.addEventListener('click', pauseRestTimer);
  document.getElementById('addTimeTimerBtn')?.addEventListener('click', () => addTimeRestTimer(15));
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
  if (!routine) return;

  const dayState = getDayState(currentRoutineId);
  container.innerHTML = '';

  routine.exercises.forEach((exItem, exIdx) => {
    const exercise = getExerciseById(exItem.exerciseId);
    if (!exercise) return;

    const state = dayState[exIdx] || { completed: [], weights: [], imageIndex: 0 };
    const currentImg = exercise.images && exercise.images.length > 0 
      ? exercise.images[state.imageIndex || 0] 
      : 'gifs/default.gif';

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${exercise.name}</span>
        <small>${exercise.group}</small>
      </div>
      <div class="exercise-media" style="text-align: center; margin: 10px 0;">
        <img src="${currentImg}" alt="${exercise.name}" style="max-width: 100%; height: auto; border-radius: 8px;">
      </div>
      <div class="sets-grid">
        ${Array.from({ length: exItem.sets }).map((_, setIdx) => `
          <div class="set-row">
            <span>Serie ${setIdx + 1}</span>
            <input type="number" id="weight_${exIdx}_${setIdx}" name="weight_${exIdx}_${setIdx}" class="set-input weight-input" placeholder="kg" value="${state.weights[setIdx] || ''}" data-ex="${exIdx}" data-set="${setIdx}">
            <button class="check-btn ${state.completed[setIdx] ? 'completed' : ''}" data-ex="${exIdx}" data-set="${setIdx}">
              ✓
            </button>
          </div>
        `).join('')}
      </div>
    `;

    // Guardado de peso y marcado de series
    card.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eIdx = Number(e.currentTarget.dataset.ex);
        const sIdx = Number(e.currentTarget.dataset.set);

        dayState[eIdx].completed[sIdx] = !dayState[eIdx].completed[sIdx];
        saveDayState(currentRoutineId, dayState);
        registerHistoryEntry(routine.name, dayState, routine);
        renderWorkoutView();

        if (dayState[eIdx].completed[sIdx]) {
          startRestTimer();
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

function registerHistoryEntry(routineName, dayState, routine) {
  const todayStr = new Date().toISOString().split('T')[0];
  const history = getGlobalHistory();
  
  const details = routine.exercises.map((exItem, i) => {
    const ex = getExerciseById(exItem.exerciseId);
    const completedCount = (dayState[i]?.completed || []).filter(Boolean).length;
    return {
      name: ex ? ex.name : 'Ejercicio',
      summary: `${completedCount}/${exItem.sets} series`
    };
  });

  history[todayStr] = history[todayStr] || [];
  history[todayStr].push({
    routineName,
    timestamp: new Date().toISOString(),
    details
  });

  saveGlobalHistory(history);
}