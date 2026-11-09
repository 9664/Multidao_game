from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import subprocess,json
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'evidence-v090';OUT.mkdir(exist_ok=True)
cases=[(level,seed,'upgrade') for level in range(1,7) for seed in [20261108,42]]+[(1,20261108,'center'),(6,42,'center')]
def run(c):
 p=subprocess.run(['node','tests/rush-sim.cjs',*map(str,c)],cwd=ROOT,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
 r=json.loads(p.stdout);r['seed']=c[1];return r
rows=[]
with ThreadPoolExecutor(max_workers=2) as pool:
 for f in as_completed([pool.submit(run,c) for c in cases]):
  r=f.result();rows.append(r);print(r['level'],r['seed'],r['strategy'],r['state'],r['time'],r['firstClash'],flush=True);(OUT/'rush-matrix.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('COMPLETE',len(rows),flush=True)
