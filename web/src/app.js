import { installLocaleUI } from './localeUI.js'
import { localePath, supportedLocale } from './localization.js'
import { resolveRoute } from './routes.js'
import { applyPageMetadata } from './pageMeta.js'
const route = resolveRoute(location.href, import.meta.env.BASE_URL)
if(route.type==='library'&&route.locale==='zh'&&!location.pathname.slice(import.meta.env.BASE_URL.length).startsWith('zh/')){
  let saved;try{saved=localStorage.getItem('movement.locale')}catch{}
  if(saved&&saved!=='zh'&&supportedLocale(saved)){const preferred=new URL(location.href);preferred.pathname=import.meta.env.BASE_URL+localePath('',saved);location.replace(preferred.href)}
}
applyPageMetadata(route)
// Legacy query links retain their animation but use the same canonical path.
if (route.type !== 'missing') {
  const clean = new URL(route.path, new URL(import.meta.env.BASE_URL, location.origin))
  const params = new URLSearchParams(location.search)
  params.delete('exercise'); params.delete('view')
  clean.search = params.toString()
  if (clean.pathname !== location.pathname || clean.search !== location.search) history.replaceState(null, '', clean)
}
const isViewer = route.type === 'exercise' || route.type === 'atlas'
document.documentElement.classList.toggle('library-root', !isViewer)
if (route.type === 'missing') {
  document.querySelector('#viewer-shell')?.remove()
  const content = document.querySelector('#seo-content')
  if (content) content.innerHTML = '<h1>页面未找到</h1><p>这个动作尚不存在。</p><a href="./">返回动作库</a>'
} else if (isViewer) {
  const shell = document.querySelector('#viewer-shell')
  await import('./main.js')
  document.querySelector('#seo-content')?.remove()
  if (shell) shell.hidden = false
} else {
  const { renderExerciseLibrary } = await import('./exerciseLibrary.js')
  renderExerciseLibrary(route.locale)
}

installLocaleUI(route)
