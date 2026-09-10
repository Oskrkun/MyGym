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
  { id: 20, name: "Bicicleta fija", group: "Cardio", images: ["gifs/default.gif"] },
  { id: 21, name: "Serrucho c/mancuerna", group: "Bíceps", images: ["gifs/default.gif"] },
  { id: 22, name: "Pullover en polea alta", group: "Espalda", images: ["gifs/default.gif"] },
  { id: 23, name: "Hip Thrust", group: "Piernas", images: ["gifs/default.gif"] }
];

const DEFAULT_ROUTINES = [
  { id: 1, name: "Día 1", exercises: [{ exerciseId: 1, sets: 3, reps: 12, weight: "" }, { exerciseId: 2, sets: 3, reps: 12, weight: "" }] },
  { id: 2, name: "Día 2", exercises: [{ exerciseId: 3, sets: 3, reps: 12, weight: "" }, { exerciseId: 4, sets: 3, reps: 12, weight: "" }] },
  { id: 3, name: "Día 3", exercises: [{ exerciseId: 5, sets: 3, reps: 12, weight: "" }, { exerciseId: 6, sets: 3, reps: 12, weight: "" }] },
  { id: 4, name: "Día 4", exercises: [{ exerciseId: 9, sets: 3, reps: 12, weight: "" }, { exerciseId: 10, sets: 3, reps: 12, weight: "" }] },
  { id: 5, name: "Día 5", exercises: [{ exerciseId: 12, sets: 3, reps: 12, weight: "" }, { exerciseId: 14, sets: 3, reps: 12, weight: "" }] },
  { id: 6, name: "Día 6", exercises: [{ exerciseId: 19, sets: 1, reps: 0, time: "20 min", weight: "", speed: 8, incline: 2 }] }
];

const DEFAULT_REST_SECONDS = 60;

function getExercises() { return EXERCISES_DB; }
function getExerciseById(id) { return EXERCISES_DB.find(ex => ex.id === id); }

function getRoutines() {
  const stored = localStorage.getItem('migym_routines');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('migym_routines', JSON.stringify(DEFAULT_ROUTINES));
  return DEFAULT_ROUTINES;
}

function saveRoutines(routines) {
  localStorage.setItem('migym_routines', JSON.stringify(routines));
}

function getRestSeconds() {
  const stored = localStorage.getItem('migym_rest_seconds');
  return stored ? Number(stored) : DEFAULT_REST_SECONDS;
}

function setRestSeconds(sec) {
  localStorage.setItem('migym_rest_seconds', String(sec));
}

function getGlobalHistory() {
  return JSON.parse(localStorage.getItem('migym_global_history')) || {};
}

function saveGlobalHistory(history) {
  localStorage.setItem('migym_global_history', JSON.stringify(history));
}

function getCurrentRoutinePointer() {
  const ptr = localStorage.getItem('migym_routine_pointer');
  if (ptr !== null) return Number(ptr);
  const routines = getRoutines();
  return routines.length > 0 ? routines[0].id : 1;
}

function saveCurrentRoutinePointer(id) {
  localStorage.setItem('migym_routine_pointer', String(id));
}

