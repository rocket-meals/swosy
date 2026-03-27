#!/usr/bin/env python3
"""
fix_viewbox.py  –  Recalculate the SVG viewBox for every object sprite.

For each *.svg file in the same directory the script:
  1. Parses all <path> elements and extracts their coordinate points.
  2. Computes the axis-aligned bounding box (min/max x and y) of those points.
  3. Adds a small padding and writes the corrected viewBox attribute back to the file.

Usage:
    cd apps/geonexia/frontend/assets/objects
    python3 fix_viewbox.py

Requirements: Python ≥ 3.8 (no third-party packages needed).
"""

import os
import re
import sys
import xml.etree.ElementTree as ET
from typing import List, Tuple

# Padding added around the tight bounding box (in SVG user units).
PADDING = 10

# ─── SVG path parser ──────────────────────────────────────────────────────────

_TOKEN_RE = re.compile(r'([MmZzLlHhVvCcSsQqTtAa])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)')


def _tokenise(d: str) -> List:
    """Return a flat list of command-letters and float values from a path 'd' string."""
    tokens = []
    for m in _TOKEN_RE.finditer(d):
        cmd, num = m.group(1), m.group(2)
        if cmd:
            tokens.append(cmd)
        else:
            tokens.append(float(num))
    return tokens


def _consume(tokens: List, n: int, pos: int) -> Tuple[List[float], int]:
    """Read *n* floats starting at *pos*; return (values, new_pos)."""
    values = [float(tokens[pos + i]) for i in range(n)]
    return values, pos + n


def path_points(d: str) -> List[Tuple[float, float]]:
    """
    Return a list of (x, y) points that define the geometry of the path.

    For curves the control points are included; this slightly overestimates the
    bounding box but is always safe (the true curve lies within the convex hull of
    its control points, so no real pixel is ever excluded).
    """
    tokens = _tokenise(d)
    points: List[Tuple[float, float]] = []
    cx = cy = 0.0   # current point
    sx = sy = 0.0   # start-of-subpath (for Z)
    i = 0
    cmd = 'M'

    while i < len(tokens):
        tok = tokens[i]
        if isinstance(tok, str):
            cmd = tok
            i += 1
            continue

        # Implicit repeated coordinates re-use the last command letter.
        # (For M → L, m → l after the first coordinate pair.)
        match cmd:
            # ── Move-to ──────────────────────────────────────────────────────
            case 'M':
                (x, y), i = _consume(tokens, 2, i)
                cx, cy = x, y
                sx, sy = cx, cy
                points.append((cx, cy))
                cmd = 'L'
            case 'm':
                (dx, dy), i = _consume(tokens, 2, i)
                cx += dx; cy += dy
                sx, sy = cx, cy
                points.append((cx, cy))
                cmd = 'l'

            # ── Close-path ───────────────────────────────────────────────────
            case 'Z' | 'z':
                cx, cy = sx, sy
                # advance to next token (already done by the outer loop)

            # ── Line-to ──────────────────────────────────────────────────────
            case 'L':
                (x, y), i = _consume(tokens, 2, i)
                cx, cy = x, y
                points.append((cx, cy))
            case 'l':
                (dx, dy), i = _consume(tokens, 2, i)
                cx += dx; cy += dy
                points.append((cx, cy))

            # ── Horizontal line-to ───────────────────────────────────────────
            case 'H':
                (x,), i = _consume(tokens, 1, i)
                cx = x
                points.append((cx, cy))
            case 'h':
                (dx,), i = _consume(tokens, 1, i)
                cx += dx
                points.append((cx, cy))

            # ── Vertical line-to ─────────────────────────────────────────────
            case 'V':
                (y,), i = _consume(tokens, 1, i)
                cy = y
                points.append((cx, cy))
            case 'v':
                (dy,), i = _consume(tokens, 1, i)
                cy += dy
                points.append((cx, cy))

            # ── Cubic Bézier ─────────────────────────────────────────────────
            case 'C':
                (x1, y1, x2, y2, x, y), i = _consume(tokens, 6, i)
                points += [(x1, y1), (x2, y2), (x, y)]
                cx, cy = x, y
            case 'c':
                (dx1, dy1, dx2, dy2, dx, dy), i = _consume(tokens, 6, i)
                points += [(cx+dx1, cy+dy1), (cx+dx2, cy+dy2), (cx+dx, cy+dy)]
                cx += dx; cy += dy

            # ── Smooth cubic Bézier ──────────────────────────────────────────
            case 'S':
                (x2, y2, x, y), i = _consume(tokens, 4, i)
                points += [(x2, y2), (x, y)]
                cx, cy = x, y
            case 's':
                (dx2, dy2, dx, dy), i = _consume(tokens, 4, i)
                points += [(cx+dx2, cy+dy2), (cx+dx, cy+dy)]
                cx += dx; cy += dy

            # ── Quadratic Bézier ─────────────────────────────────────────────
            case 'Q':
                (x1, y1, x, y), i = _consume(tokens, 4, i)
                points += [(x1, y1), (x, y)]
                cx, cy = x, y
            case 'q':
                (dx1, dy1, dx, dy), i = _consume(tokens, 4, i)
                points += [(cx+dx1, cy+dy1), (cx+dx, cy+dy)]
                cx += dx; cy += dy

            # ── Smooth quadratic Bézier ──────────────────────────────────────
            case 'T':
                (x, y), i = _consume(tokens, 2, i)
                points.append((x, y))
                cx, cy = x, y
            case 't':
                (dx, dy), i = _consume(tokens, 2, i)
                cx += dx; cy += dy
                points.append((cx, cy))

            # ── Arc ──────────────────────────────────────────────────────────
            # We only capture the end-point of the arc (the arc itself stays
            # within the bounding box of its control geometry).
            case 'A':
                (rx, ry, xrot, laf, sf, x, y), i = _consume(tokens, 7, i)
                points.append((x, y))
                cx, cy = x, y
            case 'a':
                (rx, ry, xrot, laf, sf, dx, dy), i = _consume(tokens, 7, i)
                cx += dx; cy += dy
                points.append((cx, cy))

            case _:
                # Unknown token – skip
                i += 1

    return points


