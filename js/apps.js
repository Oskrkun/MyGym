const EXERCISES_DB = [
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
  { id: 20, name: "Bicicleta fija", group: "Cardio", images: ["gifs/default.gif"] }
];

const DEFAULT_ROUTINES = [
  { id: 1, name: "Día 1", exercises: [{ exerciseId: 1, sets: 3, reps: 12, weight: "" }, { exerciseId: 2, sets: 3, reps: 12, weight: "" }] },
  { id: 2, name: "Día 2", exercises: [{ exerciseId: 3, sets: 3, reps: 12, weight: "" }, { exerciseId: 4, sets: 3, reps: 12, weight: "" }] }
];

function getExercises() { return EXERCISES_DB; }
function getExerciseById(id) { return EXERCISES_DB.find(ex => ex.id === id); }

function getRoutines() {
  const stored = localStorage.getItem('migym_routines');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('migym_routines', JSON.stringify(DEFAULT_ROUTINES));
  return DEFAULT_ROUTINES;
}

function saveRoutines(routines) { localStorage.setItem('migym_routines', JSON.stringify(routines)); }
function getRestSeconds() { return Number(localStorage.getItem('migym_rest_seconds')) || 60; }
function setRestSeconds(sec) { localStorage.setItem('migym_rest_seconds', String(sec)); }
function getGlobalHistory() { return JSON.parse(localStorage.getItem('migym_global_history')) || {}; }
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
  if (saved) return JSON.parse(saved);
  const routine = getRoutines().find(r => r.id === routineId);
  if (!routine) return null;

  const state = routine.exercises.map(ex => ({
    completed: Array(ex.sets).fill(false),
    collapsed: true,
    weights: Array(ex.sets).fill(''),
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
let state = {};
let restSeconds = getRestSeconds();
let currentMode = 'user';
let editingRoutineIndex = -1;
let tempExercises = [];

const $ = id => document.getElementById(id);

function renderUser() {
  const routines = getRoutines();
  let routine = routines.find(r => r.id === currentRoutineId) || routines[0];
  if (!routine) return;

  $('dayLabel').textContent = routine.name.toUpperCase();
  $('routineTitle').textContent = routine.name;

  state = getDayState(currentRoutineId);
  if (!state) return;

  let totalSets = 0, completedSets = 0;
  $('exerciseList').innerHTML = '';

  routine.exercises.forEach((ex, idx) => {
    const exState = state[idx];
    const exerciseData = getExerciseById(ex.exerciseId);
    if (!exState || !exerciseData) return;

    totalSets += ex.sets;
    completedSets += exState.completed.filter(Boolean).length;

    const imageUrl = (exerciseData.images || ['gifs/default.gif'])[exState.imageIndex || 0];
    const allDone = exState.completed.every(Boolean);
    const isCardio = exerciseData.group === "Cardio" || ex.time;

    const card = document.createElement('article');
    card.className = `exercise-card${exState.collapsed ? ' collapsed' : ''}${allDone ? ' completed-exercise' : ''}`;

    let cardioHtml = isCardio ? `
      <div style="display:flex; gap:12px; margin-top:10px; padding:10px; background:var(--bg); border-radius:10px; flex-wrap:wrap;">
        <div style="flex:1; min-width:110px;">
          <label for="cardioTime_${idx}" style="font-size:11px; color:var(--muted);">Tiempo realizado</label>
          <input type="text" id="cardioTime_${idx}" name="cardioTime_${idx}" class="weight-input cardio-time" data-exercise="${idx}" value="${exState.cardioTime || '15 min'}" style="width:100%; margin-top:4px;" />
        </div>
      </div>` : '';

    card.innerHTML = `
      <div class="exercise-head">
        <div class="exercise-number">${String(idx + 1).padStart(2, '0')}</div>
        <div class="exercise-title">
          <div class="group">${exerciseData.group}</div>
          <h2>${exerciseData.name}</h2>
        </div>
      </div>
      <div class="gif-container"><img src="${imageUrl}" class="exercise-gif" /></div>
      <div class="series-container">
        ${cardioHtml}
        ${exState.completed.map((checked, setIndex) => `
          <div class="set-row ${checked ? 'checked' : ''}" data-exercise="${idx}" data-set="${setIndex}">
            <input type="checkbox" id="check_${idx}_${setIndex}" name="check_${idx}_${setIndex}" ${checked ? 'checked' : ''} aria-label="Serie ${setIndex + 1}">
            <div class="set-info">
              <strong>${isCardio ? 'Sesión' : 'Serie ' + (setIndex + 1)}</strong>
              ${!isCardio ? `<input class="weight-input" id="weight_${idx}_${setIndex}" name="weight_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="Peso" value="${exState.weights[setIndex] || ''}" />` : ''}
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
  const currentRoutine = routines.find(r => r.id === currentRoutineId);
  const currentStateData = getDayState(currentRoutineId);
  const history = getGlobalHistory();
  const todayKey = new Date().getDate();

  history[todayKey] = {
    routineName: currentRoutine ? currentRoutine.name : "Rutina",
    status: isSuccess ? 'completed' : 'incomplete',
    exercises: currentRoutine.exercises.map((ex, idx) => ({
      name: getExerciseById(ex.exerciseId)?.name || "Ejercicio",
      isCardio: !!ex.time,
      cardioTime: currentStateData[idx]?.cardioTime || ex.time,
      weights: currentStateData[idx] ? [...currentStateData[idx].weights] : []
    }))
  };
  saveGlobalHistory(history);

  const currentIndex = routines.findIndex(r => r.id === currentRoutineId);
  currentRoutineId = (currentIndex !== -1 && currentIndex < routines.length - 1) ? routines[currentIndex + 1].id : routines[0].id;
  saveCurrentRoutinePointer(currentRoutineId);
  renderUser();
  renderHeatmap();
}

// Toggle Progreso
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
    $('dayButton').style.display = 'inline-block'; // REMOSTRAR CAMBIAR DÍA
    $('progressToggleBtn').textContent = '📊 Progreso';
    $('modeToggle').style.display = 'inline-block';
    renderUser();
  }
});

// Admin Toggle
$('modeToggle').addEventListener('click', () => {
  if (currentMode === 'user') {
    currentMode = 'admin';
    $('userView').classList.add('hidden');
    $('adminView').classList.remove('hidden');
    $('modeToggle').textContent = '👤 Usuario';
    $('progressToggleBtn').style.display = 'none';
  } else {
    currentMode = 'user';
    $('adminView').classList.add('hidden');
    $('userView').classList.remove('hidden');
    $('modeToggle').textContent = '⚙️ Admin';
    $('progressToggleBtn').style.display = 'inline-block';
    renderUser();
  }
});

// Exportar e Importar JSON Completo (Incluye Peso y Perfil)
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
      Object.keys(data).forEach(k => localStorage.setItem(k, JSON.stringify(data[k])));
      alert("¡Datos importados con éxito!");
      window.location.reload();
    } catch (err) {
      alert("Error al importar el archivo JSON.");
    }
  };
  reader.readAsText(file);
});

// Modal Selección Día
$('dayButton').addEventListener('click', () => {
  $('dayOptions').innerHTML = getRoutines().map(r => `<button type="button" onclick="selectDay(${r.id})">${r.name}</button>`).join('');
  $('dayModal').classList.remove('hidden');
});
function selectDay(id) {
  currentRoutineId = id;
  saveCurrentRoutinePointer(id);
  renderUser();
  $('dayModal').classList.add('hidden');
}
$('closeModal').addEventListener('click', () => $('dayModal').classList.add('hidden'));

// Inicialización
function init() {
  renderUser();
}
init();