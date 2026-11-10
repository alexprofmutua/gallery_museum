import { useMemo } from "react";
import { exhibitLayout } from "../../content/exhibitLayout";
import { Path, Shape } from "three";
import { Label } from "./Exhibit";
import { frameShadowTexture, surfaceTexture } from "./surfaceTextures";

function rectangle(shape: Path, width: number, height: number) {
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
}

export function ExhibitionFrame({
  width,
  height,
  selected,
  accent,
  title,
  number,
}: {
  width: number;
  height: number;
  selected: boolean;
  accent: boolean;
  title: string;
  number: number | string;
}) {
  const rail = Math.min(0.073, width * 0.1, height * 0.1);
  const profile = useMemo(() => {
    const shape = new Shape();
    rectangle(shape, width, height);
    const opening = new Path();
    rectangle(opening, width - rail * 2, height - rail * 2);
    shape.holes.push(opening);
    return shape;
  }, [height, rail, width]);
  const bevel = Math.min(0.012, rail / 4);
  const profileDepth = useMemo(
    () => ({
      depth: 0.051,
      bevelEnabled: true,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 1,
    }),
    [bevel],
  );
  const plaqueWidth = Math.min(exhibitLayout.plaqueMaxWidth, width);
  const numberWidth = 0.43;
  return (
    <>
      <mesh position={[0.025, -0.035, 0.012]}>
        <planeGeometry args={[width + 0.22, height + 0.22]} />
        <meshBasicMaterial map={frameShadowTexture()} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.067]} castShadow>
        <extrudeGeometry args={[profile, profileDepth]} />
        <meshStandardMaterial
          color={selected ? "#ba955d" : accent ? "#79563a" : "#34261f"}
          metalness={accent ? 0.16 : 0.03}
          roughness={0.31}
          bumpMap={surfaceTexture("wood")}
          bumpScale={0.012}
        />
      </mesh>
      <mesh position={[0, 0, 0.106]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#f1eade" roughness={0.96} bumpMap={surfaceTexture("fabric")} bumpScale={0.004} />
      </mesh>
      <Label
        text={typeof number === "number" ? String(number).padStart(2, "0") : number}
        emphasis
        position={[-plaqueWidth / 2 + numberWidth / 2, -height / 2 - exhibitLayout.plaqueOffset, exhibitLayout.plaqueFront]}
        size={[numberWidth, exhibitLayout.plaqueHeight]}
        color="#fff1d6"
        paper="#3b2c20"
      />
      <Label
        text={title.toUpperCase()}
        position={[(numberWidth + 0.03) / 2, -height / 2 - exhibitLayout.plaqueOffset, exhibitLayout.plaqueFront]}
        size={[plaqueWidth - numberWidth - 0.03, exhibitLayout.plaqueHeight]}
        color="#443b2c"
        paper="#ebe0c9"
      />
    </>
  );
}
