// ==========================================
// progress.js — Vista Progreso
// Perfil + Peso + Heatmap + Gráfica de evolución
// Depende de: apps.js (debe cargarse primero)
// ==========================================

(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ==========================================
  // 1. REFERENCIAS DOM
  // ==========================================

  const progressView          = $('progressView');

  // Perfil
  const profileCard           = $('profileCard');
  const profileHead           = $('profileHead');
  const profileChevron        = $('profileChevron');
  const profileDisplayName    = $('profileDisplayName');
  const profileDisplayNick    = $('profileDisplayNick');
  const profileNameInput      = $('profileName');
  const profileNickInput      = $('profileNick');
  const profileSexInput       = $('profileSex');
  const profileHeightInput    = $('profileHeight');
  const profileBirthYearInput = $('profileBirthYear');
  const profileGoalInput      = $('profileGoal');
  const saveProfileBtn        = $('saveProfileBtn');

  // Peso
  const weightCard            = $('weightCard');
  const weightHead            = $('weightHead');
  const weightChevron         = $('weightChevron');
  const weightCurrent         = $('weightCurrent');
  const weightLastDate        = $('weightLastDate');
  const weightGoalMessage     = $('weightGoalMessage');
  const registerWeightBtn     = $('registerWeightBtn');
  const weightModal           = $('weightModal');
  const closeWeightModal      = $('closeWeightModal');
  const weightDateInput       = $('weightDate');
  const weightKgInput         = $('weightKg');
  const weightNoteInput       = $('weightNote');
  const saveWeightBtn         = $('saveWeightBtn');
  const weightChartContainer  = $('weightChartContainer');

  // Historial / Heatmap
  const historyModal          = $('historyModal');
  const historyModalTitle     = $('historyModalTitle');
  const historyModalContent   = $('historyModalContent');
  const closeHistoryModal     = $('closeHistoryModal');
  const monthLabel            = $('monthLabel');
  const prevMonthBtn          = $('prevMonthBtn');
  const nextMonthBtn          = $('nextMonthBtn');
  const todayBtn              = $('todayBtn');

  // ==========================================
  // 2. ESTADO LOCAL
  // ==========================================

  let viewYear  = new Date().getFullYear();
  let viewMonth = new Date().getMonth(); // 0–11

  // ==========================================
  // 3. UTILIDADES
  // ==========================================

  function getAge(birthYear) {
    if (!birthYear) return null;
    const y = Number(birthYear);
    if (!y || y < 1900 || y > new Date().getFullYear()) return null;
    return new Date().getFullYear() - y;
  }

  // ==========================================
  // 4. PERSISTENCIA: PERFIL
  // ==========================================

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem('migym_profile')) || {
        name: '', nickname: '', sex: '', heightCm: null, birthYear: null, goal: ''
      };
    } catch {
      return { name: '', nickname: '', sex: '', heightCm: null, birthYear: null, goal: '' };
    }
  }

  function saveProfile(p) {
    localStorage.setItem('migym_profile', JSON.stringify(p));
  }

  // ==========================================
  // 5. PERSISTENCIA: PESOS
  // ==========================================

  function getWeights() {
    try {
      const arr = JSON.parse(localStorage.getItem('migym_weights')) || [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveWeights(w) {
    localStorage.setItem('migym_weights', JSON.stringify(w));
  }

  // ==========================================
  // 6. TARJETA DE PERFIL
  // ==========================================

  function renderProfileCard() {
    const p = getProfile();

    profileDisplayName.textContent = p.name || 'Sin nombre';

    const age = getAge(p.birthYear);
    const parts = [];
    if (p.nickname) parts.push(`"${p.nickname}"`);
    if (age !== null) parts.push(`${age} años`);
    profileDisplayNick.textContent = parts.length > 0 ? parts.join(' · ') : '—';

    profileNameInput.value      = p.name || '';
    profileNickInput.value      = p.nickname || '';
    profileSexInput.value       = p.sex || '';
    profileHeightInput.value    = p.heightCm || '';
    profileBirthYearInput.value = p.birthYear || '';
    profileGoalInput.value      = p.goal || '';

    profileCard.classList.add('collapsed');
    profileChevron.textContent = '▾';
  }

  function toggleProfileCard() {
    const collapsed = profileCard.classList.toggle('collapsed');
    profileChevron.textContent = collapsed ? '▾' : '▴';
  }

  function handleSaveProfile() {
    const p = {
      name:      profileNameInput.value.trim(),
      nickname:  profileNickInput.value.trim(),
      sex:       profileSexInput.value,
      heightCm:  profileHeightInput.value ? Number(profileHeightInput.value) : null,
      birthYear: profileBirthYearInput.value ? Number(profileBirthYearInput.value) : null,
      goal:      profileGoalInput.value
    };
    saveProfile(p);
    renderProfileCard();
    renderWeightCard();
    alert('Perfil guardado');
  }

  // ==========================================
  // 7. TARJETA DE PESO
  // ==========================================

  function renderWeightCard() {
    if (weightCard) weightCard.classList.add('collapsed');
    if (weightChevron) weightChevron.textContent = '▾';

    const weights = getWeights();

    if (weights.length === 0) {
      weightCurrent.textContent  = '—';
      weightLastDate.textContent = 'Sin registros';
      if (weightGoalMessage) weightGoalMessage.style.display = 'none';
      return;
    }

    const last = weights[weights.length - 1];
    weightCurrent.textContent = `${last.kg} kg`;

    const d = new Date(last.date + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    weightLastDate.textContent = `Última pesada: ${dd}/${mm}/${d.getFullYear()}`;

    // Mensaje contextual según goal (solo con 2+ registros)
    if (weightGoalMessage) {
      const profile = getProfile();
      const goal = profile.goal;

      if (!goal || weights.length < 2) {
        weightGoalMessage.style.display = 'none';
        weightGoalMessage.textContent = '';
      } else {
        const first = weights[0].kg;
        const lastKg = weights[weights.length - 1].kg;
        const diff = lastKg - first;
        const sign = diff >= 0 ? '+' : '';
        const absDiff = Math.abs(diff).toFixed(1);

        let msg = '';
        let color = 'var(--muted)';

        if (goal === 'bajar') {
          if (diff < -0.1) {
            msg = `Vas bien: ${sign}${diff.toFixed(1)} kg desde el inicio (${absDiff} kg menos)`;
            color = 'var(--success)';
          } else if (diff > 0.1) {
            msg = `Ojo: subiste ${sign}${diff.toFixed(1)} kg desde el inicio`;
            color = 'var(--warning)';
          } else {
            msg = 'Peso estable. Buen momento para ajustar dieta o actividad.';
            color = 'var(--muted)';
          }
        } else if (goal === 'subir') {
          if (diff > 0.1) {
            msg = `Vas bien: ${sign}${diff.toFixed(1)} kg desde el inicio (${absDiff} kg más)`;
            color = 'var(--success)';
          } else if (diff < -0.1) {
            msg = `Ojo: bajaste ${diff.toFixed(1)} kg desde el inicio`;
            color = 'var(--warning)';
          } else {
            msg = 'Peso estable. Necesitás más calorías para subir.';
            color = 'var(--muted)';
          }
        } else if (goal === 'mantener') {
          if (Math.abs(diff) <= 1) {
            msg = `Estable dentro del rango (${sign}${diff.toFixed(1)} kg desde el inicio)`;
            color = 'var(--success)';
          } else {
            msg = `Fuera del rango: ${sign}${diff.toFixed(1)} kg desde el inicio`;
            color = 'var(--warning)';
          }
        }

        if (msg) {
          weightGoalMessage.style.display = 'block';
          weightGoalMessage.style.color = color;
          weightGoalMessage.textContent = msg;
        } else {
          weightGoalMessage.style.display = 'none';
        }
      }
    }
  }

  function toggleWeightCard() {
    if (!weightCard) return;
    const collapsed = weightCard.classList.toggle('collapsed');
    weightChevron.textContent = collapsed ? '▾' : '▴';
  }

  // ==========================================
  // 8. MODAL DE REGISTRO DE PESO
  // ==========================================

  function openWeightModal() {
    const today = new Date().toISOString().slice(0, 10);
    weightDateInput.value = today;
    weightKgInput.value   = '';
    weightNoteInput.value = '';
    weightModal.classList.remove('hidden');
  }

  function closeWeightModalFn() {
    weightModal.classList.add('hidden');
  }

  function handleSaveWeight() {
    const date = weightDateInput.value;
    const kg   = Number(weightKgInput.value);
    const note = weightNoteInput.value.trim();

    if (!date) {
      alert('Elegí una fecha');
      return;
    }
    if (!kg || kg <= 0 || kg > 400) {
      alert('Ingresá un peso válido (kg)');
      return;
    }

    const weights = getWeights();
    const existingIdx = weights.findIndex(w => w.date === date);
    const nuevo = { date, kg, note };

    if (existingIdx >= 0) {
      if (!confirm(`Ya hay un registro del ${date} (${weights[existingIdx].kg} kg). ¿Reemplazarlo?`)) {
        return;
      }
      weights[existingIdx] = nuevo;
    } else {
      weights.push(nuevo);
    }

    weights.sort((a, b) => a.date.localeCompare(b.date));
    saveWeights(weights);

    closeWeightModalFn();
    renderWeightCard();
    renderWeightChart();
  }

  // ==========================================
  // 9. HEATMAP
  // ==========================================

  function renderHeatmap() {
    const container = $('heatmapContainer');
    if (!container) return;

    container.innerHTML = '';
    const history = (typeof getGlobalHistory === 'function') ? getGlobalHistory() : {};

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (monthLabel) {
      monthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;
    }

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayReal = new Date();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const fullDateKey = `${viewYear}-${mm}-${dd}`;

      const session = history[fullDateKey];

      let className = 'heatmap-day';

      const isToday = dayNum === todayReal.getDate() &&
                      viewMonth === todayReal.getMonth() &&
                      viewYear === todayReal.getFullYear();

      if (isToday) className += ' today';

      let text = `${dayNum}`;

      if (session) {
        if (session.status === 'completed') className += ' completed';
        else if (session.status === 'incomplete') className += ' incomplete';
        text += `<span>${session.routineName.replace('Día ', 'D')}</span>`;
      }

      const div = document.createElement('div');
      div.className = className;
      div.innerHTML = text;

      div.addEventListener('click', () => {
        showHistoryDetail(fullDateKey, dayNum, session);
      });

      container.appendChild(div);
    }
  }

  // ==========================================
  // 10. MODAL DE DETALLE DE DÍA
  // ==========================================

  function showHistoryDetail(fullDateKey, dayNum, session) {
    historyModalTitle.textContent = `Fecha: ${fullDateKey}`;

    const weights = getWeights();
    const weightEntry = weights.find(w => w.date === fullDateKey);

    if (!session && !weightEntry) {
      historyModalContent.innerHTML = `<p style="color:var(--muted); text-align:center; padding: 20px;">No hay registros guardados para esta fecha.</p>`;
      historyModal.classList.remove('hidden');
      return;
    }

    let html = '';

    if (weightEntry) {
      const kgText = `${weightEntry.kg} kg`;
      html += `
        <div style="margin-bottom: 12px; background:var(--bg); padding:12px; border-radius:10px; border-left:3px solid var(--accent);">
          <strong style="color:var(--accent);">⚖️ Peso registrado</strong><br>
          <span style="font-size:18px; font-weight:800; color:var(--text);">${kgText}</span>
          ${weightEntry.note ? `<br><small style="color:var(--muted);">${weightEntry.note}</small>` : ''}
        </div>
      `;
    }

    if (session) {
      html += `<p><strong>Rutina:</strong> ${session.routineName} (${session.status === 'completed' ? '✅ Completada' : '⏳ Incompleta'})</p>`;
      html += `<hr style="border-color:var(--line); margin: 10px 0;">`;

      session.exercises.forEach((ex, i) => {
        html += `<div style="margin-bottom: 12px; background:var(--bg); padding:10px; border-radius:10px;"><strong>${i + 1}. ${ex.name}</strong><br>`;

        if (ex.isCardio) {
          const timeVal = ex.cardioTime && ex.cardioTime.trim() !== '' ? ex.cardioTime : '0 min';
          html += `<small style="color:var(--accent);">⏱️ Tiempo: ${timeVal}</small>`;
          if (ex.speed || ex.incline) {
            html += `<br><small style="color:var(--muted);">Velocidad: ${ex.speed || 0} | Inclinación: ${ex.incline || 0}</small>`;
          }
        } else {
          if (ex.weights && ex.weights.length > 0) {
            const seriesDetail = ex.weights.map((w, s) => {
              const pesoText = w && String(w).trim() !== '' ? `${w}kg` : '0kg';
              return `S${s + 1}: <strong>${pesoText}</strong>`;
            }).join(' | ');
            html += `<small style="color:var(--text); display:block; margin-top:3px;">💪 Pesos: ${seriesDetail}</small>`;
          } else {
            html += `<small style="color:var(--muted);">Sin registros de peso (0kg)</small>`;
          }
        }
        html += `</div>`;
      });
    }

    historyModalContent.innerHTML = html;
    historyModal.classList.remove('hidden');
  }

  // ==========================================
  // 11. GRÁFICA DE PESO (SVG puro)
  // ==========================================

  function renderWeightChart() {
    const container = weightChartContainer;
    if (!container) return;

    const weights = getWeights();

    if (weights.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);text-align:center; padding:20px;">Sin registros de peso todavía. Usá "+ Registrar peso" para empezar.</p>';
      return;
    }

    if (weights.length === 1) {
      container.innerHTML = `<p style="color:var(--muted);text-align:center; padding:20px;">Un solo registro: <strong style="color:var(--text);">${weights[0].kg} kg</strong> el ${weights[0].date}.<br>Necesitás al menos 2 para ver una tendencia.</p>`;
      return;
    }

    const W = Math.max(container.clientWidth || 600, 280);
    const H = 220;
    const PAD = { top: 20, right: 20, bottom: 32, left: 42 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const kgs = weights.map(w => w.kg);
    const minKg = Math.min(...kgs) - 0.5;
    const maxKg = Math.max(...kgs) + 0.5;
    const rangeKg = maxKg - minKg || 1;

    const t0 = new Date(weights[0].date + 'T00:00:00').getTime();
    const t1 = new Date(weights[weights.length - 1].date + 'T00:00:00').getTime();
    const rangeT = t1 - t0 || 1;

    const x = t  => PAD.left + ((t - t0) / rangeT) * innerW;
    const y = kg => PAD.top + (1 - (kg - minKg) / rangeKg) * innerH;

    const points = weights.map(w => ({
      cx: x(new Date(w.date + 'T00:00:00').getTime()),
      cy: y(w.kg),
      kg: w.kg,
      date: w.date
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ');

    const first = weights[0].kg;
    const last  = weights[weights.length - 1].kg;
    const diff  = last - first;
    const trendColor = diff < 0 ? '#22c55e' : diff > 0 ? '#eab308' : '#8e949d';

    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
      const gy = PAD.top + (i / 4) * innerH;
      const val = (maxKg - (i / 4) * rangeKg).toFixed(1);
      gridLines += `
        <line x1="${PAD.left}" y1="${gy}" x2="${W - PAD.right}" y2="${gy}" stroke="#30343b" stroke-dasharray="3 3" />
        <text x="${PAD.left - 6}" y="${gy + 4}" fill="#8e949d" font-size="10" text-anchor="end">${val}</text>
      `;
    }

    const labelIdxs = Array.from(new Set([0, Math.floor(points.length / 2), points.length - 1]));
    const dateLabels = labelIdxs.map(i => {
      const p = points[i];
      const d = new Date(p.date + 'T00:00:00');
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `<text x="${p.cx.toFixed(1)}" y="${H - 8}" fill="#8e949d" font-size="10" text-anchor="middle">${label}</text>`;
    }).join('');

    const circles = points.map(p => `
      <circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="5" fill="${trendColor}" stroke="#0c0d0f" stroke-width="2">
        <title>${p.date}: ${p.kg} kg</title>
      </circle>
    `).join('');

    const sign = diff >= 0 ? '+' : '';

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; display:block;">
        ${gridLines}
        <path d="${pathD}" fill="none" stroke="${trendColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        ${circles}
        ${dateLabels}
      </svg>
      <p style="text-align:center; color:var(--muted); font-size:13px; margin-top:10px;">
        Desde <strong style="color:var(--text);">${first} kg</strong>
        hasta <strong style="color:${trendColor};">${last} kg</strong>
        (${sign}${diff.toFixed(1)} kg en ${weights.length} registros)
      </p>
    `;
  }

  // ==========================================
  // 12. LISTENERS
  // ==========================================

  if (profileHead)   profileHead.addEventListener('click', toggleProfileCard);
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', handleSaveProfile);

  if (weightHead) weightHead.addEventListener('click', toggleWeightCard);

  if (registerWeightBtn) registerWeightBtn.addEventListener('click', openWeightModal);
  if (closeWeightModal)  closeWeightModal.addEventListener('click', closeWeightModalFn);
  if (saveWeightBtn)     saveWeightBtn.addEventListener('click', handleSaveWeight);
  if (weightModal) {
    weightModal.addEventListener('click', (e) => {
      if (e.target === weightModal) closeWeightModalFn();
    });
  }

  if (closeHistoryModal) closeHistoryModal.addEventListener('click', () => historyModal.classList.add('hidden'));
  if (historyModal) {
    historyModal.addEventListener('click', (e) => {
      if (e.target === historyModal) historyModal.classList.add('hidden');
    });
  }

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderHeatmap();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderHeatmap();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const d = new Date();
      viewYear = d.getFullYear();
      viewMonth = d.getMonth();
      renderHeatmap();
    });
  }

  let _resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      if (progressView && !progressView.classList.contains('hidden')) {
        renderWeightChart();
      }
    }, 150);
  });

  // ==========================================
  // 13. API PÚBLICA
  // ==========================================

  window.renderProgressView = function () {
    renderProfileCard();
    renderWeightCard();
    renderHeatmap();
    renderWeightChart();
  };

  if (progressView && !progressView.classList.contains('hidden')) {
    window.renderProgressView();
  }

})();