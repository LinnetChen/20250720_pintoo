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
this.backImage = new Image();
this.backImage.src = "back.jpg"; // 換你想要的圖

//-----------------------------------------------------------------------------
function isMiniature() {
  return location.pathname.includes("/fullcpgrid/");
}
//-----------------------------------------------------------------------------

function alea(min, max) {
  // random number [min..max[ . If no max is provided, [0..min[

  if (typeof max == "undefined") return min * mrandom();
  return min + (max - min) * mrandom();
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function intAlea(min, max) {
  // random integer number [min..max[ . If no max is provided, [0..min[

  if (typeof max == "undefined") {
    max = min;
    min = 0;
  }
  return mfloor(min + (max - min) * mrandom());
} // intAlea

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function arrayShuffle(array) {
  /* randomly changes the order of items in an array
        only the order is modified, not the elements
        */
  let k1, temp;
  for (let k = array.length - 1; k >= 1; --k) {
    k1 = intAlea(0, k + 1);
    temp = array[k];
    array[k] = array[k1];
    array[k1] = temp;
  } // for k
  return array;
} // arrayShuffle

//-----------------------------------------------------------------------------

// Point - - - - - - - - - - - - - - - - - - - -
class Point {
  constructor(x, y) {
    this.x = Number(x);
    this.y = Number(y);
  } // constructor
  copy() {
    return new Point(this.x, this.y);
  }

  distance(otherPoint) {
    return mhypot(this.x - otherPoint.x, this.y - otherPoint.y);
  }
} // class Point

// Segment - - - - - - - - - - - - - - - - - - - -
// those segments are oriented
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

  // returns a point at a given distance of p1, positive direction beeing towards p2

  pointOnRelative(coeff) {
    // attention if segment length can be 0
    let dx = this.dx();
    let dy = this.dy();
    return new Point(this.p1.x + coeff * dx, this.p1.y + coeff * dy);
  }
} // class Segment
//-----------------------------------------------------------------------------
// one side of a piece
class Side {
  constructor() {
    this.type = ""; // "d" pour straight line or "z" pour classic
    this.points = []; // real points or Bezier curve points
    // this.scaledPoints will be added when we know the scale
  } // Side

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reversed() {
    // returns a new Side, copy of current one but reversed
    const ns = new Side();
    ns.type = this.type;
    ns.points = this.points.slice().reverse();
    return ns;
  } // Side.reversed

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  scale(puzzle) {
    /* uses actual dimensions of puzzle to compute actual side points
            these points are not shifted by the piece position : the top left corner is at (0,0)
            */
    const coefx = puzzle.scalex;
    const coefy = puzzle.scaley;
    this.scaledPoints = this.points.map(
      (p) => new Point(p.x * coefx, p.y * coefy)
    );
  } //

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /*
        draws the path corresponding to a side
        Parameters :
            ctx : canvas context
            shiftx, shifty : position shift (used to create emboss effect)
            withoutMoveTo : to decide whether to do a moveTo to the first point. Without MoveTo
            must be done only for the first side of a piece, not for the following ones
        */

  drawPath(ctx, shiftx, shifty, withoutMoveTo) {
    if (!withoutMoveTo) {
      ctx.moveTo(
        this.scaledPoints[0].x + shiftx,
        this.scaledPoints[0].y + shifty
      );
    }
    if (this.type == "d") {
      ctx.lineTo(
        this.scaledPoints[1].x + shiftx,
        this.scaledPoints[1].y + shifty
      );
    } else {
      // edge zigzag
      for (let k = 1; k < this.scaledPoints.length - 1; k += 3) {
        ctx.bezierCurveTo(
          this.scaledPoints[k].x + shiftx,
          this.scaledPoints[k].y + shifty,
          this.scaledPoints[k + 1].x + shiftx,
          this.scaledPoints[k + 1].y + shifty,
          this.scaledPoints[k + 2].x + shiftx,
          this.scaledPoints[k + 2].y + shifty
        );
      } // for k
    } // if jigsaw side
  } // Side.drawPath
} // class Side

//-----------------------------------------------------------------------------
/* modifies a side
        changes it from a straight line (type "d") to a complex one (type "z")
        The change is done towards the opposite side (side between corners ca and cb)
        */

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

  side.points = [
    seg0.p1,
    new Point(
      seg0.p1.x + (4 / 12) * dxh * 0.45,
      seg0.p1.y + (4 / 12) * dyh * 0.45
    ),
    new Point(pa.x - (0.8 / 12) * dxv * 0.65, pa.y - (0.8 / 12) * dyv * 0.65),
    pa,
    new Point(pa.x + (0.8 / 12) * dxv * 0.65, pa.y + (0.8 / 12) * dyv * 0.65),

    new Point(pb.x - (0.8 / 12) * dxv * 0.85, pb.y - (0.8 / 12) * dyv * 0.85),
    pb,
    new Point(pb.x + (0.8 / 12) * dxv * 0.45, pb.y + (0.8 / 12) * dyv * 0.45),
    new Point(pc.x - (1.6 / 12) * dxh * 0.35, pc.y - (1.6 / 12) * dyh * 0.35),
    pc,
    new Point(pc.x + (1.6 / 12) * dxh * 0.35, pc.y + (1.6 / 12) * dyh * 0.35),
    new Point(pd.x + (0.8 / 12) * dxv * 0.45, pd.y + (0.8 / 12) * dyv * 0.45),
    pd,
    new Point(pd.x - (0.8 / 12) * dxv * 0.85, pd.y - (0.8 / 12) * dyv * 0.85),
    new Point(pe.x + (0.8 / 12) * dxv * 0.65, pe.y + (0.8 / 12) * dyv * 0.65),
    pe,
    new Point(pe.x - (0.8 / 12) * dxv * 0.65, pe.y - (0.8 / 12) * dyv * 0.65),
    new Point(
      seg0.p2.x - (4 / 12) * dxh * 0.45,
      seg0.p2.y - (4 / 12) * dyh * 0.45
    ),
    seg0.p2,
  ];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(
      seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv
    );
  } // pointAt
} // twist0

//-----------------------------------------------------------------------------
/* modifies a side
        changes it from a straight line (type "d") to a complex one (type "z")
        The change is done towards the opposite side (side between corners ca and cb)
        */

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

  side.points = [
    seg0.p1,
    seg0.p1,
    pa,
    pa,
    pa,
    pb,
    pb,
    pb,
    pc,
    pc,
    pc,
    seg0.p2,
    seg0.p2,
  ];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(
      seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv
    );
  } // pointAt
} // twist1