function getDayState(routineId) {
  const key = `migym_state_${routineId}`;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  
  const routines = getRoutines();
  const routine = routines.find(r => r.id === routineId);
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

function saveDayState(routineId, state) {
  localStorage.setItem(`migym_state_${routineId}`, JSON.stringify(state));
}

let currentRoutineId = getCurrentRoutinePointer();
let state = {};
let timerInterval = null;
let remaining = 0;
let paused = false;
let restSeconds = getRestSeconds();
let currentMode = 'user';
let editingRoutineIndex = -1;
let tempExercises = [];

const $ = id => document.getElementById(id);
const dayLabel = $('dayLabel');
const routineTitle = $('routineTitle');
const exerciseList = $('exerciseList');
const progressPercent = $('progressPercent');
const finishCard = $('finishCard');
const resetButton = $('resetButton');
const dayButton = $('dayButton');
const dayModal = $('dayModal');
const dayOptions = $('dayOptions');
const closeModal = $('closeModal');
const historyModal = $('historyModal');
const historyModalTitle = $('historyModalTitle');
const historyModalContent = $('historyModalContent');
const closeHistoryModal = $('closeHistoryModal');

const timerOverlay = $('timerOverlay');
const timerValue = $('timerValue');
const timerMessage = $('timerMessage');
const pauseTimer = $('pauseTimer');
const addTime = $('addTime');
const skipTimer = $('skipTimer');
const modeToggle = $('modeToggle');
const userView = $('userView');
const adminView = $('adminView');
const progressView = $('progressView');
const progressToggleBtn = $('progressToggleBtn');
const routineListAdmin = $('routineListAdmin');
const restInput = $('restInput');
const saveRest = $('saveRest');
const addRoutineBtn = $('addRoutineBtn');
const routineForm = $('routineForm');
const formTitle = $('formTitle');
const routineName = $('routineName');
const exerciseSelector = $('exerciseSelector');
const addExerciseBtn = $('addExerciseBtn');
const routineExercisesList = $('routineExercisesList');
const submitRoutine = $('submitRoutine');
const cancelRoutine = $('cancelRoutine');
const btnExportar = $('btnExportar');
const btnImportar = $('btnImportar');
const inputImportar = $('inputImportar');

function renderUser() {
  const routines = getRoutines();
  let routine = routines.find(r => r.id === currentRoutineId);
  
  if (!routine) {
    currentRoutineId = routines.length > 0 ? routines[0].id : 1;
    saveCurrentRoutinePointer(currentRoutineId);
    routine = routines[0];
  }

  if (!routine) {
    exerciseList.innerHTML = '<p style="color:var(--muted);text-align:center;">No hay rutinas creadas. Entra en Admin para crear una.</p>';
    return;
  }

  dayLabel.textContent = routine.name.toUpperCase();
  routineTitle.textContent = routine.name;

  state = getDayState(currentRoutineId);
  if (!state) return;

  let totalSets = 0, completedSets = 0;
  exerciseList.innerHTML = '';

  routine.exercises.forEach((ex, idx) => {
    const exState = state[idx];
    if (!exState) return;
    const exerciseData = getExerciseById(ex.exerciseId);
    if (!exerciseData) return;

    totalSets += ex.sets;
    completedSets += exState.completed.filter(Boolean).length;

    const images = exerciseData.images || ['gifs/default.gif'];
    const currentImageIndex = exState.imageIndex || 0;
    const imageUrl = images[currentImageIndex] || 'gifs/default.gif';
    const allDone = exState.completed.every(Boolean);
    const isCardio = exerciseData.group === "Cardio" || ex.time;

    const card = document.createElement('article');
    card.className = `exercise-card${exState.collapsed ? ' collapsed' : ''}${allDone ? ' completed-exercise' : ''}`;
    card.dataset.exerciseIndex = idx;

    const showImageBtn = images.length > 1;
    const subtitleText = isCardio ? `Duración: ${exState.cardioTime || ex.time || '15 min'}` : `${ex.sets} series · ${ex.reps} repeticiones`;

    let cardioHtml = '';
    if (isCardio) {
      cardioHtml = `
        <div style="display:flex; gap:12px; margin-top:10px; padding:10px; background:var(--bg); border-radius:10px; flex-wrap:wrap;">
          <div style="flex:1; min-width:110px;">
            <label for="cardioTime_${idx}" style="font-size:11px; color:var(--muted);">Tiempo realizado</label>
            <input type="text" id="cardioTime_${idx}" name="cardioTime_${idx}" class="weight-input cardio-time" data-exercise="${idx}" value="${exState.cardioTime || ex.time || '15 min'}" placeholder="0 min" style="width:100%; margin-top:4px;" />
          </div>
          <div style="flex:1; min-width:90px;">
            <label for="cardioSpeed_${idx}" style="font-size:11px; color:var(--muted);">Velocidad</label>
            <input type="number" id="cardioSpeed_${idx}" name="cardioSpeed_${idx}" class="weight-input cardio-speed" data-exercise="${idx}" value="${exState.speed || 0}" style="width:100%; margin-top:4px;" />
          </div>
          <div style="flex:1; min-width:90px;">
            <label for="cardioIncline_${idx}" style="font-size:11px; color:var(--muted);">Inclinación</label>
            <input type="number" id="cardioIncline_${idx}" name="cardioIncline_${idx}" class="weight-input cardio-incline" data-exercise="${idx}" value="${exState.incline || 0}" style="width:100%; margin-top:4px;" />
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="exercise-head">
        <div class="exercise-number">${String(idx + 1).padStart(2, '0')}</div>
        <div class="exercise-title">
          <div class="group">${exerciseData.group}</div>
          <h2>${exerciseData.name}</h2>
          <p>${subtitleText}</p>
        </div>
        <div class="exercise-status ${allDone ? 'done' : ''}">${allDone ? '✓' : ''}</div>
      </div>

      <div class="gif-container">
        <img src="${imageUrl}" alt="${exerciseData.name}" class="exercise-gif" onerror="this.src='gifs/default.gif'" />
        ${showImageBtn ? `<button type="button" class="change-image-btn" data-exercise="${idx}" aria-label="Cambiar imagen">⇄</button>` : ''}
      </div>

      <div class="series-container">
        ${cardioHtml}
        ${exState.completed.map((checked, setIndex) => `
          <div class="set-row ${checked ? 'checked' : ''}" data-exercise="${idx}" data-set="${setIndex}">
            <input type="checkbox" id="check_${idx}_${setIndex}" name="check_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" ${checked ? 'checked' : ''} aria-label="Marcar serie ${setIndex + 1}">
            <span class="fake-check">✓</span>
            <div class="set-info">
              <strong>${isCardio ? 'Completar sesión' : 'Serie ' + (setIndex + 1)}</strong>
              <small>${isCardio ? 'Tiempo objetivo: ' + (ex.time || '15 min') : ex.reps + ' repeticiones'}</small>
              ${!isCardio ? `<input class="weight-input" id="weight_${idx}_${setIndex}" name="weight_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="Peso (kg)" value="${exState.weights[setIndex] || ''}" aria-label="Peso para serie ${setIndex + 1}" />` : ''}
            </div>
            <span class="set-state">${checked ? 'COMPLETADA' : 'PENDIENTE'}</span>
          </div>
        `).join('')}
      </div>

      <div class="exercise-actions">
        <button type="button" class="collapse-button" data-collapse="${idx}">
          ${exState.collapsed ? 'Expandir series ↑' : 'Contraer y seguir ↓'}
        </button>
      </div>
    `;

    exerciseList.appendChild(card);
  });

  const percent = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  progressPercent.textContent = percent + '%';
  finishCard.classList.toggle('hidden', percent !== 100);

  exerciseList.querySelectorAll('.set-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('weight-input')) return;

      const exIdx = Number(row.dataset.exercise);
      const setIdx = Number(row.dataset.set);
      const currentState = state[exIdx].completed[setIdx];

      state[exIdx].completed[setIdx] = !currentState;
      saveDayState(currentRoutineId, state);

      if (!currentState) {
        const routines = getRoutines();
        const routine = routines.find(r => r.id === currentRoutineId);
        const ex = routine.exercises[exIdx];
        const allDone = state[exIdx].completed.every(Boolean);
        const lastExercise = exIdx === routine.exercises.length - 1;
        const lastSet = setIdx === ex.sets - 1;

        if (allDone) {
          state[exIdx].collapsed = true;
          saveDayState(currentRoutineId, state);
          if (!lastExercise && state[exIdx + 1]) {
            state[exIdx + 1].collapsed = false;
            saveDayState(currentRoutineId, state);
          }
        }

        if (!(allDone && lastExercise && lastSet)) {
          startTimer(restSeconds);
        }
      }
      renderUser();
    });
  });

  exerciseList.querySelectorAll('.weight-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const exIdx = Number(e.target.dataset.exercise);
      if (e.target.classList.contains('cardio-time')) {
        state[exIdx].cardioTime = e.target.value;
      } else if (e.target.classList.contains('cardio-speed')) {
        state[exIdx].speed = e.target.value;
      } else if (e.target.classList.contains('cardio-incline')) {
        state[exIdx].incline = e.target.value;
      } else {
        const setIdx = Number(e.target.dataset.set);
        state[exIdx].weights[setIdx] = e.target.value;
      }
      saveDayState(currentRoutineId, state);
    });
    input.addEventListener('click', (e) => e.stopPropagation());
  });

  exerciseList.querySelectorAll('.change-image-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exIdx = Number(btn.dataset.exercise);
      const routines = getRoutines();
      const routine = routines.find(r => r.id === currentRoutineId);
      const exerciseData = getExerciseById(routine.exercises[exIdx].exerciseId);
      if (!exerciseData || !exerciseData.images || exerciseData.images.length <= 1) return;
      const current = state[exIdx].imageIndex || 0;
      state[exIdx].imageIndex = (current + 1) % exerciseData.images.length;
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  exerciseList.querySelectorAll('.collapse-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
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
    exercises: currentRoutine.exercises.map((ex, idx) => {
      const exData = getExerciseById(ex.exerciseId);
      const exState = currentStateData[idx];
      return {
        name: exData ? exData.name : "Ejercicio",
        isCardio: exData ? exData.group === "Cardio" || !!ex.time : false,
        cardioTime: exState ? exState.cardioTime || ex.time || '0 min' : (ex.time || '0 min'),
        weights: exState ? [...exState.weights] : [],
        speed: exState ? exState.speed : 0,
        incline: exState ? exState.incline : 0,
        completed: exState ? [...exState.completed] : []
      };
    })
  };
  saveGlobalHistory(history);

  const currentIndex = routines.findIndex(r => r.id === currentRoutineId);
  
  if (currentIndex !== -1 && currentIndex < routines.length - 1) {
    currentRoutineId = routines[currentIndex + 1].id;
    saveCurrentRoutinePointer(currentRoutineId);
    alert(isSuccess ? `¡Rutina completada! Avanzando a: ${routines[currentIndex + 1].name}` : `Guardado como incompleto. Avanzando a: ${routines[currentIndex + 1].name}`);
  } else {
    routines.forEach(r => {
      localStorage.removeItem(`migym_state_${r.id}`);
    });
    currentRoutineId = routines[0].id;
    saveCurrentRoutinePointer(currentRoutineId);
    alert("🎉 ¡Has completado todo el ciclo de rutinas! El sistema se ha reiniciado automáticamente al Día 1 para un nuevo ciclo. Tus datos quedaron guardados en el historial.");
  }

  state = getDayState(currentRoutineId);
  renderUser();
  renderHeatmap();
}

