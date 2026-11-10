# Alex character: studio and local museum integration

Alex approved the stylized draft and the taper fade. The approved character now replaces the Blue Whale visitor in **personal mode**. Select Blue Whale, enter the museum and press **V**, or use Settings → Show visitor character. The Starfish visitor also has her approved personal character; the public sample museum retains its existing visuals.

- Local museum: http://127.0.0.1:5175/
- Character studio: http://127.0.0.1:5175/character-preview.html
- Start server: `npm run dev:personal`.

## Runtime

`PersonalizedVisitorAvatar.tsx` renders an independently cloned skeleton and animation mixer. The existing Player capsule, camera, input, collisions and interactions remain authoritative. The GLB faces +Z, so a local half-turn aligns it with the controller's -Z forward direction. Facing changes use wrapped angle damping. Idle, Walk, Run and Sprint crossfade; moving clip playback follows measured controller speed. Turning follows the controller rather than playing the studio's full-rotation Turn clip. Each effect setup creates fresh animation bindings, including React Strict Mode replay. Geometry and materials stay shared across visitors.

The character loads only when needed in third-person personal mode. Its isolated Suspense boundary does not suspend the physics world. Personal photographs and derived likeness assets remain in `.local-museum`; they are not added to the public sample build.

- Runtime: `.local-museum/characters/alex.glb`, 48,818 triangles, 2,860,844 bytes.
- Full studio asset: approximately 103,000 triangles. Garment tessellation is reduced for runtime while retaining the face and taper geometry.
- Studio source: `.local-museum/character-preview/alex-preview.blend`.
- Rebuild studio: Blender 4.5 LTS, `--background --python scripts/character/build_preview.py`.
- Export runtime: Blender 4.5 LTS, `--background --python scripts/character/export_runtime.py`.
- Taper authoring: `scripts/character/taper_hair.py`; scalp topology, welded seam, textured short top and vertex-colour stubble/fade blend.

## Source and limitations

Base: Quaternius Universal Base Characters, Superhero Male, retrieved from https://raw.githubusercontent.com/programasweights/avatar/main/public/assets/character.glb. Original pack: https://quaternius.com/packs/universalbasecharacters.html. Distributor attribution and its included CC0 license are preserved in `.local-museum/character-preview/source/`; the license is also beside the runtime asset.

This is an approved artistic approximation, not a reconstructed or objectively verified facial likeness. Side and rear details are estimates because consistent photographic coverage was missing. The base supplies authored anatomy, modeled hands, fingers, face, skin weights and skeleton. Garments/hair derive from that mesh; motions are custom baked skeleton animation. Fabric microtexture used in Blender studio renders is not baked into runtime textures. Clothing seams and gait still have scope for refinement; perfect foot planting is not established. Reference photos remained local.

## Verification

TypeScript, ESLint, 56 unit tests and the production build pass. Existing bundle-size warnings remain. Chrome smoke checks verified GLB loading, Idle/Run/Sprint, movement, gallery doorway crossing, repeated first/third-person switches and a mobile viewport without page errors. Front-facing and moving screenshots are stored in the private character-preview folder.

Saved regression test: `e2e/personal-avatar.spec.ts`, enabled with `PERSONAL_PREVIEW=1` against the personal server. It covers movement animation and view remounts, including the mixer cleanup regression.

Short timing comparison at 1440×1000 on this local Chrome session: first-person 30.0 FPS, character view 30.2 FPS; p95 frame intervals both 33.4 ms. Gallery character-view smoke sample was also about 30 FPS. These are short local browser samples, not evidence of 60 FPS across rooms, hardware or sustained movement. No 60 FPS claim is made.
