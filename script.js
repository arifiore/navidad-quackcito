const canvas = document.getElementById('snowCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId;

// Resize
function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = setup;
setup();

// Nieve Neón
let particles = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    v: Math.random() * 2 + 1,
    s: Math.random() * 2,
    c: Math.random() > 0.5 ? '#00f3ff' : '#39ff14'
}));

function animate() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    particles.forEach(p => {
        ctx.fillStyle = p.c;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
        ctx.fill();
        p.y += p.v;
        if(p.y > canvas.height) p.y = -10;
    });
    requestAnimationFrame(animate);
}
animate();

// Contador
const start = new Date("2024-10-21T00:00:00");
setInterval(() => {
    const now = new Date();
    const diff = now - start;
    const d = Math.floor(diff/(1000*60*60*24));
    const h = Math.floor((diff/(1000*60*60))%24);
    const m = Math.floor((diff/(1000*60))%60);
    const s = Math.floor((diff/1000)%60);
    document.getElementById('counter').innerText = `${d}d ${h}h ${m}m ${s}s DE HISTORIA`;
}, 1000);

// Música
function toggleMusic() {
    const m = document.getElementById('bgMusic');
    m.paused ? m.play() : m.pause();
    document.getElementById('musicBtn').innerText = m.paused ? "🔈 Play Music" : "🔊 Music ON";
}

// Lógica de Ventanas
function openModal(html) {
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    cancelAnimationFrame(gameLoopId);
}

function msg(txt) {
    openModal(`<h2 style="color:var(--pink)">Un pensamiento...</h2><p style="font-size:1.8rem">${txt}</p>`);
}

// --- JUEGO: JARDÍN CON RECOMPENSA ---
function initJardin() {
    const c = document.getElementById('gardenCanvas');
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height); // Limpiar jardín al empezar
    
    let intentosRestantes = 15; // Límite de flores que puede plantar
    let ganado = false;

    // Posición aleatoria invisible de la Flor Dorada
    const objetivoX = Math.random() * (c.width - 60) + 30;
    const objetivoY = Math.random() * (c.height - 60) + 30;

    c.onclick = (e) => {
        if (ganado || intentosRestantes <= 0) return;

        const rect = c.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calcular distancia entre el clic y el objetivo oculto
        const distancia = Math.sqrt((x - objetivoX) ** 2 + (y - objetivoY) ** 2);

        // Si el clic está cerca (menos de 30px) de la zona secreta
        if (distancia < 30) {
            ganado = true;
            drawFlower(g, objetivoX, objetivoY, '#ffeb3b'); // Dibuja la dorada
            setTimeout(showGardenReward, 500);
        } else {
            intentosRestantes--;
            drawFlower(g, x, y, null); // Dibuja flor normal
            
            // Pista visual: Si está muy lejos, la flor es pequeña, si está cerca, brilla más
            console.log("Intentos:", intentosRestantes); // Para debug
            
            if (intentosRestantes <= 0) {
                g.fillStyle = "rgba(255,0,0,0.5)";
                g.fillRect(0, 0, c.width, c.height);
                setTimeout(() => {
                    alert("¡El jardín se marchitó! No encontraste la semilla dorada. Inténtalo de nuevo.");
                    initJardin(); // Reinicia el juego
                }, 100);
            }
        }
    };
}

function drawFlower(g, x, y, col) {
    // Si no tiene color (es normal), elige uno neón al azar
    const isGold = col === '#ffeb3b';
    const color = col || (['#00f3ff','#ff007f','#39ff14'][Math.floor(Math.random()*3)]);
    
    g.shadowBlur = isGold ? 20 : 10;
    g.shadowColor = color;
    g.fillStyle = color;

    for(let i=0; i<8; i++) {
        g.beginPath();
        // Las flores doradas son un poco más grandes y majestuosas
        const rx = isGold ? 7 : 5;
        const ry = isGold ? 20 : 15;
        g.ellipse(x, y, rx, ry, (i*45)*Math.PI/180, 0, 2*Math.PI);
        g.fill();
    }
    
    // Centro de la flor
    g.fillStyle = "white";
    g.beginPath();
    g.arc(x, y, isGold ? 5 : 3, 0, Math.PI*2);
    g.fill();
    g.shadowBlur = 0; // Reset para no afectar otros dibujos
}

function showGardenReward() {
    openModal(`
        <div class="reward-card">
            <h2 style="color:var(--gold)">✨ ¡HAS HECHO FLORECER MI CORAZÓN! ✨</h2>
            <div style="font-size:4rem">🌸🌼🌻</div>
            <p>Encontraste la flor dorada entre mil. Así te encontré yo a ti. Eres la excepción a todas las reglas.</p>
        </div>
    `);
}

