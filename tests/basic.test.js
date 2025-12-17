// Basic tests to verify the project structure is working correctly

import { Snake } from '../js/snake.js';
import { Food } from '../js/food.js';
import { AIEngine } from '../js/aiEngine.js';
import { Renderer } from '../js/renderer.js';
import { StorageManager } from '../js/storageManager.js';
import { GameEngine } from '../js/gameEngine.js';
import { isValidPosition, isValidGameState, isValidAIBehaviorData } from '../js/types.js';

describe('Project Structure Tests', () => {
    test('All core classes can be imported', () => {
        expect(Snake).toBeDefined();
        expect(Food).toBeDefined();
        expect(AIEngine).toBeDefined();
        expect(Renderer).toBeDefined();
        expect(StorageManager).toBeDefined();
        expect(GameEngine).toBeDefined();
    });

    test('Type validation functions are available', () => {
        expect(isValidPosition).toBeDefined();
        expect(isValidGameState).toBeDefined();
        expect(isValidAIBehaviorData).toBeDefined();
    });

    test('Classes can be instantiated with basic parameters', () => {
        const gridSize = 20;
        const canvasWidth = 600;
        const canvasHeight = 600;
        const mockCtx = new (global.HTMLCanvasElement)().getContext('2d');

        expect(() => new Snake(gridSize, canvasWidth, canvasHeight)).not.toThrow();
        expect(() => new Food(gridSize, canvasWidth, canvasHeight)).not.toThrow();
        expect(() => new AIEngine(gridSize, canvasWidth, canvasHeight)).not.toThrow();
        expect(() => new Renderer(mockCtx, canvasWidth, canvasHeight, gridSize)).not.toThrow();
        expect(() => new StorageManager()).not.toThrow();
        expect(() => new GameEngine(mockCtx, canvasWidth, canvasHeight)).not.toThrow();
    });
});

describe('Type Validation Tests', () => {
    test('isValidPosition validates positions correctly', () => {
        expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
        expect(isValidPosition({ x: 100, y: 200 })).toBe(true);
        expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
        expect(isValidPosition({ x: 0, y: -1 })).toBe(false);
        expect(isValidPosition(null)).toBe(false);
        expect(isValidPosition({})).toBe(false);
        expect(isValidPosition({ x: 'invalid' })).toBe(false);
    });

    test('Basic class initialization creates expected structure', () => {
        const gridSize = 20;
        const canvasWidth = 600;
        const canvasHeight = 600;

        const snake = new Snake(gridSize, canvasWidth, canvasHeight);
        expect(snake.segments).toBeDefined();
        expect(Array.isArray(snake.segments)).toBe(true);
        expect(snake.direction).toBeDefined();

        const food = new Food(gridSize, canvasWidth, canvasHeight);
        expect(food.gridSize).toBe(gridSize);
        expect(food.position).toBe(null);

        const aiEngine = new AIEngine(gridSize, canvasWidth, canvasHeight);
        expect(aiEngine.movementHistory).toBeDefined();
        expect(Array.isArray(aiEngine.movementHistory)).toBe(true);
        expect(aiEngine.movementHeatmap).toBeDefined();
        expect(Array.isArray(aiEngine.movementHeatmap)).toBe(true);
    });
});