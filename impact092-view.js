/* Visual shot history is cosmetic; only Impact.Game resolves hits and charges. */
(function(root){
'use strict';
const G=root.MultidaoVisualGeometry,Base=root.MultidaoRushRenderer,one=[[0,0,0,0,0,0,0,1,1,1]];
class Renderer extends Base{
 constructor(canvas){super(canvas);
  const streak=new G();streak.cylinder(0,0,0,.045,1,6,[1,1,1],'z',.016,9,1);this.streak=this.mesh(streak);
  const orb=new G();orb.sphere(0,0,0,.19,.19,.19,[1,1,1],9,1);this.shotCore=this.mesh(orb);
  this.lastShots={live:0,retired:0,trails:0};
 }
 rebuild(game){
  super.rebuild(game);if(this.routeProps)this.gl.deleteBuffer(this.routeProps.buffer);
  const g=new G(),r=game.road,format=game.stage.format,stone=[.47,.51,.48],wood=[.40,.26,.13],blue=[.09,.35,.69],rope=[.50,.40,.27];
  if(format==='forest'){
   for(let i=0;i<65;i++){const s=8+i*(r.length-12)/65,p=r.sample(s),side=i%2?1:-1,v=r.point(s,side*(p.width+.8+(i%4)*.55));
    g.cylinder(v.x,.7,v.z,.13,1.4,6,wood);g.sphere(v.x,1.9+(i%3)*.15,v.z,.75,.85,.69,[.13+(i%3)*.025,.34+(i%4)*.018,.16]);
    if(i%5===0){g.box(v.x+.4,.35,v.z-.3,.55,.70,.60,stone);g.box(v.x+.4,.77,v.z-.3,.65,.14,.7,[.62,.65,.55]);}
   }
   for(const t of [27,30,39,43])for(const side of [-1,1]){const p=r.atT(t),v=r.point(p.s,side*(p.width+.34));g.box(v.x,.9,v.z,.7,1.8,.8,stone);g.box(v.x,1.84,v.z,.86,.16,.96,[.70,.69,.56]);g.box(v.x-.14,1.13,v.z-.44,.16,1.0,.10,[.18,.36,.20]);}
  }
  if(format==='bastions'){
   for(const t of [21,32,42])for(const side of [-1,1]){const p=r.atT(t),v=r.point(p.s,side*(p.width+.55));g.cylinder(v.x,1.6,v.z,.90,3.2,8,[.45,.48,.51]);g.cylinder(v.x,3.25,v.z,1.05,.18,8,[.70,.72,.68]);
    for(let k=0;k<6;k++){const a=k*Math.PI/3;g.box(v.x+Math.cos(a)*.9,3.56,v.z+Math.sin(a)*.9,.33,.48,.33,[.69,.71,.66]);}
    g.box(v.x,2.2,v.z+.91,.39,.92,.045,blue);g.box(v.x,2.2,v.z+.94,.09,.58,.02,[.93,.72,.32]);
   }
   for(const t of [27,38])for(const side of [-1,1]){const p=r.atT(t),v=r.point(p.s,side*(p.width+.3));g.box(v.x,1.3,v.z,.75,2.6,.9,[.56,.57,.56]);g.box(v.x,2.67,v.z,.85,.13,1.0,[.77,.74,.66]);}
  }
  if(format==='bridge'||format==='chicane'){
   // Planks, towers and the two rope rails follow the same centreline as navigation.
   for(let s=r.gateS+.2;s<r.plateauS;s+=.48){const p=r.sample(s),q=r.sample(Math.min(r.length,s+.42)),a=r.point(s,-p.width+.12),b=r.point(s,p.width-.12),aa=r.point(q.s,-q.width+.12),bb=r.point(q.s,q.width-.12);const c=[.54+(Math.floor(s)%3)*.02,.38,.22];g.tri([a.x,.025,a.z],[b.x,.025,b.z],[bb.x,.025,bb.z],c);g.tri([a.x,.025,a.z],[bb.x,.025,bb.z],[aa.x,.025,aa.z],c);}
   for(let s=r.gateS+1;s<r.plateauS;s+=1.65)for(const side of [-1,1]){const p=r.sample(s),q=r.sample(Math.min(s+1.66,r.plateauS)),a=r.point(s,side*(p.width-.12)),b=r.point(q.s,side*(q.width-.12));g.cylinder(a.x,.7,a.z,.06,1.4,6,wood);
    g.tri([a.x,.9,a.z],[a.x,1.0,a.z],[b.x,1.0,b.z],rope);g.tri([a.x,.9,a.z],[b.x,1.0,b.z],[b.x,.9,b.z],rope);
   }
   for(const t of [19,33,45]){const p=r.atT(t);for(const side of [-1,1]){const v=r.point(p.s,side*(p.width+.2));g.box(v.x,1.65,v.z,.45,3.3,.55,wood);g.box(v.x,-3.5,v.z,.60,7,.65,stone);g.cylinder(v.x,3.4,v.z,.20,.22,6,[.77,.61,.32]);}}
  }
  this.routeProps=this.mesh(g);
 }
 render(game){
  super.render(game);if(!this.streak)return;
  const gl=this.gl,alpha=game.state==='playing'?(game.visualAlpha??1):1,records=game.shotVisuals||[],trails=[],cores=[],flashes=[];
  if(this.routeProps?.count)this.draw(this.routeProps,one);
  let live=0,retired=0;
  for(const v of records){const age=game.time-v.born;if(v.done&&v.until<=game.time)continue;
   const shell=v.kind==='shell';if(shell&&!v.done)live++;if(v.done)retired++;
   const a=v.done?1:alpha,x=v.px+(v.x-v.px)*a,z=v.pz+(v.z-v.pz)*a,y=v.py+(v.y-v.py)*a;
   let dx=v.x-v.px,dz=v.z-v.pz,d=Math.hypot(dx,dz);if(d<.001){dx=v.x-v.sx;dz=v.z-v.sz;d=Math.hypot(dx,dz)||1;}
   const length=Math.min(shell?2.2:.85,Math.max(.20,d*(shell?1.7:2.2))),ux=dx/d,uz=dz/d;
   const fade=v.done?Math.max(0,Math.min(.96,1-(v.until-game.time)/(shell?.24:.12))):.12;
   const color=shell?[1,.84,.37]:[.50,.88,1];
   // Depth remains enabled: a trail cannot make a shot visible through a solid tower.
   trails.push([x-ux*length*.5,y,z-uz*length*.5,Math.atan2(dx,dz),length,0,fade,...color]);
   if(shell&&!v.done)cores.push([x,y,z,0,1.1,0,0,1,.96,.76]);
   if(v.done&&shell&&v.reason==='hit')flashes.push([v.x,.96,v.z+.12,0,1.0+(1-fade)*1.5,0,fade,1,.88,.52]);
   if(age<.13)flashes.push([v.sx,.85,v.sz,0,1.0+(1-age/.13)*1.8,0,age/.13,1,.92,.67]);
  }
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  this.draw(this.streak,trails);this.draw(this.shotCore,cores);this.draw(this.spark,flashes);
  gl.depthMask(true);gl.disable(gl.BLEND);
  this.lastShots={live,retired,trails:trails.length,cores:cores.length,flashes:flashes.length};
  this.lastStats={...this.lastStats,drawCalls:this.drawCalls,shots:this.lastShots,visual:'0.9.2'};
 }
}
root.MultidaoImpactRenderer092=Renderer;
})(globalThis);