function renderHeatmap() {
  const container = $('heatmapContainer');
  container.innerHTML = '';
  const history = getGlobalHistory();

  for (let dayNum = 1; dayNum <= 31; dayNum++) {
    const session = history[dayNum];
    let className = 'heatmap-day';
    let text = `${dayNum}`;
    
    if (session) {
      if (session.status === 'completed') className += ' completed';
      else if (session.status === 'incomplete') className += ' incomplete';
      text += `<span>${session.routineName.replace('Día ', 'D')}</span>`;
    }

    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = text;
    
    div.addEventListener('click', () => {
      showHistoryDetail(dayNum, session);
    });

    container.appendChild(div);
  }
}

function showHistoryDetail(dayNum, session) {
  historyModalTitle.textContent = `Día ${dayNum} del mes`;
  if (!session) {
    historyModalContent.innerHTML = `<p style="color:var(--muted); text-align:center; padding: 20px;">No hay registros de entrenamiento guardados para este día.</p>`;
  } else {
    let html = `<p><strong>Rutina:</strong> ${session.routineName} (${session.status === 'completed' ? '✅ Completada' : '⏳ Incompleta'})</p><hr style="border-color:var(--line); margin: 10px 0;">`;
    session.exercises.forEach((ex, i) => {
      html += `<div style="margin-bottom: 12px; background:var(--bg); padding:10px; border-radius:10px;"><strong>${i+1}. ${ex.name}</strong><br>`;
      
      if (ex.isCardio) {
        const timeVal = ex.cardioTime && ex.cardioTime.trim() !== '' ? ex.cardioTime : '0 min';
        html += `<small style="color:var(--accent);">⏱️ Tiempo: ${timeVal}</small>`;
        if (ex.speed || ex.incline) {
          html += `<br><small style="color:var(--muted);">Velocidad: ${ex.speed || 0} | Inclinación: ${ex.incline || 0}</small>`;
        }
      } else {
        if (ex.weights && ex.weights.length > 0) {
          const seriesDetail = ex.weights.map((w, s) => {
            const pesoText = w && String(w).trim() !== '' ? `${w}kg` : '0kg';
            return `S${s+1}: <strong>${pesoText}</strong>`;
          }).join(' | ');
          html += `<small style="color:var(--text); display:block; margin-top:3px;">💪 Pesos: ${seriesDetail}</small>`;
        } else {
          html += `<small style="color:var(--muted);">Sin registros de peso (0kg)</small>`;
        }
      }
      html += `</div>`;
    });
    historyModalContent.innerHTML = html;
  }
  historyModal.classList.remove('hidden');
}

