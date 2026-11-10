import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Memory } from "../../content/museum";
import { ImagePreview } from "./ImagePreview";
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function PhotoStage({ memory }: { memory: Memory }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef({ distance: 1, zoom: 1 });
  const changeZoom = (value: number) => { setZoom(clamp(value, 1, 3)); setPan({ x: 0, y: 0 }); };
  const distance = () => { const [a, b] = [...pointers.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const end = (event: PointerEvent<HTMLDivElement>) => { pointers.current.delete(event.pointerId); };
  return <div className="photo-viewer">
    <div className={`photo-stage${zoom > 1 ? " is-zoomed" : ""}`}
      aria-label="Photograph. Pinch to zoom, or use the zoom buttons. Drag to pan when zoomed."
      onDragStart={event => event.preventDefault()}
      onPointerDown={event => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 2) pinch.current = { distance: Math.max(1, distance()), zoom };
      }}
      onPointerMove={event => {
        const previous = pointers.current.get(event.pointerId);
        if (!previous) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 2) {
          setZoom(clamp(pinch.current.zoom * distance() / pinch.current.distance, 1, 3));
          setPan({ x: 0, y: 0 });
        } else if (zoom > 1) {
          const bounds = event.currentTarget.getBoundingClientRect();
          setPan(p => ({ x: clamp(p.x + event.clientX - previous.x, -bounds.width * (zoom - 1) / 2, bounds.width * (zoom - 1) / 2),
            y: clamp(p.y + event.clientY - previous.y, -bounds.height * (zoom - 1) / 2, bounds.height * (zoom - 1) / 2) }));
        }
      }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <div className="photo-transform" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <ImagePreview memory={memory} eager />
      </div>
    </div>
    <div className="photo-tools" role="group" aria-label="Photo zoom">
      <button className="icon-button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => changeZoom(zoom - 0.5)}><Minus size={17} /></button>
      <output aria-live="polite">{Math.round(zoom * 100)}%</output>
      <button className="icon-button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => changeZoom(zoom + 0.5)}><Plus size={17} /></button>
      <button className="icon-button" aria-label="Fit photograph" onClick={() => changeZoom(1)}><RotateCcw size={16} /></button>
    </div>
  </div>;
}
