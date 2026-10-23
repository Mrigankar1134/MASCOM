"""
Renders the welcome screen's 3D polo: a 360-degree turntable, transparent background.

The shirt is "Polo Shirt" by Giovani Franca from BlenderKit (asset 712334fb-5efe-41e6-bd62-94266e9ec445,
free, royalty-free licence). The licence lets us ship renders of it but not the model file, so the
.blend is downloaded on demand by fetch_polo.py and never committed.

    python art/fetch_polo.py art/.cache                          # once: downloads polo_src.blend
    blender -b art/.cache/polo_src.blend -P art/render_polo.py -- app/src/main/assets/polo full
    blender -b art/.cache/polo_src.blend -P art/render_polo.py -- /tmp/polo preview   # 4 test frames

What it does to the model: recolours the fabric to MASCOM gold (keeping the knit detail from its
textures), makes the buttons pearl white, stitches a small "M" on the chest, prints "IIM" over
"AMRITSAR" across the upper back, then lights and
renders it the same way for every frame: polo_000.webp .. polo_119.webp, one every 3 degrees.
"""
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.getcwd(), "frames")
MODE = argv[1] if len(argv) > 1 else "preview"
FRAMES = 120
SIZE = 720
os.makedirs(OUT, exist_ok=True)

scene = bpy.context.scene
shirt = next(o for o in bpy.data.objects if o.type == "MESH")
root = shirt.parent


def srgb(hex_color):
    h = hex_color.lstrip("#")
    def lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(int(h[0:2], 16)), lin(int(h[2:4], 16)), lin(int(h[4:6], 16)), 1.0)


# ---------------------------------------------------------------------------------------------
# Recolour the fabric to gold, keeping the texture's knit detail
# ---------------------------------------------------------------------------------------------

def average_luminance(image):
    """Mean luminance of a texture, measured on a small copy so it stays quick."""
    small = image.copy()
    small.scale(64, 64)
    px = list(small.pixels)
    bpy.data.images.remove(small)
    total = 0.0
    n = len(px) // 4
    for i in range(n):
        r, g, b = px[i * 4], px[i * 4 + 1], px[i * 4 + 2]
        total += 0.2126 * r + 0.7152 * g + 0.0722 * b
    return total / max(n, 1)


fabric = bpy.data.materials["Polo Shirt"]
nt = fabric.node_tree
bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
base_tex = next(n for n in nt.nodes if n.type == "TEX_IMAGE" and n.image and "Basecolor" in n.image.name)
avg = average_luminance(base_tex.image)
print(f"[polo] base texture mean luminance {avg:.3f}")

