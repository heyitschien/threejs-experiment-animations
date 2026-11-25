"""Living Window v0.2 envelope model. Millimetres; x width, y depth (+ indoors), z height. Not fabrication CAD."""
from pathlib import Path
import json, math
import numpy as np
import trimesh
import cadquery as cq
OUT=Path(__file__).resolve().parent
parts=[]
colors={'frame':[76,87,83,255],'timber':[177,137,94,255],'glass':[132,190,200,95],'vent':[108,119,110,255],'shade':[111,124,111,255],'gasket':[43,49,46,255],'screen':[170,183,177,160]}
def box(name,x0,x1,y0,y1,z0,z1,mat,angle=0):
    parts.append(dict(name=name,center=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],size=[x1-x0,y1-y0,z1-z0],material=mat,rotation_x_deg=angle))
# Frame bounding envelope, not extrusion sections.
for name,x0,x1,z0,z1 in [('left_jamb',0,60,0,1500),('right_jamb',1140,1200,0,1500),('sill',60,1140,0,60),('head',60,1140,1440,1500),('lower_rail',60,1140,180,220),('upper_rail',60,1140,1280,1320)]:
    box(name,x0,x1,-50,35,z0,z1,'frame'); box(name+'_interior_trim',x0,x1,35,50,z0,z1,'timber')
# Two 6 mm panes separated by 12 mm cavity; edge detail schematic.
for y0,y1,n in [(-12,-6,'outer'),(6,12,'inner')]:box('glazing_'+n,60,1140,y0,y1,220,1280,'glass')
for z0,z1,n in [(220,230,'bottom'),(1270,1280,'top')]:box('spacer_'+n,60,1140,-6,6,z0,z1,'gasket')
for x0,x1,n in [(60,70,'left'),(1130,1140,'right')]:box('spacer_'+n,x0,x1,-6,6,230,1270,'gasket')
# Each vent has unobstructed 800 x 20 face slot, staggered exterior/interior apertures.
for name,z in [('lower',60),('upper',1320)]:
    for side,y0,y1,slot in [('outside',-50,-46,z+25),('inside',46,50,z+75)]:
        for n,x0,x1,a,b in [('left',60,200,z,z+120),('right',1000,1140,z,z+120),('below',200,1000,z,slot),('above',200,1000,slot+20,z+120)]:box(f'{name}_{side}_{n}',x0,x1,y0,y1,a,b,'vent')
    # Baffles at different depths, forcing a turn without sealing the cavity.
    box(name+'_baffle_A',200,1000,-21,-17,z,z+55,'vent')
    box(name+'_baffle_B',200,1000,13,17,z+65,z+120,'vent')
    box(name+'_screen_envelope',200,1000,-43,-42,z+25,z+45,'screen')
    box(name+'_damper_open',200,1000,39,43,z+99,z+119,'gasket')
    box(name+'_canopy',180,1020,-75,-50,z+50,z+58,'frame')
# External removable shading module. Fixed deployed demonstration angle; no mechanism implied.
for n,x0,x1 in [('left',70,85),('right',1115,1130)]:box('shade_guide_'+n,x0,x1,-105,-90,230,1270,'frame')
for i in range(13):
    z=260+i*80
    box(f'shade_slat_{i+1:02}',85,1115,-128,-68,z-2,z+2,'shade',-25)
# Output editable solids and visualization mesh; shade angles rotate about local center.
assembly=cq.Assembly(name='Living_Window_v02'); scene=trimesh.Scene()
for p in parts:
    x,y,z=p['center']; a,b,c=p['size']; angle=p['rotation_x_deg']
    solid=cq.Workplane('XY').box(a,b,c).val().rotate((0,0,0),(1,0,0),angle).translate((x,y,z))
    rgba=colors[p['material']]; assembly.add(solid,name=p['name'],color=cq.Color(*(v/255 for v in rgba)))
    mesh=trimesh.creation.box(extents=np.array(p['size'])/1000)
    mesh.apply_transform(trimesh.transformations.rotation_matrix(math.radians(angle),[1,0,0])); mesh.apply_translation(np.array(p['center'])/1000)
    mesh.visual.face_colors=rgba
    scene.add_geometry(mesh,geom_name=p['name'],node_name=p['name'])
assembly.export(str(OUT/'living_window.step'))
scene.apply_transform(trimesh.transformations.rotation_matrix(-math.pi/2,[1,0,0])) # glTF Y-up
(OUT/'living_window.glb').write_bytes(scene.export(file_type='glb'))
(OUT/'geometry.json').write_text(json.dumps({'units':'mm','axes':'x width, y + indoor, z up','status':'concept envelope; not manufacturing CAD','parts':parts},indent=2))
loaded=trimesh.load(OUT/'living_window.glb',force='scene')
assert len(loaded.geometry)==len(parts)
assert np.allclose(loaded.extents[[0,1]],[1.2,1.5],atol=1e-5)
print(f'{len(parts)} components; glb bounds metres {loaded.bounds.tolist()}; STEP { (OUT/"living_window.step").stat().st_size} bytes')
