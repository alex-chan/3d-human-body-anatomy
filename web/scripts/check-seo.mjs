import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { EXERCISES } from '../src/exercises.js'
import { resolveRoute } from '../src/routes.js'
import { LANGUAGES, term } from '../src/localization.js'
import { routeList, errorRoutes } from './seo-data.js'
const directory=resolve(process.argv[2]||'dist')
const titles=new Set()
for(const path of [...routeList,...errorRoutes]){
  const file=path.endsWith('.html')?path:path+'index.html'
  const html=await readFile(resolve(directory,file),'utf8')
  const title=[...html.matchAll(/<title>(.*?)<\/title>/g)]
  assert.equal(title.length,1,`${file}: title count`)
  assert(!titles.has(title[0][1]),`${file}: duplicate title`);titles.add(title[0][1])
  assert.equal((html.match(/name="description"/g)||[]).length,1,`${file}: description count`)
  assert(html.includes('id="seo-content"'),`${file}: no static content`)
  assert(html.includes('id="viewer-shell" hidden'),`${file}: missing viewer shell`)
  const schema=JSON.parse(html.match(/id="seo-schema">([^<]+)<\/script>/)[1])
  assert.equal(schema['@context'],'https://schema.org')
  const route=resolveRoute('http://localhost/'+path)
  assert(html.includes(`lang="${LANGUAGES.find(l=>l.id===route.locale).tag}"`),`${file}: lang`)
  assert.equal(schema.inLanguage,LANGUAGES.find(l=>l.id===route.locale).tag)
  if(route.type==='library')assert.equal(schema.mainEntity.itemListElement.length,EXERCISES.length)
  if(route.type==='exercise')assert(html.includes(`<h2>${route.locale==='zh'?'动作步骤':term('动作说明',route.locale)}</h2>`),`${file}: missing instructions`)
  const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
  const base=html.match(/<base href="([^"]+)"/)[1]
  for(const [,src]of scripts){const local=src.startsWith(base)?src.slice(base.length):src;await access(resolve(directory,local))}
  if(route.type==='missing')assert(html.includes('noindex,follow'))
  if(html.includes('rel="canonical"')&&route.type!=='missing'){
    const alternate=[...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
    assert.equal(alternate.length,LANGUAGES.length+1,`${file}: hreflang count`)
    assert.equal(new Set(alternate.map(m=>m[1])).size,LANGUAGES.length+1)
    for(const item of alternate)assert(new URL(item[2]))
  }
}
const robots=await readFile(resolve(directory,'robots.txt'),'utf8')
if(robots.includes('Sitemap:')){
  const xml=await readFile(resolve(directory,'sitemap.xml'),'utf8')
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1])
  assert.equal(urls.length,routeList.length);assert.equal(new Set(urls).size,routeList.length)
  for(const url of urls){assert(!url.includes('localhost'));assert(!url.includes('?'));assert(new URL(url))}
}else assert(robots.includes('Disallow: /'))
console.log(`SEO checks passed: ${routeList.length} content pages + 8 localized error pages, unique metadata, static instructions, JSON-LD, assets and crawler configuration.`)
