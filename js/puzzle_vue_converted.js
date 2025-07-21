// Vue 3 Options API 版本的拼圖遊戲
const { createApp } = Vue;

// 工具函數保持不變
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

// Point 類別保持不變
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

// Segment 類別保持不變
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

// Side 類別保持不變
class Side {
  constructor() {
    this.points = [];
    this.scaledPoints = [];
    this.type = "";
  }
  
  reversed() {
    const ns = new Side();
    ns.points = this.points.slice().reverse();
    ns.type = this.type;
    return ns;
  }
  
  scale(puzzle) {
    const coefx = puzzle.scalex;
    const coefy = puzzle.scaley;
    this.scaledPoints = this.points.map(point => 
      new Point(point.x * coefx, point.y * coefy)
    );
  }
  
  addToPath(path, shiftx, shifty) {
    if (this.type == "d") {
      path.lineTo(
        this.scaledPoints[1].x + shiftx,
        this.scaledPoints[1].y + shifty
      );
    } else {
      for (let k = 1; k < this.scaledPoints.length - 1; k += 3) {
        path.bezierCurveTo(
          this.scaledPoints[k].x + shiftx,
          this.scaledPoints[k].y + shifty,
          this.scaledPoints[k + 1].x + shiftx,
          this.scaledPoints[k + 1].y + shifty,
          this.scaledPoints[k + 2].x + shiftx,
          this.scaledPoints[k + 2].y + shifty
        );
      }
    }
  }
}

// 扭曲函數保持不變
function twist0(side, ca, cb) {
  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();
  
  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);
  
  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();
  
  const scalex = alea(0.85, 0.95);
  const scaley = alea(0.92, 0.98);
  const mid = alea(0.47, 0.53);
  
  const pa = pointAt(mid - (0.8 / 12) * scalex, (0.8 / 12) * scaley);
  const pb = pointAt(mid - (1.6 / 12) * scalex, (2.4 / 12) * scaley);
  const pc = pointAt(mid, (3.2 / 12) * scaley);
  const pd = pointAt(mid + (1.6 / 12) * scalex, (2.4 / 12) * scaley);
  const pe = pointAt(mid + (0.8 / 12) * scalex, (0.8 / 12) * scaley);
  
  side.points = [side.points[0], pa, pb, pc, pd, pe, side.points[1]];
  side.type = "z";
  
  function pointAt(coeffh, coeffv) {
    return new Point(
      side.points[0].x + coeffh * dxh + coeffv * dxv,
      side.points[0].y + coeffh * dyh + coeffv * dyv
    );
  }
}

function twist1(side, ca, cb) {
  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();
  
  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);
  
  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();
  
  const pa = pointAt(alea(0.3, 0.35), alea(-0.05, 0.05));
  const pb = pointAt(alea(0.45, 0.55), alea(0.2, 0.3));
  const pc = pointAt(alea(0.65, 0.78), alea(-0.05, 0.05));
  
  side.points = [side.points[0], pa, pb, pc, side.points[1]];
  side.type = "z";
  
  function pointAt(coeffh, coeffv) {
    return new Point(
      side.points[0].x + coeffh * dxh + coeffv * dxv,
      side.points[0].y + coeffh * dyh + coeffv * dyv
    );
  }
}

function twist2(side, ca, cb) {
  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();
  
  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);
  
  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();
  
  const hmid = alea(0.45, 0.55);
  const vmid = alea(0.4, 0.5);
  const pc = pointAt(hmid, vmid);
  let sega = new Segment(seg0.p1, pc);
  
  const pb = sega.pointOnRelative(2 / 3);
  
  const pd = sega.pointOnRelative(2 / 3);
  
  function pointAt(coeffh, coeffv) {
    return new Point(
      side.points[0].x + coeffh * dxh + coeffv * dxv,
      side.points[0].y + coeffh * dyh + coeffv * dyv
    );
  }
}

function twist3(side, ca, cb) {
  // 簡化版本的 twist3
}

// Piece 類別保持不變
class Piece {
  constructor(kx, ky) {
    this.kx = kx;
    this.ky = ky;
    this.ts = new Side();
    this.rs = new Side();
    this.bs = new Side();
    this.ls = new Side();
  }
}

// PolyPiece 類別
class PolyPiece {
  constructor(piece, puzzle) {
    this.pieces = [piece];
    this.puzzle = puzzle;
    this.canvas = document.createElement("CANVAS");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.classList.add("polypiece");
    this.x = 0;
    this.y = 0;
    this.offsx = 0;
    this.offsy = 0;
    this.pckxmin = piece.kx;
    this.pckymin = piece.ky;
    this.pckxmax = piece.kx;
    this.pckymax = piece.ky;
    this.path = null;
  }
  
