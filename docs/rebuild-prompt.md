# Our Forever Museum: complete rebuild prompt

Copy the specification below into another coding AI. Supply the catalog and media files separately. A local file path in this document does not give another AI access to the file.

## Build request

Build Our Forever Museum, a personal anniversary website where two people can walk through a 3D museum of their photographs and films. Deliver a working application with real movement, collisions, media playback, and an accessible HTML gallery. Use the supplied people and photographs exactly as provided. Never generate replacement faces or invent personal memories.

The current personal collection has 42 photographs: 35 numbered gallery photos and seven graduation portraits. It also has ten films, a looping entrance animation, background music, three inscriptions, and a letter. Reproduce the features and layout below. Keep the architectural walls, photo order, and framing proportions fixed unless I request a change.

If the existing repository is supplied, inspect it first and preserve working features. If starting from scratch, use this specification and the supplied asset manifest as the source of truth. List missing assets clearly and use labeled placeholders only where files are unavailable. Do not silently omit photographs.

## Stack and project structure

The reference implementation uses React 19.1.1, TypeScript 5.9.3, Vite 7.3.7, Three.js 0.180.0, React Three Fiber 9.4.0, Drei 10.7.7, React Three Rapier 2.2.0, Zustand 5.0.8, Zod 4.6.7, and Lucide React. Optional private access uses Supabase JS 2.119.0. Testing uses Vitest, Testing Library, and Playwright. Use the supplied lockfile when available.

Keep architecture, interactions, UI, and content separate. The reference folders are `src/app`, `src/components/museum`, `src/components/ui`, `src/engine`, `src/content`, `src/stores`, `src/private`, `src/tests`, `e2e`, and `supabase`.

Use typed content schemas. Photographs must be replaceable through the catalog without editing scene components. Preserve stable image IDs when changing display order, so viewed progress remains attached to the correct memory.

## Five connected spaces

Use one metre per scene unit. Visitors start at approximately `(0, 1.65, 20)` at eye level and travel toward decreasing Z. The current personal layout is:

| Space | Floor Z bounds | Width | Visual character |
| --- | --- | --- | --- |
| Grand Entrance | 10 to 24 | 14 m | Cream stone, arched doorway, marble floor, glazed green urns |
| Gallery of Us | -34 to 10 | 14 m | 44 m long; walnut parquet, cream wall panels, fluted marble columns, dark wood frames |
| Living Portrait Corridor | -70 to -34 | 6 m | Repeated cream and brass arches, muted plum walls, pale stone floor |
| Our Little Cinema | -86 to -70 | 14 m | Burgundy acoustic surfaces, walnut, brass, carpet, a star ceiling |
| Forever Room | -102 to -86 | 14 m | Glass conservatory, dark blue night garden, roses, marble letter pedestal |

The gallery ceiling is approximately 6 m high; the cinema is 5 m. The corridor vault springs at 2.56 m with a 3 m radius. The conservatory has eaves near 4.85 m and an arched glass roof rising another 3.65 m. Use the supplied scene files for exact decorative profiles.

Connect the rooms with proximity-triggered pocket doors. Rendered door openings and physics openings must agree. The entrance doorway has a half-width of 1.8 m; the internal doors have a half-width of 2.6 m. A seated cinema visitor must be able to stand and walk back through every doorway without an invisible obstruction. Keep end-wall photographs and decorative trim outside the door openings.

## Entrance

Show the museum name and configured dedication, with character selection before entry. Keep the design personal and restrained. Use warm cream plaster, marble bases, glazed urns, and dark walnut doors with brass details.

A supplied animated memory belongs on the entrance wall. The original GIF has a browser-compatible muted looping MP4 and a poster image. Preserve its portrait proportions and show the poster when motion is reduced or playback is unavailable. Pause it while its room is inactive or the document is hidden. No lamp, ornament, or door frame may cover the people in this animation.

## Photographs and exact numbering

Place photographs 1 through 35 around one enlarged gallery. Facing into the gallery from the entrance, number 1 starts on the left. Follow the left wall, cross the far wall at numbers 17 and 18, return along the right wall, and finish with number 35 beside the other side of the entrance. The A identifiers below are selection references from the contact sheets, not final frame numbers.

The user originally skipped 15, then explicitly approved consecutive numbering. A06 is number 15 and A31 is number 35. Use the exact mapping in the inventory appended below.

