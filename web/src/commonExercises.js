import { addLibraryExpansion } from './libraryExpansion.js'
import { EXTRA } from './extraExercises.js'
export const COMMON = {
  squat: {
    title:'杠铃深蹲', english:'BARBELL BACK SQUAT', category:'legs', muscles:['股四头肌','臀大肌','大收肌'], primary:/rectus femoris|vastus|gluteus maximus/i, assist:/adductor magnus|soleus|gastrocnemius/i,
    primaryText:'股四头肌、臀大肌', assistText:'大收肌、小腿肌群',
    phases:['下蹲','底部控制','站起','站稳'],
    cues:['屈髋屈膝下蹲，保持全脚掌支撑，膝盖朝脚尖方向。','在可控制的深度停稳，脚跟踩实，躯干保持稳定。','脚掌向下推地，髋膝协调伸展，回到站姿。','站稳后重新收紧躯干，准备下一次下蹲。'],
    setup:'杠铃放在上背部，双手握稳。双脚约肩宽或略宽，收紧躯干，保持自然脊柱曲线。', errors:'膝盖内扣、脚跟抬起、弓背塌腰，或在底部失控反弹。',source:'https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/',description:'观察屈髋屈膝与蹬地站起，认识腿部和臀部的协同发力。', keywords:['squat','下蹲','臀腿'],
  },
  deadlift: {
    title:'杠铃硬拉', english:'BARBELL DEADLIFT', category:'legs', muscles:['臀大肌','腘绳肌','股四头肌','竖脊肌'],primary:/gluteus maximus|biceps femoris|semitendinosus|semimembranosus|rectus femoris|vastus/i,assist:/erector|iliocostalis|longissimus|spinalis|latissimus|trapezius|flexor.*(carpi|digitorum)/i,
    primaryText:'臀大肌、腘绳肌、股四头肌',assistText:'竖脊肌、背阔肌、握持肌群',phases:['下放','底部准备','提拉','站稳'],
    cues:['髋部向后折叠，配合屈膝，让杠铃靠近腿部下放。','双脚踩稳、腹部收紧，先建立张力，再开始提拉。','脚掌推地，髋膝协调伸展，保持杠铃靠近身体。','自然站直，避免向后仰腰，保持杠铃稳定。'],
    setup:'双脚约髋宽，杠铃位于脚掌中部上方。屈髋屈膝握杠，收紧核心，保持背部中立。',errors:'弓背猛拉、杠铃远离身体、髋部先抬起，或顶端后仰。',source:'https://www.nasm.org/resource-center/exercise-library/barbell-deadlift', description:'从髋部折叠到髋膝伸展，观察后侧链与腿部的共同参与。',keywords:['deadlift','后侧链','硬举'],
  },
  press: {
    title:'站姿杠铃推举',english:'STANDING OVERHEAD PRESS',category:'shoulders',muscles:['三角肌','肱三头肌','斜方肌'],primary:/clavicular part of deltoid|acromial part of deltoid/i,assist:/triceps brachii|trapezius|serratus anterior/i,
    primaryText:'三角肌前束、中束',assistText:'肱三头肌、斜方肌、前锯肌',phases:['下放','肩部停稳','推举','顶部控制'],
    cues:['控制屈肘，将杠铃降回肩前，保持躯干稳定。','杠铃在肩前停稳，收紧腹部和臀部，避免后仰。','将杠铃推向头顶，不借助屈膝蹬腿；注意避开面部。','手臂接近伸直，稳定杠铃，保持肋骨和骨盆对齐。'],
    setup:'双脚踩稳，握距略宽于肩，杠铃置于肩前。收紧腹部和臀部，保持躯干稳定。',errors:'过度后仰、塌腰、屈膝借力，或快速失控下放。',source:'https://www.crossfit.com/essentials/the-shoulder-press', description:'观察肩关节上举与肘关节伸展，理解肩部和上臂的配合。',keywords:['overhead','shoulder','press','肩推'],
  },
  row: {
    title:'俯身杠铃划船',english:'BENT-OVER BARBELL ROW',category:'back',muscles:['背阔肌','菱形肌','斜方肌','肱二头肌'],primary:/latissimus|rhomboid|transverse part of trapezius/i,assist:/biceps brachii|brachialis|scapular spinal part of deltoid/i,
    primaryText:'背阔肌、菱形肌、斜方肌中部',assistText:'肱二头肌、肱肌、三角肌后束',phases:['下放','底部伸展','划拉','顶部控制'],
    cues:['缓慢伸肘放下杠铃，保持俯身角度，避免背部松垮。','手臂自然伸展，腹部保持收紧，躯干保持稳定。','双肘向后带动杠铃，拉向腹部附近，不要耸肩。','短暂稳定肩胛与躯干，再控制杠铃下放。'],
    setup:'双脚踩稳，屈膝并从髋部向前折叠，保持背部中立；握稳杠铃，让双臂自然垂下。',errors:'来回甩动躯干借力、耸肩、弓背，或手腕过度弯曲。',source:'https://www.catalystathletics.com/exercise/171/Bent-Row/',description:'保持俯身姿势，观察肘部后拉时背部肌群的作用。',keywords:['row','划船','背部'],
  },
  curl: {
    title:'站姿杠铃弯举',english:'STANDING BARBELL CURL',category:'arms',muscles:['肱二头肌','肱肌','肱桡肌'],primary:/biceps brachii/i,assist:/brachialis|brachioradialis/i,
    primaryText:'肱二头肌',assistText:'肱肌、肱桡肌',phases:['下放','底部控制','弯举','顶部收缩'],
    cues:['缓慢伸肘下放，保持上臂贴近身体，不要甩动杠铃。','手臂接近伸直，手腕保持稳定，准备再次屈肘。','以上臂为支点屈肘，将杠铃举向肩前，避免身体后仰。','在可控制的位置短暂停稳，不要把双肘大幅向前抬。'],
    setup:'站姿稳定，掌心朝前握杠。上臂贴近身体两侧，收紧躯干，手腕保持自然。',errors:'用腰背甩动借力、双肘前后摆动，或手腕过度折弯。',source:'https://www.acefitness.org/resources/everyone/exercise-library/70/bicep-curl/',description:'聚焦肘关节屈伸，区分肱二头肌与上臂、前臂辅助肌群。',keywords:['curl','bicep','二头','弯举'],
  },
}

Object.assign(COMMON, EXTRA)

addLibraryExpansion(COMMON)
