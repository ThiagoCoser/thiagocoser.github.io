// Configurações do Supabase
// Substitua pelas suas credenciais reais
const SUPABASE_URL = 'https://oqgixqpqnypbvhoaktkw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ulvJWAScxDn_lyFh6Copsg_tk_zEVqs';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const button = document.getElementById('partyButton');
const counterEl = document.getElementById('clickCount');

let particles = [];
let localCount = 0;
const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 12 + 5;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity - 3;
        
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.005;
        this.gravity = 0.25;
        this.friction = 0.98;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.shape = Math.floor(Math.random() * 3);
    }

    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.shape === 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 1) {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

function createExplosion(x, y) {
    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
    requestAnimationFrame(animate);
}

// Carregar total de cliques do banco ao iniciar
async function loadClickCount() {
    try {
        const { count, error } = await supabaseClient
            .from('clicks')
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error('Erro ao carregar contagem:', error.message);
            return;
        }
        localCount = count || 0;
        counterEl.textContent = localCount;
    } catch (err) {
        console.error('Erro de conexão ao carregar contagem:', err);
    }
}

async function registerClick() {
    localCount++;
    counterEl.textContent = localCount;
    
    // Efeito visual no contador
    counterEl.classList.add('bump');
    setTimeout(() => counterEl.classList.remove('bump'), 100);

    // Registrar no Supabase
    try {
        const { error } = await supabaseClient
            .from('clicks')
            .insert([{ value: 1 }]);
        
        if (error) console.error('Erro ao registrar no Supabase:', error.message);
    } catch (err) {
        console.error('Erro de conexão:', err);
    }
}

button.addEventListener('click', (e) => {
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    createExplosion(x, y);
    registerClick();
    
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 100);
});

animate();
loadClickCount();