Keep the photograph files, image proportions, and complete subjects. Adapt the frame to the photograph. Use a narrow, consistent mat instead of large empty areas around the image. Several feature portraits and the collage are about 3.4 m tall. Wide photographs use wide frames, with a maximum width around 3.16 m in a side-wall bay and 3.5 m beside a doorway. Smaller paired frames must still be comfortably readable.

Mount number badges below each frame. Numbers need their own contrasting dark plaque and large cream type, separate from the title. Keep plaques in front of decorative trim so a molding cannot cross a number. The numbered gallery and accessible cards must agree.

Each frame has a small brass picture lamp above it. Instance the lamp housings and lenses instead of adding a separate shadow-casting light for every photograph. Keep photographic color and exposure consistent between room light pools. The reference uses an sRGB photo texture on a neutral, non-tone-mapped print surface; the mat, frame, and architecture remain physically lit. A portrait between two brighter bays must not become dark simply because no room spotlight reaches it.

## Cases, seating, and circulation

Keep exactly five glass display cases with symbolic keepsakes: a ticket stub, a kept flower, a brass key, a small camera, and a pocket watch. Spread them across the gallery rather than clustering them at the entrance.

In the reference layout their X coordinates alternate between -2.3 m and +2.3 m. Their Z positions are 15%, 32%, 49%, 66%, and 83% of the gallery length from the entrance. Each case has a fixed collider matching its base, approximately 2.12 m wide and 1.12 m deep. Keep the objects visible through restrained glass materials.

Provide two seating pockets with walnut frames, sage fabric cushions, back cushions, armrests, and fixed collision bodies. Each pocket has two padded seats. One is near `(2.65, 0, -13.98)` and faces the larger photographs on the left wall. The other is near `(-2.65, 0, -22.56)` and angles toward the large photographs on the right wall. These are gallery furnishings; the cinema has its own separate seated playback interaction.

Preserve at least two metres of clear viewing space along the photo walls, including column pinch points. Maintain a continuous central aisle and clear areas near both doors. Check rotated seating footprints as well as case footprints. Furnishings must neither overlap nor trap a visitor. Contact shadows must follow the relocated furnishings; remove old shadow patches at previous furniture positions.

Use warm pools of light for the arrival, central displays, and quieter rear area. The picture lamps provide consistent photo presentation while the room lights provide atmosphere. Keep the existing wall materials and photograph placements.

## The Graduate

Give the supplied graduation portraits a dedicated wall along the right side of the corridor. Keep them together, separate from gallery numbers 1 through 35. Use a heading reading THE GRADUATE and frame labels G01 through G07.

There are eight submitted files but seven unique photographs: DSC_4078.jpg was attached twice with identical bytes. Show that photograph once and retain a duplicate record in the import inventory. Include every other submitted image.

Use one large portrait per wall bay, approximately 2.45 m high, with the native image aspect ratio and narrow mat. The reference positions are X = 2.84 m, Y = 2.17 m, and Z = -38, -42, -46, -50, -54, -58, and -62. Rotate them toward the hallway. Keep lamps and columns clear of the pictures. Each portrait gets a picture lamp and an accessible detail view.

The catalog keeps global display orders 36 through 42 for these records, with `section: "graduation"` and `sectionOrder` 1 through 7. Render the section labels G01 through G07 rather than renumbering the original collection.

## Cinema

Keep all ten supplied films and their posters. Convert incompatible MOV files to browser-playable files without reducing a long film to a sample excerpt. Preserve portrait and landscape video proportions.

The cinema screen is on the left wall. The projection area is 8 m wide by 4.5 m high. Fit the full video into that area with black bars when necessary. Never stretch portrait video across a landscape screen or crop faces to fill it. Use a dark idle screen with the cinema name and a film-selection hint.

Place eight padded seats in two columns and four rows on the opposite side. Show E to sit, or the touch equivalent, only when the visitor is within about 1.65 m of a seat. Do not show the sit prompt everywhere in the cinema.

Sitting opens a scrollable film picker. Browsing the picker must not preload or play every film. Selecting a film exposes Play, Pause, seeking, mute, captions, fullscreen, Back to films, and Stand up. Use one registered HTML video element as the projection texture source. Support native fullscreen where available and a usable inline fallback. Portrait phone layouts must preserve the screen and leave room for controls and captions.

Stand up pauses the film, releases its active texture/media registration, closes the screening UI, and restores walking. Prevent a cinema film from continuing invisibly after exit. Empty caption placeholders are not real subtitles; never claim they are.

## Background music

