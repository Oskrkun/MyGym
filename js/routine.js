// ==========================================
// routine.js — Vista Rutina + Timer + Modal cambiar día
// Depende de: core.js
// ==========================================

// ==========================================
// 1. VARIABLES DE ESTADO
// ==========================================

let currentRoutineId = getCurrentRoutinePointer();
let state = {};
let timerInterval = null;
let remaining = 0;
let paused = false;
let restSeconds = getRestSeconds();


// ==========================================
// 2. REFS DOM
// ==========================================

const dayLabel        = $('dayLabel');
const routineTitle    = $('routineTitle');
const exerciseList    = $('exerciseList');
const progressPercent = $('progressPercent');
const finishCard      = $('finishCard');
const resetButton     = $('resetButton');

const dayButton  = $('dayButton');
const dayModal   = $('dayModal');
const dayOptions = $('dayOptions');
const closeModal = $('closeModal');

const timerOverlay = $('timerOverlay');
const timerValue   = $('timerValue');
const timerMessage = $('timerMessage');
const pauseTimer   = $('pauseTimer');
const addTime      = $('addTime');
const skipTimer    = $('skipTimer');


// ==========================================
// 3. VISTA RUTINA
// ==========================================

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

  const lastSession = getLastSessionForRoutine(routine.name);

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

    let lastExerciseData = null;
    if (lastSession) {
      lastExerciseData = findExerciseInSession(
        lastSession.exercises,
        ex.exerciseId,
        exerciseData.name
      );
    }

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
      <div class="exercise-head" data-collapse-head="${idx}">
        <div class="exercise-status ${allDone ? 'done' : ''}">${allDone ? '✓' : ''}</div>
        <div class="exercise-number">${String(idx + 1).padStart(2, '0')}</div>
        <div class="exercise-title">
          <div class="group">${exerciseData.group}</div>
          <h2>${exerciseData.name}</h2>
          <p>${subtitleText}</p>
        </div>
        <div class="exercise-chevron">${exState.collapsed ? '▾' : '▴'}</div>
      </div>

      <div class="gif-container">
        <img src="${imageUrl}" alt="${exerciseData.name}" class="exercise-gif" onerror="this.src='gifs/default.gif'" />
        ${showImageBtn ? `<button type="button" class="change-image-btn" data-exercise="${idx}" aria-label="Cambiar imagen">⇄</button>` : ''}
      </div>

      <div class="series-container">
        ${cardioHtml}
        ${exState.completed.map((checked, setIndex) => {
          const lastWeight = lastExerciseData && lastExerciseData.weights
            ? lastExerciseData.weights[setIndex]
            : null;
          const currentWeight = exState.weights[setIndex] || '';
          const displayedWeight = currentWeight || lastWeight || '';
          const showHint = !isCardio && lastWeight && String(lastWeight).trim() !== '' && String(lastWeight) !== currentWeight;

          return `
          <div class="set-row ${checked ? 'checked' : ''}" data-exercise="${idx}" data-set="${setIndex}">
            <input type="checkbox" id="check_${idx}_${setIndex}" name="check_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" ${checked ? 'checked' : ''} aria-label="Marcar serie ${setIndex + 1}">
            <span class="fake-check">✓</span>
            <div class="set-info">
              <strong>${isCardio ? 'Completar sesión' : 'Serie ' + (setIndex + 1)}</strong>
              <small>${isCardio ? 'Tiempo objetivo: ' + (ex.time || '15 min') : ex.reps + ' repeticiones'}</small>
              ${!isCardio ? `
                <input class="weight-input" id="weight_${idx}_${setIndex}" name="weight_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="Peso (kg)" value="${displayedWeight}" aria-label="Peso para serie ${setIndex + 1}" />
                ${showHint ? `<span class="last-weight-hint">Última vez: ${lastWeight} kg</span>` : ''}
              ` : ''}
            </div>
            <span class="set-state">${checked ? 'COMPLETADA' : 'PENDIENTE'}</span>
          </div>
          `;
        }).join('')}
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

      if (!currentState) {
        const routines = getRoutines();
        const routine = routines.find(r => r.id === currentRoutineId);
        const ex = routine.exercises[exIdx];
        const allDone = state[exIdx].completed.every(Boolean);
        const lastExercise = exIdx === routine.exercises.length - 1;
        const lastSet = setIdx === ex.sets - 1;

        if (allDone) {
          state[exIdx].collapsed = true;
          if (!lastExercise && state[exIdx + 1]) {
            state[exIdx + 1].collapsed = false;
          }
        }

        saveDayState(currentRoutineId, state);

        if (!(allDone && lastExercise && lastSet)) {
          startTimer(restSeconds);
        }
      } else {
        saveDayState(currentRoutineId, state);
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

  exerciseList.querySelectorAll('.exercise-head').forEach(head => {
    head.addEventListener('click', (e) => {
      if (e.target.closest('input, select, textarea')) return;

      const idx = Number(head.dataset.collapseHead);
      state[idx].collapsed = !state[idx].collapsed;
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });
}

function completeRoutineAndAdvance(isSuccess) {
  const routines = getRoutines();
  const currentRoutine = routines.find(r => r.id === currentRoutineId);

  if (!currentRoutine) {
    alert("No hay una rutina seleccionada para completar.");
    return;
  }

  const currentStateData = getDayState(currentRoutineId);
  const history = getGlobalHistory();

  const todayDate = new Date();
  const yyyy = todayDate.getFullYear();
  const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
  const dd = String(todayDate.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;

  history[todayKey] = {
    routineName: currentRoutine.name,
    status: isSuccess ? 'completed' : 'incomplete',
    exercises: (currentRoutine.exercises || []).map((ex, idx) => {
      const exData = getExerciseById(ex.exerciseId);
      const exState = currentStateData ? currentStateData[idx] : null;
      return {
        exerciseId: ex.exerciseId,
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
}


// ==========================================
// 4. TIMER
// ==========================================

function startTimer(seconds) {
  clearInterval(timerInterval);
  remaining = seconds;
  paused = false;
  pauseTimer.textContent = 'Pausar';
  skipTimer.classList.remove('hidden');
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
        skipTimer.classList.add('hidden');
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


// ==========================================
// 5. MODAL "CAMBIAR DÍA"
// ==========================================

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


// ==========================================
// 6. API PÚBLICA
// ==========================================

window.renderUser = renderUser;
window.completeRoutineAndAdvance = completeRoutineAndAdvance;

// Permite a otros módulos refrescar la vista Rutina
window.refreshRoutineView = function () {
  currentRoutineId = getCurrentRoutinePointer();
  state = getDayState(currentRoutineId);
  renderUser();
};

// Permite a admin.js actualizar restSeconds sin recargar
window.updateRestSeconds = function (sec) {
  restSeconds = sec;
};