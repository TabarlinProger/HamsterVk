var vm = require('vm');
var fs = require('fs');

global.window = global;
global.document = {
  getElementById: function() { return { style: {}, classList: { add: function(){}, remove: function(){} } }; },
  querySelectorAll: function() { return []; },
  addEventListener: function() {},
  createElement: function(tag) { return tag === 'canvas' ? { getContext: function() { return {}; }, width: 800, height: 600, style: {} } : { style: {}, classList: { add: function(){}, remove: function(){} } }; }
};
global.localStorage = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} };
global.Image = function() { this.onload = null; this.src = ''; };
global.performance = { now: function() { return Date.now(); } };
global.requestAnimationFrame = function() {};
global.setTimeout = setTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;

function loadFile(path) {
  var code = fs.readFileSync(path, 'utf-8');
  new vm.Script(code, { filename: path }).runInThisContext();
}

var base = '/sessions/ecstatic-confident-pascal/mnt/CodexGame/sort-tiles/js/';
loadFile(base + 'config.js');
loadFile(base + 'levels.js');
loadFile(base + 'game-core.js');
loadFile(base + 'sprites.js');
loadFile(base + 'renderer.js');

// === Test 1: Tube exit side logic ===
console.log('=== Test 1: _tubeExitSide ===');
// Straight horizontal (orientation 0): connects left(3) <-> right(1)
console.log('Straight h: 3->1 =', _tubeExitSide({type:'straight',orientation:0}, 3), '(expect 1)');
console.log('Straight h: 1->3 =', _tubeExitSide({type:'straight',orientation:0}, 1), '(expect 3)');
console.log('Straight h: 0->null =', _tubeExitSide({type:'straight',orientation:0}, 0), '(expect null)');
// Straight vertical (orientation 1): connects top(0) <-> bottom(2)
console.log('Straight v: 0->2 =', _tubeExitSide({type:'straight',orientation:1}, 0), '(expect 2)');
console.log('Straight v: 2->0 =', _tubeExitSide({type:'straight',orientation:1}, 2), '(expect 0)');
// Corner orientation 0: connects right(1) <-> bottom(2)
console.log('Corner ori0: 1->2 =', _tubeExitSide({type:'corner',orientation:0}, 1), '(expect 2)');
console.log('Corner ori0: 2->1 =', _tubeExitSide({type:'corner',orientation:0}, 2), '(expect 1)');
console.log('Corner ori0: 0->null =', _tubeExitSide({type:'corner',orientation:0}, 0), '(expect null)');
// Corner orientation 1: connects bottom(2) <-> left(3)
console.log('Corner ori1: 2->3 =', _tubeExitSide({type:'corner',orientation:1}, 2), '(expect 3)');
// Corner orientation 2: connects left(3) <-> top(0)
console.log('Corner ori2: 3->0 =', _tubeExitSide({type:'corner',orientation:2}, 3), '(expect 0)');
// Corner orientation 3: connects top(0) <-> right(1)
console.log('Corner ori3: 0->1 =', _tubeExitSide({type:'corner',orientation:3}, 0), '(expect 1)');

// === Test 2: Rotatable tube rotation ===
console.log('\n=== Test 2: Rotatable tube ===');
var lvl30 = LEVELS[29]; // Level 30: portals (rotatable tubes)
console.log('Level 30 tubes:', lvl30.tubes ? lvl30.tubes.length : 0);
var board30 = new Board(lvl30);
board30.tubes.forEach(function(t, k) { console.log('  ' + k + ': ' + t.type + ' ori=' + t.orientation); });
if (board30.tubes.size > 0) {
  var firstKey = board30.tubes.keys().next().value;
  var parts = firstKey.split(',');
  var tr = parseInt(parts[0]), tc = parseInt(parts[1]);
  console.log('isRotatableTube(' + tr + ',' + tc + '):', board30.isRotatableTube(tr, tc));
  var before = board30.getTube(tr, tc).orientation;
  board30.rotateTube(tr, tc);
  var after = board30.getTube(tr, tc).orientation;
  console.log('Rotated: ' + before + ' -> ' + after);
  console.log('isRotatableTube on tile cell:', board30.isRotatableTube(board30.tiles[0].row, board30.tiles[0].col));
}

// === Test 3: canMove with tube redirection ===
console.log('\n=== Test 3: canMove through tubes ===');
// Create a simple test board with tubes
var testCfg = {
  rows: 5, cols: 5, optimalMoves: 5, features: [],
  tiles: [
    { row: 0, col: 0, direction: 'right' },
    { row: 4, col: 4, direction: 'left' }
  ],
  tubes: [
    { row: 0, col: 2, type: 'straight', orientation: 0, colorIndex: 0 },
    { row: 2, col: 4, type: 'corner', orientation: 2, colorIndex: 1 },
    { row: 4, col: 2, type: 'straight', orientation: 1, colorIndex: 2 }
  ]
};
var testBoard = new Board(testCfg);
console.log('Test board: tiles=' + testBoard.tiles.length + ', tubes=' + testBoard.tubes.size);
for (var i = 0; i < testBoard.tiles.length; i++) {
  var t = testBoard.tiles[i];
  var result = testBoard.canMove(t);
  console.log('  Tile ' + i + ' at (' + t.row + ',' + t.col + ') dir=' + t.direction + ' -> ' + result);
}

// === Test 4: Solvability check on simple level ===
console.log('\n=== Test 4: LevelManager.isSolvable ===');
var simpleCfg = {
  rows: 3, cols: 3, optimalMoves: 3, features: [],
  tiles: [
    { row: 0, col: 1, direction: 'up' },
    { row: 1, col: 1, direction: 'up' }
  ]
};
console.log('Simple 3x3 with 2 tiles: ' + (LevelManager.isSolvable(simpleCfg, 1000) ? 'SOLVABLE' : 'NOT SOLVABLE'));

var tubeCfg = {
  rows: 3, cols: 4, optimalMoves: 3, features: ['rotating'],
  tiles: [
    { row: 0, col: 0, direction: 'right' }
  ],
  tubes: [
    { row: 0, col: 1, type: 'straight', orientation: 0, colorIndex: 0 } // horizontal tube redirects right-through
  ]
};
console.log('3x4 with tube passthrough: ' + (LevelManager.isSolvable(tubeCfg, 1000) ? 'SOLVABLE' : 'NOT SOLVABLE'));

var cornerCfg = {
  rows: 3, cols: 4, optimalMoves: 3, features: ['walls'],
  tiles: [
    { row: 2, col: 0, direction: 'right' }
  ],
  tubes: [
    { row: 2, col: 1, type: 'corner', orientation: 0, colorIndex: 0 } // corner: right->bottom (1->2), so from right side, exit bottom — but cell below needs to be free or exit
  ]
};
console.log('3x4 with corner tube: ' + (LevelManager.isSolvable(cornerCfg, 1000) ? 'SOLVABLE' : 'NOT SOLVABLE'));

console.log('\nAll tests complete.');
