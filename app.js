const STORAGE_KEY = 'gerakmpp-demo-v1';
const MAX_FILE_SIZE = 500 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const DEMO_ACCOUNTS = [
  { id: 'mpp-1', email: 'mpp1@demo.uthm', password: 'demo1234', full_name: 'Ahli MPP 1', matric_no: 'AI230001', role: 'mpp' },
  { id: 'mpp-2', email: 'mpp2@demo.uthm', password: 'demo1234', full_name: 'Ahli MPP 2', matric_no: 'AI230002', role: 'mpp' },
  { id: 'admin-1', email: 'admin@demo.uthm', password: 'demo1234', full_name: 'Admin Demo', matric_no: '-', role: 'admin' }
];
const state = { user: null, movements: [], claims: [] };
let toastTimeout;

const byId = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return new Intl.DateTimeFormat('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatTime(value) {
  return new Intl.DateTimeFormat('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function formatMoney(value) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(Number(value));
}

function getData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { movements: [], claims: [], leaves: [] };
  const parsed = JSON.parse(stored);
  return {
    movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    claims: Array.isArray(parsed.claims) ? parsed.claims : [],
    leaves: Array.isArray(parsed.leaves) ? parsed.leaves : []
  };
}

function saveData(data = state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      movements: data.movements,
      claims: data.claims,
      leaves: data.leaves
    }));
    return true;
  } catch (error) {
    console.error(error);
    notify('Data demo tidak dapat disimpan. Ruang simpan browser mungkin penuh.', true);
    return false;
  }
}

function notify(message, isError = false) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

function showAuthMessage(message, type = 'error') {
  const element = byId('authMessage');
  element.textContent = message;
  element.className = `message show ${type}`;
}

function showLogin() {
  state.user = null;
  state.movements = [];
  state.claims = [];
  state.leaves = [];
  byId('appShell').hidden = true;
  byId('authScreen').hidden = false;
}