Use the supplied MP3 of Ordinary by Alex Warren, served in the personal catalog as `/media/ordinary-alex-warren.mp3`. Do not substitute a different song or transcribe its lyrics.

Start the track after the visitor clicks Enter the museum or enters the accessible collection. Use that user gesture to satisfy browser playback rules. Loop it at a moderate initial volume; the current setting is 35%. Keep one audio instance per visit.

M toggles music. Settings has a music checkbox and volume slider. An explicit mute must survive later switches between 2D and 3D during the visit. Pause music for cinema playback and moving-portrait playback, then resume the same track position if the visitor had music enabled. Clean up audio on unmount. The public sample demo retains its existing opt-in music behavior.

## Forever Room

Build a glass conservatory with brass structure, a night sky, restrained stars and fireflies, ivory and blush roses, leaves and stems, and stone planters. Keep the garden outside the clear walking route. Support reduced motion.

Render the enclosing night-sky mesh only while the visitor is in the Forever Room. It must not cover the cinema doorway or create a blue wall in another room.

Place a sealed envelope on a marble pedestal. Open the letter only after an intentional E press or touch action within about 2.5 m. Animate the flap for approximately 520 ms, then show the readable HTML letter. Reduced motion opens it immediately. Closing the letter restores walking.

Use the configured letter text. The current letter is a provisional short message titled For all the days still to come; replace it only when I supply my personal text. Do not invent relationship history, names, dates, or a proposal.

Retain these three configured inscriptions and their credits:

- "Always and forever." The Mikaelson family, The Originals.
- "I do love you, you know." Klaus to Camille, No More Heartbreaks.
- "love of all my lives" Marcel to Rebekah, Where You Left Your Heart.

A constellation reveal and a Garden of Promises were deferred. They are future ideas, not implemented requirements for this rebuild.

## Movement, characters, and controls

Use a Rapier capsule body with fixed-step physics and collisions against walls, columns, furniture, and the pedestal. Walking follows camera yaw and diagonal movement is normalized. Start in first person with an eye height near 1.65 m.

Desktop controls are W/A/S/D for movement, Shift for faster movement, mouse capture or drag to look, left/right arrows to turn, E to interact, Escape to release the mouse or close dialogs, V to change visitor view, and M for music. Clear held controls after focus loss and while entering modal flows.

On touchscreens, use a left joystick, a right-side look area, and contextual action buttons. Keep film controls and the letter prompt away from touch controls and safe-area insets.

Offer two visitor identities, Starfish and Blue Whale, with character selection at entry and in Settings. The current visual avatars are procedural placeholders. Support first-person and optional third-person views. The chase camera must shorten its distance near walls instead of passing through them.

Show the current room and a five-room route indicator. Text needs a readable background over bright photographs and films. Settings includes position reset, character/view selection, graphics quality, accessible mode, music controls, and optional shared-visit controls.

## Accessible collection and content contract

Provide a complete HTML alternative with the same 42 photos, titles, labels, captions, and available dates. Include search, an unseen-only filter, viewed indicators, and readable image detail dialogs. Offer films, the entrance animation, the letter, and the inscriptions through HTML. Use keyboard focus management, Escape dismissal, readable errors, and image-loading states. Keep viewed progress by stable image ID.

Each memory record includes `id`, `roomId`, `title`, `caption`, `story`, `alt`, optional `date`, `image`, unique positive `displayOrder`, `placeholder`, a 3D `position`, `rotationY`, `frame.width`, `frame.height`, and `activationRadius`. Graduation records also include their section and section order. Validate IDs, local asset paths, dimensions, dates, placement boundaries, and uniqueness before rendering.

Keep source files intact. Prepare optimized display copies of JPEG/HEIC images and browser-compatible video copies. Check exact duplicates with file hashes. Preserve intentionally repeated existing gallery entries and the approved numbering. The supplied catalog is authoritative for the current photo positions, descriptions, movie files, entrance animation, music, and letter.

## Local, sample, and private modes

The personal preview is local-only. Keep its catalog and assets under an ignored `.local-museum/` directory. `npm run dev:personal` serves that directory on `127.0.0.1:5175`. Use same-origin resource protection and deny source-filesystem access to private directories and environment files. A normal production build uses public sample assets instead of copying personal media into the bundle. Reject a personal-mode production build.

The reference public demo has 30 sample memories and three sample films. It is a separate catalog, not evidence that the personal photographs are missing.

