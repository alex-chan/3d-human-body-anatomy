import { COMMON } from './commonExercises.js'
// Add a record here when an exercise viewer is available. Only working entries
// appear in the catalogue; empty categories never point to placeholder demos.
export const EXERCISES = [
  {
    id: 'bench', title: '仰卧杠铃胸推', english: 'BARBELL BENCH PRESS',
    category: 'chest', muscles: ['胸大肌', '三角肌前束', '肱三头肌'],
    equipment: ['杠铃', '平板凳'], keywords: ['卧推', '胸推', 'bench', 'press', 'barbell'],
    description: '观察杠铃下放与推起时的关节运动，对照主要与辅助发力肌群。',
    thumbnail: './previews/bench-press.png', href: './exercises/bench/',
  },
]
EXERCISES.push(...Object.entries(COMMON).map(([id, cfg]) => ({ id, title:cfg.title, english:cfg.english, category:cfg.category, muscles:cfg.muscles, thumbnail:`./previews/${id}.png`, equipment:cfg.equipment || ['杠铃'], keywords:cfg.keywords, description:cfg.description, href:`./exercises/${id}/` })))
export const CATEGORIES = [
  { id: 'all', label: '全部动作' }, { id: 'chest', label: '胸部' },
  { id: 'back', label: '背部' }, { id: 'shoulders', label: '肩部' },
  { id: 'arms', label: '手臂' }, { id: 'legs', label: '腿部' }, { id: 'core', label: '核心' },
]
export function filterExercises(query = '', category = 'all', catalogue = EXERCISES) {
  const normalize=value=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase()
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean)
  return catalogue.filter(exercise => {
    const searchable = [exercise.title, exercise.english, ...exercise.muscles, ...exercise.equipment, ...exercise.keywords].join(' ')
    const normalized=normalize(searchable)
    return (category === 'all' || category === exercise.category) && terms.every(term => normalized.includes(term))
  })
}
