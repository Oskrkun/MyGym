let timerInterval = null;
let remaining = 0;
let paused = false;

const timerOverlay = document.getElementById('timerOverlay');
const timerValue = document.getElementById('timerValue');
const timerMessage = document.getElementById('timerMessage');
const pauseTimer = document.getElementById('pauseTimer');
const addTime = document.getElementById('addTime');
const skipTimer = document.getElementById('skipTimer');

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
        skipTimer.classList.add('hidden'); // Ocultar Saltar
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
    skipTimer.classList.remove('hidden'); // Reaparece Saltar si agregamos tiempo
    pauseTimer.textContent = 'Pausar';
    timerMessage.textContent = 'Recuperá fuerzas para la siguiente serie.';
    startTimer(remaining);
  }
});

skipTimer.addEventListener('click', () => { 
  clearInterval(timerInterval); 
  timerOverlay.classList.add('hidden'); 
});