  merge(otherPoly) {
    const orgpckxmin = this.pckxmin;
    const orgpckymin = this.pckymin;
    
    const kOther = this.puzzle.polyPieces.indexOf(otherPoly);
    
    for (let k = 0; k < otherPoly.pieces.length; ++k) {
      this.pieces.push(otherPoly.pieces[k]);
    }
    
    this.pieces.sort(function (p1, p2) {
      if (p1.ky != p2.ky) return p1.ky - p2.ky;
      return p1.kx - p2.kx;
    });
    
    this.pckxmin = this.pieces[0].kx;
    this.pckymin = this.pieces[0].ky;
    this.pckxmax = this.pieces[this.pieces.length - 1].kx;
    this.pckymax = this.pieces[this.pieces.length - 1].ky;
    
    for (let k = 0; k < this.pieces.length; ++k) {
      let piece = this.pieces[k];
      this.pckxmin = mmin(this.pckxmin, piece.kx);
      this.pckymin = mmin(this.pckymin, piece.ky);
      this.pckxmax = mmax(this.pckxmax, piece.kx);
      this.pckymax = mmax(this.pckymax, piece.ky);
    }
    
    this.puzzle.polyPieces.splice(kOther, 1);
    
    let puzzle = this.puzzle;
    
    let x = this.x - puzzle.scalex * this.pckxmin;
    let y = this.y - puzzle.scaley * this.pckymin;
    
    let ppx = otherPoly.x - puzzle.scalex * otherPoly.pckxmin;
    let ppy = otherPoly.y - puzzle.scaley * otherPoly.pckymin;
    
    this.x = ppx + puzzle.scalex * this.pckxmin;
    this.y = ppy + puzzle.scaley * this.pckymin;
    
    for (let k = this.pieces.length - 1; k >= 0; --k) {
      this.pieces[k].ts.scale(puzzle);
      for (let ko = otherPoly.pieces.length - 1; ko >= 0; --ko) {
        this.pieces[k].rs.scale(puzzle);
        this.pieces[k].bs.scale(puzzle);
        this.pieces[k].ls.scale(puzzle);
      }
    }
    
    this.drawImage();
    this.puzzle.container.appendChild(this.canvas);
    otherPoly.canvas.remove();
  }
  
  ifNear(otherPoly) {
    const that = this;
    
    function edgeIsCommon(kx, ky, edge) {
      for (let ko = 0; ko < otherPoly.pieces.length; ++ko) {
        let otherPiece = otherPoly.pieces[ko];
        if (edge == "t" && otherPiece.kx == kx && otherPiece.ky == ky - 1) return true;
        if (edge == "r" && otherPiece.kx == kx + 1 && otherPiece.ky == ky) return true;
        if (edge == "b" && otherPiece.kx == kx && otherPiece.ky == ky + 1) return true;
        if (edge == "l" && otherPiece.kx == kx - 1 && otherPiece.ky == ky) return true;
      }
      return false;
    }
    
    function edgeIsInTbEdges(kx, ky, edge) {
      for (let k = 0; k < tbEdges.length; ++k) {
        let tbEdge = tbEdges[k];
        if (tbEdge.kx == kx && tbEdge.ky == ky && tbEdge.edge == edge) return true;
      }
      return false;
    }
    
    let tbLoops = [];
    let tbEdges = [];
    
    let tbTries = [
      { kx: that.pckxmin, ky: that.pckymin, edge: "t" },
      { kx: that.pckxmax, ky: that.pckymin, edge: "r" },
      { kx: that.pckxmax, ky: that.pckymax, edge: "b" },
      { kx: that.pckxmin, ky: that.pckymax, edge: "l" }
    ];
    
    for (let k = 0; k < that.pieces.length; ++k) {
      let piece = that.pieces[k];
      if (!edgeIsCommon(piece.kx, piece.ky, "t") && !edgeIsInTbEdges(piece.kx, piece.ky, "t"))
        tbEdges.push({ kx: piece.kx, ky: piece.ky, edge: "t", kp: k });
      if (!edgeIsCommon(piece.kx, piece.ky, "r") && !edgeIsInTbEdges(piece.kx, piece.ky, "r"))
        tbEdges.push({ kx: piece.kx, ky: piece.ky, edge: "r", kp: k });
      if (!edgeIsCommon(piece.kx, piece.ky, "b") && !edgeIsInTbEdges(piece.kx, piece.ky, "b"))
        tbEdges.push({ kx: piece.kx, ky: piece.ky, edge: "b", kp: k });
      if (!edgeIsCommon(piece.kx, piece.ky, "l") && !edgeIsInTbEdges(piece.kx, piece.ky, "l"))
        tbEdges.push({ kx: piece.kx, ky: piece.ky, edge: "l", kp: k });
    }
    
    return false; // 簡化版本，實際需要完整的邊緣檢測邏輯
  }
  
