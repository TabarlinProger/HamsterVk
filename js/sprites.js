/**
 * sprites.js — загрузка и управление спрайтами хомяка и труб
 * Move.png: 16 кадров бега (4×4, одно направление)
 * Hit.png:  4 кадра удара (1×4, одно направление)
 * Idle.png: 16 кадров покоя (4×4, одно направление)
 * Tube.png: 6 спрайтов труб (3 прямых сверху, 3 угловых снизу)
 * Направление задаётся поворотом спрайта.
 */
class SpriteManager {
  constructor() {
    this.moveSheet = null;
    this.hitSheet = null;
    this.idleSheet = null;
    this.tubeSheet = null;
    this.teleportSheet = null;
    this.ready = false;
    this._loaded = 0;

    this.moveFrames = [];
    this.hitFrames = [];
    this.idleFrames = [];
    this.tubeStraight = [];
    this.tubeCorner = [];
    this.teleportPipes = [];

    this._load();
  }

  _load() {
    var self = this;
    this.moveSheet = new Image();
    this.moveSheet.onload = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.moveSheet.onerror = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.moveSheet.src = 'assets/Move.png';

    this.hitSheet = new Image();
    this.hitSheet.onload = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.hitSheet.onerror = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.hitSheet.src = 'assets/Hit.png';

    this.idleSheet = new Image();
    this.idleSheet.onload = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.idleSheet.onerror = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.idleSheet.src = 'assets/Idle.png';

    this.tubeSheet = new Image();
    this.tubeSheet.onload = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.tubeSheet.onerror = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.tubeSheet.src = 'assets/Tube.png';

    this.teleportSheet = new Image();
    this.teleportSheet.onload = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.teleportSheet.onerror = function() { self._loaded++; if (self._loaded >= 5) self._extract(); };
    this.teleportSheet.src = 'assets/Teleport.png';
  }

  _extract() {
    this.moveFrames = this._extractGrid(this.moveSheet, [
      { top: 14, bottom: 273 },
      { top: 288, bottom: 552 },
      { top: 582, bottom: 834 },
      { top: 856, bottom: 1123 }
    ], [
      { left: 7, right: 269 },
      { left: 283, right: 543 },
      { left: 558, right: 820 },
      { left: 833, right: 1095 }
    ]);

    this.hitFrames = this._extractGrid(this.hitSheet, [
      { top: 10, bottom: 281 }
    ], [
      { left: 17, right: 251 },
      { left: 280, right: 513 },
      { left: 542, right: 779 },
      { left: 794, right: 1046 }
    ]);

    this.idleFrames = this._extractGrid(this.idleSheet, [
      { top: 4, bottom: 258 },
      { top: 269, bottom: 525 },
      { top: 536, bottom: 792 },
      { top: 805, bottom: 1059 }
    ], [
      { left: 2, right: 257 },
      { left: 264, right: 517 },
      { left: 525, right: 778 },
      { left: 786, right: 1040 }
    ]);

    this.tubeStraight = this._extractTubeRow(this.tubeSheet,
      { top: 59, bottom: 135 },
      [{ left: 16, right: 171 }, { left: 178, right: 333 }, { left: 341, right: 496 }]
    );
    this.tubeCorner = this._extractTubeRow(this.tubeSheet,
      { top: 215, bottom: 333 },
      [{ left: 47, right: 170 }, { left: 211, right: 333 }, { left: 375, right: 497 }]
    );

    this.teleportPipes = this._extractTubeRow(this.teleportSheet,
      { top: 180, bottom: 331 },
      [{ left: 19, right: 171 }, { left: 180, right: 332 }, { left: 340, right: 492 }]
    );

    this.ready = true;
  }

  _extractGrid(img, rowBounds, colBounds) {
    var frames = [];
    for (var r = 0; r < rowBounds.length; r++) {
      for (var c = 0; c < colBounds.length; c++) {
        var rb = rowBounds[r];
        var cb = colBounds[c];
        var w = cb.right - cb.left;
        var h = rb.bottom - rb.top;
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, cb.left, rb.top, w, h, 0, 0, w, h);
        frames.push(canvas);
      }
    }
    return frames;
  }

  _extractTubeRow(img, rowBounds, colBounds) {
    var frames = [];
    for (var i = 0; i < colBounds.length; i++) {
      var cb = colBounds[i];
      var w = cb.right - cb.left;
      var h = rowBounds.bottom - rowBounds.top;
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, cb.left, rowBounds.top, w, h, 0, 0, w, h);
      frames.push(canvas);
    }
    return frames;
  }

  getMoveFrame(index) {
    if (this.moveFrames.length === 0) return null;
    return this.moveFrames[index % this.moveFrames.length];
  }

  getHitFrame(index) {
    if (this.hitFrames.length === 0) return null;
    return this.hitFrames[index % this.hitFrames.length];
  }

  getIdleFrame(index) {
    if (this.idleFrames.length === 0) return null;
    return this.idleFrames[index % this.idleFrames.length];
  }

  getTubeSprite(type, colorIndex) {
    var arr = (type === 'straight') ? this.tubeStraight : this.tubeCorner;
    if (arr.length === 0) return null;
    return arr[(colorIndex || 0) % arr.length];
  }

  getTeleportSprite(colorIndex) {
    if (this.teleportPipes.length === 0) return null;
    return this.teleportPipes[(colorIndex || 0) % this.teleportPipes.length];
  }

  static rotationFor(direction) {
    var map = { up: Math.PI, right: -Math.PI / 2, down: 0, left: Math.PI / 2 };
    return map[direction] || 0;
  }
}

var SPRITES = new SpriteManager();
