// AI Engine - Analyzes player behavior and adapts game parameters
export class AIEngine {
    constructor(gridSize, canvasWidth, canvasHeight) {
        this.gridSize = gridSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Movement tracking
        this.movementHistory = [];
        this.maxHistorySize = 1000;
        
        // Heatmap data
        this.gridWidth = Math.floor(canvasWidth / gridSize);
        this.gridHeight = Math.floor(canvasHeight / gridSize);
        this.movementHeatmap = this.initializeHeatmap();
        
        // Performance metrics
        this.performanceMetrics = {
            averageScore: 0,
            averageGameDuration: 0,
            recentScores: [],
            difficultyProgression: [1],
            gameStartTime: null,
            totalGamesPlayed: 0,
            consecutiveHighPerformance: 0,
            consecutiveLowPerformance: 0
        };
        
        // Adaptation settings
        this.adaptationSettings = {
            currentDifficulty: 1,
            foodPlacementStrategy: 'random',
            visualIntensityLevel: 1
        };
    }

    initializeHeatmap() {
        const heatmap = [];
        for (let y = 0; y < this.gridHeight; y++) {
            heatmap[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                heatmap[y][x] = 0;
            }
        }
        return heatmap;
    }

    recordMovement(position, direction, gameContext = {}) {
        // Create movement record with timestamp and context
        const movementRecord = {
            timestamp: Date.now(),
            position: { ...position },
            direction: direction,
            gameContext: {
                score: gameContext.score || 0,
                snakeLength: gameContext.snakeLength || 1,
                foodDistance: gameContext.foodDistance || 0
            }
        };
        
        // Add to movement history
        this.movementHistory.push(movementRecord);
        
        // Maintain history size limit
        if (this.movementHistory.length > this.maxHistorySize) {
            this.movementHistory.shift();
        }
        
        // Update heatmap with new movement
        this.updateHeatmapCell(position);
        
        // Update visual intensity based on recent movement patterns
        this.updateVisualIntensityFromMovement();
    }

