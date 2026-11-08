from pathlib import Path
from playwright.sync_api import sync_playwright
from preview080 import load,ROOT
import json
out=ROOT/'evidence-v080';runs=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name in ['original','revised','revised','original']:
  page=b.new_page(viewport={'width':390,'height':780},is_mobile=True,has_touch=True,device_scale_factor=1)
  load(page,ROOT/'legacy/campaign-071' if name=='original' else ROOT,baseline=name=='original')
  page.evaluate('''()=>{const t=__gameTest;t.select(6);t.game.start();const g=t.game;for(let i=0;i<600;i++){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();}g.pause();g.visualAlpha=1;t.renderer.quality=1;t.renderer.resize();document.getElementById('overlay').hidden=true;}''')
  result=page.evaluate('''async()=>{const t=__gameTest,frames=[],cpu=[];let last=0;for(let i=0;i<100;i++){const now=await new Promise(requestAnimationFrame);const start=performance.now();t.renderer.render(t.game);const elapsed=performance.now()-start;if(i>=20){frames.push(now-last);cpu.push(elapsed);}last=now;}const stats=arr=>{arr.sort((a,b)=>a-b);return {p50:arr[Math.floor(arr.length*.5)],p95:arr[Math.floor(arr.length*.95)],p99:arr[Math.floor(arr.length*.99)],mean:arr.reduce((a,b)=>a+b,0)/arr.length}};return {frames:stats(frames),cpu:stats(cpu),units:t.game.blue.length+t.game.red.length,kills:t.game.metrics.kills,gl:t.renderer.gl.getError(),render:t.renderer.lastStats};}''')
  result['name']=name;runs.append(result);print(name,result,flush=True)
  page.screenshot(path=str(out/('comparison-'+name+'.png')))
  (out/'render-benchmark.json').write_text(json.dumps({'method':'Frozen identical level 6 after 600 deterministic steps; 20 warmup then 80 RAF/render samples; resolution 390x780 DPR1','browser':b.version,'hardware':'SwiftShader software renderer; not a phone','runs':runs},indent=2))
  page.close()
 b.close()
