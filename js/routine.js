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
const incompleteRoutineBtn = $('incompleteRoutineBtn');

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
// 3. UTILIDADES DE SELECTORES
// ==========================================

function populateTypeSelector(selectEl, selected) {
  selectEl.innerHTML = '';
  getTiposDeEjercicio().forEach(tipo => {
    const opt = document.createElement('option');
    opt.value = tipo;
    opt.textContent = tipo;
    if (selected && tipo === selected) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function populateExerciseSelectorByType(selectEl, tipo, excludeId) {
  selectEl.innerHTML = '';
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
}


// ==========================================
// 4. HELPERS DE REPS
// ==========================================

function getRepsDeUltimaSesion(exerciseId) {
  const history = getGlobalHistory();
  const keys = Object.keys(history).sort().reverse();
  for (const key of keys) {
    const session = history[key];
    for (const ex of (session.extras || [])) {
      if (ex.exerciseId === exerciseId && Array.isArray(ex.sets)) {
        for (let i = ex.sets.length - 1; i >= 0; i--) {
          const r = ex.sets[i] && ex.sets[i].reps;
          if (r !== undefined && r !== null && String(r).trim() !== '') return r;
        }
      }
    }
  }
  return null;
}


// ==========================================
// 5. ASIGNAR EJERCICIO A EXTRA
// ==========================================

function asignarEjercicioAExtra(extraIdx, exerciseId) {
  const exData = getExerciseById(exerciseId);
  if (!exData) return;

  const lastWeight = getPesoDeUltimaSesion(exerciseId);
  const lastReps = getRepsDeUltimaSesion(exerciseId);

  state.extras[extraIdx].exerciseId = exerciseId;
  state.extras[extraIdx].name = exData.name;
  state.extras[extraIdx].sets = [{
    weight: lastWeight !== null ? String(lastWeight) : '',
    reps: lastReps !== null ? String(lastReps) : '10',
    completed: false
  }];

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
        currentExerciseId,
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

  renderExtras();

  const percent = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  progressPercent.textContent = percent + '%';
  finishCard.classList.toggle('hidden', percent !== 100);

  if (percent === 100) {
    extrasActions.classList.remove('hidden');
    if (incompleteRoutineBtn) incompleteRoutineBtn.classList.add('hidden');
    if (finishRoutineBtn) finishRoutineBtn.textContent = '✓ Finalizar día';
  } else {
    extrasActions.classList.add('hidden');
    if (incompleteRoutineBtn) incompleteRoutineBtn.classList.remove('hidden');
    if (finishRoutineBtn) finishRoutineBtn.textContent = `Finalizar y guardar (${percent}%)`;
  }

  // Listeners de series
  exerciseList.querySelectorAll('.set-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('weight-input')) return;

      const exIdx = Number(row.dataset.exercise);
      const setIdx = Number(row.dataset.set);
      const currentState = state.exercises[exIdx].completed[setIdx];

      state.exercises[exIdx].completed[setIdx] = !currentState;

      if (!currentState) {
        const routines = getRoutines();
        const routine = routines.find(r => r.id === currentRoutineId);
        const ex = routine.exercises[exIdx];
        const allDone = state.exercises[exIdx].completed.every(Boolean);
        const lastExercise = exIdx === routine.exercises.length - 1;
        const lastSet = setIdx === ex.sets - 1;

        if (allDone) {
          state.exercises[exIdx].collapsed = true;
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

  exerciseList.querySelectorAll('.weight-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const exIdx = Number(e.target.dataset.exercise);
      if (e.target.classList.contains('cardio-time')) {
        state.exercises[exIdx].cardioTime = e.target.value;
      } else if (e.target.classList.contains('cardio-speed')) {
        state.exercises[exIdx].speed = e.target.value;
      } else if (e.target.classList.contains('cardio-incline')) {
        state.exercises[exIdx].incline = e.target.value;
      } else {
        const setIdx = Number(e.target.dataset.set);
        state.exercises[exIdx].weights[setIdx] = e.target.value;
      }
      saveDayState(currentRoutineId, state);
    });
    input.addEventListener('click', (e) => e.stopPropagation());
  });

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

  exerciseList.querySelectorAll('.replace-exercise-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exIdx = Number(btn.dataset.exercise);
      openReplaceModal(exIdx);
    });
  });

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

    const setsHtml = extra.sets.map((s, sIdx) => `
      <div class="set-row extra-set ${s.completed ? 'checked' : ''}" data-extra="${extraIdx}" data-set="${sIdx}">
        <input type="checkbox" id="extraCheck_${extraIdx}_${sIdx}" data-extra="${extraIdx}" data-set="${sIdx}" ${s.completed ? 'checked' : ''}>
        <span class="fake-check">✓</span>
        <div class="set-info">
          <strong>Serie ${sIdx + 1}</strong>
          <div style="display:flex; gap:8px; margin-top:4px; align-items:center;">
            <input class="weight-input extra-weight" data-extra="${extraIdx}" data-set="${sIdx}" placeholder="kg" value="${s.weight || ''}" style="width:70px;" />
            <span style="color:var(--muted); font-size:12px;">×</span>
            <input class="weight-input extra-reps" data-extra="${extraIdx}" data-set="${sIdx}" placeholder="reps" value="${s.reps || ''}" style="width:60px;" />
            <button type="button" class="remove-extra-set" data-extra="${extraIdx}" data-set="${sIdx}" aria-label="Eliminar serie">✕</button>
          </div>
        </div>
      </div>
    `).join('');

    card.innerHTML = `
      ${headHtml}
      ${selectorsHtml}
      ${gifHtml}
      ${extra.sets.length > 0 ? `
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
      populateTypeSelector(typeSel, 'Todos');
      populateExerciseSelectorByType(exSel, 'Todos');
    }
  });

  // Listener: eliminar extra completo
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

  // Listener: cambio de tipo (filtra ejercicios)
  extrasList.querySelectorAll('.extra-type-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const extraIdx = Number(sel.dataset.extra);
      const exSel = extrasList.querySelector(`.extra-ex-select[data-extra="${extraIdx}"]`);
      populateExerciseSelectorByType(exSel, sel.value);

      // Si solo hay un ejercicio para ese tipo, asignarlo directo
      if (exSel.options.length === 1) {
        const exId = Number(exSel.value);
        if (exId) asignarEjercicioAExtra(extraIdx, exId);
      }
    });
  });

  // Listener: cambio de ejercicio
  extrasList.querySelectorAll('.extra-ex-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const extraIdx = Number(sel.dataset.extra);
      const exId = Number(sel.value);
      if (!exId) return;
      asignarEjercicioAExtra(extraIdx, exId);
    });
  });

  // Listener: agregar serie al extra
  extrasList.querySelectorAll('.add-extra-set-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const extraIdx = Number(btn.dataset.extra);
      const extra = state.extras[extraIdx];
      const last = extra.sets[extra.sets.length - 1] || { weight: '', reps: '10' };
      extra.sets.push({ weight: last.weight || '', reps: last.reps || '10', completed: false });
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Listener: eliminar una serie
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

  // Listener: checkbox de serie del extra
  extrasList.querySelectorAll('.set-row.extra-set').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      const extraIdx = Number(row.dataset.extra);
      const setIdx = Number(row.dataset.set);
      state.extras[extraIdx].sets[setIdx].completed = !state.extras[extraIdx].sets[setIdx].completed;
      saveDayState(currentRoutineId, state);
      renderUser();
    });
  });

  // Listener: editar peso/reps del extra
  extrasList.querySelectorAll('.extra-weight, .extra-reps').forEach(input => {
    input.addEventListener('input', (e) => {
      const extraIdx = Number(e.target.dataset.extra);
      const setIdx = Number(e.target.dataset.set);
      if (e.target.classList.contains('extra-weight')) {
        state.extras[extraIdx].sets[setIdx].weight = e.target.value;
      } else {
        state.extras[extraIdx].sets[setIdx].reps = e.target.value;
      }
      saveDayState(currentRoutineId, state);
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

  state.exercises[exIdx].currentExerciseId = newId;
  state.exercises[exIdx].replacedFrom = originalId;
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
    exercises: (currentRoutine.exercises || []).map((ex, idx) => {
      const exState = currentStateData ? currentStateData.exercises[idx] : null;
      const currentExerciseId = exState && exState.currentExerciseId !== undefined
        ? exState.currentExerciseId
        : ex.exerciseId;
      const exData = getExerciseById(currentExerciseId);
      return {
        exerciseId: currentExerciseId,
        replacedFrom: exState ? (exState.replacedFrom || null) : null,
        name: exData ? exData.name : "Ejercicio",
        isCardio: exData ? exData.group === "Cardio" || !!ex.time : false,
        cardioTime: exState ? exState.cardioTime || ex.time || '0 min' : (ex.time || '0 min'),
        weights: exState ? [...exState.weights] : [],
        speed: exState ? exState.speed : 0,
        incline: exState ? exState.incline : 0,
        completed: exState ? [...exState.completed] : []
      };
    }),
    extras: savedExtras.map(e => ({
      exerciseId: e.exerciseId,
      name: e.name,
      sets: e.sets.map(s => ({ weight: s.weight, reps: s.reps, completed: s.completed }))
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

finishRoutineBtn.addEventListener('click', () => completeRoutineAndAdvance(true));
incompleteRoutineBtn.addEventListener('click', () => completeRoutineAndAdvance(false));


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
  state.exercises.forEach(ex => {
    ex.completed = ex.completed.map(() => true);
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

window.updateRestSeconds = function (sec) {
  restSeconds = sec;
};