//-----------------------------------------------------------------------------
/* modifies a side
        changes it from a straight line (type "d") to a complex one (type "z")
        The change is done towards the opposite side (side between corners ca and cb)
        */

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
  sega = new Segment(seg0.p2, pc);
  const pd = sega.pointOnRelative(2 / 3);

  side.points = [seg0.p1, pb, pd, seg0.p2];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(
      seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv
    );
  } // pointAt
} // twist2

//-----------------------------------------------------------------------------
/* modifies a side
        changes it from a straight line (type "d") to a complex one (type "z")
        The change is done towards the opposite side (side between corners ca and cb)
        */

function twist3(side, ca, cb) {
  side.points = [side.points[0], side.points[1]];
} // twist3

//-----------------------------------------------------------------------------
class Piece {
  constructor(kx, ky) {
    // object with 4 sides
    this.ts = new Side(); // top side
    this.rs = new Side(); // right side
    this.bs = new Side(); // bottom side
    this.ls = new Side(); // left side
    this.kx = kx;
    this.ky = ky;
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  scale(puzzle) {
    this.ts.scale(puzzle);
    this.rs.scale(puzzle);
    this.bs.scale(puzzle);
    this.ls.scale(puzzle);
  } // Piece.scale
} // class Piece
//--------------------------------------------------------------
//--------------------------------------------------------------
class PolyPiece {
  // represents a group of pieces well positionned with respect  to each other.
  // pckxmin, pckxmax, pckymin and pckymax record the lowest and highest kx and ky
  // creates a canvas to draw polypiece on, and appends this canvas to puzzle.container
  constructor(initialPiece, puzzle) {
    this.pckxmin = initialPiece.kx;
    this.pckxmax = initialPiece.kx + 1;
    this.pckymin = initialPiece.ky;
    this.pckymax = initialPiece.ky + 1;
    this.pieces = [initialPiece];
    this.puzzle = puzzle;
    this.listLoops();

    this.canvas = document.createElement("CANVAS");
    // size and z-index will be defined later
    puzzle.container.appendChild(this.canvas);
    this.canvas.classList.add("polypiece");
    this.ctx = this.canvas.getContext("2d");
  } // PolyPiece

  // -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -   -
  /*
            this method
            - adds pieces of otherPoly to this PolyPiece
            - reorders the pieces inside the polypiece
            - adjusts coordinates of new pieces to make them consistent with this polyPiece
            - re-evaluates the z - index of the polyPieces
        */

  merge(otherPoly) {
    const orgpckxmin = this.pckxmin;
    const orgpckymin = this.pckymin;

    // remove otherPoly from list of polypieces
    const kOther = this.puzzle.polyPieces.indexOf(otherPoly);
    this.puzzle.polyPieces.splice(kOther, 1);

    // remove other canvas from container
    this.puzzle.container.removeChild(otherPoly.canvas);

    for (let k = 0; k < otherPoly.pieces.length; ++k) {
      this.pieces.push(otherPoly.pieces[k]);
      // watch leftmost, topmost... pieces
      if (otherPoly.pieces[k].kx < this.pckxmin)
        this.pckxmin = otherPoly.pieces[k].kx;
      if (otherPoly.pieces[k].kx + 1 > this.pckxmax)
        this.pckxmax = otherPoly.pieces[k].kx + 1;
      if (otherPoly.pieces[k].ky < this.pckymin)
        this.pckymin = otherPoly.pieces[k].ky;
      if (otherPoly.pieces[k].ky + 1 > this.pckymax)
        this.pckymax = otherPoly.pieces[k].ky + 1;
    } // for k

    // sort the pieces by increasing kx, ky

    this.pieces.sort(function (p1, p2) {
      if (p1.ky < p2.ky) return -1;
      if (p1.ky > p2.ky) return 1;
      if (p1.kx < p2.kx) return -1;
      if (p1.kx > p2.kx) return 1;
      return 0; // should not occur
    });

    // redefine consecutive edges
    this.listLoops();

    this.drawImage();
    this.moveTo(
      this.x + this.puzzle.scalex * (this.pckxmin - orgpckxmin),
      this.y + this.puzzle.scaley * (this.pckymin - orgpckymin)
    );

    this.puzzle.evaluateZIndex();
  } // merge

  // -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -   -
  ifNear(otherPoly) {
    let p1, p2;
    let puzzle = this.puzzle;

    // coordinates of origin of full picture for this PolyPieces
    let x = this.x - puzzle.scalex * this.pckxmin;
    let y = this.y - puzzle.scaley * this.pckymin;

    let ppx = otherPoly.x - puzzle.scalex * otherPoly.pckxmin;
    let ppy = otherPoly.y - puzzle.scaley * otherPoly.pckymin;
    if (mhypot(x - ppx, y - ppy) >= puzzle.dConnect) return false; // not close enough

    // this and otherPoly are in good relative position, have they a common side ?
    for (let k = this.pieces.length - 1; k >= 0; --k) {
      p1 = this.pieces[k];
      for (let ko = otherPoly.pieces.length - 1; ko >= 0; --ko) {
        p2 = otherPoly.pieces[ko];
        if (p1.kx == p2.kx && mabs(p1.ky - p2.ky) == 1) return true; // true neighbors found
        if (p1.ky == p2.ky && mabs(p1.kx - p2.kx) == 1) return true; // true neighbors found
      } // for k
    } // for k

    // nothing matches

    return false;
  } // ifNear

  // -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -

  /* algorithm to determine the boundary of a PolyPiece
            input : a table of cells, hopefully defining a 'good' PolyPiece, i.e. all connected together
            every cell is given as an object {kx: indice, ky: indice} representing an element of a 2D array.

            returned value : table of Loops, because the boundary may be made of several
        simple loops : there may be a 'hole' in a PolyPiece
        every loop is a list of consecutive edges,
        every edge if an object {kp: index, edge: b} where kp is the index of the cell ine
        the input array, and edge the side (0(top), 1(right), 2(bottom), 3(left))
        every edge contains kx and ky too, normally not used here

        This method does not depend on the fact that pieces have been scaled or not.
        */

