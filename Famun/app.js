// ===== Beyond the Surface — Main App Logic =====

const STORAGE_KEY = 'obras_found';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWBJkKjL83dmrHCukDdvknJ2qOz3DcXAMnfldXGSn2inFDo0DtX9mfZ2gLfdGvrwFZ/exec';

function getUserId() {
  let userId = localStorage.getItem('famun_user_id');
  if (!userId) {
    userId = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('famun_user_id', userId);
    // Registra visita nova na planilha (cria a linha do usuário)
    fetch(`${SCRIPT_URL}?userId=${userId}&obraId=VISIT`, { mode: 'no-cors' }).catch(() => {});
  } else if (userId.startsWith('user_')) {
    // Migra IDs antigos que ainda tenham o prefixo 'user_'
    userId = userId.replace('user_', '').toUpperCase();
    localStorage.setItem('famun_user_id', userId);
  }
  return userId;
}

// Each obra has ONE specific QR code. Only that exact code unlocks it.
const QR_CODE_MAP = {
  'FAMUN_A_123': 'A',
  'FAMUN_B_456': 'B',
  'FAMUN_C_789': 'C',
  'FAMUN_D_101': 'D',
  'FAMUN_E_202': 'E',
  'FAMUN_F_303': 'F',
  'FAMUN_G_404': 'G',
  'FAMUN_H_505': 'H',
  'FAMUN_I_606': 'I',
  'FAMUN_J_707': 'J',
  'FAMUN_K_808': 'K',
  'FAMUN_L_909': 'L',
  'FAMUN_M_010': 'M',
  'FAMUN_N_111': 'N',
  'FAMUN_O_212': 'O',
  'FAMUN_P_313': 'P',
  'FAMUN_Q_414': 'Q',
  'FAMUN_R_515': 'R',
  'FAMUN_S_616': 'S',
  'FAMUN_T_717': 'T'
};

const obrasData = {
  A: { title: 'Sphere Within Sphere' },
  B: { title: 'Non Violence' },
  C: { title: 'Busto de Mahatma Gandhi' },
  D: { title: 'Estátua de Nelson Mandela' },
  E: { title: 'Let Us Beat Swords into Ploughshares' },
  F: { title: 'Good Defeats Evil' },
  G: { title: 'Single Form' },
  H: { title: 'Vitrô da Paz (Peace Window)' },
  I: { title: 'Guerra e Paz (War and Peace)' },
  J: { title: 'The Golden Rule (A Regra de Ouro)' },
  K: { title: 'Sino da Paz (Japanese Peace Bell)' },
  L: { title: 'Titans' },
  M: { title: 'Anyanwu' },
  N: { title: 'Reclining Figure' },
  O: { title: 'Consciousness (Consciência)' },
  P: { title: 'Mural do Conselho de Segurança' },
  Q: { title: 'Tapeçaria de Guernica' },
  R: { title: 'Hope (Esperança)' },
  S: { title: 'Surya; O Deus Sol' },
  T: { title: 'Fragmento do Muro de Berlim' }
};

const TOTAL_OBRAS = Object.keys(obrasData).length;

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

function updateUI() {
  const found = getFoundObras();
  let foundCount = 0;

  Object.keys(obrasData).forEach(id => {
    const card = document.getElementById(`card-${id}`);
    const status = document.getElementById(`status-${id}`);
    if (!card || !status) return;

    if (found[id]) {
      foundCount++;
      card.classList.add('found');
      status.className = 'obra-status found-badge';
      status.innerHTML = '<span class="status-icon">✓</span><span class="status-text">Encontrada!</span>';
    } else {
      card.classList.remove('found');
      status.className = 'obra-status not-found';
      status.innerHTML = '<span class="status-icon">✗</span><span class="status-text">Não encontrada</span>';
    }
  });

  const progressCount = document.getElementById('progressCount');
  const progressBar = document.getElementById('progressBar');
  if (progressCount) progressCount.textContent = `${foundCount} / ${TOTAL_OBRAS}`;
  if (progressBar) progressBar.style.width = `${(foundCount / TOTAL_OBRAS) * 100}%`;

  const displayUserId = document.getElementById('displayUserId');
  if (displayUserId) {
    displayUserId.textContent = getUserId();
  }
}

let html5QrCode = null;
let currentScanTarget = null;

function openScanner(obraId) {
  currentScanTarget = obraId;
  const modal = document.getElementById('scannerModal');
  const title = document.getElementById('scannerTitle');
  const subtitle = document.getElementById('scannerSubtitle');
  const feedback = document.getElementById('scannerFeedback');

  title.textContent = `Registrar: ${obrasData[obraId].title}`;
  subtitle.textContent = 'Aponte a câmera para o QR Code desta obra';
  feedback.textContent = '';
  feedback.className = 'scanner-feedback';

  modal.classList.add('active');
  startScanner(obraId);
}

function startScanner(obraId) {
  const readerEl = document.getElementById('qr-reader');
  readerEl.innerHTML = '';
  const feedback = document.getElementById('scannerFeedback');

  if (window.location.protocol === 'file:') {
    feedback.innerHTML = '⚠️ A câmera não funciona via file://. Use um servidor.';
    feedback.className = 'scanner-feedback error';
    return;
  }
  if (!window.isSecureContext) {
    feedback.innerHTML = '⚠️ A câmera requer HTTPS ou localhost.';
    feedback.className = 'scanner-feedback error';
    return;
  }

  html5QrCode = new Html5Qrcode('qr-reader');
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      let cameraId = devices[0].id;
      for (let i = 0; i < devices.length; i++) {
        const label = devices[i].label.toLowerCase();
        if (label.includes('back') || label.includes('environment') || label.includes('traseira')) {
          cameraId = devices[i].id;
          break;
        }
      }
      html5QrCode.start(cameraId, config,
        (decodedText) => { onQRCodeScanned(decodedText, obraId); },
        () => {}
      ).catch(() => {
        feedback.textContent = '⚠️ Erro ao iniciar câmera.';
        feedback.className = 'scanner-feedback error';
      });
    } else {
      feedback.textContent = '⚠️ Nenhuma câmera encontrada.';
      feedback.className = 'scanner-feedback error';
    }
  }).catch(() => {
    feedback.textContent = '⚠️ Permissão de câmera negada.';
    feedback.className = 'scanner-feedback error';
  });
}

function onQRCodeScanned(decodedText, expectedObraId) {
  const feedback = document.getElementById('scannerFeedback');
  const scannedObraId = QR_CODE_MAP[decodedText.trim()] || null;

  if (scannedObraId === expectedObraId) {
    feedback.innerHTML = '✅ Obra encontrada!';
    feedback.className = 'scanner-feedback success';
    
    const alreadyFound = getFoundObras()[expectedObraId];
    
    markObraFound(expectedObraId);
    stopScanner();
    
    if (!alreadyFound) {
      const uid = getUserId();
      const url = `${SCRIPT_URL}?userId=${uid}&obraId=${expectedObraId}`;
      fetch(url, { mode: 'no-cors' }).catch(err => console.error(err));
    }

    setTimeout(() => {
      closeScanner();
      showToast(`${obrasData[expectedObraId].title} registrada!`);
    }, 1500);
  } else {
    feedback.innerHTML = '❌ QR Code inválido!';
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
}

function showToast(message) {
  const toast = document.getElementById('successToast');
  const text = document.getElementById('toastText');
  if (!toast || !text) return;
  text.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => { toast.classList.remove('visible'); }, 3500);
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'scannerModal') closeScanner();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeScanner();
});
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) updateUI();
});
document.addEventListener('DOMContentLoaded', () => { updateUI(); });
