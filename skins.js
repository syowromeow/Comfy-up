class SkinManager {
    constructor() {
        this.skins = [];
        this.currentSkin = null;
        this.playerScore = 0;
        
        this.init();
    }
    
    init() {
        this.loadSkins();
        this.loadPlayerScore();
        this.setupEventListeners();
        this.updateShopDisplay();
    }
    
    loadSkins() {
        // Базовые скины
        this.skins = [
            {
                id: 'default',
                name: 'Basic',
                path: 'skins/default/ball.png',
                price: 0,
                owned: true,
                selected: true
            }
        ];
        
        // Загружаем сохраненные скины
        this.loadSavedSkins();
        
        // Загружаем текущий выбранный скин
        this.loadCurrentSkin();
    }
    
    loadSavedSkins() {
        const savedSkins = localStorage.getItem('gameSkins');
        if (savedSkins) {
            try {
                const parsed = JSON.parse(savedSkins);
                // Обновляем информацию о купленных скинах
                parsed.forEach(savedSkin => {
                    const existingSkin = this.skins.find(s => s.id === savedSkin.id);
                    if (existingSkin) {
                        existingSkin.owned = savedSkin.owned;
                        existingSkin.selected = savedSkin.selected;
                    }
                });
            } catch (e) {
                console.error('Ошибка загрузки скинов:', e);
            }
        }
    }
    
    loadCurrentSkin() {
        const currentSkinId = localStorage.getItem('currentSkinId') || 'default';
        this.selectSkin(currentSkinId);
    }
    
    loadPlayerScore() {
        this.playerScore = parseInt(localStorage.getItem('playerScore') || '0');
    }
    
    setupEventListeners() {
        // Обработчик загрузки файлов
        const skinUpload = document.getElementById('skinUpload');
        if (skinUpload) {
            skinUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Обработчик кнопки загрузки
        const uploadButton = document.getElementById('uploadSkin');
        if (uploadButton) {
            uploadButton.addEventListener('click', () => this.processUploadedSkins());
        }
    }
    
    handleFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // Показываем информацию о загружаемых файлах
        this.showUploadPreview(files);
    }
    
    showUploadPreview(files) {
        const uploadButton = document.getElementById('uploadSkin');
        if (!uploadButton) return;
        
        let previewText = `Selected files: ${files.length}\n`;
        for (let file of files) {
            previewText += `- ${file.name} (${this.formatFileSize(file.size)})\n`;
        }
        
        uploadButton.textContent = `Upload ${files.length} skin(s)`;
        uploadButton.title = previewText;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    processUploadedSkins() {
        const fileInput = document.getElementById('skinUpload');
        if (!fileInput || !fileInput.files) return;
        
        const files = Array.from(fileInput.files);
        let uploadedCount = 0;
        
        files.forEach(file => {
            if (this.validateSkinFile(file)) {
                if (this.addSkinFromFile(file)) {
                    uploadedCount++;
                }
            }
        });
        
        if (uploadedCount > 0) {
            this.saveSkins();
            this.updateShopDisplay();
            this.showNotification(`Successfully uploaded ${uploadedCount} skin(s)!`);
        }
        
        // Очищаем input
        fileInput.value = '';
        const uploadButton = document.getElementById('uploadSkin');
        if (uploadButton) {
            uploadButton.textContent = 'Upload';
            uploadButton.title = '';
        }
    }
    
    validateSkinFile(file) {
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            this.showNotification(`File ${file.name} is not an image`, 'error');
            return false;
        }
        
        // Проверяем размер (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification(`File ${file.name} is too large (maximum 5MB)`, 'error');
            return false;
        }
        
        return true;
    }
    
    addSkinFromFile(file) {
        try {
            // Создаем уникальный ID для скина
            const skinId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Создаем URL для файла
            const skinUrl = URL.createObjectURL(file);
            
            // Добавляем скин в список
            const newSkin = {
                id: skinId,
                name: file.name.replace(/\.[^/.]+$/, ''), // Убираем расширение
                path: skinUrl,
                price: 1000, // Базовая цена для загруженных скинов
                owned: false,
                selected: false,
                isCustom: true
            };
            
            this.skins.push(newSkin);
            return true;
            
        } catch (error) {
            console.error('Error adding skin:', error);
            this.showNotification(`Error adding skin ${file.name}`, 'error');
            return false;
        }
    }
    
    buySkin(skinId) {
        const skin = this.skins.find(s => s.id === skinId);
        if (!skin) return false;
        
        if (skin.owned) {
            this.selectSkin(skinId);
            return true;
        }
        
        if (this.playerScore >= skin.price) {
            // Покупаем скин
            skin.owned = true;
            this.playerScore -= skin.price;
            
            // Сохраняем изменения
            this.saveSkins();
            this.savePlayerScore();
            
            // Обновляем отображение
            this.updateShopDisplay();
            this.updateCurrentSkinDisplay();
            
            this.showNotification(`Skin "${skin.name}" purchased!`);
            return true;
        } else {
            this.showNotification('Not enough points to buy!', 'error');
            return false;
        }
    }
    
    selectSkin(skinId) {
        // Снимаем выделение со всех скинов
        this.skins.forEach(skin => skin.selected = false);
        
        // Выбираем новый скин
        const selectedSkin = this.skins.find(s => s.id === skinId);
        if (selectedSkin && selectedSkin.owned) {
            selectedSkin.selected = true;
            this.currentSkin = selectedSkin;
            
            // Сохраняем выбор
            localStorage.setItem('currentSkinId', skinId);
            localStorage.setItem('currentSkin', selectedSkin.path);
            
            // Обновляем отображение
            this.updateCurrentSkinDisplay();
            this.updateShopDisplay();
            
            this.showNotification(`Selected skin "${selectedSkin.name}"`);
        }
    }
    
    updateShopDisplay() {
        const skinsGrid = document.getElementById('skinsGrid');
        if (!skinsGrid) return;
        
        skinsGrid.innerHTML = '';
        
        this.skins.forEach(skin => {
            const skinElement = this.createSkinElement(skin);
            skinsGrid.appendChild(skinElement);
        });
    }
    
    createSkinElement(skin) {
        const skinDiv = document.createElement('div');
        skinDiv.className = `skin-item ${skin.selected ? 'selected' : ''} ${skin.owned ? 'owned' : ''}`;
        skinDiv.dataset.skinId = skin.id;
        
        // Создаем изображение
        const img = document.createElement('img');
        img.src = skin.path;
        img.alt = skin.name;
        img.onerror = () => {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMzAiIGZpbGw9IiM5NUExQTYiLz4KPHN2ZyB4PSIyNSIgeT0iMjUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyTDEzLjA5IDguMjZMMjIgOWwtNi4wOSAzLjc0TDEyIDIybC0zLjkxLTEuMjZMMiA5bDYuMDktMS4yNkwxMiAyeiIvPgo8L3N2Zz4KPC9zdmc+';
        };
        
        // Создаем название
        const nameDiv = document.createElement('div');
        nameDiv.className = 'skin-name';
        nameDiv.textContent = skin.name;
        
        // Создаем цену
        const priceDiv = document.createElement('div');
        priceDiv.className = `skin-price ${skin.price === 0 ? 'free' : ''}`;
        priceDiv.textContent = skin.price === 0 ? 'Free' : `${skin.price} points`;
        
        // Создаем кнопку
        const button = document.createElement('button');
        button.className = 'buy-button';
        
        if (skin.owned) {
            button.textContent = skin.selected ? 'Selected' : 'Select';
            button.disabled = skin.selected;
            button.onclick = () => this.selectSkin(skin.id);
        } else {
            button.textContent = `Buy for ${skin.price}`;
            button.disabled = this.playerScore < skin.price;
            button.onclick = () => this.buySkin(skin.id);
        }
        
        // Собираем элемент
        skinDiv.appendChild(img);
        skinDiv.appendChild(nameDiv);
        skinDiv.appendChild(priceDiv);
        skinDiv.appendChild(button);
        
        return skinDiv;
    }
    
    updateCurrentSkinDisplay() {
        const currentSkinImage = document.getElementById('currentSkinImage');
        const currentSkinName = document.getElementById('currentSkinName');
        
        if (currentSkinImage && currentSkinName && this.currentSkin) {
            currentSkinImage.src = this.currentSkin.path;
            currentSkinName.textContent = this.currentSkin.name;
        }
    }
    
    saveSkins() {
        const skinsData = this.skins.map(skin => ({
            id: skin.id,
            owned: skin.owned,
            selected: skin.selected
        }));
        
        localStorage.setItem('gameSkins', JSON.stringify(skinsData));
    }
    
    savePlayerScore() {
        localStorage.setItem('playerScore', this.playerScore.toString());
    }
    
    addScore(points) {
        this.playerScore += points;
        this.savePlayerScore();
        
        // Обновляем отображение магазина, если он открыт
        if (document.getElementById('shopScreen').classList.contains('active')) {
            this.updateShopDisplay();
        }
    }
    
    getCurrentSkin() {
        return this.currentSkin || this.skins.find(s => s.id === 'default');
    }
    
    showNotification(message, type = 'success') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#FF6B6B' : '#27AE60'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            font-weight: 600;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Метод для получения всех доступных скинов
    getAvailableSkins() {
        return this.skins.filter(skin => skin.owned);
    }
    
    // Метод для проверки, куплен ли скин
    isSkinOwned(skinId) {
        const skin = this.skins.find(s => s.id === skinId);
        return skin ? skin.owned : false;
    }
    
    // Метод для получения цены скина
    getSkinPrice(skinId) {
        const skin = this.skins.find(s => s.id === skinId);
        return skin ? skin.price : 0;
    }
}

// Экспортируем класс для использования в других файлах
window.SkinManager = SkinManager;