  listLoops() {
    // internal : checks if an edge given by kx, ky is common with another cell
    // returns true or false
    const that = this;
    function edgeIsCommon(kx, ky, edge) {
      let k;
      switch (edge) {
        case 0:
          ky--;
          break; // top edge
        case 1:
          kx++;
          break; // right edge
        case 2:
          ky++;
          break; // bottom edge
        case 3:
          kx--;
          break; // left edge
      } // switch
      for (k = 0; k < that.pieces.length; k++) {
        if (kx == that.pieces[k].kx && ky == that.pieces[k].ky) return true; // we found the neighbor
      }
      return false; // not a common edge
    } // function edgeIsCommon

    // -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
    // internal : checks if an edge given by kx, ky is in tbEdges
    // return index in tbEdges, or false

    function edgeIsInTbEdges(kx, ky, edge) {
      let k;
      for (k = 0; k < tbEdges.length; k++) {
        if (
          kx == tbEdges[k].kx &&
          ky == tbEdges[k].ky &&
          edge == tbEdges[k].edge
        )
          return k; // found it
      }
      return false; // not found
    } // function edgeIsInTbEdges

    // -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -

    let tbLoops = []; // for the result
    let tbEdges = []; // set of edges which are not shared by 2 pieces of input
    let k;
    let kEdge; // to count 4 edges
    let lp; // for loop during its creation
    let currEdge; // current edge
    let tries; // tries counter
    let edgeNumber; // number of edge found during research
    let potNext;

    // table of tries

    let tbTries = [
      // if we are on edge 0 (top)
      [
        { dkx: 0, dky: 0, edge: 1 }, // try # 0
        { dkx: 1, dky: 0, edge: 0 }, // try # 1
        { dkx: 1, dky: -1, edge: 3 }, // try # 2
      ],
      // if we are on edge 1 (right)
      [
        { dkx: 0, dky: 0, edge: 2 },
        { dkx: 0, dky: 1, edge: 1 },
        { dkx: 1, dky: 1, edge: 0 },
      ],
      // if we are on edge 2 (bottom)
      [
        { dkx: 0, dky: 0, edge: 3 },
        { dkx: -1, dky: 0, edge: 2 },
        { dkx: -1, dky: 1, edge: 1 },
      ],
      // if we are on edge 3 (left)
      [
        { dkx: 0, dky: 0, edge: 0 },
        { dkx: 0, dky: -1, edge: 3 },
        { dkx: -1, dky: -1, edge: 2 },
      ],
    ];

    // create list of not shared edges (=> belong to boundary)
    for (k = 0; k < this.pieces.length; k++) {
      for (kEdge = 0; kEdge < 4; kEdge++) {
        if (!edgeIsCommon(this.pieces[k].kx, this.pieces[k].ky, kEdge))
          tbEdges.push({
            kx: this.pieces[k].kx,
            ky: this.pieces[k].ky,
            edge: kEdge,
            kp: k,
          });
      } // for kEdge
    } // for k

    while (tbEdges.length > 0) {
      lp = []; // new loop
      currEdge = tbEdges[0]; // we begin with first available edge
      lp.push(currEdge); // add it to loop
      tbEdges.splice(0, 1); // remove from list of available sides
      do {
        for (tries = 0; tries < 3; tries++) {
          potNext = tbTries[currEdge.edge][tries];
          edgeNumber = edgeIsInTbEdges(
            currEdge.kx + potNext.dkx,
            currEdge.ky + potNext.dky,
            potNext.edge
          );
          if (edgeNumber === false) continue; // can't here
          // new element in loop
          currEdge = tbEdges[edgeNumber]; // new current edge
          lp.push(currEdge); // add it to loop
          tbEdges.splice(edgeNumber, 1); // remove from list of available sides
          break; // stop tries !
        } // for tries
        if (edgeNumber === false) break; // loop is closed
      } while (1); // do-while exited by break
      tbLoops.push(lp); // add this loop to loops list
    } // while tbEdges...

    // replace components of loops by actual pieces sides
    this.tbLoops = tbLoops.map((loop) =>
      loop.map((edge) => {
        let cell = this.pieces[edge.kp];
        if (edge.edge == 0) return cell.ts;
        if (edge.edge == 1) return cell.rs;
        if (edge.edge == 2) return cell.bs;
        return cell.ls;
      })
    );
  } // polyPiece.listLoops

  // -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -   -

  drawPath(ctx, shiftx, shifty) {
    //    ctx.beginPath(); No, not for Path2D

    this.tbLoops.forEach((loop) => {
      let without = false;
      loop.forEach((side) => {
        side.drawPath(ctx, shiftx, shifty, without);
        without = true;
      });
      ctx.closePath();
    });
  } // PolyPiece.drawPath

  // -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -   -

  drawImage() {
    /* resizes canvas to be bigger than if pieces were perfect rectangles
            so that their shapes actually fit in the canvas
            copies the relevant part of gamePicture clipped by path
            adds shadow and emboss
            */
    //       if (this.pieces[0].kx!=1 ||this.pieces[0].ky!= 1) return;
    puzzle = this.puzzle;
    this.nx = this.pckxmax - this.pckxmin + 1;
    this.ny = this.pckymax - this.pckymin + 1;
    this.canvas.width = this.nx * puzzle.scalex;
    this.canvas.height = this.ny * puzzle.scaley;

    // difference between position in this canvas and position in gameImage

    this.offsx = (this.pckxmin - 0.5) * puzzle.scalex;
    this.offsy = (this.pckymin - 0.5) * puzzle.scaley;

    this.path = new Path2D();
    this.drawPath(this.path, -this.offsx, -this.offsy);

    // make shadow
    this.ctx.fillStyle = "none";
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.11)";
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 3;
    this.ctx.shadowOffsetY = 3;
    this.ctx.fill(this.path);
    this.ctx.shadowColor = "rgba(0, 0, 0, 0)"; // stop shadow effect

    this.pieces.forEach((pp, kk) => {
      this.ctx.save();

      const path = new Path2D();
      const shiftx = -this.offsx;
      const shifty = -this.offsy;
      pp.ts.drawPath(path, shiftx, shifty, false);
      pp.rs.drawPath(path, shiftx, shifty, true);
      pp.bs.drawPath(path, shiftx, shifty, true);
      pp.ls.drawPath(path, shiftx, shifty, true);
      path.closePath();

      this.ctx.clip(path);
      // do not copy from negative coordinates, does not work for all browsers
      const srcx = pp.kx ? (pp.kx - 0.5) * puzzle.scalex : 0;
      const srcy = pp.ky ? (pp.ky - 0.5) * puzzle.scaley : 0;

      const destx =
        (pp.kx ? 0 : puzzle.scalex / 2) +
        (pp.kx - this.pckxmin) * puzzle.scalex;
      const desty =
        (pp.ky ? 0 : puzzle.scaley / 2) +
        (pp.ky - this.pckymin) * puzzle.scaley;

      let w = 2 * puzzle.scalex;
      let h = 2 * puzzle.scaley;
      if (srcx + w > puzzle.gameCanvas.width)
        w = puzzle.gameCanvas.width - srcx;
      if (srcy + h > puzzle.gameCanvas.height)
        h = puzzle.gameCanvas.height - srcy;

      this.ctx.drawImage(
        puzzle.gameCanvas,
        srcx,
        srcy,
        w,
        h,
        destx,
        desty,
        w,
        h
      );

      this.ctx.translate(
        puzzle.embossThickness / 2,
        -puzzle.embossThickness / 2
      );
      // this.ctx.lineWidth = puzzle.embossThickness;
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      this.ctx.stroke(path);

      this.ctx.globalCompositeOperation = "destination-over";
      // 1. 填色
      // this.ctx.fillStyle = '#f5f5f5';
      // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 2. 或畫上背面圖片（你需準備好 `puzzle.backImage`）
      if (puzzle.backImage) {
        this.ctx.drawImage(
          puzzle.backImage,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
      }

      this.ctx.translate(-puzzle.embossThickness, puzzle.embossThickness);
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      this.ctx.stroke(path);
      this.ctx.restore();
    });
  } // PolyPiece.drawImage

