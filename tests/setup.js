// Jest setup file for AI-Adaptive Snake Game tests

// Mock canvas and 2D context for testing
class MockCanvasRenderingContext2D {
    constructor() {
        this.fillStyle = '#000000';
        this.strokeStyle = '#000000';
        this.lineWidth = 1;
        this.shadowBlur = 0;
        this.shadowColor = 'transparent';
        this.font = '10px sans-serif';
    }

    fillRect() {}
    strokeRect() {}
    clearRect() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    stroke() {}
    fill() {}
    arc() {}
    closePath() {}
    save() {}
    restore() {}
    translate() {}
    rotate() {}
    scale() {}
    setTransform() {}
    drawImage() {}
    createImageData() {}
    getImageData() {}
    putImageData() {}
    fillText() {}
    strokeText() {}
    measureText() {
        return { width: 0 };
    }
}

class MockHTMLCanvasElement {
    constructor() {
        this.width = 600;
        this.height = 600;
    }

    getContext(contextType) {
        if (contextType === '2d') {
            return new MockCanvasRenderingContext2D();
        }
        return null;
    }

    toDataURL() {
        return 'data:image/png;base64,';
    }
}

// Mock DOM elements
global.HTMLCanvasElement = MockHTMLCanvasElement;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn((id) => {
    clearTimeout(id);
});

// Mock performance.now()
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock document methods
global.document = {
    getElementById: jest.fn(() => ({
        addEventListener: jest.fn(),
        style: {},
        textContent: ''
    })),
    addEventListener: jest.fn(),
    createElement: jest.fn(() => new MockHTMLCanvasElement())
};

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
});