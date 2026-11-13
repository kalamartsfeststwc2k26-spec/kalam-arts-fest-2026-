#!/usr/bin/env python3
"""Create non-AI KALAM brand assets from the supplied transparent artwork."""
from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
original=Image.open(root/'assets/kalam-upload-original.png').convert('RGBA')
bbox=original.getchannel('A').getbbox()
if not bbox: raise ValueError('The original artwork is fully transparent')
# The supplied artwork already contains the college name in black lettering,
# visible on light backgrounds; preserve it rather than adding a duplicate.
full=original.crop(bbox)
canvas=Image.new('RGBA',(1600,1000),(0,0,0,0))
full.thumbnail((1500,900),Image.Resampling.LANCZOS)
canvas.alpha_composite(full,((1600-full.width)//2,(1000-full.height)//2))
canvas.save(root/'public/kalam-logo-college-v2.png',optimize=True)
# The artwork alone is more recognisable in the very small navigation/icons.
mark=original.crop((bbox[0],bbox[1],bbox[2],bbox[1]+int((bbox[3]-bbox[1])*0.86)))
mark.save(root/'public/kalam-mark-v2.png',optimize=True)
# Square install icons keep only the artwork: the long college name is too small
# to read at favicon sizes. Maskable content fits the central 80% safe zone.
for size,filename,safe in [(192,'icon-192-v2.png',0.85),(512,'icon-512-v2.png',0.85),(512,'icon-maskable-512-v2.png',0.68)]:
    bg=Image.new('RGB',(size,size),'#FBF8F6')
    art=mark.copy();art.thumbnail((round(size*safe),round(size*safe)),Image.Resampling.LANCZOS)
    bg.paste(art,((size-art.width)//2,(size-art.height)//2),art)
    bg.save(root/'public'/filename,optimize=True)
print('Generated KALAM artwork, college-name lockup, favicon and app icons.')
