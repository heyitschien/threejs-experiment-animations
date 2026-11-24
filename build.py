import bpy, math, sys
from mathutils import Vector
from pathlib import Path

out = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
tau = math.tau
pi = math.pi

def pbr(name, color, metal=0, rough=.28, transmission=0, emission=None, brush=0):
    m=bpy.data.materials.new(name)
    s=m.node_tree.nodes.get('Principled BSDF')
    for k,v in {'Base Color':(*color,1),'Metallic':metal,'Roughness':rough,'Transmission Weight':transmission,'IOR':1.47}.items():
        s.inputs[k].default_value=v
    if emission:
        s.inputs['Emission Color'].default_value=(*emission[0],1)
        s.inputs['Emission Strength'].default_value=emission[1]
    if brush:
        nodes=m.node_tree.nodes
        uv=nodes.new('ShaderNodeTexCoord')
        stretch=nodes.new('ShaderNodeVectorMath')
        stretch.operation='MULTIPLY'
        stretch.inputs[1].default_value=(2,120,45)
        noise=nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value=21
        bump=nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value=.10
        bump.inputs['Distance'].default_value=.008
        for a,b in [(uv.outputs['Generated'],stretch.inputs[0]),(stretch.outputs[0],noise.inputs['Vector']),(noise.outputs['Fac'],bump.inputs['Height']),(bump.outputs[0],s.inputs['Normal'])]:
            m.node_tree.links.new(a,b)
    return m

steel=pbr('Satin nickel',(.54,.58,.64),.96,.24,brush=.36)
edge=pbr('Polished titanium',(.38,.44,.53),.97,.16)
gold=pbr('Warm machined brass',(.65,.34,.105),.89,.24)
dark=pbr('Graphite ceramic',(.025,.032,.046),.66,.31)
glass=pbr('Violet optical polymer',(.60,.48,.86),rough=.16,transmission=1)
opaque=pbr('Opaque comparison',(.13,.08,.22),rough=.26)
amber=pbr('Amber filament',(.50,.14,.025),.22,.28,emission=((1,.30,.063),2.8))
blue=pbr('Cool tracer',(.13,.28,.66),.3,.26,emission=((.18,.40,1),.85))
clay=pbr('Neutral clay',(.39,.39,.39),rough=.47)
parts=[]

def center(t):
    a=-1.43+3.35*t
    return Vector((1.84*math.sin(a),1.48*math.cos(a)-.49,.22*math.sin(pi*t)-.22*t))

def basis(t):
    v=(center(t+.0001)-center(t-.0001)).normalized()
    lateral=Vector((-v.y,v.x,0)).normalized()
    return lateral,v.cross(lateral).normalized(),v

def radius(t):
    return .47-.29*t

def surface(t,a,s=1):
    lateral,top,_=basis(t)
    r=radius(t)*s
    return center(t)+lateral*(math.sin(a)*r)+top*(math.cos(a)*r*.76)

