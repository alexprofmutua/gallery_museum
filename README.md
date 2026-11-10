# Our Forever Museum

The five-room museum includes an enchanted corridor, a working cinema, and a glass conservatory. The local sample preview has 30 memories, three sample film entries, music, and a letter. Milestone 5 adds optional private access and two-person visits through Supabase.

This repository contains the application code and public sample assets. The personal collection in `.local-museum/`, personal character models, credentials, local archives and review screenshots are excluded from Git. Keep a separate private backup of those files; cloning this repository does not restore the personal museum.

## Run locally

Use Node.js 22.12 or later and npm.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. Choose **Starfish** or **Blue Whale** at the entrance and click **Enter the museum**, then click inside the room to capture the mouse. Escape releases it. If mouse capture is unavailable, drag inside the room to look. Use W/A/S/D to walk, mouse or left/right arrows to turn, and E to open a nearby memory. Shift walks faster. You enter in first person. Press V or use **Show visitor character** in Settings to switch to third person. Settings also lets you switch characters. Settings includes position reset and an accessible 2D gallery.

On touchscreens, drag the left joystick to walk and the right half of the screen to look. Tap the room prompt to open a memory, start a screening, or read the final letter. In 3D, look up in the cinema to see the star ceiling. Press **E** or tap **Sit down**, scroll to choose a film, then select **Play**. Choose **Stand up** to stop the film and return to your walking position. Press **M** to toggle museum music, or adjust its volume in Settings.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The Playwright suite currently uses installed macOS Google Chrome and a running local Vite server on port 5174. Set `PREVIEW_URL` to test another port. The native pointer-lock test explicitly skips when automated macOS Chrome returns `WrongDocumentError`; verify capture and Escape manually in a foreground browser before calling that requirement validated. Mouse drag is covered independently. Update `executablePath` in `playwright.config.ts` for another operating system or browser installation. Development-only canvas attributes expose position and yaw for browser assertions; they are absent from production builds.

## Customize

Run `npm run dev:personal` to preview the personal collection on this Mac. Its catalog and display files are in `.local-museum/`. The preview binds to localhost, and normal builds use the sample assets in `public/`.

Edit `src/content/museum.config.json` for museum metadata and `src/content/memories.json` for the collection. Runtime schemas validate content before rendering. Frames, image proportions, labels, and memory details are data-driven. See [the content guide](docs/content-guide.md) for image preparation, placement, optional dates, and local progress. No scene-component edits are required to replace sample content.

Keep personal media in the configured private bucket. The sample preview and everything in `public/` are public assets. See [private museum setup](docs/private-museum.md) for invitations, access policies, and two-person visits.

## Structure

- `src/app`: shell, error boundary, onboarding, responsive styles.
- `src/components/museum`: room architecture and canvas.
- `src/engine`: camera movement, input, shared dimensions.
- `src/components/ui`: modal and touch controls.
- `src/content`: typed, validated sample content.
- `src/stores`: central interaction state.
- `src/tests` and `e2e`: unit, component, and browser tests.
- `docs`: milestone report and captured screenshots.

## Decisions and scope

One metre in the scene is one metre in the room. The walking camera is 1.65 m above the floor. A fixed-step Rapier world moves a capsule body against wall, column, platform, and bench colliders. Movement speed is normalized diagonally and follows camera yaw. Collision geometry is independent of visible geometry. The museum store tracks the active exhibit and room. The player pauses while a memory, screening, or letter is open.

The scene uses adjacent-room visual culling, shared box geometry and materials, procedural stone textures, an original SVG stand-in, a capped 1.5 device pixel ratio, and room-specific lighting without dynamic shadow maps. GSAP, backend SDKs, and multiplayer packages are deliberately deferred until their milestone needs them. The decorative font is loaded from Google Fonts, with local system fallbacks. Everything else required by the room is served by the application.

`npm run build` creates `dist/` for static hosting. Configure an SPA rewrite if adding routes later. No hosting account was created and nothing was deployed. Verify access on the configured Supabase project with sample media before uploading personal content.

The five spaces are connected by proximity-triggered pocket doors. In the Forever Room, walk to the marble pedestal and press **E** or tap **Open Letter**. The accessible gallery offers the films, letter, and inscriptions as HTML. The [Forever Room review](docs/forever-conservatory-review.md) includes desktop and phone screenshots.

See [Milestone 4](docs/milestone-4.md) for the cinematic controls and verification. Earlier reports cover [the memory collection](docs/milestone-3.md), [room architecture](docs/milestone-2.md), and [the foundation](docs/milestone-1.md).

The optional [visitor character view](docs/character-view.md) includes a procedural placeholder avatar and a wall-aware chase camera. It is separate from multiplayer.
