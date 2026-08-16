class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.viewportWidth = canvas.width;
    this.viewportHeight = canvas.height;
    this.tileSize = 60;
    this.offsetX = 0;
    this.offsetY = 0;
    this._frameTime = 0;
    this._animTime = 0;
    this._idleInterval = 75;
    this._runInterval = 50;
    this._bumpInterval = 40;
    var self = this;
    this._bgImages = [];
    this._bgReady = false;
    this._bgIndex = 0;
    for (var bi = 0; bi < 10; bi++) {
      (function(idx) {
        var img = new Image();
        img.onload = function() { self._bgReady = true; };
        img.src = 'assets/Background_' + idx + '.webp';
        self._bgImages.push(img);
      })(bi);
    }
    this._tileImage = new Image();
    this._tileReady = false;
    this._tileImage.onload = function() { self._tileReady = true; };
    this._tileImage.src = 'assets/Tile.webp';
    this._portalGlow = 0;
  }

  setBackgroundIndex(idx) {
    this._bgIndex = Math.max(0, Math.min(9, idx || 0));
  }

  setViewport(w, h, dpr) {
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.dpr = dpr || 1;
  }

  layout(board) {
    this._board = board;
    var w = this.viewportWidth || this.canvas.width, h = this.viewportHeight || this.canvas.height;
    var gap = CONFIG.CELL_GAP;
    // Compute tile size based on reference 6x6 grid
    var maxW = (w - 40) / 6 - gap;
    var maxH = (h - 120) / 6 - gap;
    var refSize = Math.floor(Math.min(maxW, maxH));
    // Scale for actual grid size to maintain constant total area
    var scale = 6 / Math.max(board.rows, board.cols);
    this._baseTileSize = Math.max(CONFIG.MIN_TILE_SIZE, Math.min(CONFIG.MAX_TILE_SIZE, Math.floor(refSize * scale)));
    this._baseTileSize = Math.floor(this._baseTileSize * 0.855);  // -14.5% grid area
    this._mobileLayout = w <= 700 || (w <= 1000 && h <= 500);
    var mobileScale = this._mobileLayout ? 1.08 : 1;
    this.tileSize = Math.floor(this._baseTileSize * 1.1 * mobileScale);
    var gridW = board.cols * (this.tileSize + gap) - gap;
    var gridH = board.rows * (this.tileSize + gap) - gap;
    this.offsetX = Math.floor((w - gridW) / 2);
    this.offsetY = Math.floor((h - gridH) / 2) + (this._mobileLayout ? 0 : 10);
  }

  cellCenter(row, col) {
    var gap = CONFIG.CELL_GAP;
    return { x: this.offsetX + col * (this.tileSize + gap) + this.tileSize / 2, y: this.offsetY + row * (this.tileSize + gap) + this.tileSize / 2 };
  }

  pixelToCell(px, py) {
    var gap = CONFIG.CELL_GAP;
    var col = Math.floor((px - this.offsetX) / (this.tileSize + gap));
    var row = Math.floor((py - this.offsetY) / (this.tileSize + gap));
    if (this._board && (row < 0 || col < 0 || row >= this._board.rows || col >= this._board.cols)) return null;
    var cc = this.cellCenter(row, col);
    var half = this.tileSize / 2;
    if (Math.abs(px - cc.x) > half || Math.abs(py - cc.y) > half) return null;
    return { row: row, col: col };
  }

  draw(board, animState) {
    if (!animState) animState = {};
    var ctx = this.ctx, w = this.viewportWidth || this.canvas.width, h = this.viewportHeight || this.canvas.height;
    var now = performance.now();
    if (!this._frameTime) this._frameTime = now;
    var dt = now - this._frameTime;
    this._frameTime = now;
    this._animTime = (this._animTime || 0) + dt;
    this._portalGlow = 0.4 + 0.3 * Math.sin(this._animTime * 0.003);
    ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    this._drawBackground(ctx, w, h, board, animState.reveal || 0);
    this._drawGrid(ctx, board);
    this._drawTiles(ctx, board, animState, dt);
    this._drawTubes(ctx, board);
  }

  _drawBackground(ctx, w, h, board, reveal) {
    var drawn = false;
    var bgImg = this._bgImages[this._bgIndex];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      try { ctx.drawImage(bgImg, 0, 0, w, h); drawn = true; } catch (e) {}
    }
    if (!drawn && this._bgImages[0] && this._bgImages[0].complete && this._bgImages[0].naturalWidth > 0) {
      try { ctx.drawImage(this._bgImages[0], 0, 0, w, h); drawn = true; } catch (e) {}
    }
    if (!drawn) {
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(0.5, '#16213e'); grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    }
    if (reveal >= 1) this._drawRevealedBg(ctx, w, h, board);
    var gap = CONFIG.CELL_GAP;
    var gridW = board.cols * (this.tileSize + gap) - gap;
    var gridH = board.rows * (this.tileSize + gap) - gap;
    var r = CONFIG.CELL_RADIUS * this.tileSize;
    var pad = 8;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.06 + reveal * 0.04) + ')';
    this._roundRect(ctx, this.offsetX - pad, this.offsetY - pad, gridW + pad * 2, gridH + pad * 2, r + pad);
    ctx.fill();
  }

  _drawRevealedBg(ctx, w, h, board) {
    var seed = board.backgroundId || 1, size = 30;
    ctx.save(); ctx.globalAlpha = 0.15;
    for (var y = 0; y < h; y += size)
      for (var x = 0; x < w; x += size)
        { ctx.fillStyle = 'hsl(' + ((x * 0.3 + y * 0.7 + seed * 40) % 360) + ', 50%, 65%)'; ctx.fillRect(x, y, size - 1, size - 1); }
    ctx.restore();
  }

  _drawGrid(ctx, board) {
    var gap = CONFIG.CELL_GAP, ts = this.tileSize, r = CONFIG.CELL_RADIUS * ts;
    var gridW = board.cols * (ts + gap) - gap;
    var gridH = board.rows * (ts + gap) - gap;

    // Draw Tile.webp +20%, no clipping
    if (this._tileReady) {
      var scale = 1.20;
      var tw = gridW * scale, th = gridH * scale;
      var tx = this.offsetX - (tw - gridW) / 2;
      var ty = this.offsetY - (th - gridH) / 2;
      try { ctx.drawImage(this._tileImage, tx, ty, tw, th); } catch(e) {}
    }

    // Internal grid lines only — no outer border
    ctx.strokeStyle = 'rgba(0,0,0,0.20)';
    ctx.lineWidth = 1.5;
    for (var row = 1; row < board.rows; row++) {
      var ly = this.offsetY + row * (ts + gap) - gap / 2;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, ly);
      ctx.lineTo(this.offsetX + gridW, ly);
      ctx.stroke();
    }
    for (var col = 1; col < board.cols; col++) {
      var lx = this.offsetX + col * (ts + gap) - gap / 2;
      ctx.beginPath();
      ctx.moveTo(lx, this.offsetY);
      ctx.lineTo(lx, this.offsetY + gridH);
      ctx.stroke();
    }
  }

  _drawTubes(ctx, board) {
    if (board.tubes.size === 0 || !SPRITES.ready) return;
    var half = this._baseTileSize / 2, baseMax = this._baseTileSize * 1.15, self = this;
    board.tubes.forEach(function(tube, key) {
      var parts = key.split(','), row = parseInt(parts[0]), col = parseInt(parts[1]);
      var center = self.cellCenter(row, col);

      if (tube.type === 'teleport') {
        ctx.save();
        ctx.translate(center.x, center.y);
        var teleportSprite = SPRITES.getTeleportSprite(tube.colorIndex || 0);
        if (teleportSprite) {
          var tsw = teleportSprite.width, tsh = teleportSprite.height;
          var tScale = baseMax * 0.95 / Math.max(tsw, tsh);
          var tdw = tsw * tScale, tdh = tsh * tScale;
          ctx.drawImage(teleportSprite, -tdw / 2, -tdh / 2, tdw, tdh);
        }

        ctx.restore();
        return;
      }

      var sprite = SPRITES.getTubeSprite(tube.type, tube.colorIndex || 0);
      if (!sprite) return;
      var sw = sprite.width, sh = sprite.height;
      var maxSize = (tube.type === 'straight') ? baseMax : baseMax * 0.90;
      var aspectScale = maxSize / Math.max(sw, sh);
      var dw = sw * aspectScale, dh = sh * aspectScale;
      if (tube.type === 'straight') { dw *= 0.95; dh *= 1.10; }
      var angle = 0;
      if (tube.type === 'straight') { angle = (tube.orientation % 2 === 0) ? 0 : Math.PI / 2; }
      else { angle = (tube.orientation || 0) * Math.PI / 2; }
      ctx.save(); ctx.translate(center.x, center.y); ctx.rotate(angle);
      if (tube.type === 'rotatable' || tube.rotatable) {
        ctx.strokeStyle = CONFIG.ROTATING_INDICATOR; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        var indicatorSpeed = self._mobileLayout ? 0.03 : 0.05;
        ctx.lineDashOffset = -self._animTime * indicatorSpeed;
        ctx.beginPath(); ctx.arc(0, 0, half + 3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.drawImage(sprite, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    });
  }

  _drawTiles(ctx, board, animState, dt) {
    var animMoves = animState.animMoves || [], exits = animState.exits || [];
    var shakes = animState.shakes || [], hintTileId = animState.hintTileId != null ? animState.hintTileId : null;
    this._idleFrame = Math.floor(this._animTime / this._idleInterval) % 16;
    this._runFrame = Math.floor(this._animTime / this._runInterval) % 16;
    var animTileIds = new Set();
    animMoves.forEach(function(m) { animTileIds.add(m.tile.id); });
    exits.forEach(function(e) { animTileIds.add(e.tile.id); });
    for (var i = 0; i < board.tiles.length; i++) {
      var tile = board.tiles[i];
      if (animTileIds.has(tile.id)) continue;
      var pos = this.cellCenter(tile.row, tile.col), shake = null;
      for (var si = 0; si < shakes.length; si++) { if (shakes[si].tile.id === tile.id) { shake = shakes[si]; break; } }
      var hint = tile.id === hintTileId;
      if (shake) {
        if (shake.progress < 0.4) {
          var bumpFrame = Math.min(3, Math.floor(shake.progress / 0.4 * 4));
          this._drawSprite(ctx, tile.direction, 'bump', bumpFrame, pos.x, pos.y, { shake: shake.progress, hint: hint });
        } else { this._drawSprite(ctx, tile.direction, 'idle', this._idleFrame, pos.x, pos.y, { hint: hint }); }
      } else { this._drawSprite(ctx, tile.direction, 'idle', this._idleFrame, pos.x, pos.y, { hint: hint }); }
    }
    for (var mi = 0; mi < animMoves.length; mi++) {
      var m = animMoves[mi], x, y;
      if (m.pathPoints && m.pathPoints.length >= 2) {
        var pts = m.pathPoints, segCount = pts.length - 1;
        var segIdx, segT;
        if (m.segmentDurationsMs && m.segmentDurationsMs.length === segCount) {
          var durs = m.segmentDurationsMs;
          var totalDur = m.duration;
          var elapsed = Math.min(m.progress * totalDur, totalDur - 0.001);
          var cum = 0;
          for (segIdx = 0; segIdx < segCount - 1 && cum + durs[segIdx] < elapsed; segIdx++) {
            cum += durs[segIdx];
          }
          segT = durs[segIdx] > 0 ? (elapsed - cum) / durs[segIdx] : 0;
        } else {
          var t = m.progress * segCount;
          segIdx = Math.min(Math.floor(t), segCount - 1);
          segT = t - segIdx;
        }
        x = pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * segT;
        y = pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * segT;
      } else {
        var from = this.cellCenter(m.fromRow, m.fromCol), to = this.cellCenter(m.toRow, m.toCol);
        var tt = this._easeOutCubic(m.progress);
        x = from.x + (to.x - from.x) * tt; y = from.y + (to.y - from.y) * tt;
      }
      var alpha = 1;
      if (m.isExit) { var fadeAt = (m.segments - 1) / m.segments, since = m.progress - fadeAt; if (since > 0) alpha = Math.max(0, 1 - since / 0.15); }
      ctx.save(); if (m.isExit) ctx.globalAlpha = alpha;
      var drawDir = m.directions ? m.directions[segIdx] : m.tile.direction;
      this._drawSprite(ctx, drawDir, 'run', this._runFrame, x, y, {});
      ctx.restore();
    }
    for (var ei = 0; ei < exits.length; ei++) {
      var e = exits[ei], epos = this.cellCenter(e.tile.row, e.tile.col);
      ctx.save(); ctx.globalAlpha = 1 - e.progress; ctx.translate(epos.x, epos.y); ctx.scale(1 - e.progress, 1 - e.progress);
      this._drawSprite(ctx, e.tile.direction, 'run', this._runFrame, 0, 0, {});
      ctx.restore();
    }

  }

  _drawSprite(ctx, direction, animType, frameIdx, cx, cy, opts) {
    if (!opts) opts = {};
    if (!SPRITES.ready) return;
    var spriteCanvas = null;
    if (animType === 'idle') spriteCanvas = SPRITES.getIdleFrame(frameIdx);
    else if (animType === 'run') spriteCanvas = SPRITES.getMoveFrame(frameIdx);
    else if (animType === 'bump') spriteCanvas = SPRITES.getHitFrame(frameIdx);
    if (!spriteCanvas) return;
    var ts = this._baseTileSize, half = ts / 2, pad = ts * 0.1, imgSize = (ts - pad * 2) * (this._mobileLayout ? 1.1 : 1);
    var angle = SpriteManager.rotationFor(direction);
    ctx.save(); ctx.translate(cx, cy);
    if (opts.shake) { var intensity = 5 * Math.sin(opts.shake * Math.PI * 4) * (1 - opts.shake); ctx.translate(intensity, 0); }
    ctx.rotate(angle);
    if (opts.hint) {
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(0, 0, half + 2, 0, Math.PI * 2); ctx.stroke(); ctx.shadowColor = 'transparent';
    }
    ctx.drawImage(spriteCanvas, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
}