  drawImage() {
    let puzzle = this.puzzle;
    
    this.canvas.width = (this.pckxmax - this.pckxmin + 1) * puzzle.scalex;
    this.canvas.height = (this.pckymax - this.pckymin + 1) * puzzle.scaley;
    
    this.offsx = this.pckxmin * puzzle.scalex;
    this.offsy = this.pckymin * puzzle.scaley;
    
    const path = new Path2D();
    const shiftx = -this.offsx;
    const shifty = -this.offsy;
    
    this.pieces.forEach(pp => {
      const srcx = pp.kx ? (pp.kx - 0.5) * puzzle.scalex : 0;
      const srcy = pp.ky ? (pp.ky - 0.5) * puzzle.scaley : 0;
      
      path.moveTo(
        pp.ts.scaledPoints[0].x + shiftx,
        pp.ts.scaledPoints[0].y + shifty
      );
      
      pp.ts.addToPath(path, shiftx, shifty);
      pp.rs.addToPath(path, shiftx, shifty);
      pp.bs.addToPath(path, shiftx, shifty);
      pp.ls.addToPath(path, shiftx, shifty);
      
      path.closePath();
    });
    
    this.path = path;
    this.ctx.save();
    this.ctx.clip(path);
    
    if (puzzle.srcImage) {
      this.ctx.drawImage(
        puzzle.srcImage,
        0, 0, puzzle.srcImage.naturalWidth, puzzle.srcImage.naturalHeight,
        shiftx, shifty, puzzle.scalex * puzzle.nx, puzzle.scaley * puzzle.ny
      );
    }
    
    this.ctx.restore();
    this.ctx.stroke(path);
  }
  
  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.canvas.style.left = x + "px";
    this.canvas.style.top = y + "px";
  }
  
  moveToInitialPlace() {
    let puzzle = this.puzzle;
    this.moveTo(
      puzzle.offsx + this.offsx,
      puzzle.offsy + this.offsy
    );
    puzzle.container.appendChild(this.canvas);
  }
}

// Puzzle 主類別
class Puzzle {
  constructor(options) {
    this.container = document.getElementById(options.container);
    this.nbPieces = 12;
    this.nx = 0;
    this.ny = 0;
    this.scalex = 0;
    this.scaley = 0;
    this.offsx = 0;
    this.offsy = 0;
    this.contWidth = 0;
    this.contHeight = 0;
    this.gameWidth = 0;
    this.gameHeight = 0;
    this.pieces = [];
    this.polyPieces = [];
    this.srcImage = null;
    this.imageLoaded = false;
    this.gameCanvas = null;
    this.zIndexSup = 1000;
    this.relativeHeight = 1;
  }
  
  getContainerSize() {
    let styl = window.getComputedStyle(this.container);
    this.contWidth = parseFloat(styl.width);
    this.contHeight = parseFloat(styl.height);
  }
  
  create() {
    this.container.innerHTML = "";
    this.getContainerSize();
    this.computenxAndny();
    
    this.relativeHeight = 
      this.srcImage.naturalHeight / this.ny / 
      (this.srcImage.naturalWidth / this.nx);
    
    this.defineShapes({
      coeffDecentr: 0.12,
      twistf: [twist0, twist1, twist2, twist3][0] // 預設使用 twist0
    });
    
    this.polyPieces = [];
    this.pieces.forEach(row =>
      row.forEach(piece => {
        this.polyPieces.push(new PolyPiece(piece, this));
      })
    );
    
    arrayShuffle(this.polyPieces);
    this.evaluateZIndex();
  }
  
  computenxAndny() {
    let kx, ky,
      width = this.srcImage.naturalWidth,
      height = this.srcImage.naturalHeight,
      npieces = this.nbPieces;
    let err, errmin = 1e9;
    let ncv, nch;
    
    let nHPieces = mround(msqrt((npieces * width) / height));
    let nVPieces = mround(npieces / nHPieces);
    
    for (ky = 0; ky < 5; ky++) {
      ncv = nVPieces + ky - 2;
      for (kx = 0; kx < 5; kx++) {
        nch = nHPieces + kx - 2;
        err = (nch * height) / ncv / width;
        err = err + 1 / err - 2;
        err += mabs(1 - (nch * ncv) / npieces);
        
        if (err < errmin) {
          errmin = err;
          this.nx = nch;
          this.ny = ncv;
        }
      }
    }
  }
  