  moveTo(x, y) {
    // sets the left, top properties (relative to container) of this.canvas
    this.x = x;
    this.y = y;
    this.canvas.style.left = x + "px";
    this.canvas.style.top = y + "px";
  } //

  moveToInitialPlace() {
    const puzzle = this.puzzle;
    this.moveTo(
      puzzle.offsx + (this.pckxmin - 0.5) * puzzle.scalex,
      puzzle.offsy + (this.pckymin - 0.5) * puzzle.scaley
    );
  }
} // class PolyPiece

//-----------------------------------------------------------------------------
class Puzzle {
  /*
            params contains :

        container : mandatory - given by id (string) or element
                    it will not be resized in this script

        ONLY ONE Puzzle object should be instanced.
            only "container is mandatory, nbPieces and pictures may be provided to get
            initial default values.
            Once a puzzle is solved (and event if not solved) another game can be played
            by changing the image file or the number of pieces, NOT by invoking new Puzzle
        */

  constructor(params) {
    this.autoStart = false;

    this.container =
      typeof params.container == "string"
        ? document.getElementById(params.container)
        : params.container;

    /* the following code will add the event Handlers several times if
            new Puzzle objects are created with same container.
            the presence of previous event listeners is NOT detectable
            */
    this.container.addEventListener("mousedown", (event) => {
      event.preventDefault();
      events.push({
        event: "touch",
        position: this.relativeMouseCoordinates(event),
      });
    });
    this.container.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        if (event.touches.length != 1) return;
        let ev = event.touches[0];
        events.push({
          event: "touch",
          position: this.relativeMouseCoordinates(ev),
        });
      },
      { passive: false }
    );

    this.container.addEventListener("mouseup", (event) => {
      event.preventDefault();
      handleLeave();
    });
    this.container.addEventListener("touchend", handleLeave);
    this.container.addEventListener("touchleave", handleLeave);
    this.container.addEventListener("touchcancel", handleLeave);

    this.container.addEventListener("mousemove", (event) => {
      event.preventDefault();
      // do not accumulate move events in events queue - keep only current one
      if (events.length && events[events.length - 1].event == "move")
        events.pop();
      events.push({
        event: "move",
        position: this.relativeMouseCoordinates(event),
      });
    });
    this.container.addEventListener(
      "touchmove",
      (event) => {
        event.preventDefault();
        if (event.touches.length != 1) return;
        let ev = event.touches[0];
        // do not accumulate move events in events queue - keep only current one
        if (events.length && events[events.length - 1].event == "move")
          events.pop();
        events.push({
          event: "move",
          position: this.relativeMouseCoordinates(ev),
        });
      },
      { passive: false }
    );

    /* create canvas to contain picture - will be styled later */
    this.gameCanvas = document.createElement("CANVAS");
    this.container.appendChild(this.gameCanvas);

    this.srcImage = new Image();
    this.imageLoaded = false;
    this.srcImage.addEventListener("load", () => imageLoaded(this));