// --- JUEGO: ATRAPA CORAZONES (MEJORADO) ---
function initAtrapa() {
    const c = document.getElementById('atrapaCanvas');
    const g = c.getContext('2d');
    let score = 0;
    let hearts = [];
    let pX = 200; // Iniciar al centro

    // Función auxiliar para leer colores del CSS
    const getCol = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

    c.onmousemove = (e) => {
        const rect = c.getBoundingClientRect();
        pX = e.clientX - rect.left;
    };

    function game() {
        // Fondo con rastro ligero para efecto neón
        g.fillStyle = "rgba(0, 0, 0, 0.3)";
        g.fillRect(0, 0, c.width, c.height);
        
        // 1. DIBUJAR JUGADOR (Barra de 80px centrada en el mouse)
        g.fillStyle = getCol('--cyan');
        g.shadowBlur = 15;
        g.shadowColor = getCol('--cyan');
        g.fillRect(pX - 40, 280, 80, 8); 

        // 2. GENERAR CORAZONES (Probabilidad del 4% para que sea intenso)
        if(Math.random() < 0.04) {
            hearts.push({ x: Math.random() * (c.width - 20) + 10, y: 0 });
        }

        // 3. RECORRER CORAZONES
        for (let i = hearts.length - 1; i >= 0; i--) {
            let h = hearts[i];
            h.y += 4; // VELOCIDAD (Más alto = más difícil)
            
            // Dibujar Corazón con Brillo
            g.fillStyle = getCol('--pink');
            g.shadowColor = getCol('--pink');
            g.font = "20px Arial";
            g.fillText('❤', h.x - 10, h.y);

            // DETECTAR COLISIÓN
            // Si el corazón llega a la altura de la barra (280) 
            // y está dentro del rango de los 80px de la barra (pX-40 a pX+40)
            if(h.y >= 275 && h.y <= 290) {
                if(h.x > pX - 45 && h.x < pX + 45) {
                    hearts.splice(i, 1);
                    score++;
                    continue;
                }
            }

            // DETECTAR PÉRDIDA
            if(h.y > 300) { 
                hearts.splice(i, 1);
                // Solo penaliza si no ha ganado ya
                if(score < 20) {
                    score = 0; // REINICIO FATAL
                    // Efecto visual de error
                    g.fillStyle = "rgba(255, 0, 0, 0.5)";
                    g.fillRect(0, 0, c.width, c.height);
                }
            }
        }

        // 4. TEXTO DE PUNTAJE (Estilo neón)
        g.shadowBlur = 0;
        g.fillStyle = "white";
        g.font = "bold 16px Orbitron, sans-serif";
        g.fillText(`AMOR RECOLECTADO: ${score}/20`, 15, 30);
        
        if(score === 0) {
            g.fillStyle = getCol('--pink');
            g.font = "12px Orbitron";
            g.fillText("¡NO DEJES CAER NINGUNO!", 15, 50);
        }

        // 5. CONDICIÓN DE VICTORIA
        if(score >= 20) {
            cancelAnimationFrame(gameLoopId);
            setTimeout(showHeartReward, 300); // Función que muestra la foto/mensaje
            return;
        }
        
        gameLoopId = requestAnimationFrame(game);
    }
    
    // Iniciar bucle
    if(gameLoopId) cancelAnimationFrame(gameLoopId);
    game();
}

function varColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name); }

function showHeartReward() {
    openModal(`
        <div class="reward-card">
            <h2 style="color:var(--pink)">❤ ¡NIVEL COMPLETADO! ❤</h2>
            
            <div style="border: 10px solid white; display:inline-block; padding:0; background:white; box-shadow: 0 10px 20px rgba(0,0,0,0.5); transform: rotate(-2deg); margin: 15px 0;">
                <img src="imagen.jpeg" alt="Nuestro recuerdo" style="width: 100%; max-width: 250px; display: block; border-bottom: 40px solid white;">
                <h3 style="color:#333; font-family: 'Dancing Script', cursive; margin-top: -35px; position: relative; z-index: 10; font-size: 1.2rem;">
                    GRACIAS POR ATRAPARME
                </h3>
            </div>
            
            <p style="margin-top: 15px;">Has demostrado tener reflejos para cuidarme. <br> Te entrego mi corazón (una vez más).</p>
        </div>
    `);
}
// --- REGALO: NOSOTROS (STATS) ---
function showStats() {
    const diff = new Date() - start;
    const days = Math.floor(diff/(1000*60*60*24));
    openModal(`
        <h2>Estadísticas de nuestra aventura</h2>
        <div class="stats-grid">
            <div class="stat-item"><b>Días compartidos:</b> <br>${days}</div>
            <div class="stat-item"><b>Besos aprox:</b> <br>Incalculables</div>
            <div class="stat-item"><b>Peleas ganadas:</b> <br>0 (YO siempre gano MUAJAJAJAJA)</div>
            <div class="stat-item"><b>Futuro juntos:</b> <br>Dubitativo %</div>
        </div>
    `);
}

// --- LA GRAN SORPRESA FINAL ---
function finalSurprise() {
    document.body.style.transition = "3s";
    document.body.style.background = "radial-gradient(circle, #1a0033 0%, #000 100%)";
    
    openModal(`
        <div class="reward-card">
            <h1 style="color:var(--cyan); font-size:3rem">★ EL UNIVERSO QUACKCITO ★</h1>
            <p style="font-size:1.5rem">Mira hacia arriba... así de grande es lo que siento.</p>
            <div class="heart-pulse" style="font-size:5rem">🌌</div>
            <p>Has abierto todos los regalos. Pero el mejor regalo es tenerte cada mañana desde el 2024.</p>
            <h2 style="color:var(--pink)">¡FELIZ NAVIDAD, MI QUACKCITO!</h2>
        </div>
    `);
    
    // Multiplicar partículas
    for(let i=0; i<200; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            v: Math.random() * 5,
            s: Math.random() * 4,
            c: i % 2 == 0 ? '#ff007f' : '#ffeb3b'
        });
    }
}

function openGame(type) {
    if(type === 'jardin') {
        openModal(`<h3>Jardín de la Suerte</h3><p>Planta flores hasta hallar la dorada</p><canvas id="gardenCanvas" width="400" height="300" style="border:1px dashed var(--cyan)"></canvas>`);
        initJardin();
    } else if(type === 'atrapa') {
        openModal(`<h3>Recolector de Amor</h3><p>Atrapa 20 corazones con la barra</p><canvas id="atrapaCanvas" width="400" height="300" style="border:1px dashed var(--pink)"></canvas>`);
        initAtrapa();
    } else if(type === 'stats') {
        showStats();
    }
}
