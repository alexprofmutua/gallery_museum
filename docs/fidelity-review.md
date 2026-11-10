# Museum rendering review: 8 November 2026

Later performance fix: the measurements below describe the earlier graphics configuration. Balanced now caps DPR at 1, leaves live reflections and real-time shadows to High, and keeps light counts fixed across rooms. See `docs/lag-fix.md` for the newer targeted check.

## Reference and audit

Reviewed the supplied 17.7-second recording, including nine extracted frames. Its useful cues were warm reflected light on timber, a restrained dark ceiling, cream wall panels, generous viewing space, and soft lighting around exhibits. The recording is a visual reference; no FPS claim about that recording was inferred from its capture rate.

The existing application already used React Three Fiber, Three.js and fixed-step Rapier physics. Its strong points were instanced columns, merged corridor details, adjacent-room culling, distance-loaded photographs, and explicit media playback states. The main weaknesses were the lack of reflection lighting, sharp box edges, one plaster finish across dissimilar trim, uniformly matte joinery, limited shadows, and abrupt walking velocity.

The five room footprints, door openings, photo positions and approved numbering were retained. No dependencies or external media services were added. Personal media remains local.

## Implementation

The Gallery established the first benchmark. Shared improvements then extended through all five rooms:

- One prefiltered indoor environment probe supplies reflected light to physical materials. ACES tone mapping and sRGB output are explicit. Cinema illumination dims during a screening.
- The active Entrance or Gallery floor renders a blurred reflection of the actual scene. Medium uses a 256-pixel target; High uses 512. Adjacent rooms and Low use the ordinary physical finish. All reflection and blur targets have explicit disposal, including quality changes and room exits.
- Architectural moldings, display cabinets, cinema joinery and conservatory framing now have small bevels measured in scene metres. Static surfaces are merged by finish, with separate plaster, wood, stone and brass response. Shapes and furniture materials are cached.
- Gallery coffers have a dark ceiling and walnut rails with bronze details. Frame profiles have smoother bevels. Glass cases use reflected highlights in place of white wireframe outlines and have brass feet.
- Corridor arch profiles and relief details have beveled edges. Their brass is separated from plaster. Cinema upholstery remains instanced; rigid joinery receives the shared edge treatment. Conservatory framing uses the same finish system and flowers have smoother geometry.
- One directional shadow map follows a snapped local volume with a fixed direction within each room. Medium uses 1024 pixels; High uses 2048. There is no shadow map per photograph.
- Walking uses short exponential acceleration and faster braking. Disabled controls stop immediately. Camera translation follows Rapier's interpolated presentation pose; mouse look remains direct. Existing camera collision constraints remain in place.
- Photographs preload within 20 metres and release beyond 28 metres. Canvas resampling is queued one image per animation frame, with cancellation when a request is replaced. Adjacent-room shader variants are compiled ahead of time with matching light counts; a shader compiled for Entrance lighting does not warm the different Gallery variant.
- Resolution changes require three sustained slow sampling windows; recovery requires five fast windows. The controller has a warmup period, ignores hidden/long-pause samples, and respects quality limits.

Photographs retain their unlit, colour-faithful material so changes to architectural lighting cannot darken a face or create a bright spotlight over a photograph. The existing entrance animation, music, films, letter, accessibility UI and visitor systems were preserved.

## Measurement method

The private capture folder is `.local-museum/review/fidelity/`. It contains baseline and final JSON, before/after PNGs for all five rooms, a wide Gallery view, a higher-resolution Gallery view, phone-sized captures, and the quality-cycle resource report.

Measurements use installed Chrome with the actual Apple M5 Metal renderer, with no forced software-rendering flags. The default comparison is 1280 × 800 CSS pixels, device scale 1, Medium, after 30 warmup frames, followed by 180 requestAnimationFrame intervals per stationary view. Views use the same walking route and headings; exact positions are recorded in JSON and can differ slightly after braking.

The baseline had one main rendering pass. Final draw-call and triangle figures include reflection, blur and shadow passes by temporarily disabling Three's automatic counter reset and resetting counters once per sampled frame. They describe total rendering work across all passes. FPS is wall-clock browser frame pacing, not a GPU timer query. A screen-synchronised 60 FPS result does not establish spare GPU capacity or a speed improvement.

