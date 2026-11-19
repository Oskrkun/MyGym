// ==========================================
// routine.js — Vista Rutina + Timer + Extras + Cambiar ejercicio
// Depende de: core.js
// ==========================================

// ==========================================
// 1. VARIABLES DE ESTADO
// ==========================================

let currentRoutineId = getCurrentRoutinePointer();
let state = {};            // { exercises: [], extras: [] }
let timerInterval = null;
let remaining = 0;
let paused = false;
let restSeconds = getRestSeconds();

let replacingExerciseIndex = -1;


// ==========================================
// 2. REFS DOM
// ==========================================

const dayLabel        = $('dayLabel');
const routineTitle    = $('routineTitle');
const exerciseList    = $('exerciseList');
const extrasList      = $('extrasList');
const extrasActions   = $('extrasActions');
const addExtraBtn     = $('addExtraBtn');
const progressPercent = $('progressPercent');
const finishCard      = $('finishCard');
const resetButton     = $('resetButton');
const finishRoutineBtn     = $('finishRoutineBtn');

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

const replaceExerciseModal    = $('replaceExerciseModal');
const closeReplaceModal       = $('closeReplaceModal');
const replaceTypeSelector     = $('replaceTypeSelector');
const replaceExerciseSelector = $('replaceExerciseSelector');
const confirmReplaceBtn       = $('confirmReplaceBtn');
const cancelReplaceBtn        = $('cancelReplaceBtn');


// ==========================================
// 3. UTILIDADES DE SELECTORES Y VALIDACIÓN
// ==========================================

function populateTypeSelector(selectEl, selected) {
  selectEl.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Elegir tipo...';
  placeholder.disabled = true;
  selectEl.appendChild(placeholder);

  getTiposDeEjercicio().forEach(tipo => {
    const opt = document.createElement('option');
    opt.value = tipo;
    opt.textContent = tipo;
    if (selected && tipo === selected) opt.selected = true;
    selectEl.appendChild(opt);
  });

  if (!selected) selectEl.value = '';
}

function populateExerciseSelectorByType(selectEl, tipo, excludeId) {
  selectEl.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Elegir ejercicio...';
  placeholder.disabled = true;
  selectEl.appendChild(placeholder);

  const all = getExercises();
  const filtered = tipo === 'Todos'
    ? all
    : all.filter(ex => {
        const groups = ex.groups || (ex.group ? [ex.group] : []);
        return groups.includes(tipo);
      });
  filtered.forEach(ex => {
    if (excludeId !== undefined && ex.id === excludeId) return;
    const opt = document.createElement('option');
    opt.value = ex.id;
    const grupos = (ex.groups || [ex.group]).join(', ');
    opt.textContent = `${ex.name} (${grupos})`;
    selectEl.appendChild(opt);
  });

  selectEl.value = '';
}

function esPesoValido(valor) {
  if (valor === undefined || valor === null) return false;
  const limpio = String(valor).trim();
  if (limpio === '') return false;
  const num = Number(limpio.replace(',', '.'));
  if (!Number.isNaN(num) && num <= 0) return false;
  return true;
}

function esValorNoVacio(valor) {
  if (valor === undefined || valor === null) return false;
  return String(valor).trim() !== '';
}


// ==========================================
// 4. HELPERS DE REFERENCIA POR EJERCICIO
// ==========================================

function getRefEjercicio(exerciseId) {
  if (typeof getUltimaReferenciaEjercicio === 'function') {
    return getUltimaReferenciaEjercicio(exerciseId);
  }
  return null;
}

function resolverPesoSerie(exState, currentExerciseId, exerciseName, setIndex, lastSession, lastExerciseData, routineId, routineName) {
  const currentWeight = exState.weights[setIndex];
  if (esPesoValido(currentWeight)) return String(currentWeight).trim();

  const ref = getRefEjercicio(currentExerciseId);
  if (ref) {
    if (Array.isArray(ref.sets) && ref.sets[setIndex] && esPesoValido(ref.sets[setIndex].weight)) {
      return String(ref.sets[setIndex].weight).trim();
    }
    if (esPesoValido(ref.lastWeight)) {
      return String(ref.lastWeight).trim();
    }
  }

  if (lastExerciseData && Array.isArray(lastExerciseData.weights)) {
    const wPrev = lastExerciseData.weights[setIndex];
    if (esPesoValido(wPrev)) return String(wPrev).trim();
  }

  if (lastSession) {
    const fallback = getUltimoPesoValidoEnSesion(lastSession, currentExerciseId, exerciseName);
    if (esPesoValido(fallback)) return String(fallback).trim();
  }

  if (routineId !== undefined && routineName) {
    const fallbackViejo = getUltimoPesoValidoEnRutina(routineId, routineName, currentExerciseId, exerciseName);
    if (esPesoValido(fallbackViejo)) return String(fallbackViejo).trim();
  }

  return '';
}

