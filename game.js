// game.js
class Fighter {
    constructor(name, imageUrl, id) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.id = id;
        
        this.strength = this.randomStat();
        this.defense = this.randomStat();
        this.speed = this.randomStat();
        this.health = this.randomStat();
        this.maxHealth = this.health;
        
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.width = 0;
        this.height = 0;
        
        this.lastAIAction = 0;
        this.isActive = true;
    }
    
    randomStat() {
        return Math.floor(Math.random() * 81) + 20;
    }
    
    getSize() {
        const baseSize = 60;
        const healthFactor = this.health / 100;
        return baseSize + (healthFactor * 40);
    }
}

class Game {
    constructor() {
        this.fighter1 = null;
        this.fighter2 = null;
        this.arena = null;
        this.arenaWidth = 0;
        this.arenaHeight = 0;
        this.gravity = 0.5;
        this.friction = 0.98;
        this.bounceEnergy = 0.6;
        this.gameRunning = false;
        this.animationId = null;
        this.startTime = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.resetGame());
    }
    
    startGame() {
        const f1Name = document.getElementById('fighter1Name').value || 'Fighter 1';
        const f1Image = document.getElementById('fighter1Image').value;
        const f2Name = document.getElementById('fighter2Name').value || 'Fighter 2';
        const f2Image = document.getElementById('fighter2Image').value;
        
        this.fighter1 = new Fighter(f1Name, f1Image, 1);
        this.fighter2 = new Fighter(f2Name, f2Image, 2);
        
        document.getElementById('setupPanel').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        this.arena = document.getElementById('arena');
        this.arenaWidth = this.arena.offsetWidth;
        this.arenaHeight = this.arena.offsetHeight;
        
        console.log('Arena size:', this.arenaWidth, 'x', this.arenaHeight);
        
        this.initializeFighters();
        this.updateStatsDisplay();
        this.showMessage('FIGHT!');
        
        this.gameRunning = true;
        this.startTime = performance.now();
        this.fighter1.lastAIAction = 0;
        this.fighter2.lastAIAction = 0;
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    initializeFighters() {
        const f1Size = this.fighter1.getSize();
        const f2Size = this.fighter2.getSize();
        
        console.log('Fighter 1 size:', f1Size);
        console.log('Fighter 2 size:', f2Size);
        
        // Position Fighter 1 on the left
        this.fighter1.x = 50;
        this.fighter1.y = 100;
        this.fighter1.width = f1Size;
        this.fighter1.height = f1Size;
        this.fighter1.vx = 0;
        this.fighter1.vy = 0;
        
        // Position Fighter 2 on the right
        this.fighter2.x = this.arenaWidth - f2Size - 50;
        this.fighter2.y = 100;
        this.fighter2.width = f2Size;
        this.fighter2.height = f2Size;
        this.fighter2.vx = 0;
        this.fighter2.vy = 0;
        
        console.log('Fighter 1 position:', this.fighter1.x, this.fighter1.y);
        console.log('Fighter 2 position:', this.fighter2.x, this.fighter2.y);
        
        // Setup Fighter 1 sprite
        const f1Sprite = document.getElementById('fighter1Sprite');
        f1Sprite.innerHTML = `<img src="${this.fighter1.imageUrl}" alt="${this.fighter1.name}">`;
        f1Sprite.style.width = f1Size + 'px';
        f1Sprite.style.height = f1Size + 'px';
        f1Sprite.style.display = 'block';
        
        // Setup Fighter 2 sprite
        const f2Sprite = document.getElementById('fighter2Sprite');
        f2Sprite.innerHTML = `<img src="${this.fighter2.imageUrl}" alt="${this.fighter2.name}">`;
        f2Sprite.style.width = f2Size + 'px';
        f2Sprite.style.height = f2Size + 'px';
        f2Sprite.style.display = 'block';
        
        // Force initial position update
        this.updateFighterPositions();
        
        console.log('Fighters initialized');
    }
    
    updateStatsDisplay() {
        document.getElementById('fighter1NameDisplay').textContent = this.fighter1.name;
        document.getElementById('fighter2NameDisplay').textContent = this.fighter2.name;
        
        document.getElementById('fighter1Str').textContent = this.fighter1.strength;
        document.getElementById('fighter1Def').textContent = this.fighter1.defense;
        document.getElementById('fighter1Spd').textContent = this.fighter1.speed;
        
        document.getElementById('fighter2Str').textContent = this.fighter2.strength;
        document.getElementById('fighter2Def').textContent = this.fighter2.defense;
        document.getElementById('fighter2Spd').textContent = this.fighter2.speed;
        
        this.updateHealthDisplay();
    }
    
    updateHealthDisplay() {
        const f1Percent = (this.fighter1.health / this.fighter1.maxHealth) * 100;
        const f2Percent = (this.fighter2.health / this.fighter2.maxHealth) * 100;
        
        document.getElementById('fighter1HP').style.width = Math.max(0, f1Percent) + '%';
        document.getElementById('fighter2HP').style.width = Math.max(0, f2Percent) + '%';
        
        document.getElementById('fighter1HPText').textContent = 
            `${Math.max(0, Math.ceil(this.fighter1.health))}/${this.fighter1.maxHealth}`;
        document.getElementById('fighter2HPText').textContent = 
            `${Math.max(0, Math.ceil(this.fighter2.health))}/${this.fighter2.maxHealth}`;
    }
    
    gameLoop(currentTime) {
        if (!this.gameRunning) return;
        
        const elapsedTime = currentTime - this.startTime;
        
        this.updateAI(elapsedTime);
        this.updatePhysics();
        this.checkCollision();
        this.updateFighterPositions();
        this.checkVictory();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    updatePhysics() {
        [this.fighter1, this.fighter2].forEach(fighter => {
            if (!fighter.isActive) return;
            
            // Apply gravity
            fighter.vy += this.gravity;
            
            // Apply friction
            fighter.vx *= this.friction;
            
            // Update position
            fighter.x += fighter.vx;
            fighter.y += fighter.vy;
            
            // Ground collision
            if (fighter.y + fighter.height > this.arenaHeight) {
                fighter.y = this.arenaHeight - fighter.height;
                fighter.vy = -fighter.vy * this.bounceEnergy;
                fighter.vx *= 0.85;
                
                if (Math.abs(fighter.vy) < 1) {
                    fighter.vy = 0;
                }
            }
            
            // Ceiling collision
            if (fighter.y < 0) {
                fighter.y = 0;
                fighter.vy = -fighter.vy * this.bounceEnergy;
            }
            
            // Wall collisions
            if (fighter.x < 0) {
                fighter.x = 0;
                fighter.vx = -fighter.vx * this.bounceEnergy;
            }
            if (fighter.x + fighter.width > this.arenaWidth) {
                fighter.x = this.arenaWidth - fighter.width;
                fighter.vx = -fighter.vx * this.bounceEnergy;
            }
            
            // Ring-out detection (much more lenient)
            if (fighter.y > this.arenaHeight + fighter.height * 2) {
                fighter.isActive = false;
                const otherFighter = fighter === this.fighter1 ? this.fig
