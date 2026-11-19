// ==========================================
// admin.js — Panel de administración + Backup JSON + Días de descanso + Paleta
// Depende de: core.js
// ==========================================

// ==========================================
// 1. VARIABLES DE ESTADO
// ==========================================

let editingRoutineIndex = -1;
let tempExercises = [];
const PALETTE_STORAGE_KEY = 'migym_theme_palette';
let selectedPaletteMode = 'lime_negro';


// ==========================================
// 2. REFS DOM
// ==========================================

const routineListAdmin     = $('routineListAdmin');
const routineForm          = $('routineForm');
const formTitle            = $('formTitle');
const routineName          = $('routineName');
const routineExerciseType  = $('routineExerciseType');
const exerciseSelector     = $('exerciseSelector');
const addExerciseBtn       = $('addExerciseBtn');
const routineExercisesList = $('routineExercisesList');
const submitRoutine        = $('submitRoutine');
const cancelRoutine        = $('cancelRoutine');
const addRoutineBtn        = $('addRoutineBtn');

const restInput = $('restInput');
const saveRest  = $('saveRest');

const paletteOptions      = $('paletteOptions');
const randomPaletteStatus = $('randomPaletteStatus');
const savePaletteBtn      = $('savePaletteBtn');

const saveRestDaysBtn = $('saveRestDaysBtn');

const btnExportar   = $('btnExportar');
const btnImportar   = $('btnImportar');
const inputImportar = $('inputImportar');


// ==========================================
// 3. ACORDEÓN DE SECCIONES DE ADMIN
// ==========================================

function setupAdminAccordions() {
  const sections = [
    { card: 'adminRoutinesCard', head: 'adminRoutinesHead', chevron: 'adminRoutinesChevron' },
    { card: 'adminRestTimeCard', head: 'adminRestTimeHead', chevron: 'adminRestTimeChevron' },
    { card: 'adminPaletteCard',  head: 'adminPaletteHead',  chevron: 'adminPaletteChevron'  },
    { card: 'adminRestDaysCard', head: 'adminRestDaysHead', chevron: 'adminRestDaysChevron' },
    { card: 'adminBackupCard',   head: 'adminBackupHead',   chevron: 'adminBackupChevron'   }
  ];

  sections.forEach(({ card, head, chevron }) => {
    const cardEl = $(card);
    const headEl = $(head);
    const chevEl = $(chevron);
    if (!cardEl || !headEl) return;

    cardEl.classList.add('collapsed');
    if (chevEl) chevEl.textContent = '▾';

    headEl.addEventListener('click', () => {
      const isCollapsed = cardEl.classList.toggle('collapsed');
      if (chevEl) chevEl.textContent = isCollapsed ? '▾' : '▴';
    });
  });
}


// ==========================================
// 4. LISTADO Y CRUD DE RUTINAS
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

        const newPointer = currentRoutines.length > 0 ? currentRoutines[0].id : 1;
        saveCurrentRoutinePointer(newPointer);

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
  populateExerciseSelector('Todos');
  if (routineExerciseType) routineExerciseType.value = 'Todos';
}

function populateExerciseSelector(tipo) {
  if (routineExerciseType && routineExerciseType.options.length === 0) {
    routineExerciseType.innerHTML = '';
    getTiposDeEjercicio().forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      routineExerciseType.appendChild(opt);
    });
    routineExerciseType.value = 'Todos';
  }

  const tipoFiltro = tipo || (routineExerciseType ? routineExerciseType.value : 'Todos') || 'Todos';
  exerciseSelector.innerHTML = '<option value="">Seleccionar ejercicio...</option>';
  const all = getExercises();
  const filtered = tipoFiltro === 'Todos'
    ? all
    : all.filter(ex => {
        const groups = ex.groups || (ex.group ? [ex.group] : []);
        return groups.includes(tipoFiltro);
      });
  filtered.forEach(ex => {
    const option = document.createElement('option');
    option.value = ex.id;
    const grupos = (ex.groups || [ex.group]).join(', ');
    option.textContent = `${ex.name} (${grupos})`;
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

  const newPointer = routines.length > 0 ? routines[0].id : 1;
  saveCurrentRoutinePointer(newPointer);

  if (typeof window.refreshRoutineView === 'function') {
    window.refreshRoutineView();
  }
});

