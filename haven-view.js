/* Original isometric sanctuary, rendered in the existing WebGL context. */
(function(root){
'use strict';
class Geo{
 constructor(){this.v=[];}
 tri(a,b,c,color){const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;n=n.map(x=>x/l);for(const p of [a,b,c])this.v.push(...p,...n,...color,0,0);}
 box(x,y,z,w,h,d,c){const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>[x+v[0]*w/2,y+v[1]*h/2,z+v[2]*d/2]);for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){this.tri(p[f[0]],p[f[1]],p[f[2]],c);this.tri(p[f[0]],p[f[2]],p[f[3]],c);}}
 cylinder(x,y,z,r,h,n,col,top=r){for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n,P=[x+r*Math.cos(a),y-h/2,z+r*Math.sin(a)],Q=[x+r*Math.cos(b),y-h/2,z+r*Math.sin(b)],U=[x+top*Math.cos(a),y+h/2,z+top*Math.sin(a)],V=[x+top*Math.cos(b),y+h/2,z+top*Math.sin(b)];this.tri(P,U,V,col);this.tri(P,V,Q,col);this.tri([x,y+h/2,z],V,U,col);}}
 roof(x,y,z,w,h,d,c){const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],cc=[x+w/2,y,z+d/2],dd=[x-w/2,y,z+d/2],e=[x,y+h,z-d/2],f=[x,y+h,z+d/2];this.tri(a,e,f,c);this.tri(a,f,dd,c);this.tri(b,cc,f,c.map(v=>v*.82));this.tri(b,f,e,c.map(v=>v*.82));this.tri(a,b,e,c.map(v=>v*.7));this.tri(dd,f,cc,c.map(v=>v*.7));}
}
function matrix(width,height){const aspect=width/height,H=Math.max(12,9.5/aspect),W=H*aspect,eye=[14,23,25],target=[0,0,-1];const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x),v=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1],p=[1/W,0,0,0,0,1/H,0,0,0,0,-2/100,0,0,0,-1,1],m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=p[k*4+r]*v[c*4+k];return m;}
class View{
 constructor(renderer){this.r=renderer;this.world=null;this.signature='';this.clock=0;
  const coin=new Geo();coin.cylinder(0,.18,0,.18,.08,12,[1,.68,.13]);coin.cylinder(0,.23,0,.11,.02,8,[1,.91,.46]);this.coin=renderer.mesh(coin);
  const hero=new Geo();hero.cylinder(0,.52,0,.24,.62,8,[.07,.31,.75]);hero.cylinder(0,.97,0,.21,.30,8,[.89,.70,.49]);hero.cylinder(0,1.18,0,.24,.14,8,[1,.72,.14]);for(let i=0;i<5;i++){const a=i*2*Math.PI/5;hero.cylinder(Math.cos(a)*.20,1.34,Math.sin(a)*.20,.065,.22,4,[1,.79,.27],0);}hero.box(-.13,.15,0,.16,.30,.20,[.12,.18,.24]);hero.box(.13,.15,0,.16,.30,.20,[.12,.18,.24]);hero.box(.33,.65,-.16,.045,.60,.045,[.82,.89,.94]);this.hero=renderer.mesh(hero);
  const arrow=new Geo();arrow.box(0,0,0,.035,.035,.48,[.93,.87,.71]);arrow.roof(0,0,-.27,.12,.08,.18,[.78,.85,.91]);this.arrow=renderer.mesh(arrow);
 }
 build(game){const levels=game.profile.buildings,sig=JSON.stringify(levels);if(this.signature===sig)return;this.signature=sig;const g=new Geo(),stone=[.59,.61,.61],wood=[.34,.22,.12],blue=[.09,.37,.75],gold=[.94,.67,.20];
  g.box(0,-.28,-1,25,.5,27,[.24,.61,.43]);g.box(0,.006,2,2.7,.025,15,[.72,.65,.48]);g.box(0,.008,-.7,11,.026,2,[.76,.69,.52]);
  for(let i=0;i<28;i++){const x=((i*37)%100)/100*15-7.5,z=((i*61)%100)/100*18-10;if(Math.abs(x)>2)g.box(x,.012,z,.35,.025,.20,[.30,.66,.46]);}
  for(let i=0;i<8;i++)g.box(0,.026,6-i*1.3,2.3,.018,.035,[.64,.57,.43]);
  for(let i=0;i<35;i++){const side=i%2?1:-1,x=side*(8+(i%3)*.5),z=-11+(i*.65);g.cylinder(x,.55,z,.12,1.1,5,wood);g.cylinder(x,1.45,z,.65,1.8,7,[.12,.34,.26],0);}
  for(const [key,b] of Object.entries(MultidaoHaven.BUILDINGS)){
   const level=levels[key];if(!level){g.box(b.x,.03,b.z,key==='hall'?3.8:2.5,.05,key==='hall'?3.3:2.2,[.28,.44,.34]);for(let i=0;i<5;i++)g.box(b.x-1+i*.5,.07,b.z+1,.27,.05,.07,[.82,.88,.70]);continue;}
   g.box(b.x+.30,.025,b.z+.42,key==='hall'?3.9:2.2,.014,key==='hall'?3.2:1.9,[.17,.40,.28]);
   if(key==='hall'){
    const h=1.4+level*.35;g.box(b.x,h/2,b.z,3,h,2.6,stone);for(const x of [-1.3,1.3])g.box(b.x+x,h/2,b.z+1.32,.16,h,.14,wood);g.box(b.x,.69,b.z+1.32,.70,1.38,.10,wood);g.roof(b.x,h,b.z,3.6,1.40,3.1,blue);g.box(b.x,1.1,b.z+1.42,.74,.12,.16,gold);
    for(const x of [-.9,.9])g.box(b.x+x,1.1,b.z+1.33,.42,.55,.06,[.11,.24,.31]);
    g.cylinder(b.x,h+1.7,b.z,.045,1.2,5,wood);g.box(b.x+.38,h+2.05,b.z,.70,.36,.025,blue);
    if(level>1){g.box(-2, .7,b.z,1.3,1.4,2.2,stone);g.roof(-2,1.4,b.z,1.5,.7,2.4,blue);}
    if(level>2){g.box(2,1.0,b.z,1.3,2,2.2,stone);g.roof(2,2,b.z,1.5,.7,2.4,blue);}
   }else if(key==='west'||key==='east'){
    const h=1.55+level*.25;
    if(level===1){for(const x of [-.7,.7])for(const z of [-.6,.6])g.box(b.x+x,h/2,b.z+z,.17,h,.17,wood);g.box(b.x,h,b.z,1.9,.16,1.8,wood);}else g.box(b.x,h/2,b.z,1.7,h,1.6,stone);
    for(const x of [-.78,.78])for(const z of [-.70,.70])g.box(b.x+x,h+.30,b.z+z,.32,.50,.32,level===1?wood:stone);
    if(level===3)g.cylinder(b.x,h+.15,b.z,.42,.15,8,gold);
   }else{
    for(let i=-8;i<=8;i++){if(Math.abs(i)<2)continue;const x=i*.55,h=.85+level*.20;g.cylinder(x,h/2,3,.13,h,5,wood);g.cylinder(x,h+.12,3,.14,.3,5,[.57,.40,.21],0);}g.box(-2.7,.45,3,3.7,.10,.14,wood);g.box(2.7,.45,3,3.7,.10,.14,wood);
   }
  }
  if(this.world)this.r.gl.deleteBuffer(this.world.buffer);this.world=this.r.mesh(g);
 }
 point(x,z){const r=this.r;return r.project(x,0,z);}
 ground(clientX,clientY){const r=this.r,b=r.canvas.getBoundingClientRect(),nx=(clientX-b.left)/r.width*2-1,ny=1-(clientY-b.top)/r.height*2,m=r.vp,dx=nx-m[12],dy=ny-m[13],det=m[0]*m[9]-m[8]*m[1];return {x:(dx*m[9]-dy*m[8])/det,z:(dy*m[0]-dx*m[1])/det};}
 render(game,dt){this.clock+=dt||0;this.build(game);const r=this.r,gl=r.gl;r.vp.set(matrix(r.width,r.height));gl.uniformMatrix4fv(r.vpLoc,false,r.vp);gl.uniform1f(r.timeLoc,this.clock);gl.clearColor(.12,.30,.24,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);r.draw(this.world,[[0,0,0,0,0,0,0,1,1,1]]);
  const guards=[];for(const key of ['west','east']){const level=game.profile.buildings[key],b=MultidaoHaven.BUILDINGS[key];if(level)for(let i=0;i<level+1;i++)guards.push([b.x+(i-(level)/2)*.39,1.55+level*.25,b.z,Math.PI,0,i,.15,.07,.40,.95]);}
  r.draw(r.unit,guards);r.draw(this.hero,[[game.hero.x,0,game.hero.z,game.hero.angle,game.hero.walk,0,0,1,1,1]]);
  r.draw(r.unit,game.enemies.map(e=>[e.x,0,e.z,0,e.walk,e.id,0,.95,.06,.10]));
  r.draw(this.coin,game.coins.map(c=>[c.x,.10+Math.sin(this.clock*4+c.id)*.10,c.z,this.clock+c.id,0,0,0,1,1,1]));
  r.draw(this.arrow,game.arrows.map(a=>[a.x,.7+Math.sin(Math.min(1,a.age/1.2)*Math.PI)*.5,a.z,Math.atan2(a.x-a.fromX,a.z-a.fromZ),0,0,0,1,1,1]));
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);r.draw(r.ring,[[game.hero.x,.02,game.hero.z,0,.65,0,.12,.90,1,.37]]);
  const particles=[];for(const e of game.effects){const t=e.t;particles.push([e.x,.6+(1-t),e.z,0,2,0,Math.max(0,1-t),...(e.type==='gold'?[1,.83,.25]:e.type==='build'?[.88,1,.64]:[1,.51,.21])]);}r.draw(r.spark,particles);gl.depthMask(true);gl.disable(gl.BLEND);
 }
 dispose(){for(const m of [this.world,this.coin,this.hero,this.arrow])if(m)this.r.gl.deleteBuffer(m.buffer);this.world=null;}
}
root.MultidaoHavenView=View;
})(globalThis);
