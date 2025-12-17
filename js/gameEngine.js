// Game Engine - Orchestrates the main game loop and coordinates between components
import { Snake } from './snake.js';
import { Food } from './food.js';
import { AIEngine } from './aiEngine.js';
import { Renderer } from './renderer.js';

export class GameEngine {
    constructor(ctx, canvasWidth, canvasHeight, gridSize = 20) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.gridSize = gridSize;
        
        // Game state
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.highScore = 0;
        this.difficulty = 1;
        
        // Game entities
        this.snake = null;
        this.food = null;
        this.aiEngine = null;
        this.renderer = null;
        
        // Game loop
        this.gameLoopId = null;
        this.lastFrameTime = 0;
        this.lastMoveTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.baseMoveInterval = 200; // Base snake movement speed in milliseconds
        this.moveInterval = this.baseMoveInterval;
        
        // Input handling
        this.pendingDirection = null;
        
        // Event callbacks
        this.onScoreChange = null;
        this.onHighScoreChange = null;
        this.onDifficultyChange = null;
        this.onGameOver = null;
    }

    start() {
        if (this.gameState === 'menu' || this.gameState === 'gameOver') {
            this.initializeGame();
        }
        this.gameState = 'playing';
        this.startGameLoop();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.stopGameLoop();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.startGameLoop();
        }
    }

    restart() {
        this.stopGameLoop();
        this.initializeGame();
        this.gameState = 'playing';
        this.startGameLoop();
    }

    initializeGame() {
        this.score = 0;
        this.pendingDirection = null;
        
        // Initialize AI Engine first (or reuse existing one to preserve data)
        if (!this.aiEngine) {
            this.aiEngine = new AIEngine(this.gridSize, this.canvasWidth, this.canvasHeight);
        }
        
        // Initialize Renderer if not already created
        if (!this.renderer) {
            this.renderer = new Renderer(this.ctx, this.canvasWidth, this.canvasHeight, this.gridSize);
        }
        
        // Start new game session tracking
        this.aiEngine.startGameSession();
        
        // Get current difficulty from AI engine
        this.difficulty = this.aiEngine.getCurrentDifficulty();
        
        // Update game speed based on difficulty
        this.updateGameSpeed();
        
        // Initialize game entities
        this.snake = new Snake(this.gridSize, this.canvasWidth, this.canvasHeight);
        this.food = new Food(this.gridSize, this.canvasWidth, this.canvasHeight, this.aiEngine);
        
        // Spawn initial food, avoiding snake segments
        this.spawnFood();
        
        // Reset timing
        this.lastMoveTime = 0;
        
        // Trigger UI updates
        if (this.onScoreChange) this.onScoreChange(this.score);
        if (this.onDifficultyChange) this.onDifficultyChange(this.difficulty);
    }

    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.gameLoopId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    gameLoop(timestamp) {
        if (this.gameState !== 'playing') {
            return;
        }

        const deltaTime = timestamp - this.lastFrameTime;
        
        if (deltaTime >= this.frameInterval) {
            this.update(deltaTime);
            this.render();
            this.lastFrameTime = timestamp;
        }

        this.gameLoopId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') {
            return;
        }

        // Check if it's time to move the snake
        if (this.lastMoveTime + this.moveInterval <= performance.now()) {
            this.updateSnake();
            this.lastMoveTime = performance.now();
        }
    }

    updateSnake() {
        if (!this.snake || !this.food || !this.aiEngine) {
            return;
        }

        // Record movement data for AI analysis before moving
        const currentPosition = this.snake.getPosition();
        const currentDirection = this.pendingDirection || this.snake.direction;
        
        if (currentDirection) {
            const foodPosition = this.food.getPosition();
            const foodDistance = foodPosition ? 
                Math.abs(currentPosition.x - foodPosition.x) + Math.abs(currentPosition.y - foodPosition.y) : 0;
            
            const gameContext = {
                score: this.score,
                snakeLength: this.snake.segments.length,
                foodDistance: foodDistance
            };
            
            this.aiEngine.recordMovement(currentPosition, currentDirection, gameContext);
        }

        // Move snake with pending direction
        this.snake.move(this.pendingDirection);
        this.pendingDirection = null;

        // Check for collisions
        if (this.snake.checkCollision()) {
            this.gameOver();
            return;
        }

        // Check for food consumption
        const snakeHead = this.snake.getPosition();
        const foodPosition = this.food.getPosition();
        
        if (foodPosition && snakeHead.x === foodPosition.x && snakeHead.y === foodPosition.y) {
            this.consumeFood();
        }
    }

    consumeFood() {
        // Consume the food
        const consumedFood = this.food.consume();
        
        // Grow the snake
        this.snake.grow();
        
        // Update score based on food type and difficulty
        this.incrementScore(consumedFood);
        
        // Spawn new food
        this.spawnFood();
    }

    incrementScore(consumedFood) {
        // Base score for consuming food
        let scoreIncrement = 10;
        
        // Bonus points based on difficulty level
        scoreIncrement += (this.difficulty - 1) * 5;
        
        // Special food types could give more points (for future enhancement)
        if (consumedFood && consumedFood.type === 'special') {
            scoreIncrement *= 2;
        }
        
        // Update current score
        this.score += scoreIncrement;
        
        // Check and update high score
        this.updateHighScore();
        
        // Trigger score change callback
        if (this.onScoreChange) {
            this.onScoreChange(this.score);
        }
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            
            // Trigger high score change callback
            if (this.onHighScoreChange) {
                this.onHighScoreChange(this.highScore);
            }
        }
    }

    spawnFood() {
        if (!this.snake || !this.food) {
            return;
        }

        // Get snake segments to avoid placing food on snake
        const snakeSegments = this.snake.getSegments();
        const excludePositions = snakeSegments;
        
        // Use adaptive food placement if AI engine is available
        this.food.spawn(null, excludePositions);
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.stopGameLoop();
        
        // Final high score check (in case it wasn't updated during the last food consumption)
        this.updateHighScore();
        
        // End game session tracking and update difficulty
        if (this.aiEngine) {
            this.aiEngine.endGameSession(this.score);
            
            // Update difficulty based on performance
            const newDifficulty = this.aiEngine.getCurrentDifficulty();
            if (newDifficulty !== this.difficulty) {
                this.difficulty = newDifficulty;
                this.updateGameSpeed(); // Update speed when difficulty changes
                if (this.onDifficultyChange) {
                    this.onDifficultyChange(this.difficulty);
                }
            }
        }
        
        if (this.onGameOver) {
            this.onGameOver({
                finalScore: this.score,
                highScore: this.highScore,
                isNewHighScore: this.score === this.highScore && this.score > 0
            });
        }
    }

    render() {
        if (!this.renderer) {
            // Fallback to basic rendering if renderer not available
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.renderGameState();
            return;
        }
        
        // Get current visual intensity from AI engine
        const visualIntensity = this.aiEngine ? this.aiEngine.updateVisualIntensity() : 1;
        
        // Calculate danger level based on snake position
        const dangerLevel = this.calculateDangerLevel();
        
        // Update renderer settings
        this.renderer.setIntensityLevel(visualIntensity);
        this.renderer.setDangerLevel(dangerLevel);
        
        // Draw background with adaptive intensity
        this.renderer.drawBackground(visualIntensity);
        
        // Draw game entities if in gameplay state
        if (this.gameState !== 'menu') {
            if (this.snake) {
                this.renderer.drawSnake(this.snake, visualIntensity);
            }
            
            if (this.food && this.food.getPosition()) {
                this.renderer.drawFood(this.food);
            }
            
            // Update HUD
            this.renderer.drawHUD(this.score, this.highScore, this.difficulty);
        }
        
        // Render game state text overlay
        this.renderGameState();
    }

    calculateDangerLevel() {
        if (!this.snake || this.gameState !== 'playing') {
            return 0;
        }
        
        const head = this.snake.getPosition();
        const segments = this.snake.getSegments();
        let dangerLevel = 0;
        
        // Check proximity to walls
        const wallDistance = Math.min(
            head.x / this.gridSize,
            head.y / this.gridSize,
            (this.canvasWidth - head.x - this.gridSize) / this.gridSize,
            (this.canvasHeight - head.y - this.gridSize) / this.gridSize
        );
        
        if (wallDistance <= 1) {
            dangerLevel = Math.max(dangerLevel, 0.8);
        } else if (wallDistance <= 2) {
            dangerLevel = Math.max(dangerLevel, 0.4);
        }
        
        // Check proximity to self (body segments)
        for (let i = 1; i < segments.length; i++) {
            const segment = segments[i];
            const distance = Math.abs(head.x - segment.x) + Math.abs(head.y - segment.y);
            
            if (distance <= this.gridSize) {
                dangerLevel = Math.max(dangerLevel, 1.0);
                break;
            } else if (distance <= this.gridSize * 2) {
                dangerLevel = Math.max(dangerLevel, 0.6);
            }
        }
        
        return dangerLevel;
    }

    renderGameState() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        
        switch (this.gameState) {
            case 'menu':
                this.ctx.fillText('Snake Game', centerX, centerY - 60);
                if (this.highScore > 0) {
                    this.ctx.fillText(`High Score: ${this.highScore}`, centerX, centerY - 20);
                }
                this.ctx.fillText('Press ENTER or SPACE to start', centerX, centerY + 20);
                this.ctx.fillText('Use arrow keys or WASD to move', centerX, centerY + 60);
                break;
            case 'paused':
                this.ctx.fillText('PAUSED', centerX, centerY - 20);
                this.ctx.fillText('Press SPACE or ESC to resume', centerX, centerY + 20);
                break;
            case 'gameOver':
                this.ctx.fillText('Game Over', centerX, centerY - 60);
                this.ctx.fillText(`Final Score: ${this.score}`, centerX, centerY - 20);
                if (this.score === this.highScore && this.score > 0) {
                    this.ctx.fillText('NEW HIGH SCORE!', centerX, centerY + 20);
                } else if (this.highScore > 0) {
                    this.ctx.fillText(`High Score: ${this.highScore}`, centerX, centerY + 20);
                }
                this.ctx.fillText('Press ENTER or SPACE to restart', centerX, centerY + 60);
                break;
        }
        

    }



    handleInput(key) {
        if (this.gameState === 'playing') {
            // Handle directional input
            switch (key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.pendingDirection = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.pendingDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.pendingDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.pendingDirection = 'right';
                    break;
                case ' ':
                case 'Escape':
                    this.togglePause();
                    break;
            }
        } else if (this.gameState === 'paused') {
            // Handle pause state input
            switch (key) {
                case ' ':
                case 'Escape':
                    this.togglePause();
                    break;
            }
        } else if (this.gameState === 'gameOver' || this.gameState === 'menu') {
            // Handle game over/menu state input
            switch (key) {
                case 'Enter':
                case ' ':
                    this.start();
                    break;
            }
        }
    }

    loadSavedData(data) {
        if (data && typeof data === 'object') {
            if (typeof data.highScore === 'number' && data.highScore >= 0) {
                this.highScore = data.highScore;
                
                // Trigger high score change callback to update UI
                if (this.onHighScoreChange) {
                    this.onHighScoreChange(this.highScore);
                }
            }
            
            // Load other saved data if available
            if (typeof data.difficulty === 'number' && data.difficulty >= 1 && data.difficulty <= 10) {
                this.difficulty = data.difficulty;
                
                if (this.onDifficultyChange) {
                    this.onDifficultyChange(this.difficulty);
                }
            }
            
            // Load AI behavior data if available
            if (data.aiBehaviorData && this.aiEngine) {
                this.aiEngine.loadBehaviorData(data.aiBehaviorData);
            }
        }
    }

    setHighScore(newHighScore) {
        if (typeof newHighScore === 'number' && newHighScore >= 0) {
            this.highScore = newHighScore;
            
            // Trigger high score change callback
            if (this.onHighScoreChange) {
                this.onHighScoreChange(this.highScore);
            }
        }
    }

    resetHighScore() {
        this.highScore = 0;
        
        // Trigger high score change callback
        if (this.onHighScoreChange) {
            this.onHighScoreChange(this.highScore);
        }
    }

    getGameData() {
        const gameData = {
            highScore: this.highScore,
            score: this.score,
            difficulty: this.difficulty,
            gameState: this.gameState
        };
        
        // Include AI behavior data if available
        if (this.aiEngine) {
            gameData.aiBehaviorData = this.aiEngine.getBehaviorData();
        }
        
        return gameData;
    }

    // Getter methods for accessing game entities
    getSnake() {
        return this.snake;
    }

    getFood() {
        return this.food;
    }

    getScore() {
        return this.score;
    }

    getHighScore() {
        return this.highScore;
    }

    getDifficulty() {
        return this.difficulty;
    }

    getGameState() {
        return this.gameState;
    }

    // Method to check if game is currently running
    isRunning() {
        return this.gameState === 'playing';
    }

    // Method to check if game is paused
    isPaused() {
        return this.gameState === 'paused';
    }

    // Method to check if game is over
    isGameOver() {
        return this.gameState === 'gameOver';
    }
    
    // Calculate movement speed based on difficulty level
    calculateMoveInterval(difficulty) {
        // Speed increases with difficulty (lower interval = faster movement)
        // Difficulty 1: 200ms, Difficulty 10: 80ms
        const minInterval = 80;  // Fastest speed at max difficulty
        const maxInterval = 200; // Slowest speed at min difficulty
        
        // Linear interpolation between min and max intervals
        const speedFactor = (difficulty - 1) / 9; // Normalize to 0-1 range
        const interval = maxInterval - (speedFactor * (maxInterval - minInterval));
        
        return Math.round(interval);
    }
    
    // Update game speed based on current difficulty
    updateGameSpeed() {
        this.moveInterval = this.calculateMoveInterval(this.difficulty);
    }
    
    // Getter method for AI Engine
    getAIEngine() {
        return this.aiEngine;
    }
    
    // Getter method for Renderer
    getRenderer() {
        return this.renderer;
    }
}