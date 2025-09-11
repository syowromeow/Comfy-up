// Основной файл инициализации игры
class GameManager {
    constructor() {
        this.game = null;
        this.skinManager = null;
        this.leaderboard = null;
        this.currentScreen = 'mainMenu';
        
        this.init();
    }
    
    init() {
        // Инициализируем менеджеры
        this.skinManager = new SkinManager();
        this.leaderboard = new Leaderboard();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Загружаем никнейм игрока
        this.loadPlayerNickname();
        
        // Показываем главное меню
        this.showScreen('mainMenu');
    }
    
    setupEventListeners() {
        // Кнопка "Начать игру"
        const startGameBtn = document.getElementById('startGame');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }
        
        // Кнопка "Лидерборд"
        const leaderboardBtn = document.getElementById('openLeaderboard');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => this.showScreen('leaderboard'));
        }
        
        // Кнопка "Магазин скинов"
        const shopBtn = document.getElementById('openShop');
        if (shopBtn) {
            shopBtn.addEventListener('click', () => this.showScreen('shop'));
        }
        
        // Кнопка "Играть снова"
        const playAgainBtn = document.getElementById('playAgain');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.startGame());
        }
        
        // Кнопка "Главное меню"
        const mainMenuBtn = document.getElementById('goToMainMenu');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => this.showScreen('mainMenu'));
        }
        
        // Кнопка "Магазин" из экрана окончания игры
        const goToShopBtn = document.getElementById('goToShop');
        if (goToShopBtn) {
            goToShopBtn.addEventListener('click', () => this.showScreen('shop'));
        }
        
        // Кнопка "Лидерборд" из экрана окончания игры
        const goToLeaderboardBtn = document.getElementById('goToLeaderboard');
        if (goToLeaderboardBtn) {
            goToLeaderboardBtn.addEventListener('click', () => this.showScreen('leaderboard'));
        }
        
        // Кнопки "Назад"
        const backFromLeaderboardBtn = document.getElementById('backFromLeaderboard');
        if (backFromLeaderboardBtn) {
            backFromLeaderboardBtn.addEventListener('click', () => this.showScreen('mainMenu'));
        }
        
        const backFromShopBtn = document.getElementById('backFromShop');
        if (backFromShopBtn) {
            backFromShopBtn.addEventListener('click', () => this.showScreen('mainMenu'));
        }
        
        // Обработчик ввода никнейма
        const nicknameInput = document.getElementById('nickname');
        if (nicknameInput) {
            nicknameInput.addEventListener('input', (e) => this.validateNickname(e.target.value));
            nicknameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.startGame();
                }
            });
        }
        
        // Обработчик клавиш для игры
        document.addEventListener('keydown', (e) => {
            if (this.game && this.currentScreen === 'game') {
                this.game.handleKeyDown(e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.game && this.currentScreen === 'game') {
                this.game.handleKeyUp(e);
            }
        });
    }
    
    validateNickname(nickname) {
        const errorElement = document.getElementById('nicknameError');
        const startGameBtn = document.getElementById('startGame');
        
        if (!errorElement || !startGameBtn) return;
        
        if (nickname.length < 3) {
            errorElement.textContent = 'Nickname must contain at least 3 characters';
            errorElement.style.display = 'block';
            startGameBtn.disabled = true;
        } else if (nickname.length > 12) {
            errorElement.textContent = 'Nickname must not exceed 12 characters';
            errorElement.style.display = 'block';
            startGameBtn.disabled = true;
        } else {
            errorElement.style.display = 'none';
            startGameBtn.disabled = false;
        }
    }
    
    loadPlayerNickname() {
        const nicknameInput = document.getElementById('nickname');
        const savedNickname = localStorage.getItem('playerNickname');
        
        if (nicknameInput && savedNickname) {
            nicknameInput.value = savedNickname;
            this.validateNickname(savedNickname);
        }
    }
    
    startGame() {
        // Проверяем никнейм
        const nicknameInput = document.getElementById('nickname');
        if (!nicknameInput || nicknameInput.value.length < 3) {
            alert('Please enter a nickname (minimum 3 characters)');
            return;
        }
        
        // Сохраняем никнейм
        const nickname = nicknameInput.value.trim();
        localStorage.setItem('playerNickname', nickname);
        
        // Показываем игровой экран
        this.showScreen('game');
        
        // Создаем и запускаем игру
        this.createGame();
    }
    
    createGame() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas не найден!');
            return;
        }
        
        // Создаем новую игру
        this.game = new CloudJumpGame(canvas);
        
        // Обновляем отображение никнейма
        const nicknameDisplay = document.getElementById('playerNickname');
        if (nicknameDisplay) {
            nicknameDisplay.textContent = localStorage.getItem('playerNickname') || 'Игрок';
        }
        
        // Обновляем счет
        this.updateScore(0);
    }
    
    updateScore(score) {
        const scoreElement = document.getElementById('currentScore');
        if (scoreElement) {
            scoreElement.textContent = score;
        }
        
        // Обновляем счет в менеджере скинов
        if (this.skinManager) {
            this.skinManager.addScore(score - (this.skinManager.playerScore || 0));
        }
    }
    
    showScreen(screenName) {
        // Скрываем все экраны
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Показываем нужный экран
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
        
        // Останавливаем игру, если переключаемся с игрового экрана
        if (screenName !== 'game' && this.game) {
            this.game.gameState = 'paused';
            if (this.game.animationId) {
                cancelAnimationFrame(this.game.animationId);
            }
        }
        
        // Обновляем отображение в зависимости от экрана
        switch (screenName) {
            case 'leaderboard':
                this.leaderboard.updateLeaderboard();
                break;
            case 'shop':
                this.skinManager.updateShopDisplay();
                break;
        }
    }
    
    // Метод для перезапуска игры
    restartGame() {
        if (this.game) {
            this.game.reset();
        }
    }
    
    // Метод для завершения игры
    endGame(score) {
        if (this.game) {
            this.game.score = score;
            this.game.gameOver();
        }
    }
}

// Инициализируем игру когда страница загружена
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});

// Экспортируем класс для использования в других файлах
window.GameManager = GameManager;
