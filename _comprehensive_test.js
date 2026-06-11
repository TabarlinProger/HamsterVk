/**
 * Comprehensive game test
 */
var fs=require("fs"),vm=require("vm");
function mCtx(){return {fillStyle:"",fillRect:function(){},clearRect:function(){},drawImage:function(){},save:function(){},restore:function(){},translate:function(){},rotate:function(){},scale:function(){},arc:function(){},stroke:function(){},beginPath:function(){},moveTo:function(){},lineTo:function(){},closePath:function(){},strokeStyle:"",lineWidth:0,globalAlpha:1,setLineDash:function(){},lineDashOffset:0,shadowColor:"",shadowBlur:0,font:"",textAlign:"",fillText:function(){},createLinearGradient:function(){return{addColorStop:function(){}}},createRadialGradient:function(){return{addColorStop:function(){}}}};}
var mc={width:800,height:600,style:{},getContext:function(t){return t==="2d"?mCtx():null;},addEventListener:function(){}};
var me={"gameCanvas":mc,"main-menu":{classList:{add:function(){},remove:function(){}},innerHTML:"",textContent:""},"game-hud":{classList:{add:function(){},remove:function(){}},innerHTML:"",textContent:""},"level-select":{classList:{add:function(){},remove:function(){}},innerHTML:"",textContent:""},"levels-view":{classList:{add:function(){},remove:function(){}},innerHTML:"",textContent:""},"chapters-carousel":{innerHTML:"",scrollLeft:0,children:[],style:{},scrollIntoView:function(){},getBoundingClientRect:function(){return{left:0,width:800}}},"levels-grid":{innerHTML:"",scrollLeft:0,children:[],style:{},querySelectorAll:function(){return[]}},"btn-level-select-menu":{innerHTML:"",addEventListener:function(){}},"hud-remaining":{textContent:"0"},"hud-lives":{innerHTML:""},"hud-hint-count":{textContent:"0"},"win-stars":{innerHTML:""},"win-moves":{textContent:""},"btn-next-level":{style:{display:""},addEventListener:function(){}},"btn-hint":{addEventListener:function(){}},"btn-pause":{addEventListener:function(){}},"btn-resume":{addEventListener:function(){}},"btn-pause-restart":{addEventListener:function(){}},"btn-pause-menu":{addEventListener:function(){}},"btn-win-levels":{addEventListener:function(){}},"btn-win-menu":{addEventListener:function(){}},"btn-softlock-undo":{addEventListener:function(){}},"btn-softlock-restart":{addEventListener:function(){}},"btn-softlock-menu":{addEventListener:function(){}},"btn-continue":{addEventListener:function(){}},"btn-levels":{addEventListener:function(){}}};
function gEBI(id){return me[id]||{classList:{add:function(){},remove:function(){}},innerHTML:"",textContent:"",addEventListener:function(){}};}
global.window=global;global.addEventListener=function(){};global.removeEventListener=function(){};global.innerWidth=800;global.innerHeight=600;
global.document={getElementById:gEBI,querySelectorAll:function(){return[];},addEventListener:function(e,h){if(e==="DOMContentLoaded")h();},createElement:function(t){if(t==="canvas")return{width:800,height:600,style:{},getContext:function(t){return t==="2d"?mCtx():null;},addEventListener:function(){}};return{style:{},classList:{add:function(){},remove:function(){}},innerHTML:"",textContent:"",addEventListener:function(){}};}};
global.localStorage={getItem:function(){return null;},setItem:function(){},removeItem:function(){}};
global.Image=function(){this.onload=null;this.src="";this.complete=true;this.naturalWidth=100;this.naturalHeight=100;};
global.Audio=function(){this.src="";this.loop=false;this.preload="";this.volume=1;this.currentTime=0;this.play=function(){return Promise.resolve();};this.pause=function(){};};
global.performance={now:function(){return Date.now();}};
global.requestAnimationFrame=function(fn){return setTimeout(fn,16);};
global.setTimeout=setTimeout;global.setInterval=setInterval;global.clearInterval=clearInterval;global.clearTimeout=clearTimeout;
global.console=console;

var base="js/";var files=["config.js","levels.js","game-core.js","sprites.js","renderer.js","sound.js","input.js","locales.js","main.js"];
console.log("=== Loading all game files ===");
for(var fi=0;fi<files.length;fi++){
  try{
    new vm.Script(fs.readFileSync(base+files[fi],"utf-8"),{filename:files[fi]}).runInThisContext();
    console.log("  OK: "+files[fi]);
  }catch(e){
    console.log("  FAIL: "+files[fi]+" | "+e.message);
    console.log(e.stack);process.exit(1);
  }
}

console.log("");
console.log("=== Post-init checks ===");
console.log("  game defined: "+(typeof game!=="undefined"));
console.log("  game.state: "+game.state);
console.log("  levels: "+game.levelManager.total);
console.log("  SPRITES.ready: "+SPRITES.ready);

console.log("");
console.log("=== Test _startLevel(1) ===");
game._startLevel(1);
console.log("  state: "+game.state);
console.log("  board: "+(game.board?game.board.rows+"x"+game.board.cols+", tiles="+game.board.tiles.length:"null"));
console.log("  lives: "+game.lives);

console.log("");
console.log("=== Test _startLevel(50) [7x7+tubes] ===");
game._startLevel(50);
console.log("  state: "+game.state);
console.log("  board: "+(game.board?game.board.rows+"x"+game.board.cols+", tiles="+game.board.tiles.length+", tubes="+game.board.tubes.size:"null"));
if(game.board){
  console.log("  hasValidMoves: "+game.board.hasValidMoves());
  if(game.board.tiles.length>0){
    var t=game.board.tiles[0];
    console.log("  tile "+t.id+" @ "+t.row+","+t.col+" dir="+t.direction+" canMove="+game.board.canMove(t));
  }
}

console.log("");
console.log("=== ALL CHECKS PASSED ===");
process.exit(0);
