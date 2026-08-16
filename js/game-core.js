/**
 * game-core.js — ядро игры «Сортируй Плитки» (версия с трубами)
 * Содержит: Tile, Board, LevelManager, StorageManager
 */

// ==================== TUBE HELPERS ====================
// Sides: 0=top, 1=right, 2=bottom, 3=left

function _dirToSide(dir) {
  var map = { up: 2, right: 3, down: 0, left: 1 };
  return map[dir];
}

function _sideToDir(side) {
  var map = { 0: 'up', 1: 'right', 2: 'down', 3: 'left' };
  return map[side];
}

function _tubeExitSide(tube, entrySide) {
  if (tube.type === 'teleport') {
    // Портал принимает вход с любой стороны и сохраняет направление движения.
    return (entrySide + 2) % 4;
  }
  if (tube.type === 'straight') {
    var horizontal = (tube.orientation % 2 === 0);
    if (horizontal) {
      if (entrySide === 3) return 1;
      if (entrySide === 1) return 3;
    } else {
      if (entrySide === 0) return 2;
      if (entrySide === 2) return 0;
    }
    return null;
  }
  if (tube.type === 'corner' || tube.type === 'rotatable') {
    var pairs = [[1, 2], [2, 3], [3, 0], [0, 1]];
    var ab = pairs[tube.orientation % 4];
    if (entrySide === ab[0]) return ab[1];
    if (entrySide === ab[1]) return ab[0];
    return null;
  }
  return null;
}

// ==================== TILE ====================
class Tile {
  constructor(id, row, col, direction) {
    this.id = id;
    this.row = row;
    this.col = col;
    this.direction = direction;
    this.isMoving = false;
    this.isExiting = false;
  }

  get color() {
    return CONFIG.TILE_COLORS[this.direction];
  }

  getTarget() {
    var map = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    var dc = map[this.direction];
    return { row: this.row + dc[0], col: this.col + dc[1] };
  }

  clone() {
    return new Tile(this.id, this.row, this.col, this.direction);
  }
}


// ==================== BOARD ====================
class Board {
  constructor(cfg) {
    this.rows = cfg.rows;
    this.cols = cfg.cols;
    this.optimalMoves = cfg.optimalMoves;
    this.backgroundId = cfg.backgroundId || cfg.id;
    this.features = cfg.features || [];
    this.timeLimit = cfg.timeLimit || 0;

    this.grid = [];
    for (var r = 0; r < this.rows; r++) {
      this.grid[r] = new Array(this.cols).fill(null);
    }

    if (cfg.blockedCells) {
      for (var i = 0; i < cfg.blockedCells.length; i++) {
        var bc = cfg.blockedCells[i];
        if (bc[0] < this.rows && bc[1] < this.cols) this.grid[bc[0]][bc[1]] = -1;
      }
    }

    this.tubes = new Map();
    if (cfg.tubes) {
      for (var ti = 0; ti < cfg.tubes.length; ti++) {
        var t = cfg.tubes[ti];
        var key = t.row + ',' + t.col;
        this.tubes.set(key, {
          type: t.type,
          orientation: t.orientation || 0,
          colorIndex: t.colorIndex || 0,
          rotatable: t.rotatable || false
        });
      }
    }

    this.tiles = [];
    var nextId = 0;
    for (var i = 0; i < cfg.tiles.length; i++) {
      var td = cfg.tiles[i];
      var tid = (td._id !== undefined) ? td._id : nextId++;
      var tile = new Tile(tid, td.row, td.col, td.direction);
      if (tile.row < this.rows && tile.col < this.cols) {
        this.grid[tile.row][tile.col] = tile;
        this.tiles.push(tile);
      }
    }
  }

  cell(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return undefined;
    return this.grid[r][c];
  }

  getTile(r, c) {
    var cell = this.cell(r, c);
    return cell instanceof Tile ? cell : null;
  }

  isEmpty(r, c) {
    return this.cell(r, c) === null;
  }

  isBlocked(r, c) {
    return this.cell(r, c) === -1;
  }

