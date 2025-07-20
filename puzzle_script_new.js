"use strict";

let puzzle, gameState = 0;
const events = [];

// 工具函數
function randomInt(min, max) {
    if (typeof max == "undefined") {
        max = min;
        min = 0;
    }
    return Math.floor(min + (max - min) * Math.random());
}

function arrayShuffle(array) {
    let k1, temp;
    for (let k = array.length - 1; k >= 1; --k) {
        k1 = randomInt(0, k + 1);
        temp = array[k];
        array[k] = array[k1];
        array[k1] = temp;
    }
    return array;
}

// 拼圖片類別
class PuzzlePiece {
    constructor(id, row, col, totalRows, totalCols, imageUrl = 'baby1.jpg') {
        this.id = id;
        this.row = row;
        this.col = col;
        this.totalRows = totalRows;
        this.totalCols = totalCols;
        this.imageUrl = imageUrl;
        this.element = null;
        this.x = 0;
        this.y = 0;
        this.placed = false;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'puzzle-piece';
        this.element.setAttribute('data-piece', this.id);
        
        // 設定背景圖片
        this.element.style.backgroundImage = `url("${this.imageUrl}")`;
        this.element.style.backgroundRepeat = 'no-repeat';
        
        // 設定背景位置
        const pieceWidth = 100;
        const pieceHeight = 100;
        const bgWidth = this.totalCols * pieceWidth;
        const bgHeight = this.totalRows * pieceHeight;
        
        this.element.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
        this.element.style.backgroundPosition = 
            `-${this.col * pieceWidth}px -${this.row * pieceHeight}px`;
        
        // 隨機初始位置
        this.setRandomPosition();
        
        // 添加事件監聽器
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    }

    updateImage(imageUrl) {
        this.imageUrl = imageUrl;
        this.element.style.backgroundImage = `url("${imageUrl}")`;
    }

    setRandomPosition() {
        const container = puzzle.container;
        const containerRect = container.getBoundingClientRect();
        
        this.x = Math.random() * (containerRect.width - 100);
        this.y = Math.random() * (containerRect.height - 100);
        
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }

    handleMouseDown(e) {
        e.preventDefault();
        puzzle.startDrag(this, e.clientX, e.clientY);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        puzzle.startDrag(this, touch.clientX, touch.clientY);
    }

    moveTo(x, y, animate = false) {
        this.x = x;
        this.y = y;
        
        if (animate) {
            this.element.classList.add('moving');
            setTimeout(() => {
                this.element.classList.remove('moving');
            }, 500);
        }
        
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
    }

    snapToGrid() {
        const gridSize = 100;
        const tolerance = 30;
        
        // 計算目標網格位置
        const targetX = this.col * gridSize;
        const targetY = this.row * gridSize;
        
        // 檢查是否接近正確位置
        if (Math.abs(this.x - targetX) < tolerance && 
            Math.abs(this.y - targetY) < tolerance) {
            this.moveTo(targetX, targetY, true);
            this.placed = true;
            this.element.classList.add('placed');
            puzzle.moves++;
            puzzle.updateUI();
            puzzle.checkCompletion();
            return true;
        }
        return false;
    }
}

// 主拼圖類別
class Puzzle {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.pieces = [];
        this.draggedPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.rows = 4;
        this.cols = 3;
        this.totalPieces = this.rows * this.cols;
        this.currentImage = 'baby1.jpg';
        
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.createPieces();
        this.shufflePieces();
        this.startTimer();
        this.updateUI();
        
