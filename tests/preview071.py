from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
SCRIPTS=['levels','navigation','engine','renderer','audio','campaign','campaign-renderer','play']
def load(page):
 html=(ROOT/'index.html').read_text()
 html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
 html=re.sub(r'<link rel="stylesheet"[^>]+>',lambda _: '<style>'+(ROOT/'campaign.css').read_text()+'</style>',html)
 page.set_content(html,wait_until='load');page.evaluate('window.__TEST_MODE__=true')
 for name in SCRIPTS:page.add_script_tag(content=(ROOT/(name+'.js')).read_text())
if __name__=='__main__':
 (ROOT/'evidence-v071').mkdir(exist_ok=True)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=b.new_page(viewport={'width':390,'height':780},is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
  print('ERRORS',errors,page.locator('#error-message').inner_text(),flush=True)
  page.screenshot(path=str(ROOT/'evidence-v071/menu.png'))
  page.locator('#start').click();page.wait_for_timeout(900);page.screenshot(path=str(ROOT/'evidence-v071/start.png'))
  print('projection',page.evaluate('__gameTest.projected()'),flush=True)
  print('start',page.evaluate('__gameTest.snapshot()'),flush=True)
  page.evaluate('__gameTest.game.aim(-4.65);__gameTest.advance(6);__gameTest.game.aim(0);__gameTest.advance(18);__gameTest.game.pause()');page.wait_for_timeout(400)
  page.screenshot(path=str(ROOT/'evidence-v071/battle.png'))
  print('battle',page.evaluate('__gameTest.snapshot()'),errors,flush=True);b.close()
