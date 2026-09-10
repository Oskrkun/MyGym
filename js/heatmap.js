// js/heatmap.js

import { getGlobalHistory, saveGlobalHistory } from './storage.js';

export function renderHeatmap() {
  const heatmapContainer = document.getElementById('heatmapContainer');
  if (!heatmapContainer) return;

  heatmapContainer.innerHTML = '';
  const history = getGlobalHistory();
  const today = new Date();

  // Generar cuadrícula de los últimos 90 días
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';

    if (history[dateStr] && history[dateStr].length > 0) {
      cell.classList.add('completed');
      cell.title = `${dateStr}: ${history[dateStr].length} entrenamiento(s)`;
      cell.addEventListener('click', () => openHistoryDetailModal(dateStr, history[dateStr]));
    } else {
      cell.title = `${dateStr}: Sin entrenamiento`;
    }

    heatmapContainer.appendChild(cell);
  }

  updateStreakCounter(history);
}

function updateStreakCounter(history) {
  const streakEl = document.getElementById('streakCounter');
  if (!streakEl) return;

  let streak = 0;
  let d = new Date();

  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (history[dateStr] && history[dateStr].length > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // Si hoy no ha entrenado aún, verificar el día de ayer
      if (streak === 0) {
        d.setDate(d.getDate() - 1);
        const yesterdayStr = d.toISOString().split('T')[0];
        if (history[yesterdayStr] && history[yesterdayStr].length > 0) {
          streak++;
          d.setDate(d.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  streakEl.textContent = `🔥 Racha actual: ${streak} día(s)`;
}

function openHistoryDetailModal(dateStr, records) {
  const modal = document.getElementById('historyModal');
  const modalBody = document.getElementById('historyModalBody');
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `<h3>Entrenamientos del ${dateStr}</h3>`;

  records.forEach((record, idx) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <h4>${record.routineName || 'Rutina'}</h4>
      <p><small>${new Date(record.timestamp).toLocaleTimeString()}</small></p>
      <ul>
        ${(record.details || []).map(item => `<li><strong>${item.name}</strong>: ${item.summary}</li>`).join('')}
      </ul>
    `;
    modalBody.appendChild(card);
  });

  modal.style.display = 'flex';
}