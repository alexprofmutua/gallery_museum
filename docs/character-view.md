# Visitor character view

Choose Starfish or Blue Whale as your visitor identity. The museum opens in first person, including when you return from the accessible gallery. Use **Show visitor character** in Settings or press **V** to switch to the optional third-person view.

The procedural avatar uses the chosen identity's colors and badge. In a shared visit, the other visitor sees your selected identity.

The chase camera uses a Rapier sphere sweep against the museum's colliders, excluding the visitor's own rigid body. It pulls inward when a wall, ceiling, column, closed door, or furnishing obstructs the view. At very close distances the avatar hides to avoid showing its interior. The view switch is immediate, with no automatic orbit or cinematic motion.

Movement follows camera heading in either view. Doors and memory activation use the physical visitor position, so the offset camera does not change interaction distance. Switching views preserves position, room, and the active visit. Both views share the same collision body.

## Changes

- `VisitorAvatar.tsx`: original stand-in geometry and walking animation.
- `chaseCamera.ts` and `Player.tsx`: camera collision, pose tracking, view selection, and keyboard shortcut.
- `Portal.tsx`: visitor-based proximity.
- The store, Settings, and navigation guide: an accessible toggle on desktop and touchscreens.
- Camera unit tests and avatar browser scenarios: view switching, wall clearance, memory interaction, door traversal, and touch walking.

## Validation limits

The stand-in is deliberately simple. Physical phones and Safari remain unverified. Native pointer lock retains the macOS automation limitation described in the foundation report; mouse drag and keyboard turning are available.

GPU resource counters from Milestone 2 describe that stage's first-person route. Showing an avatar uploads additional, bounded geometry and materials. Lint, strict TypeScript, all 19 unit/component tests, and the production build pass. Three new browser scenarios pass: desktop switching, wall clearance, memory interaction and traversal; touch toggling and walking; and the low-ceiling camera sweep. The six existing first-person/navigation/touch/visual scenarios also pass in the final regression run. One native pointer-lock scenario is explicitly skipped for the existing macOS automation issue. Across the two final browser runs, nine scenarios pass and one is skipped. Screenshots are in `docs/screenshots/third-person-*.png`.
