// ==========================================
// admin.js — Panel de administración + Backup JSON
// Depende de: core.js
// ==========================================

// ==========================================
// 1. VARIABLES DE ESTADO
// ==========================================

let editingRoutineIndex = -1;
let tempExercises = [];


// ==========================================
// 2. REFS DOM
// ==========================================

const routineListAdmin     = $('routineListAdmin');
const routineForm          = $('routineForm');
const formTitle            = $('formTitle');
const routineName          = $('routineName');
const exerciseSelector     = $('exerciseSelector');
const addExerciseBtn       = $('addExerciseBtn');
const routineExercisesList = $('routineExercisesList');
const submitRoutine        = $('submitRoutine');
const cancelRoutine        = $('cancelRoutine');
const addRoutineBtn        = $('addRoutineBtn');

const restInput = $('restInput');
const saveRest  = $('saveRest');

const btnExportar   = $('btnExportar');
const btnImportar   = $('btnImportar');
const inputImportar = $('inputImportar');


// ==========================================
// 3. LISTADO Y CRUD DE RUTINAS
// ==========================================

function renderAdminRoutines() {
  const routines = getRoutines();
  routineListAdmin.innerHTML = '';
  routines.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'admin-item';
    const exerciseNames = (r.exercises || []).map(ex => {
      const exData = getExerciseById(ex.exerciseId);
      return exData ? `${exData.name}` : '❌';
    }).join(', ');

    div.innerHTML = `
      <div>
        <strong>${r.name}</strong>
        <div class="exercise-list-small">${exerciseNames}</div>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="edit-routine-btn" data-idx="${idx}">Editar</button>
        <button type="button" class="delete-routine-btn" data-idx="${idx}">Eliminar</button>
      </div>
    `;
    routineListAdmin.appendChild(div);
  });

  routineListAdmin.querySelectorAll('.edit-routine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openRoutineForm(Number(btn.dataset.idx));
    });
  });

  routineListAdmin.querySelectorAll('.delete-routine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const currentRoutines = getRoutines();
      if (confirm(`¿Eliminar rutina "${currentRoutines[idx].name}"?`)) {
        currentRoutines.splice(idx, 1);
        saveRoutines(currentRoutines);
        renderAdminRoutines();

        // Reset pointer a la primera rutina disponible
        const newPointer = currentRoutines.length > 0 ? currentRoutines[0].id : 1;
        saveCurrentRoutinePointer(newPointer);

        // Si routine.js está cargado, re-renderizamos la vista usuario
        if (typeof window.refreshRoutineView === 'function') {
          window.refreshRoutineView();
        }
      }
    });
  });
}

function openRoutineForm(idx = -1) {
  editingRoutineIndex = idx;
  tempExercises = [];
  routineForm.classList.remove('hidden');

  const routines = getRoutines();
  if (idx >= 0 && idx < routines.length) {
    const r = routines[idx];
    routineName.value = r.name;
    tempExercises = r.exercises.map(ex => ({ ...ex }));
    formTitle.textContent = 'Editar rutina';
  } else {
    routineName.value = '';
    formTitle.textContent = 'Nueva rutina';
  }
  renderTempExercises();
  populateExerciseSelector();
}

function populateExerciseSelector() {
  exerciseSelector.innerHTML = '<option value="">Seleccionar ejercicio...</option>';
  getExercises().forEach(ex => {
    const option = document.createElement('option');
    option.value = ex.id;
    option.textContent = `${ex.name} (${ex.group})`;
    exerciseSelector.appendChild(option);
  });
}

function renderTempExercises() {
  routineExercisesList.innerHTML = '';
  if (tempExercises.length === 0) {
    routineExercisesList.innerHTML = '<p style="color:var(--muted);font-size:14px;">No hay ejercicios agregados.</p>';
    return;
  }
  tempExercises.forEach((ex, idx) => {
    const exData = getExerciseById(ex.exerciseId);
    if (!exData) return;
    const desc = ex.time ? `Cardio: ${ex.time}` : `${ex.sets} series · ${ex.reps} reps`;
    const div = document.createElement('div');
    div.className = 'routine-exercise-item';
    div.innerHTML = `
      <span style="flex:1;"><strong>${exData.name}</strong> · ${desc}</span>
      <button type="button" class="action-btn-small move-up" data-idx="${idx}">▲</button>
      <button type="button" class="action-btn-small move-down" data-idx="${idx}">▼</button>
      <button type="button" class="remove-exercise" data-idx="${idx}">✕</button>
    `;
    routineExercisesList.appendChild(div);
  });

  routineExercisesList.querySelectorAll('.move-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (idx > 0) {
        const item = tempExercises.splice(idx, 1)[0];
        tempExercises.splice(idx - 1, 0, item);
        renderTempExercises();
      }
    });
  });

  routineExercisesList.querySelectorAll('.move-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (idx < tempExercises.length - 1) {
        const item = tempExercises.splice(idx, 1)[0];
        tempExercises.splice(idx + 1, 0, item);
        renderTempExercises();
      }
    });
  });

  routineExercisesList.querySelectorAll('.remove-exercise').forEach(btn => {
    btn.addEventListener('click', () => {
      tempExercises.splice(Number(btn.dataset.idx), 1);
      renderTempExercises();
    });
  });
}

