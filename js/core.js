// ==========================================
// core.js — Datos, persistencia y helpers
// Se carga PRIMERO. Todos los demás módulos dependen de este.
// ==========================================

// ==========================================
// 1. BASE DE DATOS Y VALORES POR DEFECTO
// ==========================================

const EXERCISES_DB = [
  { id: 1, name: "Pecho plano c/barra", groups: ["Pecho", "Tríceps", "Hombros"], images: ["gifs/pechoPlanoConBarra.gif"] },
  { id: 2, name: "Pecho inclinado con mancuerna", groups: ["Pecho", "Hombros", "Tríceps"], images: ["gifs/PechoInclinadoConMancuerna.gif"] },
  { id: 3, name: "Jalón dorsal T. abierto", groups: ["Espalda", "Bíceps"], images: ["gifs/JalonDorsalT.Abierto.gif"] },
  { id: 4, name: "Maquina Espalda", groups: ["Espalda"], images: ["gifs/MaquinaEspalda.gif"] },
  { id: 5, name: "Camilla Cuádriceps", groups: ["Cuádriceps"], images: ["gifs/CamillaCuadriceps.gif"] },
  { id: 6, name: "Camilla isquio", groups: ["Isquiotibiales"], images: ["gifs/CamillaIsquio.gif"] },
  { id: 7, name: "Prensa + gemelos", groups: ["Cuádriceps", "Gemelos", "Glúteos"], images: ["gifs/PressPierna.jpg"] },
  { id: 8, name: "Elevaciones Laterales Inclinado", groups: ["Hombros"], images: ["gifs/ElevacionesLateralesInclinado.gif"] },
  { id: 9, name: "Posterior hombros", groups: ["Hombros", "Espalda"], images: ["gifs/PosteriorHombros.gif"] },
  { id: 10, name: "Tríceps P. alta barra", groups: ["Tríceps"], images: ["gifs/TricepsP.AltaBarra.gif"] },
  { id: 11, name: "Tríceps patada burro", groups: ["Tríceps"], images: ["gifs/TrícepsPatadaBurro.gif"] },
  { id: 12, name: "Bíceps P. bajo c/barra", groups: ["Bíceps"], images: ["gifs/BicepsParteBajaConBarra.gif"] },
  { id: 13, name: "Hack frontal", groups: ["Cuádriceps", "Glúteos"], images: ["gifs/HackFrontal.gif"] },
  { id: 14, name: "Hip thrust", groups: ["Glúteos", "Isquiotibiales"], images: ["gifs/HipThrust.gif"] },
  { id: 15, name: "Pullover en Polea Alta", groups: ["Espalda", "Pecho"], images: ["gifs/PulloverEnPoleaAlta.gif"] },
  { id: 16, name: "Remo Horizontal Neutro en Polea", groups: ["Espalda", "Bíceps"], images: ["gifs/RemoHorizontalNeutroEnPolea.gif"] },
  { id: 17, name: "Apertura c/poleas Pecho Medio", groups: ["Pecho"], images: ["gifs/AperturaConPoleasPechoMedio.gif"] },
  { id: 18, name: "Bíceps Martillo", groups: ["Bíceps"], images: ["gifs/BicepsMartillo.gif"] },
  { id: 19, name: "Caminadora", groups: ["Cardio"], images: ["gifs/Caminadora.gif"] },
  { id: 20, name: "Bicicleta fija", groups: ["Cardio"], images: ["gifs/BicicletaFija.gif"] },
  { id: 21, name: "Serrucho c/mancuerna", groups: ["Espalda", "Bíceps"], images: ["gifs/SerruchoConMancuerna.gif"] },
  { id: 22, name: "Banco Scott Con Barra W", groups: ["Bíceps"], images: ["gifs/BancoScottConBarraW.gif"] },
  { id: 23, name: "Dominada Abierta", groups: ["Espalda", "Bíceps"], images: ["gifs/DominadaAbierta.gif"] },
  { id: 24, name: "Abdominal inclinado", groups: ["Core"], images: ["gifs/abdominalInclinado.gif"] },
  { id: 25, name: "Peso Muerto Rumano", groups: ["Isquiotibiales", "Glúteos", "Espalda"], images: ["gifs/pesoMuertoRumano.gif"] },
  { id: 26, name: "Plancha", groups: ["Core"], images: ["gifs/Plancha.gif"] },
  { id: 27, name: "Flexiones", groups: ["Pecho", "Tríceps", "Hombros"], images: ["gifs/flexionespecho.gif"] }
];