The repository also contains optional Supabase private access and two-person visit support. Recreate that code path if the full repository feature set is requested. Use email-code sign-in, two authorized visitor seats, membership checks before catalog/media access, private storage, short-lived signed media URLs, server-side credentials, and private Realtime channels. A shared link does not bypass sign-in. Validate and smooth bounded visitor pose messages; disconnect presence on exit and handle reconnection. Do not store movement packets in the database.

The existing private-mode checks used local fixtures. A real hosted deployment, email delivery, access revocation behavior, and two-device operation require separate live verification. Do not claim those are complete because the frontend builds.

## Cinema library and playback overlay

Use a dark, scrollable poster-card grid with three columns on desktop and two on phones. Each personal film has a real frame extracted from its video and an optional `durationSeconds` field for a compact duration badge. Portrait videos remain fully visible within a landscape thumbnail using a softly blurred background from the same frame. Browsing loads only poster images; selecting a card opens the paused film. Preserve manual Play and restore the selected card's focus and scroll position after Back to films.

For seated playback, project the 3D movie screen bounds into CSS coordinates and anchor a compact control overlay to its lower edge. Recompute those bounds when the viewport changes. Show Play/Pause, seek, mute, captions, fullscreen, Back to films and Stand up. The overlay fades after a short period of playback inactivity and reappears on pointer movement, touch or keyboard input. Keep it visible during keyboard focus or hover. Tapping the movie to reveal controls must not close the screening. Native fullscreen keeps the native video controls.

## Performance and resource ownership

Use adjacent-room visual culling, lazy photo loading, bounded preview resolution, shared materials, and instanced repeated details. Dispose textures, geometry, media elements, and subscriptions when appropriate. Keep labels renderer-owned; avoid reparenting DOM nodes owned by React or the 3D renderer.

Offer Low, Balanced (Medium), and High graphics settings. Low and Balanced cap pixel ratio at 1; High caps it at 1.5. Balanced is the desktop default. Keep live planar floor reflections and real-time architectural shadows exclusive to High. Low and Balanced retain the shared prefiltered indoor reflection probe, authored materials, and all room details. High uses one 2048-pixel shadow map and a 512-pixel reflection target for the active Entrance or Gallery floor. Dispose all targets on quality changes and room exits.

Keep nine spotlights and four point lights mounted in one shared light pool. Change their intensity, colour and position by room instead of mounting and unmounting lights at doorways: light counts are part of Three's shader-program key. The conservatory accent lights belong to this shared pool. Prepare mounted shaders once during startup; do not clone the scene and trigger new compilation passes during walking. Reapply instance transforms when quality changes recreate a mesh.

Bake small, world-space bevels into architectural rails, display cabinets, cinema joinery, and conservatory framing. Merge static geometry by finish and cache reusable shapes and materials. Preserve the dark gallery ceiling, cream wall panels, walnut parquet, and bronze details. Smooth the walking velocity with short, frame-rate-independent acceleration and braking; use the physics engine interpolated pose for camera translation while applying mouse look directly. Adapt pixel ratio only after sustained slow frames, with slower recovery and quality limits.

Measure actual runtime performance. Software-rendered Chrome checks do not establish hardware GPU or physical phone performance.

## Acceptance and delivery

Run lint, TypeScript, unit/component tests, and a production build. Run meaningful browser checks against the real rendered application. The reference currently has 56 unit/component tests, but a rebuilt implementation needs its own relevant coverage.

Verify every original gallery slot against the approved mapping, all seven graduate labels, all ten film entries, image decoding, native image/video proportions, frame spacing, doorway clearance, both viewing paths, case and seating collisions, position reset, music start/mute/volume/pause/resume, film cleanup, letter activation, graphics changes, and repeated room entry without resource growth.

Capture desktop and phone-width layouts. Check picture-light coverage for every frame, especially photo 12 and frames between room light pools. Test a real user entry gesture for background audio. Test that returning from the cinema to the gallery works from the seat-side aisle.

Report what was implemented, what was actually tested, and what remains unverified. Native fullscreen, pointer lock, real phones, hosted authentication, and live two-person visits require their own evidence. Do not report them as passed based only on compilation or mocked services.

