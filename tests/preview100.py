from pathlib import Path
import re,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence-v100';OUT.mkdir(exist_ok=True)
def load(page,root=ROOT):
 html=(root/'index.html').read_text();scripts=re.findall(r'<script src="([^"?]+)[^"]*"',html)
 html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
 html=re.sub(r'<link rel="stylesheet"[^>]+>',lambda m:'<style>'+(root/re.search(r'href="([^"?]+)',m.group()).group(1)).read_text()+'</style>',html)
 page.set_content(html,wait_until='load');page.evaluate('window.__TEST_MODE__=true')
 for path in scripts:page.add_script_tag(content=(root/path).read_text())
if __name__=='__main__':
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  print('ERRORS',errors,page.locator('#error-message').inner_text(),flush=True)
  page.screenshot(path=str(OUT/'01-home.png'))
  if errors:raise RuntimeError(errors)
  page.locator('#doctrine-siege').click();page.locator('#start').click();page.wait_for_timeout(250)
  page.evaluate('''()=>{const t=__gameTest,g=t.game;for(let i=0;i<165&&g.state==='playing';i++){g.aim(g.cannons<2?-4.65:0);g.step();}t.refresh();g.pause();document.getElementById('overlay').hidden=true;}''')
  page.screenshot(path=str(OUT/'02-battle.png'))
  page.evaluate('''()=>{const t=__gameTest,g=t.game;g.pause();g.energy=100;g.cast('meteor');g.cast('frost');t.advance(.4);if(g.state==='playing')g.pause();document.getElementById('overlay').hidden=true;}''')
  page.screenshot(path=str(OUT/'03-skills.png'))
  page.evaluate('''()=>{const t=__gameTest,g=t.game;if(g.state==='paused')g.pause();for(let i=0;i<1000&&g.state==='playing';i++){g.aim(0);g.step();}t.refresh();}''')
  page.screenshot(path=str(OUT/'04-choice.png'))
  print('STATE',page.evaluate('__gameTest.snapshot()'),errors,flush=True);b.close()
