#!/usr/bin/env python3
import random, math

random.seed(42)

OUT = '/sessions/ecstatic-confident-pascal/mnt/CodexGame/sort-tiles/js/levels.js'

# Level definitions
# Mapping old features to new tubes:
#   'rotating' → straight tubes (static) on empty cells
#   'walls'    → corner tubes (static) on empty cells
#   'portals'  → rotatable tubes on empty cells
#   'timer'    → timer (unchanged)
SPECS = [
    # (count, rows, cols, fill%, features, time_limit)
    (3,  5, 5, 0.50, [], None),
    (3,  5, 5, 0.70, [], None),
    (3,  6, 6, 0.50, [], None),
    (5,  6, 6, 0.60, ['rotating'], None),
    (5,  6, 6, 0.80, ['rotating'], None),
    (5,  6, 6, 0.60, ['walls'], None),
    (5,  6, 6, 0.80, ['walls'], None),
    (5,  6, 6, 0.60, ['portals'], None),
    (5,  6, 6, 0.80, ['portals'], None),
    (5,  6, 6, 0.60, ['rotating','walls'], None),
    (5,  6, 6, 0.80, ['rotating','walls'], None),
    (5,  6, 6, 0.60, ['rotating','portals'], None),
    (5,  6, 6, 0.80, ['rotating','portals'], None),
    (5,  6, 6, 0.60, ['walls','portals'], None),
    (5,  6, 6, 0.80, ['walls','portals'], None),
    (5,  6, 6, 0.60, ['rotating','walls','portals'], None),
    (5,  6, 6, 0.80, ['rotating','walls','portals'], None),
    (10, 6, 6, 0.60, ['rotating','walls','portals','timer'], 120),
    (11, 6, 6, 0.90, ['rotating','walls','portals','timer'], 120),
]

DIRS = ['up', 'down', 'left', 'right']

