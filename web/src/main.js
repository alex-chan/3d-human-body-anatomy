import { Anatomy, LAYER_ORDER } from './anatomy.js'
import { LAYER_INFO, entries, displayName, entryName, sections, doctorKB, setContentLanguage, availableLanguages } from './content.js'
import { Doctor } from './doctor.js'
import { Brain } from './brain.js'
import { sfx, play } from './sfx.js'
import { TourRunner } from './tours.js'
import { Intro } from './intro.js'
import { t, setLang, getLang } from './i18n.js'

const $ = (s) => document.querySelector(s)
const layerLabel = (k) => t('layer.' + k)
const anatomy = new Anatomy($('#scene'), $('#labels'))
window.anatomy = anatomy

const ICONS = {
  skin: '<path d="M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/><path d="M6 21v-5l-2-4 3-3h10l3 3-2 4v5"/>',
  muscles: '<path d="M4 15c2-6 6-9 10-9 3 0 5 2 5 4s-2 3-4 3c-1 0-2-1-2-2"/><path d="M4 15c3 3 8 4 12 2"/>',
  organs: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  arteries: '<path d="M12 3v7M12 10l-6 6M12 10l6 6M6 16v4M18 16v4M12 10v10"/>',
  veins: '<path d="M6 3c0 6 6 6 6 12v6M18 3c0 6-6 6-6 12"/><path d="M9 8h0M15 8h0"/>',
  nerves: '<path d="M12 3v18M12 8l-5-3M12 8l5-3M12 13l-6 2M12 13l6 2M12 18l-4 3M12 18l4 3"/>',
  skeleton: '<path d="M7 5a2 2 0 1 1 3 2l4 4 0 0a2 2 0 1 1 2 3l-3 0 0 0a2 2 0 1 1-2 3l-4-4a2 2 0 1 1-3-2l3 0a2 2 0 0 1 0-6z"/>',
}

// ---------------- layers panel ----------------
const DEFAULT_VISIBLE = { skeleton: true }
const layerUI = {}
const list = $('#layer-list')
for (const key of ['skin', 'muscles', 'organs', 'arteries', 'veins', 'nerves', 'skeleton']) {
  const info = LAYER_INFO[key]
  const row = document.createElement('div')
  row.className = 'layer'
  row.style.setProperty('--c', info.color === '#e9dcc3' ? '#f0e2c4' : info.color)
  row.innerHTML = `
    <span class="licon"><svg viewBox="0 0 24 24">${ICONS[key]}</svg></span>
    <span class="lname"></span>
    <span class="lstate"></span>
    <input type="range" min="0" max="1" step="0.05" value="1" />`
  const rng = row.querySelector('input[type=range]')
  const ui = layerUI[key] = { row, rng, state: row.querySelector('.lstate'), name: row.querySelector('.lname'), on: false }
  row.addEventListener('click', (e) => {
    if (e.target === rng) return
    if (ui.on && anatomy.layers[key]?.failed) { retryLayer(key); play.on(); return }
    setLayer(key, !ui.on); ui.on ? play.on() : play.off()
  })
  row.addEventListener('mouseenter', play.hover)
  rng.addEventListener('input', () => { anatomy.setOpacity(key, +rng.value); rng.style.setProperty('--v', rng.value * 100 + '%') })
  list.appendChild(row)
  anatomy.setOpacity(key, 1)
  setLayer(key, !!DEFAULT_VISIBLE[key])
}

