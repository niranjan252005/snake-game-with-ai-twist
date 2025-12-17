// Renderer class - Handles all visual output and animations
export class Renderer {
    constructor(ctx, canvasWidth, canvasHeight, gridSize) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.gridSize = gridSize;
        
        // Visual effect parameters
        this.intensityLevel = 1;
        this.dangerLevel = 0;
    }

    drawSnake(snake, intensity = 1) {
        const segments = snake.getSegments();
        
        // Calculate visual effects based on intensity and danger level
        const effectiveIntensity = Math.max(1, Math.min(10, intensity));
        const glowIntensity = (effectiveIntensity - 1) / 9; // Normalize to 0-1
        
        segments.forEach((segment, index) => {
            const isHead = index === 0;
            
            // Base colors
            let baseColor = isHead ? [0, 255, 0] : [0, 136, 0]; // Green head, darker green body
            
            // Apply danger effects (red tint when in danger)
            if (this.dangerLevel > 0 && isHead) {
                const redTint = this.dangerLevel * 255;
                baseColor[0] = Math.min(255, baseColor[0] + redTint);
                baseColor[1] = Math.max(0, baseColor[1] - redTint * 0.5);
            }
            
            // Apply intensity effects (brighter colors at higher intensity)
            const intensityMultiplier = 1 + (glowIntensity * 0.3);
            baseColor = baseColor.map(c => Math.min(255, c * intensityMultiplier));
            
            // Draw segment with potential glow effect
            if (glowIntensity > 0.3 || this.dangerLevel > 0.5) {
                // Add glow effect for high intensity or danger
                const glowSize = 2 + (glowIntensity * 4);
                const glowAlpha = 0.3 + (glowIntensity * 0.4);
                
                this.ctx.shadowColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${glowAlpha})`;
                this.ctx.shadowBlur = glowSize;
            } else {
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.fillStyle = `rgb(${Math.floor(baseColor[0])}, ${Math.floor(baseColor[1])}, ${Math.floor(baseColor[2])})`;
            this.ctx.fillRect(segment.x, segment.y, this.gridSize, this.gridSize);
            
            // Add border for better visibility
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(segment.x, segment.y, this.gridSize, this.gridSize);
        });
        
        // Reset shadow effects
        this.ctx.shadowBlur = 0;
    }

    drawFood(food) {
        const position = food.getPosition();
        if (!position) return;
        
        // Animate food with pulsing effect
        const time = Date.now() * 0.005;
        const pulseScale = 0.9 + Math.sin(time) * 0.1;
        const pulseAlpha = 0.8 + Math.sin(time * 1.5) * 0.2;
        
        // Calculate food size with pulse effect
        const foodSize = this.gridSize * pulseScale;
        const offset = (this.gridSize - foodSize) / 2;
        
        // Draw food with glow effect
        this.ctx.shadowColor = `rgba(255, 0, 0, ${pulseAlpha * 0.6})`;
        this.ctx.shadowBlur = 8;
        
        // Main food body
        this.ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
        this.ctx.fillRect(
            position.x + offset, 
            position.y + offset, 
            foodSize, 
            foodSize
        );
        
        // Add highlight for 3D effect
        this.ctx.fillStyle = `rgba(255, 100, 100, ${pulseAlpha * 0.7})`;
        this.ctx.fillRect(
            position.x + offset + 2, 
            position.y + offset + 2, 
            foodSize * 0.6, 
            foodSize * 0.6
        );
        
        // Reset shadow effects
        this.ctx.shadowBlur = 0;
    }

    drawBackground(intensity = 1) {
        // Normalize intensity to 1-10 range
        const effectiveIntensity = Math.max(1, Math.min(10, intensity));
        
        // Calculate background colors based on intensity
        // Low intensity: dark blue/black
        // Medium intensity: purple/dark red
        // High intensity: bright red/orange
        
        let r, g, b;
        
        if (effectiveIntensity <= 3) {
            // Low intensity: dark blue to purple
            const factor = (effectiveIntensity - 1) / 2; // 0 to 1
            r = Math.floor(factor * 30);
            g = 0;
            b = Math.floor(20 + factor * 40);
        } else if (effectiveIntensity <= 7) {
            // Medium intensity: purple to red
            const factor = (effectiveIntensity - 3) / 4; // 0 to 1
            r = Math.floor(30 + factor * 80);
            g = 0;
            b = Math.floor(60 - factor * 40);
        } else {
            // High intensity: red to orange/yellow
            const factor = (effectiveIntensity - 7) / 3; // 0 to 1
            r = Math.floor(110 + factor * 60);
            g = Math.floor(factor * 40);
            b = Math.floor(20 - factor * 20);
        }
        
        // Add subtle animated effect for high intensity
        if (effectiveIntensity > 6) {
            const time = Date.now() * 0.003;
            const flicker = Math.sin(time) * 0.1 + 0.9;
            r = Math.floor(r * flicker);
            g = Math.floor(g * flicker);
            b = Math.floor(b * flicker);
        }
        
        // Fill background
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Add grid pattern for better visibility at low intensity
        if (effectiveIntensity <= 4) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + effectiveIntensity * 0.02})`;
            this.ctx.lineWidth = 1;
            
            // Draw vertical lines
            for (let x = 0; x <= this.canvasWidth; x += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvasHeight);
                this.ctx.stroke();
            }
            
            // Draw horizontal lines
            for (let y = 0; y <= this.canvasHeight; y += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvasWidth, y);
                this.ctx.stroke();
            }
        }
    }

    drawHUD(score, highScore, difficulty) {
        // Update HTML elements for score display
        const currentScoreElement = document.getElementById('currentScore');
        const highScoreElement = document.getElementById('highScore');
        const difficultyElement = document.getElementById('difficultyLevel');
        
        if (currentScoreElement) {
            currentScoreElement.textContent = score.toString();
        }
        
        if (highScoreElement) {
            highScoreElement.textContent = highScore.toString();
        }
        
        if (difficultyElement) {
            difficultyElement.textContent = difficulty.toString();
        }
        
        // Optional: Add canvas-based HUD elements for additional visual feedback
        // This could include difficulty indicators, AI status, etc.
        if (difficulty > 5) {
            // Draw difficulty warning indicator on canvas
            this.ctx.fillStyle = `rgba(255, 165, 0, ${0.3 + (difficulty - 5) * 0.1})`;
            this.ctx.fillRect(this.canvasWidth - 60, 10, 50, 20);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Courier New';
            this.ctx.fillText('HIGH', this.canvasWidth - 55, 24);
        }
        
        // Draw AI activity indicator
        const time = Date.now() * 0.01;
        const aiAlpha = 0.3 + Math.sin(time) * 0.2;
        this.ctx.fillStyle = `rgba(0, 255, 255, ${aiAlpha})`;
        this.ctx.fillRect(10, 10, 8, 8);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '10px Courier New';
        this.ctx.fillText('AI', 22, 19);
    }

    setIntensityLevel(level) {
        this.intensityLevel = Math.max(1, Math.min(10, level));
    }

    setDangerLevel(level) {
        this.dangerLevel = Math.max(0, Math.min(1, level));
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}