def gen_level(lvl_id, rows, cols, fill_pct, features, time_limit):
    total_cells = rows * cols
    num_tiles = max(3, int(total_cells * fill_pct))
    cells = [(r, c) for r in range(rows) for c in range(cols)]
    random.shuffle(cells)
    tiles = []
    for i in range(num_tiles):
        r, c = cells[i]
        d = random.choice(DIRS)
        tiles.append({'row': r, 'col': c, 'direction': d})

    # Estimate optimal moves
    estimate = estimate_moves(tiles, rows, cols)
    optimal = max(estimate, num_tiles // 2 + 2)

    lvl = {
        'id': lvl_id,
        'name': f'Этап {lvl_id}',
        'rows': rows, 'cols': cols,
        'optimalMoves': optimal,
        'features': features,
        'tiles': tiles,
        'tubes': []
    }
    if time_limit:
        lvl['timeLimit'] = time_limit

    # Occupied cells (tiles + blocked cells)
    occupied = {(t['row'], t['col']) for t in tiles}

    # --- Straight tubes (replaces 'rotating' feature) ---
    if 'rotating' in features:
        empty = [(r, c) for r in range(rows) for c in range(cols)
                 if (r, c) not in occupied]
        n = max(1, min(int(len(empty) * 0.18), 8))
        chosen = random.sample(empty, min(n, len(empty)))
        for r, c in chosen:
            occupied.add((r, c))
            lvl['tubes'].append({
                'row': r, 'col': c,
                'type': 'straight',
                'orientation': random.choice([0, 1]),
                'colorIndex': random.randint(0, 2)
            })

    # --- Corner tubes (replaces 'walls' feature) ---
    if 'walls' in features:
        empty = [(r, c) for r in range(rows) for c in range(cols)
                 if (r, c) not in occupied]
        n = max(2, min(int(len(empty) * 0.18), 8))
        chosen = random.sample(empty, min(n, len(empty)))
        for r, c in chosen:
            occupied.add((r, c))
            lvl['tubes'].append({
                'row': r, 'col': c,
                'type': 'corner',
                'orientation': random.randint(0, 3),
                'colorIndex': random.randint(0, 2)
            })

    # --- Rotatable tubes (replaces 'portals' feature) ---
    if 'portals' in features:
        empty = [(r, c) for r in range(rows) for c in range(cols)
                 if (r, c) not in occupied]
        n = max(1, min(int(len(empty) * 0.06), 3))
        chosen = random.sample(empty, min(n, len(empty)))
        for r, c in chosen:
            occupied.add((r, c))
            lvl['tubes'].append({
                'row': r, 'col': c,
                'type': 'rotatable',
                'orientation': random.randint(0, 3),
                'colorIndex': random.randint(0, 2)
            })

    return lvl

def estimate_moves(tiles, rows, cols):
    """Heuristic: count tiles pointing toward edge exits vs toward center."""
    moves = 0
    for t in tiles:
        r, c, d = t['row'], t['col'], t['direction']
        if d == 'up':
            dist = r
        elif d == 'down':
            dist = rows - 1 - r
        elif d == 'left':
            dist = c
        else:  # right
            dist = cols - 1 - c
        if dist <= 2:
            moves += 1
        else:
            moves += 2
    return max(moves + 2, int(len(tiles) * 0.7))

# Generate all levels
all_levels = []
lvl_id = 1

feat_abbr = {
    'rotating': 'П',
    'walls': 'С',
    'portals': 'Пл',
    'timer': 'Т',
}

for count, rows, cols, fill, features, time_limit in SPECS:
    for _ in range(count):
        lvl = gen_level(lvl_id, rows, cols, fill, list(features), time_limit)
        if features:
            abbrs = ' '.join(feat_abbr[f] for f in features)
            lvl['name'] = f'Этап {lvl_id} [{abbrs}]'
        all_levels.append(lvl)
        lvl_id += 1

# Override names for first 3
custom_names = {
    1: 'Первый шаг',
    2: 'Проще простого',
    3: 'Три дороги',
    10: 'Прямые трубы',
    20: 'Углы',
    30: 'Поворотные',
    40: 'Прямые и Углы',
    50: 'Прямые и Поворотные',
    60: 'Углы и Поворотные',
    70: 'Всё вместе',
    80: 'Гонка',
    90: 'Финал',
}
for lvl in all_levels:
    if lvl['id'] in custom_names:
        lvl['name'] = custom_names[lvl['id']]

# Build JS output
def format_tile(t, last=False):
    s = f"      {{ row: {t['row']}, col: {t['col']}, direction: '{t['direction']}' }}"
    if not last:
        s += ","
    return s

def format_tube(t, last=False):
    s = (f"      {{ row: {t['row']}, col: {t['col']}, "
         f"type: '{t['type']}', orientation: {t['orientation']}, "
         f"colorIndex: {t['colorIndex']} }}")
    if not last:
        s += ","
    return s

lines = [
    '/**',
    ' * levels.js — 100 уровней (автосгенерировано, версия с трубами)',
    ' */',
    'const LEVELS = [',
]

for i, lvl in enumerate(all_levels):
    last_lvl = (i == len(all_levels) - 1)
    lines.append('  {')
    lines.append(f"    id: {lvl['id']},")
    lines.append(f"    name: '{lvl['name']}',")
    lines.append(f"    rows: {lvl['rows']}, cols: {lvl['cols']},")
    lines.append(f"    optimalMoves: {lvl['optimalMoves']},")

    feats = lvl.get('features', [])
    if feats:
        fs = ", ".join(f"'{f}'" for f in feats)
        lines.append(f"    features: [{fs}],")
    if lvl.get('timeLimit'):
        lines.append(f"    timeLimit: {lvl['timeLimit']},")

    tubes = lvl.get('tubes', [])
    if tubes:
        lines.append('    tubes: [')
        for j, t in enumerate(tubes):
            lines.append(format_tube(t, last=(j == len(tubes) - 1)))
        lines.append('    ],')

    tiles = lvl['tiles']
    lines.append('    tiles: [')
    for j, t in enumerate(tiles):
        lines.append(format_tile(t, last=(j == len(tiles) - 1)))
    lines.append('    ]')
    lines.append('  },' if not last_lvl else '  }')

lines.append('];')
lines.append('')

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Generated {len(all_levels)} levels")
for lvl in all_levels:
    straights = sum(1 for t in lvl['tubes'] if t['type'] == 'straight')
    corners = sum(1 for t in lvl['tubes'] if t['type'] == 'corner')
    rotatables = sum(1 for t in lvl['tubes'] if t['type'] == 'rotatable')
    tm = lvl.get('timeLimit', '')
    feat = ','.join(lvl.get('features', []))
    print(f"  Lvl {lvl['id']}: {lvl['rows']}x{lvl['cols']} "
          f"tiles={len(lvl['tiles'])} {feat} "
          f"s:{straights} c:{corners} r:{rotatables} t:{tm}")
