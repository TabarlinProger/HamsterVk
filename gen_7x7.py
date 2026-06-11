#!/usr/bin/env python3
"""Generate 7x7 levels (50-100) with optimal params.
Generates 3 levels per batch for speed.
Env overrides: L7_ATTEMPTS=10 L7_STATES=25000 L7_FILL=0.30"""
import subprocess, sys, os, time, re, json, glob

SORT_TILES = '/sessions/ecstatic-confident-pascal/mnt/CodexGame/sort-tiles'
os.chdir(SORT_TILES)

# Read CSV to find 7x7 level IDs
csv_path = os.path.join(SORT_TILES, 'levels_data.csv')
seven_x7_ids = []
with open(csv_path) as f:
    lines = f.read().strip().split('\n')
    for line in lines[1:]:
        parts = []
        cur = ''
        in_q = False
        for ch in line:
            if ch == '"':
                in_q = not in_q
            elif ch == ',' and not in_q:
                parts.append(cur)
                cur = ''
            else:
                cur += ch
        parts.append(cur)
        if len(parts) >= 5:
            grid = parts[4].lower().rstrip('\x00')
            g = grid.split('x')
            if len(g) >= 2:
                try:
                    if int(g[0]) >= 7 and int(g[1]) >= 7:
                        seven_x7_ids.append(int(parts[0]))
                except:
                    pass

print(f"Found {len(seven_x7_ids)} 7x7 levels: {seven_x7_ids[0]}...{seven_x7_ids[-1]}")

# Generate 3 at a time
BATCH = 3
for i in range(0, len(seven_x7_ids), BATCH):
    batch = seven_x7_ids[i:i+BATCH]
    start_id = batch[0]
    end_id = batch[-1]

    env = os.environ.copy()
    env['LEVEL_START'] = str(start_id)
    env['LEVEL_END'] = str(end_id)
    env['L7_ATTEMPTS'] = '10'
    env['L7_STATES'] = '25000'
    env['L7_FILL'] = '0.30'

    print(f"\n=== Batch {i//BATCH+1}/{(len(seven_x7_ids)+BATCH-1)//BATCH}: levels {start_id}-{end_id} ===")
    t0 = time.time()

    result = subprocess.run(
        ['node', os.path.join(SORT_TILES, 'generate_levels.js')],
        env=env,
        capture_output=True,
        text=True,
        timeout=40
    )
    elapsed = time.time() - t0

    for line in result.stdout.strip().split('\n'):
        print(f"  {line}")

    out_file = os.path.join(SORT_TILES, f'levels_{start_id}-{end_id}.js')
    if os.path.exists(out_file):
        with open(out_file) as f:
            content = f.read()
        ids_found = re.findall(r'id: (\d+)', content)
        tube_count = content.count('tubes:')
        three_tile = len(re.findall(r'optimalMoves: [123],', content))
        print(f"  -> {len(ids_found)} levels, {tube_count} with tubes, {three_tile} fallbacks")
    else:
        print(f"  -> FAILED: no output")

    print(f"  -> {elapsed:.1f}s")
    if elapsed > 38:
        print("  -> WARNING: near timeout, reducing next batch size")
    time.sleep(0.3)

# Merge all batch files into js/levels.js
print("\n=== Merging all levels ===")

# Read existing levels 1-49
levels_js_path = os.path.join(SORT_TILES, 'js', 'levels.js')
with open(levels_js_path) as f:
    existing = f.read()

existing_match = re.search(r'const LEVELS = (\[[\s\S]*?\]);', existing)
all_levels = []
if existing_match:
    sandbox = {}
    # Use json.loads as a safe alternative - convert JS object notation to JSON
    js_text = existing_match.group(1)
    # Replace single-quoted keys with double-quoted
    js_text = re.sub(r"'", '"', js_text)
    # Remove trailing commas
    js_text = re.sub(r',\s*}', '}', js_text)
    js_text = re.sub(r',\s*]', ']', js_text)
    all_levels = json.loads(js_text)

# Keep only levels 1-49
all_levels = [l for l in all_levels if l['id'] < 50]
kept_ids = {l['id'] for l in all_levels}

# Read batch files for 7x7 levels
batch_files = sorted(glob.glob(os.path.join(SORT_TILES, 'levels_5*.js')))
batch_files += sorted(glob.glob(os.path.join(SORT_TILES, 'levels_6*.js')))
batch_files += sorted(glob.glob(os.path.join(SORT_TILES, 'levels_7*.js')))
batch_files += sorted(glob.glob(os.path.join(SORT_TILES, 'levels_8*.js')))
batch_files += sorted(glob.glob(os.path.join(SORT_TILES, 'levels_9*.js')))

new_count = 0
for bf in batch_files:
    with open(bf) as f:
        content = f.read()
    match = re.search(r'const LEVELS = (\[[\s\S]*?\]);', content)
    if not match:
        continue
    js_text = match.group(1)
    # Convert to JSON
    js_text = re.sub(r"'", '"', js_text)
    js_text = re.sub(r',\s*}', '}', js_text)
    js_text = re.sub(r',\s*]', ']', js_text)
    try:
        levels = json.loads(js_text)
        for l in levels:
            if l['id'] not in kept_ids:
                all_levels.append(l)
                kept_ids.add(l['id'])
                new_count += 1
    except:
        print(f"  Failed to parse {bf}")

all_levels.sort(key=lambda l: l['id'])
print(f"Kept {len([l for l in all_levels if l['id'] < 50])} levels (1-49)")
print(f"Added {new_count} new levels (50-100)")
print(f"Total: {len(all_levels)}")

# Build JS output
out = '/**\n * levels.js - {} levels (auto-generated, tube version)\n */\nconst LEVELS = [\n'.format(len(all_levels))
for cfg in all_levels:
    out += '  {\n'
    out += '    id: ' + str(cfg['id']) + ',\n'
    out += "    name: '" + cfg.get('name', 'Уровень ' + str(cfg['id'])) + "',\n"
    out += '    rows: ' + str(cfg['rows']) + ', cols: ' + str(cfg['cols']) + ',\n'
    out += '    optimalMoves: ' + str(cfg.get('optimalMoves', 10)) + ',\n'
    if cfg.get('features'):
        out += '    features: ' + json.dumps(cfg['features']) + ',\n'
    if cfg.get('timeLimit'):
        out += '    timeLimit: ' + str(cfg['timeLimit']) + ',\n'
    if cfg.get('tubes'):
        out += '    tubes: ' + json.dumps(cfg['tubes']) + ',\n'
    out += '    tiles: ' + json.dumps(cfg['tiles']) + '\n'
    out += '  },\n'
out += '];\n'

with open(levels_js_path, 'w') as f:
    f.write(out)
print(f"Written to {levels_js_path}")

# Stats
with_tubes = sum(1 for l in all_levels if l.get('tubes'))
seven_x7 = sum(1 for l in all_levels if l.get('rows') >= 7)
fallback = [l for l in all_levels if len(l.get('tiles', [])) <= 3]
print(f"With tubes: {with_tubes}")
print(f"7x7 grids: {seven_x7}")
if fallback:
    print(f"Fallbacks: {[l['id'] for l in fallback]}")
else:
    print("No fallbacks!")
