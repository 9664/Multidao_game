from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v100';OUT.mkdir(exist_ok=True)
cases=[(i,d,20261108,'campaign') for i in range(1,10) for d in ['guard','siege','swarm']]+[(i,'guard',42,'endless') for i in [1,10,30,1000]]
def run(case):
 p=subprocess.run(['node','tests/sim100.cjs',*map(str,case)],cwd=ROOT,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(str(case)+': '+p.stderr)
 return json.loads(p.stdout)
rows=[]
with ThreadPoolExecutor(max_workers=2) as pool:
 for f in as_completed([pool.submit(run,c) for c in cases]):
  r=f.result();rows.append(r);print(r['mode'],r['level'],r['doctrine'],r['state'],r['time'],flush=True);(OUT/'matrix.json').write_text(json.dumps(rows,indent=2))
print('COMPLETE',len(rows),flush=True)
