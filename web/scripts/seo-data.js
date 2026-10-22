import { LANGUAGES, localePath, localizedExercise, localizedConfig, term, pick } from '../src/localization.js'
import { EXERCISES } from '../src/exercises.js'
import { COMMON } from '../src/commonExercises.js'
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export const baseRouteList = ['', ...EXERCISES.map(e=>`exercises/${e.id}/`), 'anatomy/']
export const routeList = LANGUAGES.flatMap(l=>baseRouteList.map(path=>localePath(path,l.id)))
export const errorRoutes = LANGUAGES.map(l=>localePath('404.html',l.id))
function zhMetadata(route) {
  if (route.type === 'exercise') {
    const e=route.exercise
    return { title:`${e.title}动作教学与发力肌群｜3D演示 - Movement Lab`, description:`${e.title}三维动作演示，重点观察${e.muscles.join('、')}。支持旋转视角、慢放和骨骼切换，配有分步动作说明及常见错误提示。` }
  }
  if(route.type==='atlas') return { title:'3D人体解剖图谱｜肌肉、骨骼与器官 - Movement Lab', description:'交互式3D人体解剖图谱，分层观察肌肉、骨骼、器官、血管和神经，搜索结构名称并旋转查看人体。图谱支持英语和印地语。' }
  if(route.type==='missing') return { title:'页面未找到 - Movement Lab', description:'这个动作页面不存在，请返回动作库浏览已上线的三维动作演示。' }
  return {title:'健身动作库｜3D动作演示、发力肌群与动作教学 - Movement Lab',description:`浏览${EXERCISES.length}个常见健身动作，涵盖杠铃、哑铃、固定器械与徒手训练，以及核心稳定动作。用3D演示观察关节运动、主要与辅助发力肌群，结合分步说明理解动作。`}
}
function zhStaticContent(route) {
  const h=escapeHtml
  const nav='<nav aria-label="网站导航"><a href="./">动作库首页</a> · <a href="./anatomy/">人体图谱</a></nav>'
  if(route.type==='missing')return `${nav}<h1>页面未找到</h1><p>这个动作尚不存在。<a href="./">返回动作库</a></p>`
  if(route.type==='atlas')return `${nav}<h1>3D人体解剖图谱</h1><p>交互式分层人体图谱，包含肌肉、骨骼、器官、动脉、静脉、神经和皮肤。图谱界面支持英语与印地语。</p><p>启用 JavaScript 后可旋转人体，搜索结构名称，并切换解剖层。</p>`
  if(route.type==='library')return `${nav}<h1>健身动作库：3D动作演示与发力肌群</h1><p>${h(metadata(route).description)}</p><section aria-label="全部动作">${EXERCISES.map(e=>`<article><h2><a href="${h(e.href)}">${h(e.title)}</a></h2><p>${h(e.description)}</p><p>重点肌群：${h(e.muscles.join('、'))}。器械：${h(e.equipment.join('、'))}。</p><a href="${h(e.href)}">查看${h(e.title)}的3D演示与动作说明</a></article>`).join('')}</section>`
  const e=route.exercise,c=COMMON[e.id]
  const setup=c?.setup||'双脚踩实地面，头部、上背和臀部保持接触凳面；肩胛收紧，握距略宽于肩。'
  const steps=c?c.phases.map((p,i)=>[p,c.cues[i]]):[['控制下放','缓慢屈肘，将杠铃降到胸部上方，保持肩胛稳定。'],['底部停稳','保持张力，不借助弹胸反弹。'],['平稳推起','伸展双肘，肩胛保持稳定，臀部留在凳面。'],['顶部控制','稳定杠铃，避免猛然锁死肘关节，再控制下放。']]
  const errors=c?.errors||'下放过快或弹胸；耸肩、双肘过度外展；抬臀或过度拱腰。'
  return `${nav}<article><h1>${h(e.title)}：动作说明与发力肌群</h1><p>${h(e.description)}</p><p>重点肌群：${h(e.muscles.join('、'))}。器械：${h(e.equipment.join('、'))}。</p><h2>准备姿势</h2><p>${h(setup)}</p><h2>动作步骤</h2><ol>${steps.map(([name,text])=>`<li><h3>${h(name)}</h3><p>${h(text)}</p></li>`).join('')}</ol><h2>常见错误</h2><p>${h(errors)}</p><p>发力配色用于区分作用分工，不是实测肌肉激活强度。动画是程序化动作示意。</p><h2>其他常见动作</h2><ul>${EXERCISES.filter(item=>item.id!==e.id).map(item=>`<li><a href="${h(item.href)}">${h(item.title)}</a></li>`).join('')}</ul></article>`
}
export function metadata(route) {
  const locale=route.locale||'zh'
  if(locale==='zh')return zhMetadata(route)
  if(route.type==='exercise'){
    const e=localizedExercise(route.exercise,locale)
    return {title:`${e.title} · ${term('动作说明',locale)} · Movement Lab`,description:e.description+' '+term('分步说明',locale)+' · '+term('肌群标色',locale)+' · 3D.'}
  }
  const heading=term(route.type==='atlas'?'人体图谱':route.type==='missing'?'页面未找到':'动作库',locale)
  const description=route.type==='library'?pick([
    `Explore ${EXERCISES.length} exercises with 3D movement demos, muscle roles and step-by-step guides.`,
    `Explora ${EXERCISES.length} ejercicios con demos 3D, funciones musculares y guías paso a paso.`,
    `Explorez ${EXERCISES.length} exercices avec démos 3D, rôles musculaires et guides étape par étape.`,
    `${EXERCISES.length} Übungen mit 3D-Demos, Muskelrollen und schrittweisen Anleitungen erkunden.`,
    `Explore ${EXERCISES.length} exercícios com demos 3D, funções musculares e guias passo a passo.`,
    `${EXERCISES.length}種目の3D動作、筋肉の役割、ステップ別解説を確認できます。`,
    `${EXERCISES.length}개 운동의 3D 시연, 근육 역할 및 단계별 설명을 살펴보세요.`,
  ],locale):route.type==='atlas'?term('图谱内容使用英语和印地语。',locale):term('这个动作尚不存在。',locale)
  return {title:`${heading} · Movement Lab`,description}
}
export function staticContent(route) {
  const locale=route.locale||'zh'
  if(locale==='zh')return zhStaticContent(route)
  const h=escapeHtml,t=s=>h(term(s,locale)),href=path=>'./'+localePath(path,locale)
  const nav=`<nav aria-label="${t('网站导航')}"><a href="${href('')}">${t('动作库')}</a> · <a href="${href('anatomy/')}">${t('人体图谱')}</a></nav>`
  if(route.type==='missing')return `${nav}<h1>${t('页面未找到')}</h1><p>${t('这个动作尚不存在。')}</p>`
  if(route.type==='atlas')return `${nav}<h1>${t('人体图谱')}</h1><p>${t('图谱内容使用英语和印地语。')}</p>`
  const exercises=EXERCISES.map(e=>localizedExercise(e,locale))
  if(route.type==='library')return `${nav}<h1>${t('动作库')} · 3D</h1><p>${h(metadata(route).description)}</p><section>${exercises.map(e=>`<article><h2><a href="${h(e.href)}">${h(e.title)}</a></h2><p>${h(e.description)}</p><p>${h(e.equipment.join(' · '))}</p></article>`).join('')}</section>`
  const e=localizedExercise(route.exercise,locale),c=localizedConfig(COMMON[e.id]||route.exercise,e.id,locale)
  return `${nav}<article><h1>${h(e.title)}</h1><p>${h(e.description)}</p><p>${h(e.equipment.join(' · '))}</p><h2>${t('准备姿势')}</h2><p>${h(c.setup)}</p><h2>${t('动作说明')}</h2><ol>${c.phases.map((phase,i)=>`<li><h3>${h(phase)}</h3><p>${h(c.cues[i])}</p></li>`).join('')}</ol><h2>${t('常见错误')}</h2><p>${h(c.errors)}</p><p>${t('颜色不是实测发力强度；白色部位也可能参与稳定。')}</p></article>`
}
export function structuredData(route,siteUrl){
  const locale=route.locale||'zh',meta=metadata(route),url=siteUrl?new URL(route.path,siteUrl).href:undefined
  const page={'@context':'https://schema.org','@type':route.type==='library'?'CollectionPage':'WebPage',name:meta.title,description:meta.description,inLanguage:LANGUAGES.find(l=>l.id===locale).tag,...(url?{url}:{})}
  if(route.type==='library')page.mainEntity={'@type':'ItemList',itemListElement:EXERCISES.map((raw,i)=>{const e=localizedExercise(raw,locale);return {'@type':'ListItem',position:i+1,name:e.title,...(siteUrl?{url:new URL(localePath(`exercises/${e.id}/`,locale),siteUrl).href}:{})}})}
  if(route.type==='exercise'){const e=localizedExercise(route.exercise,locale);page.about={'@type':'ExercisePlan',name:e.title,description:e.description}}
  return page
}
