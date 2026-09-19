#!/usr/bin/env python3
"""Regenerates src/content/gallery.ts from whatever is in public/gallery.

Drop new photos into a folder under public/gallery/<Section Name>/ and run:
    python3 scripts/gallery.py
"""
import json
import os
import urllib.parse

ROOT = os.path.join(os.path.dirname(__file__), '..')
GALLERY = os.path.join(ROOT, 'public', 'gallery')

# Sections render in this order; anything new is appended after them.
ORDER = ["Last Year Drops", "Aarunya 10.0", "Scribble Day '26", "Distribution", "Behind The Scenes"]

BLURBS = {
    "Last Year Drops": "A look back at previous drops and the pieces people still wear.",
    "Aarunya 10.0": "Energy, sponsors, games, and the moments that shaped the fest.",
    "Scribble Day '26": "Signatures, memories, and one last campus canvas for the batch.",
    "Distribution": "Collection counters, QR checks, packed kits and handover moments.",
    "Behind The Scenes": "Design, packing, sorting, and the committee work around each drop.",
}


def main() -> None:
    dirs = [d for d in sorted(os.listdir(GALLERY))
            if os.path.isdir(os.path.join(GALLERY, d)) and d != 'landingpage']
    dirs.sort(key=lambda d: ORDER.index(d) if d in ORDER else 99)

    sections = []
    for d in dirs:
        items = []
        for f in sorted(os.listdir(os.path.join(GALLERY, d))):
            if f.startswith('.'):
                continue
            title = os.path.splitext(f)[0]
            if title.lower().startswith('whatsapp image'):
                title = f'{d} moment'
            items.append({
                'src': f'/gallery/{urllib.parse.quote(d)}/{urllib.parse.quote(f)}',
                'title': title,
            })
        sections.append({'title': d, 'blurb': BLURBS.get(d, ''), 'items': items})

    hero_dir = os.path.join(GALLERY, 'landingpage')
    hero = [f'/gallery/landingpage/{urllib.parse.quote(f)}'
            for f in sorted(os.listdir(hero_dir)) if not f.startswith('.')]

    out = (
        '// Generated from public/gallery, re-run scripts/gallery.py after adding photos.\n\n'
        'export type GalleryItem = { src: string; title: string }\n'
        'export type GallerySection = { title: string; blurb: string; items: GalleryItem[] }\n\n'
        f'export const heroShots: string[] = {json.dumps(hero, indent=2)}\n\n'
        f'export const gallery: GallerySection[] = {json.dumps(sections, indent=2)}\n'
    )
    with open(os.path.join(ROOT, 'src', 'content', 'gallery.ts'), 'w') as fh:
        fh.write(out)
    print(f'Wrote {len(sections)} sections, {sum(len(s["items"]) for s in sections)} photos.')


if __name__ == '__main__':
    main()
