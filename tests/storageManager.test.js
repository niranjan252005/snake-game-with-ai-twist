// StorageManager Tests
import { StorageManager } from '../js/storageManager.js';

describe('StorageManager', () => {
    let storageManager;
    let mockLocalStorage;

    beforeEach(() => {
        // Create a mock localStorage
        mockLocalStorage = {
            data: {},
            setItem: jest.fn((key, value) => {
                mockLocalStorage.data[key] = value;
            }),
            getItem: jest.fn((key) => {
                return mockLocalStorage.data[key] || null;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage.data[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage.data = {};
            }),
            get length() {
                return Object.keys(mockLocalStorage.data).length;
            },
            key: jest.fn((index) => {
                const keys = Object.keys(mockLocalStorage.data);
                return keys[index] || null;
            })
        };

        // Replace global localStorage with mock
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        storageManager = new StorageManager();
    });

    afterEach(() => {
        mockLocalStorage.clear();
    });

    describe('Constructor', () => {
        test('should initialize with correct keys and version', () => {
            expect(storageManager.gameDataKey).toBe('aiSnakeGame_data');
            expect(storageManager.highScoreKey).toBe('aiSnakeGame_highScore');
            expect(storageManager.behaviorDataKey).toBe('aiSnakeGame_behaviorData');
            expect(storageManager.dataVersion).toBe('1.0');
        });
    });

    describe('High Score Management', () => {
        test('should save and load high score correctly', () => {
            const score = 150;
            const result = storageManager.saveHighScore(score);
            
            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            
            const loadedScore = storageManager.loadHighScore();
            expect(loadedScore).toBe(score);
        });

        test('should return 0 for non-existent high score', () => {
            const score = storageManager.loadHighScore();
            expect(score).toBe(0);
        });

        test('should not save invalid scores', () => {
            expect(storageManager.saveHighScore(-10)).toBe(false);
            expect(storageManager.saveHighScore('invalid')).toBe(false);
            expect(storageManager.saveHighScore(null)).toBe(false);
            expect(storageManager.saveHighScore(1.5)).toBe(false);
        });

        test('should only save if score is higher than current high score', () => {
            storageManager.saveHighScore(100);
            
            // Try to save lower score
            const result = storageManager.saveHighScore(50);
            expect(result).toBe(true); // Not an error, just not saved
            
            const loadedScore = storageManager.loadHighScore();
            expect(loadedScore).toBe(100); // Should still be the higher score
        });

        // Legacy format handling is tested implicitly through the error handling paths
    });

    describe('Game Data Management', () => {
        const validGameData = {
            snake: {
                segments: [{ x: 100, y: 100 }, { x: 80, y: 100 }],
                direction: 'right',
                length: 2
            },
            food: {
                position: { x: 200, y: 200 },
                type: 'normal'
            },
            score: {
                current: 10,
                high: 50
            },
            gameStatus: 'playing',
            difficulty: 3
        };

        test('should save and load valid game data', () => {
            const result = storageManager.saveGameData(validGameData);
            expect(result).toBe(true);
            
            const loadedData = storageManager.loadGameData();
            expect(loadedData).toEqual(validGameData);
        });

        test('should return null for non-existent game data', () => {
            const data = storageManager.loadGameData();
            expect(data).toBeNull();
        });

        test('should reject invalid game data', () => {
            const invalidData = { invalid: 'data' };
            const result = storageManager.saveGameData(invalidData);
            expect(result).toBe(false);
        });

        test('should validate required game data properties', () => {
            const incompleteData = {
                snake: { segments: [{ x: 0, y: 0 }] },
                // Missing food, score, gameStatus
            };
            
            const result = storageManager.saveGameData(incompleteData);
            expect(result).toBe(false);
        });

        test('should handle corrupted game data gracefully', () => {
            // Simulate corrupted data
            mockLocalStorage.setItem('aiSnakeGame_data', 'invalid json');
            
            const data = storageManager.loadGameData();
            expect(data).toBeNull();
            
            // Should clear corrupted data
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aiSnakeGame_data');
        });
    });

    describe('Behavior Data Management', () => {
        const validBehaviorData = {
            movementHeatmap: [
                [0, 1, 2],
                [3, 0, 1],
                [1, 2, 0]
            ],
            performanceMetrics: {
                averageScore: 45.5,
                averageGameDuration: 30000,
                recentScores: [40, 45, 50],
                difficultyProgression: [1, 2, 3],
                totalGamesPlayed: 10
            },
            adaptationSettings: {
                currentDifficulty: 3,
                foodPlacementStrategy: 'challenging',
                visualIntensityLevel: 2
            }
        };

        test('should save and load valid behavior data', () => {
            const result = storageManager.saveBehaviorData(validBehaviorData);
            expect(result).toBe(true);
            
            const loadedData = storageManager.loadBehaviorData();
            expect(loadedData).toEqual(validBehaviorData);
        });

        test('should return null for non-existent behavior data', () => {
            const data = storageManager.loadBehaviorData();
            expect(data).toBeNull();
        });

        test('should reject invalid behavior data', () => {
            const invalidData = { invalid: 'data' };
            const result = storageManager.saveBehaviorData(invalidData);
            expect(result).toBe(false);
        });

        test('should compress and decompress heatmap data', () => {
            const result = storageManager.saveBehaviorData(validBehaviorData);
            expect(result).toBe(true);
            
            const loadedData = storageManager.loadBehaviorData();
            expect(loadedData.movementHeatmap).toEqual(validBehaviorData.movementHeatmap);
        });

        test('should handle sparse heatmap compression', () => {
            const sparseHeatmapData = {
                ...validBehaviorData,
                movementHeatmap: [
                    [0, 0, 0, 5],
                    [0, 3, 0, 0],
                    [0, 0, 0, 0],
                    [1, 0, 0, 0]
                ]
            };
            
            storageManager.saveBehaviorData(sparseHeatmapData);
            const loadedData = storageManager.loadBehaviorData();
            
            expect(loadedData.movementHeatmap).toEqual(sparseHeatmapData.movementHeatmap);
        });
    });

    describe('Storage Management', () => {
        test('should clear all data successfully', () => {
            // Add some data first
            storageManager.saveHighScore(100);
            storageManager.saveGameData({
                snake: { segments: [{ x: 0, y: 0 }] },
                food: { position: { x: 20, y: 20 } },
                score: { current: 0, high: 0 },
                gameStatus: 'playing'
            });
            
            const result = storageManager.clearAllData();
            expect(result).toBe(true);
            
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aiSnakeGame_data');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aiSnakeGame_highScore');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aiSnakeGame_behaviorData');
        });

        test('should get storage info', () => {
            storageManager.saveHighScore(100);
            
            const info = storageManager.getStorageInfo();
            expect(info).toHaveProperty('gameDataSize');
            expect(info).toHaveProperty('highScoreSize');
            expect(info).toHaveProperty('behaviorDataSize');
            expect(info).toHaveProperty('totalSize');
            expect(info).toHaveProperty('isAvailable');
            expect(info.isAvailable).toBe(true);
        });

        test('should detect storage availability', () => {
            expect(storageManager.isStorageAvailable()).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle localStorage unavailable', () => {
            // Mock localStorage to throw error
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });
            
            const result = storageManager.saveHighScore(100);
            expect(result).toBe(false);
        });

        test('should handle quota exceeded error gracefully', () => {
            // Test that quota exceeded errors are handled gracefully
            const quotaError = new Error('Quota exceeded');
            quotaError.name = 'QuotaExceededError';
            
            mockLocalStorage.setItem.mockImplementation(() => {
                throw quotaError;
            });
            
            const gameData = {
                snake: { segments: [{ x: 0, y: 0 }] },
                food: { position: { x: 20, y: 20 } },
                score: { current: 0, high: 0 },
                gameStatus: 'playing'
            };
            
            // Should return false when quota is exceeded and cleanup fails
            const result = storageManager.saveGameData(gameData);
            expect(result).toBe(false);
        });

        test('should handle JSON parse errors gracefully', () => {
            mockLocalStorage.setItem('aiSnakeGame_behaviorData', 'invalid json');
            
            const data = storageManager.loadBehaviorData();
            expect(data).toBeNull();
        });
    });

    describe('Data Validation', () => {
        test('should validate game data structure correctly', () => {
            const validData = {
                snake: { segments: [{ x: 0, y: 0 }] },
                food: { position: { x: 20, y: 20 } },
                score: { current: 10, high: 50 },
                gameStatus: 'playing'
            };
            
            expect(storageManager.validateGameData(validData)).toBe(true);
            expect(storageManager.validateGameData(null)).toBe(false);
            expect(storageManager.validateGameData({})).toBe(false);
            expect(storageManager.validateGameData({ snake: null })).toBe(false);
        });

        test('should validate behavior data structure correctly', () => {
            const validData = {
                movementHeatmap: [[0, 1], [1, 0]],
                performanceMetrics: { averageScore: 0 },
                adaptationSettings: { currentDifficulty: 1 }
            };
            
            expect(storageManager.validateBehaviorData(validData)).toBe(true);
            expect(storageManager.validateBehaviorData(null)).toBe(false);
            expect(storageManager.validateBehaviorData({})).toBe(false);
            expect(storageManager.validateBehaviorData({ movementHeatmap: 'invalid' })).toBe(false);
        });
    });
});