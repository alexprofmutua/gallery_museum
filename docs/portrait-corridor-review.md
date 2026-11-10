# Living Portrait Corridor

The corridor has a purple barrel vault, gilded ribs, candle sconces, a veined marble floor, and six paintings on both walls. The images and six-second clips are original placeholder artwork. The clips use a slow push into the paintings and a quiet synthesized tone. The bundled files total about 900 KB, and the browser requests a clip only after the visitor starts it.

## Playback

Approach either wall to select the nearest painting. Press **E**, tap **Play Portrait**, or focus the button and press Enter or Space. Playback starts muted. You can pause, unmute, replay, expand to the native video player, or stop. The accessible gallery also offers the same six paintings with native playback controls.

Walking out of range stops the clip and releases its media source. Changing rooms, resetting the visit, or leaving the tab also stops it. When the clip ends, its image fades back to the still. Returning to a painting requires a new action to play it.

## Content

The typed catalog in [portraits.ts](../src/content/portraits.ts) sets each title, description, wall, order, aspect ratio, frame style, interaction radius, and media path. Edit that catalog to add or change placeholder content. The owner upload tools, local backups, and authenticated media sharing are later milestones.

## Captures

- Desktop [hall](screenshots/portrait-corridor/desktop-hall.jpg), [approach](screenshots/portrait-corridor/desktop-approach.jpg), and [playback](screenshots/portrait-corridor/desktop-playback.jpg)
- Phone-sized [hall](screenshots/portrait-corridor/mobile-hall.jpg), [approach](screenshots/portrait-corridor/mobile-approach.jpg), and [playback](screenshots/portrait-corridor/mobile-playback.jpg)

## Verification

Lint, strict TypeScript, all 36 unit tests, and the production build passed. The 10 browser cases covered deliberate desktop and touch activation, playback controls, the accessible player, the five-room route, collisions, cinema, and the final letter. The media test observed the video clock advance after activation and checked that leaving range paused and unloaded the clip. The two warmed round trips ended at the same 185 geometries and 81 textures.

The profile used Chrome with SwiftShader and sampled 50 animation frames per view after discarding the first 10. Hall and playback measurements use different camera angles. The 390 × 844 touch layout left the joystick clear of the playback panel.

| Viewport | Hall p95 | Hall draws | Playback p95 | Playback draws |
| --- | ---: | ---: | ---: | ---: |
| 1440 × 1000 | 66.7 ms | 87 | 66.7 ms | 33 |
| 390 × 844 | 33.4 ms | 88 | 33.4 ms | 23 |

Physical phone performance and hosted private sessions were outside this verification pass.
