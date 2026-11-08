/* Small, dependency-free WebGL renderer. All art is procedural and original. */
(function(root){
'use strict';
const VERT=`
attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor;
attribute vec2 aPart; attribute vec3 aOffset; attribute vec4 aParams; attribute vec3 aTint;
uniform mat4 uVP; uniform float uTime; varying vec3 vColor;
void main(){
 vec3 p=aPosition; float wave=sin(uTime*12.0+aParams.z);
 if(abs(aPart.x)==1.0){p.z+=wave*.14*aPart.x*aParams.y;p.y+=max(0.0,wave*aPart.x)*.07*aParams.y;}
 if(aPart.x==2.0){p.z-=aParams.w*.24;}
 if(aPart.x!=9.0)p.y+=abs(wave)*.025*aParams.y;
 float c=cos(aParams.x),s=sin(aParams.x);
 mat3 rot=mat3(c,0.,-s,0.,1.,0.,s,0.,c);
 vec3 n=rot*aNormal;
 float light=.57+.43*max(0.,dot(normalize(n),normalize(vec3(-.5,1.,.6))));
 vec3 col=mix(aColor,aColor*aTint,aPart.y);
 vColor=mix(col,vec3(1.,.92,.65),min(.65,aParams.w*.55))*light;
 gl_Position=uVP*vec4(rot*p+aOffset,1.);
}`;
const FRAG=`precision mediump float; varying vec3 vColor; void main(){gl_FragColor=vec4(vColor,1.);}`;
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function view(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function ortho(w,h){return new Float32Array([1/w,0,0,0,0,1/h,0,0,0,0,-2/100,0,0,0,-1,1]);}
class Geometry {
 constructor(){this.v=[];}
 tri(a,b,c,color,part=0,tint=0){const n=norm(cross(sub(b,a),sub(c,a)));for(const p of [a,b,c])this.v.push(...p,...n,...color,part,tint);}
 box(x,y,z,w,h,d,color,part=0,tint=0){
  const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(a=>[x+a[0]*w/2,y+a[1]*h/2,z+a[2]*d/2]);
  for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){this.tri(p[f[0]],p[f[1]],p[f[2]],color,part,tint);this.tri(p[f[0]],p[f[2]],p[f[3]],color,part,tint);}
 }
 cylinder(x,y,z,r,h,n,color,axis='y',top=r,part=0,tint=0){
  const tr=p=>axis==='z'?[x+p[0],y-p[2],z+p[1]]:axis==='x'?[x+p[1],y+p[0],z+p[2]]:[x+p[0],y+p[1],z+p[2]];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;
   const p=[tr([Math.cos(a)*r,-h/2,Math.sin(a)*r]),tr([Math.cos(b)*r,-h/2,Math.sin(b)*r]),tr([Math.cos(b)*top,h/2,Math.sin(b)*top]),tr([Math.cos(a)*top,h/2,Math.sin(a)*top])];
   this.tri(p[0],p[2],p[1],color,part,tint);this.tri(p[0],p[3],p[2],color,part,tint);
   this.tri(tr([0,-h/2,0]),p[0],p[1],color,part,tint);this.tri(tr([0,h/2,0]),p[2],p[3],color,part,tint);
  }
 }
}
const C={stone:[.49,.55,.53],edge:[.65,.69,.62],road:[.77,.68,.51],grass:[.27,.42,.31],gold:[.96,.69,.25],wood:[.39,.23,.12],steel:[.37,.45,.50],dark:[.14,.20,.21],blue:[.17,.59,1],red:[1,.28,.24]};
const identity=[0,0,0,0,0,0,0,1,1,1];
class Renderer {
 constructor(canvas){
  this.canvas=canvas;this.quality=1.5;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'});
  if(!gl)throw new Error('Seu navegador não disponibilizou WebGL. Abra o link no Chrome ou Safari atualizado.');
  this.gl=gl;this.ext=gl.getExtension('ANGLE_instanced_arrays');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const vs=shader(gl.VERTEX_SHADER,VERT),fs=shader(gl.FRAGMENT_SHADER,FRAG),p=gl.createProgram();
  gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));gl.deleteShader(vs);gl.deleteShader(fs);
  this.program=p;gl.useProgram(p);this.attr={};
  for(const n of ['aPosition','aNormal','aColor','aPart','aOffset','aParams','aTint'])this.attr[n]=gl.getAttribLocation(p,n);
  this.vpLoc=gl.getUniformLocation(p,'uVP');this.timeLoc=gl.getUniformLocation(p,'uTime');this.instance=gl.createBuffer();
  gl.enable(gl.DEPTH_TEST);gl.clearColor(.16,.27,.23,1);
  this.unit=this.mesh(this.unitGeometry());this.cannon=this.mesh(this.cannonGeometry());
  const shadow=new Geometry();shadow.cylinder(0,.015,0,.32,.012,10,[.50,.46,.35]);this.shadow=this.mesh(shadow);
  const spark=new Geometry();spark.box(0,0,0,.12,.12,.12,[1,1,1],9,1);this.spark=this.mesh(spark);
  this.resize();
 }
 mesh(geo){const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.v),gl.STATIC_DRAW);return {buffer:b,count:geo.v.length/11};}
 unitGeometry(){
  const g=new Geometry(),white=[.96,.97,1],metal=[.77,.82,.82],skin=[.88,.67,.45];
  g.box(0,.51,0,.34,.40,.24,white,0,1);
  g.box(-.095,.19,0,.13,.30,.16,C.dark,-1);g.box(.095,.19,0,.13,.30,.16,C.dark,1);
  g.box(0,.68,0,.40,.09,.28,metal);g.box(0,.34,0,.36,.08,.25,C.gold);
  g.cylinder(0,.89,0,.19,.24,8,metal);g.cylinder(0,1.05,0,.19,.13,8,white,'y',.04,0,1);
  g.box(0,.89,-.181,.24,.055,.025,C.dark);g.box(0,.80,-.16,.14,.06,.07,skin);
  g.box(-.26,.53,-.10,.25,.36,.07,white,0,1);g.box(-.26,.53,-.145,.055,.30,.025,C.gold);
  g.box(.24,.56,0,.11,.28,.12,white,2,1);g.box(.29,.77,-.10,.05,.44,.045,metal,2);g.box(.29,.60,-.10,.19,.055,.065,C.gold,2);
  return g;
 }
 cannonGeometry(){
  const g=new Geometry();g.box(0,.38,0,1.15,.35,1.25,C.wood);
  for(const x of [-.68,.68]){g.cylinder(x,.35,0,.35,.20,12,C.dark,'x');g.cylinder(x*1.02,.35,0,.12,.22,8,C.gold,'x');}
  g.cylinder(0,.75,-.40,.27,1.35,12,C.steel,'z',.23);g.cylinder(0,.75,-1.06,.27,.12,12,C.gold,'z');g.cylinder(0,.75,-1.13,.19,.025,12,[.04,.06,.07],'z');
  g.box(0,.46,.46,.44,.22,.22,C.gold);return g;
 }
 rebuild(game){
  if(this.world)this.gl.deleteBuffer(this.world.buffer);
  const g=new Geometry();
  g.box(0,-.28,-10,44,.36,58,C.grass);g.box(0,-.06,-10.2,14.2,.12,31.7,C.road);
  for(let z=-25;z<5;z+=1.3){
   for(const x of [-6.65,6.65])g.box(x,.02,z,.45,.08,1.18,[.67,.63,.51]);
   for(const x of [-7.25,7.25])g.box(x,1.06,z,.60,.30,.62,C.edge);
  }
  for(const x of [-7.25,7.25])g.box(x,.44,-10.1,.60,.88,31.8,C.stone);
  for(const w of game.walls){
   g.box(w.x,.41,w.z,w.w,.82,w.d,C.stone);
   const count=Math.floor(w.w/.7);
   for(let j=0;j<count;j++)g.box(w.x-w.w/2+(j+.5)*w.w/count,.91,w.z,w.w/count-.09,.19,w.d+.03,C.edge);
   for(let y=.2;y<.8;y+=.28)g.box(w.x,y,w.z+w.d/2+.009,w.w,.025,.015,[.36,.42,.40]);
  }
  for(const a of game.gates){
   for(const x of [a.x-a.w/2+.10,a.x+a.w/2-.10])g.box(x,.84,a.z,.16,1.68,.20,C.gold);
   g.box(a.x,1.58,a.z,a.w,.17,.22,C.gold);
   g.box(a.x,.018,a.z,a.w,.03,.23,[.27,.62,.66]);
  }
  g.box(0,.025,3.8,12.8,.04,.20,[.23,.60,.82]);
  // Rear keep, towers and banners sit outside the playable area.
  g.box(0,1.65,-26.2,12,3.3,1.2,C.stone);g.box(0,1.18,-25.55,2.7,2.35,.10,C.wood);
  for(let x=-1;x<=1;x+=.5)g.box(x,1.18,-25.47,.06,2.25,.04,C.gold);
  for(const x of [-6,6]){
   g.cylinder(x,1.55,-26,1.2,3.1,10,C.stone);
   g.cylinder(x,3.18,-26,1.3,.28,10,C.edge);
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.box(x+Math.cos(a)*1.12,3.50,-26+Math.sin(a)*1.12,.35,.4,.35,C.edge);}
   g.box(x,4.1,-26,.06,1.3,.06,C.gold);g.box(x+.42,4.40,-26,.80,.47,.025,C.red);
  }
  for(let i=0;i<14;i++){
   const x=(i%2?1:-1)*(9.5+(i%3)*1.5),z=-24+i*2.3;
   g.cylinder(x,.55,z,.13,1.1,6,C.wood);g.cylinder(x,1.5,z,.8,1.7,7,[.18,.34,.25],'y',0);
  }
  this.world=this.mesh(g);
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,this.quality);
  this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);
  const w=Math.round(this.width*ratio),h=Math.round(this.height*ratio);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const aspect=this.width/this.height;this.halfH=Math.max(14,8/aspect);this.halfW=this.halfH*aspect;
  this.vp=multiply(ortho(this.halfW,this.halfH),view([0,26,19],[0,0,-10.8]));
  this.gl.viewport(0,0,w,h);this.gl.uniformMatrix4fv(this.vpLoc,false,this.vp);
 }
 project(x,y,z){const m=this.vp;return {x:(m[0]*x+m[4]*y+m[8]*z+m[12]+1)*this.width/2,y:(1-(m[1]*x+m[5]*y+m[9]*z+m[13]))*this.height/2};}
 pointerX(clientX){const r=this.canvas.getBoundingClientRect();return ((clientX-r.left)/this.width*2-1)*this.halfW;}
 draw(mesh,instances){
  if(!mesh||!instances.length)return;const gl=this.gl,a=this.attr,ext=this.ext;
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
  for(const [n,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aPart',2,9]]){gl.enableVertexAttribArray(a[n]);gl.vertexAttribPointer(a[n],size,gl.FLOAT,false,44,offset*4);if(ext)ext.vertexAttribDivisorANGLE(a[n],0);}
  if(ext){
   gl.bindBuffer(gl.ARRAY_BUFFER,this.instance);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(instances.flat()),gl.DYNAMIC_DRAW);
   for(const [n,size,offset] of [['aOffset',3,0],['aParams',4,3],['aTint',3,7]]){gl.enableVertexAttribArray(a[n]);gl.vertexAttribPointer(a[n],size,gl.FLOAT,false,40,offset*4);ext.vertexAttribDivisorANGLE(a[n],1);}
   ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,mesh.count,instances.length);
  }else{
   for(const n of ['aOffset','aParams','aTint'])gl.disableVertexAttribArray(a[n]);
   for(const v of instances){gl.vertexAttrib3f(a.aOffset,...v.slice(0,3));gl.vertexAttrib4f(a.aParams,...v.slice(3,7));gl.vertexAttrib3f(a.aTint,...v.slice(7));gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
  }
 }
 render(game){
  const gl=this.gl;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(this.timeLoc,game.time);
  this.draw(this.world,[identity]);
  const units=[...game.blue,...game.red],shadows=[],bodies=[];
  for(const u of units){
   const tint=u.team==='blue'?C.blue:C.red;
   const y=u.air>0?.15+Math.sin((.52-u.air)/.52*Math.PI)*.70+u.air*.8:0;
   shadows.push([u.x,0,u.z,0,0,0,0,1,1,1]);
   bodies.push([u.x,y,u.z,u.angle,u.walking,u.id*.73,Math.max(u.hit*4,u.swing*3),...tint]);
  }
  this.draw(this.shadow,shadows);this.draw(this.unit,bodies);
  const recoil=game.effects.find(e=>e.type==='muzzle');this.draw(this.cannon,[[game.gunX,0,3.65+(recoil?recoil.t*.9:0),0,0,0,0,1,1,1]]);
  const particles=[];
  for(const e of game.effects){const t=1-e.t/e.max;for(let i=0;i<6;i++){const a=i*Math.PI/3;particles.push([e.x+Math.cos(a)*t*.7,.4+Math.sin(t*Math.PI)*.8,e.z+Math.sin(a)*t*.7,0,0,0,0,...(e.type==='muzzle'?C.gold:e.team==='red'?C.red:C.blue)]);}}
  this.draw(this.spark,particles);
 }
}
root.MultidaoRenderer=Renderer;
})(typeof globalThis!=='undefined'?globalThis:this);