const DEFAULT_ROUTINES = [
  { id: 1, name: "Rutina 1", exercises: [{ exerciseId: 1, sets: 3, reps: 12, weight: "" }, { exerciseId: 2, sets: 3, reps: 12, weight: "" }] },
  { id: 2, name: "Rutina 2", exercises: [{ exerciseId: 3, sets: 3, reps: 12, weight: "" }, { exerciseId: 4, sets: 3, reps: 12, weight: "" }] },
  { id: 3, name: "Rutina 3", exercises: [{ exerciseId: 5, sets: 3, reps: 12, weight: "" }, { exerciseId: 6, sets: 3, reps: 12, weight: "" }] },
  { id: 4, name: "Rutina 4", exercises: [{ exerciseId: 9, sets: 3, reps: 12, weight: "" }, { exerciseId: 10, sets: 3, reps: 12, weight: "" }] },
  { id: 5, name: "Rutina 5", exercises: [{ exerciseId: 12, sets: 3, reps: 12, weight: "" }, { exerciseId: 14, sets: 3, reps: 12, weight: "" }] },
  { id: 6, name: "Rutina 6", exercises: [{ exerciseId: 19, sets: 1, reps: 0, time: "20 min", weight: "", speed: 8, incline: 2 }] }
];

const DEFAULT_REST_SECONDS = 60;


// ==========================================
// 2. HELPERS
// ==========================================

const $ = id => document.getElementById(id);

function nombreRutinaParaMostrar(session) {
  if (session.routineId) {
    const routines = getRoutines();
    const r = routines.find(x => x.id === session.routineId);
    if (r) return r.name;
  }
  return session.routineName || 'Rutina';
}

function getTiposDeEjercicio() {
  const tipos = new Set();
  EXERCISES_DB.forEach(ex => {
    const groups = ex.groups || (ex.group ? [ex.group] : []);
    groups.forEach(g => tipos.add(g));
  });
  return ['Todos', ...Array.from(tipos).sort()];
}

/**
 * Devuelve el array de grupos musculares de un ejercicio.
 * Compatibilidad: si el ejercicio tiene `group` (string), lo devuelve en un array.
 */
function getGruposDeEjercicio(exercise) {
  if (!exercise) return [];
  if (Array.isArray(exercise.groups)) return exercise.groups;
  if (exercise.group) return [exercise.group];
  return [];
}

/**
 * Devuelve el peso de la última serie registrada para un exerciseId,
 * buscando en todas las sesiones del historial (rutina + extras),
 * de la más reciente a la más antigua.
 */
function getPesoDeUltimaSesion(exerciseId) {
  const history = getGlobalHistory();
  const keys = Object.keys(history).sort().reverse();

  for (const key of keys) {
    const session = history[key];

    // Buscar en ejercicios de rutina
    const exs = session.exercises || [];
    for (const ex of exs) {
      if (ex.exerciseId === exerciseId && Array.isArray(ex.weights)) {
        for (let i = ex.weights.length - 1; i >= 0; i--) {
          const w = ex.weights[i];
          if (w !== undefined && w !== null && String(w).trim() !== '') {
            return w;
          }
        }
      }
    }

    // Buscar en extras
    const extras = session.extras || [];
    for (const ex of extras) {
      if (ex.exerciseId === exerciseId && Array.isArray(ex.sets)) {
        for (let i = ex.sets.length - 1; i >= 0; i--) {
          const w = ex.sets[i] && ex.sets[i].weight;
          if (w !== undefined && w !== null && String(w).trim() !== '') {
            return w;
          }
        }
      }
    }
  }

  return null;
}


// ==========================================
// 3. PERSISTENCIA (LOCALSTORAGE)
// ==========================================

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


// ==========================================
// 4. ESTADO DEL DÍA — Estructura { exercises, extras }
// ==========================================

/**
 * Devuelve el estado del día con la estructura:
 * {
 *   exercises: [ ... 7 ejercicios ... ],
 *   extras: [ ... extras ... ]
 * }
 *
 * Migra automáticamente del formato viejo (array plano) al nuevo (objeto).
 */