    function handleLeave() {
      events.push({ event: "leave" }); //
    }
  } // Puzzle

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  getContainerSize() {
    let styl = window.getComputedStyle(this.container);

    /* dimensions of container */
    this.contWidth = parseFloat(styl.width);
    this.contHeight = parseFloat(styl.height);
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  create() {
    this.container.innerHTML = ""; // forget contents

    /* define the number of rows / columns to have almost square pieces
            and a total number as close as possible to the requested number
            */
    this.getContainerSize();
    this.computenxAndny();
    /* assuming the width of pieces is 1, computes their height
                (computenxAndny aims at making relativeHeight as close as possible to 1)
            */
    this.relativeHeight =
      this.srcImage.naturalHeight /
      this.ny /
      (this.srcImage.naturalWidth / this.nx);

    this.defineShapes({
      coeffDecentr: 0.12,
      twistf: [twist0, twist1, twist2, twist3][
        document.getElementById("shape").value - 1
      ],
    });

    this.polyPieces = [];
    this.pieces.forEach((row) =>
      row.forEach((piece) => {
        this.polyPieces.push(new PolyPiece(piece, this));
      })
    );

    arrayShuffle(this.polyPieces);
    this.evaluateZIndex();
  } // Puzzle.create

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /* computes the number of lines and columns of the puzzle,
            finding the best compromise between the requested number of pieces
            and a square shap for pieces
            result in this.nx and this.ny;
        */

  computenxAndny() {
    let kx,
      ky,
      width = this.srcImage.naturalWidth,
      height = this.srcImage.naturalHeight,
      npieces = this.nbPieces;
    let err,
      errmin = 1e9;
    let ncv, nch;

    let nHPieces = mround(msqrt((npieces * width) / height));
    let nVPieces = mround(npieces / nHPieces);

    /* based on the above estimation, we will try up to + / - 2 values
            and evaluate (arbitrary) quality criterion to keep best result
            */

    for (ky = 0; ky < 5; ky++) {
      ncv = nVPieces + ky - 2;
      for (kx = 0; kx < 5; kx++) {
        nch = nHPieces + kx - 2;
        err = (nch * height) / ncv / width;
        err = err + 1 / err - 2; // error on pieces dimensions ratio)
        err += mabs(1 - (nch * ncv) / npieces); // adds error on number of pieces

        if (err < errmin) {
          // keep smallest error
          errmin = err;
          this.nx = nch;
          this.ny = ncv;
        }
      } // for kx
    } // for ky
  } // computenxAndny

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  defineShapes(shapeDesc) {
    // define shapes as if the width and height of a piece were 1

    /* first, place the corners of the pieces
            at some distance of their theoretical position, except for edges
            */

    let { coeffDecentr, twistf } = shapeDesc;

    const corners = [];
    const nx = this.nx,
      ny = this.ny;
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
      } // for kx
    } // for ky

    // Array of pieces
    this.pieces = [];
    for (let ky = 0; ky < ny; ++ky) {
      this.pieces[ky] = [];
      for (let kx = 0; kx < nx; ++kx) {
        this.pieces[ky][kx] = np = new Piece(kx, ky);
        // top side
        if (ky == 0) {
          np.ts.points = [corners[ky][kx], corners[ky][kx + 1]];
          np.ts.type = "d";
        } else {
          np.ts = this.pieces[ky - 1][kx].bs.reversed();
        }
        // right side
        np.rs.points = [corners[ky][kx + 1], corners[ky + 1][kx + 1]];
        np.rs.type = "d";
        if (kx < nx - 1) {
          if (intAlea(2))
            // randomly twisted on one side of the side
            twistf(np.rs, corners[ky][kx], corners[ky + 1][kx]);
          else twistf(np.rs, corners[ky][kx + 2], corners[ky + 1][kx + 2]);
        }
        // left side
        if (kx == 0) {
          np.ls.points = [corners[ky + 1][kx], corners[ky][kx]];
          np.ls.type = "d";
        } else {
          np.ls = this.pieces[ky][kx - 1].rs.reversed();
        }
        // bottom side
        np.bs.points = [corners[ky + 1][kx + 1], corners[ky + 1][kx]];
        np.bs.type = "d";
        if (ky < ny - 1) {
          if (intAlea(2))
            // randomly twisted on one side of the side
            twistf(np.bs, corners[ky][kx + 1], corners[ky][kx]);
          else twistf(np.bs, corners[ky + 2][kx + 1], corners[ky + 2][kx]);
        }
      } // for kx
    } // for ky
  } // Puzzle.defineShapes

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  scale() {
    // 限制拼圖大小不超過畫面的80%
    const maxWidth = 0.8 * this.contWidth;
    const maxHeight = 0.8 * this.contHeight;

    // suppose image fits in height
    this.gameHeight = maxHeight;
    this.gameWidth =
      (this.gameHeight * this.srcImage.naturalWidth) /
      this.srcImage.naturalHeight;

    if (this.gameWidth > maxWidth) {
      // too wide, fits in width
      this.gameWidth = maxWidth;
      this.gameHeight =
        (this.gameWidth * this.srcImage.naturalHeight) /
        this.srcImage.naturalWidth;
    }
    /* get a scaled copy of the source picture into a canvas */
    //    this.gameCanvas = document.createElement('CANVAS');
    this.gameCanvas.width = this.gameWidth;
    this.gameCanvas.height = this.gameHeight;
    this.gameCtx = this.gameCanvas.getContext("2d");
    this.gameCtx.drawImage(
      this.srcImage,
      0,
      0,
      this.gameWidth,
      this.gameHeight
    );

    this.gameCanvas.classList.add("gameCanvas");
    this.gameCanvas.style.zIndex = 500;
    //    this.container.appendChild(this.gameCanvas)

    /* scale pieces */
    this.scalex = this.gameWidth / this.nx; // average width of pieces
    this.scaley = this.gameHeight / this.ny; // average height of pieces

    this.pieces.forEach((row) => {
      row.forEach((piece) => piece.scale(this));
    }); // this.pieces.forEach

    /* calculate offset for centering image in container */
    this.offsx = (this.contWidth - this.gameWidth) / 2;
    this.offsy = (this.contHeight - this.gameHeight) / 2;

    /* computes the distance below which two pieces connect
            depends on the actual size of pieces, with lower limit */
    this.dConnect = mmax(10, mmin(this.scalex, this.scaley) / 10);

    /* computes the thickness used for emboss effect */
    // from 2 (scalex = 0)  to 5 (scalex = 200), not more than 5
    this.embossThickness = mmin(2 + (this.scalex / 200) * (5 - 2), 5);
  } // Puzzle.scale

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  relativeMouseCoordinates(event) {
    /* takes mouse coordinates from mouse event
            returns coordinates relative to container, even if page is scrolled or zoommed */

    const br = this.container.getBoundingClientRect();
    return {
      x: event.clientX - br.x,
      y: event.clientY - br.y,
    };
  } // Puzzle.relativeMouseCoordinates

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  limitRectangle(rect) {
    /* limits the possible position for the coordinates of a piece, to prevent it from beeing out of the
            container */

    rect.x0 = mmin(
      mmax(rect.x0, -this.scalex / 2),
      this.contWidth - 1.5 * this.scalex
    );
    rect.x1 = mmin(
      mmax(rect.x1, -this.scalex / 2),
      this.contWidth - 1.5 * this.scalex
    );
    rect.y0 = mmin(
      mmax(rect.y0, -this.scaley / 2),
      this.contHeight - 1.5 * this.scaley
    );
    rect.y1 = mmin(
      mmax(rect.y1, -this.scaley / 2),
      this.contHeight - 1.5 * this.scaley
    );
  }
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  spreadInRectangle(rect) {
    this.limitRectangle(rect);
    this.polyPieces.forEach((pp) =>
      pp.moveTo(alea(rect.x0, rect.x1), alea(rect.y0, rect.y1))
    );
  } // spreadInRectangle
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  spreadSetInRectangle(set, rect) {
    this.limitRectangle(rect);
    set.forEach((pp) =>
      pp.moveTo(alea(rect.x0, rect.x1), alea(rect.y0, rect.y1))
    );
  } // spreadInRectangle
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  optimInitial() {
    /* based on :
            - container dimensions
            - picture dimensions
            - piece dimensions

            moves the pieces at the beginning of the game along one to four sides of the container
            避免與選單重疊
            */
    // 計算選單區域，避免重疊
    const menuWidth = window.innerWidth <= 600 ? 70 : 280; // 小屏漢堡按鈕或大屏完整選單
    const menuHeight = window.innerWidth <= 600 ? 70 : 450; // 預估選單高度
    const menuMargin = 30; // 額外邊距

    // extreme values for 1 piece polypieces，避開選單區域
    const minx = Math.max(-this.scalex / 2, menuWidth + menuMargin);
    const miny = -this.scaley / 2;
    const maxx = this.contWidth - 1.5 * this.scalex;
    const maxy = this.contHeight - 1.5 * this.scaley;
    // how much space left around image ?
    let freex = this.contWidth - this.gameWidth;
    let freey = this.contHeight - this.gameHeight;

    let where = [0, 0, 0, 0]; // to record on which sides pieces will be moved
    let rects = [];
    // first evaluation
    if (freex > 1.5 * this.scalex) {
      where[1] = 1; // right
      rects[1] = {
        x0: this.gameWidth - 0.5 * this.scalex,
        x1: maxx,
        y0: miny,
        y1: maxy,
      };
    }
    if (freex > 3 * this.scalex) {
      where[3] = 1; // left
      rects[3] = {
        x0: minx,
        x1: freex / 2 - 1.5 * this.scalex,
        y0: miny,
        y1: maxy,
      };
      rects[1].x0 = this.contWidth - freex / 2 - 0.5 * this.scalex;
    }
    if (freey > 1.5 * this.scaley) {
      where[2] = 1; // bottom
      rects[2] = {
        x0: minx,
        x1: maxx,
        y0: this.gameHeight - 0.5 * this.scaley,
        y1: this.contHeight - 1.5 * this.scaley,
      };
    }
    if (freey > 3 * this.scaley) {
      where[0] = 1; // top
      rects[0] = {
        x0: minx,
        x1: maxx,
        y0: miny,
        y1: freey / 2 - 1.5 * this.scaley,
      };
      rects[2].y0 = this.contHeight - freey / 2 - 0.5 * this.scaley;
    }
    if (where.reduce((sum, a) => sum + a) < 2) {
      // if no place defined yet, or only one place
      if (freex - freey > 0.2 * this.scalex || where[1]) {
        // significantly more place horizontally : to right
        this.spreadInRectangle({
          x0: this.gameWidth - this.scalex / 2,
          x1: maxx,
          y0: miny,
          y1: maxy,
        });
      } else if (freey - freex > 0.2 * this.scalex || where[2]) {
        // significantly more place vertically : to bottom
        this.spreadInRectangle({
          x0: minx,
          x1: maxx,
          y0: this.gameHeight - this.scaley / 2,
          y1: maxy,
        });
      } else {
        if (this.gameWidth > this.gameHeight) {
          // more wide than high : to bottom
          this.spreadInRectangle({
            x0: minx,
            x1: maxx,
            y0: this.gameHeight - this.scaley / 2,
            y1: maxy,
          });
        } else {
          // to right
          this.spreadInRectangle({
            x0: this.gameWidth - this.scalex / 2,
            x1: maxx,
            y0: miny,
            y1: maxy,
          });
        }
      }
      return;
    }
    /* more than one area to put the pieces
     */
    let nrects = [];
    rects.forEach((rect) => {
      nrects.push(rect);
    });
    let k0 = 0;
    const npTot = this.nx * this.ny;
    for (let k = 0; k < nrects.length; ++k) {
      let k1 = mround(((k + 1) / nrects.length) * npTot);
      this.spreadSetInRectangle(this.polyPieces.slice(k0, k1), nrects[k]);
      k0 = k1;
    }
    arrayShuffle(this.polyPieces);
    this.evaluateZIndex();
  } // optimInitial

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  evaluateZIndex() {
    /* re-evaluates order of polypieces in puzzle after a merge
            the polypieces must be in decreasing order of size(number of pieces),
            preserving the previous order as much as possible
            */
    for (let k = this.polyPieces.length - 1; k > 0; --k) {
      if (
        this.polyPieces[k].pieces.length > this.polyPieces[k - 1].pieces.length
      ) {
        // swap pieces if not in right order
        [this.polyPieces[k], this.polyPieces[k - 1]] = [
          this.polyPieces[k - 1],
          this.polyPieces[k],
        ];
      }
    }
    // re-assign zIndex
    this.polyPieces.forEach((pp, k) => {
      pp.canvas.style.zIndex = k + 10;
    });
    this.zIndexSup = this.polyPieces.length + 10; // higher than 'normal' zIndices
  } // Puzzle.evaluateZIndex
} // class Puzzle
//-----------------------------------------------------------------------------

