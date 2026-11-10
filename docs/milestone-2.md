# Milestone 2: museum architecture

## Plan and scope

Extend the existing gallery into five continuous spaces, keep the same capsule controller and sample-memory interaction, and test the complete route in both directions. The entrance becomes the spawn. The existing artwork moves to the left of the gallery exit so the central path stays clear.

The main changes are `src/content/layout.ts`, shared architecture in `RoomShell.tsx`, room furnishings in `Furnishings.tsx`, the pocket-door controller in `Portal.tsx`, and room tracking in the player/store/UI. No new dependencies are required.

## Design decisions

The route runs along the Z axis from the entrance at Z=20 to the sanctuary at Z=-54. Adjacent floors meet at exact coordinates. Room configuration validates positive dimensions, unique IDs, and matching thresholds. The corridor narrows to six metres; door openings remain 3.6 metres wide.

Doors trigger within four metres of a visitor on the central approach. Their leaves slide inside wall cavities over 1.2 seconds. The doorway collider stays in place until the leaves are fully clear. Once opened, doors remain open until the 3D world is reloaded. This deliberate one-way state transition prevents repeated animations and closing collisions. Reduced-motion mode opens them immediately.

Only the current room and its neighbours render their decorative geometry. Floor and wall colliders remain mounted across the museum. Shared boxes reuse geometry and materials. Generated label textures are disposed when their room visuals unmount; floor textures live with their room shell.

The cinema has seating and a screen with a visible note that playback arrives in Milestone 4. The sanctuary has flowers, a central display, glass roof, and static stars. Film playback, magic effects, letters, and reveal sequences are outside this milestone.

## Verification

Lint, strict TypeScript, 16 unit/component tests, and the production build pass. Browser automation walks through all five rooms and every doorway in both directions, checks wall and corridor collision, and preserves the memory interaction and touch controls. Six browser scenarios pass across the core and visual-check runs; the native pointer-lock test retains its explicit macOS automation skip. The visual journey also exercises reduced-motion doors and switching from the sanctuary to the 2D gallery.

The route test makes two full round trips. GPU resource counters start at 31 geometries and 14 textures, then settle at 31 geometries and 17 textures after first visits upload the three distant floor textures. They remain at 31 geometries and 17 textures after the second lap. This checks bounded GPU resource counts for these visits; it does not establish long-duration memory safety.

The final 120-frame requestAnimationFrame sample in the sanctuary measured about 33.8 FPS, a 33.4 ms 95th-percentile interval, and 42 draw calls. Local Chrome uses SwiftShader software rendering. Earlier samples varied substantially, and this result does not establish performance on a physical GPU or phone. The final lighting setup uses one local light per rendered room and avoids dynamic shadow maps. Screen-side columns were removed from the cinema after screenshot review showed that they obstructed the screen.

Captured views are under `docs/screenshots/`: entrance desktop/mobile, gallery, corridor, cinema, Forever Room, and the memory overlay. Additional cinema-screen and sanctuary-roof views verify the side-facing screen and overhead architecture. These are inspected captures, not automated pixel-diff baselines.

The 3D chunk remains approximately 3.15 MB minified (1.08 MB gzipped); the large-chunk build warning remains. No deployment or remote service was created.

## Remaining limits

The room shapes and furnishings are procedural prototype assets. More detailed custom models and material work can improve realism later. The existing large 3D bundle warning remains. No personal content, authentication, private storage, or multiplayer has been added. Native pointer-lock validation remains subject to the documented macOS automation limitation from Milestone 1; mouse drag and keyboard turning remain available.

Physical-phone, Safari, and long-duration GPU checks remain unverified. Milestone 3 has not begun. Its scope is configurable multi-photo exhibits, placement, media loading states, and richer memory content.