function getDayState(routineId) {
  const key = `migym_state_${routineId}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch {
      parsed = null;
    }

    // Formato nuevo: objeto con .exercises
    if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.exercises)) {
      if (!Array.isArray(parsed.extras)) parsed.extras = [];
      parsed.exercises.forEach(ex => {
        if (!('replacedFrom' in ex)) ex.replacedFrom = null;
      });
      return parsed;
    }

    // Formato viejo: array plano. Migramos.
    if (Array.isArray(parsed)) {
      const migrated = {
        exercises: parsed.map(ex => ({
          completed: ex.completed || [],
          collapsed: ex.collapsed !== undefined ? ex.collapsed : true,
          weights: ex.weights || [],
          cardioTime: ex.cardioTime || '15 min',
          speed: ex.speed || 0,
          incline: ex.incline || 0,
          imageIndex: ex.imageIndex || 0,
          replacedFrom: ex.replacedFrom !== undefined ? ex.replacedFrom : null,
          currentExerciseId: ex.currentExerciseId
        })),
        extras: []
      };
      // Guardar en formato nuevo
      localStorage.setItem(key, JSON.stringify(migrated));
      return migrated;
    }
  }

  // No hay estado guardado: crear uno nuevo
  const routines = getRoutines();
  const routine = routines.find(r => r.id === routineId);
  if (!routine) return null;

  const exercises = routine.exercises.map(ex => ({
    completed: Array(ex.sets).fill(false),
    collapsed: true,
    weights: Array(ex.sets).fill(''),
    cardioTime: ex.time || '15 min',
    speed: ex.speed || 0,
    incline: ex.incline || 0,
    imageIndex: 0,
    replacedFrom: null
  }));

  const state = { exercises, extras: [] };
  saveDayState(routineId, state);
  return state;
}

function saveDayState(routineId, state) {
  localStorage.setItem(`migym_state_${routineId}`, JSON.stringify(state));
}


// ==========================================
// 5. HELPERS DE HISTORIAL
// ==========================================

function getLastSessionForRoutine(routineId, routineName) {
  const history = getGlobalHistory();
  const keys = Object.keys(history).sort().reverse();
  for (const key of keys) {
    const session = history[key];
    if (!session) continue;
    if (session.routineId === routineId) {
      return { date: key, exercises: session.exercises || [], extras: session.extras || [] };
    }
    if (session.routineId === undefined && session.routineName === routineName) {
      return { date: key, exercises: session.exercises || [], extras: session.extras || [] };
    }
  }
  return null;
}

function findExerciseInSession(sessionExercises, exerciseId, exerciseName) {
  if (!Array.isArray(sessionExercises)) return null;
  const byId = sessionExercises.find(ex => ex.exerciseId === exerciseId);
  if (byId) return byId;
  const byName = sessionExercises.find(ex => ex.name === exerciseName);
  return byName || null;
}


// ==========================================
// 6. DÍAS DE DESCANSO
// ==========================================

function getRestDaysForDate(fechaYYYYMMDD) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('migym_rest_days_history')) || [];
  } catch {
    history = [];
  }

  const vigente = history
    .filter(h => h.from <= fechaYYYYMMDD)
    .sort((a, b) => b.from.localeCompare(a.from))[0];

  return vigente ? vigente.days : [];
}

function getRestDaysActuales() {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('migym_rest_days_history')) || [];
  } catch {
    history = [];
  }
  if (history.length === 0) return [];
  const ultimo = history.sort((a, b) => b.from.localeCompare(a.from))[0];
  return ultimo.days || [];
}

function saveRestDays(daysArray) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('migym_rest_days_history')) || [];
  } catch {
    history = [];
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;

  const idxHoy = history.findIndex(h => h.from === todayKey);
  if (idxHoy >= 0) {
    history[idxHoy].days = daysArray;
  } else {
    history.push({ from: todayKey, days: daysArray });
  }

  history.sort((a, b) => a.from.localeCompare(b.from));
  localStorage.setItem('migym_rest_days_history', JSON.stringify(history));
}

function esDiaDeDescanso(fechaYYYYMMDD) {
  const days = getRestDaysForDate(fechaYYYYMMDD);
  if (days.length === 0) return false;
  const d = new Date(fechaYYYYMMDD + 'T00:00:00').getDay();
  return days.includes(d);
}