function navigate(pageName) {
  if (pageName === 'admin' && state.user?.role !== 'admin') return;
  document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === `page-${pageName}`));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === pageName));
  const labels = { dashboard: 'Ringkasan', movement: 'Pergerakan', claims: 'Tuntutan', leave: 'Permohonan cuti', admin: 'Kelulusan admin' };
  byId('crumbTitle').textContent = labels[pageName];
  byId('sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function currentDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function profileInitials(name) {
  return String(name || 'MPP').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function statusMarkup(status) {
  const labels = { pending: 'Menunggu', approved: 'Diluluskan', rejected: 'Ditolak' };
  return `<span class="status-pill status-${escapeHtml(status)}">${labels[status] || 'Status tidak diketahui'}</span>`;
}

function myMovements() {
  return state.movements.filter(item => item.user_id === state.user.id)
    .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
}

function myClaims() {
  return state.claims.filter(item => item.user_id === state.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function myLeaves() {
  return state.leaves.filter(item => item.user_id === state.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getMovement(id) {
  return state.movements.find(item => item.id === id);
}

function renderDashboard() {
  const movements = myMovements();
  const claims = myClaims();
  const approved = claims.filter(item => item.status === 'approved');
  byId('pendingLeaveCount').textContent = myLeaves().filter(item => item.status === 'pending').length;
  byId('movementCount').textContent = movements.length;
  byId('pendingCount').textContent = claims.filter(item => item.status === 'pending').length;
  byId('approvedTotal').textContent = formatMoney(approved.reduce((total, item) => total + Number(item.amount), 0));
  byId('recentMovements').innerHTML = movements.length ? movements.slice(0, 4).map(item => `
    <article class="activity-item">
      <div class="activity-dot">↗</div>
      <div class="activity-copy"><strong>${escapeHtml(item.purpose)}</strong><small>${escapeHtml(item.destination)} · ${escapeHtml(item.category)}</small></div>
      <span class="activity-time">${formatDate(item.starts_at)}</span>
    </article>`).join('') : '<div class="empty-state">Belum ada pergerakan direkodkan.</div>';
  byId('recentClaims').innerHTML = claims.length ? claims.slice(0, 4).map(item => `
    <article class="activity-item">
      <div class="activity-dot">▤</div>
      <div class="activity-copy"><strong>${escapeHtml(item.description)}</strong><small>${escapeHtml(item.category)} · ${formatMoney(item.amount)}</small></div>
      ${statusMarkup(item.status)}
    </article>`).join('') : '<div class="empty-state">Belum ada tuntutan dihantar.</div>';
}

function renderMovementSelect() {
  const select = byId('claimMovement');
  const movements = myMovements();
  select.innerHTML = movements.length
    ? `<option value="">Pilih pergerakan</option>${movements.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.purpose)} — ${escapeHtml(item.destination)} (${formatDate(item.starts_at)})</option>`).join('')}`
    : '<option value="">Rekod pergerakan dahulu untuk membuat tuntutan</option>';
  select.disabled = movements.length === 0;
  byId('claimSubmit').disabled = movements.length === 0;
}

function renderMovementHistory() {
  const movements = myMovements();
  byId('movementHistoryCount').textContent = `${movements.length} rekod`;
  byId('movementHistory').innerHTML = movements.length ? movements.map(item => `
    <article class="history-item">
      <div class="history-icon">↗</div>
      <div class="history-main"><strong>${escapeHtml(item.purpose)}</strong><p>${escapeHtml(item.category)} · ${escapeHtml(item.destination)}${item.notes ? ` · ${escapeHtml(item.notes)}` : ''}</p></div>
      <div class="history-meta"><strong>${formatTime(item.starts_at)}</strong><small>${formatDate(item.starts_at)}</small></div>
    </article>`).join('') : '<div class="empty-state">Belum ada rekod pergerakan.<br>Rekod tugasan pertama anda di sini.</div>';
}

function renderClaimHistory() {
  const claims = myClaims();
  const approvedTotal = claims.filter(item => item.status === 'approved').reduce((total, item) => total + Number(item.amount), 0);
  byId('claimPageTotal').textContent = formatMoney(approvedTotal);
  byId('claimHistoryCount').textContent = `${claims.length} rekod`;
  byId('claimHistory').innerHTML = claims.length ? claims.map(item => {
    const movement = getMovement(item.movement_id);
    return `<article class="history-item claim-history-item">
      <div class="history-icon">▤</div>
      <div class="history-main">
        <strong>${escapeHtml(item.description)}</strong>
        <p>${escapeHtml(item.category)} · ${escapeHtml(movement?.purpose || 'Pergerakan')} · ${formatDate(item.purchase_date)}</p>
        <p>Bukti: ${escapeHtml(item.proof_name)}</p>
        ${item.admin_note ? `<p class="review-note">Catatan admin: ${escapeHtml(item.admin_note)}</p>` : ''}
        <button class="proof-button" type="button" data-proof="${escapeHtml(item.id)}">Lihat bukti</button>
      </div>
      <div class="history-meta"><strong class="claim-amount">${formatMoney(item.amount)}</strong><small>${statusMarkup(item.status)}</small></div>
    </article>`;
  }).join('') : '<div class="empty-state">Belum ada tuntutan.<br>Tuntutan perlu dipautkan kepada rekod pergerakan.</div>';
}

function renderLeaveHistory() {
  const leaves = myLeaves();
  byId('leavePendingTotal').textContent = leaves.filter(item => item.status === 'pending').length;
  byId('leaveHistoryCount').textContent = `${leaves.length} rekod`;
  byId('leaveHistory').innerHTML = leaves.length ? leaves.map(item => `
    <article class="history-item">
      <div class="history-icon leave-history-icon">▣</div>
      <div class="history-main">
        <strong>${escapeHtml(item.category)} · ${formatDate(item.start_date)} – ${formatDate(item.end_date)}</strong>
        <p>${escapeHtml(item.reason)}</p>
        ${item.evidence_name ? `<p>Dokumen: ${escapeHtml(item.evidence_name)}</p><button class="proof-button" type="button" data-proof="${escapeHtml(item.id)}" data-proof-type="leave">Lihat dokumen</button>` : ''}
        ${item.admin_note ? `<p class="review-note">Catatan admin: ${escapeHtml(item.admin_note)}</p>` : ''}
      </div>
      <div class="history-meta">${statusMarkup(item.status)}</div>
    </article>`).join('') : '<div class="empty-state">Belum ada permohonan cuti.<br>Hantar permohonan untuk semakan admin.</div>';
}

function renderAdminClaims() {
  const claims = [...state.claims].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  byId('adminClaimCount').textContent = `${claims.length} rekod`;
  byId('adminClaims').innerHTML = claims.length ? claims.map(item => {
    const account = DEMO_ACCOUNTS.find(user => user.id === item.user_id);
    const movement = getMovement(item.movement_id);
    const isPending = item.status === 'pending';
    return `<article class="admin-item">
      <div class="admin-details">
        <h3>${escapeHtml(item.description)}</h3>
        <p class="admin-person">${escapeHtml(account?.full_name || 'Ahli MPP')}${account?.matric_no !== '-' ? ` · ${escapeHtml(account?.matric_no || '')}` : ''}</p>
        <p>${escapeHtml(item.category)} · ${formatDate(item.purchase_date)} · Pergerakan: ${escapeHtml(movement?.purpose || '—')} (${escapeHtml(movement?.destination || '—')})</p>
        <p>Bukti: ${escapeHtml(item.proof_name)}</p>
        ${item.admin_note ? `<p class="review-note">Catatan: ${escapeHtml(item.admin_note)}</p>` : ''}
      </div>
      <div class="admin-right">
        <strong>${formatMoney(item.amount)}</strong>
        ${statusMarkup(item.status)}
        <button class="proof-button" type="button" data-proof="${escapeHtml(item.id)}">Buka bukti</button>
      </div>
      ${isPending ? `<form class="review-form" data-review-form="${escapeHtml(item.id)}">
        <textarea name="admin_note" maxlength="500" placeholder="Catatan admin (wajib jika ditolak)" aria-label="Catatan admin"></textarea>
        <div class="review-actions">
          <button class="review-button approve-button" name="decision" value="approved" type="submit">Lulus</button>
          <button class="review-button reject-button" name="decision" value="rejected" type="submit">Tolak</button>
        </div>
      </form>` : ''}
    </article>`;
  }).join('') : '<div class="empty-state">Belum ada tuntutan untuk disemak.</div>';
}

function renderAdminLeaves() {
  const leaves = [...state.leaves].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  byId('adminLeaveCount').textContent = `${leaves.length} permohonan`;
  byId('adminLeaves').innerHTML = leaves.length ? leaves.map(item => {
    const account = DEMO_ACCOUNTS.find(user => user.id === item.user_id);
    const isPending = item.status === 'pending';
    return `<article class="admin-item">
      <div class="admin-details">
        <h3>${escapeHtml(item.category)} · ${formatDate(item.start_date)} – ${formatDate(item.end_date)}</h3>
        <p class="admin-person">${escapeHtml(account?.full_name || 'Ahli MPP')}${account?.matric_no !== '-' ? ` · ${escapeHtml(account?.matric_no || '')}` : ''}</p>
        <p>${escapeHtml(item.reason)}</p>
        ${item.evidence_name ? `<p>Dokumen sokongan: ${escapeHtml(item.evidence_name)}</p>` : '<p>Tiada dokumen sokongan disertakan.</p>'}
        ${item.admin_note ? `<p class="review-note">Catatan: ${escapeHtml(item.admin_note)}</p>` : ''}
      </div>
      <div class="admin-right">
        ${statusMarkup(item.status)}
        ${item.evidence_name ? `<button class="proof-button" type="button" data-proof="${escapeHtml(item.id)}" data-proof-type="leave">Buka dokumen</button>` : ''}
      </div>
      ${isPending ? `<form class="review-form" data-review-leave="${escapeHtml(item.id)}">
        <textarea name="admin_note" maxlength="500" placeholder="Catatan admin (wajib jika ditolak)" aria-label="Catatan admin untuk permohonan cuti"></textarea>
        <div class="review-actions">
          <button class="review-button approve-button" name="decision" value="approved" type="submit">Lulus</button>
          <button class="review-button reject-button" name="decision" value="rejected" type="submit">Tolak</button>
        </div>
      </form>` : ''}
    </article>`;
  }).join('') : '<div class="empty-state">Belum ada permohonan cuti untuk disemak.</div>';
}

function render() {
  renderDashboard();
  renderMovementSelect();
  renderMovementHistory();
  renderClaimHistory();
  renderLeaveHistory();
  if (state.user.role === 'admin') {
    renderAdminClaims();
    renderAdminLeaves();
  }
}

function openProof(recordId, recordType) {
  const record = recordType === 'leave'
    ? state.leaves.find(item => item.id === recordId)
    : state.claims.find(item => item.id === recordId);
  if (!record?.proof_data) {
    notify('Dokumen tidak ditemui dalam data demo.', true);
    return;
  }
  const proofWindow = window.open(record.proof_data, '_blank');
  if (!proofWindow) notify('Pelayar menghalang tab dokumen. Benarkan pop-up dan cuba lagi.', true);
}

function submitMovement(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const localStart = new Date(`${form.get('date')}T${form.get('time')}:00`);
  if (Number.isNaN(localStart.getTime())) {
    notify('Tarikh atau masa pergerakan tidak sah.', true);
    return;
  }
  const previous = getData();
  const movement = {
    id: `move-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: state.user.id,
    purpose: form.get('purpose').trim(),
    category: form.get('category'),
    destination: form.get('destination').trim(),
    starts_at: localStart.toISOString(),
    notes: form.get('notes').trim(),
    created_at: new Date().toISOString()
  };
  const next = { movements: [movement, ...previous.movements], claims: previous.claims };
  if (!saveData(next)) return;
  state.movements = next.movements;
  state.claims = next.claims;
  formElement.reset();
  byId('movementDate').value = currentDate();
  byId('movementTime').value = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  notify('Rekod pergerakan berjaya disimpan dalam browser ini.');
  render();
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error('Fail bukti tidak dapat dibaca oleh browser.')));
    reader.readAsDataURL(file);
  });
}

