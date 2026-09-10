// js/timer.js
import { getRestSeconds } from './storage.js';

let timerInterval = null;
let currentSecondsLeft = 0;
let isPaused = false;

export function startRestTimer(onTick, onEnd) {
  stopRestTimer();
  isPaused = false;
  currentSecondsLeft = getRestSeconds();
  
  const timerOverlay = document.getElementById('timerOverlay');
  if (timerOverlay) timerOverlay.style.display = 'flex';

  updateTimerUI(onTick);

  timerInterval = setInterval(() => {
    if (!isPaused) {
      currentSecondsLeft--;
      updateTimerUI(onTick);

      if (currentSecondsLeft <= 0) {
        stopRestTimer();
        playTimerBeep();
        if (onEnd) onEnd();
      }
    }
  }, 1000);
}

export function pauseRestTimer() {
  isPaused = !isPaused;
  const pauseBtn = document.getElementById('pauseTimerBtn');
  if (pauseBtn) pauseBtn.textContent = isPaused ? 'Reanudar' : 'Pausar';
}

export function addTimeRestTimer(seconds = 15) {
  currentSecondsLeft += seconds;
  const display = document.getElementById('timerDisplay');
  if (display) display.textContent = `${currentSecondsLeft}s`;
}

export function stopRestTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isPaused = false;
  const timerOverlay = document.getElementById('timerOverlay');
  if (timerOverlay) timerOverlay.style.display = 'none';
}

function updateTimerUI(onTick) {
  const display = document.getElementById('timerDisplay');
  if (display) display.textContent = `${currentSecondsLeft}s`;
  if (onTick) onTick(currentSecondsLeft);
}

function playTimerBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn("AudioContext no iniciado por interacción de usuario", e);
  }
}