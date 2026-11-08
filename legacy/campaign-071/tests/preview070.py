from pathlib import Path
import re,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence-v070';OUT.mkdir(exist_ok=True)
def load(page):
 html=(ROOT/'index.html').read_text()
 html=re.sub(r'<script src="(?:levels|navigation|engine|renderer|audio|app)\.js[^>]*></script>','',html)
 page.set_content(html,wait_until='load');page.evaluate('window.__TEST_MODE__=true')
 for name in ['levels','navigation','engine','renderer','audio','app']:page.add_script_tag(content=(ROOT/(name+'.js')).read_text())
if __name__=='__main__':
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=b.new_page(viewport={'width':390,'height':780},has_touch=True,is_mobile=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  try:
   page.goto('http://127.0.0.1:8765/?test=1',timeout=5000);print('HTTP',page.url)
  except Exception as e: print('HTTP_FAILURE',str(e)[:220]);load(page)
  print('ERROR',page.locator('#error').is_visible(),page.locator('#error-message').inner_text(),errors)
  page.screenshot(path=str(OUT/'01-menu.png'))
  page.locator('#start').click();page.evaluate('__gameTest.game.pause()');page.wait_for_timeout(350)
  page.screenshot(path=str(OUT/'02-start.png'));print('PROJECTIONS',page.evaluate('__gameTest.projected()'))
  page.evaluate('__gameTest.game.pause();__gameTest.game.aim(-4.65);__gameTest.advance(10);__gameTest.game.pause()')
  page.wait_for_timeout(2500);page.screenshot(path=str(OUT/'03-upgrade.png'));print('STATE',page.evaluate('__gameTest.snapshot()'))
  page.evaluate('__gameTest.game.pause();__gameTest.game.aim(0);__gameTest.advance(20);__gameTest.game.pause()')
  page.wait_for_timeout(2500);page.screenshot(path=str(OUT/'04-battle.png'));print('STATE30',page.evaluate('__gameTest.snapshot()'));print('ERRORS',errors)
  b.close()
