/**
 * main.js — точка входа, игровой цикл, управление состоянием
 */

// Обучение — тексты в locales.js (tut*Title / tut*Text)
var TUTORIAL_IDS = {
  welcome: true,
  straight: true,
  corner: true,
  teleport: true,
  timer: true,
  hints: true
};

var TUTORIAL_IMAGES = {
  tile: new Image(),
  timer: new Image(),
  hint: new Image()
};
TUTORIAL_IMAGES.tile.src = 'assets/Tile.webp';
TUTORIAL_IMAGES.timer.src = 'assets/Timer.png';
TUTORIAL_IMAGES.hint.src = 'assets/hint.png';

function drawTutorialDiagram(id, ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  if (id === 'welcome') { _drawWelcomeDiagram(ctx, w, h); }
  else if (id === 'straight') { _drawTubeDiagram(ctx, w, h, 'straight'); }
  else if (id === 'corner') { _drawTubeDiagram(ctx, w, h, 'corner'); }
  else if (id === 'teleport') { _drawTeleportDiagram(ctx, w, h); }
  else if (id === 'timer') { _drawTimerDiagram(ctx, w, h); }
  else if (id === 'hints') { _drawHintDiagram(ctx, w, h); }
  ctx.restore();
}

function _drawWelcomeDiagram(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.save();

  var tileSize = Math.min(w, h) * 0.70;
  var tileX = cx - tileSize / 2;
  var tileY = cy - tileSize / 2;
  _drawTilePatch(ctx, tileX, tileY, tileSize, tileSize);

  var hamsterSize = tileSize * 0.45;
  var hamX = tileX + tileSize * 0.70;
  var hamY = cy;
  _drawHamsterIdle(ctx, hamX, hamY, hamsterSize, 'right');

  var edgeX = Math.min(w - 28, tileX + tileSize + 16);
  _drawArrow(ctx, hamX + hamsterSize * 0.34, hamY, edgeX, hamY, '#60A5FA');

  ctx.fillStyle = 'rgba(16,185,129,0.35)';
  ctx.fillRect(edgeX + 4, tileY + tileSize * 0.18, 10, tileSize * 0.64);
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.strokeRect(edgeX + 4, tileY + tileSize * 0.18, 10, tileSize * 0.64);

  ctx.restore();
}

