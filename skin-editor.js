class SkinEditor {
    constructor() {
        this.currentImage = null;
        this.originalImage = null;
        this.cropData = null;
        this.processedImageData = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDropZone();
    }
    
    setupEventListeners() {
        // File selection
        document.getElementById('selectFile').addEventListener('click', () => {
            document.getElementById('editorFileInput').click();
        });
        
        document.getElementById('editorFileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });
        
        // Clear editor
        document.getElementById('clearEditor').addEventListener('click', () => {
            this.clearEditor();
        });
        
        // Apply skin
        document.getElementById('applySkin').addEventListener('click', () => {
            this.applySkin();
        });
    }
    
    setupDropZone() {
        const dropZone = document.getElementById('dropZone');
        
        // Click to select file
        dropZone.addEventListener('click', () => {
            document.getElementById('editorFileInput').click();
        });
        
        // Drag and drop functionality
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(74, 144, 226, 0.2)';
            dropZone.style.borderColor = '#27AE60';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(74, 144, 226, 0.1)';
            dropZone.style.borderColor = '#4A90E2';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.background = 'rgba(74, 144, 226, 0.1)';
            dropZone.style.borderColor = '#4A90E2';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }
    
    handleFileSelect(file) {
        if (!file) return;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file (PNG, JPG, GIF, SVG)', 'error');
            return;
        }
        
        // Check file size (max 10MB for editor)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('File too large. Please choose an image smaller than 10MB.', 'error');
            return;
        }
        
        // Update file info
        this.updateFileInfo(file);
        
        // Load image
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    updateFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('imageInfo').style.display = 'block';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    loadImage(imageSrc) {
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.currentImage = img;
            
            // Update file dimensions
            document.getElementById('fileDimensions').textContent = `${img.width} x ${img.height}`;
            
            // Show original preview
            this.showOriginalPreview(imageSrc);
            
            // Automatically process to 120x120
            this.autoProcessImage();
            
            this.showNotification('Image loaded and converted to 120x120!', 'success');
        };
        
        img.onerror = () => {
            this.showNotification('Failed to load image. Please try a different file.', 'error');
        };
        
        img.src = imageSrc;
    }
    
    showOriginalPreview(imageSrc) {
        const preview = document.getElementById('originalPreview');
        preview.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        
        preview.appendChild(img);
    }
    
    
    autoProcessImage() {
        if (!this.originalImage) {
            this.showNotification('No image to process.', 'error');
            return;
        }
        
        // Create processing canvas - always 120x120
        const processCanvas = document.createElement('canvas');
        const processCtx = processCanvas.getContext('2d');
        
        processCanvas.width = 120;
        processCanvas.height = 120;
        
        // Clear background (transparent)
        processCtx.clearRect(0, 0, 120, 120);
        
        // Draw image stretched to fill entire 120x120 area
        processCtx.drawImage(
            this.originalImage,
            0, 0, this.originalImage.width, this.originalImage.height,
            0, 0, 120, 120
        );
        
        // Get processed image data
        this.processedImageData = processCanvas.toDataURL('image/png');
        
        // Show processed preview
        this.showProcessedPreview();
        
        // Enable apply button
        document.getElementById('applySkin').disabled = false;
        
        // Hide crop section since we don't need it (if it exists)
        const cropSection = document.getElementById('cropSection');
        if (cropSection) {
            cropSection.style.display = 'none';
        }
    }

    
    showProcessedPreview() {
        const preview = document.getElementById('processedPreview');
        preview.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = this.processedImageData;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        
        preview.appendChild(img);
        
        // Also update game preview
        const gamePreview = document.getElementById('gamePreview');
        gamePreview.innerHTML = '';
        
        const gameImg = document.createElement('img');
        gameImg.src = this.processedImageData;
        gameImg.style.width = '100%';
        gameImg.style.height = '100%';
        gameImg.style.objectFit = 'cover';
        gameImg.style.borderRadius = '3px';
        
        gamePreview.appendChild(gameImg);
    }
    
    applySkin() {
        if (!this.processedImageData) {
            this.showNotification('Please process an image first.', 'error');
            return;
        }
        
        // Save to localStorage (same as existing custom skin system)
        localStorage.setItem('customPlayerSkin', this.processedImageData);
        
        // Update main menu preview
        if (typeof updateSkinPreview === 'function') {
            updateSkinPreview(this.processedImageData);
        }
        
        // Reload skin in current game if running
        if (typeof currentGame !== 'undefined' && currentGame) {
            currentGame.loadPlayerSkin();
        }
        
        this.showNotification('Skin applied successfully! 🎉', 'success');
        
        // Auto-return to main menu after a short delay
        setTimeout(() => {
            if (typeof showScreen === 'function') {
                showScreen('mainMenu');
            }
        }, 2000);
    }
    
    clearEditor() {
        // Reset all data
        this.currentImage = null;
        this.originalImage = null;
        this.processedImageData = null;
        
        // Clear previews
        document.getElementById('originalPreview').innerHTML = 'No image';
        document.getElementById('processedPreview').innerHTML = 'Auto-sized';
        document.getElementById('gamePreview').innerHTML = '30x30';
        
        // Hide sections
        document.getElementById('imageInfo').style.display = 'none';
        
        // Disable buttons
        document.getElementById('applySkin').disabled = true;
        
        // Clear file input
        document.getElementById('editorFileInput').value = '';
        
        this.showNotification('Editor cleared.', 'info');
    }
    
    showNotification(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#FF6B6B' : type === 'success' ? '#27AE60' : '#4A90E2'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            font-weight: 600;
            max-width: 300px;
            word-wrap: break-word;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize skin editor when DOM is loaded
let skinEditor;
document.addEventListener('DOMContentLoaded', () => {
    skinEditor = new SkinEditor();
});