function resolverTiempoSerie(exState, currentExerciseId, exerciseName, setIndex, lastSession, lastExerciseData, routineId, routineName) {
  const current = exState.reps[setIndex];
  if (esValorNoVacio(current)) return String(current).trim();

  const ref = getRefEjercicio(currentExerciseId);
  if (ref) {
    if (Array.isArray(ref.sets) && ref.sets[setIndex] && esValorNoVacio(ref.sets[setIndex].reps)) {
      return String(ref.sets[setIndex].reps).trim();
    }
    if (esValorNoVacio(ref.lastReps)) {
      return String(ref.lastReps).trim();
    }
  }

  if (lastExerciseData && Array.isArray(lastExerciseData.reps)) {
    const tPrev = lastExerciseData.reps[setIndex];
    if (esValorNoVacio(tPrev)) return String(tPrev).trim();
  }

  if (lastSession) {
    const fallback = getUltimasRepsValidasEnSesion(lastSession, currentExerciseId, exerciseName);
    if (esValorNoVacio(fallback)) return String(fallback).trim();
  }

  return '60';
}

function resolverRepsSerie(exState, ex, setIndex, lastSession, lastExerciseData, currentExerciseId, exerciseName) {
  const currentReps = exState.reps[setIndex];
  if (esValorNoVacio(currentReps)) return String(currentReps).trim();

  const ref = getRefEjercicio(currentExerciseId);
  if (ref) {
    if (Array.isArray(ref.sets) && ref.sets[setIndex] && esValorNoVacio(ref.sets[setIndex].reps)) {
      return String(ref.sets[setIndex].reps).trim();
    }
    if (esValorNoVacio(ref.lastReps)) {
      return String(ref.lastReps).trim();
    }
  }

  if (lastExerciseData && Array.isArray(lastExerciseData.reps)) {
    const rPrev = lastExerciseData.reps[setIndex];
    if (esValorNoVacio(rPrev)) return String(rPrev).trim();
  }

  if (lastSession) {
    const fallback = getUltimasRepsValidasEnSesion(lastSession, currentExerciseId, exerciseName);
    if (esValorNoVacio(fallback)) return String(fallback).trim();
  }

  return String(ex.reps || DEFAULT_REPS);
}


// ==========================================
// 5. ASIGNAR EJERCICIO A EXTRA
// ==========================================

function asignarEjercicioAExtra(extraIdx, exerciseId) {
  const exData = getExerciseById(exerciseId);
  if (!exData) return;

  const ref = getRefEjercicio(exerciseId);

  state.extras[extraIdx].exerciseId = exerciseId;
  state.extras[extraIdx].name = exData.name;

  if (ref && Array.isArray(ref.sets) && ref.sets.length > 0) {
    state.extras[extraIdx].sets = ref.sets.map(s => ({
      weight: esPesoValido(s.weight) ? String(s.weight).trim() : '',
      reps: esValorNoVacio(s.reps) ? String(s.reps).trim() : String(DEFAULT_REPS),
      completed: false
    }));
  } else {
    const lastWeight = getPesoDeUltimaSesion(exerciseId);
    const lastReps = getRepsDeUltimaSesion(exerciseId);
    state.extras[extraIdx].sets = [{
      weight: esPesoValido(lastWeight) ? String(lastWeight).trim() : '',
      reps: esValorNoVacio(lastReps) ? String(lastReps).trim() : String(DEFAULT_REPS),
      completed: false
    }];
  }

  saveDayState(currentRoutineId, state);
  renderUser();
}