function _drawTubeDiagram(ctx, w, h, type) {
  const cx = w / 2, cy = h / 2;
  ctx.save();

  var size = Math.min(w, h) * 0.73;
  var x = cx - size / 2;
  var y = cy - size / 2;
  _drawTilePatch(ctx, x, y, size, size);

  var sprite = SPRITES.ready ? SPRITES.getTubeSprite(type, type === 'straight' ? 1 : 0) : null;
  if (sprite) {
    ctx.save();
    ctx.translate(cx, cy);
    var maxSize = type === 'straight' ? size * 0.72 : size * 0.64;
    var scale = maxSize / Math.max(sprite.width, sprite.height);
    var dw = sprite.width * scale;
    var dh = sprite.height * scale;
    ctx.drawImage(sprite, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  } else {
    _drawFallbackTube(ctx, cx, cy, size, type);
  }

  if (type === 'straight') {
    ctx.strokeStyle = CONFIG.ROTATING_INDICATOR;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function _drawTeleportDiagram(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.save();

  var size = Math.min(w, h) * 0.52;
  var gap = size * 0.52;
  var leftX = cx - size - gap / 2;
  var rightX = cx + gap / 2;
  var y = cy - size / 2;
  _drawTilePatch(ctx, leftX, y, size, size);
  _drawTilePatch(ctx, rightX, y, size, size);

  var portal = SPRITES.ready ? SPRITES.getTeleportSprite(1) : null;
  _drawPortalAt(ctx, portal, leftX + size / 2, cy, size * 0.92);
  _drawPortalAt(ctx, portal, rightX + size / 2, cy, size * 0.92);

  ctx.restore();
}

function _drawHintDiagram(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.save();

  var base = Math.min(w, h);
  var iconSize = base * 0.26;
  var tileSize = base * 0.48;
  var gap = base * 0.08;
  var totalH = iconSize + gap + tileSize;
  var startY = Math.max(0, (h - totalH) / 2);

  _drawImageContain(ctx, TUTORIAL_IMAGES.hint, cx - iconSize / 2, startY, iconSize, iconSize);

  var tileX = cx - tileSize / 2;
  var tileY = startY + iconSize + gap;
  _drawTilePatch(ctx, tileX, tileY, tileSize, tileSize);

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, tileY + tileSize / 2, tileSize * 0.34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowColor = 'transparent';

  _drawHamsterIdle(ctx, cx, tileY + tileSize / 2, tileSize * 0.46, 'down');
  ctx.restore();
}

function _drawTimerDiagram(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.save();

  var size = Math.min(w, h) * 0.68;
  _drawImageContain(ctx, TUTORIAL_IMAGES.timer, cx - size / 2, cy - size / 2, size, size);

  ctx.restore();
}

function _drawTilePatch(ctx, x, y, w, h) {
  if (TUTORIAL_IMAGES.tile.complete && TUTORIAL_IMAGES.tile.naturalWidth > 0) {
    ctx.drawImage(TUTORIAL_IMAGES.tile, x, y, w, h);
    return;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function _drawHamsterIdle(ctx, cx, cy, size, direction) {
  var sprite = SPRITES.ready ? SPRITES.getIdleFrame(0) : null;
  if (!sprite) {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(SpriteManager.rotationFor(direction || 'down'));
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function _drawImageContain(ctx, img, x, y, w, h) {
  if (!img || !img.complete || img.naturalWidth <= 0) return;
  var scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  var dw = img.naturalWidth * scale;
  var dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function _drawArrow(ctx, x1, y1, x2, y2, color) {
  var angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.55) * 11, y2 - Math.sin(angle - 0.55) * 11);
  ctx.lineTo(x2 - Math.cos(angle + 0.55) * 11, y2 - Math.sin(angle + 0.55) * 11);
  ctx.closePath();
  ctx.fill();
}

function _drawFallbackTube(ctx, cx, cy, size, type) {
  ctx.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx.lineWidth = Math.max(7, size * 0.15);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (type === 'straight') {
    ctx.moveTo(cx - size * 0.36, cy);
    ctx.lineTo(cx + size * 0.36, cy);
  } else {
    ctx.moveTo(cx, cy - size * 0.34);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + size * 0.34, cy);
  }
  ctx.stroke();
}

function _drawPortalAt(ctx, portal, cx, cy, size) {
  if (portal) {
    var scale = size / Math.max(portal.width, portal.height);
    var dw = portal.width * scale;
    var dh = portal.height * scale;
    ctx.drawImage(portal, cx - dw / 2, cy - dh / 2, dw, dh);
    return;
  }
  ctx.strokeStyle = '#8B5CF6';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.levelManager = new LevelManager();
    this.storage = StorageManager.load();

    this.board = null;
    this.currentLevelId = 1;
    this.state = 'menu';
    this.moves = 0;
    this.lives = CONFIG.MAX_LIVES;
    this.history = [];
    this.hintsRemaining = CONFIG.INITIAL_HINTS;

    this._timerSeconds = 0;
    this._timerInterval = null;
    this._pauseRemaining = 0;

    this._moves = [];
    this._exits = [];
    this._shakes = [];
    this._reveal = 0;
    this._hintTileId = null;
    this._hamsterIconDrawn = false;
    this._bgIndex = 0;
    this._centerTick = null;
    this._vkBridge = null;
    this._adLevelCounter = 0;
    this._pendingInterstitial = false;
    this._levelFailCounts = {};
    this._platformPaused = false;
    this._pausedForAd = false;
    this._appStarted = false;
    this._graReady = false;
    this._musicEnabled = true;
    this._menuBgImage = new Image();
    this._menuBgImage.src = 'assets/Background.webp';
    this._animFrame = null;

    // Sound
    this.sound = new SoundManager();
    this.sound.setMusicVolume(this.storage.settings.musicVolume);
    this.sound.setSfxEnabled(this.storage.settings.sfxEnabled !== false && this.storage.music !== false);

    // Tutorial
    this._tutorialShown = this.storage.tutorials || {};
    this._tutorialQueue = [];
    this._pendingLevelId = null;
    this._currentTutorialId = null;

    var self = this;
    this._resize();
    window.addEventListener('resize', function() { self._scheduleResize(); });
    window.addEventListener('orientationchange', function() { self._scheduleResize(); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function() { self._scheduleResize(); });
    }
    this.input = new InputHandler(this.canvas, this.renderer, function(r, c) { self._onTileTap(r, c); });

    window.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); self.undo(); }
    });
    document.addEventListener('visibilitychange', function() {
      self._setPlatformPaused(document.hidden);
    });
    window.addEventListener('pagehide', function() { self._setPlatformPaused(true); });
    window.addEventListener('pageshow', function() { self._setPlatformPaused(document.hidden); });

    this._loop(0);
  }

  _tryStartApp() {
    if (this._appStarted || !this._graReady || this._platformPaused || this._pausedForAd) return;
    this._startApp();
  }

  _startApp() {
    if (this._appStarted) return;
    this._appStarted = true;
    if (document.body) document.body.classList.remove('loading');
    this._showMenu();
  }

  _loop(timestamp) {
    try {
      this._updateAnimations(timestamp);
      if (this.state === 'playing' || this.state === 'win' || this.state === 'softlock') {
        this.renderer.draw(this.board, {
          animMoves: this._moves, exits: this._exits, shakes: this._shakes,
          reveal: this._reveal, hintTileId: this._hintTileId,
          levelName: this._currentLevelName(), moveCount: this.moves,
          optimalMoves: this.board ? this.board.optimalMoves : 0,
          lives: this.lives, timerSeconds: this._timerSeconds
        });
      } else if (this.state === 'menu' || this.state === 'levelSelect') {
        this._drawMenuBg();
      }
    } catch (e) { console.error('_loop error:', e); }
    this._animFrame = requestAnimationFrame(function(t) { game._loop(t); });
  }

  _updateAnimations(now) {
    var MOVE_MS = CONFIG.ANIMATION.MOVE_DURATION;
    var EXIT_MS = CONFIG.ANIMATION.EXIT_DURATION;
    var SHAKE_MS = CONFIG.ANIMATION.SHAKE_DURATION;
    this._moves = this._moves.filter(function(m) {
      var dur = m.duration || MOVE_MS;
      m.progress = Math.min(1, (now - m.startTime) / dur);
      if (m.progress >= 1) { m.tile.isMoving = false; return false; }
      return true;
    });
    this._exits = this._exits.filter(function(e) {
      e.progress = Math.min(1, (now - e.startTime) / EXIT_MS);
      return e.progress < 1;
    });
    this._shakes = this._shakes.filter(function(s) {
      s.progress = Math.min(1, (now - s.startTime) / SHAKE_MS);
      return s.progress < 1;
    });
    
  }

  _startTimer() {
    this._stopTimer();
    this._timerSeconds = this.board.timeLimit || 0;
    if (this._timerSeconds <= 0) return;
    var self = this;
    this._timerInterval = setInterval(function() { self._timerTick(); }, 1000);
  }

  _stopTimer() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  _resumeTimer() {
    this._stopTimer();
    if (this._timerSeconds <= 0) return;
    var self = this;
    this._timerInterval = setInterval(function() { self._timerTick(); }, 1000);
  }

  _timerTick() {
    if (this.state !== 'playing') return;
    this._timerSeconds--;
    this._updateUIForGame();
    if (this._timerSeconds <= 0) { this._stopTimer(); this._timerExpired = true; this._onSoftlock(); }
  }

  _startLevel(levelId) {
    var cfg = this.levelManager.getLevel(levelId);
    if (!cfg) { cfg = this.levelManager.getLevel(this.levelManager.total); }
    if (!cfg) return;
    try {
      this.currentLevelId = cfg.id;
      this.board = new Board(cfg);
      this.renderer.layout(this.board);
      this.moves = 0;
      this.lives = CONFIG.MAX_LIVES;
      this.history = [];
      this._moves = [];
      this._exits = [];
      this._shakes = [];
      this._reveal = 0;
      this._hintTileId = null;
      this._levelTotalTiles = this.board.tiles.length;
      this._timerExpired = false;
      document.getElementById("hud-timer").classList.add("hidden");
      // Hints available from level 2
      this.hintsRemaining = CONFIG.INITIAL_HINTS;
      this._bgIndex = Math.floor((cfg.id - 1) / 10);
      this.renderer.setBackgroundIndex(this._bgIndex);
      this.state = 'playing';
      this._gameplayStart();
      this._startTimer();
      this._updateUIForGame();
    } catch (e) { console.error('_startLevel failed:', e); this.state = 'menu'; }
  }

  _currentLevelName() {
    return _('level') + ' ' + this.currentLevelId;
  }

  _onTileTap(row, col) {
    if (this.state !== 'playing') return;

    if (this.board.isRotatableTube(row, col)) {
      this.board.rotateTube(row, col);
      this.sound.play('MovePipe');
      this._hintTileId = null;
      return;
    }

    if (this._moves.length > 0 || this._shakes.length > 0) {
      var allExit = true;
      for (var mi = 0; mi < this._moves.length; mi++) { if (!this._moves[mi].isExit) { allExit = false; break; } }
      if (!allExit) return;
    }

    var tile = this.board.getTile(row, col);
    if (!tile) return;
    this.sound.play('Push');

    var path = this._calculatePath(tile);
    var fromRow = tile.row;
    var fromCol = tile.col;

    if (path.length === 0) {
      this._shakes.push({ tile: tile, progress: 0, startTime: performance.now() });
      this.sound.play('Hit');
      this._loseLife();
      return;
    }

    var lastStep = path[path.length - 1];
    var endsWithExit = lastStep.isExit;

    var pathPoints = [];
    pathPoints.push(this.renderer.cellCenter(fromRow, fromCol));

    var origDir = tile.direction, curDir = tile.direction;
    var offsets = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    var directions = [origDir];

    for (var pi = 0; pi < path.length; pi++) {
      var step = path[pi];
      if (step.isExit) break;
      pathPoints.push(this.renderer.cellCenter(step.row, step.col));
      if (step.isTeleportExit) {
        // Направление уже изменилось на входе в портал.
      } else if (step.isTube) {
        var tube = this.board.getTube(step.row, step.col);
        curDir = _sideToDir(_tubeExitSide(tube, _dirToSide(curDir)));
      }
      directions.push(curDir);
    }

    if (endsWithExit) {
      var lastPathIdx = path.length - 2;
      var exitR = lastPathIdx >= 0 ? path[lastPathIdx].row : fromRow;
      var exitC = lastPathIdx >= 0 ? path[lastPathIdx].col : fromCol;
      var dr = offsets[curDir];
      pathPoints.push(this.renderer.cellCenter(exitR + dr[0], exitC + dr[1]));
      directions.push(curDir);
    }

    var now = performance.now();
    var segs = pathPoints.length - 1;
    var slideMs = CONFIG.ANIMATION.MOVE_DURATION + (segs - 1) * 240;

    // Если в пути есть телепорт — вычисляем длительности сегментов (0ms для прыжка)
    var segmentDurationsMs = null;
    for (var pi = 0; pi < path.length; pi++) {
      if (path[pi].isTeleportEntry) {
        segmentDurationsMs = [];
        for (var si = 0; si < segs; si++) {
          segmentDurationsMs.push(si === 0 ? CONFIG.ANIMATION.MOVE_DURATION : 240);
        }
        // Сегмент pi+1 от entryTube к pairTube — 0ms (мгновенный телепорт)
        if (pi + 1 < segs) {
          segmentDurationsMs[pi + 1] = 0;
          slideMs = CONFIG.ANIMATION.MOVE_DURATION + (segs - 2) * 240;
        }
        break;
      }
    }

    if (endsWithExit) { this.board.removeTile(tile); }
    else { this.board.moveTile(tile, lastStep.row, lastStep.col); }

    this._moves.push({
      tile: tile, pathPoints: pathPoints, segments: segs, directions: directions,
      progress: 0, startTime: now, duration: slideMs, isExit: endsWithExit,
      segmentDurationsMs: segmentDurationsMs
    });
    this.sound.play('Move');
    tile.isMoving = true;

    this.history.push({
      tile: tile, origRow: fromRow, origCol: fromCol, origDirection: origDir,
      finalRow: endsWithExit ? null : lastStep.row,
      finalCol: endsWithExit ? null : lastStep.col,
      isExit: endsWithExit
    });
    if (this.history.length > CONFIG.MAX_UNDO_HISTORY) this.history.shift();

    var totalDelay = endsWithExit ? slideMs : slideMs + 60;
    var self = this;
    setTimeout(function() {
      tile.isMoving = false;
      if (curDir !== origDir) { tile.direction = curDir; }
      if (!endsWithExit) {
        // Shake at current (new) position first
        self._shakes.push({ tile: tile, progress: 0, startTime: performance.now() });
        self.sound.play('Hit');
        self._loseLife();
      } else {
        self.sound.play('EndMove');
      }
      self.moves++;
      self._hintTileId = null;
      var bumpDelay = endsWithExit ? 0 : CONFIG.ANIMATION.SHAKE_DURATION + 50;
      setTimeout(function() {
        // After shake completes, move tile back to starting position
        if (!endsWithExit) {
          self.board.moveTile(tile, fromRow, fromCol);
          if (origDir !== undefined) tile.direction = origDir;
        }
        self._checkGameState();
        self._updateUIForGame();
      }, bumpDelay);
    }, totalDelay);
  }

  _calculatePath(tile) {
    var path = [];
    var r = tile.row, c = tile.col, dir = tile.direction;
    var offsets = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

    while (true) {
      var dr_dc = offsets[dir];
      var nr = r + dr_dc[0], nc = c + dr_dc[1];

      if (!this.board.inBounds(nr, nc)) {
        path.push({ row: null, col: null, isExit: true });
        break;
      }

      var tube = this.board.getTube(nr, nc);
      if (tube) {
        if (tube.type === 'teleport') {
          var pair = this.board._findTeleportPair(tube.colorIndex, nr + ',' + nc);
          if (pair) {
            var teleportExitSide = _tubeExitSide(tube, _dirToSide(dir));
            // Добавляем клетку входа — хомяк доезжает до трубы
            path.push({ row: nr, col: nc, isTube: true, isTeleportEntry: true });
            // Позиция пары — сюда хомяк телепортируется
            path.push({ row: pair.row, col: pair.col, isTube: true, isTeleportExit: true });
            r = pair.row; c = pair.col;
            dir = _sideToDir(teleportExitSide);
            continue;
          } else {
            break;
          }
        }
        var entrySide = _dirToSide(dir);
        var exitSide = _tubeExitSide(tube, entrySide);
        if (exitSide === null) break;
        path.push({ row: nr, col: nc, isTube: true });
        dir = _sideToDir(exitSide);
        r = nr; c = nc;
        continue;
      }

      if (this.board.isPassable(nr, nc) && (this.board.isEmpty(nr, nc) || (nr === tile.row && nc === tile.col))) {
        path.push({ row: nr, col: nc, isExit: false });
        r = nr; c = nc;
      } else {
        break;
      }
    }

    while (path.length > 0 && path[path.length - 1].isTube) { path.pop(); }
    return path;
  }

  _checkGameState() {
    if (this.board.isCleared()) { this._onWin(); }
    else if (!this.board.hasValidMoves()) { this._onSoftlock(); }
  }

  _loseLife() {
    this.lives--;
    this._updateUIForGame();
    if (this.lives <= 0) { this._onSoftlock(); }
  }

  undo() {
    if (this.state !== 'playing') return;
    if (this._moves.length > 0 || this._shakes.length > 0) return;
    if (this.history.length === 0) return;
    var last = this.history.pop();
    if (last.origDirection !== undefined) { last.tile.direction = last.origDirection; }
    if (last.isExit) { this.board.restoreTile(last.tile, last.origRow, last.origCol); }
    else {
      var tile = this.board.getTile(last.finalRow, last.finalCol);
      if (tile) { this.board.moveTile(tile, last.origRow, last.origCol); }
    }
    this.moves--;
    this._hintTileId = null;
    this._updateUIForGame();
  }

  showHint() {
    if (this.state !== 'playing') return;
    if (this.hintsRemaining <= 0) {
      // Show popup asking to watch ad (always, even without SDK)
      document.getElementById('hint-ad-screen').classList.remove('hidden');
      // Hide "Да" button if no SDK available
      var yesBtn = document.getElementById('btn-hint-ad-yes');
      if (!this._vkBridge) {
        yesBtn.classList.add('hidden');
      } else {
        yesBtn.classList.remove('hidden');
      }
      return;
    }
    var tile = this.board.findHintTile();
    if (tile) {
      this._hintTileId = tile.id;
      this.hintsRemaining--;
      var self = this;
      setTimeout(function() { self._hintTileId = null; }, 1500);
    }
    this._updateUIForGame();
  }

  _calcTotalStars() {
    var data = StorageManager.load();
    var total = 0;
    for (var id in data.completedLevels) {
      total += data.completedLevels[id].stars || 0;
    }
    return total;
  }

  _syncLeaderboard() {
    this._leaderboardScore = this._calcTotalStars();
  }

  _openLeaderboard() {
    this._syncLeaderboard();
    if (this._vkBridge && typeof this._vkBridge.send === 'function') {
      var score = this._leaderboardScore || 0;
      try {
        this._vkBridge.send('VKWebAppShowLeaderBoardBox', { user_result: score }).catch(function(e) {
          console.error('VK leaderboard error:', e);
        });
        return;
      } catch(e) {
        console.error('VK leaderboard error:', e);
      }
    }
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('leaderboard-screen').classList.remove('hidden');
    this.sound.play('Menu');
    var self = this;
    self._updateLeaderboardPlayer();
    document.getElementById('leader-entries').innerHTML = '';
  }

  _updateLeaderboardPlayer() {
    var playerDiv = document.getElementById('leader-player');
    playerDiv.className = 'leader-player';
    playerDiv.innerHTML = '<span class="leader-rank">#</span>' +
      '<span class="leader-name">' + _('playerName') + '</span>' +
      '<span class="leader-score"><img src="assets/star.png" class="leader-star-icon">' + this._calcTotalStars() + '</span>';
  }

  _escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  _gameplayStart() {}

  _gameplayStop() {}

  _setPlatformPaused(paused) {
    this._platformPaused = !!paused;
    if (this._platformPaused) {
      this._stopTimer();
      this.sound.pauseAll('platform');
    } else if (!this._pausedForAd) {
      if (this.state === 'playing') this._resumeTimer();
      this.sound.resumeAll('platform');
      this.sound.tryAutoUnlock();
      this._tryStartApp();
    }
  }

  _pauseForAd() {
    this._pausedForAd = true;
    this._stopTimer();
    this.sound.pauseAll('ad');
    this._gameplayStop();
  }

  _resumeAfterAd() {
    this._pausedForAd = false;
    this._tryResumeAfterAd(true);
    var self = this;
    setTimeout(function() { self._tryResumeAfterAd(true); }, 250);
  }

  _tryResumeAfterAd(force) {
    if (this._pausedForAd) return;
    this._platformPaused = force ? false : !!document.hidden;
    if (!this._platformPaused) {
      if (this.state === 'playing') this._resumeTimer();
      this.sound.resumeAll('ad');
      if (this.state === 'playing') this._gameplayStart();
    }
  }

  _showVkNativeAd(adFormat) {
    if (!this._vkBridge || typeof this._vkBridge.send !== 'function') return Promise.resolve(false);
    var self = this;
    self._pauseForAd();
    return self._vkBridge.send('VKWebAppCheckNativeAds', { ad_format: adFormat }).then(function(check) {
      if (!check || check.result !== true) return false;
      var payload = { ad_format: adFormat };
      if (adFormat === 'reward') payload.use_waterfall = true;
      return self._vkBridge.send('VKWebAppShowNativeAds', payload).then(function(result) {
        return !!(result && result.result === true);
      });
    }).catch(function(err) {
      console.error('VK ad error:', err);
      return false;
    }).then(function(wasShown) {
      self._resumeAfterAd();
      return wasShown;
    });
  }

 _showRewardedAd() {
    if (!this._vkBridge) {
      this._returnToLevelAfterSoftlock();
      return;
    }

    var self = this;
    this._showVkNativeAd('reward').then(function(rewarded) {
      if (rewarded) self._returnToLevelAfterSoftlock();
    });
}

  _returnToLevelAfterSoftlock() {
    this.lives = CONFIG.MAX_LIVES;

    document.getElementById('softlock-screen')
        .classList.add('hidden');

    document.getElementById('game-hud')
        .classList.remove('hidden');

    this.state = 'playing';
    this._resumeTimer();
    this._updateUIForGame();
  }

 _showHintAd() {
    if (!this._vkBridge) {
      document.getElementById('hint-ad-screen')?.classList.add('hidden');
      return;
    }
    var self = this;
    this._showVkNativeAd('reward').then(function(rewarded) {
      if (!rewarded) return;
      self.hintsRemaining += 3;

      document.getElementById('hint-ad-screen')?.classList.add('hidden'); 
      document.getElementById('game-hud').classList.remove('hidden');

      self.state = 'playing';
      self._updateUIForGame();
    });
}

  _showSkipLevelAd() {
    var levelId = this.currentLevelId;
    var nextId = levelId + 1;
    if (nextId > this.levelManager.total) return;
    if (!this._vkBridge) {
      this._skipCurrentLevel();
      return;
    }

    var self = this;
    this._showVkNativeAd('reward').then(function(rewarded) {
      if (rewarded) self._skipCurrentLevel();
    });
  }

  _skipCurrentLevel() {
    var levelId = this.currentLevelId;
    var nextId = levelId + 1;
    if (nextId > this.levelManager.total) return;

    StorageManager.markSkipped(levelId);
    this._levelFailCounts[levelId] = 0;
    this._adLevelCounter = 0;
    this._pendingInterstitial = false;

    document.getElementById('softlock-screen')?.classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');

    this.sound.stopMusic();
    this.sound.playRandomGameMusic();
    this._startLevelWithTutorial(nextId);
  }

  _showInterstitial(callback) {
    var self = this;
    if (!this._vkBridge) { if (callback) callback(); return; }
    this._showVkNativeAd('interstitial').then(function() {
      if (callback) callback();
      self._resumeMusicAfterAd();
    });
  }

  _resumeMusicAfterAd() {
    this.sound.forceResume();
    if (this.state === 'playing') {
      if (!this.sound.ensureMusic(false)) this.sound.playRandomGameMusic();
    } else if (this.state === 'menu' || this.state === 'levelSelect') {
      this.sound.startMenuMusic();
    }
  }

  _showInterstitialBeforeNext(callback) {
    if (!this._pendingInterstitial) {
      callback();
      return;
    }
    this._pendingInterstitial = false;
    var self = this;
    this._showInterstitial(function() {
      callback();
      setTimeout(function() { self._resumeMusicAfterAd(); }, 300);
    });
  }

  _showSettings() {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('settings-screen').classList.remove('hidden');
    // Update sound button text
    var musicBtn = document.getElementById('btn-music-toggle');
    var enabled = this.sound.isSfxEnabled();
    musicBtn.textContent = enabled ? _('musicOn') : _('musicOff');
    musicBtn.style.background = enabled ? 'rgba(5,150,105,0.5)' : '';
    var musicSlider = document.getElementById('music-volume-slider');
    if (musicSlider) musicSlider.value = this.sound.getMusicVolume();
    // Highlight current language
    document.getElementById('btn-lang-ru').classList.toggle('active', currentLang === 'ru');
    document.getElementById('btn-lang-en').classList.toggle('active', currentLang === 'en');
  }

  _toggleMusic() {
    var enabled = this.sound.toggleSfx();
    var musicBtn = document.getElementById('btn-music-toggle');
    musicBtn.textContent = enabled ? _('musicOn') : _('musicOff');
    musicBtn.style.background = enabled ? 'rgba(5,150,105,0.5)' : '';
    try {
      var data = StorageManager.load();
      data.settings.sfxEnabled = enabled;
      delete data.music;
      StorageManager.save(data);
    } catch(e) {}
  }

  _setMusicVolume(volume) {
    this.sound.setMusicVolume(volume);
    try {
      var data = StorageManager.load();
      data.settings.musicVolume = this.sound.getMusicVolume();
      StorageManager.save(data);
    } catch(e) {}
  }

  restartLevel() {
    this._stopTimer();
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('softlock-screen').classList.add('hidden');
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('game-hud').classList.remove('hidden');
    this._startLevelWithTutorial(this.currentLevelId);
  }

  _onWin() {
    if (this.state === 'win') return;
    this.state = 'win';
    this._stopTimer();
    this._gameplayStop();
    this.sound.play('Win');
    var levelId = this.currentLevelId;
    this._levelFailCounts[levelId] = 0;
    // Interstitial ads start only after the first four levels.
    if (levelId >= 5) {
      this._adLevelCounter++;
      if (this._adLevelCounter >= 2 && this._vkBridge) {
        this._adLevelCounter = 0;
        this._pendingInterstitial = true;
      }
    }
    var result = StorageManager.markCompleted(levelId, this.moves, this.lives);
    this._syncLeaderboard();
    var self2 = this;
    setTimeout(function() {
      var start = performance.now();
      var DUR = CONFIG.ANIMATION.WIN_REVEAL_DURATION;
      var animate = function(now) {
        self2._reveal = Math.min(1, (now - start) / DUR);
        if (self2._reveal < 1) { requestAnimationFrame(animate); }
      };
      requestAnimationFrame(animate);
      self2._showWinScreen(result.stars, result.bestMoves, levelId);
    }, 1000);
  }

  _onSoftlock() {
    if (this.state === 'softlock') return;
    this.state = 'softlock';
    var levelId = this.currentLevelId;
    this._levelFailCounts[levelId] = (this._levelFailCounts[levelId] || 0) + 1;
    document.getElementById('hud-timer').classList.add('hidden');
    this._stopTimer();
    this._gameplayStop();
    this.sound.play('Los');
    var titleEl = document.querySelector('#softlock-screen h2');
    if (titleEl) titleEl.textContent = this._timerExpired ? _('timeUpTitle') : _('softlockTitle');
    var adBtn = document.getElementById('btn-softlock-ad');
    var skipBtn = document.getElementById('btn-softlock-skip');
    if (adBtn) {
      adBtn.classList.remove('hidden');
    }
    if (skipBtn) {
      var canSkip = this._levelFailCounts[levelId] >= 2 && levelId < this.levelManager.total;
      skipBtn.classList.toggle('hidden', !canSkip);
    }
    this._showSoftlockScreen();
  }

  _showMenu() {
    this.state = 'menu';
    this._stopTimer();
    this._gameplayStop();
    document.getElementById('hud-timer').classList.add('hidden');
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    this._drawMenuBg();
    this.sound.startMenuMusic();
  }

  _showLevelSelect(targetChapter) {
    this.state = 'levelSelect';
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('level-select').classList.remove('hidden');
    this.sound.startMenuMusic();

    var carousel = document.getElementById('chapters-carousel');
    carousel.innerHTML = '';
    for (var ch = 0; ch < 10; ch++) {
      var slide = document.createElement('div');
      slide.className = 'chapter-slide';
      var bgDiv = document.createElement('div');
      bgDiv.className = 'chapter-slide-bg';
      bgDiv.style.backgroundImage = 'url(assets/Background_' + ch + '.webp)';
      slide.appendChild(bgDiv);
      var overlay = document.createElement('div');
      overlay.className = 'chapter-slide-overlay';
      var title = document.createElement('div');
      title.className = 'chapter-slide-title';
      var chNum = ch + 1;
      title.textContent = _('chapter') + ' ' + chNum;
      var subtitle = document.createElement('div');
      subtitle.className = 'chapter-slide-subtitle';
      var fromLvl = ch * 10 + 1;
      var toLvl = Math.min((ch + 1) * 10, this.levelManager.total);
      subtitle.textContent = fromLvl + '\u2013' + toLvl;
      overlay.appendChild(title);
      overlay.appendChild(subtitle);
      slide.appendChild(overlay);
      (function(chapterIdx, self) {
        slide.addEventListener('click', function() { self._showLevelsView(chapterIdx); });
      })(ch, this);
      carousel.appendChild(slide);
    }
    document.getElementById('levels-view').classList.add('hidden');
    document.getElementById('chapters-carousel').classList.remove('hidden');
    document.getElementById('btn-level-select-menu').innerHTML = '<img src="assets/undo.png" alt="">' + _('backNav');

    // Wheel-to-horizontal scroll
    this._addDragScroll(carousel);
    var self2 = this;
    carousel.addEventListener('scroll', function() {
      if (self2._centerTick) cancelAnimationFrame(self2._centerTick);
      self2._centerTick = requestAnimationFrame(function() {
        self2._updateCenterCard(carousel);
        var centerEl = carousel.querySelector('.centered');
        if (centerEl && centerEl !== self2._lastCenteredCard) {
          self2._lastCenteredCard = centerEl;
          self2.sound.play('Leaf');
        }
      });
    });

    if (targetChapter !== undefined) {
      var self = this;
      setTimeout(function() {
        if (carousel.children[targetChapter]) {
          carousel.children[targetChapter].scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      }, 100);
    }
    this._drawMenuBg();
  }

  _updateCenterCard(container) {
    var cards = container.children;
    if (cards.length === 0) return;
    var rect = container.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var closest = null, minD = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var cr = cards[i].getBoundingClientRect();
      var ccx = cr.left + cr.width / 2;
      var d = Math.abs(ccx - cx);
      if (d < minD) { minD = d; closest = cards[i]; }
    }
    for (var i = 0; i < cards.length; i++) {
      if (cards[i] === closest) cards[i].classList.add('centered');
      else cards[i].classList.remove('centered');
    }
  }

  _addDragScroll(el) {
    var isDown = false, startX = 0, scrollLeft = 0, didMove = 0, rect = null;
    function _onStart(clientX) {
      rect = el.getBoundingClientRect();
      startX = clientX - rect.left;
      scrollLeft = el.scrollLeft;
      isDown = true;
      didMove = 0;
      el.style.scrollSnapType = 'none';
      el.style.scrollBehavior = 'auto';
    }
    function _onMove(clientX) {
      if (!isDown) return;
      var x = clientX - rect.left;
      el.scrollLeft = scrollLeft - (x - startX) * 1.2;
      if (Math.abs(x - startX) > 5) didMove = 1;
    }
    function _onEnd() {
      if (!isDown) return;
      isDown = false;
      el.style.scrollSnapType = '';
      el.style.scrollBehavior = '';
    }

    el.addEventListener('mousedown', function(e) { _onStart(e.clientX); e.preventDefault(); });
    el.addEventListener('mousemove', function(e) { if (isDown) e.preventDefault(); _onMove(e.clientX); });
    el.addEventListener('mouseup', _onEnd);
    el.addEventListener('mouseleave', _onEnd);

    el.addEventListener('touchstart', function(e) { _onStart(e.touches[0].clientX); }, { passive: true });
    el.addEventListener('touchmove', function(e) { _onMove(e.touches[0].clientX); }, { passive: true });
    el.addEventListener('touchend', _onEnd);
    el.addEventListener('touchcancel', _onEnd);

    // Prevent click after drag
    el.addEventListener('click', function(e) { if (didMove) { e.stopPropagation(); } }, true);
  }
  _showWinScreen(stars, bestMoves, levelId) {
    var starsHtml = '';
    for (var i = 0; i < 3; i++) {
      starsHtml += '<img src="assets/star.png" class="' + (i < stars ? '' : 'empty') + '" alt="">';
    }
    document.getElementById('win-stars').innerHTML = starsHtml;
    document.getElementById('win-level-text').textContent = _('winLevel') + ' ' + levelId + ' ' + _('winPassed');
    // moves display removed
    var hasNext = levelId < this.levelManager.total;
    document.getElementById('btn-next-level').style.display = hasNext ? '' : 'none';
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('win-screen').classList.remove('hidden');
  }

  _showSoftlockScreen() {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('softlock-screen').classList.remove('hidden');
  }

  _updateUIForGame() {
    var remaining = this.board ? this.board.tiles.length : 0;
    var total = this._levelTotalTiles || 0;
    document.getElementById('hud-remaining').textContent = remaining + '/' + total;
    var heartsHtml = '';
    for (var h = 0; h < CONFIG.MAX_LIVES; h++) {
      heartsHtml += '<img src="assets/ui-heart.png" class="' + (h >= this.lives ? 'lost' : '') + '" alt="">';
    }
    document.getElementById('hud-lives').innerHTML = heartsHtml;
    document.getElementById('hud-hint-count').textContent = this.hintsRemaining;

    // Timer display
    var timerEl = document.getElementById('hud-timer');
    var timeEl = document.getElementById('hud-time');
    if (timerEl && this.board && this.board.timeLimit) {
      timerEl.classList.remove('hidden');
      var secs = Math.max(0, this._timerSeconds);
      var mins = Math.floor(secs / 60);
      var remainSecs = secs % 60;
      timeEl.textContent = mins + ':' + (remainSecs < 10 ? '0' : '') + remainSecs;
      // Warning color when < 30s
      timeEl.style.color = secs <= 10 ? '#EF4444' : (secs <= 30 ? '#F59E0B' : '#fff');
    } else if (timerEl) {
      timerEl.classList.add('hidden');
    }
  }

  _drawMenuBg() {
    var ctx = this.renderer.ctx;
    var dpr = this.renderer.dpr || 1;
    var w = this.renderer.viewportWidth || this.canvas.width;
    var h = this.renderer.viewportHeight || this.canvas.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (this._menuBgImage && this._menuBgImage.complete && this._menuBgImage.naturalWidth > 0) {
      try { ctx.drawImage(this._menuBgImage, 0, 0, w, h); } catch(e) {}
    } else {
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(0.5, '#16213e'); grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }



  _showLevelsView(chapterIdx) {
    this._currentChapter = chapterIdx;
    document.getElementById('chapters-carousel').classList.add('hidden');
    document.getElementById('levels-view').classList.remove('hidden');
    document.getElementById('btn-level-select-menu').innerHTML = '<img src="assets/undo.png" alt="">' + _('backNav');
    var grid = document.getElementById('levels-grid');
    grid.innerHTML = '';
    var startLevel = chapterIdx * 10 + 1;
    var endLevel = Math.min((chapterIdx + 1) * 10, this.levelManager.total);
    var data = StorageManager.load();

    var cardEls = [];
    var bgCanvases = [];
    for (var lvlId = startLevel; lvlId <= endLevel; lvlId++) {
      var lvl = this.levelManager.getLevel(lvlId);
      if (!lvl) continue;
      var card = document.createElement('div');
      card.className = 'level-card';

      var bgCanvas = document.createElement('canvas');
      bgCanvas.className = 'level-card-bg-canvas';
      bgCanvas.width = 304;
      bgCanvas.height = 436;
      var sliceIdx = lvlId - startLevel;
      bgCanvas.dataset.sliceIdx = sliceIdx;

      var completed = data.completedLevels[lvlId];
      if (completed) { card.classList.add('completed'); }
      var isUnlocked = lvlId === 1 || !!data.completedLevels[lvlId - 1];
      card.classList.add(isUnlocked ? 'unlocked' : 'locked');

      var content = document.createElement('div');
      content.className = 'level-card-content';
      var title = document.createElement('div');
      title.className = 'level-card-title';
      title.textContent = _('level') + ' ' + lvlId;
      var starsDiv = document.createElement('div');
      starsDiv.className = 'level-card-stars';
      var starCount = completed ? completed.stars : 0;
      for (var s = 0; s < 3; s++) {
        var starImg = document.createElement('img');
        starImg.src = 'assets/star.png';
        if (s >= starCount) starImg.className = 'empty';
        starsDiv.appendChild(starImg);
      }
      content.appendChild(title);
      content.appendChild(starsDiv);
      card.appendChild(bgCanvas);
      card.appendChild(content);
      (function(levelId, card) {
        card.addEventListener('click', function() {
          if (card.classList.contains('locked')) return;
          document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
          document.getElementById('game-hud').classList.remove('hidden');
          game.sound.stopMusic();
          game.sound.playRandomGameMusic();
          game._startLevelWithTutorial(levelId);
        });
      })(lvlId, card);
      grid.appendChild(card);
      cardEls.push(card);
      bgCanvases.push(bgCanvas);
    }

    // Drag scroll for levels grid
    this._addDragScroll(grid);
    var self3 = this;
    grid.addEventListener('scroll', function() {
      if (self3._centerTick) cancelAnimationFrame(self3._centerTick);
      self3._centerTick = requestAnimationFrame(function() {
        self3._updateCenterCard(grid);
        var centerEl = grid.querySelector('.centered');
        if (centerEl && centerEl !== self3._lastCenteredCard) {
          self3._lastCenteredCard = centerEl;
          self3.sound.play('Leaf');
        }
      });
    });

    // Load chapter background, slice into 10 vertical columns, cover-fit each onto card
    var img = new Image();
    var self = this;
    img.onload = function() {
      var sliceW = img.width / 10;
      var cardW = 304, cardH = 436;
      for (var i = 0; i < bgCanvases.length; i++) {
        var sliceIdx = parseInt(bgCanvases[i].dataset.sliceIdx);
        var c = bgCanvases[i].getContext('2d');
        // cover-fit: scale so the slice fills the card, crop overflow
        var scale = Math.max(cardW / sliceW, cardH / img.height);
        var srcW = cardW / scale;
        var srcH = cardH / scale;
        var srcX = sliceIdx * sliceW + (sliceW - srcW) / 2;
        var srcY = (img.height - srcH) / 2;
        c.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cardW, cardH);
      }
    };
    img.onerror = function() {
      // Fallback: fill canvases with a dark color
      for (var i = 0; i < bgCanvases.length; i++) {
        var c = bgCanvases[i].getContext('2d');
        c.fillStyle = '#1a1a2e';
        c.fillRect(0, 0, bgCanvases[i].width, bgCanvases[i].height);
      }
    };
    img.src = 'assets/Background_' + chapterIdx + '.webp';

    // Auto-scroll to current level, or center if all locked/completed
    setTimeout(function() {
      var data = StorageManager.load();
      var targetId = data.currentLevel;
      if (targetId < startLevel || targetId > endLevel) {
        targetId = Math.floor((startLevel + endLevel) / 2);
      }
      var cards = grid.querySelectorAll('.level-card');
      var idx = targetId - startLevel;
      if (cards[idx]) {
        cards[idx].scrollIntoView({ behavior: 'auto', inline: 'center' });
        self3._updateCenterCard(grid);
      }
    }, 50);
  }



  _populateLevelGrid() { /* deprecated */ }

  // ==================== TUTORIAL ====================

  _startLevelWithTutorial(levelId) {
    var cfg = this.levelManager.getLevel(levelId);
    if (!cfg) { this._startLevel(levelId); return; }

    var tutorialByLevel = {
      1: 'welcome',
      2: 'hints',
      5: 'straight',
      11: 'corner',
      31: 'teleport',
      61: 'timer'
    };
    var pending = tutorialByLevel[levelId] ? [tutorialByLevel[levelId]] : [];

    if (pending.length > 0) {
      this._tutorialQueue = pending;
      this._pendingLevelId = levelId;
      this._showNextTutorial();
    } else {
      this._startLevel(levelId);
    }
  }

  _showNextTutorial() {
    if (this._tutorialQueue.length === 0) {
      this._currentTutorialId = null;
      document.getElementById('game-hud').classList.remove('hidden');
      this._startLevel(this._pendingLevelId);
      return;
    }
    var id = this._tutorialQueue.shift();
    this._showTutorial(id);
  }

  _refreshDynamicLang() {
    if (this._currentTutorialId) {
      document.getElementById('tutorial-title').textContent = _tutorialText(this._currentTutorialId, 'Title');
      document.getElementById('tutorial-text').textContent = _tutorialText(this._currentTutorialId, 'Text');
    }
    var softlock = document.getElementById('softlock-screen');
    if (softlock && !softlock.classList.contains('hidden')) {
      var softTitle = softlock.querySelector('h2');
      if (softTitle) softTitle.textContent = this._timerExpired ? _('timeUpTitle') : _('softlockTitle');
    }
    var win = document.getElementById('win-screen');
    if (win && !win.classList.contains('hidden') && this.currentLevelId) {
      document.getElementById('win-level-text').textContent = _('winLevel') + ' ' + this.currentLevelId + ' ' + _('winPassed');
    }
    var musicBtn = document.getElementById('btn-music-toggle');
    if (musicBtn && this.sound) {
      musicBtn.textContent = this.sound.isSfxEnabled() ? _('musicOn') : _('musicOff');
    }
  }

  _showTutorial(id) {
    if (!TUTORIAL_IDS[id]) return;
    this._currentTutorialId = id;
    this.state = 'tutorial';
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('tutorial-screen').classList.remove('hidden');
    document.getElementById('tutorial-title').textContent = _tutorialText(id, 'Title');
    document.getElementById('tutorial-text').textContent = _tutorialText(id, 'Text');

    var canvas = document.getElementById('tutorial-canvas');
    var ctx = canvas.getContext('2d');
    // Resize canvas bitmap to match actual display size (2x for retina)
    var displayW = canvas.clientWidth;
    var displayH = canvas.clientHeight;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTutorialDiagram(id, ctx, displayW, displayH);

    // Mark as shown and persist
    this._tutorialShown[id] = true;
    try {
      var data = StorageManager.load();
      if (data) { data.tutorials = this._tutorialShown;
        StorageManager.save(data); }
    } catch(e) {}
  }

  _hideTutorial() {
    document.getElementById('tutorial-screen').classList.add('hidden');
    this._showNextTutorial();
  }

  _resize() {
    var viewport = window.visualViewport;
    var w = Math.round(viewport ? viewport.width : window.innerWidth);
    var h = Math.round(viewport ? viewport.height : window.innerHeight);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this._canvasWidth === w && this._canvasHeight === h && this._canvasDpr === dpr) return;
    this._canvasWidth = w;
    this._canvasHeight = h;
    this._canvasDpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.canvas._logicalWidth = w;
    this.canvas._logicalHeight = h;
    this.renderer.setViewport(w, h, dpr);
    if (this.board) this.renderer.layout(this.board);
  }

  _scheduleResize() {
    if (this._resizeFrame) return;
    var self = this;
    this._resizeFrame = requestAnimationFrame(function() {
      self._resizeFrame = null;
      self._resize();
    });
  }

  _showPause() {
    if (this.state !== 'playing') return;
    this._stopTimer();
    this._gameplayStop();
    this._pauseRemaining = this._timerSeconds;
    document.getElementById('pause-screen').classList.remove('hidden');
  }

  _resumeGame() {
    document.getElementById('pause-screen').classList.add('hidden');
    if (this.state === 'playing') this._gameplayStart();
    if (this._pauseRemaining > 0) {
      this._timerSeconds = this._pauseRemaining;
      this._resumeTimer();
    }
  }

  _goToMenu() {
    this._stopTimer();
    this._showMenu();
  }

  _nextLevel() {
    var nextId = this.currentLevelId + 1;
    if (nextId > this.levelManager.total) return;
    var self = this;
    this._showInterstitialBeforeNext(function() {
      document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
      document.getElementById('game-hud').classList.remove('hidden');
      self._startLevelWithTutorial(nextId);
    });
  }

  _resetProgress() {
    StorageManager.resetProgress();
    this._showMenu();
  }
}

