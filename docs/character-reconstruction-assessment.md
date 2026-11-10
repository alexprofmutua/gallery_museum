# Personal character: reference assessment and modeling handoff

Status: reference assessment completed. No likeness model, rig, animations or GLB has been created. No avatar code or museum content was changed for this assessment.

## What is available

The current personal catalog contains 42 photograph entries: 35 Gallery entries and seven graduate portraits. The seven graduate portraits and several other entries depict a different subject. There are 24 candidate entries showing the intended person or an inset/collage that includes him. This is a visual reference selection using the user's stated context, not identity verification. It includes two older reference photos, a tiny video-call inset and a collage.

SHA-256 comparison found three exact duplicate pairs among the catalog display files:

- `at-the-station` and `photo-21`.
- `out-in-the-sun` and `photo-18`.
- `seated-together` and `photo-22`.

There are therefore 21 byte-distinct candidate entries before excluding historical and unsuitable material. Other photographs may be similar captures or resized versions; they are not automatically independent reconstruction views. The removed `sunset-friends` photograph still exists on disk but was deliberately excluded from the reference selection.

The project contains no GLB, glTF, FBX, VRM or Blender character asset outside dependencies. `VisitorAvatar.tsx` currently assembles primitives and animates limbs with a sine wave. Recolouring or texturing that geometry cannot satisfy the requested result.

Blender, COLMAP, MeshLab and Assimp were not found in the checked executable paths. `/Applications/Blender.app` and `/Applications/MakeHuman.app` were absent. No connected 3D reconstruction/generation tool was available. Installing Blender alone would not create a validated likeness, a finished body or production-quality animation.

## Local reference package

The ignored `.local-museum/character-reference/` folder contains:

- `contact-sheet.jpg` and `all-photos.html`: all 42 catalog entries with stable numbers and image dimensions.
- `assessment.json`: source paths, hashes, duplicate groups, selection notes and missing coverage.
- `selected-originals/`: nine copies of the best available original files, without modifying them. These include source images up to 3840 pixels tall, rather than only the reduced museum display copies.

No photos were uploaded to an external service. The reference package includes original couple photographs; an artist must use the subject-location notes and must not model the other people.

| File ID | Use | Limitation |
| --- | --- | --- |
| `garden-selfie` | Primary outdoor face reference | Slight head tilt and phone perspective |
| `photo-11` | Primary higher-resolution outdoor face reference | Camera elevated; mouth partly open |
| `on-the-grass` | Primary alternate face reference | Head roll and selfie perspective |
| `photo-20` | Expression and hair reference | Smiling; elevated camera |
| `photo-12` | Secondary facial shape | Strong pink light contaminates skin colour |
| `photo-14` | Secondary three-quarter shape | Wide-angle framing and tilt |
| `photo-04` | Body and clothing | Mirror view; possible horizontal reversal |
| `photo-10` | Full-body clothing and silhouette | Low angle changes apparent proportions |
| `at-the-station` | Full-body pose and proportions | Phone pose; face detail limited |

Visible references support a short, tightly curled hairstyle and light facial hair. Preserve the individual hairline, facial proportions and asymmetry supported by the photographs. Do not turn the reference into a generic default head. Do not infer ethnicity, exact height, unseen anatomy, pore detail or the correct side of facial asymmetries from these photos.

## Suitability

The references are useful for an artist-guided likeness, especially from the front. They are not a controlled photogrammetry capture. They differ in pose, expression, lighting, clothing, camera distance and likely lens characteristics. Most useful faces are frontal or modest three-quarter views. Neither full side profile nor the back of the head is reliably covered. Hand and foot details are inadequate for identity-specific modeling. Pink indoor lighting and outdoor shadows cannot be treated as a clean skin albedo map.

A photo-guided head fit can produce a candidate likeness. It cannot establish that unobserved profiles, the skull rear, clothing backs and skin microdetail are accurate. Those areas require new photographs or explicit acceptance of artist inference. No complete, accurate reconstruction can be claimed from the current evidence.

For stronger coverage, capture a neutral face at eye level: front, both three-quarter views, both full profiles and back of head. Keep expression, hairstyle and lighting consistent; avoid a close wide-angle selfie lens, beauty filters and portrait-mode blur. Add full-body front/back/side references in the chosen outfit, relaxed hands, shoes, and a measured height. A full photogrammetry route requires a substantially denser overlapping capture around a still subject, not six isolated photos.

## Recommended external modeling step

