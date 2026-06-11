var fs = require("fs");
var vm = require("vm");
global.window = global;
global.document = {getElementById:function(){return{style:{},classList:{add:function(){},remove:function(){}}};},querySelectorAll:function(){return[];},addEventListener:function(){},createElement:function(t){return t==="canvas"?{getContext:function(){return{};},width:800,height:600,style:{}}:{style:{}};}};
global.localStorage={getItem:function(){return null;},setItem:function(){},removeItem:function(){}};
global.Image=function(){this.onload=null;this.src="";};
global.performance={now:function(){return Date.now();}};
global.requestAnimationFrame=function(){};
global.setTimeout=setTimeout;global.setInterval=setInterval;global.clearInterval=clearInterval;
var b="js/";
new vm.Script(fs.readFileSync(b+"config.js","utf-8"),{filename:"c"}).runInThisContext();
new vm.Script(fs.readFileSync(b+"game-core.js","utf-8"),{filename:"g"}).runInThisContext();
function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function sh(a){var s=a.slice();for(var i=s.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=s[i];s[i]=s[j];s[j]=t;}return s;}
function hf(t){for(var a=0;a<t.length;a++)for(var b=a+1;b<t.length;b++){var ta=(a)[],tb=(b)[];if(ta.row===tb.row&&Math.abs(ta.col-tb.col)===1){if((ta.col<tb.col&&ta.direction==="right"&&tb.direction==="left")||(ta.col>tb.col&&ta.direction==="left"&&tb.direction==="right"))return true;}if(ta.col===tb.col&&Math.abs(ta.row-tb.row)===1){if((ta.row<tb.row&&ta.direction==="down"&&tb.direction==="up")||(ta.row>tb.row&&ta.direction==="up"&&tb.direction==="down"))return true;}}return false;}
console.log("loaded OK");
