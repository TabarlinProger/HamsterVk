
var fs = require('fs');
var vm = require('vm');
global.window = global;
global.document = {getElementById:function(){return{style:{},classList:{add:function(){},remove:function(){}}};},querySelectorAll:function(){return[];},addEventListener:function(){},createElement:function(t){return t==='canvas'?{getContext:function(){return{};},width:800,height:600,style:{}}:{style:{}};}};
global.localStorage={getItem:function(){return null;},setItem:function(){},removeItem:function(){}};
global.Image=function(){this.onload=null;this.src='';};
global.performance={now:function(){return Date.now();}};
global.requestAnimationFrame=function(){};
global.setTimeout=setTimeout;global.setInterval=setInterval;global.clearInterval=clearInterval;
var base='js/';
new vm.Script(fs.readFileSync(base+'config.js','utf-8'),{filename:'config.js'}).runInThisContext();
new vm.Script(fs.readFileSync(base+'game-core.js','utf-8'),{filename:'game-core.js'}).runInThisContext();

var DR=['up','down','left','right'];
function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function sh(a){var s=a.slice();for(var i=s.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=s[i];s[i]=s[j];s[j]=t;}return s;}
function hf(t){for(var a=0;a<t.length;a++)for(var b=a+1;b<t.length;b++){var ta=t[a],tb=t[b];if(ta.row===tb.row&&Math.abs(ta.col-tb.col)===1){if((ta.col<tb.col&&ta.direction==='right'&&tb.direction==='left')||(ta.col>tb.col&&ta.direction==='left'&&tb.direction==='right'))return true;}if(ta.col===tb.col&&Math.abs(ta.row-tb.row)===1){if((ta.row<tb.row&&ta.direction==='down'&&tb.direction==='up')||(ta.row>tb.row&&ta.direction==='up'&&tb.direction==='down'))return true;}}return false;}

// Test level 60: 7x7, 12 tubes, straight+corner, timer
var rows=7,cols=7,tubeCount=12,targetTiles=16,types=['straight','corner'];
var maxAttempts=10;
for(var attempt=0;attempt<maxAttempts;attempt++){
  var cells={},tubes=[];
  var cand=[];
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)cand.push([r,c]);
  cand=sh(cand);
  var placed=0;
  for(var ti=0;ti<cand.length&&placed<tubeCount;ti++){
    var rr=cand[ti][0],cc=cand[ti][1];
    if(cells[rr+','+cc])continue;
    var ok=true;
    var orth=[[-1,0],[1,0],[0,-1],[0,1]];
    for(var oi=0;oi<orth.length&&ok;oi++)if(cells[(rr+orth[oi][0])+','+(cc+orth[oi][1])])ok=false;
    if(ok){
      tubes.push({row:rr,col:cc,type:types[ri(0,types.length-1)],orientation:ri(0,3),colorIndex:0});
      cells[rr+','+cc]=true;placed++;
    }
  }
  if(placed<tubeCount){console.log('A'+attempt+': tubes='+placed);continue;}
  var avail=[];
  for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)if(!cells[r+','+c])avail.push([r,c]);
  if(avail.length<targetTiles)continue;
  avail=sh(avail);
  var tiles=[];
  for(var i=0;i<targetTiles;i++)tiles.push({row:avail[i][0],col:avail[i][1],direction:DR[ri(0,3)]});
  
  if(hf(tiles)){for(var fi=0;fi<tiles.length;fi++)for(var fj=fi+1;fj<tiles.length;fj++){var ta=tiles[fi],tb=tiles[fj];var fc=false;if(ta.row===tb.row&&Math.abs(ta.col-tb.col)===1)fc=(ta.col<tb.col&&ta.direction==='right'&&tb.direction==='left')||(ta.col>tb.col&&ta.direction==='left'&&tb.direction==='right');if(ta.col===tb.col&&Math.abs(ta.row-tb.row)===1)fc=(ta.row<tb.row&&ta.direction==='down'&&tb.direction==='up')||(ta.row>tb.row&&ta.direction==='up'&&tb.direction==='down');if(fc){var safe=DR.filter(function(d){return d!==ta.direction;});ta.direction=safe[ri(0,safe.length-1)];if(!hf(tiles))break;}}if(hf(tiles))break;}if(hf(tiles))continue;}
  
  var cfg={rows:rows,cols:cols,optimalMoves:32,tiles:tiles,features:[],timeLimit:60};
  if(tubes.length>0)cfg.tubes=tubes;
  var t0=Date.now();
  var solvable=LevelManager.isSolvable(cfg,5000);
  var t1=Date.now();
  console.log('A'+attempt+': '+targetTiles+'t/'+tubes.length+'b solvable='+solvable+' time='+(t1-t0)+'ms');
  if(solvable){console.log('SUCCESS!');process.exit(0);}
}
console.log('FAILED all attempts');