function setLayer(key, on) {
  const ui = layerUI[key]
  ui.on = on
  ui.row.classList.toggle('on', on)
  anatomy.setVisible(key, on)
  refreshLayerStates()
}
function retryLayer(key) {
  anatomy.loadLayer(key).catch(() => {})
  refreshLayerStates()
}
function refreshLayerStates() {
  for (const [k, ui] of Object.entries(layerUI)) {
    const L = anatomy.layers[k]
    const failed = ui.on && L?.failed && !L?.loading
    const loading = ui.on && !L?.loaded && !failed
    ui.row.classList.toggle('loading-layer', loading)
    ui.name.textContent = layerLabel(k).toUpperCase()
    ui.rng.setAttribute('aria-label', t('ui.opacityOf', { layer: layerLabel(k) }))
    ui.rng.title = t('ui.opacity')
    ui.state.textContent = failed ? t('state.retry') : loading ? t('state.loading') : ui.on ? `${t('state.on')} · ${L?.meshes?.length || ''}` : t('state.off')
  }
  const pending = LAYER_ORDER.filter((k) => anatomy.layers[k]?.visible && !anatomy.layers[k]?.loaded && !anatomy.layers[k]?.failed)
  $('#loading').textContent = pending.length ? `▸ ${t('state.streaming')} ${pending.map((k) => layerLabel(k).toUpperCase()).join(' · ')}` : ''
}

// ---------------- landing page (boot) ----------------
// The 3D body loads behind the landing text; intro.js turns it and peels it layer by layer while it streams in.
const bootLog = $('#boot-log'), bootFill = $('#boot-fill'), bootBtn = $('#boot-start'), tourBtn = $('#boot-tour')
const logLine = (txt, ok) => { const d = document.createElement('div'); d.innerHTML = `&gt; ${txt} ${ok ? '<span class="ok">[OK]</span>' : ''}`; bootLog.replaceChildren(d) }
const bootOrder = ['skeleton', 'organs', 'arteries', 'veins', 'muscles', 'skin', 'nerves']
let loadedCount = 0, booted = false
document.body.classList.add('intro')
const intro = new Intro(anatomy, {
  onStage: (from, to) => {
    const name = (ks) => ks.map((k) => layerLabel(k).toUpperCase()).join(' + ')
    $('#boot-stage').textContent = to ? `${t('landing.scanning')} · ${name(from)} → ${name(to)}` : `${t('landing.showing')} · ${name(from)}`
  },
})
window.intro = intro
function countUp(el, to) {
  const from = +el.dataset.v || 0, t0 = performance.now()
  el.dataset.v = to
  const step = () => { const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)).toLocaleString(); if (k < 1) requestAnimationFrame(step) }
  step()
}
countUp($('#stat-entries'), entries.length)
logLine(t('landing.logKb', { n: entries.length }), entries.length > 0)
function setReady() {
  bootBtn.disabled = tourBtn.disabled = false
  bootBtn.textContent = t('landing.start')
}
anatomy.addEventListener('layerloaded', (e) => {
  loadedCount++
  bootFill.style.width = (loadedCount / bootOrder.length) * 100 + '%'
  countUp($('#stat-parts'), Object.values(anatomy.layers).reduce((n, L) => n + (L.loaded ? L.meshes.length : 0), 0))
  logLine(t('landing.logLoaded', { layer: layerLabel(e.detail.key).toUpperCase(), n: e.detail.count }), true)
  if (e.detail.key === 'skeleton' && !booted) {
    setReady()
    intro.start()
    setTimeout(() => doctor.walkOn(), 600)
  }
  refreshLayerStates()
})
anatomy.addEventListener('layerfailed', refreshLayerStates)

function enterApp(then) {
  if (booted) return
  booted = true
  intro.stop()
  document.body.classList.remove('intro')
  $('#boot').classList.add('gone'); play.boot()
  applyLayers({ skeleton: 1 })
  anatomy.resetView()
  if (doctor.state !== 'walking' && !doctor.docked) doctor.walkOn()
  setTimeout(() => (then ? then() : doctor.greet()), 900)
}
bootBtn.addEventListener('click', () => enterApp())
tourBtn.addEventListener('click', () => enterApp(() => tours.start('blood')))