let loadFile;
{
  // scope for loadFile

  let options;

  let elFile = document.createElement("input");
  elFile.setAttribute("type", "file");
  elFile.style.display = "none";
  elFile.addEventListener("change", getFile);

  function getFile() {
    if (this.files.length == 0) {
      //      returnLoadFile ({fail: 'no file'});
      return;
    }
    let file = this.files[0];
    let reader = new FileReader();

    reader.addEventListener("load", () => {
      puzzle.srcImage.src = reader.result;
    });
    reader.readAsDataURL(this.files[0]);
  } // getFile

  loadFile = function (ooptions) {
    elFile.setAttribute("accept", "image/*");
    elFile.value = null; // else, re-selecting the same file does not trigger "change"
    elFile.click();
  }; // loadFile
} //  // scope for loadFile

function loadInitialFile() {
  puzzle.srcImage.src = "Jinu_2.jpg";
}
//-----------------------------------------------------------------------------
function imageLoaded(puzzle) {
  events.push({ event: "srcImageLoaded" });
  puzzle.imageLoaded = true;
} // imageLoaded

//-----------------------------------------------------------------------------
function fitImage(img, width, height) {
  /* The image is a child of puzzle.container. It will be styled to be as big as possible, not wider than width,
        not higher than height, centered in puzzle.container
        (width and height must be less than or equal to the container dimensions)
        */

  let wn = img.naturalWidth;
  let hn = img.naturalHeight;
  let w = width;
  let h = (w * hn) / wn;
  if (h > height) {
    h = height;
    w = (h * wn) / hn;
  }
  img.style.position = "absolute";
  img.style.width = w + "px";
  img.style.height = h + "px";
  img.style.top = "50%";
  img.style.left = "50%";
  img.style.transform = "translate(-50%,-50%)";
}

//-----------------------------------------------------------------------------
let animate;
let events = []; // queue for events

