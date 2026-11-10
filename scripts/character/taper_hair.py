"""Short textured crop with a vertex-colour taper; retains the authored head topology."""
import bpy, bmesh, math
from mathutils import noise

def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)

def hairline(p):
    front=smooth(-.025,.075,-p.y)
    side=smooth(.045,.09,abs(p.x))
    return 1.655+.035*side+.110*front

def create_taper(arm,body):
    for obj in list(bpy.data.objects):
        if obj.name in {'Sculpted short curls','Textured taper fade'}:bpy.data.objects.remove(obj,do_unlink=True)
    hair=body.copy();hair.data=body.data.copy();bpy.context.collection.objects.link(hair);hair.name='Textured taper fade';hair.data.name='Taper scalp surface'
    # Shape the existing scalp rather than assembling individual primitive curls.
    for mod in list(hair.modifiers):hair.modifiers.remove(mod)
    bm=bmesh.new();bm.from_mesh(hair.data)
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_center_median().z<hairline(f.calc_center_median())],context='FACES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
    bm.to_mesh(hair.data);bm.free();hair.data.update()
    bpy.context.view_layer.objects.active=hair
    sub=hair.modifiers.new('Smooth scalp topology','SUBSURF');sub.levels=2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    normals=[v.normal.copy() for v in hair.data.vertices]
    colours=[]
    skin=(.21586,.08438,.04092);black=(.006,.005,.004)
    for v,n in zip(hair.data.vertices,normals):
        p=v.co.copy();front=smooth(.025,.075,-p.y)
        width=.055*(1-front)+.014*front
        density=smooth(hairline(p),hairline(p)+width,p.z)
        top=smooth(1.752,1.805,p.z)
        grain=noise.noise_vector(p*225).x
        thickness=.0007+density*(.0015+top*.016)+top*grain*.0018
        v.co+=n*thickness
        # Skin-coloured lower edge becomes dark stubble, then dense short curls.
        pigment=min(1,max(0,density*.98+grain*.035*density))
        colours.append(tuple(skin[i]*(1-pigment)+black[i]*pigment for i in range(3))+(1,))
    hair.data.materials.clear()
    mat=bpy.data.materials.new('Taper fade - skin to charcoal');mat.use_nodes=True
    nodes=mat.node_tree.nodes;p=nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.92
    col=nodes.new('ShaderNodeVertexColor');col.layer_name='TaperDensity'
    mat.node_tree.links.new(col.outputs['Color'],p.inputs['Base Color'])
    hair.data.materials.append(mat)
    attr=hair.data.color_attributes.new(name='TaperDensity',type='FLOAT_COLOR',domain='CORNER')
    for loop in hair.data.loops:attr.data[loop.index].color=colours[loop.vertex_index]
    for polygon in hair.data.polygons:polygon.use_smooth=True;polygon.material_index=0
    for group in list(hair.vertex_groups):hair.vertex_groups.remove(group)
    group=hair.vertex_groups.new(name='Head');group.add(list(range(len(hair.data.vertices))),1,'REPLACE')
    mod=hair.modifiers.new('Follow head rig','ARMATURE');mod.object=arm;hair.parent=arm
    return hair
