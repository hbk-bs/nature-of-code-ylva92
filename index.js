// Sand Crack Simulation mit Partikeln
// Basierend auf einem natürlichen Rissmuster in trockenem Sand

const canvas = document.getElementById('sandCanvas');
const ctx = canvas.getContext('2d');

// Canvas-Größe anpassen
function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth - 40, 800);
    canvas.height = Math.min(window.innerHeight - 40, 800);
    render(); // Neu rendern nach Größenänderung
}

// Parameter für die Simulation
const config = {
    // Sandtextur
    sandColor: '#e6e1d5',  // Helle Sandfarbe
    sandNoiseScale: 0.01,  // Körnigkeit des Sandes
    sandNoiseStrength: 10, // Stärke der Körnigkeit
    
    // Risse
    crackColor: '#403c35',  // Dunkle Farbe für Risse
    initialCracks: 4,       // Anzahl der anfänglichen Risse
    maxCracks: 300,         // Maximale Anzahl an Rissen
    crackLength: 30,        // Durchschnittliche Länge eines Risses
    crackWidthMax: 3,       // Maximale Breite eines Risses
    crackWidthVariation: 2, // Variation der Rissbreite
    crackDelay: 30,         // Verzögerung zwischen neuen Rissen (in ms)
    
    // Partikel
    particleCount: 500,     // Anzahl der Partikel
    particleSize: 2,        // Größe der Partikel
    particleLifespan: 60,   // Lebensdauer in Frames
    particleColor: '#5e5a50', // Farbe der Partikel
    
    // Staubwolke
    dustEffect: true,       // Staubeffekt aktivieren
    dustParticles: 50,      // Anzahl der Staubpartikel pro neuem Riss
};

// Hilfsobjekte
let cracks = [];         // Alle Risse
let particles = [];      // Partikel für Staubeffekte
let isSimulationRunning = true;
let lastCrackTime = 0;   // Zeit des letzten Risses

// Perlin Noise Funktion (vereinfachte Version)
function noise(x, y) {
    return Math.sin(x * 0.1) * Math.sin(y * 0.1) * 0.5 + 0.5;
}

// Klasse für einen Risspunkt
class CrackPoint {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
    }
}

// Klasse für einen kompletten Riss
class Crack {
    constructor(startX, startY, angle, length) {
        this.points = [];
        this.isDone = false;
        this.mainAngle = angle;
        this.length = length + (Math.random() * 20 - 10); // Variation in der Länge
        
        // Ersten Punkt hinzufügen
        const width = Math.random() * config.crackWidthVariation + 1;
        this.points.push(new CrackPoint(startX, startY, width));
        
        // Wachstumsparameter
        this.growSpeed = 1 + Math.random();  // Geschwindigkeit des Wachstums
        
        // Ob dieser Riss neue Risse gebären kann
        this.canSprout = Math.random() > 0.3;
    }
    
    // Riss wachsen lassen
    grow() {
        if (this.isDone) return;
        
        if (this.points.length >= this.length) {
            this.isDone = true;
            return;
        }
        
        // Letzter Punkt
        const lastPoint = this.points[this.points.length - 1];
        
        // Winkel mit leichter Variation
        const angle = this.mainAngle + (Math.random() * 0.5 - 0.25);
        
        // Neuen Punkt berechnen
        const newX = lastPoint.x + Math.cos(angle) * this.growSpeed;
        const newY = lastPoint.y + Math.sin(angle) * this.growSpeed;
        
        // Breite des Risses variieren
        const width = Math.max(0.5, lastPoint.width * (0.95 + Math.random() * 0.1));
        
        // Punkt hinzufügen, wenn er innerhalb der Canvas ist
        if (newX > 0 && newX < canvas.width && newY > 0 && newY < canvas.height) {
            this.points.push(new CrackPoint(newX, newY, width));
            
            // Neue Partikel erzeugen
            if (config.dustEffect && Math.random() > 0.7) {
                createDustParticles(newX, newY, 1);
            }
            
            // Manchmal neue Risse aus einem bestehenden Riss entstehen lassen
            if (this.canSprout && this.points.length > 5 && Math.random() > 0.97) {
                const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 4 + Math.random() * Math.PI / 4);
                if (cracks.length < config.maxCracks) {
                    cracks.push(new Crack(newX, newY, branchAngle, config.crackLength * 0.6));
                    createDustParticles(newX, newY, config.dustParticles / 2);
                }
            }
        } else {
            this.isDone = true;
        }
    }
    
    // Riss zeichnen
    draw() {
        if (this.points.length < 2) return;
        
        ctx.strokeStyle = config.crackColor;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Riss Linie zeichnen
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i-1];
            const p2 = this.points[i];
            
            ctx.beginPath();
            ctx.lineWidth = p1.width;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
}