{
  // scope for animate
  let state = 0;
  let moving; // for information about moved piece
  let tmpImage;

  animate = function () {
    requestAnimationFrame(animate);

    let event;
    if (events.length) event = events.shift(); // read event from queue
    if (event && event.event == "reset") state = 0;
    if (event && event.event == "srcImageLoaded") state = 0;
    // resize event
    if (event && event.event == "resize") {
      // remember dimensions of container before resize
      puzzle.prevWidth = puzzle.contWidth;
      puzzle.prevHeight = puzzle.contHeight;
      puzzle.getContainerSize();
      if (state == 15 || state > 60) {
        // resize initial or final picture
        puzzle.getContainerSize();
        fitImage(tmpImage, puzzle.contWidth * 0.95, puzzle.contHeight * 0.95);
      } else if (state >= 25) {
        // resize pieces
        puzzle.prevGameWidth = puzzle.gameWidth;
        puzzle.prevGameHeight = puzzle.gameHeight;
        puzzle.scale();
        let reScale = puzzle.contWidth / puzzle.prevWidth;
        puzzle.polyPieces.forEach((pp) => {
          // compute new position : game centered homothety
          let nx =
            puzzle.contWidth / 2 - (puzzle.prevWidth / 2 - pp.x) * reScale;
          let ny =
            puzzle.contHeight / 2 - (puzzle.prevHeight / 2 - pp.y) * reScale;
          // enforce pieces to stay in game area
          nx = mmin(
            mmax(nx, -puzzle.scalex / 2),
            puzzle.contWidth - 1.5 * puzzle.scalex
          );
          ny = mmin(
            mmax(ny, -puzzle.scaley / 2),
            puzzle.contHeight - 1.5 * puzzle.scaley
          );

          pp.moveTo(nx, ny);
          pp.drawImage();
        }); // puzzle.polypieces.forEach
      }

      return;
    } // resize event
    //        if (event) console.log (event);
    switch (state) {
      /* initialisation */
      case 0:
        state = 10;
        break;

      /* wait for image loaded and other required parameters*/
      case 10:
        if (!puzzle.imageLoaded) return;
        //                if (!(puzzle.autoStart || event && event.event == "srcImageLoaded")) return;

        // display centered initial image
        puzzle.container.innerHTML = ""; // forget contents
        tmpImage = document.createElement("img");
        tmpImage.src = puzzle.srcImage.src;
        puzzle.getContainerSize();
        fitImage(tmpImage, puzzle.contWidth * 0.95, puzzle.contHeight * 0.95);
        tmpImage.style.boxShadow = "4px 4px 4px rgba(0, 0, 0, 0.5)";
        puzzle.container.appendChild(tmpImage);
        state = 15;
        break;

      /* wait for choice of number of pieces */
      case 15:
        if (autoStart) event = { event: "nbpieces", nbpieces: 12 }; // auto start
        autoStart = false; // not twice
        if (!event) return;
        if (event.event == "nbpieces") {
          puzzle.nbPieces = event.nbpieces;
          state = 20;
        } else if (event.event == "srcImageLoaded") {
          state = 10;
          return;
        } else return;

      case 20:
        menu.close();
        /* prepare puzzle */
        puzzle.create(); // create shape of pieces, independant of size
        puzzle.scale();
        puzzle.polyPieces.forEach((pp) => {
          pp.drawImage();
          pp.moveToInitialPlace();
        }); // puzzle.polypieces.forEach
        puzzle.gameCanvas.style.top = puzzle.offsy + "px";
        puzzle.gameCanvas.style.left = puzzle.offsx + "px";
        puzzle.gameCanvas.style.display = "block";
        state = 25;
        break;

      case 25: // spread pieces
        puzzle.gameCanvas.style.display = "none"; // hide reference image
        puzzle.polyPieces.forEach((pp) => {
          pp.canvas.classList.add("moving");
        });
        state = 30;
        break;

      case 30: // launch movement
        puzzle.optimInitial(); // initial "optimal" spread position

        /* this time out must be a bit longer than the css .moving transition-duration */
        setTimeout(() => events.push({ event: "finished" }), 1200);
        state = 35;
        break;

      case 35: // wait for end of movement
        if (!event || event.event != "finished") return;
        puzzle.polyPieces.forEach((pp) => {
          pp.canvas.classList.remove("moving");
        });

        state = 50;

        break;

      /* wait for user grabbing a piece or other action */
      case 50:
        if (!event) return;
        if (event.event == "nbpieces") {
          puzzle.nbPieces = event.nbpieces;
          state = 20;
          return;
        }
        if (event.event != "touch") return;
        moving = {
          xMouseInit: event.position.x,
          yMouseInit: event.position.y,
        };

        /* evaluates if contact inside a PolyPiece, by decreasing z-index */
        for (let k = puzzle.polyPieces.length - 1; k >= 0; --k) {
          let pp = puzzle.polyPieces[k];
          if (
            pp.ctx.isPointInPath(
              pp.path,
              event.position.x - pp.x,
              event.position.y - pp.y
            )
          ) {
            moving.pp = pp;
            moving.ppXInit = pp.x;
            moving.ppYInit = pp.y;
            // move selected piece to top of polypieces stack
            puzzle.polyPieces.splice(k, 1);
            puzzle.polyPieces.push(pp);
            pp.canvas.style.zIndex = puzzle.zIndexSup; // to foreground
            state = 55;
            return;
          }
        } // for k
        break;

      case 55: // moving piece
        if (!event) return;
        switch (event.event) {
          case "move":
            moving.pp.moveTo(
              event.position.x - moving.xMouseInit + moving.ppXInit,
              event.position.y - moving.yMouseInit + moving.ppYInit
            );
            break;
          case "leave":
            // check if moved polypiece is close to a matching other polypiece
            // check repeatedly since polypieces moved by merging may come close to other polypieces
            let doneSomething;
            do {
              doneSomething = false;
              for (let k = puzzle.polyPieces.length - 1; k >= 0; --k) {
                let pp = puzzle.polyPieces[k];
                if (pp == moving.pp) continue; // don't match with myself
                if (moving.pp.ifNear(pp)) {
                  // a match !
                  // compare polypieces sizes to move smallest one
                  if (pp.pieces.length > moving.pp.pieces.length) {
                    pp.merge(moving.pp);
                    moving.pp = pp; // memorize piece to follow
                  } else {
                    moving.pp.merge(pp);
                  }
                  doneSomething = true;
                  break;
                }
              } // for k
            } while (doneSomething);
            // not at its right place
            puzzle.evaluateZIndex();
            state = 50;
            if (puzzle.polyPieces.length == 1) state = 60; // won!
            return;
        } // switch (event.event)

        break;

      case 60: // winning
        puzzle.container.innerHTML = "";
        puzzle.getContainerSize();
        fitImage(tmpImage, puzzle.contWidth * 0.95, puzzle.contHeight * 0.95);
        tmpImage.style.boxShadow = "4px 4px 4px rgba(0, 0, 0, 0.5)";
        //              tmpImage.style.top=(puzzle.polyPieces[0].y + puzzle.scaley / 2) / puzzle.contHeight * 100 + 50 + "%" ;
        //              tmpImage.style.left=(puzzle.polyPieces[0].x + puzzle.scalex / 2) / puzzle.contWidth * 100 + 50 + "%" ;
        tmpImage.style.left =
          ((puzzle.polyPieces[0].x + puzzle.scalex / 2 + puzzle.gameWidth / 2) /
            puzzle.contWidth) *
            100 +
          "%";
        tmpImage.style.top =
          ((puzzle.polyPieces[0].y +
            puzzle.scaley / 2 +
            puzzle.gameHeight / 2) /
            puzzle.contHeight) *
            100 +
          "%";

        tmpImage.classList.add("moving");
        setTimeout(() => (tmpImage.style.top = tmpImage.style.left = "50%"), 0);
        puzzle.container.appendChild(tmpImage);

        // 添加拼圖完成旋轉動畫
        setTimeout(() => {
          tmpImage.classList.add("puzzle-complete-animation");
        }, 500);

        // 添加煙火特效
        setTimeout(() => {
          createFireworks();
        }, 1000);

        state = 65;
        menu.open();

      case 65: // wait for new number of pieces - of new picture
        if (event && event.event == "nbpieces") {
          puzzle.nbPieces = event.nbpieces;
          state = 20;
          return;
        }
        break;

      case 9999:
        break;
      default:
        let st = state;
        state = 9999; // to display message beyond only once
        throw "oops, unknown state " + st;
    } // switch(state)
  }; // animate
} // scope for animate
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------

