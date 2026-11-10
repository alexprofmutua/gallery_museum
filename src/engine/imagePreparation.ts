// Serialize canvas resampling so a room entry cannot prepare dozens of large
// images in one frame. Network decoding remains asynchronous and cancellable.
const pending: Array<() => void> = [];
let scheduled = false;
function pump() {
  requestAnimationFrame(() => {
    const work = pending.shift();
    try { work?.(); } finally {
      if (pending.length) pump();
      else scheduled = false;
    }
  });
}
export function scheduleImagePreparation(work: () => void) {
  pending.push(work);
  if (!scheduled) { scheduled = true; pump(); }
  return () => {
    const index = pending.indexOf(work);
    if (index >= 0) pending.splice(index, 1);
  };
}
