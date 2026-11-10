# Walking performance fix

The default graphics configuration performed extra reflection, blur and shadow passes. Room transitions also changed light counts, forcing new shader variants during movement.

Balanced now caps DPR at 1 and uses the existing environment reflection probe. High retains the live floor reflections and shadow map. A fixed pool of nine spotlights and four point lights changes brightness and position by room, preserving shader variants across doorways. The conservatory accent lights use that pool. The scene-cloning warmup on room changes was replaced with startup-only shader preparation. Photo order, room geometry, media and the faster movement speeds were retained.

Targeted check: installed Chrome, Apple M5, 1440 × 900 CSS pixels with device scale 2. Balanced produced a 1440 × 900 render buffer, approximately 60 FPS in the Gallery wall view, and a 16.8 ms 95th-percentile frame interval during walking. The Gallery view used 43 draw calls and 65,078 triangles. No runtime errors were recorded.

The first targeted walk with the lighter default but changing light counts had an 867 ms worst frame. After fixing light counts, the next run's worst frame was 167 ms, with five frames over 33.3 ms out of 347. These are individual local runs, not a controlled performance guarantee. Brief loading hitches remain; physical phones and other GPUs have not been checked.

Raw result: `.local-museum/review/lag-fix.json`.
