// Type definitions for the AI-Adaptive Snake Game
// Note: These are JSDoc type definitions for JavaScript. 
// In a TypeScript project, these would be proper TypeScript interfaces.

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate on the grid
 * @property {number} y - Y coordinate on the grid
 */

/**
 * @typedef {Object} SnakeState
 * @property {Position[]} segments - Array of snake body segments
 * @property {'up'|'down'|'left'|'right'} direction - Current movement direction
 * @property {number} length - Current length of the snake
 */

/**
 * @typedef {Object} FoodState
 * @property {Position} position - Current food position
 * @property {'normal'|'special'} type - Type of food item
 */

/**
 * @typedef {Object} ScoreState
 * @property {number} current - Current game score
 * @property {number} high - Highest score achieved
 */

/**
 * @typedef {Object} GameState
 * @property {SnakeState} snake - Snake entity state
 * @property {FoodState} food - Food entity state
 * @property {ScoreState} score - Score tracking state
 * @property {'playing'|'paused'|'gameOver'|'menu'} gameStatus - Current game status
 * @property {number} difficulty - Current difficulty level (1-10 scale)
 */

/**
 * @typedef {Object} MovementRecord
 * @property {number} timestamp - When the movement occurred
 * @property {Position} position - Snake position during movement
 * @property {string} direction - Direction of movement
 * @property {Object} gameContext - Context information during movement
 * @property {number} gameContext.score - Score at time of movement
 * @property {number} gameContext.snakeLength - Snake length at time of movement
 * @property {number} gameContext.foodDistance - Distance to food at time of movement
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} averageScore - Average score across all games
 * @property {number} averageGameDuration - Average game duration in milliseconds
 * @property {number[]} recentScores - Array of recent game scores
 * @property {number[]} difficultyProgression - History of difficulty changes
 */

/**
 * @typedef {Object} AdaptationSettings
 * @property {number} currentDifficulty - Current difficulty level
 * @property {'random'|'challenging'|'accessible'} foodPlacementStrategy - Current food placement strategy
 * @property {number} visualIntensityLevel - Current visual intensity level
 */

/**
 * @typedef {Object} AIBehaviorData
 * @property {number[][]} movementHeatmap - 2D array of movement frequencies
 * @property {PerformanceMetrics} performanceMetrics - Player performance data
 * @property {AdaptationSettings} adaptationSettings - Current AI adaptation settings
 */

/**
 * @typedef {Object} GameConfig
 * @property {number} gridSize - Size of each grid cell in pixels
 * @property {number} canvasWidth - Canvas width in pixels
 * @property {number} canvasHeight - Canvas height in pixels
 * @property {number} targetFPS - Target frames per second
 * @property {number} baseSpeed - Base snake movement speed
 */

// Export type validation functions for runtime type checking

/**
 * Validates if an object is a valid Position
 * @param {any} obj - Object to validate
 * @returns {boolean} True if valid Position
 */
export function isValidPosition(obj) {
    return obj !== null && 
           obj !== undefined &&
           typeof obj === 'object' &&
           typeof obj.x === 'number' && 
           typeof obj.y === 'number' &&
           obj.x >= 0 && 
           obj.y >= 0;
}

/**
 * Validates if an object is a valid GameState
 * @param {any} obj - Object to validate
 * @returns {boolean} True if valid GameState
 */
export function isValidGameState(obj) {
    return obj &&
           obj.snake &&
           Array.isArray(obj.snake.segments) &&
           obj.snake.segments.every(isValidPosition) &&
           ['up', 'down', 'left', 'right'].includes(obj.snake.direction) &&
           typeof obj.snake.length === 'number' &&
           obj.food &&
           (obj.food.position === null || isValidPosition(obj.food.position)) &&
           ['normal', 'special'].includes(obj.food.type) &&
           obj.score &&
           typeof obj.score.current === 'number' &&
           typeof obj.score.high === 'number' &&
           ['playing', 'paused', 'gameOver', 'menu'].includes(obj.gameStatus) &&
           typeof obj.difficulty === 'number' &&
           obj.difficulty >= 1 && obj.difficulty <= 10;
}

/**
 * Validates if an object is valid AIBehaviorData
 * @param {any} obj - Object to validate
 * @returns {boolean} True if valid AIBehaviorData
 */
export function isValidAIBehaviorData(obj) {
    return obj &&
           Array.isArray(obj.movementHeatmap) &&
           obj.movementHeatmap.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'number')) &&
           obj.performanceMetrics &&
           typeof obj.performanceMetrics.averageScore === 'number' &&
           typeof obj.performanceMetrics.averageGameDuration === 'number' &&
           Array.isArray(obj.performanceMetrics.recentScores) &&
           Array.isArray(obj.performanceMetrics.difficultyProgression) &&
           obj.adaptationSettings &&
           typeof obj.adaptationSettings.currentDifficulty === 'number' &&
           ['random', 'challenging', 'accessible'].includes(obj.adaptationSettings.foodPlacementStrategy) &&
           typeof obj.adaptationSettings.visualIntensityLevel === 'number';
}