def mesh(name,verts,faces,m):
    data=bpy.data.meshes.new(name)
    data.from_pydata(verts,[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    data.materials.append(m)
    for f in data.polygons: f.use_smooth=True
    parts.append(obj)
    return obj

def lattice(name, rows, cols, fn, m, wrap=False, caps=False):
    verts=[fn(i/(rows-1),j/(cols if wrap else cols-1)) for i in range(rows) for j in range(cols)]
    faces=[]
    for i in range(rows-1):
        for j in range(cols if wrap else cols-1):
            a=i*cols+j
            b=i*cols+(j+1)%cols
            faces.append((a,b,b+cols,a+cols))
    if caps:
        faces.extend([tuple(reversed(range(cols))),tuple((rows-1)*cols+j for j in range(cols))])
    o=mesh(name,verts,faces,m)
    import bmesh
    bm=bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(o.data)
    bm.free()
    return o

def thickness(o,w,bevel):
    mod=o.modifiers.new('Wall thickness','SOLIDIFY')
    mod.thickness=w
    mod.offset=0
    mod=o.modifiers.new('Rounded machined edges','BEVEL')
    mod.width=bevel
    mod.segments=3

def tube(name,pts,r,m):
    cu=bpy.data.curves.new(name,'CURVE')
    cu.dimensions='3D'
    cu.bevel_depth=r
    cu.bevel_resolution=2
    cu.use_fill_caps=True
    spl=cu.splines.new('POLY')
    spl.points.add(len(pts)-1)
    for p,v in zip(spl.points,pts):
        p.co=(*v,1)
    o=bpy.data.objects.new(name,cu)
    scene.collection.objects.link(o)
    cu.materials.append(m)
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    parts.append(o)

lattice('Flexible graphite core',65,28,lambda u,v:surface(u,tau*v,.47),dark,True,True)
shell=lattice('Continuous translucent underside',74,38,lambda u,v:surface(u,1.15+4.0*v,.89),glass)
thickness(shell,.045,.008)
for i in range(13):
    t=.04+i*.071
    tube('Recessed rib', [surface(t,1.10+4.1*j/28,.72) for j in range(29)],.019,edge)
for k,a in enumerate([1.48,2.27,3.76,4.82]):
    tube('Internal filament',[surface(t/110,a+.09*math.sin(21*t/110),.73) for t in range(2,109)],.012 if k!=1 else .015,blue if k==1 else amber)
for a in [-1.09,1.09]:
    tube('Continuous brass flange',[surface(j/105,a,.98) for j in range(106)],.025,gold)

for i,(start,end,width,sweep) in enumerate([(.00,.36,1.23,.37),(.30,.68,1.32,-.24),(.62,1.,1.17,.38)]):
    def plate(u,v):
        s=2*v-1
        taper=.82+.18*math.sin(pi*u)
        bias=s*sweep+.23*s*s
        start_weight = u if i == 0 else 1
        end_weight = 1-u if i == 2 else 1
        t=start+(end-start)*(u+.24*bias*start_weight*end_weight)
        a=s*width*taper+.20*math.sin(pi*u)
        lift=1.018+.105*math.cos(s*pi/2)+.17*(1-u)**4
        if i == 1:
            lift += .023*math.cos(s*pi/2)
        return surface(t,a,lift)
    o=lattice(f'Individually swept plate {i+1}',25,25,plate,steel)
    thickness(o,.052,.013)
    for u in [.045,.94]:
        tube('Polished plate lip',[plate(u,j/36) for j in range(37)],.012,edge)
    for v in [.13,.87]:
        loc=plate(.21,v)
        direction=(loc-center(start+(end-start)*.21)).normalized()
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.025,location=loc+direction*.023)
        o=bpy.context.object
        o.name='Inset brass rivet'
        o.data.materials.append(gold)
        parts.append(o)

# Each sucker has a dark cavity, machined lip and inset light.
for i,t in enumerate([.12,.31,.51,.70,.87]):
    a=pi+(-.32 if i%2 else .31)
    root=surface(t,a,.86)
    normal=(root-center(t)).normalized()
    x=basis(t)[2]
    y=normal.cross(x).normalized()
    r=radius(t)*.51
    profile=[(.05,.013),(.44,.014),(.70,.024),(.81,.068),(.98,.087),(1.,.060),(.79,.004),(.66,-.038)]
    def cup(u,v):
        f,h=profile[round(u*(len(profile)-1))]
        return root+(x*math.cos(tau*v)+y*math.sin(tau*v)*.88)*r*f+normal*h
    cup_mesh=lattice('Recessed machined sucker',len(profile),36,cup,gold,True,True)
    cup_mesh.data.materials.append(dark)
    for polygon in cup_mesh.data.polygons:
        if polygon.index < 3*36: polygon.material_index=1
    tube('Sucker inset light',[root+(x*math.cos(tau*j/64)+y*math.sin(tau*j/64)*.88)*r*.82+normal*.07 for j in range(65)],.009,amber)

def aim(o,p):
    o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()

def light(name,pos,power,size,color, target=(0,.35,0),height=None):
    d=bpy.data.lights.new(name,'AREA')
    d.energy=power
    d.shape='RECTANGLE'
    d.size=size
    d.size_y=height or size
    d.color=color
    o=bpy.data.objects.new(name,d)
    scene.collection.objects.link(o)
    o.location=pos
    aim(o,target)

light('Broad neutral key',(-1,-2,4),480,5,(1,.94,.86),height=1.7)
light('Long reflection strip',(2,3,2),570,5,(.68,.81,1),height=.55)
light('Underside softbox',(-2,-1,-3.4),330,4,(.82,.88,1),height=1.6)
light('Warm rim',(2,-2,-1.6),265,3,(1,.72,.44),height=.60)
scene.world=bpy.data.worlds.new('Dark neutral studio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.047,.051,.066,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
scene.render.engine='CYCLES'
scene.cycles.samples=30
scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED'
scene.render.threads=10
scene.cycles.transmission_bounces=8

camera_data=bpy.data.cameras.new('Inspection camera')
camera=bpy.data.objects.new('Inspection camera',camera_data)
scene.collection.objects.link(camera)
scene.camera=camera
camera.data.type='ORTHO'
camera.data.ortho_scale=5.05
target=(0,.24,0)
def view(pos):
    camera.location=pos
    aim(camera,target)

hero=(1.4,-5.2,2.55)
under=(-1.0,-4.7,-3.1)
view(hero)
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'section.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'material-study.blend'))

def render(name,pos,samples=30,width=980,height=690):
    view(pos)
    scene.cycles.samples=samples
    scene.render.resolution_x=width
    scene.render.resolution_y=height
    scene.render.filepath=str(out/name)
    bpy.ops.render.render(write_still=True)

render('armor.png',hero)
render('underside.png',under)
shell.data.materials[0]=opaque
render('opaque.png',under)
shell.data.materials[0]=glass
scene.view_layers[0].material_override=clay
render('clay.png',under)
scene.view_layers[0].material_override=None
if '--orbit' in sys.argv:
    (out/'frames').mkdir(exist_ok=True)
    for i in range(48):
        f=i/47
        elevation=.59-1.22*f
        azimuth=-.24+.65*f
        planar=5.6*math.cos(elevation)
        render(f'frames/{i:03d}.png',(planar*math.sin(azimuth),-planar*math.cos(azimuth),5.6*math.sin(elevation)),12,640,450)
