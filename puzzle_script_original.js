"use strict";

let puzzle, autoStart;

const mhypot = Math.hypot,
  mrandom = Math.random,
  mmax = Math.max,
  mmin = Math.min,
  mround = Math.round,
  mfloor = Math.floor,
  msqrt = Math.sqrt,
  mabs = Math.abs;

function isMiniature() {
  return location.pathname.includes("/fullcpgrid/");
}

function alea(min, max) {
  if (typeof max == "undefined") return min * mrandom();
  return min + (max - min) * mrandom();
}

function intAlea(min, max) {
  if (typeof max == "undefined") {
    max = min;
    min = 0;
  }
  return mfloor(min + (max - min) * mrandom());
}

function arrayShuffle(array) {
  let k1, temp;
  for (let k = array.length - 1; k >= 1; --k) {
    k1 = intAlea(0, k + 1);
    temp = array[k];
    array[k] = array[k1];
    array[k1] = temp;
  }
  return array;
}

// Point 類別
class Point {
  constructor(x, y) {
    this.x = Number(x);
    this.y = Number(y);
  }
  copy() {
    return new Point(this.x, this.y);
  }
  distance(otherPoint) {
    return mhypot(this.x - otherPoint.x, this.y - otherPoint.y);
  }
}

// Segment 類別
class Segment {
  constructor(p1, p2) {
    this.p1 = new Point(p1.x, p1.y);
    this.p2 = new Point(p2.x, p2.y);
  }
  dx() {
    return this.p2.x - this.p1.x;
  }
  dy() {
    return this.p2.y - this.p1.y;
  }
  length() {
    return mhypot(this.dx(), this.dy());
  }
  pointOnRelative(coeff) {
    let dx = this.dx();
    let dy = this.dy();
    return new Point(this.p1.x + coeff * dx, this.p1.y + coeff * dy);
  }
}

// Side 類別
class Side {
  constructor() {
    this.segments = [];
  }
  addSegment(p1, p2) {
    this.segments.push(new Segment(p1, p2));
  }
  getPath() {
    if (this.segments.length === 0) return "";
    let path = `M ${this.segments[0].p1.x} ${this.segments[0].p1.y}`;
    for (let segment of this.segments) {
      path += ` L ${segment.p2.x} ${segment.p2.y}`;
    }
    return path;
  }
  getPolygonPoints() {
    if (this.segments.length === 0) return [];
    let points = [this.segments[0].p1];
    for (let segment of this.segments) {
      points.push(segment.p2);
    }
    return points;
  }
}

// 簡化的 Puzzle 類別
class Puzzle {
  constructor(options) {
    this.container = document.getElementById(options.container);
    this.srcImage = new Image();
    this.polyPieces = [];
    this.nbPieces = 12;
    this.nbRows = 4;
    this.nbCols = 3;
    this.draggedPiece = null;
    this.dragOffset = { x: 0, y: 0 };
    this.contWidth = 0;
    this.contHeight = 0;
    this.scalex = 100;
    this.scaley = 100;
    
    this.init();
  }

  init() {
    this.updateContainerSize();
    this.createPieces();
    this.addEventListeners();
  }

  updateContainerSize() {
    const rect = this.container.getBoundingClientRect();
    this.contWidth = rect.width;
    this.contHeight = rect.height;
  }

  createPieces() {
    this.container.innerHTML = "";
    this.polyPieces = [];
    
    for (let kRow = 0; kRow < this.nbRows; kRow++) {
      for (let kCol = 0; kCol < this.nbCols; kCol++) {
        const kPiece = kRow * this.nbCols + kCol;
        const piece = new PolyPiece(kPiece, kRow, kCol, this.nbRows, this.nbCols, this);
        this.polyPieces.push(piece);
        this.container.appendChild(piece.element);
      }
    }
    
    this.optimInitial();
  }

