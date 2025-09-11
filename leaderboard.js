// Class for leaderboard functionality
class Leaderboard {
    constructor() {
        this.leaderboard = [];
        this.init();
    }
    
    init() {
        console.log('Leaderboard.init() called');
        try {
            this.loadLeaderboard();
            console.log('Leaderboard loaded');
        } catch (error) {
            console.error('Error in Leaderboard.init():', error);
        }
    }
    
    loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('leaderboard');
        if (savedLeaderboard) {
            try {
                this.leaderboard = JSON.parse(savedLeaderboard);
            } catch (e) {
                console.error('Error loading leaderboard:', e);
                this.leaderboard = [];
            }
        }
    }
    
    addScore(nickname, score) {
        const newEntry = {
            nickname: nickname,
            score: score,
            date: new Date().toISOString()
        };
        
        this.leaderboard.push(newEntry);
        
        // Sort by score (descending)
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top-10
        if (this.leaderboard.length > 10) {
            this.leaderboard = this.leaderboard.slice(0, 10);
        }
        
        // Save to localStorage
        this.saveLeaderboard();
    }
    
    saveLeaderboard() {
        try {
            localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
        } catch (e) {
            console.error('Error saving leaderboard:', e);
        }
    }
    
    getTopScores(limit = 10) {
        return this.leaderboard.slice(0, limit);
    }
    
    getPlayerBestScore(nickname) {
        const playerScores = this.leaderboard.filter(entry => entry.nickname === nickname);
        if (playerScores.length === 0) return 0;
        
        return Math.max(...playerScores.map(entry => entry.score));
    }
    
    getPlayerRank(nickname) {
        const playerBestScore = this.getPlayerBestScore(nickname);
        if (playerBestScore === 0) return null;
        
        return this.leaderboard.findIndex(entry => entry.score === playerBestScore) + 1;
    }
    
    updateLeaderboard() {
        const leaderboardTable = document.getElementById('leaderboardTable');
        if (!leaderboardTable) return;
        
        leaderboardTable.innerHTML = '';
        
        if (this.leaderboard.length === 0) {
            const noScoresMessage = document.createElement('div');
            noScoresMessage.className = 'no-scores-message';
            noScoresMessage.textContent = 'No results yet. Be the first!';
            noScoresMessage.style.cssText = `
                text-align: center;
                padding: 40px;
                color: #333;
                font-size: 18px;
                font-style: italic;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 10px;
                border: 2px dashed rgba(74, 144, 226, 0.3);
            `;
            leaderboardTable.appendChild(noScoresMessage);
            return;
        }
        
        // Создаем заголовок таблицы
        const tableHeader = document.createElement('div');
        tableHeader.className = 'leaderboard-header';
        tableHeader.innerHTML = `
            <div class="rank">Rank</div>
            <div class="nickname">Player</div>
            <div class="score">Score</div>
            <div class="date">Date</div>
        `;
        tableHeader.style.cssText = `
            display: grid;
            grid-template-columns: 80px 1fr 120px 150px;
            gap: 15px;
            padding: 15px;
            background: rgba(74, 144, 226, 0.8);
            border-radius: 10px;
            margin-bottom: 15px;
            font-weight: bold;
            color: #ffffff;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        leaderboardTable.appendChild(tableHeader);
        
        // Добавляем записи
        this.leaderboard.forEach((entry, index) => {
            const row = this.createLeaderboardRow(entry, index + 1);
            leaderboardTable.appendChild(row);
        });
        
        // Показываем статистику текущего игрока
        this.showPlayerStats();
    }
    
    createLeaderboardRow(entry, rank) {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        // Определяем стили для разных мест
        let rankStyle = '';
        if (rank === 1) {
            rankStyle = 'background: linear-gradient(45deg, #FFD700, #FFA500); color: #000;';
        } else if (rank === 2) {
            rankStyle = 'background: linear-gradient(45deg, #C0C0C0, #A9A9A9); color: #000;';
        } else if (rank === 3) {
            rankStyle = 'background: linear-gradient(45deg, #CD7F32, #B8860B); color: #000;';
        }
        
        row.innerHTML = `
            <div class="rank" style="${rankStyle}">${rank}</div>
            <div class="nickname">${this.escapeHtml(entry.nickname)}</div>
            <div class="score">${entry.score}</div>
            <div class="date">${this.formatDate(entry.date)}</div>
        `;
        
        row.style.cssText = `
            display: grid;
            grid-template-columns: 80px 1fr 120px 150px;
            gap: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 10px;
            margin-bottom: 10px;
            color: #333;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(74, 144, 226, 0.2);
        `;
        
        // Добавляем hover эффект
        row.addEventListener('mouseenter', () => {
            row.style.background = 'rgba(74, 144, 226, 0.1)';
            row.style.transform = 'scale(1.02)';
            row.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.background = 'rgba(255, 255, 255, 0.9)';
            row.style.transform = 'scale(1)';
            row.style.boxShadow = 'none';
        });
        
        return row;
    }
    
    showPlayerStats() {
        const currentNickname = localStorage.getItem('playerNickname');
        if (!currentNickname) return;
        
        const playerBestScore = this.getPlayerBestScore(currentNickname);
        const playerRank = this.getPlayerRank(currentNickname);
        
        // Создаем блок статистики игрока
        const statsContainer = document.getElementById('leaderboardTable');
        if (!statsContainer) return;
        
        // Удаляем предыдущую статистику, если есть
        const existingStats = statsContainer.querySelector('.player-stats');
        if (existingStats) {
            existingStats.remove();
        }
        
        if (playerBestScore > 0) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'player-stats';
            statsDiv.innerHTML = `
                    <div class="stats-title">Your Statistics:</div>
                    <div class="stats-content">
                        <div class="stat-item">
                            <span class="stat-label">Best Score:</span>
                            <span class="stat-value">${playerBestScore} points</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Rank in Top:</span>
                            <span class="stat-value">${playerRank}</span>
                        </div>
                    </div>
            `;
            
            statsDiv.style.cssText = `
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid rgba(74, 144, 226, 0.5);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                color: #333;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            `;
            
            const statsTitle = statsDiv.querySelector('.stats-title');
            statsTitle.style.cssText = `
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                text-align: center;
                color: #4A90E2;
            `;
            
            const statsContent = statsDiv.querySelector('.stats-content');
            statsContent.style.cssText = `
                display: flex;
                justify-content: space-around;
                gap: 20px;
            `;
            
            const statItems = statsDiv.querySelectorAll('.stat-item');
            statItems.forEach(item => {
                item.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                `;
                
                const label = item.querySelector('.stat-label');
                label.style.cssText = `
                    font-size: 14px;
                    color: #666;
                `;
                
                const value = item.querySelector('.stat-value');
                value.style.cssText = `
                    font-size: 20px;
                    font-weight: bold;
                    color: #4A90E2;
                `;
            });
            
            statsContainer.appendChild(statsDiv);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays === 2) {
            return '2 days ago';
        } else if (diffDays <= 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }
    }
    
    // Method to clear leaderboard (for testing)
    clearLeaderboard() {
        this.leaderboard = [];
        this.saveLeaderboard();
        this.updateLeaderboard();
    }
    
    // Method to add test data (for demonstration)
    addTestData() {
        const testNames = ['Alex', 'Maria', 'David', 'Anna', 'Steve', 'Elena', 'John', 'Olga', 'Peter', 'Tanya'];
        const testScores = [15000, 12000, 9800, 8500, 7200, 6500, 5800, 4900, 4200, 3800];
        
        testNames.forEach((name, index) => {
            this.addScore(name, testScores[index]);
        });
        
        this.updateLeaderboard();
    }
}

// Export class for use in other files
window.Leaderboard = Leaderboard;
