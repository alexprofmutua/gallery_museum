"""Create the approval-only character from a licensed, skinned humanoid mesh.
Run with Blender's --background --python. Original asset remains untouched.
"""
import bpy, math, json, pathlib
from mathutils import Vector, Matrix, Quaternion, noise
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / '.local-museum/character-preview'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(OUT/'source/base.blend'))
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
body = bpy.data.objects['SuperHero_Male']
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name not in ['SuperHero_Male','Eyes','Eyebrows']:
        bpy.data.objects.remove(o, do_unlink=True)
for b in arm.pose.bones: b.custom_shape = None

def smoothstep(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def deform(p):
    x,y,z=p
    upper=smoothstep(1.5,1.6,z)
    ax=abs(x);nx=ax*.87 if ax<.22 else .22*.87+(ax-.22)*.97
    x=math.copysign(nx,x)*(1-upper)+x*(1+.025*math.exp(-((z-1.735)/.07)**2))*upper
    y*=.89 if .85<z<1.5 else 1
    if z>1.6 and y<-.07:
        nose=math.exp(-((z-1.684)/.025)**2)*math.exp(-(x/.024)**2)
        x*=1+.10*nose;y-=.003*nose
        lips=math.exp(-((z-1.647)/.012)**2)*math.exp(-(x/.032)**2)
        y-=.002*lips
    return Vector((x,y,z))
# Fit geometry and rest joints together so skin weights remain valid.
for o in [body,bpy.data.objects['Eyes'],bpy.data.objects['Eyebrows']]:
    for v in o.data.vertices:v.co=deform(v.co)
bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode='EDIT')
for b in arm.data.edit_bones:
    b.head=deform(b.head);b.tail=deform(b.tail)
bpy.ops.object.mode_set(mode='OBJECT')

