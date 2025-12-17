// Integration tests for the complete game system

import { GameEngine } from '../js/gameEngine.js';
import { Snake } from '../js/snake.js';
import { Food } from '../js/food.js';

// Mock canvas context for testing
const createMockContext = () => ({
    fillStyle: '',
    font: '',
    textAlign: '',
    strokeStyle: '',
    lineWidth: 1,
    shadowColor: '',
    shadowBlur: 0,
    fillRect: jest.fn(),
    fillText: jest.fn(),
    clearRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn()
});

describe('Game Integration Tests', () => {
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
        if (gameEngine.gameLoopId) {
            gameEngine.stopGameLoop();
        }
    });

    test('should complete a full game cycle from start to game over', () => {
        // Start the game
        gameEngine.start();
        expect(gameEngine.isRunning()).toBe(true);
        expect(gameEngine.getSnake()).toBeDefined();
        expect(gameEngine.getFood()).toBeDefined();

        // Simulate some gameplay
        const initialScore = gameEngine.getScore();
        
        // Simulate food consumption
        const mockFood = { type: 'normal' };
        gameEngine.incrementScore(mockFood);
        expect(gameEngine.getScore()).toBeGreaterThan(initialScore);

        // End the game
        gameEngine.gameOver();
        expect(gameEngine.isGameOver()).toBe(true);
        expect(gameEngine.isRunning()).toBe(false);
    });

    test('should handle snake movement and collision detection', () => {
        gameEngine.start();
        const snake = gameEngine.getSnake();
        
        // Test that snake can move
        const initialPosition = snake.getPosition();
        gameEngine.handleInput('ArrowRight');
        gameEngine.updateSnake();
        
        const newPosition = snake.getPosition();
        expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    });

    test('should handle food consumption and respawning', () => {
        gameEngine.start();
        const snake = gameEngine.getSnake();
        const food = gameEngine.getFood();
        
        const initialSnakeLength = snake.getSegments().length;
        const initialScore = gameEngine.getScore();
        
        // Manually trigger food consumption
        gameEngine.consumeFood();
        
        // Check that snake grew and score increased
        expect(snake.getSegments().length).toBe(initialSnakeLength + 1);
        expect(gameEngine.getScore()).toBeGreaterThan(initialScore);
        
        // Check that new food was spawned
        expect(food.getPosition()).toBeDefined();
    });

    test('should maintain game state consistency during pause/resume', () => {
        gameEngine.start();
        const initialState = {
            score: gameEngine.getScore(),
            snakePosition: gameEngine.getSnake().getPosition(),
            foodPosition: gameEngine.getFood().getPosition()
        };

        // Pause the game
        gameEngine.togglePause();
        expect(gameEngine.isPaused()).toBe(true);

        // Resume the game
        gameEngine.togglePause();
        expect(gameEngine.isRunning()).toBe(true);

        // Verify state is preserved
        expect(gameEngine.getScore()).toBe(initialState.score);
        expect(gameEngine.getSnake().getPosition()).toEqual(initialState.snakePosition);
        expect(gameEngine.getFood().getPosition()).toEqual(initialState.foodPosition);
    });

    test('should handle high score persistence across game sessions', () => {
        // First game session
        gameEngine.start();
        const mockFood = { type: 'normal' };
        gameEngine.incrementScore(mockFood);
        gameEngine.incrementScore(mockFood);
        const firstSessionScore = gameEngine.getScore();
        gameEngine.gameOver();

        // Second game session with lower score
        gameEngine.start();
        gameEngine.incrementScore(mockFood); // Lower score
        const secondSessionScore = gameEngine.getScore();
        gameEngine.gameOver();

        // High score should be from first session
        expect(gameEngine.getHighScore()).toBe(firstSessionScore);
        expect(gameEngine.getHighScore()).toBeGreaterThan(secondSessionScore);
    });

    test('should render game elements correctly', () => {
        gameEngine.start();
        
        // Call render method
        gameEngine.render();
        
        // Verify that rendering methods were called
        expect(mockCtx.fillRect).toHaveBeenCalled();
        expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('should handle multiple input commands in sequence', () => {
        gameEngine.start();
        
        // Test sequence of directional inputs
        gameEngine.handleInput('ArrowUp');
        expect(gameEngine.pendingDirection).toBe('up');
        
        gameEngine.handleInput('ArrowRight');
        expect(gameEngine.pendingDirection).toBe('right');
        
        gameEngine.handleInput('ArrowDown');
        expect(gameEngine.pendingDirection).toBe('down');
        
        // Test pause in middle of movement
        gameEngine.handleInput(' ');
        expect(gameEngine.isPaused()).toBe(true);
        
        // Resume and continue
        gameEngine.handleInput(' ');
        expect(gameEngine.isRunning()).toBe(true);
    });

    test('should prevent food from spawning on snake segments', () => {
        gameEngine.start();
        
        // Get current snake segments and food position
        const snake = gameEngine.getSnake();
        const food = gameEngine.getFood();
        
        // Force respawn food multiple times to test collision avoidance
        for (let i = 0; i < 10; i++) {
            gameEngine.spawnFood();
            const foodPosition = food.getPosition();
            const snakeSegments = snake.getSegments();
            
            // Verify food doesn't overlap with any snake segment
            const overlaps = snakeSegments.some(segment => 
                segment.x === foodPosition.x && segment.y === foodPosition.y
            );
            expect(overlaps).toBe(false);
        }
    });
});