;(async () => {
  for (const k of bootOrder) {
    // One automatic retry per layer, so a single dropped request on a slow connection doesn't matter.
    await anatomy.loadLayer(k)
      .catch(() => new Promise((r) => setTimeout(r, 1500)).then(() => anatomy.loadLayer(k)))
      .catch((e) => logLine(t('landing.logFailed', { layer: layerLabel(k).toUpperCase(), err: e?.message || 'network error' })))
  }
  // Never leave visitors stuck on the landing page, even if the skeleton could not be downloaded.
  if (bootBtn.disabled) { setReady(); intro.start(); doctor.walkOn() }
})()

// ---------------- presets ----------------
const PRESETS = [   // [string key, layers]
  ['preset.bones', { skeleton: 1 }],
  ['preset.veins', { veins: 1 }],
  ['preset.veinsBones', { veins: 1, skeleton: 1 }],
  ['preset.vessels', { arteries: 1, veins: 1 }],
  ['preset.vesselsBones', { arteries: 1, veins: 1, skeleton: 1 }],
  ['preset.organs', { organs: 1 }],
  ['preset.organsBones', { organs: 1, skeleton: 1 }],
  ['preset.muscles', { muscles: 1 }],
  ['preset.musclesBones', { muscles: 1, skeleton: 1 }],
  ['preset.nervesBones', { nerves: 1, skeleton: 1 }],
  ['preset.full', { skin: 1 }],
  ['preset.xray', { skin: 0.2, skeleton: 1, organs: 1, arteries: 1, veins: 1 }],
]
export function applyLayers(cfg) {
  for (const key of Object.keys(layerUI)) {
    const on = key in cfg
    if (on) {
      const op = cfg[key]
      layerUI[key].rng.value = op
      layerUI[key].rng.style.setProperty('--v', op * 100 + '%')
      anatomy.setOpacity(key, op)
    }
    setLayer(key, on)
  }
}
for (const [key, cfg] of PRESETS) {
  const b = document.createElement('button')
  b.dataset.i18n = key
  b.textContent = t(key)
  b.addEventListener('click', () => { applyLayers(cfg); play.on() })
  b.addEventListener('mouseenter', play.hover)
  $('#presets').appendChild(b)
}

// ---------------- dock ----------------
/** Dock on/off button. Returns a setter so other code (e.g. Dr. Buddy) can flip it and keep the button in sync. */
const toggleBtn = (id, fn, initial = false) => {
  const b = $(id); let v = initial
  b.classList.toggle('on', v)
  const set = (nv) => { v = nv; b.classList.toggle('on', v); fn(v) }
  b.addEventListener('click', () => { set(!v); v ? play.on() : play.off() })
  b.addEventListener('mouseenter', play.hover)
  return set
}
toggleBtn('#toggle-labels', (v) => anatomy.setShowLabels(v))
toggleBtn('#toggle-scan', (v) => { anatomy.scanner = v }, true)
const setSpin = toggleBtn('#toggle-rotate', (v) => { anatomy.controls.autoRotate = v })
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const setLive = toggleBtn('#toggle-live', (v) => anatomy.setLive(v), !reducedMotion)
anatomy.setLive(!reducedMotion)
toggleBtn('#toggle-sfx', (v) => { sfx.enabled = v }, true)
$('#reset-view').addEventListener('click', () => { anatomy.isolated = false; anatomy.select(null); anatomy.resetView(); play.click() })
const segGroup = (sel, attr, fn) => {
  for (const b of document.querySelectorAll(`${sel} button`)) {
    b.addEventListener('click', () => {
      document.querySelectorAll(`${sel} button`).forEach((x) => x.classList.toggle('active', x === b))
      fn(b.dataset[attr]); play.click()
    })
    b.addEventListener('mouseenter', play.hover)
  }
}
segGroup('#render-mode', 'mode', (m) => anatomy.setRenderMode(m))
segGroup('#quality', 'q', (q) => anatomy.setQuality(q))

