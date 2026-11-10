# Milestone 4 · Cinematic experience

## Exploring the rooms

- Walk straight from the entrance through the gallery. In the 20-metre Enchanted Corridor, five arched bays light up as you pass them. Settings offers Low, Medium, and High graphics presets. Low uses fewer stars and stationary motes.
- Look up in Our Little Cinema for the galaxy ceiling. Press **E** or choose **Watch sample film**, then press **Play**. The film projects on the room screen. The controls support pausing, seeking, muting, English captions, and fullscreen. **Return to the museum** stops playback and restores your walking view.
- Enter the Forever Room and wait for the stars and letter to appear, or choose **Skip animation**. Press **E** or choose **Read sample letter**. The letter offers **Replay reveal**. If your system requests reduced motion, the letter is available on entry.
- Choose the accessible gallery to watch the film in a native video player or read the letter directly. Press **M** or use Settings to opt into museum music. It pauses while the cinema is open.

## How the pieces fit

The reveal uses two timed stages. Changing rooms, skipping, or replaying cancels the pending timer. The final door leaves can close after you clear the threshold and reopen as you approach. Once the doors have opened the first time, the reveal never puts a collider back in the doorway.

One HTML video element owns playback, audio, seeking, and the caption track. Three.js samples the same video for the room screen. Opening the cinema requests the media, and clicking Play starts it. The local sample is a 15-second, 960 × 540 H.264 film with AAC audio and English WebVTT captions. The music is a separate local loop. The sample film and music were made for the prototype.

Sample media references and letter text are in `src/content/cinematics.json`. Keep personal material out of `public/` until access control and private media delivery are implemented.

## Verification

Lint, strict TypeScript, all 28 unit and component tests, and the production build passed. The existing lazy 3D chunk is about 1.09 MB gzipped and still triggers Vite’s size warning.

In Chrome’s SwiftShader renderer at 1440 × 1000, a 120-frame Forever Room sample averaged about 32.4 FPS, with a 33.4 ms 95th-percentile frame interval and 49 draw calls. The GPU counters read 89 geometries and 72 textures at the entrance before travel and after each of two round trips. The active room uses a shared local light and floors release their GPU textures when culled. The measurements describe this software-rendered run. Safari, physical phones, and hardware performance targets remain unverified.

The complete Chrome suite finished with 18 passes and the existing native pointer-lock skip. The five cinematic scenarios covered gesture-started playback, captions, seeking, muting, fullscreen, restoring the walking view, the timed reveal, replay, skip, the exit door, reduced motion, the accessible player and letter, a simulated missing film, and music opt-in. An additional emulated touch check played the film on the 3D screen at 390 × 844.

Inspected captures show [the Enchanted Corridor](screenshots/enchanted-corridor.png), [the cinema screening](screenshots/cinema-projection.png), and [the revealed letter](screenshots/forever-reveal.png).
