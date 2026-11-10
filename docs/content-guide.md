# Preparing the collection

## Files to edit

`src/content/museum.config.json` contains the museum ID, title, and dedication. `src/content/memories.json` contains the exhibited memories in display order. Rendering, room geometry, and personal content are separate.

The demo contains 30 unique sample illustrations: landscape, portrait, and square. They represent no real people or events. Replace entries in the JSON rather than editing a scene component.

Each memory has:

- A unique `id` and positive, unique `displayOrder`.
- `title`, `caption`, optional `story`, and descriptive `alt` text.
- An optional `date` in `YYYY-MM-DD` format. Omit the field until you have the real date.
- An `image` path under `/images/`.
- A physical `position` in metres, a `rotationY` in radians, and `frame.width` / `frame.height` in metres.
- `placeholder`, which marks demo artwork, and an optional `activationRadius` (default 3.4 metres).

The collection validates IDs, ordering, dimensions, positions, dates, and media paths before the app renders. Errors appear in the developer console, with a visitor-facing recovery screen. Text renders as React text; HTML is not interpreted.

## Display images

Keep original photographs separately, outside `public/`. Export an optimized display copy from your image editor. Keep its natural aspect ratio. Landscape, portrait, and square images fit inside a frame with a mat; the renderer does not crop or stretch them.

Public demo copies go in `public/images/memories/`; reference them as `/images/memories/filename.webp` in JSON. PNG, JPEG, WebP, AVIF, and SVG display assets are accepted. Use simple filenames such as `memory-01.webp`. Local paths cannot contain `..`. A useful preparation target is about 1,200 pixels on the long side for small frames, and 1,600 for a large detail view. Check quality and file size before adding many images. The 3D renderer creates a separate display texture capped at 1,024 pixels on the long side; the source file is unchanged.

Everything in `public/` can be retrieved by anyone who can reach the server. Follow [the private museum setup](private-museum.md) for personal material.

## Arranging frames

The existing side frames fit between the gallery columns in two rows. Keep the supplied 1.45-metre square frame dimensions and positions while replacing content. Larger frames need a clearance check. The first large frame remains beside the gallery's far doorway. The central route stays open.

`rotationY` is zero for the far wall, `Math.PI / 2` (approximately 1.5708) for the west wall, and `-Math.PI / 2` for the east wall. JSON stores the numeric value. The array order does not control visual ordering; `displayOrder` does.

The renderer maps the full collection, so adding entries does not require scene-component edits. Additional entries still need usable wall positions and unique IDs. The tests check that the current 30-frame collection clears the columns.

## Reading and progress

Visitors can inspect a frame in either camera view. Point at a nearby frame and press E, click it, or tap it. The exact frame plane determines the keyboard prompt. Longer text appears in a native HTML dialog.

The accessible gallery offers the same collection, a text search, and an unseen filter. Viewed progress stores only memory IDs under `ofm-progress:<museum-id>` in this browser. Reloading keeps progress; it does not skip the entrance. Use a new museum ID when you want a fresh progress record for a personalized collection. Settings includes a reset. If browser storage is blocked, the visit remains usable and viewed progress lasts only until reload. No account, analytics, or cross-device synchronization is involved.

Nearby images prefetch within ten metres. Entering the gallery loads its full collection so distant frames show artwork too. After leaving, textures release beyond fourteen metres or when the room unmounts. The gap prevents repeated loading while standing near a boundary. Loading and unavailable states remain inside individual frames; missing media does not remove its text or the rest of the gallery.

## Forever Room

In `src/content/cinematics.json`, edit `letter.title`, the `letter.paragraphs` array, and the optional `letter.dedication`. In private mode, use the same fields under `cinematics` in the private catalog. The room keeps its default colors unless you set `conservatory.ivoryRose` or `conservatory.blushRose` to a six-digit hex color.

The three inscriptions from *The Originals* live in `src/content/foreverRoom.ts`. The same entries appear on the rear wall and in the accessible gallery. They reference [the Mikaelson family vow](https://www.imdb.com/title/tt2879460/quotes/?item=qt2102187), [Klaus and Camille in No More Heartbreaks](https://www.silverpetticoatreview.com/originals-no-more-heartbreaks-recap/), and [Marcel's proposal in Where You Left Your Heart](https://vampirediaries.fandom.com/wiki/Where_You_Left_Your_Heart/Transcript).

## Check changes

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. With the preview running, `npm run test:e2e` checks browser behavior. Inspect the actual frames and detail views after changing dimensions or artwork. Unit tests alone do not establish visual correctness.