// Start phones and low-power machines on a lighter setting; everyone can still switch in the dock.
function defaultQuality() {
  const touch = matchMedia('(pointer: coarse)').matches
  const small = Math.min(screen.width, screen.height) < 768
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
  if (touch && small) return 'performance'
  if (touch || weak) return 'high'
  return 'ultra'
}
const startQ = defaultQuality()
if (startQ !== 'ultra') {
  anatomy.setQuality(startQ)
  document.querySelectorAll('#quality button').forEach((b) => b.classList.toggle('active', b.dataset.q === startQ))
}

// ---------------- name mode ----------------
let nameMode = 'medical'
/** The name shown as the secondary line: common when a medical name is primary, else the English medical name. */
const otherMode = () => (nameMode === 'common' ? 'medical' : 'common')
segGroup('.hud-top .name-seg', 'names', (m) => {
  nameMode = m
  anatomy.setNameMode(m)
  if (anatomy.selected) renderInfo(anatomy.selected)
})

// ---------------- picking / hover ----------------
const tooltip = $('#tooltip')
let downAt = null, lastHoverName = null
const canvas = $('#scene')
canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY } })
canvas.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return
  if (doctor.hitTest(e.clientX, e.clientY)) return
  const m = anatomy.pick(e.clientX, e.clientY)
  anatomy.select(m || null)
  if (m) play.select()
})
let hoverRaf = 0
canvas.addEventListener('pointermove', (e) => {
  if (e.buttons) { tooltip.classList.add('hidden'); return }
  cancelAnimationFrame(hoverRaf)
  hoverRaf = requestAnimationFrame(() => {
    if (doctor.isOver(e.clientX, e.clientY)) {
      anatomy.setHover(null); canvas.style.cursor = 'pointer'
      tooltip.innerHTML = `Dr. Buddy<small>${esc(t('ui.clickBuddy'))}</small>`
      tooltip.style.left = e.clientX + 'px'; tooltip.style.top = e.clientY + 'px'; tooltip.classList.remove('hidden')
      return
    }
    const m = anatomy.pick(e.clientX, e.clientY)
    anatomy.setHover(m)
    if (!m) { tooltip.classList.add('hidden'); canvas.style.cursor = ''; lastHoverName = null; return }
    canvas.style.cursor = 'crosshair'
    if (lastHoverName !== m.userData.zname) { play.hover(); lastHoverName = m.userData.zname }
    const other = otherMode()
    const a = displayName(m.userData.zname, nameMode, true, m.userData.layer), b = displayName(m.userData.zname, other, true, m.userData.layer)
    tooltip.innerHTML = `${esc(a)}${a !== b ? `<small>${esc(b)}</small>` : ''}<small class="l">${esc(layerLabel(m.userData.layer).toUpperCase())}</small>`
    tooltip.style.left = e.clientX + 'px'; tooltip.style.top = e.clientY + 'px'
    tooltip.classList.remove('hidden')
  })
})
canvas.addEventListener('pointerleave', () => { tooltip.classList.add('hidden'); anatomy.setHover(null) })

