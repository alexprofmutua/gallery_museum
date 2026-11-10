"""Approval-only Starfish character; authored CC0 female base, local photo references."""
import bpy,bmesh,math,pathlib
from mathutils import Vector,noise
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'.local-museum/girlfriend-preview';SOURCE=OUT/'source'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE/'Superhero_Female_FullBody.gltf'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');body=bpy.data.objects['Superhero_Female']
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name not in {'Superhero_Female','Eyes','Eyebrows'}:bpy.data.objects.remove(o,do_unlink=True)
for b in arm.pose.bones:b.custom_shape=None

def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def fit(p):
 x,y,z=p
 # Slim shoulders and soften the stylized base's cheeks/jaw, guided by portraits.
 ax=abs(x);width=.88 if z<1.49 else 1
 x*=width
 if 1.15<z<1.48 and y<0:y*=.87
 if z>1.53:
  x*=1+.075*math.exp(-((z-1.635)/.045)**2)+.08*math.exp(-((z-1.575)/.025)**2)
  if y<-.05:y-=.0025*math.exp(-((z-1.595)/.018)**2)*math.exp(-(x/.035)**2)
 return Vector((x,y,z))
for o in [body,bpy.data.objects['Eyes'],bpy.data.objects['Eyebrows']]:
 for v in o.data.vertices:v.co=fit(v.co)
bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
for b in arm.data.edit_bones:b.head=fit(b.head);b.tail=fit(b.tail)
bpy.ops.object.mode_set(mode='OBJECT')

def colour(h):
 vals=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)+(1,)
