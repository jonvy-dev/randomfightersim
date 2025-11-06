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
        
        this.fighter1.x = this.arenaWidth * 0.25 - f1Size / 2;
        this.fighter1.y = this.arenaHeight * 0.3;
        this.fighter1.width = f1Size;
        this.fighter1.height = f1Size;
        this.fighter1.vx = 0;
        this.fighter1.vy = 0;
        
        this.fighter2.x = this.arenaWidth * 0.75 - f2Size / 2;
        this.fighter2.y = this.arenaHeight * 0.3;
        this.fighter2.width = f2Size;
        this.fighter2.height = f2Size;
        this.fighter2.vx = 0;
        this.fighter2.vy = 0;
        
        const f1Sprite = document.getElementById('fighter1Sprite');
        const f2Sprite = document.getElementById('fighter2Sprite');
        
        f1Sprite.innerHTML = `<img src="${this.fighter1.imageUrl}" alt="${this.fighter1.name}">`;
        f2Sprite.innerHTML = `<img src="${this.fighter2.imageUrl}" alt="${this.fighter2.name}">`;
        
        f1Sprite.style.width = f1Size + 'px';
        f1Sprite.style.height = f1Size + 'px';
        f2Sprite.style.width = f2Size + 'px';
        f2Sprite.style.height = f2Size + 'px';
        
        this.updateFighterPositions();
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
            
            // Wall collisions
            if (fighter.x < 0) {
                fighter.x = 0;
                fighter.vx = -fighter.vx * this.bounceEnergy;
            }
            if (fighter.x + fighter.width > this.arenaWidth) {
                fighter.x = this.arenaWidth - fighter.width;
                fighter.vx = -fighter.vx * this.bounceEnergy;
            }
            
            // Ring-out detection
            if (fighter.y < -fighter.height * 2 || 
                fighter.x < -fighter.width * 2 || 
                fighter.x > this.arenaWidth + fighter.width) {
                fighter.isActive = false;
                this.showMessage(`${fighter.name} was knocked out of the arena!`);
                this.endGame();
            }
        });
    }
    
    updateAI(elapsedTime) {
        // Fighter 1 AI
        if (elapsedTime - this.fighter1.lastAIAction > 600) {
            this.applyAIForce(this.fighter1, this.fighter2);
            this.fighter1.lastAIAction = elapsedTime;
        }
        
        // Fighter 2 AI
        if (elapsedTime - this.fighter2.lastAIAction > 650) {
            this.applyAIForce(this.fighter2, this.fighter1);
            this.fighter2.lastAIAction = elapsedTime;
        }
    }
    
    applyAIForce(fighter, target) {
        if (!fighter.isActive || !target.isActive) return;
        
        const dx = (target.x + target.width / 2) - (fighter.x + fighter.width / 2);
        const dy = (target.y + target.height / 2) - (fighter.y + fighter.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const speedFactor = fighter.speed / 100;
            const forceMagnitude = 2 + speedFactor * 3;
            
            fighter.vx += (dx / distance) * forceMagnitude;
            
            // Jump towards opponent if grounded
            if (Math.abs(fighter.vy) < 0.5 && fighter.y + fighter.height >= this.arenaHeight - 5) {
                fighter.vy -= 8 + speedFactor * 4;
            }
        }
    }
    
    checkCollision() {
        if (!this.fighter1.isActive || !this.fighter2.isActive) return;
        
        const f1CenterX = this.fighter1.x + this.fighter1.width / 2;
        const f1CenterY = this.fighter1.y + this.fighter1.height / 2;
        const f2CenterX = this.fighter2.x + this.fighter2.width / 2;
        const f2CenterY = this.fighter2.y + this.fighter2.height / 2;
        
        const dx = f2CenterX - f1CenterX;
        const dy = f2CenterY - f1CenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.fighter1.width + this.fighter2.width) / 2;
        
        if (distance < minDistance) {
            // Separate fighters
            const angle = Math.atan2(dy, dx);
            const overlap = minDistance - distance;
            
            this.fighter1.x -= Math.cos(angle) * overlap / 2;
            this.fighter1.y -= Math.sin(angle) * overlap / 2;
            this.fighter2.x += Math.cos(angle) * overlap / 2;
            this.fighter2.y += Math.sin(angle) * overlap / 2;
            
            this.resolveCollision(this.fighter1, this.fighter2, dx, dy);
        }
    }
    
    resolveCollision(f1, f2, dx, dy) {
        const angle = Math.atan2(dy, dx);
        
        const v1 = Math.sqrt(f1.vx * f1.vx + f1.vy * f1.vy);
        const v2 = Math.sqrt(f2.vx * f2.vx + f2.vy * f2.vy);
        
        const attacker = v1 > v2 ? f1 : f2;
        const defender = v1 > v2 ? f2 : f1;
        const direction = v1 > v2 ? 1 : -1;
        
        // Dodge check
        const dodgeChance = defender.speed / 400;
        const dodged = Math.random() < dodgeChance;
        
        if (dodged) {
            this.showMessage(`${defender.name} dodged!`);
        } else {
            // Damage calculation
            const damageReductionChance = defender.defense / 300;
            const damageReduced = Math.random() < damageReductionChance;
            
            let damage = (attacker.strength / 8) + Math.random() * 5;
            if (damageReduced) {
                damage *= 0.4;
                this.showMessage(`${defender.name} blocked!`);
            } else {
                this.showMessage(`${attacker.name} hit ${defender.name}!`);
            }
            
            defender.health -= damage;
            this.updateHealthDisplay();
        }
        
        // Knockback
        const knockbackPower = (attacker.strength / 80) * 8;
        const resistance = (defender.defense / 100);
        const knockbackMagnitude = knockbackPower / (1 + resistance * 0.3);
        
        defender.vx += Math.cos(angle) * knockbackMagnitude * direction;
        defender.vy += Math.sin(angle) * knockbackMagnitude * direction - 2;
        
        attacker.vx -= Math.cos(angle) * knockbackMagnitude * 0.2 * direction;
        attacker.vy -= Math.sin(angle) * knockbackMagnitude * 0.2 * direction;
    }
    
    updateFighterPositions() {
        const f1Sprite = document.getElementById('fighter1Sprite');
        const f2Sprite = document.getElementById('fighter2Sprite');
        
        f1Sprite.style.left = this.fighter1.x + 'px';
        f1Sprite.style.top = this.fighter1.y + 'px';
        
        f2Sprite.style.left = this.fighter2.x + 'px';
        f2Sprite.style.top = this.fighter2.y + 'px';
    }
    
    checkVictory() {
        if (this.fighter1.health <= 0 && this.fighter1.isActive) {
            this.fighter1.isActive = false;
            this.showMessage(`${this.fighter2.name} WINS by knockout!`);
            this.endGame();
        } else if (this.fighter2.health <= 0 && this.fighter2.isActive) {
            this.fighter2.isActive = false;
            this.showMessage(`${this.fighter1.name} WINS by knockout!`);
            this.endGame();
        }
    }
    
    showMessage(msg) {
        document.getElementById('messageBox').textContent = msg;
    }
    
    endGame() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    resetGame() {
        this.endGame();
        document.getElementById('setupPanel').style.display = 'flex';
        document.getElementById('gameContainer').style.display = 'none';
        this.fighter1 = null;
        this.fighter2 = null;
    }
}

// Initialize game when page loads
const game = new Game();
