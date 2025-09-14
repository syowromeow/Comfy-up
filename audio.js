// Audio system for Comfy Up Game
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.isMuted = false;
        this.musicStopped = false;
        this.backgroundMusic = null;
        
        // Mobile audio support
        this.isInitialized = false;
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.needsUserInteraction = this.isMobile;
        
    
        this.init();
    }
    
    init() {
        try {
            // Create Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio system initialized');
            
            // Create sound effects
            this.createSounds();
            
        } catch (error) {
            console.warn('Audio not supported:', error);
        }
    }
    
    createSounds() {
        // Create jump sound using Web Audio API
        this.sounds.jump = () => this.createJumpSound();
        
        // Create background music
        this.createBackgroundMusic();
    }
    
    createJumpSound() {
        if (!this.audioContext || this.isMuted) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure jump sound (upward swoosh)
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.2);
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            // Play sound
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
            
        } catch (error) {
            console.warn('Jump sound error:', error);
        }
    }
    
    createBackgroundMusic() {
        if (!this.audioContext || this.isMuted) return;
        
        try {
            // Create a simple ambient background track
            const createTone = (frequency, startTime, duration) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, startTime);
                
                // Soft volume for background
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.1, startTime + 0.1);
                gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.1, startTime + duration - 0.1);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
                
                return oscillator;
            };
            
            // Create a simple melody pattern
            this.playBackgroundLoop = () => {
                if (!this.audioContext || this.isMuted || this.musicStopped) return;
                
                const now = this.audioContext.currentTime;
                const noteDuration = 2;
                
                // Simple chord progression: C - Am - F - G
                const melody = [
                    [261.63, 329.63, 392.00], // C major
                    [220.00, 261.63, 329.63], // A minor  
                    [174.61, 220.00, 261.63], // F major
                    [196.00, 246.94, 293.66]  // G major
                ];
                
                melody.forEach((chord, index) => {
                    const startTime = now + (index * noteDuration);
                    chord.forEach(frequency => {
                        createTone(frequency, startTime, noteDuration * 0.8);
                    });
                });
                
                // Schedule next loop
                setTimeout(() => {
                    if (!this.isMuted && !this.musicStopped) {
                        this.playBackgroundLoop();
                    }
                }, melody.length * noteDuration * 1000);
            };
            
        } catch (error) {
            console.warn('Background music error:', error);
        }
    }
    
    playJump() {
        if (this.sounds.jump) {
            this.sounds.jump();
        }
    }
    
    startBackgroundMusic() {
    if (this.audioContext && this.playBackgroundLoop && !this.isMuted) {
        // Mobile check - don't start until user interaction
        if (this.needsUserInteraction && !this.isInitialized) {
            console.log('Waiting for user interaction to start music on mobile');
            return;
        }
        
        // Resume audio context if suspended...
    }
        if (this.audioContext && this.playBackgroundLoop && !this.isMuted) {
            // Resume audio context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.musicStopped = false;
            this.playBackgroundLoop();
        }
    }
    
    stopBackgroundMusic() {
        // Stop background music but don't mute all sounds
        this.musicStopped = true;
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // Stop all audio
            if (this.audioContext) {
                this.audioContext.suspend();
            }
        } else {
            // Resume audio
            if (this.audioContext) {
                this.audioContext.resume();
                // Don't auto-restart music when unmuting, let game control it
            }
        }
        
        return this.isMuted;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Create success/landing sound
    playLanding() {
        if (!this.audioContext || this.isMuted) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Landing sound (downward tone)
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
            
        } catch (error) {
            console.warn('Landing sound error:', error);
        }
    }
    
    // Create game over sound
    playGameOver() {
        if (!this.audioContext || this.isMuted) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Game over sound (dramatic descending)
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
        } catch (error) {
            console.warn('Game over sound error:', error);
        }
    }
        
    // Initialize audio after user interaction (for mobile)
    initializeAfterUserInteraction() {
        if (this.needsUserInteraction && !this.isInitialized) {
            console.log('Initializing audio after user interaction');
            this.isInitialized = true;
            this.startBackgroundMusic();
        }
    }
}

// Export for use in other files
window.AudioManager = AudioManager;