// ==========================================
// 6. VISTA RUTINA
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

  const lastSession = getLastSessionForRoutine(routine.id, routine.name);

  let totalSets = 0, completedSets = 0;
  exerciseList.innerHTML = '';

  routine.exercises.forEach((ex, idx) => {
    const exState = state.exercises[idx];
    if (!exState) return;

    const currentExerciseId = exState.currentExerciseId !== undefined
      ? exState.currentExerciseId
      : ex.exerciseId;
    const exerciseData = getExerciseById(currentExerciseId);
    if (!exerciseData) return;

    totalSets += exState.completed.length;
    completedSets += exState.completed.filter(Boolean).length;

    const images = exerciseData.images || ['gifs/default.gif'];
    const currentImageIndex = exState.imageIndex || 0;
    const imageUrl = images[currentImageIndex] || 'gifs/default.gif';
    const allDone = exState.completed.every(Boolean);
    const isCardio = (exerciseData.groups || []).includes('Cardio') || ex.time;

    let lastExerciseData = null;
    if (lastSession) {
      lastExerciseData = findExerciseInSession(
        lastSession.exercises,
        currentExerciseId,
        exerciseData.name
      );
    }

    const ref = getRefEjercicio(currentExerciseId);

    const card = document.createElement('article');
    card.className = `exercise-card${exState.collapsed ? ' collapsed' : ''}${allDone ? ' completed-exercise' : ''}`;
    card.dataset.exerciseIndex = idx;

    const showImageBtn = images.length > 1;
    const numSets = exState.completed.length;

    const displayCardioTime = esValorNoVacio(exState.cardioTime)
      ? String(exState.cardioTime).trim()
      : ((ref && esValorNoVacio(ref.cardioTime)) ? String(ref.cardioTime).trim() : (ex.time || '15 min'));
    const displayCardioSpeed = (exState.speed !== undefined && exState.speed !== null && String(exState.speed).trim() !== '')
      ? exState.speed
      : ((ref && ref.speed !== undefined) ? ref.speed : (ex.speed || 0));
    const displayCardioIncline = (exState.incline !== undefined && exState.incline !== null && String(exState.incline).trim() !== '')
      ? exState.incline
      : ((ref && ref.incline !== undefined) ? ref.incline : (ex.incline || 0));

    const subtitleText = isCardio
      ? `Duración: ${displayCardioTime}`
      : `${numSets} serie${numSets !== 1 ? 's' : ''} · ${ex.reps} repeticiones base`;

    let cardioHtml = '';
    if (isCardio) {
      cardioHtml = `
        <div style="display:flex; gap:12px; margin-top:10px; padding:10px; background:var(--bg); border-radius:10px; flex-wrap:wrap;">
          <div style="flex:1; min-width:110px;">
            <label for="cardioTime_${idx}" style="font-size:11px; color:var(--muted);">Tiempo realizado</label>
            <input type="text" id="cardioTime_${idx}" name="cardioTime_${idx}" class="weight-input cardio-time" data-exercise="${idx}" value="${displayCardioTime}" placeholder="0 min" style="width:100%; margin-top:4px;" />
          </div>
          <div style="flex:1; min-width:90px;">
            <label for="cardioSpeed_${idx}" style="font-size:11px; color:var(--muted);">Velocidad</label>
            <input type="number" id="cardioSpeed_${idx}" name="cardioSpeed_${idx}" class="weight-input cardio-speed" data-exercise="${idx}" value="${displayCardioSpeed}" style="width:100%; margin-top:4px;" />
          </div>
          <div style="flex:1; min-width:90px;">
            <label for="cardioIncline_${idx}" style="font-size:11px; color:var(--muted);">Inclinación</label>
            <input type="number" id="cardioIncline_${idx}" name="cardioIncline_${idx}" class="weight-input cardio-incline" data-exercise="${idx}" value="${displayCardioIncline}" style="width:100%; margin-top:4px;" />
          </div>
        </div>
      `;
    }

    const replaceBtnHtml = `<button type="button" class="replace-exercise-btn" data-exercise="${idx}" aria-label="Cambiar ejercicio" title="Cambiar ejercicio">🔄</button>`;

    card.innerHTML = `
      <div class="exercise-head" data-collapse-head="${idx}">
        <div class="exercise-status ${allDone ? 'done' : ''}">${allDone ? '✓' : ''}</div>
        <div class="exercise-number">${String(idx + 1).padStart(2, '0')}</div>
        <div class="exercise-title">
          <div class="group">${getGruposDeEjercicio(exerciseData).join(' · ')}</div>
          <h2>${exerciseData.name}</h2>
          <p>${subtitleText}</p>
        </div>
        <div class="exercise-chevron">${exState.collapsed ? '▾' : '▴'}</div>
      </div>

      <div class="gif-container">
        <img src="${imageUrl}" alt="${exerciseData.name}" class="exercise-gif" onerror="this.src='gifs/default.gif'" />
        <div class="gif-actions">
          ${showImageBtn ? `<button type="button" class="change-image-btn" data-exercise="${idx}" aria-label="Cambiar imagen">⇄</button>` : ''}
          ${replaceBtnHtml}
        </div>
      </div>

      <div class="series-container">
        ${cardioHtml}
        ${exState.completed.map((checked, setIndex) => {
          const isTimeExercise = esEjercicioPorTiempo(exerciseData);

          if (isTimeExercise) {
            const displayedTime = resolverTiempoSerie(
              exState, currentExerciseId, exerciseData.name, setIndex, lastSession, lastExerciseData,
              routine.id, routine.name
            );
            const displayedWeightTime = resolverPesoSerie(
              exState, currentExerciseId, exerciseData.name, setIndex, lastSession, lastExerciseData,
              routine.id, routine.name
            );

            return `
            <div class="set-row ${checked ? 'checked' : ''}" data-exercise="${idx}" data-set="${setIndex}">
              <input type="checkbox" id="check_${idx}_${setIndex}" name="check_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" ${checked ? 'checked' : ''} aria-label="Marcar serie ${setIndex + 1}">
              <span class="fake-check">✓</span>
              <div class="set-info">
                <strong>Serie ${setIndex + 1}</strong>
                <div class="set-inputs">
                  <input class="weight-input set-time-input" id="time_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="seg" value="${displayedTime}" />
                  <span class="set-times">seg</span>
                  <input class="weight-input set-weight-input" id="weight_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="kg" value="${displayedWeightTime}" />
                  <span class="set-times">kg</span>
                </div>
              </div>
              <button type="button" class="remove-set-btn" data-exercise="${idx}" data-set="${setIndex}" aria-label="Eliminar serie">✕</button>
              <span class="set-state">${checked ? 'COMPLETADA' : 'PENDIENTE'}</span>
            </div>
            `;
          }

          const displayedWeight = resolverPesoSerie(
            exState, currentExerciseId, exerciseData.name, setIndex, lastSession, lastExerciseData,
            routine.id, routine.name
          );
          const displayedReps = resolverRepsSerie(
            exState, ex, setIndex, lastSession, lastExerciseData, currentExerciseId, exerciseData.name
          );

          const hintWeight = (ref && Array.isArray(ref.sets) && ref.sets[setIndex] && esPesoValido(ref.sets[setIndex].weight))
            ? String(ref.sets[setIndex].weight).trim()
            : (ref && esPesoValido(ref.lastWeight) ? String(ref.lastWeight).trim() : null);
          const currentWeight = exState.weights[setIndex] || '';
          const showHint = !isCardio && hintWeight && String(hintWeight) !== String(currentWeight);

          return `
          <div class="set-row ${checked ? 'checked' : ''}" data-exercise="${idx}" data-set="${setIndex}">
            <input type="checkbox" id="check_${idx}_${setIndex}" name="check_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" ${checked ? 'checked' : ''} aria-label="Marcar serie ${setIndex + 1}">
            <span class="fake-check">✓</span>
            <div class="set-info">
              <strong>${isCardio ? 'Completar sesión' : 'Serie ' + (setIndex + 1)}</strong>
              ${!isCardio ? `
                <div class="set-inputs">
                  <input class="weight-input set-weight-input" id="weight_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="kg" value="${displayedWeight}" />
                  <span class="set-times">×</span>
                  <input class="weight-input set-reps-input" id="reps_${idx}_${setIndex}" data-exercise="${idx}" data-set="${setIndex}" placeholder="reps" value="${displayedReps}" />
                </div>
                ${showHint ? `<span class="last-weight-hint">Última vez: ${hintWeight} kg</span>` : ''}
              ` : `<small>Tiempo objetivo: ${displayCardioTime}</small>`}
            </div>
            <button type="button" class="remove-set-btn" data-exercise="${idx}" data-set="${setIndex}" aria-label="Eliminar serie">✕</button>
            <span class="set-state">${checked ? 'COMPLETADA' : 'PENDIENTE'}</span>
          </div>
          `;
        }).join('')}

        ${!isCardio ? `<button type="button" class="add-set-btn" data-exercise="${idx}">+ Agregar serie</button>` : ''}
      </div>
    `;

    exerciseList.appendChild(card);
  });

  renderExtras();

  const percent = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  progressPercent.textContent = percent + '%';
  finishCard.classList.toggle('hidden', percent !== 100);

  if (percent === 100 && totalSets > 0) {
    extrasActions.classList.remove('hidden');
  } else {
    extrasActions.classList.add('hidden');
  }

  if (finishRoutineBtn) {
    if (percent === 100 && totalSets > 0) {
      finishRoutineBtn.textContent = '✓ Finalizar rutina';
    } else {
      finishRoutineBtn.textContent = `Terminar rutina (${percent}%)`;
    }
  }

  // Listeners de checkbox de series
  exerciseList.querySelectorAll('.set-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('input, button')) return;

      const exIdx = Number(row.dataset.exercise);
      const setIdx = Number(row.dataset.set);
      const currentState = state.exercises[exIdx].completed[setIdx];

      state.exercises[exIdx].completed[setIdx] = !currentState;

      if (!currentState) {
        const exState = state.exercises[exIdx];
        const allDone = exState.completed.every(Boolean);
        const lastExercise = exIdx === routine.exercises.length - 1;
        const lastSet = setIdx === exState.completed.length - 1;

        if (allDone) {
          exState.collapsed = true;
          if (!lastExercise && state.exercises[exIdx + 1]) {
            state.exercises[exIdx + 1].collapsed = false;
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

  // Inputs de peso, reps, tiempo y cardio
  exerciseList.querySelectorAll('.weight-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const exIdx = Number(e.target.dataset.exercise);
      const val = e.target.value;

      if (e.target.classList.contains('cardio-time')) {
        if (esValorNoVacio(val)) {
          state.exercises[exIdx].cardioTime = String(val).trim();
          saveDayState(currentRoutineId, state);
        }
      } else if (e.target.classList.contains('cardio-speed')) {
        if (esValorNoVacio(val)) {
          state.exercises[exIdx].speed = val;
          saveDayState(currentRoutineId, state);
        }
      } else if (e.target.classList.contains('cardio-incline')) {
        if (esValorNoVacio(val)) {
          state.exercises[exIdx].incline = val;
          saveDayState(currentRoutineId, state);
        }
      } else if (e.target.classList.contains('set-time-input')) {
        const setIdx = Number(e.target.dataset.set);
        if (esValorNoVacio(val)) {
          state.exercises[exIdx].reps[setIdx] = String(val).trim();
          saveDayState(currentRoutineId, state);
        }
      } else if (e.target.classList.contains('set-reps-input')) {
        const setIdx = Number(e.target.dataset.set);
        if (esValorNoVacio(val)) {
          state.exercises[exIdx].reps[setIdx] = String(val).trim();
          saveDayState(currentRoutineId, state);
        }
      } else if (e.target.classList.contains('set-weight-input')) {
        const setIdx = Number(e.target.dataset.set);
        if (esPesoValido(val)) {
          state.exercises[exIdx].weights[setIdx] = String(val).trim();
          saveDayState(currentRoutineId, state);
        }
      }
    });
    input.addEventListener('click', (e) => e.stopPropagation());
  });

  // Botón eliminar serie
  exerciseList.querySelectorAll('.remove-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exIdx = Number(btn.dataset.exercise);
      const setIdx = Number(btn.dataset.set);
      const exState = state.exercises[exIdx];

      if (exState.completed.length === 1) {
        alert('Un ejercicio debe tener al menos una serie.');
        return;
      }

      exState.completed.splice(setIdx, 1);
      exState.weights.splice(setIdx, 1);
      exState.reps.splice(setIdx, 1);

      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Botón agregar serie
  exerciseList.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exIdx = Number(btn.dataset.exercise);
      const exState = state.exercises[exIdx];
      const lastIdx = exState.completed.length - 1;

      const currentExId = exState.currentExerciseId !== undefined
        ? exState.currentExerciseId
        : routine.exercises[exIdx].exerciseId;
      const ref = getRefEjercicio(currentExId);

      const rawWeight = lastIdx >= 0 && esPesoValido(exState.weights[lastIdx])
        ? String(exState.weights[lastIdx]).trim()
        : (ref && esPesoValido(ref.lastWeight) ? String(ref.lastWeight).trim() : '');

      const rawReps = lastIdx >= 0 && esValorNoVacio(exState.reps[lastIdx])
        ? String(exState.reps[lastIdx]).trim()
        : (ref && esValorNoVacio(ref.lastReps) ? String(ref.lastReps).trim() : String(routine.exercises[exIdx].reps || DEFAULT_REPS));

      exState.completed.push(false);
      exState.weights.push(rawWeight);
      exState.reps.push(rawReps);

      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Cambiar imagen
  exerciseList.querySelectorAll('.change-image-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exIdx = Number(btn.dataset.exercise);
      const exState = state.exercises[exIdx];
      const currentExerciseId = exState.currentExerciseId !== undefined ? exState.currentExerciseId : routine.exercises[exIdx].exerciseId;
      const exerciseData = getExerciseById(currentExerciseId);
      if (!exerciseData || !exerciseData.images || exerciseData.images.length <= 1) return;
      const current = exState.imageIndex || 0;
      exState.imageIndex = (current + 1) % exerciseData.images.length;
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Cambiar ejercicio
  exerciseList.querySelectorAll('.replace-exercise-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exIdx = Number(btn.dataset.exercise);
      openReplaceModal(exIdx);
    });
  });

  // Colapsar/expandir
  exerciseList.querySelectorAll('.exercise-head').forEach(head => {
    head.addEventListener('click', (e) => {
      if (e.target.closest('input, select, textarea, button')) return;

      const idx = Number(head.dataset.collapseHead);
      state.exercises[idx].collapsed = !state.exercises[idx].collapsed;
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });
}


// ==========================================
// 7. EXTRAS
// ==========================================

function renderExtras() {
  if (!extrasList) return;
  extrasList.innerHTML = '';

  const extras = state.extras || [];
  if (extras.length === 0) return;

  const header = document.createElement('div');
  header.style.cssText = 'margin:6px 0 4px; font-size:12px; color:var(--violet); font-weight:800; letter-spacing:1px; text-transform:uppercase;';
  header.textContent = '⚡ Extras de hoy';
  extrasList.appendChild(header);

  extras.forEach((extra, extraIdx) => {
    const card = document.createElement('article');
    card.className = 'exercise-card extra-card';

    const exerciseData = extra.exerciseId ? getExerciseById(extra.exerciseId) : null;

    const headHtml = `
      <div class="extra-head">
        <div class="card-icon">⚡</div>
        <div class="exercise-title">
          <div class="group">EXTRA</div>
          <h2>${exerciseData ? exerciseData.name : 'Sin elegir'}</h2>
          <p>${extra.sets.length} serie${extra.sets.length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" class="remove-extra-btn" data-extra="${extraIdx}" aria-label="Eliminar extra" title="Eliminar extra">✕</button>
      </div>
    `;

    let selectorsHtml = '';
    if (!exerciseData) {
      selectorsHtml = `
        <div class="extra-selectors">
          <label style="font-size:11px; color:var(--muted); display:block; margin-bottom:4px;">Tipo</label>
          <select class="extra-type-select" data-extra="${extraIdx}"></select>
          <label style="font-size:11px; color:var(--muted); display:block; margin:10px 0 4px;">Ejercicio</label>
          <select class="extra-ex-select" data-extra="${extraIdx}"></select>
        </div>
      `;
    }

    let gifHtml = '';
    if (exerciseData) {
      const img = (exerciseData.images && exerciseData.images[0]) || 'gifs/default.gif';
      gifHtml = `
        <div class="gif-container">
          <img src="${img}" alt="${exerciseData.name}" class="exercise-gif" onerror="this.src='gifs/default.gif'" />
        </div>
      `;
    }

    const isTimeExtra = exerciseData && esEjercicioPorTiempo(exerciseData);

    const setsHtml = extra.sets.map((s, sIdx) => {
      if (isTimeExtra) {
        return `
        <div class="set-row extra-set ${s.completed ? 'checked' : ''}" data-extra="${extraIdx}" data-set="${sIdx}">
          <input type="checkbox" id="extraCheck_${extraIdx}_${sIdx}" data-extra="${extraIdx}" data-set="${sIdx}" ${s.completed ? 'checked' : ''}>
          <span class="fake-check">✓</span>
          <div class="set-info">
            <strong>Serie ${sIdx + 1}</strong>
            <div class="set-inputs">
              <input class="weight-input extra-time" data-extra="${extraIdx}" data-set="${sIdx}" placeholder="seg" value="${s.reps || ''}" />
              <span class="set-times">seg</span>
              <input class="weight-input extra-weight" data-extra="${extraIdx}" data-set="${sIdx}" placeholder="kg" value="${s.weight || ''}" />
              <span class="set-times">kg</span>
            </div>
          </div>
          <button type="button" class="remove-extra-set" data-extra="${extraIdx}" data-set="${sIdx}" aria-label="Eliminar serie">✕</button>
        </div>
        `;
      }
      return `
      <div class="set-row extra-set ${s.completed ? 'checked' : ''}" data-extra="${extraIdx}" data-set="${sIdx}">
        <input type="checkbox" id="extraCheck_${extraIdx}_${sIdx}" data-extra="${extraIdx}" data-set="${sIdx}" ${s.completed ? 'checked' : ''}>
        <span class="fake-check">✓</span>
        <div class="set-info">
          <strong>Serie ${sIdx + 1}</strong>
          <div class="set-inputs">
            <input class="weight-input extra-weight" data-extra="${extraIdx}" data-set="${sIdx}" placeholder="kg" value="${s.weight || ''}" />
            <span class="set-times">×</span>
            <input class="weight-input extra-reps" data-extra="${extraIdx}" data-set="${sIdx}" placeholder="reps" value="${s.reps || ''}" />
          </div>
        </div>
        <button type="button" class="remove-extra-set" data-extra="${extraIdx}" data-set="${sIdx}" aria-label="Eliminar serie">✕</button>
      </div>
      `;
    }).join('');

    card.innerHTML = `
      ${headHtml}
      ${selectorsHtml}
      ${gifHtml}
      ${exerciseData ? `
        <div class="series-container">
          ${setsHtml}
          <button type="button" class="collapse-button add-extra-set-btn" data-extra="${extraIdx}" style="margin-top:6px;">+ Agregar serie</button>
        </div>
      ` : ''}
    `;

    extrasList.appendChild(card);

    if (!exerciseData) {
      const typeSel = card.querySelector('.extra-type-select');
      const exSel = card.querySelector('.extra-ex-select');
      populateTypeSelector(typeSel, '');
      populateExerciseSelectorByType(exSel, 'Todos');
      exSel.disabled = true;
    }
  });

  // Eliminar extra completo
  extrasList.querySelectorAll('.remove-extra-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const extraIdx = Number(btn.dataset.extra);
      if (!confirm('¿Eliminar este extra?')) return;
      state.extras.splice(extraIdx, 1);
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Cambio de tipo
  extrasList.querySelectorAll('.extra-type-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const extraIdx = Number(sel.dataset.extra);
      const exSel = extrasList.querySelector(`.extra-ex-select[data-extra="${extraIdx}"]`);
      if (!sel.value) {
        exSel.disabled = true;
        exSel.innerHTML = '<option value="">Elegir ejercicio...</option>';
        return;
      }
      populateExerciseSelectorByType(exSel, sel.value);
      exSel.disabled = false;
    });
  });

  // Cambio de ejercicio
  extrasList.querySelectorAll('.extra-ex-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const extraIdx = Number(sel.dataset.extra);
      const exId = Number(sel.value);
      if (!exId) return;
      asignarEjercicioAExtra(extraIdx, exId);
    });
  });

  // Agregar serie
  extrasList.querySelectorAll('.add-extra-set-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const extraIdx = Number(btn.dataset.extra);
      const extra = state.extras[extraIdx];
      const ref = getRefEjercicio(extra.exerciseId);
      const last = extra.sets[extra.sets.length - 1] || {};

      const nextWeight = esPesoValido(last.weight)
        ? String(last.weight).trim()
        : (ref && esPesoValido(ref.lastWeight) ? String(ref.lastWeight).trim() : '');

      const nextReps = esValorNoVacio(last.reps)
        ? String(last.reps).trim()
        : (ref && esValorNoVacio(ref.lastReps) ? String(ref.lastReps).trim() : String(DEFAULT_REPS));

      extra.sets.push({
        weight: nextWeight,
        reps: nextReps,
        completed: false
      });
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Eliminar serie
  extrasList.querySelectorAll('.remove-extra-set').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const extraIdx = Number(btn.dataset.extra);
      const setIdx = Number(btn.dataset.set);
      if (state.extras[extraIdx].sets.length === 1) {
        alert('Un extra debe tener al menos una serie. Eliminá el extra completo si querés sacarlo.');
        return;
      }
      state.extras[extraIdx].sets.splice(setIdx, 1);
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Checkbox del extra
  extrasList.querySelectorAll('.set-row.extra-set').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('input, button')) return;
      const extraIdx = Number(row.dataset.extra);
      const setIdx = Number(row.dataset.set);
      state.extras[extraIdx].sets[setIdx].completed = !state.extras[extraIdx].sets[setIdx].completed;
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Editar peso/reps/tiempo del extra (ignora vacío, nulo o <= 0 para peso)
  extrasList.querySelectorAll('.extra-weight, .extra-reps, .extra-time').forEach(input => {
    input.addEventListener('input', (e) => {
      const extraIdx = Number(e.target.dataset.extra);
      const setIdx = Number(e.target.dataset.set);
      const val = e.target.value;

      if (e.target.classList.contains('extra-weight')) {
        if (esPesoValido(val)) {
          state.extras[extraIdx].sets[setIdx].weight = String(val).trim();
          saveDayState(currentRoutineId, state);
        }
      } else if (e.target.classList.contains('extra-time')) {
        if (esValorNoVacio(val)) {
          state.extras[extraIdx].sets[setIdx].reps = String(val).trim();
          saveDayState(currentRoutineId, state);
        }
      } else {
        if (esValorNoVacio(val)) {
          state.extras[extraIdx].sets[setIdx].reps = String(val).trim();
          saveDayState(currentRoutineId, state);
        }
      }
    });
    input.addEventListener('click', (e) => e.stopPropagation());
  });
}