    generateHeatmap() {
        // Return a copy of the current heatmap with normalized values
        const normalizedHeatmap = [];
        
        // Find the maximum value in the heatmap for normalization
        let maxValue = 0;
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                maxValue = Math.max(maxValue, this.movementHeatmap[y][x]);
            }
        }
        
        // Create normalized copy (values between 0 and 1)
        for (let y = 0; y < this.gridHeight; y++) {
            normalizedHeatmap[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                if (maxValue > 0) {
                    normalizedHeatmap[y][x] = this.movementHeatmap[y][x] / maxValue;
                } else {
                    normalizedHeatmap[y][x] = 0;
                }
            }
        }
        
        return normalizedHeatmap;
    }
    
    getRawHeatmap() {
        // Return a deep copy of the raw heatmap data
        return this.movementHeatmap.map(row => [...row]);
    }
    
    getHeatmapStatistics() {
        let totalMoves = 0;
        let maxValue = 0;
        let minValue = Infinity;
        let nonZeroCells = 0;
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const value = this.movementHeatmap[y][x];
                totalMoves += value;
                maxValue = Math.max(maxValue, value);
                if (value > 0) {
                    minValue = Math.min(minValue, value);
                    nonZeroCells++;
                }
            }
        }
        
        const totalCells = this.gridWidth * this.gridHeight;
        const coverage = nonZeroCells / totalCells;
        const averageValue = nonZeroCells > 0 ? totalMoves / nonZeroCells : 0;
        
        return {
            totalMoves,
            maxValue,
            minValue: minValue === Infinity ? 0 : minValue,
            averageValue,
            coverage,
            nonZeroCells,
            totalCells
        };
    }
    
    resetHeatmap() {
        this.movementHeatmap = this.initializeHeatmap();
    }
    
    getHotspots(threshold = 0.7) {
        // Find cells with high movement frequency (hotspots)
        const normalizedHeatmap = this.generateHeatmap();
        const hotspots = [];
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (normalizedHeatmap[y][x] >= threshold) {
                    hotspots.push({
                        x: x * this.gridSize,
                        y: y * this.gridSize,
                        gridX: x,
                        gridY: y,
                        intensity: normalizedHeatmap[y][x],
                        rawCount: this.movementHeatmap[y][x]
                    });
                }
            }
        }
        
        // Sort by intensity (highest first)
        return hotspots.sort((a, b) => b.intensity - a.intensity);
    }
    
    getColdspots(threshold = 0.1) {
        // Find cells with low movement frequency (coldspots)
        const normalizedHeatmap = this.generateHeatmap();
        const coldspots = [];
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (normalizedHeatmap[y][x] <= threshold) {
                    coldspots.push({
                        x: x * this.gridSize,
                        y: y * this.gridSize,
                        gridX: x,
                        gridY: y,
                        intensity: normalizedHeatmap[y][x],
                        rawCount: this.movementHeatmap[y][x]
                    });
                }
            }
        }
        
        // Sort by intensity (lowest first)
        return coldspots.sort((a, b) => a.intensity - b.intensity);
    }

    calculateDifficulty() {
        // If insufficient data, maintain current difficulty
        if (this.performanceMetrics.recentScores.length < 3) {
            return this.adaptationSettings.currentDifficulty;
        }
        
        const recentScores = this.performanceMetrics.recentScores;
        const currentDifficulty = this.adaptationSettings.currentDifficulty;
        
        // Calculate performance indicators
        const averageRecentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
        const scoreThreshold = Math.max(50, this.performanceMetrics.averageScore * 0.8);
        
        // Determine if player is consistently performing well or poorly
        const highPerformanceThreshold = scoreThreshold * 1.5;
        const lowPerformanceThreshold = scoreThreshold * 0.5;
        
        let newDifficulty = currentDifficulty;
        
        // Check for consistent high performance
        if (averageRecentScore >= highPerformanceThreshold) {
            this.performanceMetrics.consecutiveHighPerformance++;
            this.performanceMetrics.consecutiveLowPerformance = 0;
            
            // Increase difficulty after 3 consecutive high-performance games
            if (this.performanceMetrics.consecutiveHighPerformance >= 3 && currentDifficulty < 10) {
                newDifficulty = Math.min(10, currentDifficulty + 1);
                this.performanceMetrics.consecutiveHighPerformance = 0; // Reset counter
            }
        }
        // Check for consistent low performance
        else if (averageRecentScore <= lowPerformanceThreshold) {
            this.performanceMetrics.consecutiveLowPerformance++;
            this.performanceMetrics.consecutiveHighPerformance = 0;
            
            // Decrease difficulty after 3 consecutive low-performance games
            if (this.performanceMetrics.consecutiveLowPerformance >= 3 && currentDifficulty > 1) {
                newDifficulty = Math.max(1, currentDifficulty - 1);
                this.performanceMetrics.consecutiveLowPerformance = 0; // Reset counter
            }
        }
        // Reset counters for moderate performance
        else {
            this.performanceMetrics.consecutiveHighPerformance = 0;
            this.performanceMetrics.consecutiveLowPerformance = 0;
        }
        
        // Update difficulty if it changed
        if (newDifficulty !== currentDifficulty) {
            this.adaptationSettings.currentDifficulty = newDifficulty;
            this.performanceMetrics.difficultyProgression.push(newDifficulty);
            
            // Update visual intensity when difficulty changes
            this.updateVisualIntensityFromDifficulty();
        }
        
        return this.adaptationSettings.currentDifficulty;
    }

    suggestFoodPlacement(excludePositions = []) {
        // Determine placement strategy based on movement patterns and difficulty
        const strategy = this.determinePlacementStrategy();
        
        switch (strategy) {
            case 'challenging':
                return this.getChallengingFoodPosition(excludePositions);
            case 'accessible':
                return this.getAccessibleFoodPosition(excludePositions);
            default:
                return this.getRandomFoodPosition(excludePositions);
        }
    }
    
    determinePlacementStrategy() {
        const movementAnalysis = this.analyzeMovementPatterns();
        const currentDifficulty = this.adaptationSettings.currentDifficulty;
        
        // If insufficient data, use strategy based on difficulty
        if (movementAnalysis.totalMovements < 20) {
            return this.getStrategyByDifficulty(currentDifficulty);
        }
        
        // Combine movement analysis with difficulty level
        let strategy = 'random';
        
        // Base strategy on movement patterns
        if (movementAnalysis.movementDiversity < 0.6) {
            // Player shows consistent patterns - use challenging placement
            strategy = 'challenging';
        } else if (movementAnalysis.movementDiversity > 0.8) {
            // Player shows varied movement - use accessible placement  
            strategy = 'accessible';
        } else {
            // Moderate diversity - use difficulty-based strategy
            strategy = this.getStrategyByDifficulty(currentDifficulty);
        }
        
        // Modify strategy based on difficulty level
        if (currentDifficulty >= 7) {
            // High difficulty - always use challenging placement
            strategy = 'challenging';
        } else if (currentDifficulty <= 2) {
            // Very low difficulty - soften challenging placement only
            if (strategy === 'challenging') {
                strategy = 'random'; // Soften challenging placement at very low difficulty
            }
        }
        
        this.adaptationSettings.foodPlacementStrategy = strategy;
        return strategy;
    }
    
    getStrategyByDifficulty(difficulty) {
        // Determine food placement strategy based solely on difficulty level
        if (difficulty >= 7) {
            return 'challenging';
        } else if (difficulty <= 3) {
            return 'accessible';
        } else {
            return 'random';
        }
    }
    
    getChallengingFoodPosition(excludePositions = []) {
        // Place food in areas with low movement frequency (coldspots)
        const coldspots = this.getColdspots(0.3);
        
        // Filter out excluded positions
        const validColdspots = coldspots.filter(spot => 
            !excludePositions.some(pos => pos.x === spot.x && pos.y === spot.y)
        );
        
        if (validColdspots.length > 0) {
            // Choose from the coldest spots (first 30% of sorted list)
            const topColdspots = validColdspots.slice(0, Math.max(1, Math.floor(validColdspots.length * 0.3)));
            const randomIndex = Math.floor(Math.random() * topColdspots.length);
            return {
                x: topColdspots[randomIndex].x,
                y: topColdspots[randomIndex].y
            };
        }
        
        // Fallback to random if no valid coldspots
        return this.getRandomFoodPosition(excludePositions);
    }
    
    getAccessibleFoodPosition(excludePositions = []) {
        // Place food in areas with moderate movement frequency
        const normalizedHeatmap = this.generateHeatmap();
        const accessibleSpots = [];
        
        // Find spots with moderate activity (0.2 to 0.6 intensity)
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const intensity = normalizedHeatmap[y][x];
                if (intensity >= 0.2 && intensity <= 0.6) {
                    const position = { x: x * this.gridSize, y: y * this.gridSize };
                    
                    // Check if position is not excluded
                    const isExcluded = excludePositions.some(pos => 
                        pos.x === position.x && pos.y === position.y
                    );
                    
                    if (!isExcluded) {
                        accessibleSpots.push(position);
                    }
                }
            }
        }
        
        if (accessibleSpots.length > 0) {
            const randomIndex = Math.floor(Math.random() * accessibleSpots.length);
            return accessibleSpots[randomIndex];
        }
        
        // Fallback to random if no accessible spots
        return this.getRandomFoodPosition(excludePositions);
    }
    
    getRandomFoodPosition(excludePositions = []) {
        // Generate completely random position avoiding excluded positions
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.gridWidth) * this.gridSize;
            const y = Math.floor(Math.random() * this.gridHeight) * this.gridSize;
            
            const position = { x, y };
            
            // Check if position overlaps with any excluded positions
            const overlaps = excludePositions.some(excludePos => 
                excludePos.x === position.x && excludePos.y === position.y
            );
            
            if (!overlaps) {
                return position;
            }
            
            attempts++;
        }
        
        // Fallback to top-left corner if no valid position found
        return { x: 0, y: 0 };
    }
    
    updateFoodPlacementStrategy(strategy) {
        if (['random', 'challenging', 'accessible'].includes(strategy)) {
            this.adaptationSettings.foodPlacementStrategy = strategy;
        }
    }
    
    getFoodPlacementStrategy() {
        return this.adaptationSettings.foodPlacementStrategy;
    }

    updateVisualIntensity() {
        // Update visual intensity based on both movement patterns and difficulty
        this.updateVisualIntensityFromMovement();
        this.updateVisualIntensityFromDifficulty();
        return this.adaptationSettings.visualIntensityLevel;
    }
    
    updateVisualIntensityFromDifficulty() {
        // Adjust visual intensity based on current difficulty level
        const currentDifficulty = this.adaptationSettings.currentDifficulty;
        const movementBasedIntensity = this.adaptationSettings.visualIntensityLevel;
        
        // Calculate difficulty-based intensity modifier (1-3 scale)
        const difficultyIntensityModifier = Math.ceil(currentDifficulty / 3.33); // Maps 1-10 to 1-3
        
        // Combine movement-based intensity with difficulty modifier
        // Movement intensity: 1-5, Difficulty modifier: 1-3
        const combinedIntensity = Math.min(5, Math.max(1, 
            Math.round((movementBasedIntensity + difficultyIntensityModifier) / 2)
        ));
        
        this.adaptationSettings.visualIntensityLevel = combinedIntensity;
    }
    
    updateVisualIntensityFromMovement() {
        // Calculate visual intensity based on recent movement patterns
        const recentMovements = this.movementHistory.slice(-20); // Last 20 movements
        
        if (recentMovements.length < 5) {
            this.adaptationSettings.visualIntensityLevel = 1;
            return;
        }
        
        // Calculate movement diversity (how varied the directions are)
        const directions = recentMovements.map(m => m.direction);
        const uniqueDirections = new Set(directions);
        const diversityRatio = uniqueDirections.size / 4; // 4 possible directions
        
        // Calculate movement speed (frequency of direction changes)
        let directionChanges = 0;
        for (let i = 1; i < directions.length; i++) {
            if (directions[i] !== directions[i-1]) {
                directionChanges++;
            }
        }
        const changeRatio = directionChanges / (directions.length - 1);
        
        // Combine factors to determine intensity (1-5 scale)
        const intensityScore = (diversityRatio * 2) + (changeRatio * 3);
        this.adaptationSettings.visualIntensityLevel = Math.max(1, Math.min(5, Math.ceil(intensityScore)));
    }
    
    updateHeatmapCell(position) {
        // Convert pixel position to grid coordinates
        const gridX = Math.floor(position.x / this.gridSize);
        const gridY = Math.floor(position.y / this.gridSize);
        
        // Ensure coordinates are within bounds
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            this.movementHeatmap[gridY][gridX]++;
        }
    }
    
    getMovementHistory() {
        return [...this.movementHistory];
    }
    
    analyzeMovementPatterns() {
        if (this.movementHistory.length < 10) {
            return {
                dominantDirections: [],
                averageGameDuration: 0,
                movementDiversity: 0
            };
        }
        
        // Analyze direction preferences
        const directionCounts = { up: 0, down: 0, left: 0, right: 0 };
        this.movementHistory.forEach(record => {
            if (directionCounts.hasOwnProperty(record.direction)) {
                directionCounts[record.direction]++;
            }
        });
        
        // Find dominant directions (above average usage)
        const totalMoves = this.movementHistory.length;
        const averageUsage = totalMoves / 4;
        const dominantDirections = Object.keys(directionCounts)
            .filter(dir => directionCounts[dir] > averageUsage)
            .sort((a, b) => directionCounts[b] - directionCounts[a]);
        
        // Calculate movement diversity
        const uniqueDirections = Object.values(directionCounts).filter(count => count > 0).length;
        const movementDiversity = uniqueDirections / 4;
        
        return {
            dominantDirections,
            directionCounts,
            movementDiversity,
            totalMovements: totalMoves
        };
    }

    loadBehaviorData(data) {
        if (data.movementHeatmap) {
            this.movementHeatmap = data.movementHeatmap;
        }
        if (data.performanceMetrics) {
            this.performanceMetrics = { ...this.performanceMetrics, ...data.performanceMetrics };
        }
        if (data.adaptationSettings) {
            this.adaptationSettings = { ...this.adaptationSettings, ...data.adaptationSettings };
        }
    }

    startGameSession() {
        // Record the start time of a new game session
        this.performanceMetrics.gameStartTime = Date.now();
    }
    
    endGameSession(finalScore) {
        // Calculate game duration
        const gameEndTime = Date.now();
        const gameDuration = this.performanceMetrics.gameStartTime ? 
            gameEndTime - this.performanceMetrics.gameStartTime : 0;
        
        // Update performance metrics
        this.performanceMetrics.totalGamesPlayed++;
        
        // Add score to recent scores (keep last 5 games)
        this.performanceMetrics.recentScores.push(finalScore);
        if (this.performanceMetrics.recentScores.length > 5) {
            this.performanceMetrics.recentScores.shift();
        }
        
        // Update average score
        const allScores = this.performanceMetrics.recentScores;
        this.performanceMetrics.averageScore = allScores.length > 0 ? 
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
        
        // Update average game duration
        if (gameDuration > 0) {
            const currentAvg = this.performanceMetrics.averageGameDuration;
            const totalGames = this.performanceMetrics.totalGamesPlayed;
            
            // Calculate running average
            this.performanceMetrics.averageGameDuration = 
                ((currentAvg * (totalGames - 1)) + gameDuration) / totalGames;
        }
        
        // Reset game start time
        this.performanceMetrics.gameStartTime = null;
        
        // Recalculate difficulty based on new performance data
        this.calculateDifficulty();
    }
    
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    
    getCurrentDifficulty() {
        return this.adaptationSettings.currentDifficulty;
    }
    
    setDifficulty(difficulty) {
        if (difficulty >= 1 && difficulty <= 10) {
            this.adaptationSettings.currentDifficulty = difficulty;
            this.performanceMetrics.difficultyProgression.push(difficulty);
        }
    }

    getBehaviorData() {
        return {
            movementHeatmap: this.movementHeatmap,
            performanceMetrics: this.performanceMetrics,
            adaptationSettings: this.adaptationSettings
        };
    }
}