# ─── ViewBox computation ──────────────────────────────────────────────────────

SVG_NS = 'http://www.w3.org/2000/svg'

# ElementTree strips namespace declarations; register ours so output is clean.
ET.register_namespace('', SVG_NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')


def fix_viewbox(svg_path: str) -> bool:
    """
    Rewrite the viewBox of the SVG file at *svg_path* based on its path geometry.
    Also ensures explicit width and height attributes are present so that mobile
    WebViews can determine the SVG's intrinsic dimensions correctly (some WebView
    implementations ignore the viewBox for intrinsic-size calculations when
    width/height are absent, causing incorrect scaling and positional offsets).

    Returns True if the file was changed, False if it was already correct or had
    no path elements.
    """
    tree = ET.parse(svg_path)
    root = tree.getroot()

    all_points: List[Tuple[float, float]] = []

    # Collect points from every <path> element in the document (any depth).
    for elem in root.iter():
        local = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
        if local == 'path':
            d = elem.get('d', '')
            if d:
                all_points.extend(path_points(d))

    if not all_points:
        print(f'  SKIP  {os.path.basename(svg_path)}  (no path elements found)')
        return False

    xs = [p[0] for p in all_points]
    ys = [p[1] for p in all_points]
    min_x = min(xs) - PADDING
    min_y = min(ys) - PADDING
    width  = max(xs) - min(xs) + 2 * PADDING
    height = max(ys) - min(ys) + 2 * PADDING

    new_vb = f'{min_x:.4g} {min_y:.4g} {width:.4g} {height:.4g}'
    new_w  = f'{width:.4g}'
    new_h  = f'{height:.4g}'

    old_vb = root.get('viewBox', '')
    old_w  = root.get('width', '')
    old_h  = root.get('height', '')

    if old_vb == new_vb and old_w == new_w and old_h == new_h:
        print(f'  OK    {os.path.basename(svg_path)}  (viewBox and dimensions already correct)')
        return False

    root.set('viewBox', new_vb)
    root.set('width', new_w)
    root.set('height', new_h)

    # Preserve the original XML declaration and write back.
    # ElementTree does not keep the <?xml …?> header by default – add it manually.
    xml_bytes = ET.tostring(root, encoding='unicode', xml_declaration=False)

    with open(svg_path, 'w', encoding='utf-8') as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        fh.write(xml_bytes)
        fh.write('\n')

    print(f'  FIXED {os.path.basename(svg_path)}')
    if old_vb != new_vb:
        print(f'        viewBox old: {old_vb}')
        print(f'        viewBox new: {new_vb}')
    if old_w != new_w or old_h != new_h:
        print(f'        size old: {old_w}x{old_h}')
        print(f'        size new: {new_w}x{new_h}')
    return True


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    svg_files = sorted(
        f for f in os.listdir(script_dir) if f.lower().endswith('.svg')
    )

    if not svg_files:
        print('No SVG files found in', script_dir)
        sys.exit(1)

    changed = 0
    for name in svg_files:
        path = os.path.join(script_dir, name)
        if fix_viewbox(path):
            changed += 1

    print(f'\nDone. {changed}/{len(svg_files)} files updated.')


if __name__ == '__main__':
    main()
