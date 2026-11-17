# Daylight clouds

`daylight-clouds.png` is an original deterministic procedural RGBA panorama generated
by `scripts/bake-daylight-clouds.py`. No third-party imagery or design reference is
embedded. Regenerate from the project root with Python, NumPy and Pillow; these
tools are not runtime dependencies. Runtime loads only the local PNG.

2048×1024 RGBA: approximately 8 MiB uncompressed base texture. Static coverage and
colour shading are baked once; no volumetric ray marching, extra cloud geometry,
cloud shadows or independent animation loop. The below-horizon half is transparent.
