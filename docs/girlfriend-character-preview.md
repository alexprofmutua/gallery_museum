# Starfish character preview

Approved and integrated in the local personal museum as the Starfish visitor. Choose Starfish before entering or in Settings, then press V to see her.

Open http://127.0.0.1:5175/character-preview.html?character=starfish with `npm run dev:personal` running. The same studio controls support front/back/side/face views and Idle, Walk, Run, Sprint and Turn. Alex's existing studio and integrated character remain available.

The authored female humanoid is Quaternius's Superhero Female from Universal Base Characters Standard, with the included CC0 license preserved under `.local-museum/girlfriend-preview/source/License_Standard.txt`. Official source: https://quaternius.itch.io/universal-base-characters. The downloaded mirror and file hashes are in `source/provenance.json`.

Local reference portraits (`graduate-dsc-4003`, `photo-23`, `photo-01`) guide warm brown skin, softer cheeks/jaw, long dark braids, small gold earrings and a pendant. The coral cotton top and ivory trousers are an initial styling choice that follows the existing Starfish palette. Face and rear/profile details remain stylized estimates, not a facial reconstruction or confirmed likeness. No photographs were sent to an external service.

Build with Blender 4.5 LTS: `--background --python scripts/character/build_girlfriend_preview.py`. It imports the authored female body, eyes, brows and rig, fits clothes from the source topology, constructs braided hair, and reuses the existing locally authored motion actions by matching humanoid bone names. Front/back/side and motion screenshots live in the private preview folder. The studio asset is private and excluded from the public sample build.

The approved studio GLB is copied to `.local-museum/characters/starfish.glb`, with its CC0 license beside it. The shared personalized renderer selects the model by visitor identity, clones each skeleton independently and crossfades movement clips using controller speed. Identity switches remount the visual rig; the Player capsule, camera and controls are unchanged. The public sample museum does not include either personal likeness asset. Playback does not establish perfect foot planting or natural movement.

## Verification of this draft

- TypeScript, ESLint and production museum build passed; existing bundle-size warnings remain.
- Chrome loaded all five motion clips with no page errors. Front, back, both sides, face, all motion states and a mobile viewport were captured and reviewed.
- Final studio GLB: 70,081 triangles; 5,846,524 bytes. All five clips have 195 bone transform channels. No primitive body parts are used.
- A short isolated studio sample measured approximately 60 FPS (p95 16.8 ms). This isolated sample is not an in-museum performance benchmark; no 60 FPS claim is made for the museum.
- This remains a stylized approximation. Neckline/clothing details, gait and facial resemblance may need further revision based on feedback; perfect foot planting is not established.

Integration verification: 56 unit tests, type checking, ESLint and the production build pass. Both personal-avatar browser tests pass, covering Starfish and Blue Whale movement, repeated view remounts and switching identities. Her in-museum screenshot is `.local-museum/girlfriend-preview/museum-starfish.png`.
