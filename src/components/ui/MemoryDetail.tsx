import { useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { museum, formatMemoryDate, formatMemoryNumber, memorySectionTitle } from "../../content/museum";
import type { Memory } from "../../content/museum";
import { Dialog } from "./Dialog";
import { PhotoStage } from "./PhotoStage";
export function MemoryDetail({
  memory,
  onClose,
  onNavigate,
}: {
  memory: Memory;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const sequence = useMemo(() => museum.memories.filter(item => item.roomId === memory.roomId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)), [memory.roomId]);
  const index = sequence.findIndex(item => item.id === memory.id);
  const previous = sequence[index - 1], next = sequence[index + 1];
  useEffect(() => {
    const navigate = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement)?.closest("input,textarea,select")) return;
      const target = event.key === "ArrowLeft" ? previous : event.key === "ArrowRight" ? next : null;
      if (target) { event.preventDefault(); onNavigate(target.id); }
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [previous, next, onNavigate]);
  return (
    <Dialog title={memory.title} onClose={onClose} className="memory-dialog">
      <div className="memory-image">
        <PhotoStage key={memory.id} memory={memory} />
        {memory.placeholder && <span>PLACEHOLDER ARTWORK</span>}
      </div>
      <div className="memory-copy">
        <span className="eyebrow">
          {memorySectionTitle(memory)} / {formatMemoryNumber(memory)}
        </span>
        <h2>{memory.title}</h2>
        {memory.date && (
          <time className="memory-date" dateTime={memory.date}>
            {formatMemoryDate(memory.date)}
          </time>
        )}
        <p className="caption">{memory.caption}</p>
        {memory.story
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        <nav className="photo-navigation" aria-label="Browse photographs">
          <button className="icon-button" aria-label="Previous photograph" disabled={!previous} onClick={() => previous && onNavigate(previous.id)}><ArrowLeft size={19} /></button>
          <span aria-live="polite">Photo {index + 1} of {sequence.length}</span>
          <button className="icon-button" aria-label="Next photograph" disabled={!next} onClick={() => next && onNavigate(next.id)}><ArrowRight size={19} /></button>
        </nav>
        <button className="text-button" onClick={onClose}>
          Back to the gallery <ArrowRight size={17} />
        </button>
      </div>
    </Dialog>
  );
}
