import { rooms } from "../../content/layout";
import { museum } from "../../content/museum";
import { useMuseum } from "../../stores/museum";
import { Dialog } from "./Dialog";

export function MuseumMap({ onClose }: { onClose: () => void }) {
  const current = useMuseum(state => state.currentRoom);
  const viewed = useMuseum(state => state.viewedIds);
  const index = rooms.findIndex(room => room.id === current);
  return <Dialog title="Museum map" onClose={onClose} className="museum-map-dialog">
    <span className="eyebrow">YOUR VISIT · ROOM {index + 1} OF {rooms.length}</span>
    <h2>Find your way</h2>
    <p>Follow the central doors through the museum. You can return through every room.</p>
    <ol className="museum-map" aria-label="Rooms in walking order">
      {rooms.map((room, i) => {
        const photos = museum.memories.filter(memory => memory.roomId === room.id);
        const seen = photos.filter(memory => viewed.includes(memory.id)).length;
        return <li key={room.id} aria-current={current === room.id ? "location" : undefined}
          style={{ width: `${room.halfWidth / 7 * 100}%`, minHeight: `${Math.max(62, (room.maxZ - room.minZ) * 2)}px` }}>
          <span className="map-number">{String(i + 1).padStart(2, "0")}</span>
          <strong>{room.title}</strong>
          {current === room.id && <span className="map-location">You are here</span>}
          {photos.length > 0 && <small>{seen} of {photos.length} photos viewed</small>}
        </li>;
      })}
    </ol>
    <button className="primary" onClick={onClose}>Continue exploring</button>
  </Dialog>;
}