// ---------------- info panel ----------------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const host = (u) => { try { return new URL(u).hostname.replace('www.', '') } catch { return u } }
function renderInfo(sel) {
  const panel = $('#info')
  if (!sel) { panel.classList.add('hidden'); return }
  panel.classList.remove('hidden')
  panel.style.animation = 'none'; panel.offsetHeight; panel.style.animation = ''
  const { entry, objName, layer } = sel
  $('#info-layer').textContent = layerLabel(layer) + (entry?.category && entry.category !== 'Group' ? ' · ' + entry.category : '')
  if (entry) {
    const main = entryName(entry, nameMode), alt = entryName(entry, otherMode())
    $('#info-title').textContent = main
    $('#info-alt').textContent = alt !== main ? t(nameMode === 'common' ? 'info.medicalName' : 'info.commonName') + ': ' + alt : ''
    $('#info-body').innerHTML = `
      <p>${esc(entry.summary)}</p>
      ${entry.function ? `<h4>${t('info.function')}</h4><p>${esc(entry.function)}</p>` : ''}
      ${entry.location ? `<h4>${t('info.location')}</h4><p>${esc(entry.location)}</p>` : ''}
      ${entry.facts?.length ? `<h4>${t('info.facts')}</h4><ul>${entry.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      ${entry.sources?.length ? `<h4>${t('info.sources')}</h4><ul class="src">${entry.sources.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a></li>`).join('')}</ul>` : ''}`
  } else {
    const main = displayName(objName, nameMode, true, layer), alt = displayName(objName, otherMode(), true, layer)
    $('#info-title').textContent = main
    $('#info-alt').textContent = alt !== main ? alt : ''
    const sec = sections[layer]
    $('#info-body').innerHTML = `<p>${esc(t('info.minor', { layer: layerLabel(layer).toLowerCase() }))}</p>
      ${sec?.overview ? `<h4>${esc(sec.overview.title.toUpperCase())}</h4><p>${esc(sec.overview.summary)}</p>` : ''}`
  }
  $('#info-isolate').textContent = t(anatomy.isolated ? 'info.showAll' : 'info.isolate')
}
anatomy.addEventListener('select', (e) => renderInfo(e.detail))
$('#info-close').addEventListener('click', () => { anatomy.select(null); play.off() })
$('#info-isolate').addEventListener('click', () => { anatomy.toggleIsolate(); renderInfo(anatomy.selected); play.click() })
$('#info-explain').addEventListener('click', () => {
  const s = anatomy.selected
  if (!s) return
  play.pop()
  if (s.entry) doctor.explainEntry(s.entry)
  else doctor.say(t('info.minorSay', { name: displayName(s.objName, nameMode, false, s.layer), layer: layerLabel(s.layer).toLowerCase() }))
})

// ---------------- search ----------------
const input = $('#search'), results = $('#search-results')
let hl = 0, current = []
function searchEntries(q) {
  q = q.trim().toLowerCase()
  if (!q) return []
  const out = []
  for (const e of entries) {
    const hay = [e.medical, e.common, e._en?.common, e.medical_hi, e.id, e.category].join(' ').toLowerCase()
    const i = hay.indexOf(q)
    if (i >= 0) out.push({ e, s: (e.medical.toLowerCase().startsWith(q) || (e.common || '').toLowerCase().startsWith(q) ? 0 : 1) + i / 1000 + Math.min(e.medical.length, (e.common || e.medical).length) / 1e5 - ((e.common || '').toLowerCase() === q ? 1 : 0) })
  }
  return out.sort((a, b) => a.s - b.s).slice(0, 12).map((x) => x.e)
}
function showResults() {
  results.innerHTML = current.map((e, i) => `<li data-i="${i}" class="${i === hl ? 'hl' : ''}"><span>${esc(entryName(e, nameMode))}</span><small>${esc(layerLabel(e.layer))}</small></li>`).join('')
  results.classList.toggle('open', current.length > 0)
}
export function goToEntry(e) {
  if (!layerUI[e.layer].on) setLayer(e.layer, true)
  return anatomy.loadLayer(e.layer).then(() => { anatomy.select(e, { focus: true }); play.select() })
}
input.addEventListener('input', () => { current = searchEntries(input.value); hl = 0; showResults() })
input.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowDown') { hl = Math.min(hl + 1, current.length - 1); showResults(); ev.preventDefault() }
  if (ev.key === 'ArrowUp') { hl = Math.max(hl - 1, 0); showResults(); ev.preventDefault() }
  if (ev.key === 'Enter' && current[hl]) { goToEntry(current[hl]); results.classList.remove('open'); input.blur() }
  if (ev.key === 'Escape') results.classList.remove('open')
})
results.addEventListener('click', (ev) => {
  const li = ev.target.closest('li'); if (!li) return
  goToEntry(current[+li.dataset.i]); results.classList.remove('open')
})
document.addEventListener('click', (ev) => { if (!ev.target.closest('.search')) results.classList.remove('open') })