// Partikel-Klasse für Staubeffekte
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * config.particleSize + 0.5;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = config.particleLifespan + Math.random() * 20;
        this.maxLife = this.life;
        this.color = config.particleColor;
    }
    
    update() {
        this.x += this.speedX * 0.3;
        this.y += this.speedY * 0.3;
        this.speedX *= 0.98;
        this.speedY *= 0.98;
        this.life--;
        
        // Größe mit der Zeit abnehmen
        this.size = Math.max(0.1, this.size * 0.99);
        
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(94, 90, 80, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Staubpartikel erstellen
function createDustParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x + Math.random() * 4 - 2,
            y + Math.random() * 4 - 2
        ));
        
        // Begrenzen auf maximale Partikelanzahl
        if (particles.length > config.particleCount) {
            particles.shift();
        }
    }
}

// Neue Risse erzeugen
function createNewCrack() {
    if (cracks.length >= config.maxCracks || !isSimulationRunning) return;
    
    // Eventuell an einen existierenden Riss anschließen
    if (cracks.length > 0 && Math.random() > 0.7) {
        const parentCrack = cracks[Math.floor(Math.random() * cracks.length)];
        if (parentCrack.points.length > 0) {
            const point = parentCrack.points[Math.floor(Math.random() * parentCrack.points.length)];
            const angle = Math.random() * Math.PI * 2;
            cracks.push(new Crack(point.x, point.y, angle, config.crackLength));
            createDustParticles(point.x, point.y, config.dustParticles);
        }
    } 
    // Sonst einen neuen Riss starten
    else {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const angle = Math.random() * Math.PI * 2;
        cracks.push(new Crack(x, y, angle, config.crackLength));
        createDustParticles(x, y, config.dustParticles);
    }
    
    lastCrackTime = performance.now();
}

// Sandtextur zeichnen
function drawSandTexture() {
    // Grundfarbe
    ctx.fillStyle = config.sandColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sandkörner-Effekt mit Noise
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        
        const noiseVal = noise(x * config.sandNoiseScale, y * config.sandNoiseScale) * config.sandNoiseStrength;
        
        // RGB-Werte anpassen für Sandkörner
        data[i] = Math.max(0, Math.min(255, data[i] - noiseVal));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] - noiseVal));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] - noiseVal));
    }
    
    ctx.putImageData(imgData, 0, 0);
}

// Simulation aktualisieren
function update() {
    // Risse wachsen lassen
    for (const crack of cracks) {
        crack.grow();
    }
    
    // Partikel aktualisieren
    particles = particles.filter(p => p.update());
    
    // Neue Risse entstehen lassen
    const currentTime = performance.now();
    if (currentTime - lastCrackTime > config.crackDelay && cracks.length < config.maxCracks) {
        createNewCrack();
    }
}

// Alles zeichnen
function render() {
    // Sandtextur neu zeichnen
    drawSandTexture();
    
    // Alle Risse zeichnen
    for (const crack of cracks) {
        crack.draw();
    }
    
    // Partikel zeichnen
    for (const particle of particles) {
        particle.draw();
    }
}

// Animations-Loop
function animate() {
    if (isSimulationRunning) {
        update();
        render();
    }
    requestAnimationFrame(animate);
}

// Initialisieren
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialen Risse erstellen
    for (let i = 0; i < config.initialCracks; i++) {
        createNewCrack();
    }
    
    animate();
}

// Simulation starten
init();

// Mausklick = neuer Riss
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (cracks.length < config.maxCracks) {
        const angle = Math.random() * Math.PI * 2;
        cracks.push(new Crack(x, y, angle, config.crackLength));
        createDustParticles(x, y, config.dustParticles * 2);
    }
});