function addExerciseToRoutine() {
  const exerciseId = Number(exerciseSelector.value);
  if (!exerciseId) return alert('Seleccioná un ejercicio');

  const exerciseData = getExerciseById(exerciseId);
  const isCardio = exerciseData && exerciseData.group === "Cardio";

  if (isCardio) {
    const time = prompt('Duración (ej: 15 min):', '15 min');
    if (!time) return;
    const speed = Number(prompt('Velocidad sugerida:', 10)) || 0;
    const incline = Number(prompt('Inclinación sugerida:', 0)) || 0;
    tempExercises.push({ exerciseId, sets: 1, reps: 0, time, weight: '', speed, incline });
  } else {
    const sets = Number(prompt('Cantidad de series:', 3));
    if (!sets || sets < 1) return alert('Ingresá un número válido de series');
    const reps = Number(prompt('Cantidad de repeticiones:', 12));
    if (!reps || reps < 1) return alert('Ingresá un número válido de repeticiones');
    const weight = prompt('Peso recomendado (kg) - opcional:', '');
    tempExercises.push({ exerciseId, sets, reps, weight: weight || '' });
  }
  renderTempExercises();
}

addExerciseBtn.addEventListener('click', addExerciseToRoutine);

submitRoutine.addEventListener('click', () => {
  const name = routineName.value.trim();
  if (!name) return alert('Ingresá un nombre para la rutina');
  if (tempExercises.length === 0) return alert('Agregá al menos un ejercicio');

  const routines = getRoutines();
  if (editingRoutineIndex >= 0 && editingRoutineIndex < routines.length) {
    routines[editingRoutineIndex] = { ...routines[editingRoutineIndex], name, exercises: tempExercises.map(ex => ({ ...ex })) };
  } else {
    const newId = routines.length > 0 ? Math.max(...routines.map(r => r.id)) + 1 : 1;
    routines.push({ id: newId, name, exercises: tempExercises.map(ex => ({ ...ex })) });
  }
  saveRoutines(routines);
  renderAdminRoutines();
  routineForm.classList.add('hidden');

  // Reset pointer a la primera rutina disponible
  const newPointer = routines.length > 0 ? routines[0].id : 1;
  saveCurrentRoutinePointer(newPointer);

  if (typeof window.refreshRoutineView === 'function') {
    window.refreshRoutineView();
  }
});

cancelRoutine.addEventListener('click', () => { routineForm.classList.add('hidden'); });
addRoutineBtn.addEventListener('click', () => openRoutineForm());


// ==========================================
// 4. TIEMPO DE DESCANSO
// ==========================================

restInput.value = getRestSeconds();
saveRest.addEventListener('click', () => {
  const sec = Number(restInput.value);
  if (sec > 0) {
    setRestSeconds(sec);
    // Actualizamos la variable del módulo routine.js si está cargado
    if (typeof window.updateRestSeconds === 'function') {
      window.updateRestSeconds(sec);
    }
    alert('Tiempo de descanso actualizado');
  }
});


// ==========================================
// 5. EXPORT / IMPORT JSON
// ==========================================

btnExportar.addEventListener('click', () => {
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    backup[key] = JSON.parse(localStorage.getItem(key));
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const fecha = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute("download", `migym_respaldo_${fecha}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

btnImportar.addEventListener('click', () => inputImportar.click());

inputImportar.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm("¿Deseas restaurar esta copia de seguridad? Se reemplazarán tus rutinas e historial actuales.")) {
        localStorage.clear();
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, JSON.stringify(data[key]));
        });
        alert("¡Datos cargados con éxito!");
        window.location.reload();
      }
    } catch (err) {
      alert("Error al leer el archivo JSON. Verifica que sea un respaldo válido.");
    }
  };
  reader.readAsText(file);
});


// ==========================================
// 6. API PÚBLICA
// ==========================================

window.renderAdminRoutines = renderAdminRoutines;