  optimInitial() {
    const menuWidth = window.innerWidth <= 600 ? 70 : 280;
    const menuHeight = window.innerWidth <= 600 ? 70 : 450;
    const menuMargin = 30;
    
    const minx = Math.max(-this.scalex / 2, menuWidth + menuMargin);
    const miny = -this.scaley / 2;
    const maxx = this.contWidth - 1.5 * this.scalex;
    const maxy = this.contHeight - 1.5 * this.scaley;

    for (let kPiece = 0; kPiece < this.polyPieces.length; ++kPiece) {
      let piece = this.polyPieces[kPiece];
      let side = intAlea(4);
      
      const isSmallScreen = window.innerWidth <= 600;
      const menuConflictTop = !isSmallScreen && miny < menuHeight + menuMargin;
      const menuConflictLeft = minx < menuWidth + menuMargin;
      
      switch (side) {
        case 0: // top
          if (menuConflictTop) {
            side = Math.random() > 0.5 ? 1 : 2;
          } else {
            piece.x = alea(minx, maxx);
            piece.y = alea(miny, miny + this.scaley);
            break;
          }
        case 1: // right
          piece.x = alea(maxx, maxx + this.scalex);
          piece.y = alea(miny, maxy);
          break;
        case 2: // bottom
          piece.x = alea(minx, maxx);
          piece.y = alea(maxy, maxy + this.scaley);
          break;
        case 3: // left
          if (menuConflictLeft) {
            side = Math.random() > 0.5 ? 1 : 2;
            if (side === 1) {
              piece.x = alea(maxx, maxx + this.scalex);
              piece.y = alea(miny, maxy);
            } else {
              piece.x = alea(minx, maxx);
              piece.y = alea(maxy, maxy + this.scaley);
            }
          } else {
            piece.x = alea(minx, minx + this.scalex);
            piece.y = alea(miny, maxy);
          }
          break;
      }
      
      piece.updatePosition();
    }
  }

