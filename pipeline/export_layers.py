"""Export Z-Anatomy (BodyParts3D-derived, CC BY-SA 4.0) into one Draco GLB per body layer.

Run:  blender -b source/Z-Anatomy/Startup.blend --python pipeline/export_layers.py
"""
import bpy, json, os, re

ROOT = r"C:\Users\SDF 01\Downloads\3D_Human"
OUT = os.path.join(ROOT, "web", "public", "models")
os.makedirs(OUT, exist_ok=True)

def base_mat(o):
    mats = [m for m in getattr(o.data, "materials", []) if m]
    if not mats:
        return ""
    name = mats[0].name
    while True:   # e.g. "Skin-5'" / "Skin-5''" / "Bone.001" -> "Skin" / "Bone"
        new = re.sub(r"(['’]+|-\d+|\.\d+)$", "", name)
        if new == name:
            return name
        name = new

def real(o):
    if o.type == "CURVE":
        return True
    return o.type == "MESH" and len(o.data.polygons) > 0

# Reproductive structures are intentionally left out of this atlas.
REPRO = re.compile(r"penis|testicular|testis|epididym|prostat|seminal gland|ductus deferens|ejaculatory|glans|"
                   r"corpus cavernosum|corpus spongiosum|external pudendal|genital branch|pubic hair|^urethra$", re.I)

def objs(coll, mats=None, exclude=None, types=("MESH", "CURVE")):
    res = []
    for o in bpy.data.collections[coll].all_objects:
        if o.type not in types or not real(o):
            continue
        if REPRO.search(o.name):
            continue
        if re.search(r"segment of eyeball|Vitreous body|Retina|Anterior chamber of eyeball|^Lens", o.name):
            continue
        m = base_mat(o)
        if m == "Text":
            continue
        if mats is not None and m not in mats:
            continue
        if exclude is not None and m in exclude:
            continue
        res.append(o)
    return res

BRAIN = {"Frontal lobe", "Temporal lobe", "Occipital lobe", "Parietal lobe", "Limbic lobe",
         "Insula", "Cerebellum", "Brain", "Interlobar sulci"}
EYE = {"Eye", "Cornea", "Iris"}

LAYERS = {
    "skeleton": (objs("1: Skeletal system", mats={"Bone", "Cartilage", "Teeth"}), 260_000),
    "muscles": (objs("4: Muscular system",
                     exclude={"Bursa", "Fascia", "Articular capsule", "Ligament", "Cartilage", ""}), 420_000),
    "arteries": (objs("5: Cardiovascular system", mats={"Artery", "Pulmonary artery"}), 160_000),
    "veins": (objs("5: Cardiovascular system", mats={"Vein", "Pulmonary vein"}), 140_000),
    "organs": (objs("5: Cardiovascular system", types=("MESH",))
               + objs("8: Visceral systems", exclude={"Peritoneum", "Ligament", "Fascia", ""})
               + objs("7: Nervous system & Sense organs", mats=BRAIN | EYE, types=("MESH",))
               + objs("6: Lymphoid organs", mats={"Organ", "Gland"}), 260_000),
    "nerves": (objs("7: Nervous system & Sense organs", mats={"Nerve"}), 120_000),
    "skin": (objs("9: Regions of human body", mats={"Skin", "Nail", "Black"})
             + objs("7: Nervous system & Sense organs", mats=EYE, types=("MESH",)), 200_000),
}
ONLY = os.environ.get("ZLAYERS")
if ONLY:
    LAYERS = {k: v for k, v in LAYERS.items() if k in ONLY.split(",")}

dg = bpy.context.evaluated_depsgraph_get()
manifest = {}

# Source objects whose names are corrupted in Startup.blend: (parent, name) -> real name.
# The '????????' curve under Coronary sinus runs from the crux around the right coronary sulcus
# to the front of the right ventricle, i.e. the small cardiac vein.
FIXNAMES = {("Coronary sinus", "????????"): "Small cardiac vein"}

# Holes that are modelling defects in the source, not anatomy: object name -> minimum opening width (m) to seal.
# The stomach has a stray ~5 cm hole in its wall; its real openings (cardia ~1.3 cm, pylorus ~2.1 cm) stay open.
SEAL_HOLES = {"Stomach": 0.035}

