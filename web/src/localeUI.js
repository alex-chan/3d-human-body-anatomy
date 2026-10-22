import { LANGUAGES, localePath, translateUI, term } from './localization.js'
import './localeUI.css'
export function installLocaleUI(route) {
  const locale=route.locale||'zh'
  document.documentElement.lang=LANGUAGES.find(l=>l.id===locale).tag
  document.documentElement.dataset.locale=locale
  const wrapper=document.createElement('label');wrapper.className='language-picker'
  const label=term('语言',locale);wrapper.innerHTML=`<span aria-hidden="true">◎</span><select aria-label="${label}">${LANGUAGES.map(l=>`<option value="${l.id}" ${l.id===locale?'selected':''} lang="${l.tag}">${l.name}</option>`).join('')}</select>`
  if(route.type==='atlas'){
    const note=document.createElement('p');note.className='atlas-language-note';note.textContent=term('图谱内容使用英语和印地语。',locale);document.body.append(note)
  }
  const select=wrapper.querySelector('select')
  select.onchange=()=>{
    try{localStorage.setItem('movement.locale',select.value)}catch{}
    const url=new URL(location.href);url.pathname=import.meta.env.BASE_URL+localePath(route.basePath||'',select.value)
    location.assign(url.href)
  }
  const header=document.querySelector('.library-header nav');(header||document.body).append(wrapper)
  if(new URLSearchParams(location.search).has('preview'))wrapper.hidden=true
  const translateNode=node=>{
    if(node.nodeType===Node.TEXT_NODE){
      if(!node.parentElement||node.parentElement.closest('script,style,option,.language-picker,#viewer-shell'))return
      const next=translateUI(node.textContent,locale);if(next!==node.textContent)node.textContent=next
    }else if(node.nodeType===Node.ELEMENT_NODE){
      if(node.matches('script,style,option,.language-picker')||node.closest('#viewer-shell'))return
      for(const attr of['aria-label','placeholder','title','alt'])if(node.hasAttribute(attr)){const old=node.getAttribute(attr),next=translateUI(old,locale);if(next!==old)node.setAttribute(attr,next)}
      if(node.matches('a[href]')){
        const href=node.getAttribute('href')
        if(href.startsWith('./')&&!href.includes('previews/')){
          const path=href.slice(2)
          if(!LANGUAGES.some(l=>path.startsWith(l.id+'/'))&&locale!=='zh')node.setAttribute('href','./'+localePath(path,locale))
        }
      }
      for(const child of node.childNodes)translateNode(child)
    }
  }
  translateNode(document.body)
  const observer=new MutationObserver(records=>{
    for(const r of records){if(r.type==='characterData')translateNode(r.target);else if(r.type==='attributes')translateNode(r.target);else for(const n of r.addedNodes)translateNode(n)}
  })
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','alt','href']})
  return observer
}