// ==========================================
// 8. BOTÓN AGREGAR EXTRA
// ==========================================

addExtraBtn.addEventListener('click', () => {
  if (!state.extras) state.extras = [];
  state.extras.push({ exerciseId: null, name: '', sets: [] });
  saveDayState(currentRoutineId, state);
  renderUser();

  setTimeout(() => {
    const cards = extrasList.querySelectorAll('.extra-card');
    if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
});


// ==========================================
// 9. MODAL CAMBIAR EJERCICIO
// ==========================================

function openReplaceModal(exerciseIdx) {
  replacingExerciseIndex = exerciseIdx;
  replaceExerciseModal.classList.remove('hidden');

  const routine = getRoutines().find(r => r.id === currentRoutineId);
  const currentId = state.exercises[exerciseIdx].currentExerciseId !== undefined
    ? state.exercises[exerciseIdx].currentExerciseId
    : routine.exercises[exerciseIdx].exerciseId;
  const currentEx = getExerciseById(currentId);

  const firstGroup = currentEx ? getGruposDeEjercicio(currentEx)[0] : null;
  populateTypeSelector(replaceTypeSelector, firstGroup || 'Todos');
  populateExerciseSelectorByType(replaceExerciseSelector, replaceTypeSelector.value, currentId);
}

replaceTypeSelector.addEventListener('change', () => {
  const routine = getRoutines().find(r => r.id === currentRoutineId);
  const currentId = state.exercises[replacingExerciseIndex] && state.exercises[replacingExerciseIndex].currentExerciseId !== undefined
    ? state.exercises[replacingExerciseIndex].currentExerciseId
    : routine.exercises[replacingExerciseIndex].exerciseId;
  populateExerciseSelectorByType(replaceExerciseSelector, replaceTypeSelector.value, currentId);
});

closeReplaceModal.addEventListener('click', () => replaceExerciseModal.classList.add('hidden'));
cancelReplaceBtn.addEventListener('click', () => replaceExerciseModal.classList.add('hidden'));
replaceExerciseModal.addEventListener('click', (e) => {
  if (e.target === replaceExerciseModal) replaceExerciseModal.classList.add('hidden');
});

confirmReplaceBtn.addEventListener('click', () => {
  const newId = Number(replaceExerciseSelector.value);
  if (!newId) return;

  const exIdx = replacingExerciseIndex;
  if (exIdx < 0) return;

  const routines = getRoutines();
  const routine = routines.find(r => r.id === currentRoutineId);
  const originalId = routine.exercises[exIdx].exerciseId;
  const baseEx = routine.exercises[exIdx] || {};
  const newExData = getExerciseById(newId);

  const ref = getRefEjercicio(newId);

  state.exercises[exIdx].currentExerciseId = newId;
  state.exercises[exIdx].replacedFrom = originalId;

  if (ref && ref.isCardio) {
    state.exercises[exIdx].completed = [false];
    state.exercises[exIdx].weights = [''];
    state.exercises[exIdx].reps = [''];
    state.exercises[exIdx].cardioTime = esValorNoVacio(ref.cardioTime) ? String(ref.cardioTime).trim() : (baseEx.time || '15 min');
    state.exercises[exIdx].speed = ref.speed !== undefined ? ref.speed : 0;
    state.exercises[exIdx].incline = ref.incline !== undefined ? ref.incline : 0;
    state.exercises[exIdx].collapsed = false;
  } else if (ref && Array.isArray(ref.sets) && ref.sets.length > 0) {
    const count = ref.sets.length;
    state.exercises[exIdx].completed = Array(count).fill(false);
    state.exercises[exIdx].weights = ref.sets.map(s => esPesoValido(s.weight) ? String(s.weight).trim() : '');
    state.exercises[exIdx].reps = ref.sets.map(s => esValorNoVacio(s.reps) ? String(s.reps).trim() : String(baseEx.reps || DEFAULT_REPS));
    state.exercises[exIdx].collapsed = false;
  } else if (newExData && (newExData.groups || []).includes('Cardio')) {
    state.exercises[exIdx].completed = [false];
    state.exercises[exIdx].weights = [''];
    state.exercises[exIdx].reps = [''];
    state.exercises[exIdx].cardioTime = baseEx.time || '15 min';
    state.exercises[exIdx].speed = baseEx.speed || 0;
    state.exercises[exIdx].incline = baseEx.incline || 0;
    state.exercises[exIdx].collapsed = false;
  }

  saveDayState(currentRoutineId, state);

  replaceExerciseModal.classList.add('hidden');
  replacingExerciseIndex = -1;
  renderUser();
});


// ==========================================
// 10. FINALIZAR / AVANZAR
// ==========================================

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

  const allDone = currentStateData.exercises.every(ex => ex.completed.every(Boolean));
  const savedExtras = (isSuccess && allDone)
    ? (currentStateData.extras || []).filter(e => e.exerciseId && e.sets.length > 0)
    : [];

  history[todayKey] = {
    routineId: currentRoutine.id,
    routineName: currentRoutine.name,
    status: isSuccess ? 'completed' : 'incomplete',
    exercises: currentStateData.exercises.map((exState, idx) => {
      const ex = currentRoutine.exercises[idx] || {};
      const currentExerciseId = exState.currentExerciseId !== undefined
        ? exState.currentExerciseId
        : ex.exerciseId;
      const exData = getExerciseById(currentExerciseId);
      const isCardio = (exData && (exData.groups || []).includes('Cardio')) || !!ex.time;

      const finalWeights = exState.weights.map((w, sIdx) => {
        const isCompleted = exState.completed[sIdx];
        if (!isCompleted) return '';
        return esPesoValido(w) ? String(w).trim() : '';
      });

      const finalReps = exState.reps.map((r, sIdx) => {
        const isCompleted = exState.completed[sIdx];
        if (!isCompleted) return '';
        return esValorNoVacio(r) ? String(r).trim() : '';
      });

      return {
        exerciseId: currentExerciseId,
        replacedFrom: exState.replacedFrom || null,
        name: exData ? exData.name : "Ejercicio",
        isCardio,
        cardioTime: exState.cardioTime || ex.time || '0 min',
        weights: finalWeights,
        reps: finalReps,
        speed: exState.speed !== undefined ? exState.speed : 0,
        incline: exState.incline !== undefined ? exState.incline : 0,
        completed: [...exState.completed]
      };
    }),
    extras: savedExtras.map(e => ({
      exerciseId: e.exerciseId,
      name: e.name,
      sets: e.sets.map(s => ({
        weight: esPesoValido(s.weight) ? String(s.weight).trim() : '',
        reps: esValorNoVacio(s.reps) ? String(s.reps).trim() : '',
        completed: s.completed
      }))
    }))
  };
  saveGlobalHistory(history);

  const currentIndex = routines.findIndex(r => r.id === currentRoutineId);
  if (currentIndex !== -1 && currentIndex < routines.length - 1) {
    currentRoutineId = routines[currentIndex + 1].id;
  } else {
    currentRoutineId = routines[0].id;
  }
  saveCurrentRoutinePointer(currentRoutineId);

  localStorage.removeItem(`migym_state_${currentRoutine.id}`);

  if (currentIndex !== -1 && currentIndex < routines.length - 1) {
    alert(isSuccess ? `¡Rutina completada! Avanzando a: ${routines[currentIndex + 1].name}` : `Guardado como incompleto. Avanzando a: ${routines[currentIndex + 1].name}`);
  } else {
    alert("🎉 ¡Has completado todo el ciclo de rutinas! Volviendo a la primera rutina para un nuevo ciclo.");
  }

  state = getDayState(currentRoutineId);
  renderUser();
}

finishRoutineBtn.addEventListener('click', () => {
  const allDone = state.exercises.every(ex => ex.completed.every(Boolean));
  completeRoutineAndAdvance(allDone);
});


// ==========================================
// 11. TIMER
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
// 12. MODAL "CAMBIAR RUTINA"
// ==========================================

function populateDayModal() {
  const routines = getRoutines();
  dayOptions.innerHTML = '';
  routines.forEach(r => {
    const isCurrent = r.id === currentRoutineId;
    const rState = getDayState(r.id);

    let isCompleted = false;
    let isIncomplete = false;

    if (rState && Array.isArray(rState.exercises)) {
      const routineSets = rState.exercises.reduce((acc, curr) => {
        if (curr && Array.isArray(curr.completed)) return acc + curr.completed.length;
        return acc;
      }, 0);
      const doneSets = rState.exercises.reduce((acc, curr) => {
        if (curr && Array.isArray(curr.completed)) return acc + curr.completed.filter(Boolean).length;
        return acc;
      }, 0);

      if (routineSets > 0) {
        if (doneSets === routineSets) isCompleted = true;
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
// 13. BOTÓN DE TEST — Llenar todo
// ==========================================

document.getElementById('fillAllBtn')?.addEventListener('click', () => {
  if (!state || !state.exercises) return;

  const routines = getRoutines();
  const routine = routines.find(r => r.id === currentRoutineId);
  const lastSession = routine ? getLastSessionForRoutine(routine.id, routine.name) : null;

  state.exercises.forEach((exState, idx) => {
    const ex = routine ? routine.exercises[idx] : null;
    if (!ex) return;

    const currentExerciseId = exState.currentExerciseId !== undefined
      ? exState.currentExerciseId
      : ex.exerciseId;
    const exData = getExerciseById(currentExerciseId);
    const lastEx = lastSession && exData
      ? findExerciseInSession(lastSession.exercises, currentExerciseId, exData.name)
      : null;

    exState.weights = exState.weights.map((w, sIdx) =>
      resolverPesoSerie(exState, currentExerciseId, exData ? exData.name : '', sIdx, lastSession, lastEx, routine.id, routine.name)
    );

    exState.reps = exState.reps.map((r, sIdx) =>
      resolverRepsSerie(exState, ex, sIdx, lastSession, lastEx, currentExerciseId, exData ? exData.name : '')
    );

    exState.completed = exState.completed.map(() => true);
  });

  saveDayState(currentRoutineId, state);
  renderUser();
});


// ==========================================
// 14. API PÚBLICA
// ==========================================

window.renderUser = renderUser;
window.completeRoutineAndAdvance = completeRoutineAndAdvance;

window.refreshRoutineView = function () {
  currentRoutineId = getCurrentRoutinePointer();
  state = getDayState(currentRoutineId);
  renderUser();
};
|
window.updateRestSeconds = function (sec) {
  restSeconds = sec;
};