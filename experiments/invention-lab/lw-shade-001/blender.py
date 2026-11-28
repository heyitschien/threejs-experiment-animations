"""Convert verified LW-SHADE-001 STL components to a named GLB and render the hero."""

import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def material(name, color, metallic=0.0):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1)
    value.use_nodes = True
    shader = value.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = 0.38
    shader.inputs["Metallic"].default_value = metallic
    return value


def load_part(out, part, digest, parent, mat):
    path = out / f"{part['file']}.stl"
    require(path.is_file() and sha256(path) == digest, f"{part['id']}: stale STL")
    bpy.ops.object.select_all(action="DESELECT")
    result = bpy.ops.wm.stl_import(filepath=str(path), global_scale=0.001,
                                  forward_axis="Y", up_axis="Z", use_scene_unit=False,
                                  use_facet_normal=False, use_mesh_validate=True)
    require(result == {"FINISHED"}, f"{part['id']}: STL import failed")
    mesh, = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    mesh.name = part["id"]
    mesh.data.name = part["id"] + ".mesh"
    mesh["part_id"] = part["id"]
    mesh["role"] = part["role"]
    mesh.parent = parent
    mesh.data.materials.append(mat)
    if part.get("axis_z_mm"):
        mesh.location.z = part["axis_z_mm"] / 1000
    for polygon in mesh.data.polygons:
        polygon.use_smooth = False
    return mesh


def measure(obj):
    points = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    low = [min(point[i] for point in points) for i in range(3)]
    high = [max(point[i] for point in points) for i in range(3)]
    require(all(math.isfinite(value) for value in low + high), "nonfinite Blender geometry")
    return {"bounds_blender_m": [low, high], "vertices": len(obj.data.vertices),
            "triangles": len(obj.data.polygons)}


def pose(objects, theta):
    angle = math.radians(theta)
    dy = (20 * math.cos(angle) - 20) / 1000
    dz = -20 * math.sin(angle) / 1000
    for key in ("shade.lower_slat_rotor", "shade.lower_washer"):
        objects[key].rotation_euler.x = -angle
    for key in ("shade.upper_slat_rotor", "shade.upper_washer"):
        objects[key].rotation_euler.x = -angle
        objects[key].location.z = 0.08
    objects["shade.coupler"].location = (0, dy, dz)
    bpy.context.view_layer.update()


def point_camera(camera, target):
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def render_hero(out, objects):
    pose(objects, 25)
    floor_mat = material("ground.material", (0.02, 0.03, 0.04))
    floor_mat.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = 0.92
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, -0.055))
    floor = bpy.context.object
    floor.name = "hero.ground"
    floor.data.materials.append(floor_mat)
    camera_data = bpy.data.cameras.new("hero.camera")
    camera = bpy.data.objects.new("hero.camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.43, -0.39, 0.25)
    camera.data.lens = 58
    point_camera(camera, (0.02, 0.0, 0.035))
    bpy.context.scene.camera = camera
    world = bpy.context.scene.world
    world.use_nodes = False
    world.color = (0.012, 0.018, 0.025)
    for name, kind, energy, position, size in [
        ("key", "AREA", 14, (0.18, -0.25, 0.42), 0.35),
        ("fill", "AREA", 6, (-0.28, -0.05, 0.18), 0.28),
        ("rim", "AREA", 10, (0.15, 0.32, 0.30), 0.22),
    ]:
        data = bpy.data.lights.new(name, kind)
        data.energy, data.shape, data.size = energy, "DISK", size
        light = bpy.data.objects.new(name, data)
        light.location = position
        point_camera(light, (0, 0, 0.04))
        bpy.context.collection.objects.link(light)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x, scene.render.resolution_y = 1440, 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(out / "hero.png")
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    out = Path(args[0])
    spec = json.loads((out / "spec.json").read_text())
    cad = json.loads((out / "cad.json").read_text())
    require(cad["passed"] is True and cad["spec_sha256"] == sha256(out / "spec.json"), "stale CAD receipt")
    clear_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    root = bpy.data.objects.new(spec["root"], None)
    bpy.context.collection.objects.link(root)
    root["assembly_id"] = spec["root"]
    root["motion_id"] = spec["motion"]["id"]
    root["cad_to_glb"] = spec["coordinate_mapping"]["cad_to_glb"]
    palette = {
        "fixed": material("fixture.material", (0.14, 0.20, 0.26), 0.65),
        "rotor": material("slat.material", (0.74, 0.39, 0.12), 0.25),
        "coupler": material("coupler.material", (0.12, 0.55, 0.53), 0.45),
        "washer": material("washer.material", (0.72, 0.77, 0.81), 0.85),
    }
    objects = {}
    for part in spec["parts"]:
        digest = cad["parts"][part["id"]]["stl_sha256"]
        objects[part["id"]] = load_part(out, part, digest, root, palette[part["role"]])
    bpy.context.view_layer.update()
    measured = {part_id: measure(obj) for part_id, obj in objects.items()}
    glb = out / "shade.glb"
    result = bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", export_yup=True,
                                       export_apply=True, export_materials="EXPORT", export_extras=True,
                                       export_cameras=False, export_lights=False)
    require(result == {"FINISHED"} and glb.is_file(), "GLB export failed")
    render_hero(out, objects)
    receipt = {"schema": 1, "id": spec["id"], "passed": True,
               "blender": bpy.app.version_string, "build": bpy.app.build_hash.decode(),
               "python": sys.version.split()[0], "cad_sha256": sha256(out / "cad.json"),
               "scene_units": "m", "axes": "[X,Z,-Y]/1000", "parts": measured,
               "glb_sha256": sha256(glb), "hero_sha256": sha256(out / "hero.png")}
    (out / "blender.json").write_text(json.dumps(receipt, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
