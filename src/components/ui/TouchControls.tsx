import { useRef } from "react";
import { Move, Hand } from "lucide-react";
import { input } from "../../engine/input";

export function TouchControls() {
  const knob = useRef<HTMLSpanElement>(null);
  const look = useRef<{ x: number; y: number; id: number } | null>(null);
  const movementPointer = useRef<number | null>(null);

  const stopMovement = (pointerId: number) => {
    if (movementPointer.current !== pointerId) return;
    movementPointer.current = null;
    input.move = { x: 0, y: 0 };
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
  };

  const updateMovement = (element: HTMLElement, clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) * 0.3;
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(x, y);
    const factor = distance > radius ? radius / distance : 1;
    const dx = x * factor;
    const dy = y * factor;
    input.move = { x: dx / radius, y: dy / radius };
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  return (
    <div className="touch-controls">
      <div
        className="look-pad"
        data-testid="look-pad"
        aria-label="Drag to look around"
        onPointerDown={(event) => {
          if (look.current) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          look.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
        }}
        onPointerMove={(event) => {
          const previous = look.current;
          if (previous?.id !== event.pointerId) return;
          input.look.x += (event.clientX - previous.x) * 1.5;
          input.look.y += (event.clientY - previous.y) * 1.5;
          look.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
        }}
        onPointerUp={(event) => {
          if (look.current?.id === event.pointerId) look.current = null;
        }}
        onPointerCancel={(event) => {
          if (look.current?.id === event.pointerId) look.current = null;
        }}
        onLostPointerCapture={(event) => {
          if (look.current?.id === event.pointerId) look.current = null;
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
        onPointerDown={(event) => {
          if (movementPointer.current !== null) return;
          movementPointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateMovement(event.currentTarget, event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (movementPointer.current !== event.pointerId) return;
          updateMovement(event.currentTarget, event.clientX, event.clientY);
        }}
        onPointerUp={(event) => stopMovement(event.pointerId)}
        onPointerCancel={(event) => stopMovement(event.pointerId)}
        onLostPointerCapture={(event) => stopMovement(event.pointerId)}
      >
        <span ref={knob}>
          <Move size={22} />
        </span>
      </div>
    </div>
  );
}
