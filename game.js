class TimingJumpGame {
    constructor(canvasId) {
        console.log('Creating TimingJumpGame with canvasId:', canvasId);
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }
        this.ctx = this.canvas.getContext('2d');
        console.log('Canvas and context successfully initialized');
        
        // Canvas dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'waiting'; // waiting, playing, gameOver
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore') || '0');
        
        // Callbacks for external interface integration
        this.onScoreChange = null;
        this.onGameOver = null;
        
        // Audio system (will be set externally)
        this.audioManager = null;
        
        // Player skin system
        this.playerSkin = null;
        this.defaultSkin = null;
        this.loadDefaultSkin();
        this.loadPlayerSkin();
        
        // Starting platform (stationary)
        this.startPlatform = {
            x: this.width / 2 - 60,
            y: this.height - 120,
            width: 120,
            height: 20
        };
        
        // Player (placed exactly on starting platform)
        this.player = {
            x: this.width / 2 - 15,
            y: 0, // Will be set correctly below
            width: 30,
            height: 30,
            velocityY: 0,
            isJumping: false,
            onPlatform: true,
            jumpHeight: 70, // Fixed jump height (for close platforms)
            jumpStartY: 0,
            currentPlatform: null // Current platform player is standing on
        };
        
        // Set correct Y position (on top of platform)
        this.player.y = this.startPlatform.y - this.player.height;
        
        
        
        // Moving platforms
        this.movingPlatforms = [];
        this.platformWidth = 100;
        this.platformHeight = 20;
        this.platformSpeed = 4; // Platform movement speed
        
        // Physics
        this.gravity = 0.5;
        this.jumpSpeed = 10;
        
        // Camera
        this.camera = {
            y: 0,
            targetY: 0,
            smoothness: 0.05
        };
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Start game
        this.reset();
        this.gameLoop();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleJump();
            }
            
            if (e.code === 'Enter' && this.gameState === 'gameOver') {
                this.reset();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    handleJump() {
        if (this.gameState === 'waiting') {
            this.gameState = 'playing';
            // Start background music when game begins
            if (this.audioManager) {
                this.audioManager.startBackgroundMusic();
            }
            // Спавним первое облако при старте игры
            this.spawnNextPlatform();
        }
        
        if (this.gameState === 'playing' && this.player.onPlatform && !this.player.isJumping) {
            console.log('JUMP ATTEMPT - Player state before jump:', {
                playerY: this.player.y,
                playerX: this.player.x,
                onPlatform: this.player.onPlatform,
                isJumping: this.player.isJumping,
                gameState: this.gameState,
                hasSkin: !!(this.playerSkin && this.playerSkin.complete),
                currentPlatform: this.player.currentPlatform ? 'yes' : 'no'
            });
            
            // Убедимся, что игрок находится в правильной позиции перед прыжком
            if (this.player.currentPlatform) {
                // Игрок на движущейся платформе
                this.player.y = this.player.currentPlatform.y - this.player.height;
            } else {
                // Игрок на стартовой платформе
                this.player.y = this.startPlatform.y - this.player.height;
            }
            
            this.player.isJumping = true;
            this.player.onPlatform = false;
            this.player.velocityY = -this.jumpSpeed;
            this.player.jumpStartY = this.player.y;
            
            console.log('JUMP STARTED - Player state after jump:', {
                playerY: this.player.y,
                jumpStartY: this.player.jumpStartY,
                velocityY: this.player.velocityY,
                isJumping: this.player.isJumping
            });
            
            // Play jump sound
            if (this.audioManager) {
                this.audioManager.playJump();
            }
        }
    }
    
    spawnNextPlatform() {
        // Determine next platform position
        let baseY = this.startPlatform.y; // Start from starting platform
        
        // If there are other platforms, take the highest one
        for (const platform of this.movingPlatforms) {
            if (platform.y < baseY) {
                baseY = platform.y;
            }
        }
        
        // Platforms close to character, as in the picture
        const levelHeight = 60; // Smaller distance between levels
        const currentLevel = this.score + 1; // Current level (starting from 1)
        const platformY = this.startPlatform.y - (levelHeight * currentLevel);
        
        // Determine spawn side - opposite from previous platform
        let fromLeft = Math.random() > 0.5; // Random by default
        
        // If there are previous platforms, take opposite side from the last one
        if (this.movingPlatforms.length > 0) {
            const lastPlatform = this.movingPlatforms[this.movingPlatforms.length - 1];
            if (lastPlatform.direction === 1) { // Previous moved right (spawned from left)
                fromLeft = false; // New spawns from right
            } else { // Previous moved left (spawned from right)
                fromLeft = true; // New spawns from left
            }
        }
        
        // Starting position - slightly off screen, but closer for fast platforms
        const startX = fromLeft ? -this.platformWidth - 20 : this.width + 20;
        
        // Determine zone where platform will be reachable
        const reachableZoneStart = 150; // Minimum 150px from edge
        const reachableZoneEnd = this.width - 150; // Maximum 150px from right edge
        const reachableZoneWidth = reachableZoneEnd - reachableZoneStart;
        
        const platform = {
            x: startX,
            y: platformY,
            width: this.platformWidth,
            height: this.platformHeight,
            direction: fromLeft ? 1 : -1, // 1 = moves right, -1 = left
            speed: 3 + (this.score * 0.5), // Fast and accelerates with each level
            active: true,
            stopped: false, // Platform moves by default
            reachableZone: {
                start: reachableZoneStart,
                end: reachableZoneEnd
            }
        };
        
        this.movingPlatforms.push(platform);
        console.log(`Created platform at height ${platformY}, moving ${fromLeft ? 'right' : 'left'}, speed: ${platform.speed.toFixed(1)}`);
    }
    
    update() {
        // Always update player position (even when waiting)
        this.updatePlayer();
        
        if (this.gameState !== 'playing') return;
        
        // Update moving platforms
        this.updateMovingPlatforms();
        
        // Update camera
        this.updateCamera();
        
        // Check collisions
        this.checkCollisions();
        
        // Check game over
        this.checkGameOver();
    }
    
    updatePlayer() {
        if (this.player.isJumping) {
            // Apply gravity
            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;
            
            // Check if player reached maximum jump height
            const jumpDistance = this.player.jumpStartY - this.player.y;
            if (jumpDistance >= this.player.jumpHeight && this.player.velocityY < 0) {
                this.player.velocityY = 0; // Stop upward movement
            }
            
            // Check landing on starting platform
            if (this.player.velocityY > 0) { // Falling down
                this.checkStartPlatformLanding();
            }
        } else {
            // Player is not jumping - keep them on platform
            if (this.player.currentPlatform) {
                // Standing on a moving platform that stopped
                this.player.y = this.player.currentPlatform.y - this.player.height;
            } else {
                // Standing on starting platform (always ensure correct position)
                this.player.y = this.startPlatform.y - this.player.height;
            }
            this.player.velocityY = 0;
            this.player.onPlatform = true;
        }
    }
    
    updateCamera() {
        // Определяем на каком уровне должна быть камера
        // Камера поднимается только когда игрок переходит на более высокий уровень
        const levelHeight = 60;
        let targetLevel = 0;
        
        // Если игрок на движущемся облаке, проверяем его уровень
        if (this.player.currentPlatform) {
            const platformLevel = Math.round((this.startPlatform.y - this.player.currentPlatform.y) / levelHeight);
            targetLevel = Math.max(0, platformLevel - 1); // Камера чуть отстает
        }
        
        this.camera.targetY = levelHeight * targetLevel;
        
        // Плавно перемещаем камеру к целевой позиции
        const diff = this.camera.targetY - this.camera.y;
        this.camera.y += diff * this.camera.smoothness;
    }
    
    updateMovingPlatforms() {
        for (let i = this.movingPlatforms.length - 1; i >= 0; i--) {
            const platform = this.movingPlatforms[i];
            
            if (!platform.active) continue;
            
            // Двигаем платформу только если она не остановлена
            if (!platform.stopped) {
                platform.x += platform.direction * platform.speed;
            }
            
            // Проверяем, ушла ли платформа за экран
            if ((platform.direction === 1 && platform.x > this.width + 50) ||
                (platform.direction === -1 && platform.x < -platform.width - 50)) {
                
                // НЕ удаляем платформу, если игрок на ней стоит!
                if (this.player.currentPlatform === platform) {
                    console.log('Platform went off screen but player is on it - keeping it');
                    // Останавливаем платформу в безопасном месте
                    if (platform.direction === 1) {
                        platform.x = this.width - platform.width - 10;
                    } else {
                        platform.x = 10;
                    }
                    platform.stopped = true;
                    return; // Не удаляем эту платформу
                }
                
                // Если игрок промахнулся мимо этой платформы, спавним новую
                if (!platform.stopped && this.gameState === 'playing') {
                    console.log('Player missed the cloud, spawning new one');
                    this.spawnNextPlatform();
                }
                
                // Удаляем платформу только если игрок НЕ на ней
                this.movingPlatforms.splice(i, 1);
            }
        }
    }
    
    checkStartPlatformLanding() {
        // Упрощенная и надежная проверка приземления на стартовую платформу
        if (this.player.velocityY <= 0) return; // Только при падении
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const platformCenterX = this.startPlatform.x + this.startPlatform.width / 2;
        const playerBottom = this.player.y + this.player.height;
        
        // Проверяем, находится ли игрок над платформой по X
        const xDistance = Math.abs(playerCenterX - platformCenterX);
        const maxXDistance = (this.player.width + this.startPlatform.width) / 2;
        
        // Проверяем, касается ли игрок платформы по Y
        const yDistance = Math.abs(playerBottom - this.startPlatform.y);
        
        if (xDistance < maxXDistance && yDistance < 20) {
            // Приземлились на стартовую платформу
            this.player.y = this.startPlatform.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.onPlatform = true;
            this.player.currentPlatform = null;
            console.log('Landed on starting platform successfully');
        }
    }

    checkCollisions() {
        if (!this.player.isJumping || this.gameState !== 'playing') return;
        
        // Проверяем коллизию с движущимися платформами
        for (const platform of this.movingPlatforms) {
            if (!platform.active) continue;
            
            // Проверяем пересечение
            if (this.player.x < platform.x + platform.width &&
                this.player.x + this.player.width > platform.x &&
                this.player.y < platform.y + platform.height &&
                this.player.y + this.player.height > platform.y) {
                
                const playerCenterX = this.player.x + this.player.width / 2;
                const platformCenterX = platform.x + platform.width / 2;
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                
                const xDistance = Math.abs(playerCenterX - platformCenterX);
                const maxXDistance = (this.player.width + platform.width) / 2;
                const yDistance = Math.abs(playerBottom - platform.y);
                
                // ПРИЗЕМЛЕНИЕ: игрок падает и находится над платформой
                if (this.player.velocityY > 0 && 
                    xDistance < maxXDistance && 
                    yDistance < 25 &&
                    playerBottom <= platform.y + 10) {
                    
                                        // Успешное приземление!
                    console.log('Successful landing on platform!');
                    
                    // Игрок приземлился на платформу
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    this.player.onPlatform = true;
                    this.player.currentPlatform = platform;
                    
                    // Play landing sound
                    if (this.audioManager) {
                        this.audioManager.playLanding();
                    }
                    
                    // ОСТАНАВЛИВАЕМ текущую платформу
                    platform.speed = 0;
                    platform.stopped = true;
                    
                    // Проверяем, перешел ли игрок на более высокий уровень
                    const levelHeight = 60;
                    const currentPlatformLevel = Math.round((this.startPlatform.y - platform.y) / levelHeight);
                    const maxReachedLevel = this.score; // Максимальный достигнутый уровень
                    
                    if (currentPlatformLevel > maxReachedLevel) {
                        // Игрок достиг нового уровня!
                        this.score = currentPlatformLevel;
                        if (this.score > this.bestScore) {
                            this.bestScore = this.score;
                            localStorage.setItem('bestScore', this.bestScore.toString());
                        }
                        
                        // Вызываем колбэк обновления счета
                        if (this.onScoreChange) {
                            this.onScoreChange(this.score);
                        }
                        
                        // Спавним следующую платформу только при переходе на новый уровень
                        this.spawnNextPlatform();
                        console.log(`New level reached: ${this.score}`);
                    } else {
                        console.log(`Stayed on same level: ${currentPlatformLevel}`);
                    }
                    
                } else {
                    // Проверяем тип столкновения
                    const isHeadCollision = this.player.velocityY < 0 && playerTop >= platform.y - 5;
                    const isSideCollision = Math.abs(xDistance) > maxXDistance * 0.7;
                    
                    // УДАР ГОЛОВОЙ: игрок летит вверх и ударяется в низ платформы
                    if (isHeadCollision) {
                        console.log('COLLISION DEBUG - Head collision detected:', {
                            playerVelocityY: this.player.velocityY,
                            playerTop: playerTop,
                            platformY: platform.y,
                            isHeadCollision: isHeadCollision
                        });
                        this.gameState = 'gameOver';
                    }
                    // УДАР СБОКУ: игрок врезается в бок платформы
                    else if (isSideCollision) {
                        this.gameState = 'gameOver';
                    }
                    // ПРОЛЕТ СНИЗУ: разрешаем (не делаем ничего)
                    else {
                        return; // Не останавливаем игру
                    }
                    
                    // Если дошли сюда - игра окончена
                    if (this.gameState === 'gameOver') {
                        // Play game over sound
                        if (this.audioManager) {
                            this.audioManager.playGameOver();
                            // Stop background music
                            this.audioManager.stopBackgroundMusic();
                        }
                        // Вызываем колбэк окончания игры
                        if (this.onGameOver) {
                            this.onGameOver(this.score);
                        }
                    }
                }
            }
        }
    }
    
    checkGameOver() {
        if (this.gameState !== 'playing') return;
        
        // Проверяем, упал ли игрок слишком низко
        if (this.player.y > this.height + 100) {
            this.gameState = 'gameOver';
            
            // Play game over sound
            if (this.audioManager) {
                this.audioManager.playGameOver();
                // Stop background music
                this.audioManager.stopBackgroundMusic();
            }
            // Вызываем колбэк окончания игры
            if (this.onGameOver) {
                this.onGameOver(this.score);
            }
        }
    }
    
    render() {
        // Очищаем канвас
        this.ctx.fillStyle = '#87CEEB'; // Небесно-голубой фон
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Сохраняем контекст для применения смещения камеры
        this.ctx.save();
        this.ctx.translate(0, this.camera.y);
        
        // Рисуем стартовое облако (более плотное)
        this.drawStartCloud(this.startPlatform.x, this.startPlatform.y, 
                           this.startPlatform.width, this.startPlatform.height);
        
        // Рисуем движущиеся облака
        for (const platform of this.movingPlatforms) {
            if (platform.active) {
                // Рисуем облако
                this.drawCloud(platform.x, platform.y, platform.width, platform.height);
            }
        }
        
        // Draw player
        this.drawPlayer();
        
        // Восстанавливаем контекст (убираем смещение камеры)
        this.ctx.restore();
        
        // Рисуем интерфейс (без смещения камеры)
        this.renderUI();
    }
    
    drawCloud(x, y, width, height) {
        // Убираем контуры
        this.ctx.strokeStyle = 'transparent';
        this.ctx.lineWidth = 0;
        
        // Рисуем облако из нескольких кругов
        this.ctx.fillStyle = 'white';
        
        // Основа облака
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.2, y + height * 0.6, height * 0.6, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.4, y + height * 0.4, height * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.6, y + height * 0.4, height * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.8, y + height * 0.6, height * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Добавляем тень для объема
        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.2, y + height * 0.8, height * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.4, y + height * 0.7, height * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.6, y + height * 0.7, height * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.8, y + height * 0.8, height * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawStartCloud(x, y, width, height) {
        // Убираем контуры
        this.ctx.strokeStyle = 'transparent';
        this.ctx.lineWidth = 0;
        
        // Рисуем стартовое облако (более плотное и серое)
        this.ctx.fillStyle = '#F0F0F0';
        
        // Основа облака
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.15, y + height * 0.5, height * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.3, y + height * 0.3, height * 0.9, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.5, y + height * 0.2, height * 1.0, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.7, y + height * 0.3, height * 0.9, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.85, y + height * 0.5, height * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Добавляем тень для объема
        this.ctx.fillStyle = 'rgba(180, 180, 180, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.15, y + height * 0.8, height * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.3, y + height * 0.7, height * 0.6, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.5, y + height * 0.6, height * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.7, y + height * 0.7, height * 0.6, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.85, y + height * 0.8, height * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    loadDefaultSkin() {
        // Load your default skin as developer (REQUIRED - no fallbacks)
        this.defaultSkin = new Image();
        this.defaultSkin.onload = () => {
            console.log('Default skin loaded successfully');
        };
        this.defaultSkin.onerror = () => {
            console.error('CRITICAL: Default skin failed to load! Check file path.');
            // Create a simple colored rectangle as absolute emergency fallback
            const canvas = document.createElement('canvas');
            canvas.width = 30;
            canvas.height = 30;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#4A90E2';
            ctx.fillRect(0, 0, 30, 30);
            this.defaultSkin.src = canvas.toDataURL();
        };
        
        // 🎨 ЗАМЕНИТЕ ЭТОТ ПУТЬ НА СВОЮ КАРТИНКУ:
        // Примеры:
        // this.defaultSkin.src = 'skins/default/my-character.png';
        // this.defaultSkin.src = 'skins/default/hero.jpg';
        this.defaultSkin.src = 'skins/default/stiker2153462345623456.png';
    }

    loadPlayerSkin() {
        // Try to load custom player skin
        const skinPath = localStorage.getItem('customPlayerSkin');
        if (skinPath) {
            this.playerSkin = new Image();
            this.playerSkin.onload = () => {
                console.log('Custom player skin loaded successfully');
                
                // НЕ ТРОГАЕМ позицию игрока во время игры!
                if (this.gameState === 'waiting') {
                    // Только в начальном состоянии корректируем позицию
                    this.player.y = this.startPlatform.y - this.player.height;
                    this.player.onPlatform = true;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                }
            };
            this.playerSkin.onerror = () => {
                console.log('Failed to load custom skin, using default');
                this.playerSkin = null;
            };
            this.playerSkin.src = skinPath;
        }
    }
    
    drawPlayer() {
        // Priority: Custom skin > Your default skin (always available)
        if (this.playerSkin && this.playerSkin.complete) {
            // Draw custom skin image - stretched to full player size
            this.ctx.drawImage(
                this.playerSkin, 
                this.player.x, 
                this.player.y, 
                this.player.width, 
                this.player.height
            );
        } else if (this.defaultSkin && this.defaultSkin.complete) {
            // Draw your default skin
            this.ctx.drawImage(
                this.defaultSkin, 
                this.player.x, 
                this.player.y, 
                this.player.width, 
                this.player.height
            );
        } else {
            // Emergency fallback: simple rectangle while skins are loading
            this.ctx.fillStyle = '#4A90E2';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
    }
    
    renderUI() {
        // Score and Best only
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        this.ctx.fillText(`Best: ${this.bestScore}`, 20, 70);
        
        // Instructions depending on state (only for waiting/game over)
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        
        if (this.gameState === 'waiting') {
            this.ctx.fillText('Press SPACE to start the game', this.width/2, this.height - 50);
            this.ctx.fillText('Jump on moving platforms!', this.width/2, this.height - 25);
        } else if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.fillText('GAME OVER', this.width/2, this.height/2 - 50);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.width/2, this.height/2);
            this.ctx.fillText(`Best: ${this.bestScore}`, this.width/2, this.height/2 + 30);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press ENTER to restart', this.width/2, this.height/2 + 80);
        }
    }
    
    reset() {
        this.gameState = 'waiting';
        this.score = 0;
        
        // Сбрасываем игрока (размещаем точно на стартовой платформе)
        this.player.x = this.width / 2 - 15;
        this.player.y = this.startPlatform.y - this.player.height; // Точно на платформе
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.onPlatform = true;
        this.player.currentPlatform = null;
        
        // Сбрасываем камеру
        this.camera.y = 0;
        this.camera.targetY = 0;
        
        // Очищаем платформы
        this.movingPlatforms = [];
        
        console.log('Game reset, player position:', this.player.x, this.player.y);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Game launch
let game;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting game...');
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    
    console.log('Canvas found, creating game...');
    try {
        game = new TimingJumpGame('gameCanvas');
        console.log('Game successfully created!');
    } catch (error) {
        console.error('Error creating game:', error);
    }
});