var game;
document.addEventListener('DOMContentLoaded', function() {
  function startGame() {
  game = new Game();
  if (typeof finishSdkBootstrap === 'function') {
    finishSdkBootstrap();
  } else {
    try {
      var langData = StorageManager.load();
      if (langData && langData.lang && LOCALES[langData.lang]) setLang(langData.lang);
    } catch(e) {}
    game._graReady = true;
    game._startApp();
  }
  document.getElementById('btn-continue').addEventListener('click', function() {
    var data = StorageManager.load();
    // Найти последний открытый уровень
    var lastUnlocked = 1;
    var lvl = 1;
    while (lvl <= game.levelManager.total) {
      if (lvl === 1 || data.completedLevels[lvl - 1]) {
        lastUnlocked = lvl;
      } else break;
      lvl++;
    }
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.add('hidden'); });
    document.getElementById('game-hud').classList.remove('hidden');
    game.sound.stopMusic();
    game.sound.playRandomGameMusic();
    game._startLevelWithTutorial(lastUnlocked);
  });
  document.getElementById('btn-levels').addEventListener('click', function() {
    var data = StorageManager.load();
    // Найти последний открытый уровень
    var lastUnlocked = 1;
    var lvl = 1;
    while (lvl <= game.levelManager.total) {
      if (lvl === 1 || data.completedLevels[lvl - 1]) {
        lastUnlocked = lvl;
      } else break;
      lvl++;
    }
    var targetChapter = Math.floor((lastUnlocked - 1) / 10);
    game._showLevelSelect(targetChapter);
    document.getElementById('levels-view').classList.add('hidden');
    document.getElementById('chapters-carousel').classList.remove('hidden');
    document.getElementById('btn-level-select-menu').innerHTML = '<img src="assets/undo.png" alt="">' + _('backNav');
    var carousel = document.getElementById('chapters-carousel');
    if (carousel.children[targetChapter]) {
      carousel.children[targetChapter].scrollIntoView({ behavior: 'auto', inline: 'center' });
    }
  });
  document.getElementById('btn-level-select-menu').addEventListener('click', function() {
    if (document.getElementById('levels-view').classList.contains('hidden')) {
      game._showMenu();
    } else {
      document.getElementById('levels-view').classList.add('hidden');
      document.getElementById('chapters-carousel').classList.remove('hidden');
      document.getElementById('btn-level-select-menu').innerHTML = '<img src="assets/undo.png" alt="">' + _('backNav');
      // Scroll to the chapter we came from
      var ch = game._currentChapter;
      if (ch !== undefined) {
        var carousel = document.getElementById('chapters-carousel');
        if (carousel.children[ch]) {
          carousel.children[ch].scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      }
    }
  });
  document.getElementById('btn-hint').addEventListener('click', function() { game.showHint(); });
  document.getElementById('btn-pause').addEventListener('click', function() { game._showPause(); });
  document.getElementById('btn-resume').addEventListener('click', function() { game._resumeGame(); });
  document.getElementById('btn-pause-restart').addEventListener('click', function() { game.restartLevel(); });
  document.getElementById('btn-pause-menu').addEventListener('click', function() { game._goToMenu(); });
  document.getElementById('btn-next-level').addEventListener('click', function() { game._nextLevel(); });
  var winLevelsBtn = document.getElementById('btn-win-levels');
  if (winLevelsBtn) winLevelsBtn.addEventListener('click', function() {
    var ch = Math.floor((game.currentLevelId - 1) / 10);
    game._showLevelSelect(ch);
  });
  document.getElementById('btn-softlock-restart').addEventListener('click', function() { game.restartLevel(); });
  document.getElementById('btn-softlock-menu').addEventListener('click', function() { game._goToMenu(); });
  document.getElementById('btn-win-menu').addEventListener('click', function() { game._goToMenu(); });
  document.getElementById('btn-settings').addEventListener('click', function() { game._showSettings(); });
  document.getElementById('btn-lang-ru').addEventListener('click', function() { setLang('ru'); document.getElementById('btn-lang-ru').classList.add('active'); document.getElementById('btn-lang-en').classList.remove('active'); });
  document.getElementById('btn-lang-en').addEventListener('click', function() { setLang('en'); document.getElementById('btn-lang-en').classList.add('active'); document.getElementById('btn-lang-ru').classList.remove('active'); });
  document.getElementById('btn-music-toggle').addEventListener('click', function() { game._toggleMusic(); });
  document.getElementById('music-volume-slider').addEventListener('input', function(e) { game._setMusicVolume(e.target.value); });
  document.getElementById('btn-settings-back').addEventListener('click', function() { game._showMenu(); });
  document.getElementById('btn-settings-back-mobile').addEventListener('click', function() { game._showMenu(); });
  document.getElementById('btn-tutorial-gotit').addEventListener('click', function() { game._hideTutorial(); });
  document.getElementById('btn-leaderboard').addEventListener('click', function() { game._openLeaderboard(); });
  document.getElementById('btn-leader-back').addEventListener('click', function() { game._showMenu(); });
  document.getElementById('btn-softlock-skip').addEventListener('click', function() { game._showSkipLevelAd(); });
  document.getElementById('btn-softlock-ad').addEventListener('click', function() { game._showRewardedAd(); });
  document.getElementById('btn-hint-ad-yes').addEventListener('click', function() { game._showHintAd(); });
  document.getElementById('btn-hint-ad-no').addEventListener('click', function() {
    document.getElementById('hint-ad-screen').classList.add('hidden');
  });
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  document.addEventListener('selectstart', function(e) { e.preventDefault(); });
  document.addEventListener('dragstart', function(e) { e.preventDefault(); });
  }

  if (typeof window.prepareVkStorage === 'function') {
    window.prepareVkStorage().then(startGame).catch(function(err) {
      console.error('VK storage init error:', err);
      startGame();
    });
  } else {
    startGame();
  }
});