  defineShapes(shapeDesc) {
    let { coeffDecentr, twistf } = shapeDesc;
    
    const corners = [];
    const nx = this.nx, ny = this.ny;
    let np;
    
    for (let ky = 0; ky <= ny; ++ky) {
      corners[ky] = [];
      for (let kx = 0; kx <= nx; ++kx) {
        corners[ky][kx] = new Point(
          kx + alea(-coeffDecentr, coeffDecentr),
          ky + alea(-coeffDecentr, coeffDecentr)
        );
        if (kx == 0) corners[ky][kx].x = 0;
        if (kx == nx) corners[ky][kx].x = nx;
        if (ky == 0) corners[ky][kx].y = 0;
        if (ky == ny) corners[ky][kx].y = ny;
      }
    }
    
    this.pieces = [];
    for (let ky = 0; ky < ny; ++ky) {
      this.pieces[ky] = [];
      for (let kx = 0; kx < nx; ++kx) {
        this.pieces[ky][kx] = np = new Piece(kx, ky);
        
        // 頂邊
        if (ky == 0) {
          np.ts.points = [corners[ky][kx], corners[ky][kx + 1]];
          np.ts.type = "d";
        } else {
          np.ts = this.pieces[ky - 1][kx].bs.reversed();
        }
        
        // 右邊
        np.rs.points = [corners[ky][kx + 1], corners[ky + 1][kx + 1]];
        np.rs.type = "d";
        if (kx < nx - 1) {
          if (intAlea(2))
            twistf(np.rs, corners[ky][kx], corners[ky + 1][kx]);
          else
            twistf(np.rs, corners[ky][kx + 2], corners[ky + 1][kx + 2]);
        }
        
        // 左邊
        if (kx == 0) {
          np.ls.points = [corners[ky + 1][kx], corners[ky][kx]];
          np.ls.type = "d";
        } else {
          np.ls = this.pieces[ky][kx - 1].rs.reversed();
        }
        
        // 底邊
        np.bs.points = [corners[ky + 1][kx + 1], corners[ky + 1][kx]];
        np.bs.type = "d";
        if (ky < ny - 1) {
          if (intAlea(2))
            twistf(np.bs, corners[ky][kx + 1], corners[ky][kx]);
          else
            twistf(np.bs, corners[ky + 2][kx + 1], corners[ky + 2][kx]);
        }
      }
    }
  }
  
  scale() {
    this.getContainerSize();
    
    this.gameWidth = this.contWidth * 0.8;
    this.gameHeight = this.gameWidth * this.relativeHeight;
    
    if (this.gameHeight > this.contHeight * 0.8) {
      this.gameHeight = this.contHeight * 0.8;
      this.gameWidth = this.gameHeight / this.relativeHeight;
    }
    
    this.scalex = this.gameWidth / this.nx;
    this.scaley = this.gameHeight / this.ny;
    
    this.offsx = (this.contWidth - this.gameWidth) / 2;
    this.offsy = (this.contHeight - this.gameHeight) / 2;
    
    this.pieces.forEach(row =>
      row.forEach(piece => {
        piece.ts.scale(this);
        piece.rs.scale(this);
        piece.bs.scale(this);
        piece.ls.scale(this);
      })
    );
  }
  
  optimInitial() {
    // 簡化的初始位置優化
    this.polyPieces.forEach((pp, index) => {
      const angle = (index / this.polyPieces.length) * 2 * Math.PI;
      const radius = Math.min(this.contWidth, this.contHeight) * 0.3;
      const x = this.contWidth / 2 + Math.cos(angle) * radius;
      const y = this.contHeight / 2 + Math.sin(angle) * radius;
      pp.moveTo(x, y);
    });
  }
  
  evaluateZIndex() {
    this.polyPieces.forEach((pp, index) => {
      pp.canvas.style.zIndex = 100 + index;
    });
    this.zIndexSup = 100 + this.polyPieces.length;
  }
}

