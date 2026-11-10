# Milestone 1 validation

## Starting point and plan

The project directory was empty: no source, assets, dependencies, tests, or build configuration. The attached brief requested Milestone 1 only.

The implementation creates a Vite/React shell, a validated content module, a central interaction store, a procedural room, a Rapier capsule controller, accessible overlays, and separate touch inputs. One complete walking-and-memory interaction is the acceptance target. The remaining rooms and backend are deferred.

## Implemented

- One enclosed 14 × 20 m gallery with a tiled stone floor, columns, a coffered ceiling, warm architectural lighting, and a framed original placeholder illustration.
- Desktop camera movement, pointer lock with Escape release, keyboard turning, normalized diagonal walking, and a 1.65 m eye height.
- Fixed-step physics with colliders for four walls, floor, columns, bench, and exhibit plinth. A reset action recovers the initial spawn.
- A touch movement joystick, drag-to-look region, and a tap interaction prompt.
- A distance-and-facing check owned by a central interaction manager. E, click, or tap opens the appropriate sample memory. The modal stops walking and restores navigation after closing.
- Keyboard-accessible native dialogs, responsive content, a 2D gallery, WebGL failure fallback, image failure handling, and scene loading/error states.
- Runtime content validation, pinned dependencies with a lockfile, development scripts, tests, build configuration, and owner instructions.

## Verification

Lint, strict TypeScript checks, 10 unit/component tests, and the production build pass. The final Playwright run completed with four passing scenarios and one explicit skip:

| Check | Result |
| --- | --- |
| Desktop movement, interaction, overlay pause, reset, and 2D fallback | Pass |
| Dispatched touch joystick and touch camera gestures | Pass |
| All four wall boundaries, floor height, and safe reload spawn | Pass |
| Mouse drag with pointer lock deliberately unavailable | Pass |
| Native pointer lock, mouse look, and Escape release | Skipped for macOS `WrongDocumentError`; manual check pending |

The desktop journey also asserts that no uncaught page exceptions occur. The build succeeds with the large-chunk warning described below. Screenshots in `docs/screenshots/` capture the desktop room, memory overlay, and mobile room. They were visually inspected for architectural gaps, content fit, and responsive layout.

The native pointer-lock test encountered `WrongDocumentError` in automated macOS Chrome. This matches a [documented Playwright focus issue](https://github.com/microsoft/playwright/issues/20956); it is not evidence that native capture works. The test now reports a skip only for that diagnostic. Manually verify mouse capture, relative movement, Escape release, and reacquisition in a foreground browser. A tested drag-to-look fallback keeps the desktop camera usable when capture fails. Milestone 1 acceptance remains conditional on this manual input check.

## Limits and follow-up

This is a foundation prototype. The displayed image is a labeled stand-in illustration, not a personal photograph. Only one configured exhibit is rendered; the content schema accepts 30 entries, but automatic placement and multiple rendered memories belong to Milestone 3.

The 3D chunk is approximately 3.14 MB minified and 1.08 MB gzipped, including the physics engine. Vite reports a large-chunk warning. It loads separately from the application shell. No network-speed or device FPS benchmarks have been established, and no 60/30 FPS guarantee is made.

Chrome software WebGL and emulated touch input do not establish physical-phone, Safari, thermal, or long-duration GPU behavior. Real-device checks remain necessary. Screenshots are captured evidence, not an automated visual regression baseline. Reduced-motion styling removes UI transitions; there are no cinematic effects in this milestone.

Authentication, invitation redemption, storage policies, multiplayer, persistent progress, audio, video, cinematic effects, and the other four rooms are absent. All assets are public to anyone able to reach the server. Keep personal content out of this build.

No hosted service was configured and nothing was deployed. Milestone 2 has not begun. Its next task is connected room geometry and reliable doors, followed by asset and performance measurement.
