// ===== Beyond the Surface — Main App Logic =====

const STORAGE_KEY = 'obras_found';

const obrasData = {
  A: { title: 'Sphere Within Sphere', qr: 'Assets/qr_A.png' },
  B: { title: 'Non Violence', qr: 'Assets/qr_B.png' },
  C: { title: 'Busto de Mahatma Gandhi', qr: 'Assets/qr_C.png' }
};

// ===== State Management =====
function getFoundObras() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function isObraFound(id) {
  return !!getFoundObras()[id];
}

// ===== UI Update =====
function updateUI() {
  const found = getFoundObras();
  const obraIds = ['A', 'B', 'C'];
  let foundCount = 0;

  obraIds.forEach(id => {
    const card = document.getElementById(`card-${id}`);
    const status = document.getElementById(`status-${id}`);

    if (!card || !status) return;

    if (found[id]) {
      foundCount++;
      card.classList.add('found');
      status.className = 'obra-status found-badge';
      status.innerHTML = `
        <span class="status-icon">✓</span>
        <span class="status-text">Encontrada!</span>
      `;
    } else {
      card.classList.remove('found');
      status.className = 'obra-status not-found';
      status.innerHTML = `
        <span class="status-icon">✗</span>
        <span class="status-text">Não encontrada</span>
      `;
    }
  });

  // Update progress
  const progressCount = document.getElementById('progressCount');
  const progressBar = document.getElementById('progressBar');
  if (progressCount) progressCount.textContent = `${foundCount} / ${obraIds.length}`;
  if (progressBar) progressBar.style.width = `${(foundCount / obraIds.length) * 100}%`;
}

// ===== QR Modal =====
let currentQRCode = null;

function showQR(obraId) {
  const modal = document.getElementById('qrModal');
  const obra = obrasData[obraId];
  if (!modal || !obra) return;

  document.getElementById('modalTitle').textContent = obra.title;
  document.getElementById('modalSubtitle').textContent = 'Escaneie para ver em realidade aumentada';

  // Build the URL for the QR code
  // Use the current page's base URL to construct an absolute AR link
  const baseUrl = window.location.href.replace(/[^/]*$/, '');
  const arUrl = `${baseUrl}ar.html?obra=${obraId}`;

  // Show the URL
  const urlEl = document.getElementById('modalURL');
  if (urlEl) urlEl.textContent = arUrl;

  // Generate real QR code using QRCode.js
  const container = document.getElementById('modalQRContainer');
  container.innerHTML = ''; // Clear previous QR code

  if (currentQRCode) {
    currentQRCode.clear();
    currentQRCode = null;
  }

  currentQRCode = new QRCode(container, {
    text: arUrl,
    width: 176,
    height: 176,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('qrModal');
  if (modal) modal.classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'qrModal') {
    closeModal();
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== Listen for storage changes (multi-tab sync) =====
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    updateUI();
  }
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  updateUI();

  // Check URL for ?found=X parameter (alternative to AR page)
  const params = new URLSearchParams(window.location.search);
  const foundId = params.get('found');
  if (foundId && obrasData[foundId]) {
    const found = getFoundObras();
    if (!found[foundId]) {
      found[foundId] = { timestamp: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      updateUI();
    }
  }
});
