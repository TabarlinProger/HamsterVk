
var fs = require('fs');
var vm = require('vm');
global.window = global;
global.document = {getElementById:function(){return{style:{},classList:{add:function(){},remove:function(){}}};},querySelectorAll:function(){return[];},addEventListener:function(){},createElement:function(t){return t==='canvas'?{getContext:function(){return{};},width:800,height:600,style:{}}:{style:{}};}};
global.localStorage={getItem:function(){return null;},setItem:function(){},removeItem:function(){}};
global.Image=function(){this.onload=null;this.src='';};
global.performance={now:function(){return Date.now();}};
global.requestAnimationFrame=function(){};global.setTimeout=setTimeout;global.setInterval=setInterval;global.clearInterval=clearInterval;
var base='js/';
new vm.Script(fs.readFileSync(base+'config.js','utf-8'),{filename:'c'}).runInThisContext();
new vm.Script(fs.readFileSync(base+'game-core.js','utf-8'),{filename:'g'}).runInThisContext();

var DIRECTIONS = ['up','down','left','right'];
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function shuffle(a){var s=a.slice();for(var i=s.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=s[i];s[i]=s[j];s[j]=t;}return s;}
function hasFacingPair(t){for(var a=0;a<t.length;a++)for(var b=a+1;b<t.length;b++){var ta=t[a],tb=t[b];if(ta.row===tb.row&&Math.abs(ta.col-tb.col)===1){if((ta.col<tb.col&&ta.direction==='right'&&tb.direction==='left')||(ta.col>tb.col&&ta.direction==='left'&&tb.direction==='right'))return true;}if(ta.col===tb.col&&Math.abs(ta.row-tb.row)===1){if((ta.row<tb.row&&ta.direction==='down'&&tb.direction==='up')||(ta.row>tb.row&&ta.direction==='up'&&tb.direction==='down'))return true;}}return false;}

function generateLevel(rows, cols, targetTiles, tubeCount, tubeTypes, hasTimer) {
  var maxAttempts = 50;
  var maxStates = 4000;
  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    var tubeCells = new Set();
    var tubes = [];
    if (tubeCount > 0 && tubeTypes.length > 0) {
      var candidates = [];
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) candidates.push([r, c]);
      candidates = shuffle(candidates);
      for (var ti = 0; ti < tubeCount && candidates.length > 0; ti++) {
        var type = tubeTypes[randInt(0, tubeTypes.length - 1)];
        for (var ci = 0; ci < candidates.length; ci++) {
          var rr = candidates[ci][0], cc = candidates[ci][1];
          if (tubeCells.has(rr+','+cc)) continue;
          var ok = true;
          var orth = [[-1,0],[1,0],[0,-1],[0,1]];
          for (var oi = 0; oi < orth.length && ok; oi++)
            if (tubeCells.has((rr+orth[oi][0])+','+(cc+orth[oi][1]))) ok = false;
          if (ok) {
            tubes.push({row: rr, col: cc, type: type, orientation: randInt(0, 3), colorIndex: 0});
            tubeCells.add(rr+','+cc);
            break;
          }
        }
      }
    }
    var avail = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
      if (!tubeCells.has(r+','+c)) avail.push([r, c]);
    if (avail.length < targetTiles) continue;
    avail = shuffle(avail);
    var tiles = [];
    for (var i = 0; i < targetTiles; i++) tiles.push({row:avail[i][0],col:avail[i][1],direction:DIRECTIONS[randInt(0,3)]});
    if (hasFacingPair(tiles)) {
      for (var fi = 0; fi < tiles.length; fi++) for (var fj = fi + 1; fj < tiles.length; fj++) {
        var ta = tiles[fi], tb = tiles[fj], fc = false;
        if (ta.row === tb.row && Math.abs(ta.col - tb.col) === 1) fc = (ta.col < tb.col && ta.direction === 'right' && tb.direction === 'left') || (ta.col > tb.col && ta.direction === 'left' && tb.direction === 'right');
        if (ta.col === tb.col && Math.abs(ta.row - tb.row) === 1) fc = (ta.row < tb.row && ta.direction === 'down' && tb.direction === 'up') || (ta.row > tb.row && ta.direction === 'up' && tb.direction === 'down');
        if (fc) { var sf = DIRECTIONS.filter(function(d){return d !== ta.direction;}); ta.direction = sf[randInt(0, sf.length - 1)]; if (!hasFacingPair(tiles)) break; }
      }
      if (hasFacingPair(tiles)) continue;
    }
    var cfg = { rows: rows, cols: cols, optimalMoves: targetTiles * 2, tiles: tiles, features: [], timeLimit: hasTimer ? 60 : 0 };
    if (tubes.length > 0) cfg.tubes = tubes;
    if (LevelManager.isSolvable(cfg, maxStates)) {
      cfg.optimalMoves = targetTiles + (tubes.length || 0) * 1.5 | 0;
      return cfg;
    }
  }
  return null;
}

