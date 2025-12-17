// AI Engine tests
import { AIEngine } from '../js/aiEngine.js';

describe('AIEngine', () => {
    let aiEngine;
    const gridSize = 20;
    const canvasWidth = 400;
    const canvasHeight = 400;

    beforeEach(() => {
        aiEngine = new AIEngine(gridSize, canvasWidth, canvasHeight);
    });

    describe('Movement Recording', () => {
        test('should record movement with position and direction', () => {
            const position = { x: 100, y: 100 };
            const direction = 'right';
            const gameContext = { score: 10, snakeLength: 3, foodDistance: 50 };

            aiEngine.recordMovement(position, direction, gameContext);

            const history = aiEngine.getMovementHistory();
            expect(history).toHaveLength(1);
            expect(history[0].position).toEqual(position);
            expect(history[0].direction).toEqual(direction);
            expect(history[0].gameContext).toEqual(gameContext);
            expect(history[0].timestamp).toBeDefined();
        });

        test('should update heatmap when recording movement', () => {
            const position = { x: 100, y: 100 };
            const direction = 'right';

            const heatmapBefore = aiEngine.getRawHeatmap();
            aiEngine.recordMovement(position, direction);
            const heatmapAfter = aiEngine.getRawHeatmap();

            // Grid position should be (5, 5) for position (100, 100) with gridSize 20
            const gridX = Math.floor(position.x / gridSize);
            const gridY = Math.floor(position.y / gridSize);
            
            expect(heatmapAfter[gridY][gridX]).toBe(heatmapBefore[gridY][gridX] + 1);
        });

        test('should maintain history size limit', () => {
            const maxSize = aiEngine.maxHistorySize;
            
            // Add more movements than the limit
            for (let i = 0; i < maxSize + 10; i++) {
                aiEngine.recordMovement({ x: i * 20, y: 0 }, 'right');
            }

            const history = aiEngine.getMovementHistory();
            expect(history).toHaveLength(maxSize);
        });
    });

    describe('Heatmap Generation', () => {
        test('should generate normalized heatmap', () => {
            // Record some movements
            aiEngine.recordMovement({ x: 100, y: 100 }, 'right');
            aiEngine.recordMovement({ x: 100, y: 100 }, 'right');
            aiEngine.recordMovement({ x: 120, y: 100 }, 'right');

            const normalizedHeatmap = aiEngine.generateHeatmap();
            
            expect(normalizedHeatmap).toHaveLength(20); // gridHeight
            expect(normalizedHeatmap[0]).toHaveLength(20); // gridWidth
            
            // Check that values are normalized (between 0 and 1)
            for (let y = 0; y < normalizedHeatmap.length; y++) {
                for (let x = 0; x < normalizedHeatmap[y].length; x++) {
                    expect(normalizedHeatmap[y][x]).toBeGreaterThanOrEqual(0);
                    expect(normalizedHeatmap[y][x]).toBeLessThanOrEqual(1);
                }
            }
        });

        test('should identify hotspots correctly', () => {
            // Create a clear hotspot by recording many movements at the same position
            for (let i = 0; i < 10; i++) {
                aiEngine.recordMovement({ x: 100, y: 100 }, 'right');
            }

            const hotspots = aiEngine.getHotspots(0.5);
            expect(hotspots.length).toBeGreaterThan(0);
            expect(hotspots[0].x).toBe(100);
            expect(hotspots[0].y).toBe(100);
            expect(hotspots[0].intensity).toBeCloseTo(1.0);
        });

        test('should identify coldspots correctly', () => {
            // Record movements to create some activity
            aiEngine.recordMovement({ x: 100, y: 100 }, 'right');
            
            const coldspots = aiEngine.getColdspots(0.1);
            expect(coldspots.length).toBeGreaterThan(0);
            
            // Most spots should be cold since we only recorded one movement
            expect(coldspots.length).toBeGreaterThan(300); // Most of the 400 grid cells
        });
    });

    describe('Adaptive Food Placement', () => {
        test('should suggest random placement with insufficient data', () => {
            const position = aiEngine.suggestFoodPlacement();
            
            expect(position).toBeDefined();
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThan(canvasWidth);
            expect(position.y).toBeLessThan(canvasHeight);
        });

        test('should avoid excluded positions', () => {
            const excludePositions = [
                { x: 0, y: 0 },
                { x: 20, y: 0 },
                { x: 40, y: 0 }
            ];

            const position = aiEngine.suggestFoodPlacement(excludePositions);
            
            expect(position).toBeDefined();
            expect(excludePositions).not.toContainEqual(position);
        });

        test('should use challenging placement for low diversity patterns', () => {
            // Set difficulty to 3 to avoid very low difficulty override
            aiEngine.setDifficulty(3);
            
            // Create a pattern with low diversity (mostly right movements)
            for (let i = 0; i < 30; i++) {
                aiEngine.recordMovement({ x: i * 20, y: 100 }, 'right');
            }

            const strategy = aiEngine.determinePlacementStrategy();
            expect(strategy).toBe('challenging');
        });

        test('should use accessible placement for high diversity patterns', () => {
            // Create a pattern with high diversity (varied movements)
            const directions = ['up', 'down', 'left', 'right'];
            for (let i = 0; i < 30; i++) {
                const direction = directions[i % 4];
                aiEngine.recordMovement({ x: (i % 10) * 20, y: (Math.floor(i / 10)) * 20 }, direction);
            }

            const strategy = aiEngine.determinePlacementStrategy();
            expect(strategy).toBe('accessible');
        });
    });

    describe('Movement Pattern Analysis', () => {
        test('should analyze movement patterns correctly', () => {
            // Record some movements with a clear pattern
            for (let i = 0; i < 20; i++) {
                aiEngine.recordMovement({ x: i * 20, y: 0 }, 'right');
            }
            for (let i = 0; i < 5; i++) {
                aiEngine.recordMovement({ x: 0, y: i * 20 }, 'down');
            }

            const analysis = aiEngine.analyzeMovementPatterns();
            
            expect(analysis.totalMovements).toBe(25);
            expect(analysis.dominantDirections).toContain('right');
            expect(analysis.directionCounts.right).toBe(20);
            expect(analysis.directionCounts.down).toBe(5);
            expect(analysis.movementDiversity).toBeLessThan(1);
        });
    });

    describe('Visual Intensity', () => {
        test('should update visual intensity based on movement patterns', () => {
            const initialIntensity = aiEngine.updateVisualIntensity();
            
            // Record varied movements to increase intensity
            const directions = ['up', 'down', 'left', 'right'];
            for (let i = 0; i < 20; i++) {
                const direction = directions[i % 4];
                aiEngine.recordMovement({ x: (i % 5) * 20, y: (Math.floor(i / 5)) * 20 }, direction);
            }

            const newIntensity = aiEngine.updateVisualIntensity();
            expect(aiEngine.adaptationSettings.visualIntensityLevel).toBeGreaterThanOrEqual(1);
            expect(aiEngine.adaptationSettings.visualIntensityLevel).toBeLessThanOrEqual(5);
        });
    });
});