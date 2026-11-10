# White-flash investigation and correction

Reported symptom: quick white flashes after spending time in the museum.

## Reproduced trigger

AdaptiveResolution previously called the Fiber store's `setDpr` directly, while World passed Canvas a fixed DPR range. Fiber's next Canvas configuration recalculated that range at its maximum. A controlled browser check reduced DPR from 1 to 0.85; starting ordinary movement reset it to 1. Each resize cleared the drawing buffer to transparent RGBA [0, 0, 0, 0], exposing the light page background until another render.

World now owns the single DPR value passed to Canvas. AdaptiveResolution requests updates through that owner, so movement, menus, film state and other parent renders do not silently override the adaptive setting. Manual graphics changes still reset the intended quality ceiling.

RenderContinuity subscribes to Fiber state after its renderer-resize subscriber. When dimensions or DPR change, it synchronously draws the main scene into the resized default framebuffer and restores the prior render target. It avoids rendering on unrelated updates and unsubscribes on unmount. Waiting for a React layout effect alone was insufficient: the stricter immediate-buffer test still observed a transparent sample, so the redraw now happens in the synchronous subscription.

## Verification

- TypeScript, lint, 58 unit tests and production build pass; existing bundle-size warnings remain.
- Two Chrome regression tests cover sustained adaptive reduction followed by movement/menu renders and a resize-buffer sample before the next animation frame.
- One-minute installed-Chrome walk: entrance → gallery → corridor → cinema → forever → cinema → corridor → gallery → entrance. Two viewport resizes were included.
- 3,564 sampled rendered frames: zero transparent-buffer samples, zero loading-fallback samples, zero context-loss events and no page errors. Report and screenshot are in the ignored `.local-museum/review/render-continuity-soak.*` files.

This fixes a reproduced rendering-clear trigger. A one-minute Chrome run does not prove that every intermittent flash on every device is resolved. If flashes recur, record the room, graphics mode, activity and whether the browser is being resized or switching tabs, then investigate that distinct trigger.
