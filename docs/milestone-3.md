# Milestone 3: interactive memories

## Plan and acceptance

Replace the single hardcoded exhibit with a validated collection that renders at least 30 frames. Keep room navigation and both camera views. Verify correct memory selection, image proportions, readable details, media failure recovery, and configuration-only personalization.

## Implementation

The museum metadata and 30 sample entries now live in `src/content/museum.config.json` and `src/content/memories.json`. They include IDs, ordering, titles, captions, optional dates/stories, alt text, frame dimensions, positions, and wall rotation. All sample art is original SVG illustration; none represents a real relationship event.

The gallery renders the collection with one reusable frame component. Small frames occupy two rows between the columns; the original large frame stays beside the far doorway. The central walking route is unchanged. Images fit inside their mats with their natural proportions, including portrait, square, and landscape sources.

A central exhibit interaction policy intersects the visitor's gaze with frame planes, chooses the nearest hit, and checks physics occlusion. Direct clicks and taps use the same reach and occlusion rules. A nearby frame can be opened with E or the interaction button in either camera view. Longer text, optional dates, and images use accessible HTML dialogs.

Nearby media prefetches within ten metres, and the full active collection loads when the visitor enters the gallery. After leaving, media releases beyond fourteen metres or on room unmount. The separate load/unload distances reduce repeated requests near a boundary. Display textures are capped at 1,024 pixels on their longest side without changing source files. Cancelled loads cannot publish stale textures. Loading, deferred-preview, and unavailable-image states are local to the affected frame.

The 2D collection includes search, an unseen filter, and the same detail content. Viewed progress stores only IDs in this browser, survives reload, and can be reset from settings. Invalid or unknown stored IDs are discarded. No visitor identity, media, or messages are stored in progress.

Content validation failures show a recovery screen instead of leaving an empty app. Setup and personalization instructions are in `docs/content-guide.md`. Deferred room inspiration notes are in `docs/design-direction.md`; no room redesign is included here.

## Verification

Lint, strict TypeScript, 28 unit/component tests, and the production build pass. The full browser regression run completed with 13 passing scenarios and one existing native-pointer-lock skip. The final gallery-entry loading polish also passed all five focused follow-up checks: the repeated-visit route and the four memory scenarios.

In that follow-up, the entrance started at 89 GPU geometries and 72 textures. Counts settled at 89 geometries and 75 textures after the first full return, then stayed there after the second. The three extra textures are the distant rooms' floor cache. This verifies bounded resource counts for those trips, not long-duration memory safety or GPU memory in bytes.

A 90-frame sample in the populated gallery, with 29 loaded artworks and one intentionally failed image, measured about 22.7 FPS and 171 draw calls in Chrome's SwiftShader software renderer. The sanctuary sample was about 32.7 FPS. These development-browser samples do not establish hardware performance or the desktop/mobile FPS targets. Real-device profiling and draw-call batching remain follow-up work.

The production build succeeds with the existing large-chunk warning: the lazy 3D chunk is approximately 3.15 MB minified and 1.08 MB gzipped. The app/content chunk is approximately 97 KB minified. The unit suite covers 30-entry validation, unique media references, placement clearances, exact targeting of every frame, image fitting, media fallback UI, and progress behavior.

The browser checks cover all 30 detail views, rendered proportions, local progress across reload, filtering/reset, nearby prefetching and active-gallery loading, a deliberately failed image request, direct 3D interaction, configuration-error recovery, and phone-sized reading. Screenshots in `docs/screenshots/collection-3d.png`, `collection-desktop.png`, `memory-portrait.png`, `memory-mobile.png`, and `memory-unavailable.png` were inspected. The 3D collection capture includes the deliberate image-failure fixture. Existing navigation and character-view checks remain part of the regression suite.

## Limits and next work

This remains a public-sample prototype. Authentication, private storage, signed delivery, and multiplayer are not implemented. Personal media must wait for Milestone 5 authorization. Physical devices and Safari remain unverified; native pointer lock retains the documented macOS automation skip.

The large 3D bundle warning remains. Frame-time and GPU-resource results describe the tested environment, not all devices. Captures are inspected screenshots, not pixel-diff baselines.

Milestone 4 has not begun. It includes cinematic effects, music, film playback, and the final reveal, with the owner's deferred visual direction available for planning.