  addEventListeners() {
    this.container.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.container.addEventListener("touchstart", this.handleTouchStart.bind(this));
    
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("touchmove", this.handleTouchMove.bind(this));
    document.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  handleMouseDown(e) {
    const piece = this.getPieceFromElement(e.target);
    if (piece) {
      this.startDrag(piece, e.clientX, e.clientY);
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    const piece = this.getPieceFromElement(e.target);
    if (piece) {
      const touch = e.touches[0];
      this.startDrag(piece, touch.clientX, touch.clientY);
    }
  }

  startDrag(piece, clientX, clientY) {
    this.draggedPiece = piece;
    
    const rect = piece.element.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    this.dragOffset.x = clientX - rect.left;
    this.dragOffset.y = clientY - rect.top;
    
    piece.element.style.zIndex = "1000";
    piece.element.style.cursor = "grabbing";
  }

  handleMouseMove(e) {
    if (this.draggedPiece) {
      this.updateDragPosition(e.clientX, e.clientY);
    }
  }

  handleTouchMove(e) {
    if (this.draggedPiece) {
      e.preventDefault();
      const touch = e.touches[0];
      this.updateDragPosition(touch.clientX, touch.clientY);
    }
  }

  updateDragPosition(clientX, clientY) {
    const containerRect = this.container.getBoundingClientRect();
    
    const newX = clientX - containerRect.left - this.dragOffset.x;
    const newY = clientY - containerRect.top - this.dragOffset.y;
    
    this.draggedPiece.x = newX;
    this.draggedPiece.y = newY;
    this.draggedPiece.updatePosition();
  }

  handleMouseUp(e) {
    this.endDrag();
  }

  handleTouchEnd(e) {
    this.endDrag();
  }

  endDrag() {
    if (this.draggedPiece) {
      this.draggedPiece.element.style.zIndex = "";
      this.draggedPiece.element.style.cursor = "grab";
      
      this.draggedPiece.checkPlacement();
      this.checkCompletion();
      
      this.draggedPiece = null;
    }
  }

  getPieceFromElement(element) {
    return this.polyPieces.find(piece => piece.element === element);
  }

  checkCompletion() {
    const placedPieces = this.polyPieces.filter(piece => piece.placed);
    if (placedPieces.length === this.polyPieces.length) {
      this.gameComplete();
    }
  }

  gameComplete() {
    // 創建完整圖片
    const tmpImage = document.createElement('img');
    tmpImage.src = this.srcImage.src;
    tmpImage.style.position = 'absolute';
    tmpImage.style.width = '300px';
    tmpImage.style.height = '400px';
    tmpImage.style.left = '50%';
    tmpImage.style.top = '50%';
    tmpImage.style.transform = 'translate(-50%, -50%)';
    tmpImage.style.borderRadius = '15px';
    tmpImage.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    tmpImage.style.border = '3px solid #4CAF50';
    tmpImage.style.zIndex = '2000';
    
    tmpImage.classList.add("moving");
    this.container.appendChild(tmpImage);

    // 添加3D翻轉動畫
    setTimeout(() => {
      tmpImage.classList.add("puzzle-complete-animation");
    }, 500);

    // 添加煙火特效
    setTimeout(() => {
      createFireworks();
    }, 1000);
  }

  changePieceCount(newCount) {
    if (newCount === 12) {
      this.nbRows = 4;
      this.nbCols = 3;
    } else if (newCount === 25) {
      this.nbRows = 5;
      this.nbCols = 5;
    } else if (newCount === 50) {
      this.nbRows = 7;
      this.nbCols = 7;
    } else if (newCount === 100) {
      this.nbRows = 10;
      this.nbCols = 10;
    } else if (newCount === 200) {
      this.nbRows = 14;
      this.nbCols = 14;
    }
    
    this.nbPieces = newCount;
    this.createPieces();
  }

  loadImage(imageUrl) {
    this.srcImage.src = imageUrl;
    this.polyPieces.forEach(piece => {
      piece.element.style.backgroundImage = `url('${imageUrl}')`;
    });
  }
}

// PolyPiece 類別
class PolyPiece {
  constructor(kPiece, kRow, kCol, nbRows, nbCols, puzzle) {
    this.kPiece = kPiece;
    this.kRow = kRow;
    this.kCol = kCol;
    this.nbRows = nbRows;
    this.nbCols = nbCols;
    this.puzzle = puzzle;
    this.x = 0;
    this.y = 0;
    this.element = null;
    this.placed = false;
    this.width = 100;
    this.height = 100;
    
    this.createElement();
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.className = "polypiece";
    this.element.style.width = this.width + "px";
    this.element.style.height = this.height + "px";
    this.element.style.position = "absolute";
    this.element.style.backgroundImage = "url('baby1.jpg')";
    this.element.style.backgroundSize = `${this.nbCols * this.width}px ${this.nbRows * this.height}px`;
    this.element.style.backgroundPosition = `-${this.kCol * this.width}px -${this.kRow * this.height}px`;
    this.element.style.backgroundRepeat = "no-repeat";
    this.element.style.border = "2px solid rgba(255, 255, 255, 0.8)";
    this.element.style.borderRadius = "8px";
    this.element.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    this.element.style.cursor = "grab";
  }

  updatePosition() {
    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";
  }

  checkPlacement() {
    const targetX = this.kCol * this.width;
    const targetY = this.kRow * this.height;
    const tolerance = 30;
    
    if (mabs(this.x - targetX) < tolerance && mabs(this.y - targetY) < tolerance) {
      this.x = targetX;
      this.y = targetY;
      this.updatePosition();
      this.placed = true;
      this.element.style.border = "2px solid #4CAF50";
      return true;
    }
    return false;
  }
}

// Events queue
let events = [];

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  while (events.length > 0) {
    const event = events.shift();
    
    if (event.event === "nbpieces") {
      puzzle.changePieceCount(event.nbpieces);
    } else if (event.event === "loadimage") {
      puzzle.loadImage(event.imageUrl);
    }
  }
}

// Menu system
let menu = (function () {
  let menu = { items: [] };
  document.querySelectorAll("#menu li").forEach((menuEl) => {
    let kItem = menu.items.length;
    let item = { element: menuEl, kItem: kItem };
    menu.items[kItem] = item;
  });

  menu.open = function () {
    const menuElement = document.getElementById('menu');
    menuElement.classList.add('open');
    menu.opened = true;
  };
  
  menu.close = function () {
    const menuElement = document.getElementById('menu');
    menuElement.classList.remove('open');
    menu.opened = false;
  };
  
  menu.items[0].element.addEventListener("click", () => {
    if (menu.opened) menu.close();
    else menu.open();
  });
  
  menu.items[1].element.addEventListener("click", loadInitialFile);
  menu.items[2].element.addEventListener("click", loadFile);
  menu.items[3].element.addEventListener("click", () => {});
  
  for (let k = 4; k < menu.items.length; ++k) {
    menu.items[k].element.addEventListener("click", () =>
      events.push({
        event: "nbpieces",
        nbpieces: [12, 25, 50, 100, 200][k - 4],
      })
    );
  }
  
  return menu;
})();

menu.close();

// File loading functions
function loadInitialFile() {
  puzzle.srcImage.src = "baby1.jpg";
  puzzle.polyPieces.forEach(piece => {
    piece.element.style.backgroundImage = "url('baby1.jpg')";
  });
}

function loadFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        events.push({
          event: "loadimage",
          imageUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
  menu.close();
}

// Theme toggle function
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const button = document.querySelector('.theme-toggle');
  if (document.body.classList.contains('light-mode')) {
    button.textContent = '☀️';
  } else {
    button.textContent = '🌙';
  }
}

// 華麗煙火特效函數
function createFireworks() {
  const colors = ['#ff1744', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', 
                  '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
  const gradients = [
    'radial-gradient(circle, #ff1744, #ff5722)',
    'radial-gradient(circle, #e91e63, #9c27b0)',
    'radial-gradient(circle, #3f51b5, #2196f3)',
    'radial-gradient(circle, #00bcd4, #4caf50)',
    'radial-gradient(circle, #ffeb3b, #ff9800)'
  ];
  
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.7;
      
      for (let j = 0; j < 30; j++) {
        const particle = document.createElement("div");
        particle.className = "firework-particle";
        particle.style.position = "fixed";
        particle.style.left = x + "px";
        particle.style.top = y + "px";
        
        const size = 8 + Math.random() * 12;
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.borderRadius = "50%";
        
        if (Math.random() > 0.5) {
          particle.style.background = gradients[Math.floor(Math.random() * gradients.length)];
        } else {
          particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "9999";
        particle.style.boxShadow = `0 0 ${size * 3}px ${colors[Math.floor(Math.random() * colors.length)]}`;
        
        const angle = (j / 30) * 2 * Math.PI + Math.random() * 0.8;
        const distance = 100 + Math.random() * 250;
        const endX = x + Math.cos(angle) * distance;
        const endY = y + Math.sin(angle) * distance + Math.random() * 80;
        
        particle.style.transition = "all 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        particle.style.opacity = "1";
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
          particle.style.left = endX + "px";
          particle.style.top = endY + "px";
          particle.style.opacity = "0";
          particle.style.transform = `scale(0) rotate(${Math.random() * 720}deg)`;
        }, 10);
        
        setTimeout(() => {
          if (particle.parentNode) {
            particle.remove();
          }
        }, 2600);
      }
    }, i * 120);
  }
}

// Window resize handler
window.addEventListener("resize", (event) => {
  if (events.length && events[events.length - 1].event == "resize") return;
  events.push({ event: "resize" });
});

// Initialize
puzzle = new Puzzle({ container: "forPuzzle" });
autoStart = isMiniature();

loadInitialFile();
requestAnimationFrame(animate);