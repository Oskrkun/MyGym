// js/admin.js

import { getRoutines, saveRoutines, getRestSeconds, setRestSeconds } from './storage.js';
import { getExercises } from './db.js';

export function initAdminPanel(onDataChanged) {
  const restInput = document.getElementById('restSecondsInput');
  if (restInput) {
    restInput.value = getRestSeconds();
    restInput.addEventListener('change', (e) => {
      setRestSeconds(Number(e.target.value));
    });
  }

  const exportBtn = document.getElementById('exportJsonBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportDataJson);
  }

  const importInput = document.getElementById('importJsonInput');
  if (importInput) {
    importInput.addEventListener('change', (e) => importDataJson(e, onDataChanged));
  }

  renderRoutinesAdminList(onDataChanged);
}

function renderRoutinesAdminList(onDataChanged) {
  const container = document.getElementById('adminRoutinesContainer');
  if (!container) return;

  container.innerHTML = '';
  const routines = getRoutines();

  routines.forEach(routine => {
    const div = document.createElement('div');
    div.className = 'admin-routine-item';
    div.innerHTML = `
      <span><strong>${routine.name}</strong> (${routine.exercises.length} ejercicios)</span>
      <button class="btn-secondary btn-sm" data-id="${routine.id}">Editar</button>
    `;
    div.querySelector('button').addEventListener('click', () => {
      openRoutineEditor(routine.id, onDataChanged);
    });
    container.appendChild(div);
  });
}

function openRoutineEditor(routineId, onDataChanged) {
  // Modal/Vista simple para la edición de la rutina
  alert(`Editando rutina ID ${routineId}. Proceso de gestión activado.`);
}

function exportDataJson() {
  const data = {
    routines: getRoutines(),
    restSeconds: getRestSeconds(),
    globalHistory: JSON.parse(localStorage.getItem('migym_global_history')) || {},
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `migym_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importDataJson(event, onDataChanged) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.routines) saveRoutines(data.routines);
      if (data.restSeconds) setRestSeconds(data.restSeconds);
      if (data.globalHistory) localStorage.setItem('migym_global_history', JSON.stringify(data.globalHistory));

      alert('¡Datos importados con éxito!');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert('Error al leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
}