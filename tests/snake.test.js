// Unit tests for Snake class
import { Snake } from '../js/snake.js';

describe('Snake Class Unit Tests', () => {
    let snake;
    const gridSize = 20;
    const canvasWidth = 600;
    const canvasHeight = 600;

    beforeEach(() => {
        snake = new Snake(gridSize, canvasWidth, canvasHeight);
    });

    describe('Constructor', () => {
        test('initializes snake with correct starting position and direction', () => {
            expect(snake.segments).toHaveLength(3);
            expect(snake.direction).toBe('right');
            expect(snake.nextDirection).toBe('right');
            
            // Check that segments are positioned correctly
            const head = snake.segments[0];
            expect(head.x).toBeGreaterThanOrEqual(0);
            expect(head.y).toBeGreaterThanOrEqual(0);
            expect(head.x % gridSize).toBe(0);
            expect(head.y % gridSize).toBe(0);
        });
    });

    describe('Movement', () => {
        test('moves snake right by one grid cell', () => {
            const initialHead = { ...snake.segments[0] };
            snake.move();
            
            const newHead = snake.segments[0];
            expect(newHead.x).toBe(initialHead.x + gridSize);
            expect(newHead.y).toBe(initialHead.y);
            expect(snake.segments).toHaveLength(3); // Length unchanged without growth
        });

        test('moves snake in each direction when allowed', () => {
            // Test right movement (default direction)
            const initialHead = { ...snake.segments[0] };
            snake.move();
            expect(snake.segments[0].x).toBe(initialHead.x + gridSize);
            expect(snake.segments[0].y).toBe(initialHead.y);
            
            // Test up movement (allowed from right)
            const headAfterRight = { ...snake.segments[0] };
            snake.move('up');
            expect(snake.segments[0].y).toBe(headAfterRight.y - gridSize);
            expect(snake.segments[0].x).toBe(headAfterRight.x);
            
            // Test left movement (allowed from up)
            const headAfterUp = { ...snake.segments[0] };
            snake.move('left');
            expect(snake.segments[0].x).toBe(headAfterUp.x - gridSize);
            expect(snake.segments[0].y).toBe(headAfterUp.y);
            
            // Test down movement (allowed from left)
            const headAfterLeft = { ...snake.segments[0] };
            snake.move('down');
            expect(snake.segments[0].y).toBe(headAfterLeft.y + gridSize);
            expect(snake.segments[0].x).toBe(headAfterLeft.x);
        });

        test('prevents reversing into self', () => {
            snake.direction = 'right';
            snake.setDirection('left'); // Should be ignored
            snake.move();
            
            expect(snake.direction).toBe('right');
        });
    });

    describe('Growth', () => {
        test('increases snake length when growing', () => {
            const initialLength = snake.segments.length;
            snake.grow();
            
            expect(snake.segments).toHaveLength(initialLength + 1);
        });

        test('adds new segment at tail position', () => {
            const initialTail = { ...snake.segments[snake.segments.length - 1] };
            snake.grow();
            
            const newTail = snake.segments[snake.segments.length - 1];
            expect(newTail).toBeDefined();
            expect(newTail.x % gridSize).toBe(0);
            expect(newTail.y % gridSize).toBe(0);
        });
    });

    describe('Collision Detection', () => {
        test('detects wall collision at boundaries', () => {
            // Move snake to left wall
            snake.segments[0] = { x: -gridSize, y: 100 };
            expect(snake.checkCollision()).toBe(true);
            
            // Move snake to right wall
            snake.segments[0] = { x: canvasWidth, y: 100 };
            expect(snake.checkCollision()).toBe(true);
            
            // Move snake to top wall
            snake.segments[0] = { x: 100, y: -gridSize };
            expect(snake.checkCollision()).toBe(true);
            
            // Move snake to bottom wall
            snake.segments[0] = { x: 100, y: canvasHeight };
            expect(snake.checkCollision()).toBe(true);
        });

        test('detects self collision', () => {
            // Create a snake that collides with itself
            snake.segments = [
                { x: 100, y: 100 }, // head
                { x: 80, y: 100 },  // body
                { x: 60, y: 100 },  // body
                { x: 100, y: 100 }  // tail at same position as head
            ];
            
            expect(snake.checkCollision()).toBe(true);
        });

        test('returns false when no collision occurs', () => {
            // Position snake safely in middle of canvas
            snake.segments[0] = { x: 300, y: 300 };
            expect(snake.checkCollision()).toBe(false);
        });
    });

    describe('Utility Methods', () => {
        test('getPosition returns head position', () => {
            const head = snake.getPosition();
            expect(head).toEqual(snake.segments[0]);
        });

        test('getSegments returns copy of segments', () => {
            const segments = snake.getSegments();
            expect(segments).toEqual(snake.segments);
            expect(segments).not.toBe(snake.segments); // Should be a copy
        });
    });
});