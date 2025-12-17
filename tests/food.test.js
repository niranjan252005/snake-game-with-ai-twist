// Unit tests for Food class
import { Food } from '../js/food.js';

describe('Food Class Unit Tests', () => {
    let food;
    const gridSize = 20;
    const canvasWidth = 600;
    const canvasHeight = 600;

    beforeEach(() => {
        food = new Food(gridSize, canvasWidth, canvasHeight);
    });

    describe('Constructor', () => {
        test('initializes food with correct properties', () => {
            expect(food.gridSize).toBe(gridSize);
            expect(food.canvasWidth).toBe(canvasWidth);
            expect(food.canvasHeight).toBe(canvasHeight);
            expect(food.position).toBe(null);
            expect(food.type).toBe('normal');
        });
    });

    describe('Spawning', () => {
        test('spawns food at specified position', () => {
            const testPosition = { x: 100, y: 200 };
            food.spawn(testPosition);
            
            expect(food.position).toEqual(testPosition);
            expect(food.position).not.toBe(testPosition); // Should be a copy
            expect(food.type).toBe('normal');
        });

        test('spawns food at random position when no position provided', () => {
            food.spawn();
            
            expect(food.position).toBeDefined();
            expect(food.position.x).toBeGreaterThanOrEqual(0);
            expect(food.position.y).toBeGreaterThanOrEqual(0);
            expect(food.position.x % gridSize).toBe(0);
            expect(food.position.y % gridSize).toBe(0);
        });
    });

    describe('Consumption', () => {
        test('consume returns food data and clears position', () => {
            const testPosition = { x: 100, y: 200 };
            food.spawn(testPosition);
            
            const consumedFood = food.consume();
            
            expect(consumedFood.position).toEqual(testPosition);
            expect(consumedFood.type).toBe('normal');
            expect(food.position).toBe(null);
        });

        test('consume resets type to normal', () => {
            food.spawn({ x: 100, y: 200 });
            food.type = 'special';
            
            const consumedFood = food.consume();
            
            expect(consumedFood.type).toBe('special');
            expect(food.type).toBe('normal');
        });
    });

    describe('Position Generation', () => {
        test('generateRandomPosition creates valid grid-aligned position', () => {
            const position = food.generateRandomPosition();
            
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThan(canvasWidth);
            expect(position.y).toBeLessThan(canvasHeight);
            expect(position.x % gridSize).toBe(0);
            expect(position.y % gridSize).toBe(0);
        });

        test('generateRandomPosition avoids excluded positions', () => {
            const excludePositions = [
                { x: 0, y: 0 },
                { x: 20, y: 0 },
                { x: 40, y: 0 }
            ];
            
            const position = food.generateRandomPosition(excludePositions);
            
            expect(excludePositions).not.toContainEqual(position);
        });

        test('generateRandomPosition falls back to corner when all positions excluded', () => {
            // Create a large exclude list (though not actually all positions)
            const excludePositions = [];
            for (let x = 0; x < canvasWidth; x += gridSize) {
                for (let y = 0; y < canvasHeight; y += gridSize) {
                    if (!(x === 0 && y === 0)) { // Leave corner available
                        excludePositions.push({ x, y });
                    }
                }
            }
            
            const position = food.generateRandomPosition(excludePositions);
            expect(position).toEqual({ x: 0, y: 0 });
        });
    });

    describe('Utility Methods', () => {
        test('getPosition returns copy of position', () => {
            const testPosition = { x: 100, y: 200 };
            food.spawn(testPosition);
            
            const position = food.getPosition();
            expect(position).toEqual(testPosition);
            expect(position).not.toBe(food.position); // Should be a copy
        });

        test('getPosition returns null when no food spawned', () => {
            expect(food.getPosition()).toBe(null);
        });
    });
});