def seal_holes(me, min_width):
    """Close boundary loops at least `min_width` across with a gently curved patch. Returns how many were sealed."""
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    seen, sealed = set(), 0
    for e in list(bm.edges):
        if not e.is_valid or not e.is_boundary or e in seen:
            continue
        stack, loop = [e], []
        while stack:
            x = stack.pop()
            if x in seen:
                continue
            seen.add(x)
            loop.append(x)
            for v in x.verts:
                for y in v.link_edges:
                    if y.is_boundary and y not in seen:
                        stack.append(y)
        verts = {v for ed in loop for v in ed.verts}
        c = sum((v.co for v in verts), verts.__iter__().__next__().co * 0) / len(verts)
        width = 2 * sum((v.co - c).length for v in verts) / len(verts)
        if width < min_width:
            continue
        new = bmesh.ops.holes_fill(bm, edges=loop, sides=0)["faces"]
        tris = bmesh.ops.triangulate(bm, faces=new)["faces"]
        tset = set(tris)
        inner = [ed for ed in {ed for f in tris for ed in f.edges} if len(ed.link_faces) == 2 and all(lf in tset for lf in ed.link_faces)]
        bmesh.ops.subdivide_edges(bm, edges=inner, cuts=2, smooth=1.0, use_grid_fill=True)
        sealed += 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return sealed

def to_mesh_object(o, layer):
    """Make a standalone, parent-free mesh copy (curves/modifiers baked) in world space."""
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=False, depsgraph=dg)
    me.transform(o.matrix_world)
    if o.matrix_world.determinant() < 0:   # mirrored (.l) copies: restore outward winding
        me.flip_normals()
    for p in me.polygons:
        p.use_smooth = True
    name = FIXNAMES.get((o.parent.name if o.parent else "", o.name), o.name)
    if name in SEAL_HOLES:
        print("SEALED", name, seal_holes(me, SEAL_HOLES[name]), "hole(s)")
    n = bpy.data.objects.new(name, me)
    n["zname"] = name
    n["zmat"] = base_mat(o)
    n["zlayer"] = layer
    n["zgroup"] = o.parent.name if o.parent else ""
    return n

