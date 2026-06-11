var fs = require('fs');
var vm = require('vm');
global.window = global;
global.document = {
  getElementById: function() { return { style:{}, classList:{add:function(){},remove:function(){}} }; },
  querySelectorAll: function(){return[];},
  addEventListener: function(){},
  createElement: function(tag){ return tag==='canvas' ? {getContext:function(){return{};},width:800,height:600,style:{}} : {style:{}}; }
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
var LEVEL_START = parseInt(process.env.LEVEL_START || '1', 10);
var LEVEL_END = parseInt(process.env.LEVEL_END || '100000', 10);
var DIRECTIONS = ['up', 'down', 'left', 'right'];
function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function shuffle(arr) { var a=arr.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} return a; }
var MECH_MAP = {1:'straight',2:'corner',3:'rotatable',4:'teleport'};
function parseMechanics(s) {
  var p=s.replace(/"/g,'').split(','), types=[], timer=false, rot=false;
  for(var i=0;i<p.length;i++){var n=parseInt(p[i],10);if(n===5)timer=true;
    else if(n===3){rot=true;if(types.indexOf('corner')===-1)types.push('corner');}
    else if(n>0&&MECH_MAP[n])types.push(MECH_MAP[n]);}
  return {tubeTypes:types,hasTimer:timer,hasRotatable:rot};
}
function genLevel(id,name,rows,cols,targetTiles,tubeCount,tubeTypes,hasTimer,hasRotatable){
  var maxAttempts=50,needsTP=false;
  for(var t=0;t<tubeTypes.length;t++)if(tubeTypes[t]==='teleport')needsTP=true;
  for(var att=0;att<maxAttempts;att++){
    var tubeCells=new Set(),tubes=[];
    if(tubeCount>0&&tubeTypes.length>0){
      var cands=[];
      for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)cands.push([r,c]);
      cands=shuffle(cands);
      var tpColor=0;
      for(var ti=0;ti<tubeCount&&cands.length>0;ti++){
        var type;
        if(needsTP){var nonTP=[];for(var t=0;t<tubeTypes.length;t++)if(tubeTypes[t]!=='teleport')nonTP.push(tubeTypes[t]);
          var maxTP=Math.min(4,Math.floor(tubeCount/2)*2);type=(ti<maxTP)?'teleport':(nonTP.length>0?nonTP[randInt(0,nonTP.length-1)]:'teleport');}
        else type=tubeTypes[randInt(0,tubeTypes.length-1)];
        for(var ci=0;ci<cands.length;ci++){
          var rr=cands[ci][0],cc=cands[ci][1];
          if(tubeCells.has(rr+','+cc))continue;
          var ok=true,orth=[[-1,0],[1,0],[0,-1],[0,1]];
          for(var oi=0;oi<orth.length&&ok;oi++)if(tubeCells.has((rr+orth[oi][0])+','+(cc+orth[oi][1])))ok=false;
          if(!ok)continue;
          if(type==='teleport'){tubes.push({row:rr,col:cc,type:'teleport',orientation:0,colorIndex:tpColor});tubeCells.add(rr+','+cc);
            if((tubes.filter(function(t){return t.type==='teleport';}).length%2)===0)tpColor=(tpColor+1)%3;}
          else{var tobj={row:rr,col:cc,type:type,orientation:randInt(0,3),colorIndex:randInt(0,2)};if(type==='straight'||hasRotatable)tobj.rotatable=true;tubes.push(tobj);tubeCells.add(rr+','+cc);}
          break;
        }
      }
    }
    var avail=[];for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)if(!tubeCells.has(r+','+c))avail.push([r,c]);
    if(avail.length<targetTiles)continue;
    var tLookup={};for(var ti=0;ti<tubes.length;ti++)tLookup[tubes[ti].row+','+tubes[ti].col]=tubes[ti];
    avail=shuffle(avail);var tiles=[],offsets={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]},occupied={};
    for(var ai=0;ai<avail.length&&tiles.length<targetTiles;ai++){
      var r=avail[ai][0],c=avail[ai][1];if(occupied[r+','+c])continue;
      // Find valid directions that don't create facing pairs with existing tiles
      var vd=[];
      for(var d=0;d<4;d++){
        var dir=DIRECTIONS[d],nr=r+offsets[dir][0],nc=c+offsets[dir][1];
        // Facing pair check with already placed tiles
        var badDir=false;
        for(var ot=0;ot<tiles.length&&!badDir;ot++){
          var otr=tiles[ot].row,otc=tiles[ot].col,otd=tiles[ot].direction;
          if(r===otr&&c===otc)continue;
          // ANY distance: same row facing each other horizontally
          if(r===otr&&dir==='right'&&otd==='left'&&c<otc)badDir=true;
          if(r===otr&&dir==='left'&&otd==='right'&&c>otc)badDir=true;
          // ANY distance: same column facing each other vertically
          if(c===otc&&dir==='down'&&otd==='up'&&r<otr)badDir=true;
          if(c===otc&&dir==='up'&&otd==='down'&&r>otr)badDir=true;
        }
        if(badDir)continue;
        // Trace path: follow empty cells until edge or tube
        var tr=nr,tc=nc,td=dir,valid=false,blocked=false,steps=0;
        while(!valid&&!blocked&&steps<rows*cols){
          steps++;
          if(tr<0||tr>=rows||tc<0||tc>=cols){valid=true;break;}
          if(tLookup[tr+','+tc]){
            var tube=tLookup[tr+','+tc];
            // Rotatable tubes can always be rotated to accept entry
            if(tube.rotatable){valid=true;break;}
            var es=_dirToSide(td),xs=_tubeExitSide(tube,es);
            if(xs===null){blocked=true;break;}
            // Tube accepts entry - trace through
            if(tube.type==='teleport'){
              // Find teleport pair and continue from there
              var pairKey=null;
              for(var pk in tLookup){
                if(pk!==(tr+','+tc)&&tLookup[pk].type==='teleport'&&tLookup[pk].colorIndex===tube.colorIndex){
                  pairKey=pk;break;
                }
              }
              if(!pairKey){blocked=true;break;}
              var pp=pairKey.split(',');tr=parseInt(pp[0]);tc=parseInt(pp[1]);
              td=_sideToDir(xs);
              continue; // continue tracing from teleport exit
            }
            td=_sideToDir(xs);
            tr+=offsets[td][0];tc+=offsets[td][1];
            continue; // continue tracing from tube exit
          }
          if(occupied[tr+','+tc]){blocked=true;break;}
          // Check facing pair with ANY tile at any distance in this direction
          for(var ot=0;ot<tiles.length&&!blocked;ot++){
            var otr=tiles[ot].row,otc=tiles[ot].col;
            if(tr===otr&&tc===otc){blocked=true;break;}
          }
          if(blocked)break;
          tr+=offsets[td][0];tc+=offsets[td][1];
        }
        if(valid)vd.push(dir);
      }
      if(vd.length>0){tiles.push({row:r,col:c,direction:vd[randInt(0,vd.length-1)]});occupied[r+','+c]=true;}
    }
    if(tiles.length<targetTiles)continue;
    var cfg={rows:rows,cols:cols,optimalMoves:targetTiles*2,tiles:tiles};
    if(hasTimer){cfg.timeLimit=CONFIG.DEFAULT_TIME_LIMIT;if(id>=91&&id<=100)cfg.timeLimit=60;}
    if(tubes.length>0)cfg.tubes=tubes;
    cfg.optimalMoves=targetTiles+(tubes.length||0)*1.5|0;
    return cfg;
  }
  return null;
}
function parseCSVLine(line){var parts=[],cur='',inq=false;for(var pi=0;pi<line.length;pi++){var ch=line[pi];if(ch==='"')inq=!inq;else if(ch===','&&!inq){parts.push(cur);cur='';}else cur+=ch;}parts.push(cur);return parts;}
var csv=fs.readFileSync(__dirname+'/levels_data.csv','utf-8').trim().split('\n');
var generated=[];
for(var li=1;li<csv.length;li++){
  var line=csv[li].trim();if(!line)continue;
  var p=parseCSVLine(line),id=parseInt(p[0],10);
  if(id<LEVEL_START||id>LEVEL_END)continue;
  var ham=parseInt(p[1],10),tubes=parseInt(p[2],10);
  var g=p[4].toLowerCase().split('x'),cols=parseInt(g[0],10),rows=parseInt(g[1],10);
  var mech=parseMechanics(p[3]),tileCells=rows*cols-tubes,target=Math.max(4,Math.min(ham,tileCells));
  var cfg=null,reductions=[0,2,4,8];
  for(var ri=0;ri<reductions.length&&!cfg;ri++){var rt=Math.max(4,target-reductions[ri]);cfg=genLevel(id,'Уровень '+id,rows,cols,rt,tubes,mech.tubeTypes,mech.hasTimer,mech.hasRotatable);}
  if(!cfg)cfg=genLevel(id,'Уровень '+id,rows,cols,3,0,[],false);
  if(cfg){cfg.id=id;cfg.name='Уровень '+id;generated.push(cfg);console.log('  '+id+': '+cfg.tiles.length+'t/'+(cfg.tubes?cfg.tubes.length:0)+'b');}
  else console.log('  FAILED: '+id);
}
generated.sort(function(a,b){return a.id-b.id;});
if(generated.length===0){console.log('No levels');process.exit(0);}
var out = '/**\n * Levels data - ' + generated.length + ' levels\n */\n\nconst LEVELS = [\n';
var out = '';
out += '/**\n';
out += ' * Levels data - ' + generated.length + ' levels\n';
out += ' */\n';
out += '\n';
out += 'const LEVELS = [\n';
generated.forEach(function(c) {
  out += '  {\n';
  out += '    id: ' + c.id + ',\n';
  out += '    name: \x27' + c.name + '\x27,\n';
  out += '    rows: ' + c.rows + ', cols: ' + c.cols + ',\n';
  out += '    optimalMoves: ' + c.optimalMoves + ',\n';
  if (c.timeLimit) out += '    timeLimit: ' + c.timeLimit + ',\n';
  if (c.tubes && c.tubes.length) out += '    tubes: ' + JSON.stringify(c.tubes) + ',\n';
  out += '    tiles: ' + JSON.stringify(c.tiles) + '\n';
  out += '  },\n';
});
out += '];\n';
out += '\n';

fs.writeFileSync(__dirname + '/js/levels.js', out, 'utf-8');
console.log('Written ' + generated.length + ' levels to js/levels.js');