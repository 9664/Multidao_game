from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json,sys
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence-v092';OUT.mkdir(exist_ok=True)
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
  page.locator('#choose').click();page.screenshot(path=str(OUT/'modes.png'));page.locator('#close-map').click()
  for level in [1,7,8,9]:
   page.evaluate("level=>{__gameTest.select(level);__gameTest.begin();__gameTest.pause();}",level)
   page.evaluate("document.getElementById('overlay').hidden=true;__gameTest.refresh()")
   page.screenshot(path=str(OUT/('map-'+str(level)+'.png')))
   print('VIEW',level,page.evaluate('__gameTest.snapshot()'),flush=True)
  print('ERRORS',errors,flush=True);b.close()