  inBounds(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  isPassable(r, c) {
    if (!this.inBounds(r, c)) return false;
    if (this.isBlocked(r, c)) return false;
    return true;
  }

  hasTube(r, c) {
    return this.tubes.has(r + ',' + c);
  }

  getTube(r, c) {
    return this.tubes.get(r + ',' + c) || null;
  }

  isRotatableTube(r, c) {
    var tube = this.getTube(r, c);
    return tube && (tube.type === 'rotatable' || tube.rotatable);
  }

  _findTeleportPair(colorIndex, excludeKey) {
    var result = null;
    this.tubes.forEach(function(tube, key) {
      if (result) return;
      if (tube.type === 'teleport' && tube.colorIndex === colorIndex && key !== excludeKey) {
        var parts = key.split(',');
        result = { row: parseInt(parts[0]), col: parseInt(parts[1]) };
      }
    });
    return result;
  }

  rotateTube(r, c) {
    var tube = this.getTube(r, c);
    if (tube && (tube.type === 'rotatable' || tube.rotatable)) {
      tube.orientation = (tube.orientation + 1) % 4;
    }
  }

  isCleared() {
    return this.tiles.length === 0;
  }

  hasRotatableTube() {
    var found = false;
    this.tubes.forEach(function(tube) {
      if (tube.type === 'rotatable' || tube.rotatable) found = true;
    });
    return found;
  }

  hasValidMoves() {
    // Продуктивен только ход, выводящий хомяка с поля ('exit').
    // Ход 'move' (скольжение без выхода) штрафует игрока, поэтому не считается.
    for (var i = 0; i < this.tiles.length; i++) {
      if (this.canMove(this.tiles[i]) === 'exit') return true;
    }
    // Поворотные трубы позволяют переконфигурировать пути — не софтлок.
    return this.hasRotatableTube();
  }

  findHintTile() {
    for (var i = 0; i < this.tiles.length; i++) {
      if (this.canMove(this.tiles[i]) === 'exit') return this.tiles[i];
    }
    return null;
  }

  canMove(tile) {
    var offsets = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    var r = tile.row;
    var c = tile.col;
    var dir = tile.direction;
    var moved = false;

    var _steps = 0;
    while (true) {
      if (++_steps > 200) return false;
      var dr_dc = offsets[dir];
      var nr = r + dr_dc[0];
      var nc = c + dr_dc[1];

      if (!this.inBounds(nr, nc)) {
        return 'exit';
      }

      var tube = this.getTube(nr, nc);
      if (tube) {
        if (tube.type === 'teleport') {
          var pair = this._findTeleportPair(tube.colorIndex, nr + ',' + nc);
          if (pair) {
            var teleportExitSide = _tubeExitSide(tube, _dirToSide(dir));
            r = pair.row; c = pair.col;
            dir = _sideToDir(teleportExitSide);
            moved = true;
            continue;
          } else {
            break;
          }
        }
        var entrySide = _dirToSide(dir);
        var exitSide = _tubeExitSide(tube, entrySide);
        if (exitSide === null) break;
        dir = _sideToDir(exitSide);
        r = nr; c = nc;
        moved = true;
        continue;
      }

      if (this.isPassable(nr, nc) && (this.isEmpty(nr, nc) || (nr === tile.row && nc === tile.col))) {
        r = nr; c = nc;
        moved = true;
      } else {
        break;
      }
    }

    // Нельзя останавливаться на клетке с трубой
    if (moved && this.getTube(r, c)) return false;

    return moved ? 'move' : false;
  }

  moveTile(tile, toRow, toCol) {
    this.grid[tile.row][tile.col] = null;
    tile.row = toRow;
    tile.col = toCol;
    this.grid[toRow][toCol] = tile;
  }

  removeTile(tile) {
    this.grid[tile.row][tile.col] = null;
    this.tiles = this.tiles.filter(function(t) { return t !== tile; });
  }

  restoreTile(tile, row, col) {
    this.grid[row][col] = tile;
    tile.row = row;
    tile.col = col;
    if (this.tiles.indexOf(tile) === -1) this.tiles.push(tile);
  }

  getStateKey() {
    var tilesKey = this.tiles
      .map(function(t) { return t.row + ',' + t.col + ',' + t.direction; })
      .sort()
      .join('|');
    var tubesKey = '';
    var self = this;
    this.tubes.forEach(function(tube, key) {
      tubesKey += key + ':' + tube.type + ':' + tube.orientation + ';';
    });
    return tilesKey + '||' + tubesKey;
  }

  clone() {
    var cfg = {
      rows: this.rows,
      cols: this.cols,
      optimalMoves: this.optimalMoves,
      features: this.features.slice(),
      timeLimit: this.timeLimit,
      tiles: this.tiles.map(function(t) {
        return { row: t.row, col: t.col, direction: t.direction, _id: t.id };
      }),
      blockedCells: this._blockedList()
    };
    if (this.tubes.size > 0) {
      cfg.tubes = [];
      this.tubes.forEach(function(tube, key) {
        var parts = key.split(',');
        cfg.tubes.push({
          row: parseInt(parts[0]), col: parseInt(parts[1]),
          type: tube.type, orientation: tube.orientation,
          colorIndex: tube.colorIndex, rotatable: tube.rotatable
        });
      });
    }

    var cloned = new Board(cfg);
    return cloned;
  }

  _blockedList() {
    var list = [];
    for (var r = 0; r < this.rows; r++)
      for (var c = 0; c < this.cols; c++)
        if (this.grid[r][c] === -1) list.push([r, c]);
    return list;
  }
}


// ==================== LEVEL MANAGER ====================
class LevelManager {
  constructor() {
    this.levels = LEVELS;
  }

