from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
ROOT=Path(__file__).resolve().parent.parent

def load(page):
    html=ROOT.joinpath('index.html').read_text()
    html=re.sub(r'<script src="(?:engine|renderer|app)\.js[^>]*></script>', '', html)
    page.set_content(html,wait_until='load')
    page.evaluate('window.__TEST_MODE__=true')
    for file in ['engine.js','renderer.js','app.js']:page.add_script_tag(content=ROOT.joinpath(file).read_text())

if __name__=='__main__':
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=b.new_page(viewport={'width':390,'height':780},is_mobile=True,has_touch=True,device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  load(page)
  print('menu error',page.locator('#error').is_visible(),page.locator('#error-message').inner_text(),errors)
  page.screenshot(path=str(ROOT/'evidence/menu-mobile.png'))
  page.locator('#start').click()
  page.wait_for_timeout(1000)
  page.screenshot(path=str(ROOT/'evidence/start-mobile.png'))
  print('state',page.evaluate('window.__gameTest.snapshot()'))
  print('camera',page.evaluate('window.__gameTest.projected()'))
  page.evaluate('window.__gameTest.advance(7)')
  page.screenshot(path=str(ROOT/'evidence/battle-mobile.png'))
  print('battle',page.evaluate('window.__gameTest.snapshot()'))
  page.evaluate('window.__gameTest.advance(25)')
  page.screenshot(path=str(ROOT/'evidence/result-mobile.png'))
  print('result',page.evaluate('window.__gameTest.snapshot()'),'errors',errors)
  b.close()