cancelRoutine.addEventListener('click', () => { routineForm.classList.add('hidden'); });
addRoutineBtn.addEventListener('click', () => openRoutineForm());

if (routineExerciseType) {
  routineExerciseType.addEventListener('change', () => {
    populateExerciseSelector(routineExerciseType.value);
  });
}


// ==========================================
// 5. TIEMPO DE DESCANSO
// ==========================================

restInput.value = getRestSeconds();
saveRest.addEventListener('click', () => {
  const sec = Number(restInput.value);
  if (sec > 0) {
    setRestSeconds(sec);
    if (typeof window.updateRestSeconds === 'function') {
      window.updateRestSeconds(sec);
    }
    alert('Tiempo de descanso actualizado');
  }
});


// ==========================================
// 6. DÍAS DE DESCANSO
// ==========================================

function renderRestDays() {
  const actuales = getRestDaysActuales();
  [0, 1, 2, 3, 4, 5, 6].forEach(d => {
    const cb = document.getElementById('restDay_' + d);
    if (cb) cb.checked = actuales.includes(d);
  });
}

saveRestDaysBtn.addEventListener('click', () => {
  const selected = [];
  [0, 1, 2, 3, 4, 5, 6].forEach(d => {
    const cb = document.getElementById('restDay_' + d);
    if (cb && cb.checked) selected.push(d);
  });
  saveRestDays(selected);
  alert('Días de descanso guardados. Los cambios solo afectan a los días nuevos.');
  if (typeof window.renderProgressView === 'function') {
    const pv = document.getElementById('progressView');
    if (pv && !pv.classList.contains('hidden')) {
      window.renderProgressView();
    }
  }
});

renderRestDays();


// ==========================================
// 7. EXPORT / IMPORT JSON
// ==========================================

