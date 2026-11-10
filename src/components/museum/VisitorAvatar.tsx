import { Suspense } from "react";
import type { RefObject } from "react";
import { defaultCharacter } from "../../content/characters";
import type { CharacterId } from "../../content/characters";
import type { VisitorPose } from "../../private/useSharedVisit";
import { useMuseum } from "../../stores/museum";
import { BasicVisitorAvatar } from "./BasicVisitorAvatar";
import { PersonalizedVisitorAvatar } from "./PersonalizedVisitorAvatar";

export function VisitorAvatar({remote, guestCharacter = defaultCharacter}: {
  remote?: RefObject<VisitorPose | null>;
  guestCharacter?: CharacterId;
}) {
  const selected = useMuseum(state => state.character);
  const view = useMuseum(state => state.view);
  const entered = useMuseum(state => state.entered);
  const character = remote ? guestCharacter : selected;
  // Personal photographs and derived likeness assets remain in the local collection.
  if (import.meta.env.MODE === "personal") {
    if (!remote && (!entered || view !== "third")) return null;
    return <Suspense fallback={null}><PersonalizedVisitorAvatar key={character} remote={remote} character={character} /></Suspense>;
  }
  return <BasicVisitorAvatar remote={remote} guestCharacter={guestCharacter} />;
}