def linear(hex):
    values=[int(hex[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values)+(1,)
def material(name,color,rough=.65,metal=0,fabric=False):
    m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;p=n.get('Principled BSDF')
    p.inputs['Base Color'].default_value=linear(color);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if fabric:
        t=n.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=240;t.inputs['Detail'].default_value=2
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.001
        m.node_tree.links.new(t.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m
skin=material('Warm brown skin','805239',.62);skin.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=.055
lip=material('Natural lips','785043',.67)
navy=material('Blue tailored jacket','285F8B',.77,fabric=True)
trim=material('Woven blue ribbing','6791AB',.8,fabric=True)
pants=material('Ink navy trousers','253547',.88,fabric=True)
shoe=material('Navy sneaker uppers','263748',.72)
sole=material('Warm ivory soles','DAD7CE',.88)
hairmat=material('Short charcoal curls','201A17',.89)
browmat=material('Brows','29201A',.86)
whites=material('Warm eye whites','D9CFC0',.38)
iris=material('Dark brown irises','352318',.32)
pupil=material('Pupils','100F0F',.28)
zipmat=material('Brushed zipper','A7B5BD',.38,.5)
body.data.materials.clear()
for m in [skin,lip,pants,navy,shoe]:body.data.materials.append(m)
for p in body.data.polygons:
    c=p.center
    if .12<c.z<1.02:p.material_index=2
    elif 1.02<c.z<1.50 and abs(c.x)<.65:p.material_index=3
    elif c.z<.12:p.material_index=4
    elif 1.63<c.z<1.655 and c.y<-.075 and abs(c.x)<.037:p.material_index=1
    else:p.material_index=0
for name,mat in [('Eyebrows',browmat),('Eyes',whites)]:
    o=bpy.data.objects[name];o.data.materials.clear();o.data.materials.append(mat)
brows=bpy.data.objects['Eyebrows']
for v in brows.data.vertices:v.co.z=1.708+(v.co.z-1.708)*.60
eyes=bpy.data.objects['Eyes'];eyes.data.materials.append(iris);eyes.data.materials.append(pupil)
for p in eyes.data.polygons:
    c=p.center;d=((abs(c.x)-.030)/.010)**2+((c.z-1.697)/.011)**2
    p.material_index=2 if d<.22 and c.y<-.065 else 1 if d<1 and c.y<-.065 else 0

# Garments are fitted copies of the authored body surface, retaining its skinning.
def garment(name,test,mats,offset=.008,subdiv=1):
    o=body.copy();o.data=body.data.copy();bpy.context.collection.objects.link(o);o.name=name
    import bmesh
    bm=bmesh.new();bm.from_mesh(o.data)
    remove=[f for f in bm.faces if not test(f.calc_center_median())]
    bmesh.ops.delete(bm,geom=remove,context='FACES')
    if name != 'Sculpted short curls':
        used=[v for v in bm.verts if v.link_faces]
        for _ in range(4):bmesh.ops.smooth_vert(bm,verts=used,factor=.2,use_axis_x=True,use_axis_y=True,use_axis_z=True)
        for v in used:
            if v.is_boundary:
                if name=='Blue zip jacket' and v.co.z<1.06:v.co.z=1.01
                elif name=='Tailored trousers' and v.co.z<.19:v.co.z=.12
    bm.to_mesh(o.data);bm.free()
    o.data.materials.clear()
    for m in mats:o.data.materials.append(m)
    cached_normals=[v.normal.copy() for v in o.data.vertices]
    for v,normal in zip(o.data.vertices,cached_normals):
        v.co+=normal*offset
    for p in o.data.polygons:p.material_index=0;p.use_smooth=True
    if subdiv:
        sub=o.modifiers.new('Tailored surface','SUBSURF');sub.levels=subdiv;sub.render_levels=subdiv
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_move_up(modifier=sub.name)
    solid=o.modifiers.new('Finished garment edge','SOLIDIFY');solid.thickness=.003
    return o
jacket=garment('Blue zip jacket',lambda c: .995<c.z<1.565 and abs(c.x)<.63 and not (c.z>1.505 and abs(c.x)<.078),[navy,trim],.022)
for v in jacket.data.vertices:
    if abs(v.co.x)>.33:
        v.co+=v.normal*(.0018*math.sin(v.co.x*105+v.co.z*24))
for p in jacket.data.polygons:
    p.material_index=0
trousers=garment('Tailored trousers',lambda c:.115<c.z<1.015,[pants],.023)
shoes=garment('Sneakers',lambda c:c.z<.14,[shoe,sole],.009)
for p in shoes.data.polygons:
    if p.center.z<.035:p.material_index=1

# Reusable scalp-based taper fade, including runtime vertex-colour blending.
import sys
sys.path.insert(0,str(ROOT/'scripts/character'))
from taper_hair import create_taper
hair=create_taper(arm,body)

# Curved details follow the garment rather than a primitive torso.
def detail_curve(name,points,radius,mat,bone='spine_02'):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=radius;c.bevel_resolution=2
    sp=c.splines.new('POLY');sp.points.add(len(points)-1)
    for p,co in zip(sp.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    o=bpy.context.object;g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('Humanoid deformation','ARMATURE');mod.object=arm;o.parent=arm
    for p in o.data.polygons:p.use_smooth=True
    return o
zip_points=[]
for i in range(26):
    z=1.025+i/25*.445
    hit,loc,normal,index=body.ray_cast(Vector((0,-1,z)),Vector((0,1,0)))
    zip_points.append((0,loc.y-.030 if hit else -.11,z))
detail_curve('Jacket zipper',zip_points,.0018,zipmat)
for side in [-1,1]:
    for i in range(4):
        yy=-.035-i*.019
        detail_curve(f'Sneaker laces {side} {i}',[(side*.10-.025,yy,.095),(side*.10+.025,yy+.006,.095)],.0016,sole,'foot_l' if side>0 else 'foot_r')
for o in bpy.context.scene.objects:
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True

# Remove the covered source body to prevent skin and fabric intersections.
import bmesh
bm=bmesh.new();bm.from_mesh(body.data)
covered=[]
for f in bm.faces:
    c=f.calc_center_median()
    under_jacket=.99<c.z<1.56 and abs(c.x)<.635 and not (c.z>1.50 and abs(c.x)<.078)
    if c.z<1.015 or under_jacket:covered.append(f)
bmesh.ops.delete(bm,geom=covered,context='FACES');bm.to_mesh(body.data);bm.free();body.data.update()

# Bake humanoid motion with two-bone IK and planted stance targets.
rest={b.name:b.matrix_local.copy() for b in arm.data.bones}
for p in arm.pose.bones:p.rotation_mode='QUATERNION'
def orient(name,head,tail):
    b=arm.data.bones[name];d=(tail-head).normalized();rd=(b.tail_local-b.head_local).normalized()
    q=rd.rotation_difference(d)@b.matrix_local.to_quaternion()
    m=q.to_matrix().to_4x4();m.translation=head;arm.pose.bones[name].matrix=m
    bpy.context.view_layer.update()
def solve(a,b,head,target,pole):
    l1=arm.data.bones[a].length;l2=arm.data.bones[b].length
    delta=target-head;distance=max(.01,min(delta.length,l1+l2-.001));d=delta.normalized();target=head+d*distance
    along=(l1*l1-l2*l2+distance*distance)/(2*distance)
    height=math.sqrt(max(0,l1*l1-along*along));bend=(pole-d*pole.dot(d)).normalized()
    joint=head+d*along+bend*height
    orient(a,head,joint);orient(b,joint,target)
    return target
clips=[('Idle',2.4,0),('Walk',1.0,1.5),('Run',.62,4.2),('Sprint',.58,6.5),('Turn',3.0,.25)]
scene=bpy.context.scene;scene.render.fps=24
bake_modifiers=[]
for o in scene.objects:
    if o.type=='MESH':
        o.hide_set(True)
        for modifier in o.modifiers:
            bake_modifiers.append((modifier,modifier.show_viewport))
            modifier.show_viewport=False
print('Geometry ready; baking animation',flush=True)
for name,duration,speed in clips:
    action=bpy.data.actions.new(name);arm.animation_data_create();arm.animation_data.action=action
    print('Baking',name,flush=True)
    frames=round(duration*24);action['nominal_speed_mps']=speed
    for frame in range(frames+1):
        scene.frame_set(frame+1);phase=frame/frames;theta=phase*math.tau
        for p in arm.pose.bones:p.matrix_basis=Matrix.Identity(4)
        moving=name!='Idle';running=name in ['Run','Sprint'];turning=name=='Turn'
        root=arm.pose.bones['root'];yaw=theta if turning else 0
        root.matrix=Quaternion((0,0,1),yaw).to_matrix().to_4x4()@rest['root']
        pelvis=arm.pose.bones['pelvis'];pm=rest['pelvis'].copy();pm.translation.z+=(-.085 if running else -.012 if moving else 0)+(abs(math.sin(theta))* .022 if moving else math.sin(theta)*.003)
        if turning:pm=Quaternion((0,0,1),yaw).to_matrix().to_4x4()@pm
        pelvis.matrix=pm;bpy.context.view_layer.update()
        # Chest and head carry small independent motion and forward running lean.
        arm.pose.bones['spine_02'].rotation_quaternion=Quaternion((1,0,0),.10 if running else .012*math.sin(theta))
        arm.pose.bones['spine_03'].rotation_quaternion=Quaternion((0,1,0),.018*math.sin(theta))
        arm.pose.bones['Head'].rotation_quaternion=Quaternion((0,1,0),.012*math.sin(theta+.3))
        bpy.context.view_layer.update()
        for side,suffix,shift in [(1,'l',0),(-1,'r',.5)]:
            legphase=(phase+shift)%1;stance=.30 if running else .62
            amp=(speed*duration*stance/2) if moving and not turning else .035 if turning else 0
            if moving:
                if legphase<stance:
                    u=legphase/stance;fy=-amp+2*amp*u;fz=0
                else:
                    u=(legphase-stance)/(1-stance);u=u*u*(3-2*u);fy=amp-2*amp*u;fz=(.15 if running else .085)*math.sin(math.pi*u)
            else:fy=0;fz=0
            ankle=arm.data.bones['foot_'+suffix].head_local.copy();ankle.y+=fy;ankle.z+=fz+.008
            thigh=arm.pose.bones['thigh_'+suffix];head=thigh.head.copy()
            # Armature-space targets respect the root turn.
            if turning:
                rot=Quaternion((0,0,1),yaw);ankle=rot@ankle
            goal=solve('thigh_'+suffix,'calf_'+suffix,head,ankle,Vector((0,-1,0)))
            foot=rest['foot_'+suffix].copy();foot.translation=goal
            if turning:foot=Quaternion((0,0,1),yaw).to_matrix().to_4x4()@foot;foot.translation=goal
            arm.pose.bones['foot_'+suffix].matrix=foot
            bpy.context.view_layer.update()
            shoulder=arm.pose.bones['upperarm_'+suffix].head.copy()
            swing=math.sin(theta+shift*math.tau)
            arm_offset=Vector((side*.035,(-.13 if running else -.035)+swing*(.16 if running else .105),-.28 if running else -.45))
            if turning:arm_offset=Quaternion((0,0,1),yaw)@arm_offset
            target=shoulder+arm_offset
            solve('upperarm_'+suffix,'lowerarm_'+suffix,shoulder,target,Vector((0,1,-.15)))
            # Relaxed hands, including all articulated fingers.
            for finger in ['index','middle','ring','pinky']:
                for segment in [1,2,3]:
                    p=arm.pose.bones.get(f'{finger}_{segment:02d}_{suffix}')
                    if p:p.rotation_quaternion=Quaternion((1,0,0),.18 if running else .10)
        bpy.context.view_layer.update()
        for p in arm.pose.bones:
            p.keyframe_insert('location',frame=frame+1,group=p.name);p.keyframe_insert('rotation_quaternion',frame=frame+1,group=p.name);p.keyframe_insert('scale',frame=frame+1,group=p.name)
    arm.animation_data.action=None
    track=arm.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=frames+1
    track.mute=True
for modifier,visible in bake_modifiers:modifier.show_viewport=visible
for o in scene.objects:
    if o.type=='MESH':o.hide_set(False)
# Idle pose for mesh export and initial approval renders.
for track in arm.animation_data.nla_tracks:track.mute=True
idle=bpy.data.actions['Idle'];arm.animation_data.action=idle;scene.frame_set(1)
# Export actual skinned GLB, keeping named animations as separate actions.
bpy.ops.object.select_all(action='DESELECT')
for o in list(scene.objects):
    if o.type in {'MESH','ARMATURE'}:o.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT/'alex-preview.glb'),export_format='GLB',export_apply=True,use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_extras=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'alex-preview.blend'))
# Neutral studio, used only for review screenshots, never the museum world.
world=bpy.data.worlds.new('Approval studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.23,.26,.3,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.028));floor=bpy.context.object;floor.name='Studio floor';floor.data.materials.append(material('Studio warm grey','B7B9B5',.9))
def area(name,loc,power,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
area('Softbox key',(-2,-3,4),500,4,(1,.89,.77));area('Cool fill',(2,-1,2.7),260,3,(.78,.86,1));area('Rim',(1,2,3.5),600,3,(1,.93,.82))
camdata=bpy.data.cameras.new('Review camera');camera=bpy.data.objects.new('Review camera',camdata);scene.collection.objects.link(camera);scene.camera=camera;camdata.type='ORTHO';camdata.ortho_scale=2.15
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
for label,location in [('front',(0,-4,1.25)),('three-quarter',(2.5,-4,1.8)),('back',(0,4,1.25)),('left',(-4,0,1.25)),('right',(4,0,1.25))]:
    camera.location=location;camera.rotation_euler=(Vector((0,0,.93))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(label+'.png'));bpy.ops.render.render(write_still=True)
camdata.ortho_scale=.55;camera.location=(.12,-3,1.76);camera.rotation_euler=(Vector((0,-.01,1.69))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.filepath=str(OUT/'face.png');bpy.ops.render.render(write_still=True)
print('CHARACTER_PREVIEW_COMPLETE',str(OUT))
