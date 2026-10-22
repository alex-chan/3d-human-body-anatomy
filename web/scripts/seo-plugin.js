import { LANGUAGES, localePath, ogLocale } from '../src/localization.js'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveRoute } from '../src/routes.js'
import { escapeHtml as h, metadata, staticContent, structuredData, routeList, errorRoutes } from './seo-data.js'
export function seoPlugin({siteUrl='',base='/'}) {
  let outDir, building=false
  const decorate=(html,url='/')=>{
    const parsed=new URL(url,'http://localhost'),route=resolveRoute(url,base),meta=metadata(route)
    const indexable=!!siteUrl&&route.type!=='missing'&&!parsed.searchParams.has('preview')
    const canonical=siteUrl?new URL(route.path,siteUrl).href:''
    html=html.replace(/<html\b[^>]*>/,`<html lang="${LANGUAGES.find(l=>l.id===route.locale).tag}">`)
      .replace(/<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/,'')
      .replace(/<title>[\s\S]*?<\/title>/,'')
      .replace(/<meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,'')
      .replace(/<link\s+rel="(?:canonical|alternate)"[^>]*>/g,'')
    const data=JSON.stringify(structuredData(route,siteUrl)).replace(/</g,'\\u003c')
    const image=siteUrl?new URL(route.exercise?.thumbnail?.replace(/^\.\//,'')||'previews/bench.png',siteUrl).href:''
    const head=`<!-- SEO_HEAD_START -->\n<base href="${h(base)}" />\n<title>${h(meta.title)}</title>\n<meta name="description" content="${h(meta.description)}" />\n<meta name="robots" content="${indexable?'index,follow,max-image-preview:large':'noindex,follow'}" />\n<meta property="og:type" content="website" />\n<meta property="og:locale" content="${ogLocale(route.locale)}" />\n<meta property="og:site_name" content="Movement Lab" />\n<meta property="og:title" content="${h(meta.title)}" />\n<meta property="og:description" content="${h(meta.description)}" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${h(meta.title)}" />\n<meta name="twitter:description" content="${h(meta.description)}" />\n${siteUrl&&route.type!=='missing'?LANGUAGES.map(l=>`<link rel="alternate" hreflang="${l.tag}" href="${h(new URL(localePath(route.basePath,l.id),siteUrl).href)}" />`).join('')+`<link rel="alternate" hreflang="x-default" href="${h(new URL(route.basePath,siteUrl).href)}" />`:''}\n${canonical?`<link rel="canonical" href="${h(canonical)}" /><meta property="og:url" content="${h(canonical)}" />`:''}\n${image?`<meta property="og:image" content="${h(image)}" /><meta name="twitter:image" content="${h(image)}" />`:''}\n<script type="application/ld+json" id="seo-schema">${data}</script>\n<!-- SEO_HEAD_END -->`
    html=html.replace(/<base\s[^>]*>/g,'').replace('</head>',head+'\n</head>')
    const content=`<!-- SEO_CONTENT_START --><main id="seo-content">${staticContent(route)}</main><!-- SEO_CONTENT_END -->`
    if(html.includes('<!-- SEO_CONTENT_START -->'))html=html.replace(/<!-- SEO_CONTENT_START -->[\s\S]*?<!-- SEO_CONTENT_END -->/,content)
    else html=html.replace('<body>',`<body>\n${content}<div id="viewer-shell" hidden>`).replace('</body>','</div></body>')
    return html
  }
  return {name:'movement-seo',enforce:'post',configResolved(config){outDir=resolve(config.root,config.build.outDir);building=config.command==='build'},
    transformIndexHtml:{order:'post',handler(html,ctx){return decorate(html,ctx.originalUrl||ctx.path)}},
    async closeBundle(){
      if(!outDir||!building)return
      const template=await readFile(resolve(outDir,'index.html'),'utf8')
      for(const path of [...routeList,...errorRoutes]){
        const file=path.endsWith('.html')?path:path+'index.html'
        await mkdir(resolve(outDir,file,'..'),{recursive:true})
        await writeFile(resolve(outDir,file),decorate(template,base+path))
      }
      const robots=siteUrl?`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',siteUrl).href}\n`:'User-agent: *\nDisallow: /\n'
      await writeFile(resolve(outDir,'robots.txt'),robots)
      if(siteUrl)await writeFile(resolve(outDir,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routeList.map(path=>`<url><loc>${h(new URL(path,siteUrl).href)}</loc></url>`).join('')}</urlset>\n`)
    },
    configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url===base+'robots.txt'){res.setHeader('Content-Type','text/plain');res.end('User-agent: *\nDisallow: /\n');return}next()})},
  }
}
