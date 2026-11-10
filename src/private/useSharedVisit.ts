import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { characterIds, defaultCharacter } from "../content/characters";
import type { CharacterId } from "../content/characters";
import { foreverRoom, rooms } from "../content/layout";
import { useMuseum } from "../stores/museum";
import { playerPose } from "../engine/chaseCamera";
import type { PrivateVisit } from "./session";

const poseSchema = z.object({
  character: z.enum(characterIds).default(defaultCharacter),
  x: z.number().min(-7.5).max(7.5),
  z: z
    .number()
    .min(foreverRoom.minZ - 0.5)
    .max(rooms[0].maxZ + 0.5),
  feetY: z.number().min(-0.6).max(1),
  yaw: z.number().min(-Math.PI).max(Math.PI),
  speed: z.number().min(0).max(4),
});
export type VisitorPose = z.infer<typeof poseSchema>;
type Status = "off" | "connecting" | "waiting" | "together" | "reconnecting";

export function useSharedVisit(
  visit: PrivateVisit | undefined,
  enabled: boolean,
) {
  const [status, setStatus] = useState<Status>("off");
  const [guestCharacter, setGuestCharacter] =
    useState<CharacterId>(defaultCharacter);
  const remote = useRef<VisitorPose | null>(null);
  const previousCleanup = useRef(Promise.resolve());

  useEffect(() => {
    if (!visit || !enabled) return;
    const { client, topic, visitorId } = visit;
    let stopped = false;
    let channel: ReturnType<typeof client.channel> | undefined;
    let retry: number | undefined;
    let peerIds = new Set<string>();
    let lastReceived = 0;
    let lastSent = 0;
    let previousPose = "";
    let pending = false;

    async function disconnect() {
      const old = channel;
      channel = undefined;
      remote.current = null;
      peerIds = new Set();
      if (old) {
        const result = await client.removeChannel(old).catch(() => "error");
        if (result !== "ok") old.teardown();
      }
    }

    function reconnect() {
      remote.current = null;
      peerIds.clear();
      setStatus("reconnecting");
      if (retry !== undefined) return;
      retry = window.setTimeout(async () => {
        retry = undefined;
        const cleaning = disconnect();
        previousCleanup.current = cleaning;
        await cleaning;
        if (!stopped) connect();
      }, 3000);
    }

    function connect() {
      if (stopped) return;
      const current = client.channel(topic, {
        config: {
          private: true,
          broadcast: { self: false },
          presence: { key: visitorId },
        },
      });
      channel = current;
      current
        .on("presence", { event: "sync" }, () => {
          if (stopped || current !== channel) return;
          peerIds = new Set(
            Object.keys(current.presenceState()).filter(
              (id) => id !== visitorId && z.uuid().safeParse(id).success,
            ),
          );
          if (!peerIds.size) remote.current = null;
          setStatus(peerIds.size ? "together" : "waiting");
        })
        .on("broadcast", { event: "pose" }, ({ payload }) => {
          if (
            stopped ||
            current !== channel ||
            !peerIds.has(payload?.visitorId)
          )
            return;
          const parsed = poseSchema.safeParse(payload?.pose);
          if (parsed.success) {
            remote.current = parsed.data;
            setGuestCharacter(parsed.data.character);
            lastReceived = performance.now();
          }
        })
        .subscribe((result) => {
          if (stopped || current !== channel) return;
          if (result !== "SUBSCRIBED") {
            reconnect();
            return;
          }
          window.clearTimeout(retry);
          retry = undefined;
          lastSent = 0;
          setStatus("waiting");
          void current
            .track({ visiting: true })
            .then((tracked) => {
              if (!stopped && current === channel && tracked !== "ok")
                reconnect();
            })
            .catch(() => {
              if (!stopped && current === channel) reconnect();
            });
        });
    }

    setStatus("connecting");
    void previousCleanup.current.then(connect);
    const clock = window.setInterval(() => {
      const now = performance.now();
      if (now - lastReceived > 3500) remote.current = null;
      if (
        !channel ||
        channel.state !== "joined" ||
        !navigator.onLine ||
        pending ||
        !peerIds.size
      )
        return;
      const parsed = poseSchema.safeParse({
        ...playerPose,
        character: useMuseum.getState().character,
      });
      if (!parsed.success) return;
      const fingerprint = JSON.stringify(parsed.data);
      if (fingerprint === previousPose && now - lastSent < 1000) return;
      lastSent = now;
      previousPose = fingerprint;
      pending = true;
      void channel
        .send({
          type: "broadcast",
          event: "pose",
          payload: { visitorId, pose: parsed.data },
        })
        .catch(() => undefined)
        .finally(() => {
          pending = false;
        });
    }, 125);
    return () => {
      stopped = true;
      window.clearTimeout(retry);
      window.clearInterval(clock);
      if (channel) previousCleanup.current = disconnect();
    };
  }, [enabled, visit]);

  return {
    status: enabled && visit ? status : ("off" as const),
    remote,
    guestCharacter,
  };
}