// ---------------- about ----------------
$('#about-btn').addEventListener('click', () => {
  $('#about-body').innerHTML = `
    <p>${t('about.p1', { n: `<b>${entries.length}</b>` })}</p>
    <p><b>${t('about.modelsTitle')}</b> ${t('about.models')}</p>
    <p><b>${t('about.disclaimerTitle')}</b> ${esc(doctorKB?.lines?.disclaimer || t('about.disclaimer'))}</p>`
  $('#about').showModal()
})

// ---------------- doctor ----------------
const currentLayers = () => Object.fromEntries(Object.entries(layerUI).filter(([, ui]) => ui.on).map(([k, ui]) => [k, +ui.rng.value]))
const brain = new Brain({
  applyLayers, currentLayers, setSpin, setLive,
  nameMode: () => nameMode,
  resetView: () => { anatomy.select(null); anatomy.resetView() },
  zoom: (f) => anatomy.zoom(f),
})
const doctor = new Doctor($('#doctor-canvas'), { anatomy, brain, goToEntry })
window.doctor = doctor
if (!booted && !anatomy.layers.skeleton?.loaded) doctor.hideOffstage()   // he walks on once the landing page is ready

// ---------------- guided tours ----------------
const tours = new TourRunner({ anatomy, doctor, brain, applyLayers, setLive })
brain.actions.tours = tours
doctor.onClose = () => tours.stop(true)            // closing Dr. Buddy's bubble ends the tour
doctor.onAsk = () => { if (tours.active) tours.stop(true) }   // so does asking him something else
window.tours = tours
function renderTourButtons() {
  $('#tours').innerHTML = ''
  for (const tr of tours.list()) {
    const b = document.createElement('button')
    b.innerHTML = `<span class="ti">${tr.icon}</span>${esc(tr.title)}`
    b.addEventListener('click', () => { tours.start(tr.id); play.on() })
    b.addEventListener('mouseenter', play.hover)
    $('#tours').appendChild(b)
  }
}
renderTourButtons()

// ---------------- language ----------------
function applyUIStrings() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n)
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml)
  for (const el of document.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh)
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle)
}
let langBusy = false
async function setLanguage(code) {
  if (langBusy || code === getLang()) return
  langBusy = true
  document.body.classList.add('lang-switching')
  try {
    await setContentLanguage(code)      // swaps descriptions, names and Dr. Buddy's knowledge in place
    await setLang(code)                 // interface strings + Dr. Buddy's voice
  } finally { langBusy = false; document.body.classList.remove('lang-switching') }
  document.documentElement.lang = code
  document.body.classList.toggle('lang-hi', code === 'hi')
  if (code !== 'hi' && nameMode === 'medical_hi') document.querySelector('.hud-top .seg [data-names=medical]').click()
  brain.rebuild()
  doctor.lines = doctorKB?.lines || {}
  applyUIStrings()
  refreshLayerStates()
  renderTourButtons()
  $('#mute').textContent = t(doctor.voiceOn ? 'ui.voiceOn' : 'ui.voiceOff')
  if (!bootBtn.disabled) bootBtn.textContent = t('landing.start')
  intro.relabel()
  if (anatomy.selected) renderInfo(anatomy.selected)
  anatomy.setNameMode(nameMode)   // rebuilds 3D labels in the new language
  if (!doctor.bubble.classList.contains('hidden') && !tours.active) doctor.closeChat()
  if (tours.active) tours._show()
  for (const b of document.querySelectorAll('[data-lang]')) b.classList.toggle('active', b.dataset.lang === code)
  try { localStorage.setItem('lang', code) } catch {}
}
for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => { setLanguage(b.dataset.lang); play.click() })
applyUIStrings()
refreshLayerStates()
{
  let saved = null
  try { saved = localStorage.getItem('lang') } catch {}
  if (saved && saved !== 'en' && availableLanguages.includes(saved)) setLanguage(saved)
}

function loop() {
  intro.update()
  anatomy.update()
  doctor.update()
  requestAnimationFrame(loop)
}
loop()
