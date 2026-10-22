import assert from 'node:assert/strict'
import { UI } from '../src/locales/ui.js'
import { TITLES, TERMS } from '../src/locales/terms.js'
import { GUIDE, MOTIONS } from '../src/locales/guides.js'
import { LANGUAGES, localizedExercise, localizedConfig, translateUI, localePath, term } from '../src/localization.js'
import { EXERCISES, filterExercises } from '../src/exercises.js'
import { COMMON } from '../src/commonExercises.js'
import { resolveRoute } from '../src/routes.js'
import { metadata, staticContent, structuredData, routeList } from './seo-data.js'
for(const dictionary of [UI,TITLES,TERMS,GUIDE])for(const[key,row]of Object.entries(dictionary)){
 assert.equal(row.length,LANGUAGES.length-1,`${key}: locale count`)
 for(const text of row)assert.equal(typeof text,'string',`${key}: missing translation`)
}
for(const language of LANGUAGES){
 const locale=language.id,items=EXERCISES.map(e=>localizedExercise(e,locale))
 for(const e of EXERCISES){assert(TITLES[e.id],`${e.id}: missing titles`);assert(MOTIONS[e.id],`${e.id}: missing movement guide`)}
 for(const e of items){
  const route=resolveRoute(`https://test.invalid/${localePath(`exercises/${e.id}/`,locale)}`)
  assert.equal(route.locale,locale);assert.equal(route.exercise.id,e.id)
  const cfg=localizedConfig(COMMON[e.id]||EXERCISES[0],e.id,locale)
  if(locale!=='zh'){
   for(const field of ['title','setup','errors','primaryText','assistText'])assert(cfg[field]?.length,`${locale}/${e.id}: ${field}`)
   assert.equal(cfg.phases.length,4);assert.equal(cfg.cues.length,4);assert(cfg.cues.every(Boolean))
   if(!['ja','ko'].includes(locale))assert(!/[\u3400-\u9fff]/.test([e.title,e.description,...e.muscles,...e.equipment,cfg.primaryText,cfg.assistText,cfg.setup,cfg.errors,...cfg.cues].join(' ')),`${locale}/${e.id}: Chinese fallback`)
  }
  assert(filterExercises(e.title,'all',items).some(item=>item.id===e.id),`${locale}/${e.id}: search`)
  assert(metadata(route).description.length>20)
  assert(staticContent(route).includes(e.title))
  assert.equal(structuredData(route,'https://test.invalid/').inLanguage,language.tag)
 }
 const legacy=resolveRoute(`https://test.invalid/${localePath('',locale)}?exercise=bench`)
 assert.equal(legacy.locale,locale);assert.equal(legacy.exercise.id,'bench')
 const missing=resolveRoute(`https://test.invalid/${localePath('exercises/absent/',locale)}`)
 assert.equal(missing.type,'missing');assert.equal(missing.locale,locale)
 assert.equal(translateUI('  ',locale),'  ')
 const translated=translateUI('找到 5 个动作 · 共 29 个已上线',locale)
 assert.equal(translateUI(translated,locale),translated,'translation must be idempotent')
}
assert.equal(new Set(routeList).size,(EXERCISES.length+2)*LANGUAGES.length)
assert(filterExercises('cuadriceps','all',EXERCISES.map(e=>localizedExercise(e,'es'))).length>0,'accent-insensitive search')
assert.equal(resolveRoute('https://test.invalid/app/de/exercises/cable-row/','/app/').exercise.id,'cable-row')
console.log(`i18n passed: ${LANGUAGES.length} languages × ${EXERCISES.length} exercises; dictionaries, guides, muscles, search, routes and metadata.`)
