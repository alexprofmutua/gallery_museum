# Forever Room review

From the cinema, continue through the last doorway. The conservatory has a brass-framed glass vault, rose planters, lanterns, and a starfield. Three inscriptions from *The Originals* sit along the rear wall. Their excerpts and sources are listed in the [content guide](content-guide.md#forever-room).

Walk to the marble pedestal. Press **E** or tap **Open Letter** to lift the envelope flap and read the configured letter. Close it with Escape or **Return to the museum**. With reduced motion, the letter opens immediately. The accessible gallery has separate controls for the letter and the inscriptions.

This review covers the room and letter. The constellation, reveal controls, and Garden of Promises are the next milestone.

| Capture | Desktop | Phone viewport |
| --- | --- | --- |
| Previous room | [1440 × 1000](screenshots/forever-conservatory/forever-before-desktop.png) | [390 × 844](screenshots/forever-conservatory/forever-before-mobile.png) |
| Conservatory | [1440 × 1000](screenshots/forever-conservatory/forever-conservatory-desktop.png) | [390 × 844](screenshots/forever-conservatory/forever-conservatory-mobile.png) |
| Open letter | [1440 × 1000](screenshots/forever-conservatory/forever-letter-desktop.png) | [390 × 844](screenshots/forever-conservatory/forever-letter-mobile.png) |

## Local performance

Chrome used the SwiftShader software renderer and device scale factor 1. Each run sampled 50 animation frames after 15 warmup frames, facing the rear wall from about four metres in front of the pedestal. The before and after camera positions are approximate.

| Viewport | Previous p95 frame interval | Conservatory p95 | Previous draw calls | Conservatory draw calls |
| --- | ---: | ---: | ---: | ---: |
| 1440 × 1000 | 33.4 ms | 50.1 ms | 49 | 33 |
| 390 × 844 | 16.8 ms | 33.4 ms | 29 | 33 |

Chrome reported 38 geometries and 25 textures on the first desktop visit and after each of two return trips from the cinema. The new room uses one transparent pass for the glass and shares meshes across the planters. Frame intervals still rose in these samples. Hardware acceleration and physical phones remain untested.

Lint, TypeScript, all 37 unit tests, and the production build passed. The focused Chrome rerun passed the desktop letter and collision test and the touch test with reduced motion. The broader run passed 19 cases. Its two letter tests timed out during the long walk and passed after the checkpoints were added. The cinema test stopped at native fullscreen when Chrome left the film in the inline player. The native pointer-lock case was skipped.
