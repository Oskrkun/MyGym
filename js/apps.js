// ==========================================
// apps.js — Navegación y bootstrap
// Depende de: core.js, routine.js, admin.js, progress.js
// Se carga ÚLTIMO.
// ==========================================

// ==========================================
// 1. REFS DOM
// ==========================================

const userView          = $('userView');
const adminView         = $('adminView');
const progressView      = $('progressView');
const progressToggleBtn = $('progressToggleBtn');
const modeToggle        = $('modeToggle');


// ==========================================
// 2. VARIABLES DE NAVEGACIÓN
// ==========================================

let currentMode = 'user';
let showingProgress = false;


// ==========================================
// 3. CONTROL DE VISTAS
// ==========================================

function updateNavigationVisibility() {
  if (showingProgress) {
    // Vista Progreso
    userView.classList.add('hidden');
    adminView.classList.add('hidden');
    progressView.classList.remove('hidden');

    progressToggleBtn.textContent = '🏋️ Rutina';
    progressToggleBtn.style.display = 'inline-block';

    modeToggle.textContent = '⚙️ Admin';
    modeToggle.style.display = 'inline-block';

    if (dayButton) dayButton.style.display = 'none';

    if (typeof window.renderProgressView === 'function') {
      window.renderProgressView();
    }

  } else if (currentMode === 'admin') {
    // Vista Admin
    userView.classList.add('hidden');
    progressView.classList.add('hidden');
    adminView.classList.remove('hidden');

    progressToggleBtn.textContent = '📊 Progreso';
    progressToggleBtn.style.display = 'inline-block';

    modeToggle.textContent = '🏋️ Rutina';
    modeToggle.style.display = 'inline-block';

    if (dayButton) dayButton.style.display = 'none';

    if (typeof window.renderAdminRoutines === 'function') {
      window.renderAdminRoutines();
    }
    if (restInput) restInput.value = getRestSeconds();

  } else {
    // Vista Rutina
    adminView.classList.add('hidden');
    progressView.classList.add('hidden');
    userView.classList.remove('hidden');

    progressToggleBtn.textContent = '📊 Progreso';
    progressToggleBtn.style.display = 'inline-block';

    modeToggle.textContent = '⚙️ Admin';
    modeToggle.style.display = 'inline-block';

    if (dayButton) dayButton.style.display = 'inline-block';

    if (typeof window.renderUser === 'function') {
      window.renderUser();
    }
  }
}


// ==========================================
// 4. LISTENERS DE NAVEGACIÓN
// ==========================================

progressToggleBtn.addEventListener('click', () => {
  showingProgress = !showingProgress;
  if (showingProgress) {
    currentMode = 'user';
  }
  updateNavigationVisibility();
});

function toggleMode() {
  if (currentMode === 'user') {
    currentMode = 'admin';
  } else {
    currentMode = 'user';
  }
  showingProgress = false;
  updateNavigationVisibility();
}

modeToggle.addEventListener('click', toggleMode);


// ==========================================
// 5. INICIALIZACIÓN
// ==========================================

function init() {
  showingProgress = false;
  currentMode = 'user';
  updateNavigationVisibility();
}

init();