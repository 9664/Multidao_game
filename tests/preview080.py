from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
SCRIPTS=['levels','navigation','engine','renderer','audio','campaign','campaign-renderer','fast-road','endless','progress','polish','play']
def load(page,root=ROOT,baseline=False):
 html=(root/'index.html').read_text()
 html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
 html=re.sub(r'<link rel="stylesheet"[^>]+>',lambda m: '<style>'+(root/re.search(r'href="([^"?]+)',m.group(0)).group(1)).read_text()+'</style>',html)
 page.set_content(html,wait_until='load');page.evaluate('window.__TEST_MODE__=true')
 for name in (['levels','navigation','engine','renderer','audio','campaign','campaign-renderer','play'] if baseline else SCRIPTS):page.add_script_tag(content=(root/(name+'.js')).read_text())
if __name__=='__main__':
 out=ROOT/'evidence-v080';out.mkdir(exist_ok=True)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=b.new_page(viewport={'width':390,'height':780},is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  print('ERRORS',errors,page.locator('#error-message').inner_text(),flush=True)
  page.screenshot(path=str(out/'menu.png'))
  page.locator('#choose').click();page.screenshot(path=str(out/'modes.png'))
  page.locator('#resume-infinite').click();page.locator('#start').click();page.wait_for_timeout(500)
  page.evaluate('__gameTest.pause()');print('START',page.evaluate('__gameTest.snapshot()'),flush=True)
  page.evaluate('''()=>{const t=__gameTest,g=t.game;g.pause();for(let i=0;i<800&&g.state==='playing';i++){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();}g.visualAlpha=1;t.refresh();g.pause();document.getElementById('overlay').hidden=true;}''')
  page.screenshot(path=str(out/'endless-battle.png'));print('BATTLE',page.evaluate('__gameTest.snapshot()'),errors,flush=True)
  b.close()
