import { Suspense, useState } from "react";
import { rooms, portals, roomCenterZ } from "../../content/layout";
import { useMuseum } from "../../stores/museum";
import { RoomShell, SolidBox } from "./RoomShell";
import { Furnishings } from "./Furnishings";
import { Portal } from "./Portal";
import { Lighting } from "../../engine/Lighting";
export function Architecture({ video }: { video: HTMLVideoElement | null }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const roomId = useMuseum((s) => s.currentRoom);
  const index = rooms.findIndex((r) => r.id === roomId);
  return (
    <>
      {rooms.map((room, i) => (
        <group
          key={room.id}
          visible={
            !(
              room.id === "gallery" &&
              roomId === "entrance" &&
              !revealed["entrance-gallery"]
            ) &&
            !(
              room.id === "corridor" &&
              roomId === "gallery" &&
              !revealed["gallery-corridor"]
            )
          }
        >
          <RoomShell room={room} visible={Math.abs(i - index) <= 1} />
          {Math.abs(i - index) <= 1 && (
            <Suspense fallback={null}>
              <group
                position={[
                  0,
                  0,
                  room.id === "cinema" || room.id === "forever"
                    ? roomCenterZ(room)
                    : 0,
                ]}
              >
                <Furnishings
                  id={room.id}
                  video={room.id === "cinema" ? video : null}
                />
              </group>
            </Suspense>
          )}
        </group>
      ))}
      {portals.map((portal) => (
        <Portal
          key={portal.id}
          portal={portal}
          onReveal={
            portal.id === "entrance-gallery" || portal.id === "gallery-corridor"
              ? () =>
                  setRevealed((opened) => ({ ...opened, [portal.id]: true }))
              : undefined
          }
        />
      ))}
      <SolidBox
        position={[0, rooms[0].height / 2, rooms[0].maxZ + 0.2]}
        size={[14.4, rooms[0].height, 0.4]}
        color="#b7a38a"
      />
      <Lighting />
    </>
  );
}
