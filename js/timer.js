// js/timer.js

import { getRestSeconds } from './storage.js';

let timerInterval = null;
let currentSecondsLeft = 0;

export function startRestTimer(onTick, onEnd) {
  stopRestTimer();
  currentSecondsLeft = getRestSeconds();
  
  const timerOverlay = document.getElementById('timerOverlay');
  if (timerOverlay) timerOverlay.style.display = 'flex';

  if (onTick) onTick(currentSecondsLeft);

  timerInterval = setInterval(() => {
    currentSecondsLeft--;
    if (onTick) onTick(currentSecondsLeft);

    if (currentSecondsLeft <= 0) {
      stopRestTimer();
      playTimerBeep();
      if (onEnd) onEnd();
    }
  }, 1000);
}

export function stopRestTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const timerOverlay = document.getElementById('timerOverlay');
  if (timerOverlay) timerOverlay.style.display = 'none';
}

function playTimerBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Tono A5
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn("AudioContext no iniciado por interacción de usuario", e);
  }
}