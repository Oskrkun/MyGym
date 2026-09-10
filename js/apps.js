const DEFAULT_EXERCISES = [
  { id: 1, name: "Pecho plano c/barra", group: "Pecho", images: ["gifs/pecho plano con barra.gif"] },
  { id: 2, name: "Pecho inclinado c/máquina", group: "Pecho", images: ["gifs/pecho inclinado con maquina.gif"] },
  { id: 3, name: "Jalón dorsal T. abierto", group: "Espalda", images: ["gifs/jalon dorsal t. abierto.gif"] },
  { id: 4, name: "Plaq espalda", group: "Espalda", images: ["gifs/maquina espalda.gif"] },
  { id: 5, name: "Camilla cuádriceps", group: "Piernas", images: ["gifs/camilla cuadriceps.gif"] },
  { id: 6, name: "Camilla isquio", group: "Piernas", images: ["gifs/camilla isquio.gif"] },
  { id: 7, name: "Prensa + gemelos", group: "Piernas", images: ["gifs/press pierna.jpg"] },
  { id: 8, name: "Extensiones", group: "Piernas", images: ["gifs/camilla cuadriceps.gif"] },
  { id: 9, name: "Posterior hombros", group: "Hombros", images: ["gifs/posterior hombros 01.gif"] },
  { id: 10, name: "Tríceps P. alta barra", group: "Tríceps", images: ["gifs/triceps parte alta barra 01.gif"] },
  { id: 11, name: "Tríceps patada burro", group: "Tríceps", images: ["gifs/triceps patada burro 01.gif"] },
  { id: 12, name: "Bíceps P. bajo c/barra", group: "Bíceps", images: ["gifs/biceps parte baja con barra 01.gif"] },
  { id: 13, name: "Hack frontal", group: "Piernas", images: ["gifs/hack frontal 01.gif"] },
  { id: 14, name: "Hip thrust", group: "Glúteos", images: ["gifs/hip thrust 01.gif"] },
  { id: 15, name: "Polea c/barra V y P. alto", group: "Espalda", images: ["gifs/pullover en polea alta 01.gif"] },
  { id: 16, name: "Semiflexo c/máquina", group: "Piernas", images: ["gifs/camilla isquio.gif"] },
  { id: 17, name: "Apertura c/poleas", group: "Pecho", images: ["gifs/apertura con poleas 01.gif"] },
  { id: 18, name: "Bíceps martillo", group: "Bíceps", images: ["gifs/biceps martillo.gif"] },
  { id: 19, name: "Caminadora (Cardio)", group: "Cardio", images: ["gifs/Caminadora (Cardio).gif"] },
  { id: 20, name: "Bicicleta fija", group: "Cardio", images: ["gifs/default.gif"] },
  { id: 21, name: "Serrucho c/mancuerna", group: "Espalda", images: ["gifs/default.gif"] },
  { id: 22, name: "Pullover en polea alta", group: "Espalda", images: ["gifs/pullover en polea alta 01.gif"] }
];

const DEFAULT_ROUTINES = [
  { id: 1, name: "Dia 1", exercises: [{ exerciseId: 19, sets: 1, reps: 0, time: "20", weight: "", speed: 6, incline: 6 }, { exerciseId: 1, sets: 4, reps: 12, weight: "10" }] },
  { id: 2, name: "Dia 2", exercises: [{ exerciseId: 19, sets: 1, reps: 0, time: "20", weight: "", speed: 6, incline: 6 }, { exerciseId: 7, sets: 4, reps: 12, weight: "40" }] }
];

const $ = id => document.getElementById(id);

function getExercises() {
  const stored = localStorage.getItem('migym_exercises');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return DEFAULT_EXERCISES;
}

function getExerciseById(id) {
  const list = getExercises();
  return list.find(ex => String(ex.id) === String(id)) || { id, name: "Ejercicio " + id, group: "General", images: ["gifs/default.gif"] };
}

function getRoutines() {
  const stored = localStorage.getItem('migym_routines');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return DEFAULT_ROUTINES;
}

function saveRoutines(routines) { localStorage.setItem('migym_routines', JSON.stringify(routines)); }

function getRestSeconds() { 
  const val = localStorage.getItem('migym_rest_seconds');
  return val !== null ? Number(val) : 60; 
}
function setRestSeconds(sec) { localStorage.setItem('migym_rest_seconds', String(sec)); }

function getGlobalHistory() { 
  try { return JSON.parse(localStorage.getItem('migym_global_history')) || {}; } 
  catch(e) { return {}; } 
}
function saveGlobalHistory(history) { localStorage.setItem('migym_global_history', JSON.stringify(history)); }

