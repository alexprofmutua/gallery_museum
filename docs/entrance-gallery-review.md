# Entrance and gallery visual review

This pass covers the entrance and gallery. The corridor, cinema, and Forever Room captures document the existing route for the next review.

## What changed

- The Grand Entrance has an 8.25-metre envelope, a modeled barrel vault with masonry ribs, fluted marble columns, inset wall panels, sconces, a brass-trimmed arched doorway, and a checkered stone floor.
- The Gallery of Us has recessed ceiling coffers, herringbone parquet, molded picture frames, separate wall labels, two larger end-wall works, and five cases with molded bases and lighter glass. The 30 memory IDs and configuration format remain available. The sample collection includes ten public-domain reproductions alongside original illustrations.
- The welcome panel uses a dark backing and light type. It sits beside the doorway at desktop widths and below the upper architectural view on a phone-sized screen. Character selection and the accessible gallery link remain on the entry screen.
- The default and Low graphics presets use soft floor contact shadows and gallery light washes on 3D surfaces. High adds two floor normal maps and a shadow-casting gallery spotlight. Trim, columns, and gallery ceiling fixtures are batched. The rooms behind the first two closed doors stay hidden until those doors open.

[Asset sources and attribution](asset-credits.md)

## Captures

- [Welcome, desktop](screenshots/entrance-gallery-review/desktop-welcome.png) · [Welcome, mobile](screenshots/entrance-gallery-review/mobile-welcome.png)
- [Grand Entrance](screenshots/entrance-gallery-review/desktop-entrance.png) · [Entrance, mobile](screenshots/entrance-gallery-review/mobile-entrance.png)
- [Gallery of Us](screenshots/entrance-gallery-review/desktop-gallery.png) · [Gallery, mobile](screenshots/entrance-gallery-review/mobile-gallery.png)
- [Enchanted Corridor](screenshots/entrance-gallery-review/desktop-corridor.png)
- [Our Little Cinema](screenshots/entrance-gallery-review/desktop-cinema.png)
- [Forever Room](screenshots/entrance-gallery-review/desktop-forever.png)

## Performance

Local Chrome ran WebGL through SwiftShader. Both passes sampled 90 animation frames per scene and discarded the first ten. The camera faced forward at the entrance spawn and around Z=5 in the gallery after all 30 image decodes completed. Desktop ran at 1440 × 1000 and the emulated touch viewport at 390 × 844, with matching framebuffer sizes and the normal default preset for each viewport.

| View | FPS before → after | Frame time p95 before → after | Draw calls before → after |
| --- | ---: | ---: | ---: |
| Desktop entrance | 20.8 → 19.7 | 50.1 → 66.6 ms | 362 → 157 |
| Desktop gallery | 23.8 → 17.3 | 50.1 → 66.7 ms | 254 → 156 |
| Phone-sized entrance | 60.0 → 60.0 | 16.8 → 16.8 ms | 248 → 135 |
| Phone-sized gallery | 60.0 → 57.8 | 16.7 → 16.8 ms | 164 → 96 |

Closing off unseen rooms and batching fixtures reduced draw calls. The more detailed gallery still costs more frame time at full desktop size in this software renderer. The phone result is viewport emulation. Physical-device and hardware-GPU measurements are pending.

## Verification

Lint, strict TypeScript, 31 unit and component tests, and the production build passed. The existing large 3D chunk warning remains.

The round-trip Chrome check completed two laps through all five rooms. After the first trip, the renderer held 185 geometries and 81 textures. The second trip returned to the same counts. The closed-door startup uses 28 geometries and 13 textures in the same run.

Chrome regression coverage includes navigation and collisions, desktop and touch character controls, all 30 memory dialogs, image failure recovery, accessible browsing, film controls, and final-letter replay and skip. Eighteen cases passed in the full run. The last visual route case timed out on a long software-rendered walking leg, then passed a focused rerun after the test waited for reset and split the walk at the cinema. The existing macOS native pointer-lock skip remains. Mouse drag passed. Hosted multiplayer was outside this verification run.
