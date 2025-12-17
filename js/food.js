// Food class - Manages food entity placement and consumption
export class Food {
    constructor(gridSize, canvasWidth, canvasHeight, aiEngine = null) {
        this.gridSize = gridSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.position = null;
        this.type = 'normal';
        this.aiEngine = aiEngine;
    }

    spawn(position, excludePositions = []) {
        // Set food position - either provided position or generate adaptive one
        if (position) {
            this.position = { ...position };
        } else {
            // Use AI engine for adaptive placement if available
            if (this.aiEngine) {
                this.position = this.aiEngine.suggestFoodPlacement(excludePositions);
            } else {
                // Fallback to random position if no AI engine
                this.position = this.generateRandomPosition(excludePositions);
            }
        }
        this.type = 'normal';
    }

    consume() {
        // Handle food consumption - clear position and return consumed food data
        const consumedFood = {
            position: { ...this.position },
            type: this.type
        };
        
        this.position = null;
        this.type = 'normal';
        
        return consumedFood;
    }

    getPosition() {
        return this.position ? { ...this.position } : null;
    }

    generateRandomPosition(excludePositions = []) {
        // Generate random position that doesn't overlap with excluded positions
        const gridWidth = Math.floor(this.canvasWidth / this.gridSize);
        const gridHeight = Math.floor(this.canvasHeight / this.gridSize);
        
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * gridWidth) * this.gridSize;
            const y = Math.floor(Math.random() * gridHeight) * this.gridSize;
            
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
    
    setAIEngine(aiEngine) {
        this.aiEngine = aiEngine;
    }
}