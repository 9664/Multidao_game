from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
ROOT=Path(__file__).resolve().parent.parent

def load(page):
 html=ROOT.joinpath('index.html').read_text()
 html=re.sub(r'<script src="(?:engine|renderer|audio|app)\.js[^>]*></script>', '', html)
 page.set_content(html,wait_until='load')
 page.evaluate('window.__TEST_MODE__=true')
 for f in ['engine.js','renderer.js','audio.js','app.js']:page.add_script_tag(content=ROOT.joinpath(f).read_text())