/* analyze menu */
let menu = (function () {
  let menu = { items: [] };
  document.querySelectorAll("#menu li").forEach((menuEl) => {
    let kItem = menu.items.length;
    let item = { element: menuEl, kItem: kItem };
    menu.items[kItem] = item;
  });

  menu.open = function () {
    const menuElement = document.getElementById("menu");
    menuElement.classList.add("open");
    menu.opened = true;
  };
  menu.close = function () {
    const menuElement = document.getElementById("menu");
    menuElement.classList.remove("open");
    menu.opened = false;
  };

  // 選單收起/展開控制（所有屏幕尺寸）
  menu.items[0].element.addEventListener("click", () => {
    if (menu.opened) menu.close();
    else menu.open();
  });

  // 視窗大小改變時的處理
  window.addEventListener("resize", () => {
    // 保持當前狀態，不自動關閉
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

window.addEventListener("resize", (event) => {
  // do not accumulate resize events in events queue - keep only current one
  if (events.length && events[events.length - 1].event == "resize") return;
  events.push({ event: "resize" });
});

// 華麗煙火特效函數
function createFireworks() {
  const colors = [
    "#ff1744",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
  ];
  const gradients = [
    "radial-gradient(circle, #ff1744, #ff5722)",
    "radial-gradient(circle, #e91e63, #9c27b0)",
    "radial-gradient(circle, #3f51b5, #2196f3)",
    "radial-gradient(circle, #00bcd4, #4caf50)",
    "radial-gradient(circle, #ffeb3b, #ff9800)",
  ];

  // 創建更多煙火爆炸點
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.7;

      // 每個爆炸點創建更多粒子
      for (let j = 0; j < 30; j++) {
        const particle = document.createElement("div");
        particle.className = "firework-particle";
        particle.style.position = "fixed";
        particle.style.left = x + "px";
        particle.style.top = y + "px";

        // 更大的粒子尺寸
        const size = 8 + Math.random() * 12;
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.borderRadius = "50%";

        // 使用漸層背景
        if (Math.random() > 0.5) {
          particle.style.background =
            gradients[Math.floor(Math.random() * gradients.length)];
        } else {
          particle.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];
        }

        particle.style.pointerEvents = "none";
        particle.style.zIndex = "9999";
        particle.style.boxShadow = `0 0 ${size * 3}px ${
          colors[Math.floor(Math.random() * colors.length)]
        }`;

        // 隨機方向和更大距離
        const angle = (j / 30) * 2 * Math.PI + Math.random() * 0.8;
        const distance = 100 + Math.random() * 250;
        const endX = x + Math.cos(angle) * distance;
        const endY = y + Math.sin(angle) * distance + Math.random() * 80; // 添加重力效果

        // 設定動畫
        particle.style.transition =
          "all 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        particle.style.opacity = "1";

        document.body.appendChild(particle);

        // 觸發動畫
        setTimeout(() => {
          particle.style.left = endX + "px";
          particle.style.top = endY + "px";
          particle.style.opacity = "0";
          particle.style.transform = `scale(0) rotate(${
            Math.random() * 720
          }deg)`;
        }, 10);

        // 清理粒子
        setTimeout(() => {
          if (particle.parentNode) {
            particle.remove();
          }
        }, 2600);
      }

      // 添加星形爆炸效果
      for (let k = 0; k < 12; k++) {
        const star = document.createElement("div");
        star.style.position = "fixed";
        star.style.left = x + "px";
        star.style.top = y + "px";
        star.style.width = "4px";
        star.style.height = "30px";
        star.style.backgroundColor = "#ffffff";
        star.style.pointerEvents = "none";
        star.style.zIndex = "9999";
        star.style.transformOrigin = "center";
        star.style.transform = `rotate(${k * 30}deg)`;
        star.style.boxShadow = "0 0 15px #ffffff";
        star.style.transition = "all 1.5s ease-out";
        star.style.opacity = "1";

        document.body.appendChild(star);

        setTimeout(() => {
          star.style.opacity = "0";
          star.style.transform = `rotate(${k * 30}deg) scale(4)`;
        }, 10);

        setTimeout(() => {
          if (star.parentNode) {
            star.remove();
          }
        }, 1600);
      }

      // 添加圓形波紋效果
      for (let w = 0; w < 3; w++) {
        const wave = document.createElement("div");
        wave.style.position = "fixed";
        wave.style.left = x - 20 + "px";
        wave.style.top = y - 20 + "px";
        wave.style.width = "40px";
        wave.style.height = "40px";
        wave.style.border =
          "3px solid " + colors[Math.floor(Math.random() * colors.length)];
        wave.style.borderRadius = "50%";
        wave.style.pointerEvents = "none";
        wave.style.zIndex = "9998";
        wave.style.transition = "all 2s ease-out";
        wave.style.opacity = "0.8";

        document.body.appendChild(wave);

        setTimeout(() => {
          wave.style.width = "300px";
          wave.style.height = "300px";
          wave.style.left = x - 150 + "px";
          wave.style.top = y - 150 + "px";
          wave.style.opacity = "0";
        }, w * 200 + 10);

        setTimeout(() => {
          if (wave.parentNode) {
            wave.remove();
          }
        }, 2200);
      }
    }, i * 120);
  }
}

puzzle = new Puzzle({ container: "forPuzzle" });
autoStart = isMiniature(); // used for nice miniature in CodePen

loadInitialFile();
requestAnimationFrame(animate);
