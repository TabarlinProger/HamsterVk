const fs = require('fs');
const vm = require('vm');

global.window = global;
for (const file of ['js/config.js', 'js/levels.js', 'js/game-core.js']) {
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

const level = LEVELS.find((l) => l.id === 61);
const offsets = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

function simulateExit(board, tile) {
  let r = tile.row;
  let c = tile.col;
  let dir = tile.direction;
  const seen = new Set();
  let tubes = 0;

  while (true) {
    const key = `${r},${c},${dir}`;
    if (seen.has(key)) return null;
    seen.add(key);

    const d = offsets[dir];
    const nr = r + d[0];
    const nc = c + d[1];
    if (!board.inBounds(nr, nc)) return { tubes };

    const tube = board.getTube(nr, nc);
    if (tube) {
      tubes++;
      if (tube.type === 'teleport') {
        const pair = board._findTeleportPair(tube.colorIndex, `${nr},${nc}`);
        if (!pair) return null;
        const out = _tubeExitSide(tube, _dirToSide(dir));
        r = pair.row;
        c = pair.col;
        dir = _sideToDir(out);
        continue;
      }
      const out = _tubeExitSide(tube, _dirToSide(dir));
      if (out === null) return null;
      r = nr;
      c = nc;
      dir = _sideToDir(out);
      continue;
    }

    if (board.isPassable(nr, nc) && (board.isEmpty(nr, nc) || (nr === tile.row && nc === tile.col))) {
      r = nr;
      c = nc;
      continue;
    }

    return null;
  }
}

function rotatableKeys(board) {
  const keys = [];
  board.tubes.forEach((tube, key) => {
    if (tube.type === 'rotatable' || tube.rotatable) keys.push(key);
  });
  return keys;
}

function solve(maxStates = 200000) {
  const stack = [new Board(level)];
  const seen = new Set();
  let best = level.tiles.length;
  let maxTubeMove = 0;

  while (stack.length && seen.size < maxStates) {
    const board = stack.pop();
    const key = board.getStateKey();
    if (seen.has(key)) continue;
    seen.add(key);

    if (board.tiles.length < best) {
      best = board.tiles.length;
      console.log(`bestRemaining=${best} states=${seen.size} stack=${stack.length} maxTubeMove=${maxTubeMove}`);
    }
    if (board.isCleared()) return { solved: true, states: seen.size, best, maxTubeMove };

    for (const tile of board.tiles) {
      const move = simulateExit(board, tile);
      if (!move) continue;
      if (move.tubes > maxTubeMove) maxTubeMove = move.tubes;
      const next = board.clone();
      next.removeTile(next.tiles.find((t) => t.id === tile.id));
      stack.push(next);
    }

    for (const k of rotatableKeys(board)) {
      const next = board.clone();
      const tube = next.tubes.get(k);
      tube.orientation = (tube.orientation + 1) % 4;
      stack.push(next);
    }
  }

  return { solved: false, states: seen.size, best, maxTubeMove };
}

const initial = new Board(level);
console.log('initial exits:');
for (const tile of initial.tiles) {
  const move = simulateExit(initial, tile);
  if (move) console.log(`tile ${tile.id} @${tile.row},${tile.col} ${tile.direction} tubes=${move.tubes}`);
}
console.log(JSON.stringify(solve(parseInt(process.argv[2] || '200000', 10)), null, 2));