Commission or perform a supervised likeness build in Blender with KeenTools FaceBuilder, followed by a character artist's body, hair, clothing and rigging work. FaceBuilder fits a head to photographs; it does not complete the entire requested character by itself. Its official product page documents multi-photo fitting, texture blending, adjustable detail levels and macOS Apple Silicon support: [FaceBuilder](https://keentools.io/products/facebuilder-for-blender).

Use this sequence:

1. Fit the head against the selected original photographs with perspective cameras. Preserve a neutral rest shape, account for expressions, and document mirrored inputs. Compare front and both three-quarter views before proceeding. Obtain profiles before claiming side-view fidelity.
2. Refine facial anatomy and eye/mouth topology. Build separate eyeballs, lids, teeth and mouth interior where required. Reproject textures, remove baked lighting and inspect skin under neutral light.
3. Fit a licensed anatomical body mesh to the full-body references. Model hair and clothing with proper topology and folds. Use a real game hairstyle built from groom-derived cards or suitable geometry; exportable runtime hair must not depend on Blender-only particles. The outfit and approximate body measurements need user approval where references are incomplete.
4. Skin the mesh to a humanoid skeleton, including fingers, feet and deformation joints. Inspect shoulders, elbows, knees, hips and neck through their movement ranges. Bake any control-rig constraints into deform-bone animation for export.
5. Create or retarget idle/breathing, walk, run, sprint, turns and directional movement clips. Match the clips to travel speed and perform contact cleanup. A generated rig alone is not proof of good animation.
6. Export the actual finished mesh, skeleton, textures and baked animations as a self-contained GLB. Blender's official exporter supports skinning and animation: [glTF export manual](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html).

The alternative is a controlled full-body scan, followed by cleanup, retopology, texturing and the same rig/animation work. The existing casual photos should not be sent into an automatic scan pipeline with an expectation of an accurate complete body. Official capture guidance calls for overlapping, high-quality views and moving around the subject: [RealityScan capture guidance](https://rshelp.capturingreality.com/en-US/tutorials/takingpictures.htm).

No external service upload, paid license, asset purchase or software installation was performed. A photo-to-3D service can provide a draft, but its output still requires likeness review, topology/rig inspection and animation work. A 2D generated portrait or a Gaussian-splat portrait would not satisfy the requested rigged GLB character.

## Runtime delivery contract

Deliver `alex.glb`, the editable source project, texture sources and the license/redistribution information for any base body, hair, clothing and animation assets. Keep the model in private/local asset storage until publication is explicitly authorized.

- Metre units, feet at the origin, Y up and forward aligned to the museum's -Z convention. State any required import rotation explicitly.
- A real skinned mesh with a humanoid skeleton, correct bind pose and clean normals/UVs. Keep skin influences compatible with the chosen WebGL skinning path.
- Baked, named clips for idle/breathing, walk, run, sprint, turns and the required directional motion. Supply in-place clips and document their intended travel speeds and measured stride lengths.
- PBR base colour, normal and roughness textures; eyes, hair, skin and clothing must remain visually distinct. Validate the exported GLB in Three.js rather than relying on a Blender render.
- Proposed starting budgets, not achieved measurements: roughly 40k–80k visible triangles, 2K principal texture sets and no more than eight material groups. Tune after profiling the actual model; use a lower-detail variant on weaker devices if needed.

The museum currently moves at 4.2 m/s normally and 6.5 m/s with Shift. These are running and sprinting speeds, not a natural walking pace. At those speeds the controller needs matching run/sprint clips. Playing a walk cycle at either speed would produce foot sliding or unnaturally rapid steps. Retain the requested faster controls unless the user explicitly chooses a slower walking mode.

Integration should keep the existing collision body, first/third-person camera sweep, door proximity rules, media interactions and shared-visit pose messages. Use controller position as the movement authority; do not also apply root translation from an in-place animation. Blend animation from actual horizontal speed and heading, and implement or bake foot-contact correction. Independently clone skeletons for multiple visitors. Do not replace the other visitor's identity with this likeness without instructions.

## Acceptance gate

The work is not complete until the actual delivered model has:

- Front, back, left and right renders under neutral light, plus face comparison crops using the supplied references.
- User-reviewed likeness, including an explicit distinction between observed and inferred geometry.
- Inspected hands, feet, clothing seams/folds and joint deformation.
- Idle, gait, turn, start/stop and directional-motion checks at the museum's actual travel speeds, with foot-contact review.
- Export validation, third-person museum screenshots, resource counts and measured moving-frame performance on the target hardware.
- Regression checks for camera collision, doorway clearance, first-person hiding, films, photographs, letter interactions and shared visits where available.

None of the model, animation or in-museum character acceptance checks has been performed: the required finished asset does not yet exist. No replacement character screenshots or 60 FPS avatar claims are being presented.