def mat(name,h,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=colour(h);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
coral=mat('Soft coral cotton','C67D78');cream=mat('Warm ivory trousers','DFD5C2');sole=mat('Ivory sneaker soles','DAD6CC');shoe=mat('Rose taupe sneakers','A48982');hairmat=mat('Dark braided hair','1B1514',.87);gold=mat('Small gold jewellery','C7A564',.32,.7);pink=mat('Rose pendant','BE7994',.38)
# Warm brown skin and authored facial geometry; keep the original brown-eye texture.
skin=mat('Warm brown skin','79533E',.68)
body.data.materials.clear();body.data.materials.append(skin)
bpy.data.objects['Eyebrows'].data.materials.clear();bpy.data.objects['Eyebrows'].data.materials.append(mat('Soft natural brows','35261F',.9))
for v in bpy.data.objects['Eyebrows'].data.vertices:
 v.co.z=1.665+(v.co.z-1.671)*.55
 v.co.x*=.94
for o in [body,bpy.data.objects['Eyebrows']]:
 for f in o.data.polygons:f.material_index=0;f.use_smooth=True
for f in bpy.data.objects['Eyes'].data.polygons:f.use_smooth=True

def top_region(c):return .965<c.z<1.515 and abs(c.x)<.34 and not(c.z>1.465 and abs(c.x)<.072)
def garment(name,region,material,offset=.012):
 o=body.copy();o.data=body.data.copy();bpy.context.collection.objects.link(o);o.name=name
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.delete(bm,geom=[f for f in bm.faces if not region(f.calc_center_median())],context='FACES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
 # Smooth the cut boundary rather than leaving a serrated sleeve/neckline.
 boundary=[v for v in bm.verts if v.is_boundary]
 for _ in range(4):bmesh.ops.smooth_vert(bm,verts=boundary,factor=.4,use_axis_x=True,use_axis_y=True,use_axis_z=True)
 for v in boundary:
  if name=='Coral short sleeve top' and v.co.z>1.43 and abs(v.co.x)<.10:v.co.z=1.47
 bm.to_mesh(o.data);bm.free();o.data.update();o.data.materials.clear();o.data.materials.append(material)
 normals=[v.normal.copy() for v in o.data.vertices]
 for v,n in zip(o.data.vertices,normals):
  v.co+=n*offset
  if name=='Coral short sleeve top' and v.co.y<-.02:
   z=v.co.z;x=v.co.x
   drape=-(.105+.035*math.exp(-((z-1.33)/.14)**2))*math.sqrt(max(.05,1-(x/.23)**2))
   weight=smooth(.98,1.08,z)*(1-smooth(1.43,1.49,z))*smooth(.02,.06,-v.co.y)
   v.co.y=v.co.y*(1-weight)+min(v.co.y,drape)*weight
 for f in o.data.polygons:f.material_index=0;f.use_smooth=True
 sub=o.modifiers.new('Clothing surface','SUBSURF');sub.levels=1
 solid=o.modifiers.new('Finished hem','SOLIDIFY');solid.thickness=.003
 dec=o.modifiers.new('Garment budget','DECIMATE');dec.ratio=.4
 return o
shirt=garment('Coral short sleeve top',top_region,coral,.016)
trousers=garment('Ivory trousers',lambda c:.10<c.z<.994,cream,.018)
# Footwear shells use a shaped shoe loft, leaving the authored human mesh intact.
for side,suffix in [(1,'l'),(-1,'r')]:
 verts=[];faces=[];rings=11;around=12;cx=side*.106
 for i in range(rings):
  u=i/(rings-1);y=-.145+.255*u
  width=.047*(.36+.64*math.sin(math.pi*(.06+.88*u))**.45)
  height=.052+.055*smooth(.35,.8,u)
  for j in range(around):
   a=j*math.tau/around;verts.append((cx+width*math.cos(a),y,.006+height*.5*(1+math.sin(a))))
 for i in range(rings-1):
  for j in range(around):faces.append((i*around+j,i*around+(j+1)%around,(i+1)*around+(j+1)%around,(i+1)*around+j))
 faces.extend([tuple(reversed(range(around))),tuple((rings-1)*around+j for j in range(around))])
 mesh=bpy.data.meshes.new('Rounded sneaker shell');mesh.from_pydata(verts,[],faces);mesh.materials.append(shoe);mesh.materials.append(sole)
 o=bpy.data.objects.new('Sneaker '+suffix,mesh);bpy.context.collection.objects.link(o)
 for f in mesh.polygons:f.use_smooth=True;f.material_index=1 if f.center.z<.023 else 0
 group=o.vertex_groups.new(name='foot_'+suffix);group.add(list(range(len(verts))),1,'REPLACE');mod=o.modifiers.new('Foot rig','ARMATURE');mod.object=arm;o.parent=arm
 sub=o.modifiers.new('Shoe surface','SUBSURF');sub.levels=1

# Remove covered skin, keeping hands, forearms, neck and face.
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_center_median().z<.99 or top_region(f.calc_center_median())],context='FACES')
for v in bm.verts:
 if v.is_boundary and 1.40<v.co.z<1.51 and abs(v.co.x)<.09:v.co.z=1.43
bm.to_mesh(body.data);bm.free()

# Close-fitting braided scalp derived from the authored head mesh.
scalp=body.copy();scalp.data=body.data.copy();bpy.context.collection.objects.link(scalp);scalp.name='Braided scalp'
for mod in list(scalp.modifiers):scalp.modifiers.remove(mod)
def hairline(p):return 1.600+.024*smooth(.04,.09,abs(p.x))+.105*smooth(-.025,.075,-p.y)
bm=bmesh.new();bm.from_mesh(scalp.data);bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_center_median().z<hairline(f.calc_center_median())],context='FACES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001);bm.to_mesh(scalp.data);bm.free();scalp.data.update()
scalp.data.materials.clear();scalp.data.materials.append(hairmat)
for f in scalp.data.polygons:f.material_index=0;f.use_smooth=True
for g in list(scalp.vertex_groups):scalp.vertex_groups.remove(g)
g=scalp.vertex_groups.new(name='Head');g.add(list(range(len(scalp.data.vertices))),1,'REPLACE')
sub=scalp.modifiers.new('Scalp surface','SUBSURF');sub.levels=2
bpy.context.view_layer.objects.active=scalp;bpy.ops.object.modifier_apply(modifier=sub.name)
ns=[v.normal.copy() for v in scalp.data.vertices]
for v,n in zip(scalp.data.vertices,ns):v.co+=n*.003
mod=scalp.modifiers.new('Follow head','ARMATURE');mod.object=arm
dec=scalp.modifiers.new('Scalp budget','DECIMATE');dec.ratio=.4

