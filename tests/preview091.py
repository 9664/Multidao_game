from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json,sys
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence-v091';OUT.mkdir(exist_ok=True)
def load(page,root=ROOT):
 html=(root/'index.html').read_text();scripts=re.findall(r'<script src="([^"?]+)[^"]*"',html)
 html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
 html=re.sub(r'<link rel="stylesheet"[^>]+>',lambda m:'<style>'+(root/re.search(r'href="([^"?]+)',m.group()).group(1)).read_text()+'</style>',html)
 page.set_content(html,wait_until='load');page.evaluate('window.__TEST_MODE__=true')
 for path in scripts:page.add_script_tag(content=(root/path).read_text())
if __name__=='__main__':
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=b.new_page(viewport={'width':390,'height':780},is_mobile=True,has_touch=True,device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  print('ERROR',page.locator('#error-message').inner_text(),errors,flush=True)
  if errors:sys.exit(1)
  page.evaluate('__gameTest.select(2)');page.locator('#start').click();page.evaluate('__gameTest.game.pause()');page.wait_for_timeout(250)
  page.screenshot(path=str(OUT/'start.png'))
  for sec in [8,16,22]:
   page.evaluate('''seconds=>{const t=__gameTest,g=t.game;g.reset(2);g.start();for(let i=0;i<seconds*30&&g.state==='playing';i++){g.aim(g.cannons<2?-4.65:g.metrics.reinforcementsAwarded<99?4.65:g.cannons<3?-4.65:0);if(g.cannons>=3&&g.burstCooldown<=0)g.activateBurst();g.step();}g.visualAlpha=1;t.refresh();if(g.state==='playing')g.pause();document.getElementById('overlay').hidden=true;}''',sec)
   page.screenshot(path=str(OUT/f'battle-{sec}.png'))
   print('STATE',sec,page.evaluate('__gameTest.snapshot()'),flush=True)
  print('ERRORS',errors,flush=True);b.close()
