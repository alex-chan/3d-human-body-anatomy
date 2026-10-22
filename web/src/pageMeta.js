import { LANGUAGES, localePath, ogLocale } from './localization.js'
import { metadata, structuredData } from '../scripts/seo-data.js'
export function applyPageMetadata(route) {
  const siteUrl=__MOVEMENT_SITE_URL__
  const meta=metadata(route)
  document.title=meta.title
  document.documentElement.lang=LANGUAGES.find(l=>l.id===route.locale).tag
  const set=(selector,attrs,content)=>{
    let element=document.head.querySelector(selector)
    if(!element){element=document.createElement('meta');for(const[key,value]of Object.entries(attrs))element.setAttribute(key,value);document.head.append(element)}
    element.setAttribute('content',content)
  }
  set('meta[name="description"]',{name:'description'},meta.description)
  for(const[property,value]of Object.entries({'og:title':meta.title,'og:description':meta.description}))set(`meta[property="${property}"]`,{property},value)
  for(const[name,value]of Object.entries({'twitter:title':meta.title,'twitter:description':meta.description}))set(`meta[name="${name}"]`,{name},value)
  set('meta[property="og:locale"]',{property:'og:locale'},ogLocale(route.locale))
  const preview=new URLSearchParams(location.search).has('preview')
  set('meta[name="robots"]',{name:'robots'},siteUrl&&route.type!=='missing'&&!preview?'index,follow,max-image-preview:large':'noindex,follow')
  if(siteUrl){
    const canonical=new URL(route.path,siteUrl).href
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el=>el.remove())
    for(const language of [...LANGUAGES,{id:'zh',tag:'x-default'}]){
      const alternate=document.createElement('link');alternate.rel='alternate';alternate.hreflang=language.tag;alternate.href=new URL(localePath(route.basePath,language.id),siteUrl).href;document.head.append(alternate)
    }
    let link=document.head.querySelector('link[rel="canonical"]')
    if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link)}
    link.href=canonical
    set('meta[property="og:url"]',{property:'og:url'},canonical)
    const image=new URL(route.exercise?.thumbnail?.replace(/^\.\//,'')||'previews/bench.png',siteUrl).href
    set('meta[property="og:image"]',{property:'og:image'},image)
    set('meta[name="twitter:image"]',{name:'twitter:image'},image)
  }
  let schema=document.querySelector('#seo-schema')
  if(!schema){schema=document.createElement('script');schema.type='application/ld+json';schema.id='seo-schema';document.head.append(schema)}
  schema.textContent=JSON.stringify(structuredData(route,siteUrl))
}
