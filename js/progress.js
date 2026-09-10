function getProfile() {
  try { return JSON.parse(localStorage.getItem('migym_profile')) || { name: '', age: '', gender: '' }; }
  catch(e) { return { name: '', age: '', gender: '' }; }
}

function saveProfileData(profile) {
  localStorage.setItem('migym_profile', JSON.stringify(profile));
}

function initProfileUI() {
  const p = getProfile();
  document.getElementById('profileName').value = p.name || '';
  document.getElementById('profileAge').value = p.age || '';
  document.getElementById('profileGender').value = p.gender || '';
}

document.getElementById('saveProfileBtn').addEventListener('click', () => {
  const profile = {
    name: document.getElementById('profileName').value.trim(),
    age: document.getElementById('profileAge').value,
    gender: document.getElementById('profileGender').value
  };
  saveProfileData(profile);
  alert('Perfil guardado con éxito');
});

function getWeightHistory() {
  try { return JSON.parse(localStorage.getItem('migym_weight_history')) || []; }
  catch(e) { return []; }
}

function saveWeightHistory(list) {
  localStorage.setItem('migym_weight_history', JSON.stringify(list));
}

document.getElementById('addWeightBtn').addEventListener('click', () => {
  const input = document.getElementById('weightInputVal');
  const weight = parseFloat(input.value);
  if (!weight || weight <= 0) return alert('Ingresá un peso válido');

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const history = getWeightHistory();
  history.unshift({ date: dateStr, time: timeStr, weight: weight });
  saveWeightHistory(history);

  input.value = '';
  renderWeightHistory();
});

function renderWeightHistory() {
  const container = document.getElementById('weightHistoryList');
  const history = getWeightHistory();
  
  if (history.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); font-size:13px; text-align:center;">Sin registros de peso aún.</p>';
    return;
  }

  container.innerHTML = history.map((item, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:8px 12px; border-radius:8px; font-size:13px;">
      <div>
        <strong style="color:var(--accent);">${item.weight} kg</strong>
        <span style="color:var(--muted); font-size:11px; margin-left:8px;">${item.date} - ${item.time}</span>
      </div>
      <button type="button" onclick="deleteWeightItem(${idx})" style="background:none; border:none; color:var(--muted); cursor:pointer;">✕</button>
    </div>
  `).join('');
}

function deleteWeightItem(idx) {
  const history = getWeightHistory();
  history.splice(idx, 1);
  saveWeightHistory(history);
  renderWeightHistory();
}

function renderHeatmap() {
  const container = document.getElementById('heatmapContainer');
  if (!container) return;
  container.innerHTML = '';
  const history = getGlobalHistory();
  const today = new Date().getDate();

  for (let dayNum = 1; dayNum <= 31; dayNum++) {
    const session = history[dayNum];
    let className = 'heatmap-day';
    let text = `${dayNum}`;
    
    if (dayNum === today) className += ' today';

    if (session) {
      if (session.status === 'completed') className += ' completed';
      else if (session.status === 'incomplete') className += ' incomplete';
      text += `<span>${(session.routineName || 'D').replace('Día ', 'D')}</span>`;
    }

    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = text;
    div.addEventListener('click', () => showHistoryDetail(dayNum, session));
    container.appendChild(div);
  }
}

function showHistoryDetail(dayNum, session) {
  const historyModalTitle = document.getElementById('historyModalTitle');
  const historyModalContent = document.getElementById('historyModalContent');
  const historyModal = document.getElementById('historyModal');

  historyModalTitle.textContent = `Día ${dayNum} del mes`;
  if (!session) {
    historyModalContent.innerHTML = `<p style="color:var(--muted); text-align:center; padding: 20px;">No hay registros de entrenamiento guardados para este día.</p>`;
  } else {
    let html = `<p><strong>Rutina:</strong> ${session.routineName} (${session.status === 'completed' ? '✅ Completada' : '⏳ Incompleta'})</p><hr style="border-color:var(--line); margin: 10px 0;">`;
    (session.exercises || []).forEach((ex, i) => {
      html += `<div style="margin-bottom: 12px; background:var(--bg); padding:10px; border-radius:10px;"><strong>${i+1}. ${ex.name}</strong><br>`;
      if (ex.isCardio) {
        html += `<small style="color:var(--accent);">⏱️ Tiempo: ${ex.cardioTime || '0 min'}</small>`;
      } else {
        const seriesDetail = (ex.weights || []).map((w, s) => `S${s+1}: <strong>${w || 0}kg</strong>`).join(' | ');
        html += `<small style="color:var(--text); display:block; margin-top:3px;">💪 Pesos: ${seriesDetail}</small>`;
      }
      html += `</div>`;
    });
    historyModalContent.innerHTML = html;
  }
  historyModal.classList.remove('hidden');
}

document.getElementById('closeHistoryModal').addEventListener('click', () => {
  document.getElementById('historyModal').classList.add('hidden');
});