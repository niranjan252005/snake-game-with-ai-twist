// Snake class - Manages snake entity state and movement logic
export class Snake {
    constructor(gridSize, canvasWidth, canvasHeight) {
        this.gridSize = gridSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Initialize snake in center of grid
        const centerX = Math.floor((canvasWidth / gridSize) / 2) * gridSize;
        const centerY = Math.floor((canvasHeight / gridSize) / 2) * gridSize;
        
        this.segments = [
            { x: centerX, y: centerY },
            { x: centerX - gridSize, y: centerY },
            { x: centerX - (2 * gridSize), y: centerY }
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    move(direction) {
        // Update direction if a new direction was set
        if (direction) {
            this.setDirection(direction);
        }
        this.direction = this.nextDirection;

        // Calculate new head position based on current direction
        const head = { ...this.segments[0] };
        
        switch (this.direction) {
            case 'up':
                head.y -= this.gridSize;
                break;
            case 'down':
                head.y += this.gridSize;
                break;
            case 'left':
                head.x -= this.gridSize;
                break;
            case 'right':
                head.x += this.gridSize;
                break;
        }

        // Add new head to front of segments
        this.segments.unshift(head);
        
        // Remove tail (will be added back if growing)
        this.segments.pop();
    }

    grow() {
        // Add a new segment at the tail position
        // The tail was removed in the last move(), so we need to add it back
        const tail = this.segments[this.segments.length - 1];
        const secondToLast = this.segments[this.segments.length - 2];
        
        // Calculate where the new tail segment should be
        let newTail = { ...tail };
        
        if (secondToLast) {
            // Place new tail in opposite direction from the last segment's movement
            const deltaX = tail.x - secondToLast.x;
            const deltaY = tail.y - secondToLast.y;
            
            newTail.x = tail.x + deltaX;
            newTail.y = tail.y + deltaY;
        }
        
        this.segments.push(newTail);
    }

    checkCollision() {
        const head = this.segments[0];
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.canvasWidth || 
            head.y < 0 || head.y >= this.canvasHeight) {
            return true;
        }
        
        // Check self collision (head with body segments)
        for (let i = 1; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
                return true;
            }
        }
        
        return false;
    }

    getPosition() {
        return this.segments[0]; // Head position
    }

    getSegments() {
        return [...this.segments]; // Return copy of segments
    }

    setDirection(newDirection) {
        // Prevent reversing into self
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }
}