Deliver source, a reproducible setup, the catalog/schema, asset preparation notes, and screenshots. Use `npm ci`, `npm run dev:personal`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` where the reference package scripts are present. Do not publish personal media or create a hosting account without my instruction.

## Exact personal asset inventory

The companion manifest contains catalog metadata and relative asset references. It contains no image, audio, or video bytes. Supply the referenced files separately, including the entrance MP4/poster, movie posters, caption tracks, and the Ordinary MP3.

### Approved gallery order

| Frame | Selection | Title | Display image |
| --- | --- | --- | --- |
| 01 | A12 | Above the City | `photo-14.jpg` |
| 02 | A11 | Pink and Purple | `photo-12.jpg` |
| 03 | A04 | In the Mirror | `photo-04.jpg` |
| 04 | A02 | At the Station | `at-the-station.jpg` |
| 05 | A03 | Out in the Sun | `out-in-the-sun.jpg` |
| 06 | A05 | Hand in Hand | `photo-06.jpg` |
| 07 | A17 | Back at the Station | `photo-21.jpg` |
| 08 | A29 | By the Enclosure | `img-2722.jpg` |
| 09 | A33 | In the Red Hoodie | `red-hoodie.jpg` |
| 10 | A34 | On the Path | `on-the-path.jpg` |
| 11 | A35 | Together on the Grass | `on-the-grass.jpg` |
| 12 | A01 | Seated Together | `seated-together.jpg` |
| 13 | A19 | Together in the Wooden Shelter | `img-2773.jpg` |
| 14 | A20 | A Selfie Together | `img-2765.jpg` |
| 15 | A06 | Side by Side | `photo-07.jpg` |
| 16 | A07 | Under the Windows | `photo-08.jpg` |
| 17 | A08 | Looking Up at You | `photo-09.jpg` |
| 18 | A09 | Standing Together | `photo-10.jpg` |
| 19 | A15 | In the Sunshine | `photo-18.jpg` |
| 20 | A16 | Smiling from the Seats | `photo-20.jpg` |
| 21 | A18 | Seated Together Again | `photo-22.jpg` |
| 22 | A32 | A Wide-Eyed Selfie | `wide-eyed-selfie.jpg` |
| 23 | A14 | Across the Video Call | `photo-17.jpg` |
| 24 | A10 | Another Selfie in the Sun | `photo-11.jpg` |
| 25 | A24 | A Quiet Moment | `photo-05.jpg` |
| 26 | A22 | A Smile in Green | `photo-02.jpg` |
| 27 | A26 | Under the Flowers | `photo-16.jpg` |
| 28 | A27 | A Study Break | `photo-19.jpg` |
| 29 | A25 | At the Table | `photo-13.jpg` |
| 30 | A21 | By the Photo Wall | `photo-01.jpg` |
| 31 | A30 | A Meal and a Smile | `img-2402.jpg` |
| 32 | A28 | The Studio Portrait | `photo-23.jpg` |
| 33 | A23 | Ice Cream Break | `photo-03.jpg` |
| 34 | A13 | A Collection of Moments | `photo-15.jpg` |
| 35 | A31 | Together by the Garden | `garden-selfie.jpg` |

### Graduate wall

| Label | Original file | Display image |
| --- | --- | --- |
| G01 | `DSC_4100.jpg` | `graduate-dsc-4100.jpg` |
| G02 | `DSC_4090.jpg` | `graduate-dsc-4090.jpg` |
| G03 | `DSC_4084.jpg` | `graduate-dsc-4084.jpg` |
| G04 | `DSC_4078.jpg` | `graduate-dsc-4078.jpg` |
| G05 | `DSC_4003.jpg` | `graduate-dsc-4003.jpg` |
| G06 | `DSC_3995.jpg` | `graduate-dsc-3995.jpg` |
| G07 | `DSC_3999.jpg` | `graduate-dsc-3999.jpg` |

### Films

| Title | Source |
| --- | --- |
| 2 Years | `/media/two-years.mp4` |
| A Longer Memory | `/media/long-memory.mp4` |
| Snapchat Moment 01 | `/media/snapchat-01.mp4` |
| Snapchat Moment 02 | `/media/snapchat-02.mp4` |
| A Short Moment | `/media/img-2352.mp4` |
| A Moment Together | `/media/memory-film-01.mp4` |
| Another Moment Together | `/media/memory-film-02.mp4` |
| A Moment on Film | `/media/a-moment-on-film.mp4` |
| A Little Memory | `/media/memory-film-03.mp4` |
| A Moment in Motion | `/media/a-moment-in-motion.mp4` |

### Current implementation notes

The supplied source implements gallery seating as physical furnishings. Only the cinema currently has a seated camera/playback interaction. The letter text is provisional. Personal film caption files may be empty placeholders. The constellation and promise garden remain deferred. Keep these distinctions explicit when reproducing the project.