var csvContent = fs.readFileSync(__dirname + '/levels_data.csv', 'utf-8').trim().split('\n');
var MECH_MAP = {1:'straight',2:'corner',3:'rotatable',4:'teleport'};
function parseMechanics(mechStr) {
  var parts = mechStr.replace(/"/g,'').split(',');
  var types = []; var timer = false;
  for (var i = 0; i < parts.length; i++) {
    var n = parseInt(parts[i], 10);
    if (n === 5) timer = true;
    else if (n > 0 && MECH_MAP[n]) types.push(MECH_MAP[n]);
  }
  return { tubeTypes: types, hasTimer: timer };
}

var failedIds = [42,45,46,49,53,55,64,65,66,69,71,74,75,76,77,78,79,82,83,85,86,89,93,94,95,96,97,98,99,100];
var generated = [];

for (var li = 1; li < csvContent.length; li++) {
  var parts = []; var cur = ''; var inQ = false; var line = csvContent[li].trim();
  if (!line) continue;
  for (var pi = 0; pi < line.length; pi++) { var ch = line[pi]; if (ch === '"') inQ = !inQ; else if (ch === ',' && !inQ) { parts.push(cur); cur = ''; } else cur += ch; }
  parts.push(cur);
  var id = parseInt(parts[0], 10);
  if (failedIds.indexOf(id) === -1) continue;
  var hamsterCount = parseInt(parts[1], 10); var tubeCount = parseInt(parts[2], 10);
  var mech = parseMechanics(parts[3]); var g = parts[4].toLowerCase().split('x');
  var cols = parseInt(g[0], 10); var rows = parseInt(g[1], 10);
  var availCells = rows * cols - tubeCount;
  var targetTiles = Math.min(Math.floor(hamsterCount * 0.40), availCells);
  targetTiles = Math.max(4, targetTiles);

  var cfg = generateLevel(rows, cols, targetTiles, tubeCount, mech.tubeTypes, mech.hasTimer);
  if (!cfg) cfg = generateLevel(rows, cols, Math.max(3, targetTiles - 3), Math.max(0, tubeCount - 2), mech.tubeTypes, mech.hasTimer);
  if (!cfg) cfg = generateLevel(rows, cols, 3, 0, [], false);
  if (cfg) {
    cfg.id = id; cfg.name = 'Уровень ' + id;
    generated.push(cfg);
    console.log('  ' + cfg.id + ': ' + cfg.name + ' - ' + cfg.tiles.length + 't/' + (cfg.tubes?cfg.tubes.length:0) + 'b');
  } else {
    console.log('  FAILED: ' + id);
  }
}

generated.sort(function(a,b){return a.id-b.id;});
var out = '/** retry levels */\nconst RETRY_LEVELS = [\n';
generated.forEach(function(cfg) {
  out += '  {\n    id: ' + cfg.id + ',\n    name: \'' + cfg.name + '\',\n    rows: ' + cfg.rows + ', cols: ' + cfg.cols + ',\n    optimalMoves: ' + cfg.optimalMoves + ',\n';
  if (cfg.timeLimit) out += '    timeLimit: ' + cfg.timeLimit + ',\n';
  if (cfg.tubes && cfg.tubes.length) out += '    tubes: ' + JSON.stringify(cfg.tubes) + ',\n';
  out += '    tiles: ' + JSON.stringify(cfg.tiles) + '\n  },\n';
});
out += '];\n';
fs.writeFileSync(__dirname + '/retry_levels.js', out, 'utf-8');
console.log('Written ' + generated.length + ' retry levels');
