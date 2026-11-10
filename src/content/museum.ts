import { z } from "zod";
import config from "./museum.config.json";
import memories from "./memories.json";
import cinematicContent from "./cinematics.json";
import { corridorRoom, rooms } from "./layout";
const mediaPath = z
  .string()
  .regex(/^\/images\/[a-z0-9_./-]+\.(svg|png|jpe?g|webp|avif)$/i)
  .refine(
    (path) => !path.split("/").includes(".."),
    "Use a local display asset without parent-directory traversal.",
  );
export const memorySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    roomId: z.enum(["gallery", "corridor"]).default("gallery"),
    title: z.string().trim().min(1).max(140),
    caption: z.string().trim().min(1).max(1000),
    story: z.string().max(30000).default(""),
    alt: z.string().trim().min(1).max(500),
    date: z.iso.date().optional(),
    image: mediaPath,
    displayOrder: z.number().int().positive(),
    section: z.literal("graduation").optional(),
    sectionOrder: z.number().int().positive().optional(),
    placeholder: z.boolean().default(false),
    position: z.tuple([
      z.number().min(-7).max(7),
      z.number().min(0.8).max(4.8),
      z
        .number()
        .min(corridorRoom.minZ + 0.1)
        .max(9.9),
    ]),
    rotationY: z.number().min(-Math.PI).max(Math.PI).default(0),
    frame: z.object({
      width: z.number().positive().max(6),
      height: z.number().positive().max(4),
    }),
    activationRadius: z.number().min(1).max(5).default(3.4),
  })
  .superRefine((memory, ctx) => {
    if ((memory.section === "graduation") !== (memory.sectionOrder !== undefined))
      ctx.addIssue({ code: "custom", path: ["sectionOrder"], message: "A graduation photo needs its own section number." });
    const room = rooms.find((item) => item.id === memory.roomId)!;
    if (
      Math.abs(memory.position[0]) > room.halfWidth ||
      memory.position[2] < room.minZ + 0.1 ||
      memory.position[2] > room.maxZ - 0.1
    )
      ctx.addIssue({
        code: "custom",
        path: ["position"],
        message: "The frame must be inside its room.",
      });
  });
export const museumSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    dedication: z.string().min(1),
    memories: z.array(memorySchema).min(1),
    entrance: z
      .object({
        source: z.string().regex(/^\/media\/[a-z0-9-]+\.mp4$/),
        poster: z.string().regex(/^\/media\/[a-z0-9-]+\.jpg$/),
        aspectRatio: z.number().positive().max(5),
        description: z.string().trim().min(1).max(500),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    const graduates = value.memories.filter(memory => memory.section === "graduation");
    if (new Set(graduates.map(memory => memory.sectionOrder)).size !== graduates.length)
      ctx.addIssue({ code: "custom", path: ["memories"], message: "Graduation photo numbers must be unique." });
    for (const key of ["id", "displayOrder"] as const)
      if (
        new Set(value.memories.map((m) => m[key])).size !==
        value.memories.length
      )
        ctx.addIssue({
          code: "custom",
          path: ["memories"],
          message: `Memory ${key} values must be unique.`,
        });
  });
const sampleMuseum = museumSchema.parse({ ...config, memories });
sampleMuseum.memories.sort((a, b) => a.displayOrder - b.displayOrder);
export let museum = sampleMuseum;
export type Memory = z.infer<typeof memorySchema>;
export function formatMemoryNumber(memory: Memory) {
  return memory.section === "graduation"
    ? `G${String(memory.sectionOrder).padStart(2, "0")}`
    : String(memory.displayOrder).padStart(2, "0");
}
export function memorySectionTitle(memory: Memory) {
  return memory.section === "graduation" ? "THE GRADUATE" : "THE GALLERY OF US";
}

export function formatMemoryDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

const cinematicMedia = z
  .string()
  .regex(/^\/media\/[a-z0-9-]+\.(mp4|mp3|vtt|jpg)$/);
const filmSchema = z.object({
  title: z.string().trim().min(1),
  source: cinematicMedia.endsWith(".mp4"),
  captions: cinematicMedia.endsWith(".vtt"),
  poster: cinematicMedia.endsWith(".jpg"),
  description: z.string().trim().min(1),
  personal: z.boolean().optional(),
  durationSeconds: z.number().finite().positive().optional(),
});
export type CinemaFilm = z.infer<typeof filmSchema>;
export const cinematicsSchema = z.object({
  film: filmSchema,
  additionalFilms: z.array(filmSchema).max(30).default([]),
  music: cinematicMedia.endsWith(".mp3"),
  conservatory: z
    .object({
      ivoryRose: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i)
        .default("#fff1e1"),
      blushRose: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i)
        .default("#e8a2ad"),
    })
    .prefault({}),
  letter: z.object({
    title: z.string().trim().min(1),
    paragraphs: z.array(z.string().trim().min(1)).min(1),
    dedication: z.string().trim().optional(),
  }),
});

const sampleCinematics = cinematicsSchema.parse(cinematicContent);
export let cinematics = sampleCinematics;
let privateAssets: Record<string, string> | null = null;

export function assetUrl(path: string) {
  return privateAssets ? privateAssets[path] : path;
}

export function installPrivateCatalog(
  catalog: unknown,
  assets: unknown,
  origin: string,
) {
  const parsed = catalogSchema.parse(catalog);
  const links = z.record(z.string(), z.url()).parse(assets);
  const { film, additionalFilms, music } = parsed.cinematics;
  const paths = [
    ...parsed.museum.memories.map((item) => item.image),
    ...[film, ...additionalFilms].flatMap(({ source, poster, captions }) => [
      source,
      poster,
      captions,
    ]),
    music,
    ...(parsed.museum.entrance
      ? [parsed.museum.entrance.source, parsed.museum.entrance.poster]
      : []),
  ];
  for (const path of paths) {
    const url = new URL(links[path]);
    if (
      url.origin !== origin ||
      !(
        url.pathname ===
        `/storage/v1/object/sign/museum-private/${parsed.museum.id}${path}`
      ) ||
      !url.searchParams.has("token") ||
      url.username ||
      url.password
    )
      throw new Error("Invalid private media link");
  }
  setCatalog(parsed);
  privateAssets = links;
}

const catalogSchema = z.object({
  museum: museumSchema,
  cinematics: cinematicsSchema,
});

export async function loadPersonalCatalog() {
  const response = await fetch("/museum.json");
  if (!response.ok) throw new Error("The local museum catalog is unavailable.");
  setCatalog(catalogSchema.parse(await response.json()));
}

function setCatalog(catalog: z.infer<typeof catalogSchema>) {
  catalog.museum.memories.sort((a, b) => a.displayOrder - b.displayOrder);
  museum = catalog.museum;
  cinematics = catalog.cinematics;
}

export function clearPrivateCatalog() {
  privateAssets = null;
  museum = sampleMuseum;
  cinematics = sampleCinematics;
}
