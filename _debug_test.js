/**
 * Debug test — test generateLevel for a specific configuration
 */
var fs = require('fs');
var vm = require('vm');

global.window = global;
global.document = {
  getElementById: function() { return { style:{}, classList:{add:function(){},remove:function(){}} }; },
  querySelectorAll: function(){return[];},
  addEventListener: function(){},
  createElement: function(tag){
    return tag==='canvas' ? {getContext:function(){return{};},width:800,height:600,style:{}} : {style:{}};
  }
};
global.localStorage = { getItem:function(){return null;}, setItem:function(){}, removeItem:function(){} };
global.Image = function(){ this.onload=null; this.src=''; };
global.performance = { now: function() { return Date.now(); } };
global.requestAnimationFrame = function(){};
global.setTimeout = setTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;

var base = 'js/';
new vm.Script(fs.readFileSync(base+'config.js','utf-8'),{filename:'config.js'}).runInThisContext();
new vm.Script(fs.readFileSync(base+'game-core.js','utf-8'),{filename:'game-core.js'}).runInThisContext();

var DIRS = ['up', 'down', 'left', 'right'];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
function hasFacingPair(tiles) {
  for (var a = 0; a < tiles.length; a++) for (var b = a+1; b < tiles.length; b++) {
    var ta=tiles[a], tb=tiles[b];
    if (ta.row===tb.row && Math.abs(ta.col-tb.col)===1) {
      if ((ta.col<tb.col && ta.direction==='right' && tb.direction==='left') ||
          (ta.col>tb.col && ta.direction==='left' && tb.direction==='right')) return true;
    }
    if (ta.col===tb.col && Math.abs(ta.row-tb.row)===1) {
      if ((ta.row<tb.row && ta.direction==='down' && tb.direction==='up') ||
          (ta.row>tb.row && ta.direction==='up' && tb.direction==='down')) return true;
    }
  }
  return false;
}

function testLevel(rows, cols, nTiles, nTubes, tubeTypes, maxAttempts) {
  if (!maxAttempts) maxAttempts = 10;
  for (var a = 0; a < maxAttempts; a++) {
    var tubeCells = new Set(), tubes = [];
    if (nTubes > 0 && tubeTypes.length > 0) {
      var cand = [];
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) cand.push([r,c]);
      cand = shuffle(cand);
      for (var ti = 0; ti < nTubes && cand.length > 0; ti++) {
        var type = tubeTypes[randInt(0, tubeTypes.length-1)];
        for (var ci = 0; ci < cand.length; ci++) {
          var rr=cand[ci][0], cc=cand[ci][1];
          if (tubeCells.has(rr+','+cc)) continue;
          var ok = true;
          for (var oi = 0; oi < 4; oi++) {
            var orth = [[-1,0],[1,0],[0,-1],[0,1]];
            if (tubeCells.has((rr+orth[oi][0])+','+(cc+orth[oi][1]))) { ok=false; break; }
          }
          if (ok) {
            tubes.push({row:rr,col:cc,type:type,orientation:randInt(0,3),colorIndex:0});
            tubeCells.add(rr+','+cc);
            break;
          }
        }
      }
    }
    var avail = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
      if (!tubeCells.has(r+','+c)) avail.push([r,c]);
    if (avail.length < nTiles) continue;
    avail = shuffle(avail);
    var tiles = [];
    for (var i = 0; i < nTiles && i < avail.length; i++)
      tiles.push({row:avail[i][0],col:avail[i][1],direction:DIRS[randInt(0,3)]});

    if (hasFacingPair(tiles)) {
      for (var fi=0;fi<tiles.length;fi++) for (var fj=fi+1;fj<tiles.length;fj++) {
        var ta=tiles[fi],tb=tiles[fj];
        var facing=false;
        if (ta.row===tb.row&&Math.abs(ta.col-tb.col)===1)
          facing=(ta.col<tb.col&&ta.direction==='right'&&tb.direction==='left')||
                 (ta.col>tb.col&&ta.direction==='left'&&tb.direction==='right');
        if (ta.col===tb.col&&Math.abs(ta.row-tb.row)===1)
          facing=(ta.row<tb.row&&ta.direction==='down'&&tb.direction==='up')||
                 (ta.row>tb.row&&ta.direction==='up'&&tb.direction==='down');
        if (facing) {
          var safe = DIRS.filter(function(d){return d!==ta.direction;});
          ta.direction = safe[randInt(0,safe.length-1)];
          if (!hasFacingPair(tiles)) break;
        }
      }
      if (hasFacingPair(tiles)) continue;
    }

    var cfg = {rows:rows,cols:cols,optimalMoves:nTiles*2,tiles:tiles,features:[],timeLimit:0};
    if (tubes.length > 0) cfg.tubes = tubes;

    // Check reachable
    var reachable = true;
    if (tubes.length > 0) {
      // Quick check: does any tile path reach each tube?
      var tubeMap = {};
      for (var ti=0;ti<tubes.length;ti++) tubeMap[tubes[ti].row+','+tubes[ti].col]=tubes[ti];
      var reached = {};
      for (var ti=0;ti<tiles.length;ti++) {
        var t=tiles[ti], r=t.row, c=t.col, dir=t.direction;
        for (var step=0;step<rows*cols*2;step++) {
          var off = {up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};
          var nr=r+off[dir][0], nc=c+off[dir][1];
          if (nr<0||nr>=rows||nc<0||nc>=cols) break;
          var tube = tubeMap[nr+','+nc];
          if (tube) {
            if (tube.type==='teleport') {
              reached[nr+','+nc]=true;
              // find pair
              for (var ti2=0;ti2<tubes.length;ti2++) {
                if (tubes[ti2].type==='teleport'&&tubes[ti2].colorIndex===tube.colorIndex) {
                  var pk=tubes[ti2].row+','+tubes[ti2].col;
                  if (pk!==nr+','+nc) { reached[pk]=true; r=tubes[ti2].row; c=tubes[ti2].col; break; }
                }
              }
              continue;
            }
            var es = _dirToSide(dir);
            var xs = _tubeExitSide(tube, es);
            if (xs===null) break;
            reached[nr+','+nc]=true;
            dir = _sideToDir(xs);
            r=nr; c=nc; continue;
          }
          if (nr===t.row&&nc===t.col) break; // other tile
          r=nr; c=nc;
        }
      }
      for (var ti=0;ti<tubes.length;ti++) {
        if (!reached[tubes[ti].row+','+tubes[ti].col]) { reachable=false; break; }
      }
    }

    if (!reachable) { console.log('  Attempt '+a+': tubes not reachable'); continue; }

    var t0=Date.now();
    var solvable = LevelManager.isSolvable(cfg, 4000);
    var t1=Date.now();
    console.log('  Attempt '+a+': '+nTiles+'t/'+tubes.length+'b solvable='+solvable+' time='+(t1-t0)+'ms');
    if (solvable) { return cfg; }
  }
  return null;
}

console.log('=== Test 1: 6x6, 16tiles, 4 corner tubes ===');
var r1 = testLevel(6,6,16,4,['corner'],5);
console.log('Result: '+(r1?'SUCCESS':'FAILED'));

console.log('\n=== Test 2: 6x6, 16tiles, 4 straight tubes ===');
var r2 = testLevel(6,6,16,4,['straight'],5);
console.log('Result: '+(r2?'SUCCESS':'FAILED'));

console.log('\n=== Test 3: 6x6, 8tiles, 2 corner tubes ===');
var r3 = testLevel(6,6,8,2,['corner'],5);
console.log('Result: '+(r3?'SUCCESS':'FAILED'));
