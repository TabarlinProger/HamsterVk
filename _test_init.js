/**
 * Test script — loads all game modules and checks initialization
 */
var fs = require('fs');
var vm = require('vm');

global.window = global;
global.document = {
  getElementById: function() {
    return {
      style:{}, classList:{add:function(){},remove:function(){}},
      innerHTML: '', textContent:'',
      addEventListener: function(){},
      querySelectorAll: function(){return[];},
      getContext: function() {
        return {
          fillStyle:'',fillRect:function(){},clearRect:function(){},
          drawImage:function(){},save:function(){},restore:function(){},
          translate:function(){},rotate:function(){},scale:function(){},
          arc:function(){},stroke:function(){},beginPath:function(){},
          moveTo:function(){},lineTo:function(){},closePath:function(){},
          strokeStyle:'',lineWidth:0,globalAlpha:1,setLineDash:function(){},
          lineDashOffset:0,
          createLinearGradient:function(){return{addColorStop:function(){}}}, createRadialGradient:function(){return{addColorStop:function(){}}}
        };
      }
    };
  },
  querySelectorAll: function(){return[];},
  addEventListener: function(){},
  createElement: function(tag){
    if(tag==='canvas') return {
      getContext:function(){return{fillStyle:'',fillRect:function(){},clearRect:function(){},drawImage:function(){},save:function(){},restore:function(){},translate:function(){},rotate:function(){},scale:function(){}}},
      width:800,height:600,style:{}
    };
    return {style:{},classList:{add:function(){},remove:function(){}},addEventListener:function(){}};
  }
};
global.localStorage = { getItem:function(){return null;}, setItem:function(){}, removeItem:function(){} };
global.Image = function(){ this.onload=null; this.src=''; this.complete=true; this.naturalWidth=100; this.naturalHeight=100; };
global.performance = { now: function() { return Date.now(); } };
global.requestAnimationFrame = function(fn) { return setTimeout(fn,16); };
global.setTimeout = setTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;
global.clearTimeout = clearTimeout;

var base = 'js/';
var files = ['config.js','levels.js','game-core.js','sprites.js','renderer.js'];
for (var fi=0; fi<files.length; fi++) {
  try {
    new vm.Script(fs.readFileSync(base+files[fi],'utf-8'),{filename:files[fi]}).runInThisContext();
    console.log('OK: '+files[fi]);
  } catch(e) {
    console.log('FAIL: '+files[fi]+' | '+e.message);
    process.exit(1);
  }
}

// Test game-core
console.log('\n=== Testing game logic ===');
var level = LEVELS[0];
console.log('Level 1: '+level.tiles.length+' tiles, tubes='+(level.tubes?level.tubes.length:0));
var board = new Board(level);
console.log('Board: '+board.rows+'x'+board.cols+', tiles='+board.tiles.length+', tubes='+board.tubes.size);
console.log('Cleared: '+board.isCleared());
console.log('Has moves: '+board.hasValidMoves());

// Test renderer layout
console.log('\n=== Testing Renderer ===');
var canvas = document.getElementById('gameCanvas');
var r = new Renderer(canvas);
r.layout(board);
console.log('tileSize='+r.tileSize+', baseTileSize='+r._baseTileSize+', offset='+r.offsetX+','+r.offsetY);

// Test SPRITES
console.log('SPRITES ready: '+SPRITES.ready);

// Check renderer.js file integrity
console.log('\n=== Checking renderer.js integrity ===');
var src = fs.readFileSync(base+'renderer.js','utf-8');
// Check it has expected methods
var methods = ['layout','draw','_drawGrid','_drawTiles','_drawSprite','_roundRect','_easeOutCubic'];
for (var mi=0; mi<methods.length; mi++) {
  if (src.indexOf(methods[mi]) >= 0) console.log('  Has method: '+methods[mi]);
  else console.log('  MISSING: '+methods[mi]);
}
// Check closing brace
var lines = src.split('\n');
console.log('  Total lines: '+lines.length);
console.log('  Last 3 lines:');
for (var li=Math.max(0,lines.length-3); li<lines.length; li++) console.log('    ['+(li+1)+'] '+lines[li]);

// Verify levels
console.log('\n=== Checking levels integrity ===');
var lastId = 0;
var errors = [];
for (var li=0; li<LEVELS.length; li++) {
  var l = LEVELS[li];
  if (l.id !== lastId+1) errors.push('ID gap: '+lastId+' -> '+l.id);
  if (!l.tiles || l.tiles.length === 0) errors.push('Level '+l.id+' has no tiles');
  if (!l.rows || !l.cols) errors.push('Level '+l.id+' missing rows/cols');
  lastId = l.id;
}
if (errors.length > 0) {
  console.log('Errors:');
  errors.forEach(function(e){console.log('  '+e);});
} else {
  console.log('All '+LEVELS.length+' levels valid');
}
console.log('First level id: '+LEVELS[0].id+', last level id: '+LEVELS[LEVELS.length-1].id);
