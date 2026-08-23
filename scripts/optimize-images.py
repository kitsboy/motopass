#!/usr/bin/env python3
"""Optimize MotoPass images: generate webp (and avif) + responsive width variants.
Run from repo root: python3 scripts/optimize-images.py
"""
import os
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(REPO, 'public/images')

# (file, is_hero, widths_for_srcset)
# hero + large page images get a primary webp at original width plus (for heroes) srcset widths
IMAGES = {
    'sovereignty.jpg': {'hero': True,  'widths': [480, 800, 1280]},
    'header-elite.jpg': {'hero': False, 'widths': []},
    'hero.jpg':         {'hero': True,  'widths': [480, 800, 1280]},
    'education.jpg':    {'hero': False, 'widths': []},
    'incubator.jpg':    {'hero': False, 'widths': []},
    'passport.jpg':     {'hero': False, 'widths': []},
    'funding-flow.jpg': {'hero': False, 'widths': []},
    'vault-archive.jpg':{'hero': False, 'widths': []},
    'data-story.jpg':   {'hero': False, 'widths': []},
    'kimi.jpg':         {'hero': False, 'widths': []},
}

def opt(im, path, quality, fmt):
    if fmt == 'WEBP':
        im.save(path, 'WEBP', quality=quality, method=6)
    elif fmt == 'AVIF':
        im.save(path, 'AVIF', quality=quality, speed=6)

for name, cfg in IMAGES.items():
    src = os.path.join(PUB, name)
    if not os.path.exists(src):
        print('MISSING', name); continue
    im = Image.open(src).convert('RGB')
    base = os.path.splitext(name)[0]
    # Primary webp at original resolution
    w = im.size[0]
    opt(im, os.path.join(PUB, f'{base}.webp'), 82, 'WEBP')
    try:
        opt(im, os.path.join(PUB, f'{base}.avif'), 76, 'AVIF')
    except Exception as e:
        print('  avif fail', name, e)
    # Hero: responsive widths
    if cfg.get('hero'):
        for width in cfg['widths']:
            if width >= w: continue
            r = width / w
            rw = im.resize((width, max(1, round(im.size[1] * r))), Image.Resampling.LANCZOS)
            opt(rw, os.path.join(PUB, f'{base}-{width}w.webp'), 82, 'WEBP')
            try:
                opt(rw, os.path.join(PUB, f'{base}-{width}w.avif'), 76, 'AVIF')
            except Exception as e:
                print('  avif fail', name, width, e)
    print('optimized', name, '-> webp', os.path.getsize(os.path.join(PUB, f'{base}.webp'))//1024, 'KB')

print('done')
