// ===== Beyond the Surface — Main App Logic =====

const STORAGE_KEY = 'obras_found';

// Maps each QR code content to an obra ID.
// The QR codes installed in the real environment should encode these exact strings.
// Adjust these values to match whatever your physical QR codes contain.
const QR_CODE_MAP = {
  'FAMUN_OBRA_A': 'A',
  'FAMUN_OBRA_B': 'B',
  'FAMUN_OBRA_C': 'C',
  // Fallbacks using URLs in case the QR code has the full URL
  'http://localhost/ar.html?obra=A': 'A',
  'http://localhost/ar.html?obra=B': 'B',
  'http://localhost/ar.html?obra=C': 'C',
  'ar.html?obra=A': 'A',
  'ar.html?obra=B': 'B',
  'ar.html?obra=C': 'C'
};

const obrasData = {
  A: { title: 'Sphere Within Sphere', model: 'Assets/A.glb' },
  B: { title: 'Non Violence', model: 'Assets/B.glb' },
  C: { title: 'Busto de Mahatma Gandhi', model: 'Assets/C.glb' }
};

// ===== State Management =====
function getFoundObras() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function markObraFound(id) {
  const found = getFoundObras();
  if (!found[id]) {
    found[id] = { timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  }
  updateUI();
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

// ===== QR Scanner =====
let html5QrCode = null;
let currentScanTarget = null;
let currentScanMode = null; // 'register' or 'ar'

// A wrapper to extract ID from URL if the QR code is a full URL
function extractIdFromScan(text) {
  text = text.trim();
  if (QR_CODE_MAP[text]) return QR_CODE_MAP[text];
  
  // Try to parse as URL
  try {
    const url = new URL(text, window.location.href);
    const param = url.searchParams.get('obra');
    if (param && ['A', 'B', 'C'].includes(param)) return param;
  } catch (e) {
    // Check if it's a relative URL
    if (text.includes('obra=')) {
      const match = text.match(/obra=([ABC])/);
      if (match) return match[1];
    }
  }
  
  return null;
}

function openScanner(obraId, mode) {
  currentScanTarget = obraId;
  currentScanMode = mode;
  const modal = document.getElementById('scannerModal');
  const title = document.getElementById('scannerTitle');
  const subtitle = document.getElementById('scannerSubtitle');
  const feedback = document.getElementById('scannerFeedback');

  title.textContent = mode === 'register' 
    ? `Registrar: ${obrasData[obraId].title}` 
    : `Ver em AR: ${obrasData[obraId].title}`;
  subtitle.textContent = 'Aponte a câmera para o QR Code desta obra';
  feedback.textContent = '';
  feedback.className = 'scanner-feedback';

  modal.classList.add('active');

  // Start the QR scanner
  startScanner(obraId);
}

function startScanner(obraId) {
  const readerEl = document.getElementById('qr-reader');
  readerEl.innerHTML = '';

  html5QrCode = new Html5Qrcode('qr-reader');

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  html5QrCode.start(
    { facingMode: 'environment' },
    config,
    (decodedText) => {
      onQRCodeScanned(decodedText, obraId);
    },
    (errorMessage) => {
      // Ignore scan errors (no QR in frame yet)
    }
  ).catch((err) => {
    const feedback = document.getElementById('scannerFeedback');
    feedback.textContent = '⚠️ Não foi possível acessar a câmera. Verifique as permissões.';
    feedback.className = 'scanner-feedback error';
  });
}

function onQRCodeScanned(decodedText, expectedObraId) {
  const feedback = document.getElementById('scannerFeedback');

  // Check if the scanned QR matches the expected obra
  const scannedObraId = extractIdFromScan(decodedText);

  if (scannedObraId === expectedObraId) {
    // Success — correct QR for this obra
    feedback.innerHTML = `✅ <strong>${obrasData[expectedObraId].title}</strong> identificada com sucesso!`;
    feedback.className = 'scanner-feedback success';
    markObraFound(expectedObraId);

    // Stop scanner and process based on mode
    stopScanner();
    setTimeout(() => {
      closeScanner();
      if (currentScanMode === 'register') {
        showToast(`${obrasData[expectedObraId].title} registrada!`);
      } else if (currentScanMode === 'ar') {
        window.location.href = `ar.html?obra=${expectedObraId}`;
      }
    }, 1500);

  } else if (scannedObraId && scannedObraId !== expectedObraId) {
    // Valid QR but wrong obra
    feedback.innerHTML = `⚠️ Este QR Code é da obra <strong>${obrasData[scannedObraId].title}</strong>, não desta. Mas identificamos mesmo assim!`;
    feedback.className = 'scanner-feedback warning';
    markObraFound(scannedObraId);

    stopScanner();
    setTimeout(() => {
      closeScanner();
      if (currentScanMode === 'register') {
        showToast(`${obrasData[scannedObraId].title} registrada!`);
      } else if (currentScanMode === 'ar') {
        window.location.href = `ar.html?obra=${scannedObraId}`;
      }
    }, 2000);

  } else {
    // Unrecognized QR code
    feedback.textContent = '❌ QR Code não reconhecido. Procure o QR oficial da obra.';
    feedback.className = 'scanner-feedback error';
  }
}

function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().catch(() => {});
  }
}

function closeScanner() {
  stopScanner();
  const modal = document.getElementById('scannerModal');
  if (modal) modal.classList.remove('active');
  currentScanTarget = null;
  currentScanMode = null;
}

// ===== Toast Notification =====
function showToast(message) {
  const toast = document.getElementById('successToast');
  const text = document.getElementById('toastText');
  if (!toast || !text) return;

  text.textContent = message;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}

// ===== Close modal on overlay click =====
document.addEventListener('click', (e) => {
  if (e.target.id === 'scannerModal') {
    closeScanner();
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeScanner();
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
});
