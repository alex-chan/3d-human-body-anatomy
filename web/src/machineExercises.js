export const MACHINES = {
  'lat-pulldown': {
    title:'坐姿高位下拉', english:'SEATED LAT PULLDOWN', category:'back', equipment:['高位下拉器'], machine:true, prop:'machine', previewTime:4.7,
    muscles:['背阔肌','大圆肌','肱二头肌'], primary:/latissimus dorsi|teres major/i, assist:/biceps brachii|brachialis|rhomboid|transverse part of trapezius/i,
    primaryText:'背阔肌、大圆肌', assistText:'肱二头肌、肱肌、菱形肌、斜方肌中部',
    phases:['控制回放','顶部伸展','向下拉动','胸前停稳'], cues:['缓慢伸肘，让拉杆回到头顶上方。','躯干稳定，肩部在舒适范围内伸展。','双肘向身体两侧下方移动，将拉杆拉向上胸前方。','拉杆保持在身前，避免碰撞身体或后仰甩动。'],
    setup:'调节座椅与压腿垫，双脚踩地；握住拉杆，收紧腹部，胸部自然抬起。', errors:'颈后下拉、身体大幅后仰、耸肩借力或松手让配重砸落。', description:'观察高位绳索的垂直拉动，以及背部与屈肘肌群协同。', keywords:['lat pulldown','高位','下拉','背','器械','龙门架'], source:'https://rec.nova.edu/recreational-complex/exercise-library.html',
  },
  'cable-row': {
    initialView:'back', title:'坐姿绳索划船', english:'SEATED CABLE ROW', category:'back', equipment:['坐姿划船器','绳索'], machine:true, prop:'machine', previewTime:4.7,
    muscles:['背阔肌','菱形肌','斜方肌中部'], primary:/latissimus dorsi|rhomboid|transverse part of trapezius/i, assist:/biceps brachii|brachialis|scapular spinal part of deltoid/i,
    primaryText:'背阔肌、菱形肌、斜方肌中部', assistText:'肱二头肌、肱肌、三角肌后束',
    phases:['控制回放','伸臂稳定','向后拉动','躯干前停稳'], cues:['缓慢伸肘回放把手，躯干保持稳定。','双脚撑稳踏板，不用弓背换取更远距离。','双肘沿体侧向后拉，把手靠近下肋与腹部前方。','保持肩部放松，不后仰或耸肩。'],
    setup:'坐稳，双脚抵住踏板，膝盖自然微屈；握住把手，脊柱保持自然位置。', errors:'躯干前后甩动、弓背、耸肩或用手腕卷拉把手。', description:'结合低位滑轮、脚踏与把手，观察坐姿水平拉动。', keywords:['seated cable row','坐姿','划船','绳索','器械','背'], source:'https://rec.nova.edu/recreational-complex/exercise-library.html',
  },
  'machine-chest-press': {
    title:'坐姿器械推胸', english:'SEATED MACHINE CHEST PRESS', category:'chest', equipment:['坐姿推胸器'], machine:true, prop:'machine', previewTime:3.7,
    muscles:['胸大肌','肱三头肌','三角肌前束'], primary:/pectoralis major/i, assist:/triceps brachii|clavicular part of deltoid/i,
    primaryText:'胸大肌', assistText:'肱三头肌、三角肌前束',
    phases:['控制回程','胸前停稳','向前推起','前方控制'], cues:['屈肘缓慢回放把手，肩背保持接触靠垫。','把手约在胸部高度，手腕保持自然。','双手向前推，避免耸肩或抬臀借力。','保持可控幅度，不猛锁肘，再缓慢回程。'],
    setup:'调节座椅使把手约在胸部高度；背部贴住靠垫，双脚踩稳，握住把手。', errors:'座椅高度不合适、肘部过度外展、肩膀前顶或回程失控。', description:'观察座椅支撑下的固定轨迹推胸与胸肩臂协同。', keywords:['chest press machine','推胸','坐姿','器械','胸'], source:'https://www.nasm.org/resource-center/exercise-library/chest-press-machine',
  },
  'leg-extension': {
    title:'坐姿器械腿屈伸', english:'SEATED LEG EXTENSION', category:'legs', equipment:['腿屈伸机'], machine:true, prop:'machine', previewTime:4.7,
    muscles:['股四头肌','腹肌'], primary:/rectus femoris|vastus/i, assist:/rectus abdominis|oblique muscle of abdomen|abdominal.*oblique/i,
    primaryText:'股四头肌', assistText:'腹部稳定肌群',
    phases:['缓慢屈膝','底部稳定','伸膝抬起','顶部控制'], cues:['控制小腿与滚垫缓慢回落，背部留在靠垫上。','保持膝部对齐器械转轴，不让配重突然落下。','通过伸膝将滚垫向前上方抬起。','在可控范围内伸膝，避免猛然顶膝，再缓慢下放。'],
    setup:'调节座椅使膝关节靠近器械转轴，滚垫位于小腿下端、踝部上方；握住座椅两侧把手。', errors:'膝部与转轴错位、滚垫压在脚背、抬臀或甩动小腿。', description:'观察滚垫随小腿转动，突出股四头肌主导的伸膝。', keywords:['leg extension','腿屈伸','腿伸展','器械','股四头肌'], source:'https://www.acefitness.org/resources/everyone/exercise-library/183/seated-leg-extension/',
  },
  'cable-pushdown': {
    initialView:'side', cameraScale:1.16, title:'绳索直杆下压', english:'CABLE TRICEPS PUSHDOWN', category:'arms', equipment:['高位滑轮','直杆'], machine:true, prop:'machine', previewTime:4.7,
    muscles:['肱三头肌','前臂肌群','腹肌'], primary:/triceps brachii/i, assist:/flexor carpi|flexor digitorum|rectus abdominis/i,
    primaryText:'肱三头肌', assistText:'前臂握持肌群、腹肌',
    phases:['控制回放','屈肘停稳','向下伸肘','底部控制'], cues:['保持上臂靠近身体，缓慢屈肘回放直杆。','肩部稳定，避免双肘大幅向前抬。','上臂位置大致不变，通过伸肘将直杆向下压。','在舒适范围内伸直手臂，不猛锁肘或弯腰压杆。'],
    setup:'站在高位滑轮前，双脚踩稳；双手握住直杆，上臂贴近躯干，腹部收紧。', errors:'耸肩、用体重压杆、双肘摆动或松手让配重砸落。', description:'观察高位绳索与直杆的运动，突出肱三头肌伸肘。', keywords:['cable pushdown','triceps','下压','直杆','绳索','三头','器械'], source:'https://www.puregym.com/exercises/arms-and-shoulders/tricep-extension/tricep-pushdowns/',
  },
}