def mesh_curves(name,paths,radius,material,bone='Head'):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=1;c.bevel_depth=radius;c.bevel_resolution=0
 for points in paths:
  sp=c.splines.new('POLY');sp.points.add(len(points)-1)
  for p,co in zip(sp.points,points):p.co=(*co,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');o=bpy.context.object
 g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Humanoid skinning','ARMATURE');mod.object=arm;o.parent=arm
 for f in o.data.polygons:f.use_smooth=True
 return o
# Twenty-eight plaits, each formed by three interwoven strands. Front roots sweep
# over the crown; lengths fall behind the ears/back, keeping the face unobstructed.
paths=[]
for index in range(28):
 angle=2*math.pi*index/28
 x=.084*math.sin(angle);y=.026-.086*math.cos(angle);z=1.688+.045*max(0,math.cos(angle))
 endz=1.055+.12*(.5+.5*math.sin(index*2.17));endx=x*1.42;endy=.19+.025*math.cos(angle)
 for strand in range(3):
  points=[]
  for k in range(41):
   t=k/40
   if t<.37:
    u=t/.37;yy=y+(.142-y)*u;xx=x*(1+.12*u);zz=z+.045*math.sin(math.pi*u)-.055*u
    hit,location,normal,_=body.ray_cast(Vector((xx,yy,2.1)),Vector((0,0,-1)))
    if hit and location.z>1.54:zz=location.z+.005
   else:
    u=(t-.37)/.63;yy=.142+(endy-.142)*u;xx=x*1.12+(endx-x*1.12)*u+.008*math.sin(u*math.pi);zz=z-.055+(endz-z+.055)*u
   twist=t*math.tau*13+strand*math.tau/3;points.append((xx+.0018*math.cos(twist),yy+.0018*math.sin(twist),zz))
  paths.append(points)
mesh_curves('Long dark braids',paths,.00145,hairmat)
# Small hoop earrings and a pendant echo the reference portraits.
paths=[]
for side in [-1,1]:paths.append([(side*.093+.008*math.cos(t),-.005,1.605+.012*math.sin(t)) for t in [i*math.tau/32 for i in range(33)]])
mesh_curves('Small gold earrings',paths,.0012,gold)
necklace=[(-.065+.13*i/40,-.105-.054*math.sin(math.pi*i/40),1.45-.085*math.sin(math.pi*i/40)) for i in range(41)]
mesh_curves('Fine gold necklace',[necklace],.0008,gold,'spine_03')
mesh_curves('Rose pendant',[[(.006*math.cos(t),-.163,1.357+.009*math.sin(t)) for t in [i*math.tau/24 for i in range(25)]]],.0022,pink,'spine_03')
# Reuse the existing locally authored motion clips on the matching humanoid rig.
with bpy.data.libraries.load(str(ROOT/'.local-museum/character-preview/alex-preview.blend'),link=False) as (src,dst):dst.actions=[n for n in src.actions if n in ['Idle','Walk','Run','Sprint','Turn']]
arm.animation_data_create()
for action in dst.actions:
 track=arm.animation_data.nla_tracks.new();track.name=action.name;strip=track.strips.new(action.name,1,action);track.mute=True
arm.animation_data.action=bpy.data.actions.get('Idle');bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o.type in {'MESH','ARMATURE'}:o.select_set(True)
for image in bpy.data.images:
 if image.size[0]>1024 or image.size[1]>1024:
  factor=1024/max(image.size);image.scale(max(1,int(image.size[0]*factor)),max(1,int(image.size[1]*factor)))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'starfish-preview.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'starfish-preview.glb'),export_format='GLB',export_apply=True,use_selection=True,export_animations=True,export_force_sampling=False,export_animation_mode='ACTIONS',export_skins=True,export_yup=True)
print('STARFISH_PREVIEW_COMPLETE',flush=True)
