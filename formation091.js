/* Same living enemy count; continuous canyon formation rather than separated blocks. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MultidaoFormation091=api;})(globalThis,()=>{
function arrange(game){
 if(game.stage.theme!=='canyon')return;
 const n=game.red.length,start=game.gates[0].s+10,end=game.road.plateauS+.6,front=Math.min(n,Math.max(108,Math.floor(n*.30))),cols=12,rows=Math.ceil(front/cols);
 for(let i=0;i<front;i++){const u=game.red[i],row=Math.floor(i/cols),s=start+(end-start)*row/Math.max(1,rows-1),w=Math.min(1.98,game.road.sample(s).width-.22);u.s=s;u.l=((i%cols)/(cols-1)*2-1)*w;game.road.pose(u);u.px=u.x;u.pz=u.z;}
 const remaining=n-front,columns=64,ranks=Math.ceil(remaining/columns),last=game.road.length-.5;
 for(let i=0;i<remaining;i++){const u=game.red[front+i],row=Math.floor(i/columns);const h=(Math.imul(u.id,1103515245)+12345)>>>0,j=(h%1000)/1000;u.s=Math.min(last,end+.5+(last-end-.5)*row/Math.max(1,ranks-1)+(j-.5)*.30);const w=Math.min(15.1,game.road.sample(u.s).width-.23);u.l=Math.max(-w,Math.min(w,((i%columns)/(columns-1)*2-1)*w+(j-.5)*.24));game.road.pose(u);u.px=u.x;u.pz=u.z;}
}
return {arrange};});