Scene texture-byte estimates are approximate RGBA-plus-mipmap estimates from referenced images. They exclude framebuffer, environment-probe, depth, driver and decoder allocations and must not be called measured VRAM. Resource counts are Three renderer counters.

To reproduce after starting `npm run dev:personal`, run `node scripts/profile-personal-museum.mjs`. `CHROME_PATH` and `PREVIEW_URL` can override the local defaults. The profiler is for this personal museum layout; it writes private captures into the ignored local folder.

## Measured results

| View | Before FPS | Final FPS | Final p95 ms | Total calls | Total triangles | Textures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| entrance | 60.0 | 60.1 | 16.7 | 356 | 85,483 | 27 |
| gallery | 60.0 | 60.1 | 16.8 | 180 | 211,115 | 137 |
| gallery-high-2880x1620 | n/a | 60.2 | 16.8 | 445 | 314,521 | 137 |
| corridor | 60.1 | 60.1 | 16.8 | 95 | 186,006 | 137 |
| cinema | 60.0 | 60.0 | 16.8 | 77 | 405,386 | 53 |
| forever | 60.0 | 60.1 | 16.7 | 70 | 328,309 | 33 |

The high-resolution Gallery view rendered at [2880, 1620] pixels, DPR 1.5. It uses a wider heading than the Medium wall view, so its geometry/call counts are not a direct quality-only comparison.

Local startup to the first player-state signal was 1531 ms. This is not a measurement of full asset readiness or internet loading.

| Walking segment destination Z | Mean frame ms | p95 ms | Worst frame ms | Frames over 33.3 ms |
| --- | ---: | ---: | ---: | ---: |
| -14 | 17.75 | 16.8 | 350.0 | 4 / 517 |
| -38 | 17.09 | 16.8 | 133.3 | 2 / 377 |
| -78 | 17.12 | 16.7 | 283.3 | 1 / 618 |
| -95.8 | 16.65 | 16.7 | 16.8 | 0 / 293 |
| 20 | 17.06 | 16.8 | 200.0 | 7 / 1745 |

**Remaining limitation:** steady views meet the tested 60 FPS target, but walking is not free of stalls. The final run included a 350 ms frame on first Gallery entry, a 283 ms frame toward the Cinema, and a 200 ms frame during the complete return route. Image preparation and shader warmup reduced the worst observed first-entry pause from an earlier 933 ms run, but these single local runs are not a controlled benchmark of improvement. Cold loading/compilation still needs work before claiming uniformly smooth navigation.

The letter opened successfully, and a continuous walk from the Forever Room back to the Grand Entrance passed through every doorway. No page or console errors were recorded in the final profile.

## Comparison captures

The HTML comparison keeps each room’s before and after image together. All images remain in the ignored personal-media folder:

[Open before/after comparison](../.local-museum/review/fidelity/comparison.html)

[Gallery before/after image](../.local-museum/review/fidelity/comparison-gallery.png) · [Gallery overview](../.local-museum/review/fidelity/after/gallery-wide.png) · [Touch viewport](../.local-museum/review/fidelity/after/mobile-touch.png)

## Validation and limits

- TypeScript, lint, 56 unit/component tests and the production sample build passed.
- All 42 photographs decoded in the accessible collection. Gallery IDs and display numbers matched the saved approved mapping; all seven graduate photographs remain in the corridor.
- All 35 Gallery and seven graduate picture-light fixtures survived quality changes.
- Music entry, loop, volume, mute/resume, film pause/resume and a manually started cinema film passed in installed Chrome. No runtime errors were observed in that check.
- Four Low → Medium → High cycles returned to 69 geometries / 22 textures on Low and 70 geometries / 27 textures on Medium and High in the Entrance. Counts did not grow across cycles.
- A 390 × 844 browser layout was captured. Emulated touch events moved the joystick forward and confirmed that braking stops without continuing drift. This is not physical phone or iOS Safari validation.
- Hosted authentication, a live two-person visit, native fullscreen and real-device touch/pointer lock were not retested for this rendering change.

The production build retains its existing large 3D chunk warning (about 3.23 MB, 1.11 MB gzip) and upstream Zod annotation warnings. These do not fail the build. Cold internet loading and weaker GPUs still need separate device testing; local M5 results cannot establish their performance.
