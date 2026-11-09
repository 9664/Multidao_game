/* Tactical effects share the existing WebGL context. No effect changes the simulation. */
(function(root){
'use strict';
const Base=root.MultidaoImpactRenderer092,G=root.MultidaoVisualGeometry;
class Renderer extends Base{
 constructor(canvas){super(canvas);const shell=new G();shell.sphere(0,0,0,.28,.28,.28,[1,.75,.28]);this.meteorCore=this.mesh(shell);const shard=new G();shard.cylinder(0,0,0,.12,.65,5,[.65,.94,1],'y',0,9,1);this.iceShard=this.mesh(shard);this.lastTactical={};this.gl.uniform1f(this.gl.getUniformLocation(this.program,'uAtlasLayout'),1);}

 createAtlas(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');
  for(let row=0;row<2;row++)for(let frame=0;frame<4;frame++){
   c.save();c.translate(frame*64,row*128);const back=row===1,swing=[-5,0,5,0][frame];
   const cloth=c.createLinearGradient(13,0,51,0);cloth.addColorStop(0,'#94a9b8');cloth.addColorStop(.4,'#ffffff');cloth.addColorStop(1,'#9bafbd');
   c.fillStyle='#4e6476';for(const [x,offset] of [[22,swing],[35,-swing]]){c.beginPath();c.roundRect(x,91+offset,10,28,4);c.fill();}
   c.fillStyle=cloth;c.beginPath();c.roundRect(17,48,32,49,9);c.fill();
   for(const [x,offset] of [[8,-swing*.6],[46,swing*.6]]){c.beginPath();c.roundRect(x,52+offset,10,31,5);c.fill();}
   c.fillStyle='#e1ebef';c.beginPath();c.ellipse(16,52,9,6,0,0,Math.PI*2);c.ellipse(49,52,9,6,0,0,Math.PI*2);c.fill();
   const helmet=c.createRadialGradient(27,25,2,32,28,20);helmet.addColorStop(0,'#ffffff');helmet.addColorStop(.65,'#d6e1e9');helmet.addColorStop(1,'#91a9bc');c.fillStyle=helmet;
   c.beginPath();c.ellipse(32,30,18,21,0,0,Math.PI*2);c.fill();
   if(!back){c.fillStyle='#536c81';c.beginPath();c.roundRect(19,29,26,5,2);c.fill();c.fillStyle='#e4edf1';c.fillRect(31,17,3,26);}else{c.strokeStyle='#acbdc9';c.lineWidth=2;c.beginPath();c.moveTo(32,14);c.lineTo(32,47);c.stroke();}
   c.fillStyle='#eff5f8';c.beginPath();c.moveTo(27,13);c.lineTo(32,1);c.lineTo(38,13);c.fill();c.fillStyle='#c9d7df';c.fillRect(18,86,29,5);
   c.fillStyle=cloth;c.beginPath();c.moveTo(6,70-swing*.3);c.lineTo(18,68-swing*.3);c.lineTo(20,91-swing*.3);c.lineTo(13,99-swing*.3);c.lineTo(6,91-swing*.3);c.closePath();c.fill();
   c.strokeStyle='#f4f8f9';c.lineWidth=2;c.stroke();c.strokeStyle='#e3edf2';c.lineWidth=3;c.beginPath();c.moveTo(54,83+swing);c.lineTo(54,48+swing);c.stroke();c.restore();
  }
  const gl=this.gl;this.atlas=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(gl.getUniformLocation(this.program,'uAtlas'),0);
 }
 render(game){super.render(game);if(!this.meteorCore)return;const gl=this.gl;let markers=0;
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  for(const c of game.casts||[]){const skill=root.MultidaoAscension.skills[c.skill],t=Math.max(0,Math.min(1,(game.time-c.born)/skill.delay)),color=c.skill==='meteor'?[1,.68,.16]:[.18,.83,1];
   this.draw(this.ring,[[c.x,.045,c.z,game.time*.5,skill.radius,0,.16,...color]]);this.draw(this.mark,[[c.x,.027,c.z,0,skill.radius*t,0,.86,...color]]);markers++;
  }
  for(const e of game.skillFX||[]){const t=1-e.t/e.max,color=e.skill==='meteor'?[1,.67,.17]:[.21,.78,1];this.draw(this.ring,[[e.x,.07,e.z,0,e.radius*(.3+t*.9),0,t,...color]]);if(e.skill==='frost'){const shards=[];for(let i=0;i<10;i++){const a=i*Math.PI/5;shards.push([e.x+Math.cos(a)*e.radius*.65,.12+Math.sin(Math.PI*t)*.65,e.z+Math.sin(a)*e.radius*.65,a,1.1,0,t,...color]);}this.draw(this.iceShard,shards);}else{const sparks=[];for(let i=0;i<14;i++){const a=i*Math.PI/7;sparks.push([e.x+Math.cos(a)*e.radius*t,.20+Math.sin(Math.PI*t)*2,e.z+Math.sin(a)*e.radius*t,a,1.5,0,t,...color]);}this.draw(this.spark,sparks);}}
  gl.depthMask(true);gl.disable(gl.BLEND);
  for(const c of game.casts||[])if(c.skill==='meteor'){const t=Math.min(1,(game.time-c.born)/root.MultidaoAscension.skills.meteor.delay);this.draw(this.meteorCore,[[c.x,1.1+(1-t)*9,c.z+.6*(1-t),0,0,0,0,1,1,1]]);}
  this.lastTactical={markers,effects:(game.skillFX||[]).length};this.lastStats={...this.lastStats,drawCalls:this.drawCalls,tactical:this.lastTactical,visual:'1.0.0'};
 }
}
root.MultidaoAscensionRenderer=Renderer;
})(globalThis);