  get total() { return this.levels.length; }

  getLevel(id) {
    return this.levels.find(function(l) { return l.id === id; }) || null;
  }

  getLevelByIndex(idx) {
    return this.levels[idx] || null;
  }

  static isSolvable(levelCfg, maxStates) {
    if (!maxStates) maxStates = 50000;
    var board = new Board(levelCfg);
    var visited = new Set();
    // Use stack (DFS) instead of queue (BFS) to go deeper with limited state budget
    var stack = [board];
    var offsets = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

    while (stack.length > 0 && visited.size < maxStates) {
      var state = stack.pop();
      if (state.isCleared()) return true;

      var key = state.getStateKey();
      if (visited.has(key)) continue;
      visited.add(key);

      var tiles = state.tiles.slice();

      for (var ti = 0; ti < tiles.length; ti++) {
        var tile = tiles[ti];

        var result = state.canMove(tile);
        if (!result) continue;

        var next = state.clone();
        var nextTile = next.tiles.find(function(t) { return t.id === tile.id; });
        if (!nextTile) continue;

        var dir = nextTile.direction;
        var r = nextTile.row;
        var c = nextTile.col;
        var exited = false;
        var visitedPath = new Set();

        while (true) {
          var pathKey = r + ',' + c + ',' + dir;
          if (visitedPath.has(pathKey)) break;
          visitedPath.add(pathKey);
          var dr_dc = offsets[dir];
          var nr = r + dr_dc[0];
          var nc = c + dr_dc[1];

          if (!next.inBounds(nr, nc)) { exited = true; break; }

          var tube = next.getTube(nr, nc);
          if (tube) {
            if (tube.type === 'teleport') {
              var pair = next._findTeleportPair(tube.colorIndex, nr + ',' + nc);
              if (pair) {
                var teleportExitSide = _tubeExitSide(tube, _dirToSide(dir));
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
            dir = _sideToDir(exitSide);
            r = nr; c = nc;
            continue;
          }

          if (next.isPassable(nr, nc) && (next.isEmpty(nr, nc) || (nr === nextTile.row && nc === nextTile.col))) {
            r = nr; c = nc;
          } else {
            break;
          }
        }

        // После цикла: если остановились на трубе — ход невалидный
        // (телепорт считается валидным, т.к. после телепорта позиция уже не на трубе)
        if (!exited && next.getTube(r, c)) continue;

        if (exited) {
          next.removeTile(nextTile);
        } else {
          next.moveTile(nextTile, r, c);
        }
        stack.push(next);
      }
    }
    return false;
  }
}


// ==================== STORAGE MANAGER ====================
class StorageManager {
  static load() {
    if (StorageManager._cache) return StorageManager._normalize(StorageManager._cache);
    try {
      var raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) return StorageManager._defaultData();
      var data = JSON.parse(raw);
      return StorageManager._normalize(data);
    } catch (e) {
      return StorageManager._defaultData();
    }
  }

  static save(data) {
    data = StorageManager._normalize(data);
    StorageManager._cache = data;
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    StorageManager._saveVk(data);
  }

  static initVkStorage(bridge) {
    StorageManager._vkBridge = bridge;
    if (!bridge || typeof bridge.send !== 'function') return Promise.resolve();
    var keys = StorageManager._vkKeys();
    return bridge.send('VKWebAppStorageGet', { keys: keys }).then(function(res) {
      var values = {};
      var entries = (res && res.keys) || [];
      for (var i = 0; i < entries.length; i++) values[entries[i].key] = entries[i].value || '';

      var raw = values[CONFIG.STORAGE_KEY] || '';
      if (!raw && values[CONFIG.STORAGE_KEY + '_0']) {
        raw = '';
        for (var ci = 0; ci < StorageManager.VK_CHUNK_COUNT; ci++) {
          raw += values[CONFIG.STORAGE_KEY + '_' + ci] || '';
        }
      }

      if (raw) {
        StorageManager._cache = StorageManager._normalize(JSON.parse(raw));
        try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(StorageManager._cache)); } catch(e) {}
      } else {
        StorageManager._cache = StorageManager.load();
      }
      StorageManager._vkReady = true;
      if (!raw) StorageManager._saveVk(StorageManager._cache);
    }).catch(function(e) {
      console.error('VK storage load error:', e);
      StorageManager._cache = StorageManager.load();
      StorageManager._vkReady = false;
    });
  }

