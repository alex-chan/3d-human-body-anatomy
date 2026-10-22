import { addExpansionLocales } from './locales/expansion.js'
import { UI } from './locales/ui.js'
import { TERMS, TITLES } from './locales/terms.js'
import { GUIDE, MOTIONS } from './locales/guides.js'
addExpansionLocales(TITLES,TERMS,GUIDE,MOTIONS)
export const LANGUAGES=[{id:'zh',tag:'zh-CN',name:'简体中文'},{id:'en',tag:'en',name:'English'},{id:'es',tag:'es',name:'Español'},{id:'fr',tag:'fr',name:'Français'},{id:'de',tag:'de',name:'Deutsch'},{id:'pt',tag:'pt',name:'Português'},{id:'ja',tag:'ja',name:'日本語'},{id:'ko',tag:'ko',name:'한국어'}]
export const ogLocale=locale=>({zh:'zh_CN',en:'en_US',es:'es_ES',fr:'fr_FR',de:'de_DE',pt:'pt_BR',ja:'ja_JP',ko:'ko_KR'}[locale]||'zh_CN')
export const supportedLocale=value=>LANGUAGES.some(l=>l.id===value)
export function localePath(path='',locale='zh'){return (locale==='zh'?'':`${locale}/`)+path.replace(/^\.\//,'').replace(/^\//,'')}
export function browserLocale(){
  if(typeof location==='undefined')return 'zh'
  const first=location.pathname.slice(import.meta.env.BASE_URL.length).split('/')[0]
  return supportedLocale(first)?first:'zh'
}
const index=locale=>LANGUAGES.findIndex(l=>l.id===locale)-1
export function pick(row,locale){return locale==='zh'?undefined:row?.[index(locale)]||row?.[0]}
export function term(text,locale='zh'){
  if(locale==='zh')return text
  const exact=pick(UI[text]||TERMS[text],locale)
  if(exact)return exact
  const parts=text.split(/(、|，| · |\/)/);const translated=parts.map(s=>pick(TERMS[s],locale)||s).join('')
  return translated===text?text:translated.replace(/、|，/g,', ')
}
export function guideFor(id,locale){
  const [motion,setup]=MOTIONS[id]||['press','standing'],g=key=>pick(GUIDE[key],locale)
  const down=motion==='plank'?'plankHold':motion==='deadbug'?'deadbugMove':motion==='front'?'raiseDown':`${motion}Down`
  const up=motion==='plank'?'plankHold':motion==='deadbug'?'deadbugMove':motion==='front'?'frontUp':`${motion}Up`
  return {phases:(motion==='plank'?['hold','bottom','hold','bottom']:['return','bottom','effort','hold']).map(g),cues:[g(down),id==='floor-press'?g('floorControl'):g('steady'),g(up),g('control')],setup:g(setup),errors:g(motion==='squat'?'squatErrors':['plank','deadbug'].includes(motion)?'coreErrors':'errors')}
}
export function localizedExercise(e,locale='zh'){
  if(locale==='zh')return {...e}
  const title=pick(TITLES[e.id],locale)||e.english
  const muscles=e.muscles.map(m=>term(m,locale)),equipment=e.equipment.map(m=>term(m,locale))
  const description=pick([
    `Explore ${title.toLowerCase()} in 3D. Focus: ${muscles.join(', ')}.`,
    `Explora ${title.toLowerCase()} en 3D. Músculos: ${muscles.join(', ')}.`,
    `Explorez ${title.toLowerCase()} en 3D. Muscles : ${muscles.join(', ')}.`,
    `${title} in 3D erkunden. Muskeln: ${muscles.join(', ')}.`,
    `Explore ${title.toLowerCase()} em 3D. Músculos: ${muscles.join(', ')}.`,
    `${title}を3Dで確認。対象：${muscles.join('、')}。`,
    `${title} 동작을 3D로 확인하세요. 대상: ${muscles.join(', ')}.`,
  ],locale)
  return {...e,title,muscles,equipment,description,href:`./${localePath(`exercises/${e.id}/`,locale)}`}
}
export function localizedConfig(cfg,id,locale='zh'){
  if(locale==='zh')return cfg
  const e=localizedExercise({...cfg,id,equipment:cfg.equipment||['杠铃'],muscles:cfg.muscles||[]},locale)
  return {...cfg,...e,...guideFor(id,locale),primaryText:term(cfg.primaryText||'胸大肌',locale),assistText:term(cfg.assistText||'三角肌前束、肱三头肌',locale)}
}
export function translateUI(source,locale){
  if(locale==='zh')return source
  const text=source.trim();if(!text)return source
  const spaceBefore=source.match(/^\s*/)[0],spaceAfter=source.match(/\s*$/)[0]
  let translated=term(text,locale),m
  const row=values=>pick(values,locale)
  if((m=text.match(/^全部 (\d+) 个动作$/)))translated=row([`All ${m[1]} exercises`,`${m[1]} ejercicios`,`${m[1]} exercices`,`Alle ${m[1]} Übungen`,`${m[1]} exercícios`,`${m[1]}種目すべて`,`전체 ${m[1]}개 운동`])
  if((m=text.match(/^找到 (\d+) 个动作 · 共 (\d+) 个已上线$/)))translated=row([`${m[1]} results · ${m[2]} available`,`${m[1]} resultados · ${m[2]} disponibles`,`${m[1]} résultats · ${m[2]} disponibles`,`${m[1]} Ergebnisse · ${m[2]} verfügbar`,`${m[1]} resultados · ${m[2]} disponíveis`,`${m[1]}件 / 全${m[2]}種目`,`${m[1]}개 결과 · 전체 ${m[2]}개`])
  if((m=text.match(/^当前已上线 (\d+) 个动作，后续新增动作将在这里统一展示。$/)))translated=row([`${m[1]} exercises available. New additions will appear here.`,`${m[1]} ejercicios disponibles. Las novedades aparecerán aquí.`,`${m[1]} exercices disponibles. Les nouveautés apparaîtront ici.`,`${m[1]} Übungen verfügbar. Neue Übungen erscheinen hier.`,`${m[1]} exercícios disponíveis. Novidades aparecerão aqui.`,`${m[1]}種目を公開中。新しい種目はここに追加されます。`,`${m[1]}개 운동 제공 중. 새 운동도 이곳에 추가됩니다.`])
  if(text==='← 全部动作')translated='← '+term('全部动作',locale)
  if(text.includes('，进入3D演示'))translated=text.replace('，进入3D演示',' · '+term('进入动作演示',locale))
  if(text.endsWith('三维演示'))translated=text.replace('三维演示',' · 3D')
  if(text==='点击「动作说明」查看完整要领')translated=term('动作说明',locale)
  if(text==='拖动旋转 · 滚轮缩放')translated=row(['Drag to rotate · Scroll to zoom','Arrastra para girar · Desplaza para ampliar','Glisser pour pivoter · Défiler pour zoomer','Ziehen zum Drehen · Scrollen zum Zoomen','Arraste para girar · Role para ampliar','ドラッグで回転・スクロールで拡大','드래그로 회전 · 스크롤로 확대'])
  if(text==='动作示意 · 未模拟真实负重和软组织力学')translated=term('拖动旋转 · 滚轮缩放 ／ 程序化动作示意，未模拟真实负重和软组织力学',locale).split('/').pop().trim()
  return spaceBefore+translated+spaceAfter
}
