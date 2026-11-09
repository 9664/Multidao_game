/* Closer battle camera, while preserving all interactive targets inside the viewport. */
(function(root){
class Renderer extends root.SiegeRenderer{
 resize(){super.resize();const zoom=this.width/this.height<.85?1.075:1;
  // Clip-space scale keeps projection and pointer unprojection aligned.
  for(let c=0;c<4;c++){this.vp[c*4]*=zoom;this.vp[c*4+1]*=zoom;}
  this.vp[13]-=.015;this.baseVP.set(this.vp);this.gl.uniformMatrix4fv(this.vpLoc,false,this.vp);
 }
}
root.MultidaoRushRenderer=Renderer;
})(globalThis);