function getCurrentRoutinePointer() {
  const ptr = localStorage.getItem('migym_routine_pointer');
  if (ptr !== null) return Number(ptr);
  const routines = getRoutines();
  return routines.length > 0 ? routines[0].id : 1;
}
function saveCurrentRoutinePointer(id) { localStorage.setItem('migym_routine_pointer', String(id)); }

function getDayState(routineId) {
  const saved = localStorage.getItem(`migym_state_${routineId}`);
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  const routine = getRoutines().find(r => String(r.id) === String(routineId));
  if (!routine) return [];

  const state = routine.exercises.map(ex => ({
    completed: Array(ex.sets || 1).fill(false),
    collapsed: true,
    weights: Array(ex.sets || 1).fill(''),
    cardioTime: ex.time || '15 min',
    speed: ex.speed || 0,
    incline: ex.incline || 0,
    imageIndex: 0
  }));
  saveDayState(routineId, state);
  return state;
}

function saveDayState(routineId, state) { localStorage.setItem(`migym_state_${routineId}`, JSON.stringify(state)); }

let currentRoutineId = getCurrentRoutinePointer();
let state = [];
let restSeconds = getRestSeconds();
let currentMode = 'user';
let tempExercises = [];

// RENDER USUARIO
function renderUser() {
  const routines = getRoutines();
  let routine = routines.find(r => String(r.id) === String(currentRoutineId)) || routines[0];
  if (!routine) return;

  currentRoutineId = routine.id;
  $('dayLabel').textContent = routine.name.toUpperCase();
  $('routineTitle').textContent = routine.name;

  state = getDayState(currentRoutineId);
  if (!state) return;

  let totalSets = 0, completedSets = 0;
  $('exerciseList').innerHTML = '';

  routine.exercises.forEach((ex, idx) => {
    const exState = state[idx] || { completed: [false], collapsed: true, weights: [''] };
    const exerciseData = getExerciseById(ex.exerciseId);

    const setsCount = ex.sets || (exState.completed ? exState.completed.length : 1);
    totalSets += setsCount;
    completedSets += exState.completed ? exState.completed.filter(Boolean).length : 0;

    const imageUrl = (exerciseData.images && exerciseData.images.length > 0) ? 
      (exerciseData.images[exState.imageIndex || 0].startsWith('gifs/') ? exerciseData.images[exState.imageIndex || 0] : 'gifs/' + exerciseData.images[exState.imageIndex || 0]) 
      : 'gifs/default.gif';

    const allDone = exState.completed && exState.completed.length > 0 && exState.completed.every(Boolean);
    const isCardio = exerciseData.group === "Cardio" || ex.time;

    const card = document.createElement('article');
    card.className = `exercise-card${exState.collapsed ? ' collapsed' : ''}${allDone ? ' completed-exercise' : ''}`;

    let cardioHtml = isCardio ? `
      <div style="display:flex; gap:12px; margin-top:10px; padding:10px; background:var(--bg); border-radius:10px; flex-wrap:wrap;">
        <div style="flex:1; min-width:110px;">
          <label for="cardioTime_${idx}" style="font-size:11px; color:var(--muted);">Tiempo realizado</label>
          <input type="text" id="cardioTime_${idx}" name="cardioTime_${idx}" class="weight-input cardio-time" data-exercise="${idx}" value="${exState.cardioTime || ex.time || '15 min'}" style="width:100%; margin-top:4px;" />
        </div>
      </div>` : '';

    card.innerHTML = `
      <div class="exercise-head">
        <div class="exercise-number">${String(idx + 1).padStart(2, '0')}</div>
        <div class="exercise-title">
          <div class="group">${exerciseData.group || 'General'}</div>
          <h2>${exerciseData.name}</h2>
        </div>
      </div>
      <div class="gif-container"><img src="${imageUrl}" class="exercise-gif" alt="${exerciseData.name}" /></div>
      <div class="series-container">
        ${cardioHtml}
        ${(exState.completed || [false]).map((checked, setIndex) => `
          <div class="set-row ${checked ? 'checked' : ''}" data-exercise="${idx}" data-set="${setIndex}">
            <input type="checkbox" id="check_${idx}_${setIndex}" name="check_${idx}_${setIndex}" ${checked ? 'checked' : ''} aria-label="Serie ${setIndex + 1}">
            <div class="set-info" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
              <strong>${isCardio ? 'Sesión Completada' : 'Serie ' + (setIndex + 1)}</strong>
              ${!isCardio ? `<input class="weight-input" id="weight_${idx}_${setIndex}" name="weight_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="Peso (kg)" value="${(exState.weights && exState.weights[setIndex]) || ''}" style="width:90px; text-align:center;" />` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="exercise-actions"><button type="button" class="collapse-button" data-collapse="${idx}">${exState.collapsed ? 'Expandir ↑' : 'Contraer ↓'}</button></div>
    `;
    $('exerciseList').appendChild(card);
  });

  $('progressPercent').textContent = (totalSets ? Math.round((completedSets / totalSets) * 100) : 0) + '%';

  // Event Listeners dinámicos
  $('exerciseList').querySelectorAll('.set-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('weight-input')) return;
      const exIdx = Number(row.dataset.exercise);
      const setIdx = Number(row.dataset.set);
      state[exIdx].completed[setIdx] = !state[exIdx].completed[setIdx];
      saveDayState(currentRoutineId, state);
      if (state[exIdx].completed[setIdx]) startTimer(restSeconds);
      renderUser();
    });
  });

  $('exerciseList').querySelectorAll('.weight-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const exIdx = Number(e.target.dataset.exercise);
      if (e.target.classList.contains('cardio-time')) {
        state[exIdx].cardioTime = e.target.value;
      } else {
        if (!state[exIdx].weights) state[exIdx].weights = [];
        state[exIdx].weights[Number(e.target.dataset.set)] = e.target.value;
      }
      saveDayState(currentRoutineId, state);
    });
  });

  $('exerciseList').querySelectorAll('.collapse-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.collapse);
      state[idx].collapsed = !state[idx].collapsed;
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });
}

function completeRoutineAndAdvance(isSuccess) {
  const routines = getRoutines();
  const currentRoutine = routines.find(r => String(r.id) === String(currentRoutineId));
  const currentStateData = getDayState(currentRoutineId);
  const history = getGlobalHistory();
  const todayKey = new Date().getDate();

  history[todayKey] = {
    routineName: currentRoutine ? currentRoutine.name : "Rutina",
    status: isSuccess ? 'completed' : 'incomplete',
    exercises: currentRoutine ? currentRoutine.exercises.map((ex, idx) => ({
      name: getExerciseById(ex.exerciseId)?.name || "Ejercicio",
      isCardio: !!ex.time,
      cardioTime: currentStateData[idx]?.cardioTime || ex.time,
      weights: currentStateData[idx] ? [...(currentStateData[idx].weights || [])] : []
    })) : []
  };
  saveGlobalHistory(history);

  const currentIndex = routines.findIndex(r => String(r.id) === String(currentRoutineId));
  currentRoutineId = (currentIndex !== -1 && currentIndex < routines.length - 1) ? routines[currentIndex + 1].id : routines[0].id;
  saveCurrentRoutinePointer(currentRoutineId);
  renderUser();
  renderHeatmap();
}

// MODO ADMIN Y FORMULARIO DE RUTINAS
function renderAdmin() {
  $('restInput').value = restSeconds;
  
  // Renderizar select de ejercicios
  const exercises = getExercises();
  $('exerciseSelector').innerHTML = exercises.map(ex => `<option value="${ex.id}">${ex.name} (${ex.group})</option>`).join('');

  // Renderizar lista de rutinas creadas
  const routines = getRoutines();
  const listContainer = $('routineListAdmin');
  listContainer.innerHTML = '';

  routines.forEach((r) => {
    const card = document.createElement('div');
    card.style.cssText = "background:var(--card); padding:12px; border-radius:10px; border:1px solid var(--line); display:flex; justify-content:space-between; align-items:center;";
    card.innerHTML = `
      <div>
        <strong style="color:#fff; display:block;">${r.name}</strong>
        <small style="color:var(--muted);">${r.exercises.length} Ejercicios</small>
      </div>
      <button type="button" class="day-button" style="background:#e63946; padding:6px 12px; font-size:12px;" onclick="deleteRoutine(${r.id})">Eliminar</button>
    `;
    listContainer.appendChild(card);
  });
}

function deleteRoutine(id) {
  let routines = getRoutines();
  if (routines.length <= 1) return alert("Debes mantener al menos una rutina creada.");
  routines = routines.filter(r => String(r.id) !== String(id));
  saveRoutines(routines);
  if (String(currentRoutineId) === String(id)) {
    currentRoutineId = routines[0].id;
    saveCurrentRoutinePointer(currentRoutineId);
  }
  renderAdmin();
}

$('saveRest').addEventListener('click', () => {
  const val = Number($('restInput').value);
  if (val >= 0) {
    restSeconds = val;
    setRestSeconds(val);
    alert('Tiempo de descanso guardado correctamente');
  }
});

$('addRoutineBtn').addEventListener('click', () => {
  tempExercises = [];
  $('routineName').value = '';
  renderTempExercises();
  $('routineForm').classList.remove('hidden');
});

$('addExerciseBtn').addEventListener('click', () => {
  const exId = $('exerciseSelector').value;
  if (!exId) return;
  tempExercises.push({ exerciseId: exId, sets: 4, reps: 12, weight: "" });
  renderTempExercises();
});

function renderTempExercises() {
  const container = $('routineExercisesList');
  container.innerHTML = tempExercises.map((item, idx) => {
    const ex = getExerciseById(item.exerciseId);
    return `
      <div style="background:var(--bg); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; font-size:13px;">
        <span>${ex.name}</span>
        <button type="button" onclick="removeTempEx(${idx})" style="background:none; border:none; color:#e63946; cursor:pointer;">✕</button>
      </div>
    `;
  }).join('');
}

function removeTempEx(idx) {
  tempExercises.splice(idx, 1);
  renderTempExercises();
}

$('cancelRoutine').addEventListener('click', () => $('routineForm').classList.add('hidden'));

$('submitRoutine').addEventListener('click', () => {
  const name = $('routineName').value.trim();
  if (!name) return alert('Ingresá un nombre para la rutina');
  if (tempExercises.length === 0) return alert('Agregá al menos un ejercicio');

  const routines = getRoutines();
  const newRoutine = {
    id: Date.now(),
    name: name,
    exercises: tempExercises
  };
  routines.push(newRoutine);
  saveRoutines(routines);
  $('routineForm').classList.add('hidden');
  renderAdmin();
});

// TOGGLE VISTAS Y BOTONES
let showingProgress = false;

$('progressToggleBtn').addEventListener('click', () => {
  showingProgress = !showingProgress;
  if (showingProgress) {
    $('userView').classList.add('hidden');
    $('adminView').classList.add('hidden');
    $('progressView').classList.remove('hidden');
    $('dayButton').style.display = 'none'; // OCULTAR CAMBIAR DÍA
    $('progressToggleBtn').textContent = '🏋️ Rutina';
    $('modeToggle').style.display = 'none';
    initProfileUI();
    renderWeightHistory();
    renderHeatmap();
  } else {
    $('progressView').classList.add('hidden');
    $('userView').classList.remove('hidden');
    $('dayButton').style.display = 'inline-block'; // MOSTRAR CAMBIAR DÍA
    $('progressToggleBtn').textContent = '📊 Progreso';
    $('modeToggle').style.display = 'inline-block';
    renderUser();
  }
});

$('modeToggle').addEventListener('click', () => {
  if (currentMode === 'user') {
    currentMode = 'admin';
    $('userView').classList.add('hidden');
    $('adminView').classList.remove('hidden');
    $('dayButton').style.display = 'none'; // OCULTAR CAMBIAR DÍA EN ADMIN
    $('modeToggle').textContent = '👤 Usuario';
    $('progressToggleBtn').style.display = 'none';
    renderAdmin();
  } else {
    currentMode = 'user';
    $('adminView').classList.add('hidden');
    $('userView').classList.remove('hidden');
    $('dayButton').style.display = 'inline-block'; // MOSTRAR CAMBIAR DÍA EN USUARIO
    $('modeToggle').textContent = '⚙️ Admin';
    $('progressToggleBtn').style.display = 'inline-block';
    renderUser();
  }
});

// RESPALDO JSON
$('btnExportar').addEventListener('click', () => {
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    backup[key] = JSON.parse(localStorage.getItem(key));
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `migym_respaldo_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
});

$('btnImportar').addEventListener('click', () => $('inputImportar').click());
$('inputImportar').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      localStorage.clear();
      Object.keys(data).forEach(k => localStorage.setItem(k, typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k])));
      alert("¡Datos cargados con éxito!");
      window.location.reload();
    } catch (err) {
      alert("Error al importar el archivo JSON.");
    }
  };
  reader.readAsText(file);
});

// MODAL CAMBIAR DÍA
$('dayButton').addEventListener('click', () => {
  $('dayOptions').innerHTML = getRoutines().map(r => `<button type="button" class="day-button" style="width:100%; margin-bottom:8px;" onclick="selectDay(${r.id})">${r.name}</button>`).join('');
  $('dayModal').classList.remove('hidden');
});

function selectDay(id) {
  currentRoutineId = id;
  saveCurrentRoutinePointer(id);
  renderUser();
  $('dayModal').classList.add('hidden');
}

$('closeModal').addEventListener('click', () => $('dayModal').classList.add('hidden'));

// INICIALIZACIÓN
function init() {
  renderUser();
}
init();