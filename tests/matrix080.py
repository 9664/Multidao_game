from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v080';OUT.mkdir(exist_ok=True)
def run(case):
 wave,seed=case;r=subprocess.run(['node','tests/infinite-sim.cjs',str(wave),str(seed)],cwd=ROOT,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr)
 return json.loads(r.stdout)
rows=[]
with ThreadPoolExecutor(max_workers=2) as pool:
 for f in as_completed([pool.submit(run,(wave,seed)) for wave in [1,5,10,25,100,1000,1000000] for seed in [20261108,42]]):
  r=f.result();rows.append(r);print(r['wave'],r['runSeed'],r['state'],r['time'],flush=True);(OUT/'endless-matrix.json').write_text(json.dumps(rows,indent=2))
print('COMPLETE',len(rows),flush=True)
