# Our Little Cinema review

The private screening room has eight rounded burgundy seats, walnut and bronze wall panels, warm sconces, a carpeted aisle with guide lights, and the existing galaxy ceiling. The idle screen uses a generated title card and switches to the video texture during playback. Starting the film moves the camera to seated eye level. Short portrait viewports frame the screen higher to leave room for captions and controls.

The room uses authored geometry and locally generated carpet, sconce glow, and title-card textures. It batches repeated meshes and uses the existing room fill light. This pass adds no external assets or dependencies.

## Captures

- Desktop at 1440 × 1000 — [seating](screenshots/cinema-review/desktop-seating.jpg), [aisle](screenshots/cinema-review/desktop-aisle.jpg), [idle screen](screenshots/cinema-review/desktop-idle.jpg), [playback](screenshots/cinema-review/desktop-playing.jpg)
- Phone-sized Chrome viewport at 390 × 844 — [seating](screenshots/cinema-review/mobile-seating.jpg), [playback](screenshots/cinema-review/mobile-playing.jpg)
- Narrow Chrome viewport at 320 × 640 — [playback with captions](screenshots/cinema-review/mobile-320-playing.jpg)

## Performance

The baseline and first rendered redesign pass used headless Chrome with SwiftShader. The same walk and film playback were sampled at 1440 × 1000 and 390 × 844. Frame times use 80 animation frames after discarding the first 10.

| View | Baseline p95 | First pass p95 | Baseline draw calls | First pass draw calls |
| --- | ---: | ---: | ---: | ---: |
| Desktop walking | 83.3 ms | 83.4 ms | 127 | 121 |
| Desktop playback | 50.1 ms | 66.7 ms | 33 | 32 |
| Phone-sized walking | 33.4 ms | 33.4 ms | 99 | 98 |
| Phone-sized playback | 16.7 ms | 16.7 ms | 28 | 30 |

The final title card uses one plane and hides it when the film texture is visible. Connected Chrome reported 31 draws during desktop playback and 29 at 390 × 844. A separate headless launch for the final matched timing comparison was blocked when automatic approval review hit its usage limit. The timing figures describe software rendering. Physical phone performance remains unmeasured.

## Verification

Lint, TypeScript, 31 unit tests, and the production build passed. In connected Chrome I walked into the cinema, opened the idle projection, played and paused the film, checked captions, muted audio, sought and replayed, and returned to walking. I inspected the cinema controls and HUD at narrow widths and verified that the accessible gallery opens the film with its transcript. The automated browser suite and private hosted playback remain unverified for this pass.