        // 添加全局事件監聽器
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    createPieces() {
        this.pieces = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const id = row * this.cols + col;
                const piece = new PuzzlePiece(id, row, col, this.rows, this.cols, this.currentImage);
                this.pieces.push(piece);
                this.container.appendChild(piece.element);
            }
        }
    }

    updateAllPiecesImage(imageUrl) {
        this.currentImage = imageUrl;
        this.pieces.forEach(piece => {
            piece.updateImage(imageUrl);
        });
        // 同時更新完整圖片
        document.getElementById('complete-image').style.backgroundImage = `url("${imageUrl}")`;
    }

    shufflePieces() {
        this.pieces.forEach(piece => {
            piece.setRandomPosition();
            piece.placed = false;
            piece.element.classList.remove('placed');
        });
    }

    startDrag(piece, clientX, clientY) {
        this.draggedPiece = piece;
        
        const rect = piece.element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
        
        piece.element.classList.add('dragging');
        piece.element.style.zIndex = '1000';
    }

    handleMouseMove(e) {
        if (!this.draggedPiece) return;
        e.preventDefault();
        this.updateDragPosition(e.clientX, e.clientY);
    }

    handleTouchMove(e) {
        if (!this.draggedPiece) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDragPosition(touch.clientX, touch.clientY);
    }

    updateDragPosition(clientX, clientY) {
        const containerRect = this.container.getBoundingClientRect();
        
        const newX = clientX - containerRect.left - this.dragOffset.x;
        const newY = clientY - containerRect.top - this.dragOffset.y;
        
        this.draggedPiece.moveTo(newX, newY);
    }

    handleMouseUp(e) {
        this.endDrag();
    }

    handleTouchEnd(e) {
        this.endDrag();
    }

    endDrag() {
        if (!this.draggedPiece) return;
        
        this.draggedPiece.element.classList.remove('dragging');
        this.draggedPiece.element.style.zIndex = '';
        
        // 嘗試吸附到網格
        this.draggedPiece.snapToGrid();
        
        this.draggedPiece = null;
    }

    checkCompletion() {
        const placedPieces = this.pieces.filter(piece => piece.placed);
        if (placedPieces.length === this.totalPieces) {
            this.gameComplete();
        }
    }

    gameComplete() {
        this.stopTimer();
        this.showCompletionModal();
        this.createFireworks();
    }

    showCompletionModal() {
        const modal = document.getElementById('completion-modal');
        const finalTime = document.getElementById('final-time');
        const finalMoves = document.getElementById('final-moves');
        const completeImage = document.getElementById('complete-image');
        
        finalTime.textContent = document.getElementById('timer').textContent;
        finalMoves.textContent = this.moves;
        
        completeImage.classList.add('show');
        modal.style.display = 'flex';
    }

    createFireworks() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight * 0.6;
                
                for (let j = 0; j < 12; j++) {
                    const firework = document.createElement('div');
                    firework.className = 'firework';
                    firework.style.position = 'fixed';
                    firework.style.left = x + 'px';
                    firework.style.top = y + 'px';
                    firework.style.width = '4px';
                    firework.style.height = '4px';
                    firework.style.borderRadius = '50%';
                    firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    firework.style.pointerEvents = 'none';
                    firework.style.zIndex = '9999';
                    firework.style.animation = 'fireworkExplode 1.5s ease-out forwards';
                    
                    document.body.appendChild(firework);
                    
                    setTimeout(() => {
                        firework.remove();
                    }, 2000);
                }
            }, i * 300);
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateUI() {
        document.getElementById('moves').textContent = this.moves;
    }

    reset() {
        this.moves = 0;
        this.stopTimer();
        this.shufflePieces();
        this.startTimer();
        this.updateUI();
        
        const modal = document.getElementById('completion-modal');
        const completeImage = document.getElementById('complete-image');
        modal.style.display = 'none';
        completeImage.classList.remove('show');
    }

    changeDifficulty(newPieceCount) {
        // 根據片數調整行列
        if (newPieceCount === 12) {
            this.rows = 4;
            this.cols = 3;
        } else if (newPieceCount === 20) {
            this.rows = 5;
            this.cols = 4;
        } else if (newPieceCount === 30) {
            this.rows = 6;
            this.cols = 5;
        }
        
        this.totalPieces = this.rows * this.cols;
        this.init();
    }
}

// 選單系統
const menu = (function() {
    const menuItems = document.querySelectorAll('#menu li');
    let isOpen = false;
    
    // 初始化選單
    function init() {
        hideMenu();
        
        // 選單按鈕
        menuItems[0].addEventListener('click', toggleMenu);
        
        // 重新開始
        menuItems[1].addEventListener('click', () => {
            puzzle.reset();
            hideMenu();
        });
        
        // 載入圖片
        menuItems[2].addEventListener('click', loadImage);
        
        // 難度選擇
        const difficultySelect = document.getElementById('difficulty');
        difficultySelect.addEventListener('change', (e) => {
            puzzle.changeDifficulty(parseInt(e.target.value));
            hideMenu();
        });
        
        // 提示
        menuItems[6].addEventListener('click', () => {
            showHint();
            hideMenu();
        });
    }
    
    function toggleMenu() {
        if (isOpen) hideMenu();
        else showMenu();
    }
    
    function showMenu() {
        menuItems.forEach((item, index) => {
            if (index > 0) item.style.display = 'block';
        });
        isOpen = true;
    }
    
    function hideMenu() {
        menuItems.forEach((item, index) => {
            if (index > 0) item.style.display = 'none';
        });
        isOpen = false;
    }
    
    function loadImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // 使用新的方法更新所有拼圖片
                    puzzle.updateAllPiecesImage(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
        hideMenu();
    }
    
    function showHint() {
        // 找到下一個未放置的拼圖片
        const unplacedPiece = puzzle.pieces.find(piece => !piece.placed);
        if (unplacedPiece) {
            unplacedPiece.element.style.animation = 'hint 2s ease infinite';
            setTimeout(() => {
                unplacedPiece.element.style.animation = '';
            }, 4000);
        }
    }
    
    return { init };
})();

// 初始化遊戲
function initGame() {
    puzzle = new Puzzle('puzzleContainer');
    menu.init();
    
    // 確保使用 baby1.jpg 作為初始圖片
    puzzle.updateAllPiecesImage('baby1.jpg');
    
    // 完成模態框的再玩一次按鈕
    document.getElementById('play-again-btn').addEventListener('click', () => {
        puzzle.reset();
    });
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', initGame);

// 視窗大小改變時重新調整
window.addEventListener('resize', () => {
    if (puzzle) {
        puzzle.pieces.forEach(piece => {
            if (!piece.placed) {
                piece.setRandomPosition();
            }
        });
    }
});