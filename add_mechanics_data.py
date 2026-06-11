#!/usr/bin/env python3
import re, random

random.seed(42)

PATH = '/sessions/ecstatic-confident-pascal/mnt/CodexGame/sort-tiles/js/levels.js'

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

def parse_level(block_text):
    result = {}
    m = re.search(r'id:\s*(\d+)', block_text)
    if m: result['id'] = int(m.group(1))
    m = re.search(r"name:\s*'([^']*)'", block_text)
    if m: result['name'] = m.group(1)
    m = re.search(r'rows:\s*(\d+)', block_text)
    if m: result['rows'] = int(m.group(1))
    m = re.search(r'cols:\s*(\d+)', block_text)
    if m: result['cols'] = int(m.group(1))
    m = re.search(r'optimalMoves:\s*(\d+)', block_text)
    if m: result['optimalMoves'] = int(m.group(1))
    m = re.search(r"features:\s*\[([^\]]*)\]", block_text)
    if m:
        raw = m.group(1)
        result['features'] = [f.strip().strip("'") for f in raw.split(',') if f.strip()]
    m = re.search(r'timeLimit:\s*(\d+)', block_text)
    if m: result['timeLimit'] = int(m.group(1))
    m = re.search(r'tiles:\s*\[([\s\S]*?)\n    \]', block_text)
    if m:
        tiles_raw = m.group(1)
        tiles = []
        for tile_match in re.finditer(r"\{([^}]*)\}", tiles_raw):
            td = {}
            mr = re.search(r"row:\s*(\d+)", tile_match.group(1))
            if mr: td['row'] = int(mr.group(1))
            mc = re.search(r"col:\s*(\d+)", tile_match.group(1))
            if mc: td['col'] = int(mc.group(1))
            md = re.search(r"direction:\s*'(\w+)'", tile_match.group(1))
            if md: td['direction'] = md.group(1)
            mt = re.search(r"type:\s*'(\w+)'", tile_match.group(1))
            if mt: td['type'] = mt.group(1)
            if td: tiles.append(td)
        result['tiles'] = tiles
    return result

def get_empty_cells(level):
    occupied = {(t['row'], t['col']) for t in level['tiles']}
    empty = []
    for r in range(level['rows']):
        for c in range(level['cols']):
            if (r, c) not in occupied:
                empty.append((r, c))
    return empty

# Split by lines, track brace depth to find level blocks
lines = content.split('\n')
level_blocks = []
in_level = False
depth = 0
block_start = 0

for i, line in enumerate(lines):
    s = line.strip()
    opens = s.count('{')
    closes = s.count('}')
    if not in_level:
        if s == '{' and line.startswith('  '):
            in_level = True
            depth = 1
            block_start = i
    else:
        depth += opens - closes
        if depth == 0:
            block = '\n'.join(lines[block_start:i + 1])
            level_blocks.append(block)
            in_level = False

print(f"Found {len(level_blocks)} level blocks")

levels = [parse_level(b) for b in level_blocks]

for lvl in levels:
    feats = lvl.get('features', [])
    tiles = lvl['tiles']
    empty = get_empty_cells(lvl)

    if 'rotating' in feats:
        n = max(1, int(len(tiles) * 0.35))
        for idx in random.sample(range(len(tiles)), n):
            tiles[idx]['type'] = 'rotating'

    if 'walls' in feats:
        n = max(2, min(int(len(empty) * 0.18), 8))
        cells = random.sample(empty, min(n, len(empty)))
        lvl['switchWalls'] = [{'row': r, 'col': c} for r, c in cells]

    if 'portals' in feats:
        n = max(1, min(int(len(empty) * 0.06), 3))
        avail = list(empty)
        random.shuffle(avail)
        pairs = []
        while len(pairs) < n and len(avail) >= 2:
            a = avail.pop()
            b = avail.pop()
            pairs.append([
                {'row': a[0], 'col': a[1]},
                {'row': b[0], 'col': b[1]}
            ])
        if pairs:
            lvl['portalPairs'] = pairs

# Build output
out = [
    '/**',
    ' * levels.js — 100 уровней (автосгенерировано)',
    ' */',
    'const LEVELS = [',
]

for i, lvl in enumerate(levels):
    last_lvl = (i == len(levels) - 1)
    out.append('  {')
    out.append(f"    id: {lvl['id']},")
    out.append(f"    name: '{lvl['name']}',")
    out.append(f"    rows: {lvl['rows']}, cols: {lvl['cols']},")
    out.append(f"    optimalMoves: {lvl['optimalMoves']},")

    feats = lvl.get('features', [])
    if feats:
        fs = ", ".join(f"'{f}'" for f in feats)
        out.append(f"    features: [{fs}],")
    if lvl.get('timeLimit'):
        out.append(f"    timeLimit: {lvl['timeLimit']},")

    sw = lvl.get('switchWalls', [])
    if sw:
        items = ", ".join(f"{{row: {w['row']}, col: {w['col']}}}" for w in sw)
        out.append(f"    switchWalls: [{items}],")

    pp = lvl.get('portalPairs', [])
    if pp:
        items = []
        for p in pp:
            a, b = p
            items.append(
                f"[{{row: {a['row']}, col: {a['col']}}},"
                f" {{row: {b['row']}, col: {b['col']}}}]"
            )
        out.append(f"    portalPairs: [{', '.join(items)}],")

    tiles = lvl['tiles']
    out.append('    tiles: [')
    for j, t in enumerate(tiles):
        s = f"      {{ row: {t['row']}, col: {t['col']}, direction: '{t['direction']}'"
        if t.get('type'):
            s += f", type: '{t['type']}'"
        s += " }"
        if j < len(tiles) - 1:
            s += ","
        out.append(s)
    out.append('    ]')
    out.append('  },' if not last_lvl else '  }')

out.append('];')
out.append('')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print("Done. Stats:")
for lvl in levels:
    rot = sum(1 for t in lvl['tiles'] if t.get('type') == 'rotating')
    walls = len(lvl.get('switchWalls', []))
    portals = len(lvl.get('portalPairs', []))
    if rot or walls or portals:
        fs = ','.join(lvl.get('features', []))
        print(f"  Lvl {lvl['id']}: {fs} -> r:{rot} w:{walls} p:{portals}")
