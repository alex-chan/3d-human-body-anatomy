import { defineConfig } from 'vite'

// content/*.json is edited by the research agents; don't reload the page on every save
// (restart the dev server or reload manually to pick up new content).
const quietContent = {
  name: 'quiet-content',
  handleHotUpdate(ctx) { if (ctx.file.replace(/\\/g, '/').includes('/content/')) return [] },
  hotUpdate(ctx) { if (ctx.file.replace(/\\/g, '/').includes('/content/')) return [] },
}

export default defineConfig({
  plugins: [quietContent],
  // Relative asset paths, so the built site works at a domain root or in a sub-folder (e.g. GitHub Pages).
  base: './',
  server: { port: 5173, fs: { allow: ['..'] } },
  build: { chunkSizeWarningLimit: 1700 },
})
