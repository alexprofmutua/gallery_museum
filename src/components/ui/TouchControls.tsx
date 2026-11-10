import { useRef } from "react";
import { Move, Hand } from "lucide-react";
import { input } from "../../engine/input";
export function TouchControls() {
  const knob = useRef<HTMLSpanElement>(null);
  const look = useRef<{ x: number; y: number; id: number } | null>(null);
  const stop = () => {
    input.move = { x: 0, y: 0 };
    if (knob.current) knob.current.style.transform = "translate(0px,0px)";
  };
  return (
    <div className="touch-controls">
      <div
        className="look-pad"
        data-testid="look-pad"
        aria-label="Drag to look around"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          look.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerMove={(e) => {
          const p = look.current;
          if (p?.id !== e.pointerId) return;
          input.look.x += (e.clientX - p.x) * 1.5;
          input.look.y += (e.clientY - p.y) * 1.5;
          look.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerUp={() => {
          look.current = null;
        }}
        onPointerCancel={() => {
          look.current = null;
        }}
      >
        <span>
          <Hand size={16} /> Drag to look
        </span>
      </div>
      <div
        className="joystick"
        data-testid="joystick"
        aria-label="Drag joystick to walk"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const r = e.currentTarget.getBoundingClientRect();
          let x = e.clientX - r.left - r.width / 2,
            y = e.clientY - r.top - r.height / 2;
          const scale = Math.max(1, Math.hypot(x, y) / 35);
          x /= scale;
          y /= scale;
          input.move = { x: x / 35, y: y / 35 };
          if (knob.current)
            knob.current.style.transform = `translate(${x}px,${y}px)`;
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
      >
        <span ref={knob}>
          <Move size={22} />
        </span>
      </div>
    </div>
  );
}
