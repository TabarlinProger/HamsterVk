#!/usr/bin/env python3
"""Merge levels - keep existing 1-49, only use NEW 7x7 batch files for 50-100."""
import subprocess, re, json, os

SORT_TILES = '/sessions/ecstatic-confident-pascal/mnt/CodexGame/sort-tiles'
os.chdir(SORT_TILES)

def parse_file(path):
    r = subprocess.run(['node', '-e',
        'var fs=require("fs"),c=fs.readFileSync("'+path+'","utf-8"),m=c.match(/const LEVELS = (\\[[\\s\\S]*\\]);/);'
        'console.log(JSON.stringify(m?eval(m[1]):[]));'
    ], capture_output=True, text=True, timeout=10)
    return json.loads(r.stdout.strip())

# Load existing levels 1-49
all_levels = parse_file('js/levels.js')
all_levels = [l for l in all_levels if l['id'] < 50]
seen = {l['id'] for l in all_levels}
print("Kept", len(all_levels), "existing levels (1-49)")

# Only merge NEW batch files that have 7x7 grids.
# New files were generated with L7_FILL=0.30 or 0.25 and have proper 7x7 grids.
# They should NOT contain 3-tile fallbacks or 6x6 grids.
#
# Strategy: find files that have at least one 7x7 grid and include all their levels.
# For conflicts, prefer the file with more tubes.
import glob

# Collect all candidate levels from batch files
candidates = {}  # id -> (file, tubes_count, level_data)

for bf in sorted(glob.glob('levels_*.js'),
    key=lambda x: [int(s) if s.isdigit() else 0 for s in re.findall(r'\d+', x)]):
    if bf == 'levels.js': continue
    if bf == 'levels_data.csv': continue
    levels = parse_file(bf)
    for l in levels:
        if l['id'] < 50: continue  # keep existing
        tube_count = len(l.get('tubes', []))
        tile_count = len(l.get('tiles', []))
        is_7x7 = l.get('rows') >= 7
        if l['id'] not in candidates:
            candidates[l['id']] = []
        candidates[l['id']].append({
            'file': bf,
            'tubes': tube_count,
            'tiles': tile_count,
            'is_7x7': is_7x7,
            'data': l
        })

# For each level, pick the best candidate:
# 1. Prefer 7x7 grids over 6x6
# 2. Prefer more tubes
# 3. Prefer more tiles
picked = []
for lid in sorted(candidates.keys()):
    opts = candidates[lid]
    # Sort: 7x7 first, then tubes desc, then tiles desc
    opts.sort(key=lambda o: (1 if o['is_7x7'] else 0, o['tubes'], o['tiles']), reverse=True)
    best = opts[0]
    all_levels.append(best['data'])
    seen.add(lid)
    if len(opts) > 1:
        print(f"Level {lid}: picked {best['file']} ({best['tubes']}tubes/{best['tiles']}tiles {'7x7' if best['is_7x7'] else '6x6'})")

all_levels.sort(key=lambda l: l['id'])
print(f"\nTotal: {len(all_levels)} levels")
with_tubes = sum(1 for l in all_levels if l.get('tubes'))
fb = [l['id'] for l in all_levels if len(l.get('tiles',[]))<=3]
print(f"Tubes: {with_tubes}, 3-tile: {fb}")
print(f"5x5: {sum(1 for l in all_levels if l.get('rows')==5)}")
print(f"6x6: {sum(1 for l in all_levels if l.get('rows')==6)}")
print(f"7x7: {sum(1 for l in all_levels if l.get('rows')>=7)}")

out = '/**\n * levels.js - '+str(len(all_levels))+' levels (auto-generated, tube version)\n */\nconst LEVELS = [\n'
for c in all_levels:
    n = c.get('name', 'Level '+str(c['id']))
    out += '  {\n    id: '+str(c['id'])+',\n    name: \''+n+'\',\n'
    out += '    rows: '+str(c['rows'])+', cols: '+str(c['cols'])+',\n'
    out += '    optimalMoves: '+str(c.get('optimalMoves',10))+',\n'
    if c.get('features'): out += '    features: '+json.dumps(c['features'])+',\n'
    if c.get('timeLimit'): out += '    timeLimit: '+str(c['timeLimit'])+',\n'
    if c.get('tubes'): out += '    tubes: '+json.dumps(c['tubes'])+',\n'
    out += '    tiles: '+json.dumps(c['tiles'])+'\n  },\n'
out += '];\n'

with open('js/levels.js','w') as f: f.write(out)
print(f"Written to js/levels.js ({len(out)} bytes)")
