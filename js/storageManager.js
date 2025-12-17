// Storage Manager - Handles data persistence using browser local storage
export class StorageManager {
    constructor() {
        this.gameDataKey = 'aiSnakeGame_data';
        this.highScoreKey = 'aiSnakeGame_highScore';
        this.behaviorDataKey = 'aiSnakeGame_behaviorData';
        this.dataVersion = '1.0'; // For future compatibility
    }

    /**
     * Save complete game data including state and AI behavior data
     * @param {Object} data - Game data object containing snake, food, score, etc.
     * @returns {boolean} - Success status
     */
    saveGameData(data) {
        try {
            // Validate data structure before saving
            if (!this.validateGameData(data)) {
                console.warn('Invalid game data structure, skipping save');
                return false;
            }

            // Add metadata for versioning and timestamp
            const dataWithMetadata = {
                version: this.dataVersion,
                timestamp: Date.now(),
                data: data
            };

            const serializedData = JSON.stringify(dataWithMetadata);
            
            // Check if localStorage is available and has space
            if (!this.isStorageAvailable()) {
                console.error('Local storage is not available');
                return false;
            }

            localStorage.setItem(this.gameDataKey, serializedData);
            return true;
        } catch (error) {
            console.error('Failed to save game data:', error);
            
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, attempting cleanup');
                this.cleanupOldData();
                // Try saving again after cleanup
                try {
                    localStorage.setItem(this.gameDataKey, JSON.stringify({
                        version: this.dataVersion,
                        timestamp: Date.now(),
                        data: data
                    }));
                    return true;
                } catch (retryError) {
                    console.error('Failed to save even after cleanup:', retryError);
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * Load complete game data
     * @returns {Object|null} - Game data object or null if not found/invalid
     */
    loadGameData() {
        try {
            const serializedData = localStorage.getItem(this.gameDataKey);
            if (!serializedData) {
                return null;
            }

            const parsedData = JSON.parse(serializedData);
            
            // Handle legacy data without metadata
            if (!parsedData.version) {
                console.warn('Loading legacy game data without version info');
                return this.validateGameData(parsedData) ? parsedData : null;
            }

            // Validate version compatibility
            if (parsedData.version !== this.dataVersion) {
                console.warn(`Data version mismatch: ${parsedData.version} vs ${this.dataVersion}`);
                // Could implement migration logic here in the future
            }

            // Validate and return the actual data
            const gameData = parsedData.data;
            return this.validateGameData(gameData) ? gameData : null;
        } catch (error) {
            console.error('Failed to load game data:', error);
            
            // If data is corrupted, clear it to prevent future issues
            if (error instanceof SyntaxError) {
                console.warn('Corrupted game data detected, clearing storage');
                localStorage.removeItem(this.gameDataKey);
            }
            return null;
        }
    }

    /**
     * Save high score with validation
     * @param {number} score - The score to save
     * @returns {boolean} - Success status
     */
    saveHighScore(score) {
        try {
            // Validate score is a positive number
            if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
                console.error('Invalid score format:', score);
                return false;
            }

            // Only save if it's actually a high score
            const currentHighScore = this.loadHighScore();
            if (score <= currentHighScore) {
                return true; // Not an error, just not a new high score
            }

            const scoreData = {
                score: score,
                timestamp: Date.now(),
                version: this.dataVersion
            };

            localStorage.setItem(this.highScoreKey, JSON.stringify(scoreData));
            return true;
        } catch (error) {
            console.error('Failed to save high score:', error);
            return false;
        }
    }

    /**
     * Load high score with fallback to legacy format
     * @returns {number} - High score or 0 if not found
     */
    loadHighScore() {
        try {
            const scoreData = localStorage.getItem(this.highScoreKey);
            if (!scoreData) {
                return 0;
            }

            // Try parsing as new format first
            try {
                const parsedData = JSON.parse(scoreData);
                if (typeof parsedData === 'object' && parsedData.score !== undefined) {
                    return Math.max(0, parseInt(parsedData.score, 10) || 0);
                }
            } catch (parseError) {
                // Fall back to legacy format (plain number string)
                const legacyScore = parseInt(scoreData, 10);
                if (!isNaN(legacyScore)) {
                    return Math.max(0, legacyScore);
                }
            }

            return 0;
        } catch (error) {
            console.error('Failed to load high score:', error);
            return 0;
        }
    }

    /**
     * Save AI behavior data with comprehensive validation
     * @param {Object} data - AI behavior data from AIEngine
     * @returns {boolean} - Success status
     */
    saveBehaviorData(data) {
        try {
            // Validate behavior data structure
            if (!this.validateBehaviorData(data)) {
                console.warn('Invalid behavior data structure, skipping save');
                return false;
            }

            // Add metadata and compress large heatmap data
            const behaviorDataWithMetadata = {
                version: this.dataVersion,
                timestamp: Date.now(),
                data: this.compressBehaviorData(data)
            };

            const serializedData = JSON.stringify(behaviorDataWithMetadata);
            
            if (!this.isStorageAvailable()) {
                console.error('Local storage is not available');
                return false;
            }

            localStorage.setItem(this.behaviorDataKey, serializedData);
            return true;
        } catch (error) {
            console.error('Failed to save behavior data:', error);
            
            // Handle quota exceeded by cleaning up old data
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, attempting cleanup');
                this.cleanupOldData();
                // Try saving compressed version
                try {
                    const compressedData = this.compressBehaviorData(data, true);
                    localStorage.setItem(this.behaviorDataKey, JSON.stringify({
                        version: this.dataVersion,
                        timestamp: Date.now(),
                        data: compressedData
                    }));
                    return true;
                } catch (retryError) {
                    console.error('Failed to save behavior data even after cleanup:', retryError);
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * Load AI behavior data with validation and decompression
     * @returns {Object|null} - Behavior data or null if not found/invalid
     */
    loadBehaviorData() {
        try {
            const serializedData = localStorage.getItem(this.behaviorDataKey);
            if (!serializedData) {
                return null;
            }

            const parsedData = JSON.parse(serializedData);
            
            // Handle legacy data without metadata
            if (!parsedData.version) {
                console.warn('Loading legacy behavior data without version info');
                return this.validateBehaviorData(parsedData) ? parsedData : null;
            }

            // Validate version compatibility
            if (parsedData.version !== this.dataVersion) {
                console.warn(`Behavior data version mismatch: ${parsedData.version} vs ${this.dataVersion}`);
            }

            // Decompress and validate the actual data
            const behaviorData = this.decompressBehaviorData(parsedData.data);
            return this.validateBehaviorData(behaviorData) ? behaviorData : null;
        } catch (error) {
            console.error('Failed to load behavior data:', error);
            
            // If data is corrupted, clear it to prevent future issues
            if (error instanceof SyntaxError) {
                console.warn('Corrupted behavior data detected, clearing storage');
                localStorage.removeItem(this.behaviorDataKey);
            }
            return null;
        }
    }

    /**
     * Clear all stored data
     * @returns {boolean} - Success status
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.gameDataKey);
            localStorage.removeItem(this.highScoreKey);
            localStorage.removeItem(this.behaviorDataKey);
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Object} - Storage usage information
     */
    getStorageInfo() {
        try {
            const gameDataSize = this.getItemSize(this.gameDataKey);
            const highScoreSize = this.getItemSize(this.highScoreKey);
            const behaviorDataSize = this.getItemSize(this.behaviorDataKey);
            
            return {
                gameDataSize,
                highScoreSize,
                behaviorDataSize,
                totalSize: gameDataSize + highScoreSize + behaviorDataSize,
                isAvailable: this.isStorageAvailable()
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return {
                gameDataSize: 0,
                highScoreSize: 0,
                behaviorDataSize: 0,
                totalSize: 0,
                isAvailable: false
            };
        }
    }

    // Private helper methods

    /**
     * Check if localStorage is available and functional
     * @returns {boolean} - Storage availability status
     */
    isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the size of a stored item in bytes
     * @param {string} key - Storage key
     * @returns {number} - Size in bytes
     */
    getItemSize(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? new Blob([item]).size : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Clean up old or unnecessary data to free storage space
     */
    cleanupOldData() {
        try {
            // Remove any old temporary keys that might exist
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('aiSnakeGame_temp_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleaned up ${keysToRemove.length} temporary storage items`);
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
        }
    }

    /**
     * Validate game data structure
     * @param {Object} data - Game data to validate
     * @returns {boolean} - Validation result
     */
    validateGameData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check for required game state properties
        const requiredProps = ['snake', 'food', 'score', 'gameStatus'];
        for (const prop of requiredProps) {
            if (!(prop in data)) {
                console.warn(`Missing required game data property: ${prop}`);
                return false;
            }
        }

        // Validate snake data
        if (!data.snake || !Array.isArray(data.snake.segments) || data.snake.segments.length === 0) {
            console.warn('Invalid snake data structure');
            return false;
        }

        // Validate food data
        if (!data.food || typeof data.food.position !== 'object') {
            console.warn('Invalid food data structure');
            return false;
        }

        // Validate score data
        if (!data.score || typeof data.score.current !== 'number' || typeof data.score.high !== 'number') {
            console.warn('Invalid score data structure');
            return false;
        }

        return true;
    }

    /**
     * Validate AI behavior data structure
     * @param {Object} data - Behavior data to validate
     * @returns {boolean} - Validation result
     */
    validateBehaviorData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check for required behavior data properties
        const requiredProps = ['movementHeatmap', 'performanceMetrics', 'adaptationSettings'];
        for (const prop of requiredProps) {
            if (!(prop in data)) {
                console.warn(`Missing required behavior data property: ${prop}`);
                return false;
            }
        }

        // Validate heatmap structure
        if (!Array.isArray(data.movementHeatmap)) {
            console.warn('Invalid heatmap data structure');
            return false;
        }

        // Validate performance metrics
        if (!data.performanceMetrics || typeof data.performanceMetrics !== 'object') {
            console.warn('Invalid performance metrics structure');
            return false;
        }

        // Validate adaptation settings
        if (!data.adaptationSettings || typeof data.adaptationSettings !== 'object') {
            console.warn('Invalid adaptation settings structure');
            return false;
        }

        return true;
    }

    /**
     * Compress behavior data to reduce storage size
     * @param {Object} data - Behavior data to compress
     * @param {boolean} aggressive - Use aggressive compression
     * @returns {Object} - Compressed data
     */
    compressBehaviorData(data, aggressive = false) {
        const compressed = { ...data };

        // Compress heatmap by removing zero values and using sparse representation
        if (data.movementHeatmap && Array.isArray(data.movementHeatmap)) {
            const sparseHeatmap = [];
            for (let y = 0; y < data.movementHeatmap.length; y++) {
                for (let x = 0; x < data.movementHeatmap[y].length; x++) {
                    const value = data.movementHeatmap[y][x];
                    if (value > 0) {
                        sparseHeatmap.push({ x, y, value });
                    }
                }
            }
            compressed.movementHeatmap = {
                sparse: sparseHeatmap,
                dimensions: {
                    width: data.movementHeatmap[0]?.length || 0,
                    height: data.movementHeatmap.length
                }
            };
        }

        // If aggressive compression, limit recent scores to last 3 instead of 5
        if (aggressive && data.performanceMetrics && data.performanceMetrics.recentScores) {
            compressed.performanceMetrics = { ...data.performanceMetrics };
            compressed.performanceMetrics.recentScores = data.performanceMetrics.recentScores.slice(-3);
        }

        return compressed;
    }

    /**
     * Decompress behavior data from storage
     * @param {Object} data - Compressed behavior data
     * @returns {Object} - Decompressed data
     */
    decompressBehaviorData(data) {
        const decompressed = { ...data };

        // Decompress sparse heatmap back to 2D array
        if (data.movementHeatmap && data.movementHeatmap.sparse) {
            const { sparse, dimensions } = data.movementHeatmap;
            const heatmap = [];
            
            // Initialize empty heatmap
            for (let y = 0; y < dimensions.height; y++) {
                heatmap[y] = new Array(dimensions.width).fill(0);
            }
            
            // Fill in non-zero values
            sparse.forEach(({ x, y, value }) => {
                if (y < dimensions.height && x < dimensions.width) {
                    heatmap[y][x] = value;
                }
            });
            
            decompressed.movementHeatmap = heatmap;
        }

        return decompressed;
    }
}