// Firebase-based Leaderboard for global scores
class FirebaseLeaderboard {
    constructor() {
        this.leaderboard = [];
        this.database = null;
        this.isOnline = false;
        this.localLeaderboard = new Leaderboard(); // Fallback to local storage
        this.init();
    }

    async init() {
        console.log('🏆 Initializing Firebase Leaderboard...');
        
        // Try to initialize Firebase
        const firebaseReady = await initializeFirebase();
        
        if (firebaseReady) {
            this.database = getFirebaseDatabase();
            this.isOnline = true;
            this.setupRealtimeListener();
            console.log('🌐 Online leaderboard ready');
        } else {
            console.log('📱 Using offline leaderboard as fallback');
            this.isOnline = false;
        }
        
        // Load initial data
        await this.loadLeaderboard();
    }

    async loadLeaderboard() {
        if (this.isOnline && this.database) {
            try {
                const snapshot = await this.database.ref('leaderboard').orderByChild('score').limitToLast(10).once('value');
                const data = snapshot.val();
                
                if (data) {
                    this.leaderboard = Object.values(data).sort((a, b) => b.score - a.score);
                    console.log('📊 Loaded online leaderboard:', this.leaderboard.length, 'entries');
                } else {
                    this.leaderboard = [];
                    console.log('📊 No online data found, starting fresh');
                }
            } catch (error) {
                console.error('❌ Failed to load online leaderboard:', error);
                this.fallbackToLocal();
            }
        } else {
            // Use local leaderboard as fallback
            this.fallbackToLocal();
        }
    }

    fallbackToLocal() {
        console.log('📱 Falling back to local leaderboard');
        this.isOnline = false;
        this.localLeaderboard.loadLeaderboard();
        this.leaderboard = this.localLeaderboard.leaderboard;
    }

    setupRealtimeListener() {
        if (!this.isOnline || !this.database) return;

        // Listen for real-time updates
        this.database.ref('leaderboard').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.leaderboard = Object.values(data).sort((a, b) => b.score - a.score).slice(0, 10);
                this.updateLeaderboard();
                console.log('🔄 Leaderboard updated in real-time');
            }
        });
    }

    async addScore(nickname, score) {
        const newEntry = {
            nickname: nickname,
            score: score,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        if (this.isOnline && this.database) {
            try {
                // Add to Firebase
                await this.database.ref('leaderboard').push(newEntry);
                console.log('✅ Score added to online leaderboard');
                
                // Clean up old entries (keep top 50, display top 10)
                this.cleanupOldEntries();
                
            } catch (error) {
                console.error('❌ Failed to add score online:', error);
                // Fallback to local storage
                this.localLeaderboard.addScore(nickname, score);
            }
        } else {
            // Use local leaderboard
            this.localLeaderboard.addScore(nickname, score);
            this.leaderboard = this.localLeaderboard.leaderboard;
        }
    }

    async cleanupOldEntries() {
        if (!this.isOnline || !this.database) return;

        try {
            // Get all entries
            const snapshot = await this.database.ref('leaderboard').once('value');
            const data = snapshot.val();
            
            if (data) {
                const entries = Object.entries(data).map(([key, value]) => ({ key, ...value }));
                
                // Keep only top 50 by score
                const sortedEntries = entries.sort((a, b) => b.score - a.score);
                const toDelete = sortedEntries.slice(50);
                
                // Delete old entries
                const updates = {};
                toDelete.forEach(entry => {
                    updates[entry.key] = null;
                });
                
                if (Object.keys(updates).length > 0) {
                    await this.database.ref('leaderboard').update(updates);
                    console.log('🧹 Cleaned up', Object.keys(updates).length, 'old entries');
                }
            }
        } catch (error) {
            console.error('❌ Failed to cleanup old entries:', error);
        }
    }

    updateLeaderboard() {
        const table = document.getElementById('leaderboardTable');
        if (!table) return;

        if (this.leaderboard.length === 0) {
            table.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; font-style: italic; border: 2px dashed #ddd; border-radius: 10px; background: rgba(255,255,255,0.5);">
                    ${this.isOnline ? '🌐 No results yet. Be the first!' : '📱 No results yet. Be the first!'}
                </div>
            `;
            return;
        }

        let html = `
            <div style="margin-bottom: 15px; text-align: center; color: #666; font-size: 14px;">
                ${this.isOnline ? '🌐 Global Leaderboard' : '📱 Local Leaderboard'}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(74, 144, 226, 0.1); border-bottom: 2px solid #4A90E2;">
                        <th style="padding: 12px 8px; text-align: left; color: #4A90E2; font-weight: bold;">Rank</th>
                        <th style="padding: 12px 8px; text-align: left; color: #4A90E2; font-weight: bold;">Player</th>
                        <th style="padding: 12px 8px; text-align: right; color: #4A90E2; font-weight: bold;">Score</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const rowStyle = rank <= 3 ? 'background: rgba(255, 215, 0, 0.1);' : '';
            
            html += `
                <tr style="border-bottom: 1px solid #eee; ${rowStyle}">
                    <td style="padding: 10px 8px; font-weight: bold;">${medal}</td>
                    <td style="padding: 10px 8px;">${this.escapeHtml(entry.nickname)}</td>
                    <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #4A90E2;">${entry.score}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        table.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPlayerBestScore(nickname) {
        const playerEntries = this.leaderboard.filter(entry => 
            entry.nickname.toLowerCase() === nickname.toLowerCase()
        );
        
        if (playerEntries.length === 0) return 0;
        
        return Math.max(...playerEntries.map(entry => entry.score));
    }

    // Compatibility methods for existing code
    clearLeaderboard() {
        if (this.isOnline) {
            console.log('🌐 Cannot clear global leaderboard');
        } else {
            this.localLeaderboard.clearLeaderboard();
            this.leaderboard = [];
            this.updateLeaderboard();
        }
    }

    addTestData() {
        if (this.isOnline) {
            console.log('🌐 Cannot add test data to global leaderboard');
        } else {
            this.localLeaderboard.addTestData();
            this.leaderboard = this.localLeaderboard.leaderboard;
            this.updateLeaderboard();
        }
    }
}

// Export class for use in other files
window.FirebaseLeaderboard = FirebaseLeaderboard;
