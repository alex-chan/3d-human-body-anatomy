import { defineConfig, loadEnv } from 'vite'
import { seoPlugin } from './scripts/seo-plugin.js'

// content/*.json is edited by the research agents; don't reload the page on every save
// (restart the dev server or reload manually to pick up new content).
const quietContent = {
  name: 'quiet-content',
  handleHotUpdate(ctx) { if (ctx.file.replace(/\\/g, '/').includes('/content/')) return [] },
  hotUpdate(ctx) { if (ctx.file.replace(/\\/g, '/').includes('/content/')) return [] },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let siteUrl = ''
  if (env.SITE_URL) {
    const url = new URL(env.SITE_URL)
    if (!['https:', 'http:'].includes(url.protocol) || url.search || url.hash || url.username || url.password || /^(localhost|127\.|0\.0\.0\.0)/.test(url.hostname)) throw new Error('SITE_URL must be the public deployment URL, without query, hash, credentials, or localhost.')
    siteUrl = url.href.replace(/\/?$/, '/')
  }
  const base = siteUrl ? new URL(siteUrl).pathname : '/'
  return {
  define: { __MOVEMENT_SITE_URL__: JSON.stringify(siteUrl) },
  plugins: [quietContent, seoPlugin({ siteUrl, base })],
  // The public site URL determines the deployment base, including subfolders.
  base,
  server: { port: 5173, fs: { allow: ['..'] } },
  build: { chunkSizeWarningLimit: 1700 },
  }
})