  static _saveVk(data) {
    if (!StorageManager._vkReady || !StorageManager._vkBridge || typeof StorageManager._vkBridge.send !== 'function') return;
    var raw = JSON.stringify(data);
    var chunkSize = StorageManager.VK_CHUNK_SIZE;
    for (var i = 0; i < StorageManager.VK_CHUNK_COUNT; i++) {
      var value = raw.slice(i * chunkSize, (i + 1) * chunkSize);
      StorageManager._vkBridge.send('VKWebAppStorageSet', {
        key: CONFIG.STORAGE_KEY + '_' + i,
        value: value
      }).catch(function(e) {
        console.error('VK storage save error:', e);
      });
    }
    StorageManager._vkBridge.send('VKWebAppStorageSet', {
      key: CONFIG.STORAGE_KEY,
      value: ''
    }).catch(function(e) {
      console.error('VK storage cleanup error:', e);
    });
  }

  static _vkKeys() {
    var keys = [CONFIG.STORAGE_KEY];
    for (var i = 0; i < StorageManager.VK_CHUNK_COUNT; i++) keys.push(CONFIG.STORAGE_KEY + '_' + i);
    return keys;
  }

  static markCompleted(levelId, moves, livesRemaining) {
    var data = StorageManager.load();

    // Звезды выдаются по оставшимся жизням: 3/2/1 жизни = 3/2/1 звезды.
    var stars = Math.max(1, Math.min(CONFIG.MAX_LIVES, livesRemaining || 1));

    var prev = data.completedLevels[levelId];
    var bestMoves = prev ? Math.min(prev.bestMoves, moves) : moves;
    var bestLives = prev ? Math.max(prev.bestLives || 0, livesRemaining || 0) : (livesRemaining || 0);
    var bestStars = prev ? Math.max(prev.stars, stars) : stars;

    data.completedLevels[levelId] = { moves: moves, stars: bestStars, bestMoves: bestMoves, lives: livesRemaining, bestLives: bestLives };
    if (levelId >= data.currentLevel) {
      data.currentLevel = levelId + 1;
    }
    StorageManager.save(data);
    return { stars: stars, bestMoves: bestMoves };
  }

  static markSkipped(levelId) {
    var data = StorageManager.load();
    var prev = data.completedLevels[levelId];
    if (!prev) {
      data.completedLevels[levelId] = { moves: 0, stars: 0, bestMoves: 0, lives: 0, bestLives: 0, skipped: true };
    }
    if (levelId >= data.currentLevel) {
      data.currentLevel = levelId + 1;
    }
    StorageManager.save(data);
  }

  static resetProgress() {
    StorageManager._cache = StorageManager._defaultData();
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    StorageManager._saveVk(StorageManager._cache);
  }

  static _normalize(data) {
    var def = StorageManager._defaultData();
    data = data || {};
    return Object.assign({}, def, data, { settings: Object.assign({}, def.settings, data.settings) });
  }

  static _defaultData() {
    return {
      currentLevel: 1,
      completedLevels: {},
      settings: { musicVolume: 0.2, sfxVolume: 0.7, sfxEnabled: true }
    };
  }
}

StorageManager.VK_CHUNK_SIZE = 3500;
StorageManager.VK_CHUNK_COUNT = 8;
StorageManager._cache = null;
StorageManager._vkBridge = null;
StorageManager._vkReady = false;
