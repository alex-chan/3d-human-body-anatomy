import { EXERCISES } from './exercises.js'
import { supportedLocale, localePath } from './localization.js'
export function resolveRoute(url, base = '/') {
  const parsed = new URL(url, 'http://localhost')
  let path = parsed.pathname
  if (path.startsWith(base)) path = path.slice(base.length)
  path = path.replace(/^\/+|\/+$/g, '')
  const prefix=path.split('/')[0],locale=supportedLocale(prefix)?prefix:'zh'
  if(supportedLocale(prefix))path=path.slice(prefix.length).replace(/^\//,'')
  const result=(type,basePath,exercise)=>({type,locale,basePath,path:localePath(basePath,locale),...(exercise?{exercise}:{} )})
  const legacy = parsed.searchParams.get('exercise')
  const id = path.startsWith('exercises/') ? path.slice(10) : legacy
  if (id) {
    const exercise = EXERCISES.find(item => item.id === id)
    return exercise ? result('exercise',`exercises/${id}/`,exercise) : result('missing','404.html')
  }
  if (path === 'anatomy' || parsed.searchParams.get('view') === 'atlas') return result('atlas','anatomy/')
  if (!path || path === 'index.html') return result('library','')
  return result('missing','404.html')
}