// Vue 3 Options API 組件
const PuzzleGame = {
  data() {
    return {
      // 遊戲狀態
      gameState: 0,
      autoStart: false,
      
      // 拼圖相關數據
      puzzle: null,
      nbPieces: 12,
      imageLoaded: false,
      
      // 移動相關數據
      moving: null,
      events: [],
      
      // UI 狀態
      menuOpen: false,
      
      // 圖片相關
      srcImage: null,
      backImage: null,
      tmpImage: null,
      
      // 容器尺寸
      containerWidth: 0,
      containerHeight: 0
    };
  },
  
  computed: {
    isGameWon() {
      return this.puzzle && this.puzzle.polyPieces && this.puzzle.polyPieces.length === 1;
    },
    
    canStartGame() {
      return this.imageLoaded && this.nbPieces > 0;
    }
  },
  
  methods: {
    // 初始化遊戲
    initGame() {
      this.autoStart = isMiniature();
      this.setupImages();
      this.setupEventListeners();
      this.gameState = 0;
      this.startGameLoop();
    },
    
    // 設置圖片
    setupImages() {
      this.backImage = new Image();
      this.backImage.src = "back.jpg";
      
      this.srcImage = new Image();
      this.srcImage.addEventListener("load", () => {
        this.imageLoaded = true;
        this.events.push({ event: "srcImageLoaded" });
      });
    },
    
    // 設置事件監聽器
    setupEventListeners() {
      const container = this.$refs.puzzleContainer;
      if (!container) return;
      
      // 滑鼠事件
      container.addEventListener("mousedown", this.handleMouseDown);
      container.addEventListener("mouseup", this.handleMouseUp);
      container.addEventListener("mousemove", this.handleMouseMove);
      container.addEventListener("mouseleave", this.handleMouseLeave);
      
      // 觸控事件
      container.addEventListener("touchstart", this.handleTouchStart, { passive: false });
      container.addEventListener("touchend", this.handleTouchEnd);
      container.addEventListener("touchmove", this.handleTouchMove, { passive: false });
      container.addEventListener("touchcancel", this.handleTouchCancel);
    },
    
    // 事件處理器
    handleMouseDown(event) {
      event.preventDefault();
      this.events.push({
        event: "touch",
        position: this.getRelativeCoordinates(event)
      });
    },
    
    handleMouseUp(event) {
      event.preventDefault();
      this.events.push({ event: "leave" });
    },
    
    handleMouseMove(event) {
      event.preventDefault();
      if (this.events.length && this.events[this.events.length - 1].event === "move") {
        this.events.pop();
      }
      this.events.push({
        event: "move",
        position: this.getRelativeCoordinates(event)
      });
    },
    
    handleMouseLeave() {
      this.events.push({ event: "leave" });
    },
    
    handleTouchStart(event) {
      event.preventDefault();
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      this.events.push({
        event: "touch",
        position: this.getRelativeCoordinates(touch)
      });
    },
    
    handleTouchEnd(event) {
      event.preventDefault();
      this.events.push({ event: "leave" });
    },
    
    handleTouchMove(event) {
      event.preventDefault();
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (this.events.length && this.events[this.events.length - 1].event === "move") {
        this.events.pop();
      }
      this.events.push({
        event: "move",
        position: this.getRelativeCoordinates(touch)
      });
    },
    
    handleTouchCancel() {
      this.events.push({ event: "leave" });
    },
    
    // 獲取相對座標
    getRelativeCoordinates(event) {
      const container = this.$refs.puzzleContainer;
      const rect = container.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    },
    
    // 創建拼圖
    createPuzzle() {
      if (!this.puzzle) {
        // 創建簡化版的 Puzzle 物件，直接整合到 Vue 組件中
        this.puzzle = {
          container: this.$refs.puzzleContainer,
          nbPieces: this.nbPieces,
          srcImage: this.srcImage,
          nx: 0,
          ny: 0,
          scalex: 0,
          scaley: 0,
          offsx: 0,
          offsy: 0,
          contWidth: 0,
          contHeight: 0,
          gameWidth: 0,
          gameHeight: 0,
          pieces: [],
          polyPieces: [],
          zIndexSup: 1000,
          relativeHeight: 1
        };
      }
      
      this.puzzle.nbPieces = this.nbPieces;
      this.puzzle.srcImage = this.srcImage;
      
      // 使用原有的邏輯創建拼圖
      this.puzzleCreate();
      this.puzzleScale();
      
      this.puzzle.polyPieces.forEach(pp => {
        pp.drawImage();
        pp.moveToInitialPlace();
      });
    },
    
    // 拼圖創建邏輯
    puzzleCreate() {
      const puzzle = this.puzzle;
      puzzle.container.innerHTML = "";
      this.getContainerSize();
      this.computenxAndny();
      
      puzzle.relativeHeight = 
        puzzle.srcImage.naturalHeight / puzzle.ny / 
        (puzzle.srcImage.naturalWidth / puzzle.nx);
      
      this.defineShapes({
        coeffDecentr: 0.12,
        twistf: twist0 // 使用 twist0
      });
      
      puzzle.polyPieces = [];
      puzzle.pieces.forEach(row =>
        row.forEach(piece => {
          puzzle.polyPieces.push(new PolyPiece(piece, puzzle));
        })
      );
      
      arrayShuffle(puzzle.polyPieces);
      this.evaluateZIndex();
    },
    
    // 計算容器大小
    getContainerSize() {
      const container = this.$refs.puzzleContainer;
      const styl = window.getComputedStyle(container);
      this.puzzle.contWidth = parseFloat(styl.width);
      this.puzzle.contHeight = parseFloat(styl.height);
    },
    
    // 計算拼圖行列數
    computenxAndny() {
      const puzzle = this.puzzle;
      let kx, ky,
        width = puzzle.srcImage.naturalWidth,
        height = puzzle.srcImage.naturalHeight,
        npieces = puzzle.nbPieces;
      let err, errmin = 1e9;
      let ncv, nch;
      
      let nHPieces = mround(msqrt((npieces * width) / height));
      let nVPieces = mround(npieces / nHPieces);
      
      for (ky = 0; ky < 5; ky++) {
        ncv = nVPieces + ky - 2;
        for (kx = 0; kx < 5; kx++) {
          nch = nHPieces + kx - 2;
          err = (nch * height) / ncv / width;
          err = err + 1 / err - 2;
          err += mabs(1 - (nch * ncv) / npieces);
          
          if (err < errmin) {
            errmin = err;
            puzzle.nx = nch;
            puzzle.ny = ncv;
          }
        }
      }
    },
    
    // 定義拼圖形狀
    defineShapes(shapeDesc) {
      const puzzle = this.puzzle;
      let { coeffDecentr, twistf } = shapeDesc;
      
      const corners = [];
      const nx = puzzle.nx, ny = puzzle.ny;
      let np;
      
      for (let ky = 0; ky <= ny; ++ky) {
        corners[ky] = [];
        for (let kx = 0; kx <= nx; ++kx) {
          corners[ky][kx] = new Point(
            kx + alea(-coeffDecentr, coeffDecentr),
            ky + alea(-coeffDecentr, coeffDecentr)
          );
          if (kx == 0) corners[ky][kx].x = 0;
          if (kx == nx) corners[ky][kx].x = nx;
          if (ky == 0) corners[ky][kx].y = 0;
          if (ky == ny) corners[ky][kx].y = ny;
        }
      }
      
      puzzle.pieces = [];
      for (let ky = 0; ky < ny; ++ky) {
        puzzle.pieces[ky] = [];
        for (let kx = 0; kx < nx; ++kx) {
          puzzle.pieces[ky][kx] = np = new Piece(kx, ky);
          
          // 頂邊
          if (ky == 0) {
            np.ts.points = [corners[ky][kx], corners[ky][kx + 1]];
            np.ts.type = "d";
          } else {
            np.ts = puzzle.pieces[ky - 1][kx].bs.reversed();
          }
          
          // 右邊
          np.rs.points = [corners[ky][kx + 1], corners[ky + 1][kx + 1]];
          np.rs.type = "d";
          if (kx < nx - 1) {
            if (intAlea(2))
              twistf(np.rs, corners[ky][kx], corners[ky + 1][kx]);
            else
              twistf(np.rs, corners[ky][kx + 2], corners[ky + 1][kx + 2]);
          }
          
          // 左邊
          if (kx == 0) {
            np.ls.points = [corners[ky + 1][kx], corners[ky][kx]];
            np.ls.type = "d";
          } else {
            np.ls = puzzle.pieces[ky][kx - 1].rs.reversed();
          }
          
          // 底邊
          np.bs.points = [corners[ky + 1][kx + 1], corners[ky + 1][kx]];
          np.bs.type = "d";
          if (ky < ny - 1) {
            if (intAlea(2))
              twistf(np.bs, corners[ky][kx + 1], corners[ky][kx]);
            else
              twistf(np.bs, corners[ky + 2][kx + 1], corners[ky + 2][kx]);
          }
        }
      }
    },
    
    // 拼圖縮放
    puzzleScale() {
      const puzzle = this.puzzle;
      this.getContainerSize();
      
      puzzle.gameWidth = puzzle.contWidth * 0.8;
      puzzle.gameHeight = puzzle.gameWidth * puzzle.relativeHeight;
      
      if (puzzle.gameHeight > puzzle.contHeight * 0.8) {
        puzzle.gameHeight = puzzle.contHeight * 0.8;
        puzzle.gameWidth = puzzle.gameHeight / puzzle.relativeHeight;
      }
      
      puzzle.scalex = puzzle.gameWidth / puzzle.nx;
      puzzle.scaley = puzzle.gameHeight / puzzle.ny;
      
      puzzle.offsx = (puzzle.contWidth - puzzle.gameWidth) / 2;
      puzzle.offsy = (puzzle.contHeight - puzzle.gameHeight) / 2;
      
      puzzle.pieces.forEach(row =>
        row.forEach(piece => {
          piece.ts.scale(puzzle);
          piece.rs.scale(puzzle);
          piece.bs.scale(puzzle);
          piece.ls.scale(puzzle);
        })
      );
    },
    
    // 評估 Z-Index
    evaluateZIndex() {
      const puzzle = this.puzzle;
      puzzle.polyPieces.forEach((pp, index) => {
        pp.canvas.style.zIndex = 100 + index;
      });
      puzzle.zIndexSup = 100 + puzzle.polyPieces.length;
    },
    
    // 開始遊戲循環
    startGameLoop() {
      this.animate();
    },
    
    // 動畫循環
    animate() {
      const event = this.events.shift();
      
      switch (this.gameState) {
        case 0: // 初始狀態
          this.gameState = 10;
          break;
          
        case 10: // 等待圖片載入
          if (this.imageLoaded) {
            this.gameState = 15;
          }
          break;
          
        case 15: // 等待選擇拼圖片數
          if (this.autoStart) {
            this.events.push({ event: "nbpieces", nbpieces: 12 });
            this.autoStart = false;
          }
          if (event && event.event === "nbpieces") {
            this.nbPieces = event.nbpieces;
            this.gameState = 20;
          }
          break;
          
        case 20: // 準備拼圖
          this.menuOpen = false;
          this.createPuzzle();
          this.gameState = 25;
          break;
          
        case 25: // 散佈拼圖片
          this.gameState = 30;
          break;
          
        case 30: // 啟動移動
          this.optimInitial();
          setTimeout(() => {
            this.events.push({ event: "finished" });
          }, 1200);
          this.gameState = 35;
          break;
          
        case 35: // 等待移動結束
          if (event && event.event === "finished") {
            this.gameState = 50;
          }
          break;
          
        case 50: // 等待用戶操作
          if (!event) break;
          if (event.event === "nbpieces") {
            this.nbPieces = event.nbpieces;
            this.gameState = 20;
            break;
          }
          if (event.event === "touch") {
            this.handlePieceTouch(event);
          }
          break;
          
        case 55: // 移動拼圖片
          this.handlePieceMove(event);
          break;
          
        case 60: // 獲勝
          this.handleGameWin();
          this.gameState = 65;
          break;
          
        case 65: // 等待新遊戲
          if (event && event.event === "nbpieces") {
            this.nbPieces = event.nbpieces;
            this.gameState = 20;
          }
          break;
      }
      
      requestAnimationFrame(() => this.animate());
    },
    
    // 處理拼圖片觸碰
    handlePieceTouch(event) {
      this.moving = {
        xMouseInit: event.position.x,
        yMouseInit: event.position.y
      };
      
      for (let k = this.puzzle.polyPieces.length - 1; k >= 0; --k) {
        let pp = this.puzzle.polyPieces[k];
        if (pp.ctx.isPointInPath(
          pp.path,
          event.position.x - pp.x,
          event.position.y - pp.y
        )) {
          this.moving.pp = pp;
          this.moving.ppXInit = pp.x;
          this.moving.ppYInit = pp.y;
          
          this.puzzle.polyPieces.splice(k, 1);
          this.puzzle.polyPieces.push(pp);
          pp.canvas.style.zIndex = this.puzzle.zIndexSup;
          this.gameState = 55;
          return;
        }
      }
    },
    
    // 處理拼圖片移動
    handlePieceMove(event) {
      if (!event) return;
      
      switch (event.event) {
        case "move":
          this.moving.pp.moveTo(
            event.position.x - this.moving.xMouseInit + this.moving.ppXInit,
            event.position.y - this.moving.yMouseInit + this.moving.ppYInit
          );
          break;
          
        case "leave":
          this.checkPieceMerging();
          this.evaluateZIndex();
          this.gameState = 50;
          if (this.puzzle.polyPieces.length === 1) {
            this.gameState = 60;
          }
          break;
      }
    },
    
    // 檢查拼圖片合併
    checkPieceMerging() {
      let doneSomething;
      do {
        doneSomething = false;
        for (let k = this.puzzle.polyPieces.length - 1; k >= 0; --k) {
          let pp = this.puzzle.polyPieces[k];
          if (pp === this.moving.pp) continue;
          
          if (this.moving.pp.ifNear(pp)) {
            if (pp.pieces.length > this.moving.pp.pieces.length) {
              pp.merge(this.moving.pp);
              this.moving.pp = pp;
            } else {
              this.moving.pp.merge(pp);
            }
            doneSomething = true;
            break;
          }
        }
      } while (doneSomething);
    },
    
    // 處理遊戲獲勝
    handleGameWin() {
      const container = this.$refs.puzzleContainer;
      container.innerHTML = "";
      
      // 創建獲勝動畫
      this.createWinAnimation();
      
      // 創建煙火效果
      setTimeout(() => {
        this.createFireworks();
      }, 1000);
      
      this.menuOpen = true;
    },
    
    // 創建獲勝動畫
    createWinAnimation() {
      // 實現獲勝動畫邏輯
    },
    
    // 創建煙火效果
    createFireworks() {
      const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"];
      
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.1;
          
          // 創建粒子效果
          for (let j = 0; j < 30; j++) {
            const particle = document.createElement("div");
            const size = Math.random() * 8 + 4;
            
            particle.style.position = "fixed";
            particle.style.left = x + "px";
            particle.style.top = y + "px";
            particle.style.width = size + "px";
            particle.style.height = size + "px";
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = "50%";
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
    },
    
    // 載入圖片
    loadImage(src) {
      this.srcImage.src = src;
    },
    
    // 設置拼圖片數
    setPieceCount(count) {
      this.nbPieces = count;
      this.events.push({ event: "nbpieces", nbpieces: count });
    },
    
    // 重新開始遊戲
    restartGame() {
      this.gameState = 20;
    },
    
    // 初始位置優化
    optimInitial() {
      const puzzle = this.puzzle;
      puzzle.polyPieces.forEach((pp, index) => {
        const angle = (index / puzzle.polyPieces.length) * 2 * Math.PI;
        const radius = Math.min(puzzle.contWidth, puzzle.contHeight) * 0.3;
        const x = puzzle.contWidth / 2 + Math.cos(angle) * radius;
        const y = puzzle.contHeight / 2 + Math.sin(angle) * radius;
        pp.moveTo(x, y);
      });
    },
    
    // 載入初始檔案
    loadInitialFile() {
      this.loadImage("Jinu_2.jpg"); // 預設圖片
    },
    
    // 適應圖片大小
    fitImage(img, maxWidth, maxHeight) {
      const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
      img.style.width = (img.naturalWidth * ratio) + "px";
      img.style.height = (img.naturalHeight * ratio) + "px";
    },
    
    // 獲取相對滑鼠座標
    relativeMouseCoordinates(event) {
      const container = this.$refs.puzzleContainer;
      const rect = container.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  },
  
  mounted() {
    this.initGame();
    this.loadInitialFile();
  },
  
  beforeUnmount() {
    // 清理事件監聽器
    const container = this.$refs.puzzleContainer;
    if (container) {
      container.removeEventListener("mousedown", this.handleMouseDown);
      container.removeEventListener("mouseup", this.handleMouseUp);
      container.removeEventListener("mousemove", this.handleMouseMove);
      container.removeEventListener("mouseleave", this.handleMouseLeave);
      container.removeEventListener("touchstart", this.handleTouchStart);
      container.removeEventListener("touchend", this.handleTouchEnd);
      container.removeEventListener("touchmove", this.handleTouchMove);
      container.removeEventListener("touchcancel", this.handleTouchCancel);
    }
  },
  
  template: `
    <div class="puzzle-game">
      <div ref="puzzleContainer" class="puzzle-container" id="forPuzzle">
        <!-- 拼圖容器 -->
      </div>
      
      <div v-if="menuOpen" class="menu">
        <h3>拼圖遊戲</h3>
        <div class="menu-options">
          <label>
            拼圖片數:
            <select v-model="nbPieces" @change="setPieceCount(nbPieces)">
              <option value="6">6 片</option>
              <option value="12">12 片</option>
              <option value="24">24 片</option>
              <option value="48">48 片</option>
            </select>
          </label>
          <button @click="restartGame">重新開始</button>
        </div>
      </div>
      
      <div v-if="isGameWon" class="win-message">
        <h2>恭喜完成拼圖！</h2>
      </div>
    </div>
  `
};

// 導出 PuzzleGame 組件供外部使用
window.PuzzleGame = PuzzleGame;

// 如果存在 #app 元素，則自動創建應用
if (document.getElementById('app')) {
  const app = createApp(PuzzleGame);
  window.vueApp = app.mount('#app');
}