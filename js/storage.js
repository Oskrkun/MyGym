// js/storage.js

import { DEFAULT_ROUTINES, DEFAULT_REST_SECONDS } from './db.js';

export function getRoutines() {
  const stored = localStorage.getItem('migym_routines');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('migym_routines', JSON.stringify(DEFAULT_ROUTINES));
  return DEFAULT_ROUTINES;
}

export function saveRoutines(routines) {
  localStorage.setItem('migym_routines', JSON.stringify(routines));
}

export function getRestSeconds() {
  const stored = localStorage.getItem('migym_rest_seconds');
  return stored ? Number(stored) : DEFAULT_REST_SECONDS;
}

export function setRestSeconds(sec) {
  localStorage.setItem('migym_rest_seconds', String(sec));
}

export function getGlobalHistory() {
  return JSON.parse(localStorage.getItem('migym_global_history')) || {};
}

export function saveGlobalHistory(history) {
  localStorage.setItem('migym_global_history', JSON.stringify(history));
}

export function getCurrentRoutinePointer() {
  const ptr = localStorage.getItem('migym_routine_pointer');
  if (ptr !== null) return Number(ptr);
  const routines = getRoutines();
  return routines.length > 0 ? routines[0].id : 1;
}

export function saveCurrentRoutinePointer(id) {
  localStorage.setItem('migym_routine_pointer', String(id));
}

export function getDayState(routineId) {
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

export function saveDayState(routineId, state) {
  localStorage.setItem(`migym_state_${routineId}`, JSON.stringify(state));
}

export function removeDayState(routineId) {
  localStorage.removeItem(`migym_state_${routineId}`);
}