// Инициализация VK Bridge — язык и SDK до показа UI, локальный запуск остается рабочим.
(function initVkBridge() {
  function getVkBridge() {
    var bridge = window.vkBridge;
    if (bridge && bridge.default && typeof bridge.default.send === 'function') return bridge.default;
    if (bridge && typeof bridge.send === 'function') return bridge;
    return null;
  }

  function hasVkLaunchParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      return !!(params.get('vk_app_id') || params.get('vk_platform') || params.get('sign'));
    } catch(e) {
      return false;
    }
  }

  var _vkBridgeInstance = getVkBridge();
  if (!_vkBridgeInstance || !hasVkLaunchParams()) return;
  var _vkReady = false;
  var _vkStorageReady = false;
  var _vkInitPromise = null;

  function normalizeVkLang(rawLang) {
    var value = (rawLang || '').toLowerCase();
    return value.indexOf('ru') === 0 ? 'ru' : 'en';
  }

  function readUrlLang() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('vk_language') || params.get('language') || params.get('lang');
    } catch(e) {
      return '';
    }
  }

  function applyVkLanguage(params) {
    try {
      var sdkLang = params && (params.vk_language || params.language || params.lang);
      setLang(normalizeVkLang(sdkLang || readUrlLang()), false);
    } catch(e) {}
  }

  window.finishSdkBootstrap = function() {
    if (!_vkReady || !_vkStorageReady || typeof game === 'undefined' || !game || game._graReady) return;
    game._vkBridge = _vkBridgeInstance;
    game._graReady = true;
    game._syncLeaderboard();
    game._tryStartApp();
  };

  window.prepareVkStorage = function() {
    if (typeof StorageManager === 'undefined' || typeof StorageManager.initVkStorage !== 'function') {
      _vkStorageReady = true;
      return Promise.resolve();
    }
    return _vkInitPromise.then(function() {
      return StorageManager.initVkStorage(_vkBridgeInstance);
    }).then(function() {
      _vkStorageReady = true;
    });
  };

  _vkInitPromise = _vkBridgeInstance.send('VKWebAppInit').then(function() {
    return _vkBridgeInstance.send('VKWebAppGetLaunchParams');
  }).then(function(params) {
    applyVkLanguage(params);
    _vkReady = true;
    finishSdkBootstrap();
  }).catch(function(err) {
    console.error('VK Bridge init error:', err);
    applyVkLanguage(null);
    _vkReady = true;
    finishSdkBootstrap();
  });
})();
