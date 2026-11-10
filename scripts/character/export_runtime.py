import bpy,pathlib
root=pathlib.Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(root/'.local-museum/character-preview/alex-preview.blend'))
# Keep the face and taper intact; reduce garment tessellation for the museum.
for o in bpy.context.scene.objects:
 if o.type=='MESH' and o.name in {'Blue zip jacket','Tailored trousers','Sneakers'}:
  mod=o.modifiers.new('Runtime garment reduction','DECIMATE');mod.ratio=.32;mod.use_collapse_triangulate=True
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o.type in {'MESH','ARMATURE'}:o.select_set(True)
out=root/'.local-museum/characters';out.mkdir(exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out/'alex.glb'),export_format='GLB',export_apply=True,use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_extras=True,export_yup=True)