btnExportar.addEventListener('click', () => {
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      backup[key] = JSON.parse(localStorage.getItem(key));
    } catch {
      backup[key] = localStorage.getItem(key);
    }
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const d = new Date();
  const fecha = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
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
          const val = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
          localStorage.setItem(key, val);
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
// 8. CATÁLOGO Y GESTIÓN DE PALETAS DE COLORES
//    (Agregá, quitá o editá paletas acá abajo)
// ==========================================

const PALETTES = [
  {
    id: 'verdes',
    name: 'Verde Bosque',
    squares: ['#22c55e', '#10b981', '#064e3b'],
    vars: {
      '--bg': '#09110d',
      '--card': '#111d17',
      '--card-2': '#182920',
      '--text': '#f0fdf4',
      '--muted': '#8ba898',
      '--line': '#243b2f',
      '--accent': '#22c55e',
      '--accent-dark': '#16a34a',
      '--violet': '#34d399',
      '--violet-dark': '#059669',
      '--rest-day': '#132019'
    }
  },
  {
    id: 'azul',
    name: 'Azul Eléctrico',
    squares: ['#38bdf8', '#2563eb', '#1e3a8a'],
    vars: {
      '--bg': '#090e16',
      '--card': '#111927',
      '--card-2': '#182438',
      '--text': '#f0f7ff',
      '--muted': '#8da2be',
      '--line': '#25354d',
      '--accent': '#38bdf8',
      '--accent-dark': '#0284c7',
      '--violet': '#60a5fa',
      '--violet-dark': '#2563eb',
      '--rest-day': '#131d2c'
    }
  },
  {
    id: 'lime_negro',
    name: 'Lima y Negro (Base)',
    squares: ['#b8ff35', '#0c0d0f', '#a78bfa'],
    vars: {
      '--bg': '#0c0d0f',
      '--card': '#17191d',
      '--card-2': '#202329',
      '--text': '#f4f5f6',
      '--muted': '#8e949d',
      '--line': '#30343b',
      '--accent': '#b8ff35',
      '--accent-dark': '#8fc91e',
      '--violet': '#a78bfa',
      '--violet-dark': '#7c5cf0',
      '--rest-day': '#1a1d22'
    }
  },
  {
    id: 'rosa',
    name: 'Rosa Neón',
    squares: ['#f472b6', '#ec4899', '#fbcfe8'],
    vars: {
      '--bg': '#120a0f',
      '--card': '#1f121a',
      '--card-2': '#2c1925',
      '--text': '#fdf2f8',
      '--muted': '#b38fa3',
      '--line': '#422637',
      '--accent': '#f472b6',
      '--accent-dark': '#db2777',
      '--violet': '#fb7185',
      '--violet-dark': '#e11d48',
      '--rest-day': '#23141d'
    }
  },
  {
    id: 'violeta',
    name: 'Violeta Cósmico',
    squares: ['#a78bfa', '#7c3aed', '#ddd6fe'],
    vars: {
      '--bg': '#0d0a14',
      '--card': '#171224',
      '--card-2': '#221a33',
      '--text': '#f5f3ff',
      '--muted': '#9e92b8',
      '--line': '#34294d',
      '--accent': '#a78bfa',
      '--accent-dark': '#7c3aed',
      '--violet': '#c084fc',
      '--violet-dark': '#9333ea',
      '--rest-day': '#1b1529'
    }
  },
  {
    id: 'amarillo_solar',
    name: 'Amarillo Solar',
    squares: ['#facc15', '#eab308', '#fef08a'],
    vars: {
      '--bg': '#100e08',
      '--card': '#1c180e',
      '--card-2': '#282214',
      '--text': '#fefce8',
      '--muted': '#b5a97d',
      '--line': '#3d351e',
      '--accent': '#facc15',
      '--accent-dark': '#eab308',
      '--violet': '#fde047',
      '--violet-dark': '#ca8a04',
      '--rest-day': '#1f1b10'
    }
  },
  {
    id: 'naranja_energia',
    name: 'Naranja Energía',
    squares: ['#fb923c', '#ea580c', '#fed7aa'],
    vars: {
      '--bg': '#120c08',
      '--card': '#20150e',
      '--card-2': '#2d1e14',
      '--text': '#fff7ed',
      '--muted': '#ba9b86',
      '--line': '#422c1e',
      '--accent': '#fb923c',
      '--accent-dark': '#ea580c',
      '--violet': '#fdba74',
      '--violet-dark': '#c2410c',
      '--rest-day': '#241810'
    }
  },
  {
    id: 'menta_glacial',
    name: 'Menta Glacial',
    squares: ['#2dd4bf', '#0d9488', '#99f6e4'],
    vars: {
      '--bg': '#081112',
      '--card': '#0f1d1f',
      '--card-2': '#16292c',
      '--text': '#f0fdfa',
      '--muted': '#85a9ad',
      '--line': '#213c40',
      '--accent': '#2dd4bf',
      '--accent-dark': '#0d9488',
      '--violet': '#5eead4',
      '--violet-dark': '#0f766e',
      '--rest-day': '#112023'
    }
  },
  {
    id: 'random',
    name: '🎲 Aleatoria (cambia al abrir)',
    squares: ['#22c55e', '#38bdf8', '#facc15', '#f472b6'],
    isRandom: true
  }
];

function initPaletteSystem() {
  const fixedPalettes = PALETTES.filter(p => !p.isRandom);

  function findFixedPalette(id) {
    return fixedPalettes.find(p => p.id === id) || fixedPalettes.find(p => p.id === 'lime_negro') || fixedPalettes[0];
  }

  function readSavedConfig() {
    try {
      const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (!raw) return { mode: 'lime_negro', lastRandomId: null };
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const mode = parsed.mode || parsed.id || 'lime_negro';
        return { mode, lastRandomId: parsed.lastRandomId || null };
      }
      if (typeof parsed === 'string') {
        return { mode: parsed, lastRandomId: null };
      }
    } catch {
      const rawStr = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (rawStr) return { mode: rawStr, lastRandomId: null };
    }
    return { mode: 'lime_negro', lastRandomId: null };
  }

  function applyCssVars(paletteObj) {
    if (!paletteObj || !paletteObj.vars) return;
    const root = document.documentElement;
    Object.entries(paletteObj.vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });
  }

  function pickRandomPalette(excludeId) {
    const pool = fixedPalettes.filter(p => p.id !== excludeId);
    const list = pool.length > 0 ? pool : fixedPalettes;
    return list[Math.floor(Math.random() * list.length)];
  }

  function updateRowChecks(activeMode) {
    if (!paletteOptions) return;
    paletteOptions.querySelectorAll('.palette-row').forEach(row => {
      const isSelected = row.dataset.palette === activeMode;
      row.classList.toggle('active', isSelected);
      const checkEl = row.querySelector('.palette-check');
      if (checkEl) checkEl.textContent = isSelected ? '[✓]' : '[ ]';
    });
  }

  function previewOrActivateMode(mode, persistRandomHistory = false) {
    selectedPaletteMode = mode;
    updateRowChecks(mode);

    if (mode === 'random') {
      const saved = readSavedConfig();
      const chosen = pickRandomPalette(saved.lastRandomId);
      applyCssVars(chosen);
      if (randomPaletteStatus) {
        randomPaletteStatus.textContent = `Paleta activa ahora: ${chosen.name}`;
      }
      if (persistRandomHistory) {
        localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify({
          mode: 'random',
          lastRandomId: chosen.id
        }));
      }
      return chosen;
    }

    const fixed = findFixedPalette(mode);
    applyCssVars(fixed);
    if (randomPaletteStatus) randomPaletteStatus.textContent = '';
    return fixed;
  }

  function renderPaletteRows() {
    if (!paletteOptions) return;
    paletteOptions.innerHTML = '';

    PALETTES.forEach(p => {
      const isSelected = p.id === selectedPaletteMode;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'palette-row' + (isSelected ? ' active' : '');
      row.dataset.palette = p.id;
      row.innerHTML = `
        <span class="palette-check">${isSelected ? '[✓]' : '[ ]'}</span>
        <span class="palette-squares">
          ${p.squares.map(c => `<span class="palette-square" style="background:${c};"></span>`).join('')}
        </span>
        <span>${p.name}</span>
      `;
      row.addEventListener('click', () => {
        previewOrActivateMode(p.id, false);
      });
      paletteOptions.appendChild(row);
    });
  }

  if (savePaletteBtn) {
    savePaletteBtn.addEventListener('click', () => {
      const activeObj = previewOrActivateMode(selectedPaletteMode, true);
      if (selectedPaletteMode !== 'random') {
        localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify({
          mode: activeObj.id,
          lastRandomId: null
        }));
      }

      if (typeof window.renderProgressView === 'function') {
        const pv = document.getElementById('progressView');
        if (pv && !pv.classList.contains('hidden')) {
          window.renderProgressView();
        }
      }

      const label = selectedPaletteMode === 'random'
        ? `Paleta Aleatoria (ahora: ${activeObj.name})`
        : activeObj.name;
      alert(`Paleta "${label}" guardada.`);
    });
  }

  // Carga inicial al abrir o refrescar la app
  const saved = readSavedConfig();
  const validMode = PALETTES.some(p => p.id === saved.mode) ? saved.mode : 'lime_negro';
  renderPaletteRows();
  previewOrActivateMode(validMode, validMode === 'random');

  window.applySavedPalette = function () {
    const current = readSavedConfig();
    const mode = PALETTES.some(p => p.id === current.mode) ? current.mode : 'lime_negro';
    renderPaletteRows();
    previewOrActivateMode(mode, false);
  };
}


// ==========================================
// 9. INICIALIZACIÓN Y API PÚBLICA
// ==========================================

setupAdminAccordions();
initPaletteSystem();
window.renderAdminRoutines = renderAdminRoutines;