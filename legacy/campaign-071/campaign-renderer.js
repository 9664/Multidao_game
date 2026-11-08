/* Renderer extension for 0.7.1: shared stage geometry, lightweight distant models and viewport culling. */
(function(root){
'use strict';
const Base=root.MultidaoRenderer;
class Geo{
 constructor(){this.v=[];}
 tri(a,b,c,color,part=0,tint=0){const x=b.map((v,i)=>v-a[i]),y=c.map((v,i)=>v-a[i]);let n=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],len=Math.hypot(...n)||1;n=n.map(v=>v/len);for(const p of [a,b,c])this.v.push(...p,...n,...color,part,tint);}
 box(x,y,z,w,h,d,color,part=0,tint=0){const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>[x+v[0]*w/2,y+v[1]*h/2,z+v[2]*d/2]);for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){this.tri(p[f[0]],p[f[1]],p[f[2]],color,part,tint);this.tri(p[f[0]],p[f[2]],p[f[3]],color,part,tint);}}
 cylinder(x,y,z,r,h,n,color,top=r,part=0,tint=0){for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n,p=[x+Math.cos(a)*r,y-h/2,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y-h/2,z+Math.sin(b)*r],u=[x+Math.cos(a)*top,y+h/2,z+Math.sin(a)*top],v=[x+Math.cos(b)*top,y+h/2,z+Math.sin(b)*top];this.tri(p,u,v,color,part,tint);this.tri(p,v,q,color,part,tint);this.tri([x,y+h/2,z],v,u,color,part,tint);this.tri([x,y-h/2,z],p,q,color,part,tint);}}
 diamond(x,y,z,r,h,color,part=0,tint=0){const p=[[x-r,y,z],[x,y,z+r],[x+r,y,z],[x,y,z-r]];for(let i=0;i<4;i++){this.tri(p[i],[x,y+h,z],p[(i+1)%4],color,part,tint);this.tri(p[(i+1)%4],[x,y-h,z],p[i],color,part,tint);}}
 ring(inner,outer,color){for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16,p=[Math.cos(a)*inner,0,Math.sin(a)*inner],q=[Math.cos(a)*outer,0,Math.sin(a)*outer],u=[Math.cos(b)*inner,0,Math.sin(b)*inner],v=[Math.cos(b)*outer,0,Math.sin(b)*outer];this.tri(p,q,v,color,9,1);this.tri(p,v,u,color,9,1);}}
}
const palettes={
 sea:{void:[.10,.33,.49],floor:[.70,.70,.65],wall:[.51,.59,.66],edge:[.79,.82,.79],boss:[.12,.53,.75]},
 canyon:{void:[.055,.12,.21],floor:[.76,.67,.52],wall:[.25,.32,.41],edge:[.66,.70,.71],boss:[.80,.12,.10]},
 snow:{void:[.85,.90,.94],floor:[.60,.62,.66],wall:[.42,.47,.55],edge:[.95,.97,1],boss:[.24,.55,.85]},
 sand:{void:[.39,.19,.13],floor:[.83,.67,.42],wall:[.46,.29,.18],edge:[.80,.64,.39],boss:[.90,.49,.08]},
 lava:{void:[.30,.055,.025],floor:[.36,.34,.39],wall:[.20,.19,.25],edge:[.50,.43,.40],boss:[.96,.22,.04]},
 ice:{void:[.70,.82,.92],floor:[.51,.60,.68],wall:[.30,.41,.56],edge:[.84,.94,1],boss:[.62,.20,.85]}
};
const identity=[0,0,0,0,0,0,0,1,1,1];
function cameraMatrix(aspect,eye,target){
 const normalize=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
 const z=normalize(eye.map((v,i)=>v-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x),v=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
 const f=1/Math.tan(43*Math.PI/360),p=[f/aspect,0,0,0,0,f,0,0,0,0,-201/199,-1,0,0,-400/199,0],out=new Float32Array(16);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=p[k*4+r]*v[c*4+k];return out;
}
class Renderer extends Base{
 constructor(canvas){super(canvas);this.quality=1;this.automatic=true;this.lowFrameCount=0;this.gl.deleteBuffer(this.shadow.buffer);const sh=new Geo();sh.tri([-.17,.01,-.13],[.17,.01,-.13],[.17,.01,.13],[.38,.36,.36]);sh.tri([-.17,.01,-.13],[.17,.01,.13],[-.17,.01,.13],[.38,.36,.36]);this.shadow=this.mesh(sh);const ring=new Geo();ring.ring(.86,1,[1,1,1]);this.ring=this.mesh(ring);const sword=new Geo();sword.box(0,0,-1.25,.16,.15,2.5,[.87,.92,.96]);sword.diamond(0,0,-2.55,.19,.19,[1,.81,.36]);sword.box(0,0,-.2,.7,.18,.18,[.95,.69,.22]);this.sword=this.mesh(sword);this.resize();}
 resize(){const box=this.canvas.getBoundingClientRect();this.width=Math.max(1,box.width);this.height=Math.max(1,box.height);const ratio=Math.min(devicePixelRatio||1,this.quality||1),w=Math.round(this.width*ratio),h=Math.round(this.height*ratio);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}const aspect=this.width/this.height,scale=Math.max(1,.5/aspect);this.vp=cameraMatrix(aspect,aspect<.85?[0,47*scale,28*scale]:[0,44,35],[0,0,-12]);this.baseVP=new Float32Array(this.vp);this.gl.viewport(0,0,w,h);this.gl.uniformMatrix4fv(this.vpLoc,false,this.vp);}
 farGeometry(){const g=new Geo();g.diamond(0,.32,0,.15,.24,[1,1,1],0,1);g.diamond(0,.62,0,.12,.13,[1,1,1],0,1);return g;}
 unitGeometry(){const g=new Geo();g.box(0,.33,0,.25,.30,.18,[1,1,1],0,1);g.box(-.07,.11,0,.09,.23,.10,[.13,.18,.24],-1);g.box(.07,.11,0,.09,.23,.10,[.13,.18,.24],1);g.cylinder(0,.60,0,.14,.21,6,[.74,.83,.90],.12);g.box(0,.61,-.13,.20,.045,.025,[.08,.12,.18]);g.cylinder(0,.75,0,.13,.15,5,[1,1,1],0,0,1);g.box(-.20,.35,-.06,.18,.27,.05,[1,1,1],0,1);g.box(.19,.50,-.12,.035,.38,.035,[.91,.89,.78],2);return g;}
 bossGeometry(){const g=new Geo();g.cylinder(0,1.45,0,.70,1.15,10,[1,1,1],.59,0,1);g.box(-.36,.42,0,.45,.85,.60,[.18,.22,.28],-1);g.box(.36,.42,0,.45,.85,.60,[.18,.22,.28],1);g.cylinder(0,2.37,0,.49,.70,10,[.71,.77,.83],.38);g.box(0,2.36,-.46,.66,.12,.045,[.06,.10,.15]);g.box(0,2.28,-.48,.08,.44,.06,[.91,.68,.25]);g.cylinder(0,2.95,0,.17,.53,6,[.86,.63,.22],0);for(const s of [-1,1]){g.cylinder(s*.83,1.87,0,.40,.40,8,[.58,.64,.73]);g.cylinder(s*.83,2.22,0,.13,.45,5,[.87,.89,.93],0);g.box(s*1.0,1.35,0,.38,.75,.40,[1,1,1],2,1);}g.box(0,.94,-.6,.75,.14,.1,[.92,.64,.24]);return g;}
 rebuild(game){if(this.world)this.gl.deleteBuffer(this.world.buffer);this.palette=palettes[game.stage.theme];const c=this.palette,g=new Geo(),road=game.road,snow=['snow','ice'].includes(game.stage.theme);this.gl.clearColor(...c.void,1);
  g.box(0,snow?-.38:-9,-25,130,.15,155,c.void);
  if(game.stage.theme==='sea'||game.stage.theme==='lava')for(let z=-65;z<15;z+=3.5)g.box(0,-8.89,z,115,.01,.16,c.void.map(x=>Math.min(1,x*1.25+.02)));
  for(let s=0;s<road.length-.5;s+=.8){const end=Math.min(s+.81,road.length),p=road.sample(s),q=road.sample(end),a=road.point(s,-p.width),b=road.point(s,p.width),aa=road.point(end,-q.width),bb=road.point(end,q.width);const tone=1+(Math.floor(s/.8)%3)*.008,col=c.floor.map(v=>v*tone);
   g.tri([a.x,0,a.z],[b.x,0,b.z],[bb.x,0,bb.z],col);g.tri([a.x,0,a.z],[bb.x,0,bb.z],[aa.x,0,aa.z],col);
   for(const [u,v] of [[a,aa],[b,bb]]){const depth=snow?-.35:-9;g.tri([u.x,depth,u.z],[u.x,-.02,u.z],[v.x,-.02,v.z],c.wall);g.tri([u.x,depth,u.z],[v.x,-.02,v.z],[v.x,depth,v.z],c.wall);
    const dx=v.x-u.x,dz=v.z-u.z,len=Math.hypot(dx,dz)||1,nx=-dz/len*.12,nz=dx/len*.12;
    const A=[u.x+nx,.44,u.z+nz],B=[u.x-nx,.44,u.z-nz],C=[v.x-nx,.44,v.z-nz],D=[v.x+nx,.44,v.z+nz];g.tri(A,B,C,c.edge);g.tri(A,C,D,c.edge);g.tri([u.x+nx,0,u.z+nz],A,D,c.wall);g.tri([u.x+nx,0,u.z+nz],D,[v.x+nx,0,v.z+nz],c.wall);
    if(Math.floor(s/.8)%3===0)g.box(u.x,.56,u.z,.29,.28,.32,c.edge);
   }
  }
  if(!snow)for(let s=1;s<road.length;s+=2.8){const p=road.sample(s);for(const side of [-1,1]){const a=road.point(s,side*(p.width+.23));g.box(a.x,-4.6,a.z,.65,8.8,1.15,c.wall.map(v=>v*.92));}}
  if(snow)for(let i=0;i<36;i++){const s=3+i*1.7,p=road.sample(s),v=road.point(s,(i%2?-1:1)*(p.width+1.4+i%3));g.cylinder(v.x,.30,v.z,.08,.60,4,[.42,.35,.30]);g.cylinder(v.x,.95,v.z,.45,1.4,6,c.edge,0);g.cylinder(v.x,1.30,v.z,.30,.90,6,[1,1,1],0);}
  const gate=game.gates[0],width=game.road.spec.width;for(const side of [-1,1]){const v=road.point(gate.s,side*(width-.06));g.box(v.x,.77,v.z,.18,1.54,.23,[.94,.68,.21]);}
  g.box(gate.x,1.48,gate.z,width*2,.14,.24,[.95,.70,.25]);g.box(0,.014,4.3,12,.03,.13,[.15,.59,1]);this.world=this.mesh(g);
 }
 render(game){
  const gl=this.gl;this.drawCalls=0;this.vp.set(this.baseVP);if(!this.reducedMotion&&game.shock>0){this.vp[12]+=Math.sin(game.time*57)*game.shock*.13;this.vp[13]+=Math.cos(game.time*43)*game.shock*.07;}
  gl.uniformMatrix4fv(this.vpLoc,false,this.vp);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(this.timeLoc,game.time);this.draw(this.world,[identity]);
  const near=[],far=[],shadows=[],m=this.vp;let culled=0,total=game.blue.length+game.red.length;
  for(const group of [game.blue,game.red])for(const u of group){const ww=m[3]*u.x+m[11]*u.z+m[15],x=(m[0]*u.x+m[8]*u.z+m[12])/ww,y=(m[1]*u.x+m[9]*u.z+m[13])/ww;
   if(ww<=0||Math.abs(x)>1.08||Math.abs(y)>1.1){culled++;continue;}
   const tint=u.team==='blue'?[.045,.45,1]:[.95,.055,.08],lift=u.air>0?.2+Math.sin((.5-u.air)*Math.PI/.5)*.65:0;
   const detailed=near.length<(this.quality>1?280:100)&&(u.s<23||u.target&&u.id%5===0);
   (detailed?near:far).push([u.x,lift,u.z,u.angle,u.walking,u.id*.73,Math.max(u.hit*4,u.swing*3),...tint]);if(detailed)shadows.push([u.x,0,u.z,0,0,0,0,1,1,1]);
  }
  this.draw(this.shadow,shadows);this.draw(this.farUnit,far);this.draw(this.unit,near);
  this.draw(this.towerMesh,game.towers.filter(t=>t.state==='active').map(t=>[t.x,0,t.z,0,0,0,t.flash*3,1,1,1]));
  const guns=[];for(let i=0;i<game.cannons;i++){const kick=game.effects.find(e=>e.type==='muzzle'&&e.cannon===i);guns.push([game.gunX+(i-(game.cannons-1)/2)*1.32,0,2.3+(kick?kick.t*.7:0),0,0,0,0,1,1,1]);}this.draw(this.cannon,guns);
  const b=game.boss;
  if(!['dormant','defeated'].includes(b.state)){const entry=b.state==='entering'?Math.max(0,b.timer)*2:0,tint=(this.palette||palettes.canyon).boss;this.draw(this.bossMesh,[[b.x,entry,b.z,b.angle,b.walking,0,b.hit*4,...tint]]);
   let swing=b.state==='windup'?-.7*(1-b.timer/game.cfg.bossWindup):b.state==='strike'?1.4*(1-b.timer/.18):0;
   this.draw(this.sword,[[b.x+.75,entry+1.85,b.z,b.angle+swing,0,0,b.hit*4,1,1,1]]);
  }
  this.draw(this.ball,game.shells.map(u=>[u.x,.8,u.z,0,0,0,0,1,1,1]));
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  if(['windup','strike'].includes(b.state)){const p=game.road.point(b.s-1.2,b.l);this.draw(this.mark,[[p.x,.03,p.z,0,game.cfg.bossAttackRadius,0,.68,1,.22,.04]]);this.draw(this.ring,[[p.x,.05,p.z,0,game.cfg.bossAttackRadius,0,.12,1,.65,.09]]);}
  const particles=[];for(const e of game.effects){const t=1-e.t/e.max,n=e.type==='muzzle'?5:2;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,smoke=e.type==='muzzle'&&i<3;particles.push([e.x+Math.cos(a)*t*.7,.3+Math.sin(t*Math.PI)*.7,e.z+Math.sin(a)*t*.7,0,smoke?1+t*5:1,0,t*.85,...(smoke?[.87,.89,.91]:e.type==='stone'||e.type==='collapse'?[.67,.65,.61]:[1,.75,.28])]);}}
  this.draw(this.spark,particles);gl.depthMask(true);gl.disable(gl.BLEND);
  this.lastStats={units:total,visible:near.length+far.length,culled,near:near.length,far:far.length,drawCalls:this.drawCalls,instanced:!!this.ext,quality:this.quality};
 }
}
root.CampaignRenderer=Renderer;
})(globalThis);