for layer, (src, budget) in LAYERS.items():
    scene = bpy.data.scenes.new("EXPORT_" + layer)
    coll = scene.collection
    made = []
    for o in src:
        try:
            n = to_mesh_object(o, layer)
        except Exception as e:
            print("SKIP", o.name, e)
            continue
        if len(n.data.polygons) == 0:
            continue
        coll.objects.link(n)
        made.append(n)
    total = sum(len(n.data.polygons) for n in made)
    ratio = min(1.0, budget / max(total, 1))
    bpy.context.window.scene = scene
    if layer == "skin":
        # External genital skin is removed; the modesty cover below closes over that area.
        for n in [n for n in made if n["zname"].startswith("Urogenital region")]:
            made.remove(n); bpy.data.objects.remove(n)
        # Seams between skin patches are smoothed at load time in the browser (see anatomy.js weldNormals).
        # Make every skin patch face outward: compare with a welded, consistently oriented copy of the whole skin.
        import bmesh
        from mathutils.bvhtree import BVHTree
        wb = bmesh.new()
        skin_patches = [n for n in made if n["zmat"] == "Skin"]
        for n in skin_patches:
            wb.from_mesh(n.data)
        bmesh.ops.remove_doubles(wb, verts=wb.verts, dist=0.0015)
        bmesh.ops.recalc_face_normals(wb, faces=wb.faces)
        wtree = BVHTree.FromBMesh(wb)
        flipped = 0
        for n in skin_patches:
            me = n.data
            me.calc_loop_triangles() if hasattr(me, "calc_loop_triangles") else None
            votes = 0
            for poly in me.polygons:
                hit = wtree.find_nearest(poly.center)
                if hit[0] is not None:
                    votes += 1 if poly.normal.dot(hit[1]) >= 0 else -1
            if votes < 0:
                me.flip_normals(); flipped += 1
        wb.free()
        print("SKIN flipped patches", flipped, "of", len(skin_patches))
        # Modesty cover: a smooth tube around the hips shrink-wrapped onto the skin ("trunks"), covering the groin.
        import bmesh, math
        from mathutils import Vector
        from mathutils.bvhtree import BVHTree
        tb = bmesh.new()
        ARM = re.compile(r"hand|digit|palm|carp|antebrach|cubit|brach|wrist|thumb|finger|thenar|metacarp|elbow|arm|deltoid|axill", re.I)
        for n in made:
            if n["zmat"] == "Skin" and not ARM.search(n["zname"]):
                tb.from_mesh(n.data)
        bmesh.ops.remove_doubles(tb, verts=tb.verts, dist=0.0015)
        tree = BVHTree.FromBMesh(tb)
        def core_dir(co):
            segs = [(Vector((0, 0.0, 0.86)), Vector((0, 0.0, 1.1))),
                    (Vector((0.09, -0.005, 0.5)), Vector((0.07, 0.0, 0.84))),
                    (Vector((-0.09, -0.005, 0.5)), Vector((-0.07, 0.0, 0.84)))]
            best = None
            for a0, a1 in segs:
                d = a1 - a0; t = max(0.0, min(1.0, (co - a0).dot(d) / d.length_squared))
                pnt = a0 + d * t; dist = (co - pnt).length
                if best is None or dist < best[0]:
                    best = (dist, co - pnt)
            return best[1].normalized()
        gb = bmesh.new()
        SEG, RINGS, Z0, Z1 = 96, 36, 0.735, 0.95
        rings = []
        for j in range(RINGS + 1):
            z = Z0 + (Z1 - Z0) * j / RINGS
            ring = []
            for i in range(SEG):
                a = 2 * math.pi * i / SEG
                ring.append(gb.verts.new((math.sin(a) * 0.2, -math.cos(a) * 0.15 + 0.01, z)))
            rings.append(ring)
        for j in range(RINGS):
            for i in range(SEG):
                gb.faces.new((rings[j][i], rings[j][(i + 1) % SEG], rings[j + 1][(i + 1) % SEG], rings[j + 1][i]))
        def wrap(offset):
            for v in gb.verts:
                hit = tree.find_nearest(v.co)
                if hit[0] is None:
                    continue
                loc, nrm = hit[0], hit[1]
                if nrm.dot(core_dir(loc)) < 0:
                    nrm = -nrm
                v.co = loc + nrm * offset
        wrap(0.0065)
        for _ in range(3):
            bmesh.ops.smooth_vert(gb, verts=[v for v in gb.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
            wrap(0.0065)
        bmesh.ops.smooth_vert(gb, verts=[v for v in gb.verts if not v.is_boundary], factor=0.3, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        bmesh.ops.recalc_face_normals(gb, faces=gb.faces)
        tb.free()
        bm = gb
        gme = bpy.data.meshes.new("Modesty cover")
        bm.to_mesh(gme); bm.free()
        for p in gme.polygons:
            p.use_smooth = True
        gar = bpy.data.objects.new("Modesty cover", gme)
        gar["zname"] = "Modesty cover"; gar["zmat"] = "Garment"; gar["zlayer"] = "skin"; gar["zgroup"] = ""
        coll.objects.link(gar)
        made.append(gar)
        print("GARMENT faces", len(gme.polygons))
    for n in made:
        p = len(n.data.polygons)
        if ratio < 1.0 and p > 300:
            r = max(ratio, 300 / p)
            mod = n.modifiers.new("dec", "DECIMATE")
            mod.ratio = r
    bpy.context.view_layer.update()
    final = 0
    dg2 = bpy.context.evaluated_depsgraph_get()
    for n in made:
        final += len(n.evaluated_get(dg2).data.polygons)
    path = os.path.join(OUT, layer + ".glb")
    for o in bpy.context.view_layer.objects:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=False, use_active_scene=True,
        export_apply=True, export_extras=True, export_materials="NONE",
        export_normals=True, export_texcoords=False, export_yup=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10,
        export_animations=False, export_skins=False, export_morph=False, export_cameras=False,
        export_lights=False,
    )
    manifest[layer] = [{"name": n["zname"], "mat": n["zmat"], "group": n["zgroup"]} for n in made]
    print(f"LAYER {layer}: {len(made)} objs, {total} -> {final} polys, {os.path.getsize(path)/1e6:.2f} MB")

mpath = os.path.join(ROOT, "pipeline", "manifest.json")
if ONLY and os.path.exists(mpath):
    manifest = {**json.load(open(mpath)), **manifest}
json.dump(manifest, open(mpath, "w"), indent=1)
print("EXPORT DONE")