closeHistoryModal.addEventListener('click', () => historyModal.classList.add('hidden'));
historyModal.addEventListener('click', (e) => { if (e.target === historyModal) historyModal.classList.add('hidden'); });

function startTimer(seconds) {
  clearInterval(timerInterval);
  remaining = seconds;
  paused = false;
  pauseTimer.textContent = 'Pausar';
  skipTimer.classList.remove('hidden'); // Asegura que el botón "Saltar" esté visible al iniciar
  timerOverlay.classList.remove('hidden');
  timerMessage.textContent = 'Recuperá fuerzas para la siguiente serie.';
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    if (!paused) {
      remaining--;
      updateTimerDisplay();
      if (remaining <= 0) {
        clearInterval(timerInterval);
        if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
        timerMessage.textContent = '¡Descanso terminado! Siguiente serie.';
        pauseTimer.textContent = 'Cerrar';
        skipTimer.classList.add('hidden'); // Oculta "Saltar" al llegar a 0
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const min = String(Math.floor(remaining / 60)).padStart(2, '0');
  const sec = String(remaining % 60).padStart(2, '0');
  timerValue.textContent = `${min}:${sec}`;
}

pauseTimer.addEventListener('click', () => {
  if (remaining <= 0) { 
    timerOverlay.classList.add('hidden'); 
    return; 
  }
  paused = !paused;
  pauseTimer.textContent = paused ? 'Continuar' : 'Pausar';
});

addTime.addEventListener('click', () => { 
  const wasZero = remaining <= 0;
  remaining += 15; 
  updateTimerDisplay();

  // Si estaba en 0 y se agregaron 15s, reiniciar la cuenta regresiva si estaba detenida
  if (wasZero) {
    skipTimer.classList.remove('hidden');
    pauseTimer.textContent = 'Pausar';
    timerMessage.textContent = 'Recuperá fuerzas para la siguiente serie.';
    startTimer(remaining);
  }
});

skipTimer.addEventListener('click', () => { 
  clearInterval(timerInterval); 
  timerOverlay.classList.add('hidden'); 
});

resetButton.addEventListener('click', () => {
  if (confirm('¿Seguro que querés reiniciar esta rutina actual?')) {
    localStorage.removeItem(`migym_state_${currentRoutineId}`);
    state = getDayState(currentRoutineId);
    renderUser();
  }
});

function populateDayModal() {
  const routines = getRoutines();
  dayOptions.innerHTML = '';
  routines.forEach(r => {
    const isCurrent = r.id === currentRoutineId;
    const rState = getDayState(r.id);
    
    let isCompleted = false;
    let isIncomplete = false;

    if (rState) {
      const totalSets = rState.reduce((acc, curr) => acc + curr.completed.length, 0);
      const doneSets = rState.reduce((acc, curr) => acc + curr.completed.filter(Boolean).length, 0);
      
      if (totalSets > 0) {
        if (doneSets === totalSets) isCompleted = true;
        else if (doneSets > 0) isIncomplete = true;
      }
    }

    let statusTag = '';
    if (isCurrent) {
      statusTag = '<span class="day-status" style="color:var(--accent);">⭐ Actual</span>';
    } else if (isCompleted) {
      statusTag = '<span class="day-status" style="color:var(--success);">✅ Completado</span>';
    } else if (isIncomplete) {
      statusTag = '<span class="day-status" style="color:var(--warning);">⏳ Incompleto</span>';
    } else {
      statusTag = '<span class="day-status" style="color:var(--muted);">⚪ Pendiente</span>';
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span>${r.name}</span> ${statusTag}`;
    btn.addEventListener('click', () => {
      currentRoutineId = r.id;
      saveCurrentRoutinePointer(currentRoutineId);
      state = getDayState(currentRoutineId);
      renderUser();
      dayModal.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    dayOptions.appendChild(btn);
  });
}

dayButton.addEventListener('click', () => { populateDayModal(); dayModal.classList.remove('hidden'); });
closeModal.addEventListener('click', () => dayModal.classList.add('hidden'));
dayModal.addEventListener('click', (e) => { if (e.target === dayModal) dayModal.classList.add('hidden'); });

function renderAdminRoutines() {
  const routines = getRoutines();
  routineListAdmin.innerHTML = '';
  routines.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'admin-item';
    const exerciseNames = r.exercises.map(ex => {
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
        currentRoutineId = currentRoutines.length > 0 ? currentRoutines[0].id : 1;
        saveCurrentRoutinePointer(currentRoutineId);
        state = getDayState(currentRoutineId);
        renderUser();
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
  currentRoutineId = routines[0].id;
  saveCurrentRoutinePointer(currentRoutineId);
  state = getDayState(currentRoutineId);
  renderUser();
});

cancelRoutine.addEventListener('click', () => { routineForm.classList.add('hidden'); });
addRoutineBtn.addEventListener('click', () => openRoutineForm());

restInput.value = getRestSeconds();
saveRest.addEventListener('click', () => {
  const sec = Number(restInput.value);
  if (sec > 0) { setRestSeconds(sec); restSeconds = sec; alert('Tiempo de descanso actualizado'); }
});

// EXPORTAR E IMPORTAR RESPALDO JSON
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

let showingProgress = false;

progressToggleBtn.addEventListener('click', () => {
  showingProgress = !showingProgress;
  if (showingProgress) {
    userView.classList.add('hidden');
    adminView.classList.add('hidden');
    progressView.classList.remove('hidden');
    progressToggleBtn.textContent = '🏋️ Rutina';
    modeToggle.style.display = 'none';
    renderHeatmap();
  } else {
    progressView.classList.add('hidden');
    userView.classList.remove('hidden');
    progressToggleBtn.textContent = '📊 Progreso';
    modeToggle.style.display = 'inline-block';
    renderUser();
  }
});

function toggleMode() {
  if (currentMode === 'user') {
    currentMode = 'admin';
    userView.classList.add('hidden');
    progressView.classList.add('hidden');
    adminView.classList.remove('hidden');
    modeToggle.textContent = '👤 Usuario';
    progressToggleBtn.style.display = 'none';
    renderAdminRoutines();
    restInput.value = getRestSeconds();
  } else {
    currentMode = 'user';
    adminView.classList.add('hidden');
    userView.classList.remove('hidden');
    modeToggle.textContent = '⚙️ Admin';
    progressToggleBtn.style.display = 'inline-block';
    state = getDayState(currentRoutineId);
    renderUser();
  }
}

modeToggle.addEventListener('click', toggleMode);

function init() {
  currentRoutineId = getCurrentRoutinePointer();
  state = getDayState(currentRoutineId);
  renderUser();
  renderHeatmap();
  currentMode = 'user';
  userView.classList.remove('hidden');
  adminView.classList.add('hidden');
  progressView.classList.add('hidden');
  modeToggle.textContent = '⚙️ Admin';
}

init();