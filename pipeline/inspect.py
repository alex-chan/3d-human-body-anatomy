import bpy, json, sys
out = {}
def walk(c, depth=0, lines=None):
    n_mesh = sum(1 for o in c.all_objects if o.type=='MESH')
    lines.append("  "*depth + f"{c.name}  [objs={len(c.objects)} all_mesh={n_mesh}]")
    if depth < 3:
        for ch in c.children: walk(ch, depth+1, lines)
lines=[]
walk(bpy.context.scene.collection, 0, lines)
print("\n".join(lines))
types={}
for o in bpy.data.objects: types[o.type]=types.get(o.type,0)+1
print("TYPES", types)
tot=sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH')
print("TOTAL POLYS", tot)
print("TEXTS", [t.name for t in bpy.data.texts][:30], len(bpy.data.texts))
