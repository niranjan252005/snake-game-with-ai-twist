// Main entry point for the AI-Adaptive Snake Game
import { GameEngine } from './gameEngine.js';
import { StorageManager } from './storageManager.js';

class Game {
    constructor() {
        this.gameEngine = null;
        this.storageManager = new StorageManager();
        this.canvas = null;
        this.ctx = null;
        
        this.initializeDOM();
        this.setupEventListeners();
    }

    initializeDOM() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize game engine with canvas context
        this.gameEngine = new GameEngine(this.ctx, this.canvas.width, this.canvas.height);
        
        // Load saved data
        const savedData = this.storageManager.loadGameData();
        if (savedData) {
            this.gameEngine.loadSavedData(savedData);
        }
        
        // Update UI with loaded high score
        this.updateHighScoreDisplay();
        
        // Initialize UI state
        this.updateButtonStates();
        this.updateAIStatus();
        this.updateGameStatusText();
    }

    setupEventListeners() {
        // Game control buttons
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('restartFromGameOver').addEventListener('click', () => {
            this.restartFromGameOver();
        });

        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardInput(event);
        });

        // Game state change listeners
        this.gameEngine.onScoreChange = (score) => {
            this.updateScoreDisplay(score);
        };

        this.gameEngine.onHighScoreChange = (highScore) => {
            this.updateHighScoreDisplay(highScore);
            this.storageManager.saveHighScore(highScore);
        };

        this.gameEngine.onDifficultyChange = (difficulty) => {
            this.updateDifficultyDisplay(difficulty);
            this.updateAIStatus();
        };

        this.gameEngine.onGameOver = (gameOverData) => {
            this.showGameOverScreen(gameOverData);
        };
        
        // Add game state change listener for UI updates
        this.setupGameStateListener();
    }
    
    startGame() {
        this.gameEngine.start();
        this.updateButtonStates();
        this.hideGameOverScreen();
    }
    
    togglePause() {
        this.gameEngine.togglePause();
        this.updateButtonStates();
        this.updatePauseButtonText();
    }
    
    restartGame() {
        this.gameEngine.restart();
        this.updateButtonStates();
        this.hideGameOverScreen();
    }
    
    restartFromGameOver() {
        this.hideGameOverScreen();
        this.gameEngine.restart();
        this.updateButtonStates();
    }
    
    handleKeyboardInput(event) {
        // Prevent default behavior for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(event.key)) {
            event.preventDefault();
        }
        
        this.gameEngine.handleInput(event.key);
        
        // Update UI after input
        this.updateButtonStates();
    }
    
    updateScoreDisplay(score) {
        const scoreElement = document.getElementById('currentScore');
        if (scoreElement) {
            scoreElement.textContent = score;
            
            // Add visual feedback for score increase
            scoreElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                scoreElement.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    updateHighScoreDisplay(highScore) {
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = highScore;
            
            // Add visual feedback for new high score
            if (highScore > 0) {
                highScoreElement.style.color = '#ffff00';
                highScoreElement.style.textShadow = '0 0 10px #ffff00';
                setTimeout(() => {
                    highScoreElement.style.textShadow = 'none';
                }, 1000);
            }
        }
    }
    
    updateDifficultyDisplay(difficulty) {
        const difficultyElement = document.getElementById('difficultyLevel');
        if (difficultyElement) {
            difficultyElement.textContent = difficulty;
            
            // Change color based on difficulty level
            if (difficulty <= 3) {
                difficultyElement.style.color = '#00ff00'; // Green for easy
            } else if (difficulty <= 6) {
                difficultyElement.style.color = '#ffff00'; // Yellow for medium
            } else {
                difficultyElement.style.color = '#ff6600'; // Orange for hard
            }
            
            // Add visual feedback for difficulty change
            difficultyElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                difficultyElement.style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    showGameOverScreen(gameOverData) {
        const finalScore = gameOverData ? gameOverData.finalScore : this.gameEngine.getScore();
        const isNewHighScore = gameOverData && gameOverData.isNewHighScore;
        
        // Update final score display
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = finalScore;
        }
        
        // Add new high score indicator if applicable
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            // Remove any existing high score indicator
            const existingIndicator = gameOverScreen.querySelector('.new-high-score-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Add new high score indicator if this is a new high score
            if (isNewHighScore) {
                const indicator = document.createElement('div');
                indicator.className = 'new-high-score-indicator';
                indicator.textContent = '🎉 NEW HIGH SCORE! 🎉';
                indicator.style.cssText = `
                    color: #ffff00;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 10px 0;
                    text-shadow: 0 0 10px #ffff00;
                    animation: pulse 1s infinite;
                `;
                
                // Insert after final score
                const finalScoreDiv = gameOverScreen.querySelector('.final-score');
                if (finalScoreDiv) {
                    finalScoreDiv.insertAdjacentElement('afterend', indicator);
                }
            }
            
            gameOverScreen.style.display = 'block';
        }
        
        // Update button states
        this.updateButtonStates();
        
        // Save game data
        const gameData = this.gameEngine.getGameData();
        this.storageManager.saveGameData(gameData);
    }
    
    hideGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
    }
    
    updateButtonStates() {
        const startButton = document.getElementById('startButton');
        const pauseButton = document.getElementById('pauseButton');
        const restartButton = document.getElementById('restartButton');
        
        const gameState = this.gameEngine.getGameState();
        
        if (startButton) {
            startButton.disabled = (gameState === 'playing');
            startButton.style.opacity = startButton.disabled ? '0.5' : '1';
        }
        
        if (pauseButton) {
            pauseButton.disabled = (gameState === 'menu' || gameState === 'gameOver');
            pauseButton.style.opacity = pauseButton.disabled ? '0.5' : '1';
        }
        
        if (restartButton) {
            restartButton.disabled = (gameState === 'menu');
            restartButton.style.opacity = restartButton.disabled ? '0.5' : '1';
        }
    }
    
    updatePauseButtonText() {
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            const gameState = this.gameEngine.getGameState();
            pauseButton.textContent = gameState === 'paused' ? 'Resume' : 'Pause';
        }
    }
    
    setupGameStateListener() {
        // Poll game state periodically to update UI
        setInterval(() => {
            this.updateButtonStates();
            this.updatePauseButtonText();
            this.updateAIStatus();
            this.updateGameStatusText();
        }, 1000); // Update UI every second
    }
    
    updateAIStatus() {
        const aiStatusElement = document.getElementById('aiStatus');
        if (!aiStatusElement || !this.gameEngine) return;
        
        const aiEngine = this.gameEngine.getAIEngine();
        if (!aiEngine) {
            aiStatusElement.textContent = 'Inactive';
            return;
        }
        
        const gameState = this.gameEngine.getGameState();
        const performanceMetrics = aiEngine.getPerformanceMetrics();
        const totalGames = performanceMetrics.totalGamesPlayed;
        
        if (gameState === 'playing') {
            if (totalGames < 3) {
                aiStatusElement.textContent = 'Learning';
            } else {
                const strategy = aiEngine.getFoodPlacementStrategy();
                const strategyText = strategy.charAt(0).toUpperCase() + strategy.slice(1);
                aiStatusElement.textContent = `Active (${strategyText})`;
            }
        } else {
            aiStatusElement.textContent = totalGames > 0 ? 'Ready' : 'Waiting';
        }
    }
    
    updateGameStatusText() {
        const statusElement = document.getElementById('gameStatusText');
        if (!statusElement || !this.gameEngine) return;
        
        const gameState = this.gameEngine.getGameState();
        const aiEngine = this.gameEngine.getAIEngine();
        
        switch (gameState) {
            case 'menu':
                statusElement.textContent = 'Press Start Game to begin';
                statusElement.style.color = '#888';
                break;
            case 'playing':
                if (aiEngine) {
                    const performanceMetrics = aiEngine.getPerformanceMetrics();
                    const totalGames = performanceMetrics.totalGamesPlayed;
                    if (totalGames < 3) {
                        statusElement.textContent = 'AI is learning your movement patterns...';
                        statusElement.style.color = '#00ffff';
                    } else {
                        const strategy = aiEngine.getFoodPlacementStrategy();
                        statusElement.textContent = `AI using ${strategy} food placement strategy`;
                        statusElement.style.color = '#00ff00';
                    }
                } else {
                    statusElement.textContent = 'Game in progress';
                    statusElement.style.color = '#00ff00';
                }
                break;
            case 'paused':
                statusElement.textContent = 'Game paused - Press Space or ESC to resume';
                statusElement.style.color = '#ffff00';
                break;
            case 'gameOver':
                statusElement.textContent = 'Game Over - Press Play Again to restart';
                statusElement.style.color = '#ff6600';
                break;
            default:
                statusElement.textContent = '';
        }
    }

    updateHighScoreDisplay(highScore = null) {
        // If no high score provided, load from storage
        if (highScore === null) {
            highScore = this.storageManager.loadHighScore();
        }
        
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement && highScore !== null) {
            highScoreElement.textContent = highScore;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});