async function submitClaim(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const file = form.get('receipt');
  if (!(file instanceof File) || file.size === 0) {
    notify('Sila lampirkan bukti atau resit sebelum menghantar tuntutan.', true);
    return;
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    notify('Format bukti mestilah PDF, JPG atau PNG.', true);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    notify('Saiz bukti melebihi had 500 KB dalam mod demo.', true);
    return;
  }
  if (!myMovements().some(item => item.id === form.get('movement_id'))) {
    notify('Pilih pergerakan anda yang sah untuk tuntutan ini.', true);
    return;
  }
  const button = byId('claimSubmit');
  button.disabled = true;
  try {
    const proofData = await readAsDataUrl(file);
    const previous = getData();
    const claim = {
      id: `claim-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user_id: state.user.id,
      movement_id: form.get('movement_id'),
      category: form.get('category'),
      description: form.get('description').trim(),
      amount: Number(form.get('amount')),
      purchase_date: form.get('purchase_date'),
      proof_name: file.name,
      proof_type: file.type,
      proof_data: proofData,
      status: 'pending',
      admin_note: '',
      created_at: new Date().toISOString()
    };
    const next = { movements: previous.movements, claims: [claim, ...previous.claims] };
    if (!saveData(next)) return;
    state.movements = next.movements;
    state.claims = next.claims;
    formElement.reset();
    byId('claimDate').value = currentDate();
    notify('Tuntutan dan bukti berjaya direkodkan. Status: menunggu kelulusan admin.');
    render();
  } catch (error) {
    console.error(error);
    notify(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function submitLeave(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const startDate = form.get('start_date');
  const endDate = form.get('end_date');
  const file = form.get('evidence');
  if (startDate > endDate) {
    notify('Tarikh akhir cuti tidak boleh lebih awal daripada tarikh mula.', true);
    return;
  }
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      notify('Format dokumen sokongan mestilah PDF, JPG atau PNG.', true);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      notify('Saiz dokumen sokongan melebihi had 500 KB dalam mod demo.', true);
      return;
    }
  }

  const button = byId('leaveSubmit');
  button.disabled = true;
  try {
    const proofData = file instanceof File && file.size > 0 ? await readAsDataUrl(file) : '';
    const previous = getData();
    const leave = {
      id: `leave-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user_id: state.user.id,
      category: form.get('category'),
      start_date: startDate,
      end_date: endDate,
      reason: form.get('reason').trim(),
      evidence_name: proofData ? file.name : '',
      proof_type: proofData ? file.type : '',
      proof_data: proofData,
      status: 'pending',
      admin_note: '',
      created_at: new Date().toISOString()
    };
    const next = {
      movements: previous.movements,
      claims: previous.claims,
      leaves: [leave, ...previous.leaves]
    };
    if (!saveData(next)) return;
    state.movements = next.movements;
    state.claims = next.claims;
    state.leaves = next.leaves;
    formElement.reset();
    notify('Permohonan cuti berjaya dihantar untuk semakan admin.');
    render();
  } catch (error) {
    console.error(error);
    notify(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function submitReview(event) {
  const form = event.target.closest('[data-review-form]');
  if (!form) return;
  event.preventDefault();
  const decision = event.submitter?.value;
  if (!['approved', 'rejected'].includes(decision)) return;
  const note = new FormData(form).get('admin_note').trim();
  if (decision === 'rejected' && !note) {
    notify('Catatan admin wajib diisi untuk menolak tuntutan.', true);
    form.elements.admin_note.focus();
    return;
  }
  const previous = getData();
  const claim = previous.claims.find(item => item.id === form.dataset.reviewForm);
  if (!claim || claim.status !== 'pending') {
    notify('Tuntutan ini telah disemak. Muat semula senarai.', true);
    return;
  }
  const next = {
    movements: previous.movements,
    claims: previous.claims.map(item => item.id === claim.id ? {
      ...item,
      status: decision,
      admin_note: note,
      reviewed_at: new Date().toISOString(),
      reviewed_by: state.user.id
    } : item)
  };
  if (!saveData(next)) return;
  state.movements = next.movements;
  state.claims = next.claims;
  notify(decision === 'approved' ? 'Tuntutan berjaya diluluskan dalam demo.' : 'Tuntutan ditolak dalam demo.');
  render();
}

function submitLeaveReview(event) {
  const form = event.target.closest('[data-review-leave]');
  if (!form) return;
  event.preventDefault();
  const decision = event.submitter?.value;
  if (!['approved', 'rejected'].includes(decision)) return;
  const note = new FormData(form).get('admin_note').trim();
  if (decision === 'rejected' && !note) {
    notify('Catatan admin wajib diisi untuk menolak permohonan cuti.', true);
    form.elements.admin_note.focus();
    return;
  }
  const previous = getData();
  const leave = previous.leaves.find(item => item.id === form.dataset.reviewLeave);
  if (!leave || leave.status !== 'pending') {
    notify('Permohonan ini telah disemak. Muat semula senarai.', true);
    return;
  }
  const next = {
    movements: previous.movements,
    claims: previous.claims,
    leaves: previous.leaves.map(item => item.id === leave.id ? {
      ...item,
      status: decision,
      admin_note: note,
      reviewed_at: new Date().toISOString(),
      reviewed_by: state.user.id
    } : item)
  };
  if (!saveData(next)) return;
  state.movements = next.movements;
  state.claims = next.claims;
  state.leaves = next.leaves;
  notify(decision === 'approved' ? 'Permohonan cuti berjaya diluluskan.' : 'Permohonan cuti telah ditolak.');
  render();
}

function initializeLogin() {
  byId('authMessage').textContent = '';
  byId('authMessage').className = 'message';
  document.querySelectorAll('[data-demo-email]').forEach(button => button.addEventListener('click', () => {
    byId('loginEmail').value = button.dataset.demoEmail;
    byId('loginPassword').value = 'demo1234';
    byId('loginPassword').focus();
  }));
  byId('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    const email = byId('loginEmail').value.trim().toLowerCase();
    const password = byId('loginPassword').value;
    const account = DEMO_ACCOUNTS.find(user => user.email === email && user.password === password);
    if (!account) {
      showAuthMessage('E-mel atau kata laluan demo tidak betul. Pilih akaun contoh di bawah.');
      return;
    }
    state.user = account;
    const data = getData();
    state.movements = data.movements;
    state.claims = data.claims;
    state.leaves = data.leaves;
    byId('authScreen').hidden = true;
    byId('appShell').hidden = false;
    byId('userName').textContent = account.full_name;
    byId('welcomeName').textContent = account.full_name.split(/\s+/)[0];
    byId('userRole').textContent = account.role === 'admin' ? 'Pentadbir • Demo' : `MPP • ${account.matric_no}`;
    byId('userAvatar').textContent = profileInitials(account.full_name);
    byId('topAvatar').textContent = profileInitials(account.full_name);
    byId('adminNav').hidden = account.role !== 'admin';
    byId('todayLabel').textContent = new Intl.DateTimeFormat('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    navigate('dashboard');
    render();
  });
  byId('signOutButton').addEventListener('click', () => {
    showLogin();
    byId('loginPassword').value = '';
    byId('loginEmail').focus();
  });
}

document.addEventListener('click', event => {
  const navButton = event.target.closest('[data-page]');
  if (navButton) navigate(navButton.dataset.page);
  const goButton = event.target.closest('[data-go]');
  if (goButton) navigate(goButton.dataset.go);
  const proofButton = event.target.closest('[data-proof]');
  if (proofButton) openProof(proofButton.dataset.proof, proofButton.dataset.proofType);
});
byId('mobileMenu').addEventListener('click', () => byId('sidebar').classList.toggle('open'));
byId('movementForm').addEventListener('submit', submitMovement);
byId('claimForm').addEventListener('submit', submitClaim);
byId('leaveForm').addEventListener('submit', submitLeave);
byId('adminClaims').addEventListener('submit', submitReview);
byId('adminLeaves').addEventListener('submit', submitLeaveReview);
byId('movementDate').value = currentDate();
byId('movementTime').value = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
byId('claimDate').value = currentDate();
byId('leaveStart').value = currentDate();
byId('leaveEnd').value = currentDate();
initializeLogin();
