"""Convert the approved RGB GeoTIFF to a project-owned Cesium single image.
Usage: python scripts/prepare-imagery.py --source <True_color.tiff>
Requires rasterio, numpy and Pillow. Not needed to run the generated app.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
import rasterio
from PIL import Image
from pyproj import Geod

parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True, type=Path)
args = parser.parse_args()
output = Path(__file__).resolve().parents[1] / 'public' / 'maps'
output.mkdir(parents=True, exist_ok=True)
with rasterio.open(args.source) as source:
    if source.crs.to_epsg() != 4326 or source.count != 3:
        raise ValueError('Expected approved WGS84 three-band true-color source')
    if source.transform.b != 0 or source.transform.d != 0 or source.transform.a <= 0 or source.transform.e >= 0:
        raise ValueError('Rotated/reversed imagery must be reprojected first')
    rgb = source.read(masked=True)
    valid = ~np.any(np.ma.getmaskarray(rgb), axis=0) & np.isfinite(rgb.data).all(axis=0)
    # Sentinel Hub True_color export contains already display-mapped RGB in 0..1.
    # No per-image histogram stretch or invented super-resolution.
    pixels = np.rint(np.clip(np.nan_to_num(rgb.data), 0, 1) * 255).astype('uint8')
    rgba = np.concatenate([pixels, (valid * 255).astype('uint8')[None]], axis=0)
    Image.fromarray(rgba.transpose(1, 2, 0)).save(output / 'suining-true-color.png', optimize=True)
    geod = Geod(ellps='WGS84')
    _, _, dx = geod.inv(117.858766, 33.938816, 117.858766 + source.res[0], 33.938816)
    _, _, dy = geod.inv(117.858766, 33.938816, 117.858766, 33.938816 + source.res[1])
    metadata = {
        'id': 'suining-sentinel2-2026-11-06',
        'url': '/maps/suining-true-color.png',
        'sourceFilename': args.source.name,
        'sourceSha256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
        'imageSha256': hashlib.sha256((output / 'suining-true-color.png').read_bytes()).hexdigest(),
        'crs': 'EPSG:4326', 'boundsDegrees': list(source.bounds),
        'width': source.width, 'height': source.height,
        'pixelMetersAtOrigin': [dx, dy], 'validPixelFraction': float(valid.mean()),
        'credit': '用户提供 · Sentinel-2 L2A / Copernicus · 2026-11-06',
        'role': 'surrounding-imagery-not-surveyed-farm',
        'conversion': 'RGB float32 0..1 clipped and rounded to uint8; no spatial resampling',
        'acceptedUse': '2026-11-13 用户确认仅作周边底图，园区内部由 Three.js 呈现',
    }
(output / 'imagery.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(metadata, ensure_ascii=False, indent=2))
