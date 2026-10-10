import bpy, json
TOP = ["1: Skeletal system","4: Muscular system","5: Cardiovascular system","7: Nervous system & Sense organs","8: Visceral systems","9: Regions of human body","6: Lymphoid organs","3: Joints"]
inv = {}
def path_of(o, top):
    # find sub-collection chain
    res=[]
    def rec(c, chain):
        if o.name in c.objects: res.append(chain+[c.name]); return True
        for ch in c.children:
            if rec(ch, chain+[c.name]): return True
        return False
    rec(top, [])
    return res[0][1:] if res else []
for tn in TOP:
    top = bpy.data.collections[tn]
    items=[]
    for o in top.all_objects:
        if o.type not in ('MESH','CURVE'): continue
        polys = len(o.data.polygons) if o.type=='MESH' else -1
        mats = [m.name for m in o.data.materials if m] if hasattr(o.data,'materials') else []
        items.append({"name":o.name,"type":o.type,"polys":polys,"path":path_of(o,top),"hide":o.hide_get() if bpy.context.view_layer.objects.get(o.name) else None,"hide_render":o.hide_render,"mat":mats[:1],"parent":o.parent.name if o.parent else None})
    inv[tn]=items
texts = {t.name: t.as_string()[:400] for t in bpy.data.texts}
json.dump(inv, open(r"C:\Users\SDF 01\Downloads\3D_Human\pipeline\inventory.json","w"), indent=0)
json.dump(texts, open(r"C:\Users\SDF 01\Downloads\3D_Human\pipeline\texts.json","w"), indent=0)
print("DONE")