# texture -> luminance -> normalised so the average lands mid-ramp -> gold ramp -> Base Color
to_bw = nt.nodes.new("ShaderNodeRGBToBW")
norm = nt.nodes.new("ShaderNodeMath")
norm.operation = "MULTIPLY"
norm.inputs[1].default_value = 0.55 / max(avg, 1e-3)
norm.use_clamp = True
ramp = nt.nodes.new("ShaderNodeValToRGB")
stops = ramp.color_ramp.elements
stops[0].position = 0.0
stops[0].color = srgb("#5A3D02")
stops[1].position = 1.0
stops[1].color = srgb("#F6DC8A")
mid = stops.new(0.55)
mid.color = srgb("#E3AD17")
low = stops.new(0.3)
low.color = srgb("#A87A06")
nt.links.new(base_tex.outputs["Color"], to_bw.inputs["Color"])
nt.links.new(to_bw.outputs["Val"], norm.inputs[0])
nt.links.new(norm.outputs["Value"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
# A little silk to the sheen suits the gold.
if "Sheen Tint" in bsdf.inputs:
    bsdf.inputs["Sheen Tint"].default_value = srgb("#FFF3C4")

# Pearl buttons.
button = bpy.data.materials["Button"]
bb = next(n for n in button.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
for link in list(button.node_tree.links):
    if link.to_socket == bb.inputs["Base Color"]:
        button.node_tree.links.remove(link)
bb.inputs["Base Color"].default_value = srgb("#F6F1E6")
for link in list(button.node_tree.links):
    if link.to_socket == bb.inputs["Roughness"]:
        button.node_tree.links.remove(link)
bb.inputs["Roughness"].default_value = 0.25
if "Coat Weight" in bb.inputs:
    bb.inputs["Coat Weight"].default_value = 0.5

# ---------------------------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------------------------

depsgraph = bpy.context.evaluated_depsgraph_get()
bvh = BVHTree.FromObject(shirt, depsgraph)
to_local = shirt.matrix_world.inverted()
corners = [shirt.matrix_world @ Vector(c) for c in shirt.bound_box]
lo = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
hi = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
center = (lo + hi) / 2
size = hi - lo
print(f"[polo] bounds {tuple(round(v, 3) for v in lo)} .. {tuple(round(v, 3) for v in hi)}")


# Dark, matte ink for the chest "M" and the back print.
thread = bpy.data.materials.new("Thread")
thread.use_nodes = True
tb = thread.node_tree.nodes["Principled BSDF"]
tb.inputs["Base Color"].default_value = srgb("#140E02")
tb.inputs["Roughness"].default_value = 1.0
if "Specular IOR Level" in tb.inputs:
    tb.inputs["Specular IOR Level"].default_value = 0.15  # matte ink, no grey shine
if "Sheen Weight" in tb.inputs:
    tb.inputs["Sheen Weight"].default_value = 0.0  # sheen turns dark thread grey

def bold_font():
    """A heavy face for the prints: Arial Black, else Segoe UI Black, else Blender's own."""
    for name in ("ariblk.ttf", "seguibl.ttf", "arialbd.ttf"):
        path = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", name)
        if os.path.exists(path):
            return bpy.data.fonts.load(path)
    return None


FONT = bold_font()


def surface_hit(x, z, back):
    """First hit on the shirt from the front (-Y) or back (+Y), with the outward normal, in world space."""
    start = Vector((x, (hi.y + 1.0) if back else (lo.y - 1.0), z))
    direction = Vector((0, -1, 0)) if back else Vector((0, 1, 0))
    hit, normal, _, _ = bvh.ray_cast(to_local @ start, (to_local.to_3x3() @ direction).normalized())
    if hit is None:
        return None, None
    hit = shirt.matrix_world @ hit
    normal = (shirt.matrix_world.to_3x3() @ normal).normalized()
    if normal.dot(direction) > 0:
        normal = -normal  # face back towards the viewer on that side
    return hit, normal


def print_text(name, body, x, z, height, back=False, spacing=1.0, thickness=0.0, font=None):
    """
    Lays text onto the shirt like a print: placed flat at (x, z) on the chosen side, then every
    vertex is projected onto the fabric so the letters follow its curves. [height] is the cap height.
    """
    hit, normal = surface_hit(x, z, back)
    if hit is None:
        print(f"[polo] WARNING: no surface for {name}")
        return None
    bpy.ops.object.text_add()
    obj = bpy.context.active_object
    obj.name = name
    obj.data.body = body
    if font is not None:
        obj.data.font = font
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = height / 0.72  # cap height is roughly 0.72 em
    obj.data.space_character = spacing
    obj.data.extrude = thickness
    obj.data.resolution_u = 6
    bpy.ops.object.convert(target="MESH")
    obj.data.materials.append(thread)

    up = Vector((0, 0, 1))
    right = up.cross(normal).normalized()
    true_up = normal.cross(right).normalized()
    obj.matrix_world = Matrix.Translation(hit) @ Matrix((
        (right.x, true_up.x, normal.x, 0),
        (right.y, true_up.y, normal.y, 0),
        (right.z, true_up.z, normal.z, 0),
        (0, 0, 0, 1),
    ))
    # Dice the flat letters finely enough to bend with the fabric, then wrap them onto it.
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
    bm.to_mesh(obj.data)
    bm.free()
    lift = size.z * 0.0016
    world = obj.matrix_world
    inv = world.inverted()
    for v in obj.data.vertices:
        p = world @ v.co
        depth = (p - hit).dot(normal)  # keep any embroidery thickness
        origin = p + normal * 0.05
        h, n, _, _ = bvh.ray_cast(to_local @ origin, (to_local.to_3x3() @ -normal).normalized())
        if h is None:
            continue
        h = shirt.matrix_world @ h
        v.co = inv @ (h + normal * (lift + max(depth, 0.0)))
    obj.data.update()
    print(f"[polo] placed {name}")
    return obj


# Front: a small embroidered "M" on the wearer's left chest (viewer's right).
logo = print_text("Logo", "M", center.x + size.x * 0.13, lo.z + size.z * 0.70, size.z * 0.04,
                  thickness=size.z * 0.0004)
# Back: IIM big, AMRITSAR smaller underneath, printed across the upper back.
back_prints = [
    print_text("BackIIM", "IIM", center.x, lo.z + size.z * 0.71, size.z * 0.085, back=True, spacing=1.05, font=FONT),
    print_text("BackAmritsar", "AMRITSAR", center.x, lo.z + size.z * 0.63, size.z * 0.03, back=True, spacing=1.35, font=FONT),
]
prints = [o for o in [logo, *back_prints] if o is not None]

# Everything turns together around the shirt's centre.
pivot = bpy.data.objects.new("Pivot", None)
scene.collection.objects.link(pivot)
pivot.location = (center.x, center.y, 0)
for o in [root or shirt] + prints:
    world = o.matrix_world.copy()
    o.parent = pivot
    o.matrix_world = world

# ---------------------------------------------------------------------------------------------
# Studio: soft key, fill, warm rim, gentle top light and an even world
# ---------------------------------------------------------------------------------------------

for o in list(scene.objects):
    if o.type in {"LIGHT", "CAMERA"}:
        bpy.data.objects.remove(o)

world = bpy.data.worlds.new("Studio")
scene.world = world
world.use_nodes = True
wn = world.node_tree
env = wn.nodes.new("ShaderNodeTexEnvironment")
studio = os.path.join(os.path.dirname(bpy.app.binary_path), f"{bpy.app.version[0]}.{bpy.app.version[1]}",
                      "datafiles", "studiolights", "world", "studio.exr")
if os.path.exists(studio):
    env.image = bpy.data.images.load(studio)
    wn.links.new(env.outputs["Color"], wn.nodes["Background"].inputs["Color"])
wn.nodes["Background"].inputs["Strength"].default_value = 0.3

S = max(size.x, size.z)  # scale lights to the model


def area(name, offset, power, spread, color=(1, 1, 1)):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = power * S * S
    light.size = spread * S
    light.color = color
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = center + Vector(offset) * S
    obj.rotation_euler = (center - obj.location).to_track_quat("-Z", "Y").to_euler()


area("Key", (1.1, -1.4, 1.6), 150, 1.6, (1.0, 0.97, 0.93))
area("Fill", (-1.6, -1.3, 0.6), 45, 2.0, (0.95, 0.97, 1.0))
area("Rim", (-0.8, 1.6, 1.3), 160, 1.3, (1.0, 0.93, 0.8))
area("Top", (0.0, 0.0, 2.2), 45, 1.5)

# Camera framing the widest the shirt gets as it turns (width or depth), with a slight downward look.
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 85
cam_data.sensor_width = 36
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
half = max(size.x, size.y) / 2
extent = max(half * 2, size.z) * 1.28
fov = 2 * math.atan(cam_data.sensor_width / (2 * cam_data.lens))
dist = (extent / 2) / math.tan(fov / 2)
look = Vector((center.x, center.y, center.z))
cam.location = look + Vector((0, -dist, dist * math.tan(math.radians(8))))
cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = cam

# ---------------------------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------------------------

scene.render.engine = "CYCLES"
scene.cycles.samples = 96 if MODE == "full" else 64
scene.cycles.use_denoising = True
prefs = bpy.context.preferences.addons["cycles"].preferences
device = "CPU"
for kind in ("OPTIX", "CUDA"):
    try:
        prefs.compute_device_type = kind
        prefs.get_devices()
        if any(d.type == kind for d in prefs.devices):
            for d in prefs.devices:
                d.use = d.type == kind
            device = kind
            break
    except Exception:
        pass
scene.cycles.device = "GPU" if device != "CPU" else "CPU"
print(f"[polo] render device: {device}")

scene.render.resolution_x = SIZE
scene.render.resolution_y = SIZE
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
scene.view_settings.exposure = 0.2
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.quality = 88

frames = range(FRAMES) if MODE == "full" else [0, 15, 60, 50]
for i in frames:
    pivot.rotation_euler = (0, 0, math.radians(i * 360.0 / FRAMES))
    scene.render.filepath = os.path.join(OUT, f"polo_{i:03d}.webp")
    bpy.ops.render.render(write_still=True)
    print(f"[polo] rendered frame {i}")

print("[polo] done")
