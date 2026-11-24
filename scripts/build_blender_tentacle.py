"""Build the Stage 7 arm in Blender's bundled Python. No external inputs."""
import argparse
import math
import sys
from pathlib import Path

import bmesh
import bpy

LENGTH = 4.35
TAU = math.tau


def material(name, color, metal, roughness, emission=None):
    result = bpy.data.materials.new(name)
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Roughness"].default_value = roughness
    if emission:
        shader.inputs["Emission Color"].default_value = (*emission, 1)
        shader.inputs["Emission Strength"].default_value = 1.8
    return result


def point(u, angle, scale):
    radius = (0.027 + 0.269 * (1 - u) ** 0.85) * scale
    return (radius * math.sin(angle), -0.88 * radius * math.cos(angle), LENGTH * u)


class Part:
    def __init__(self, name, surface):
        self.name = name
        self.surface = surface
        self.vertices = []
        self.faces = []

    def grid(self, rows, columns, sample, wrap=False, closed=False, loop=False):
        start = len(self.vertices)
        self.vertices.extend(sample(i, j) for i in range(rows) for j in range(columns))
        for i in range(rows if loop else rows - 1):
            for j in range(columns if wrap else columns - 1):
                a = start + i * columns + j
                b = start + i * columns + (j + 1) % columns
                next_row = start + ((i + 1) % rows) * columns
                self.faces.append((a, b, next_row + (j + 1) % columns, next_row + j))
        if loop and not wrap:
            for j in (0, columns - 1):
                self.faces.append(tuple(start + i * columns + j for i in range(rows)))
        if closed:
            self.faces.append(tuple(start + j for j in reversed(range(columns))))
            self.faces.append(tuple(start + (rows - 1) * columns + j for j in range(columns)))

    def finish(self):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices, [], self.faces)
        topology = bmesh.new()
        topology.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(topology, faces=list(topology.faces))
        topology.to_mesh(mesh)
        topology.free()
        assert not mesh.validate(), self.name
        mesh.update()
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.collection.objects.link(obj)
        mesh.materials.append(self.surface)
        for polygon in mesh.polygons:
            polygon.use_smooth = True


def armor_plate(part, start, length, angle, width, mirror, scale):
    # Rounded perimeter, swept leading edge and domed face. Buried return loop closes the plate.
    profile = [(0, .76, .78), (.028, .88, .98), (.10, .97, 1.06),
               (.32, 1, 1.07), (.69, .90, 1.03), (.91, .68, 1.00),
               (1, .53, .92), (1, .48, .74), (0, .70, .74)]

    def sample(i, j):
        along, taper, height = profile[i]
        cross = 2 * j / 10 - 1
        u = start + length * (along + .19 * cross * mirror * math.sin(math.pi * (.18 + along * .65)))
        azimuth = angle + cross * width * taper + mirror * .34 * along
        dome = height * (1 + .14 * (1 - cross * cross))
        return point(u, azimuth, scale * dome)

    part.grid(len(profile), 11, sample, loop=True)


def socket(part, u, angle, diameter, tube, scale):
    # Small elliptical toroids seated into the exposed mechanism.
    x, y, z = point(u, angle, scale)
    radius = (0.027 + 0.269 * (1 - u) ** .85) * diameter

    def sample(i, j):
        a, b = TAU * i / 16, TAU * j / 6
        r = radius * (1 + tube * math.cos(b))
        radial = radius * tube * math.sin(b)
        return (x + r * math.cos(a) * math.cos(angle) + radial * math.sin(angle),
                y + r * math.cos(a) * math.sin(angle) - radial * math.cos(angle),
                z + r * math.sin(a) * 1.37)

    part.grid(16, 6, sample, wrap=True, loop=True)


def build():
    spine = Part("Recessed mechanical spine", material("Graphite", (.033, .039, .058), .83, .34))
    crown = Part("Swept overlapping chrome plates", material("Polished chrome", (.63, .68, .74), 1, .19))
    scales = Part("Overlapping shoulder scales", material("Brushed blue steel", (.29, .34, .43), .97, .28))
    brass = Part("Machined warm sockets", material("Brass", (.65, .27, .065), .87, .28))
    emitters = Part("Amber insets", material("Amber", (.56, .19, .028), .38, .30, (1, .32, .058)))
    spine.grid(54, 20, lambda i, j: point(i / 53, TAU * j / 20, .79 + .03 * math.cos(j * TAU / 5)), True, True)

    for i in range(9):
        start = .014 + .101 * i
        armor_plate(crown, start, .122, 1.16, .91, -1, 1.16)
        armor_plate(scales, start + .014, .108, -1.25, .77, 1, 1.10)
        armor_plate(scales, start + .030, .082, 2.72, .98, -1, 1.09)
        socket(brass, start + .049, .06, .41, .16, .97)
        socket(emitters, start + .049, .06, .33, .10, 1.01)
    armor_plate(crown, .917, .072, .92, 1.04, -1, 1.11)
    for part in (spine, crown, scales, brass, emitters):
        part.finish()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    print(f"Blender {bpy.app.version_string}; Python {sys.version.split()[0]}")
    if args.smoke:
        bpy.ops.mesh.primitive_cube_add()
        bpy.context.object.name = "OCTO exporter smoke cube"
        bpy.context.object.data.materials.append(material("Smoke PBR", (.5, .3, .1), .8, .3))
    else:
        build()
    bpy.ops.export_scene.gltf(filepath=str(args.output.resolve()), export_format="GLB")
    assert args.output.read_bytes()[:4] == b"glTF"


if __name__ == "__main__":
    main()
