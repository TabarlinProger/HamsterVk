// Simulate browser globals
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
global.confirm = function() { return false; };

var vm = require('vm');

function loadFile(path) {
  var fs = require('fs');
  var code = fs.readFileSync(path, 'utf-8');
  var script = new vm.Script(code, { filename: path });
  script.runInThisContext();
}

var base = '/sessions/ecstatic-confident-pascal/mnt/CodexGame/sort-tiles/js/';
var files = ['config.js', 'levels.js', 'game-core.js', 'sprites.js', 'renderer.js', 'main.js'];

files.forEach(function(f) {
  try {
    loadFile(base + f);
    console.log('OK: ' + f);
  } catch (e) {
    console.log('FAIL: ' + f + ' — ' + e.message);
  }
});

console.log('');
console.log('Board=' + typeof Board + ', Tile=' + typeof Tile);
console.log('Helpers: _dirToSide=' + typeof _dirToSide + ', _tubeExitSide=' + typeof _tubeExitSide);
console.log('LEVELS: ' + LEVELS.length);

// Test tube level
var lvl10 = LEVELS[9];
console.log('\nLevel 10: tubes=' + (lvl10.tubes ? lvl10.tubes.length : 0));
var board = new Board(lvl10);
console.log('Tiles: ' + board.tiles.length + ', Tubes: ' + board.tubes.size);
board.tubes.forEach(function(t, k) { console.log('  tube ' + k + ': ' + t.type); });

var moves = 0;
for (var i = 0; i < board.tiles.length; i++) {
  if (board.canMove(board.tiles[i])) moves++;
}
console.log('Movable tiles: ' + moves + '/' + board.tiles.length);
