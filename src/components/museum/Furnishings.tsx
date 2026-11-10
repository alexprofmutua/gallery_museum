import { CinemaFurnishings } from "./CinemaInterior";
import { GrandEntrance } from "./GrandEntrance";
import { GallerySeating } from "./GallerySeating";
import { GalleryExhibits } from "./GalleryExhibits";
import { GalleryDisplayCases } from "./GalleryDisplayCase";
import type { MuseumRoom } from "../../content/layout";
import { LivingPortraitCorridor } from "./LivingPortraitCorridor";
import { ForeverConservatory } from "./ForeverConservatory";

export function Furnishings({
  id,
  video,
}: {
  id: MuseumRoom["id"];
  video: HTMLVideoElement | null;
}) {
  if (id === "entrance") return <GrandEntrance />;
  if (id === "gallery")
    return (
      <>
        <GalleryExhibits />
        <GalleryDisplayCases />
        <GallerySeating />
      </>
    );
  if (id === "cinema") return <CinemaFurnishings video={video} />;
  if (id === "corridor") return <LivingPortraitCorridor />;
  if (id === "forever") return <ForeverConservatory />;
  return null;
}
