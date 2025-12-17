// GameEngine tests - Testing core game loop and state management functionality

import { GameEngine } from '../js/gameEngine.js';

// Mock canvas context for testing
const createMockContext = () => ({
    fillStyle: '',
    font: '',
    textAlign: '',
    fillRect: jest.fn(),
    fillText: jest.fn(),
    clearRect: jest.fn()
});

describe('GameEngine Core Functionality', () => {
    let gameEngine;
    let mockCtx;
    const canvasWidth = 600;
    const canvasHeight = 600;
    const gridSize = 20;

    beforeEach(() => {
        mockCtx = createMockContext();
        gameEngine = new GameEngine(mockCtx, canvasWidth, canvasHeight, gridSize);
    });

    afterEach(() => {
        // Clean up any running game loops
        if (gameEngine.gameLoopId) {
            gameEngine.stopGameLoop();
        }
    });

    describe('Game State Management', () => {
        test('should initialize with menu state', () => {
            expect(gameEngine.getGameState()).toBe('menu');
            expect(gameEngine.getScore()).toBe(0);
            expect(gameEngine.getHighScore()).toBe(0);
            expect(gameEngine.getDifficulty()).toBe(1);
        });

        test('should transition to playing state when started', () => {
            gameEngine.start();
            expect(gameEngine.getGameState()).toBe('playing');
            expect(gameEngine.getSnake()).toBeDefined();
            expect(gameEngine.getFood()).toBeDefined();
        });

        test('should handle pause and resume correctly', () => {
            gameEngine.start();
            expect(gameEngine.isRunning()).toBe(true);
            
            gameEngine.togglePause();
            expect(gameEngine.isPaused()).toBe(true);
            expect(gameEngine.isRunning()).toBe(false);
            
            gameEngine.togglePause();
            expect(gameEngine.isRunning()).toBe(true);
            expect(gameEngine.isPaused()).toBe(false);
        });

        test('should transition to game over state', () => {
            gameEngine.start();
            gameEngine.gameOver();
            expect(gameEngine.isGameOver()).toBe(true);
            expect(gameEngine.isRunning()).toBe(false);
        });
    });

    describe('Score Management', () => {
        test('should increment score when food is consumed', () => {
            gameEngine.start();
            const initialScore = gameEngine.getScore();
            
            // Simulate food consumption
            const mockFood = { type: 'normal' };
            gameEngine.incrementScore(mockFood);
            
            expect(gameEngine.getScore()).toBeGreaterThan(initialScore);
        });

        test('should update high score when current score exceeds it', () => {
            gameEngine.start();
            
            // Set a score higher than current high score
            const mockFood = { type: 'normal' };
            gameEngine.incrementScore(mockFood);
            gameEngine.incrementScore(mockFood);
            
            const currentScore = gameEngine.getScore();
            expect(gameEngine.getHighScore()).toBe(currentScore);
        });

        test('should not update high score when current score is lower', () => {
            gameEngine.setHighScore(100);
            gameEngine.start();
            
            const mockFood = { type: 'normal' };
            gameEngine.incrementScore(mockFood); // This should give less than 100 points
            
            expect(gameEngine.getHighScore()).toBe(100);
            expect(gameEngine.getScore()).toBeLessThan(100);
        });

        test('should calculate score based on difficulty level', () => {
            gameEngine.start();
            
            // Test with difficulty 1
            const mockFood = { type: 'normal' };
            gameEngine.incrementScore(mockFood);
            const scoreAtDiff1 = gameEngine.getScore();
            
            // Reset and test with higher difficulty
            gameEngine.initializeGame();
            gameEngine.difficulty = 3;
            gameEngine.incrementScore(mockFood);
            const scoreAtDiff3 = gameEngine.getScore();
            
            expect(scoreAtDiff3).toBeGreaterThan(scoreAtDiff1);
        });
    });

    describe('Input Handling', () => {
        test('should handle directional input during gameplay', () => {
            gameEngine.start();
            
            // Test arrow key input
            gameEngine.handleInput('ArrowUp');
            expect(gameEngine.pendingDirection).toBe('up');
            
            gameEngine.handleInput('ArrowDown');
            expect(gameEngine.pendingDirection).toBe('down');
            
            gameEngine.handleInput('ArrowLeft');
            expect(gameEngine.pendingDirection).toBe('left');
            
            gameEngine.handleInput('ArrowRight');
            expect(gameEngine.pendingDirection).toBe('right');
        });

        test('should handle WASD input during gameplay', () => {
            gameEngine.start();
            
            gameEngine.handleInput('w');
            expect(gameEngine.pendingDirection).toBe('up');
            
            gameEngine.handleInput('s');
            expect(gameEngine.pendingDirection).toBe('down');
            
            gameEngine.handleInput('a');
            expect(gameEngine.pendingDirection).toBe('left');
            
            gameEngine.handleInput('d');
            expect(gameEngine.pendingDirection).toBe('right');
        });

        test('should handle pause input', () => {
            gameEngine.start();
            
            gameEngine.handleInput(' '); // Space key
            expect(gameEngine.isPaused()).toBe(true);
            
            gameEngine.handleInput('Escape');
            expect(gameEngine.isRunning()).toBe(true);
        });

        test('should handle start/restart input', () => {
            // From menu state
            expect(gameEngine.getGameState()).toBe('menu');
            gameEngine.handleInput('Enter');
            expect(gameEngine.isRunning()).toBe(true);
            
            // From game over state
            gameEngine.gameOver();
            expect(gameEngine.isGameOver()).toBe(true);
            gameEngine.handleInput(' ');
            expect(gameEngine.isRunning()).toBe(true);
        });
    });

    describe('Data Management', () => {
        test('should load saved data correctly', () => {
            const savedData = {
                highScore: 150,
                difficulty: 3
            };
            
            gameEngine.loadSavedData(savedData);
            
            expect(gameEngine.getHighScore()).toBe(150);
            expect(gameEngine.getDifficulty()).toBe(3);
        });

        test('should handle invalid saved data gracefully', () => {
            const invalidData = {
                highScore: -10, // Invalid negative score
                difficulty: 15  // Invalid difficulty > 10
            };
            
            const originalHighScore = gameEngine.getHighScore();
            const originalDifficulty = gameEngine.getDifficulty();
            
            gameEngine.loadSavedData(invalidData);
            
            // Should not update with invalid values
            expect(gameEngine.getHighScore()).toBe(originalHighScore);
            expect(gameEngine.getDifficulty()).toBe(originalDifficulty);
        });

        test('should return complete game data', () => {
            gameEngine.start();
            gameEngine.setHighScore(100);
            
            const gameData = gameEngine.getGameData();
            
            expect(gameData).toHaveProperty('highScore');
            expect(gameData).toHaveProperty('score');
            expect(gameData).toHaveProperty('difficulty');
            expect(gameData).toHaveProperty('gameState');
            expect(gameData.highScore).toBe(100);
        });
    });

    describe('Game Entity Integration', () => {
        test('should initialize snake and food when game starts', () => {
            gameEngine.start();
            
            const snake = gameEngine.getSnake();
            const food = gameEngine.getFood();
            
            expect(snake).toBeDefined();
            expect(food).toBeDefined();
            expect(snake.getSegments().length).toBeGreaterThan(0);
            expect(food.getPosition()).toBeDefined();
        });

        test('should spawn food that does not overlap with snake', () => {
            gameEngine.start();
            
            const snake = gameEngine.getSnake();
            const food = gameEngine.getFood();
            const snakeSegments = snake.getSegments();
            const foodPosition = food.getPosition();
            
            // Check that food position doesn't overlap with any snake segment
            const overlaps = snakeSegments.some(segment => 
                segment.x === foodPosition.x && segment.y === foodPosition.y
            );
            
            expect(overlaps).toBe(false);
        });
    });
});