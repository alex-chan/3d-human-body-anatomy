// Loads the researched content JSON (../../content/*.json) and indexes it by 3D object name.
const files = import.meta.glob('../../content/*.json', { eager: true, import: 'default' })

export const LAYER_KEYS = ['skin', 'muscles', 'skeleton', 'organs', 'arteries', 'veins', 'nerves']

// Reproductive anatomy is intentionally excluded from this atlas (models and text).
const REPRO = /reproduct|genital|penis|penile|testi(s|cle|cular)|scrot|prostat|seminal|sperm|epididym|ductus deferens|vas deferens|ejaculat|urethra|pubic hair|erectile|glans/i

export const sections = {}   // layer -> section json
export let doctorKB = null
let englishDoctorFaqAll = null   // unfiltered FAQ order; translations are aligned to it by index
for (const [path, data] of Object.entries(files)) {
  const key = path.split('/').pop().replace('.json', '')
  if (key === 'doctor') {
    englishDoctorFaqAll = data.faq || []
    doctorKB = {
      ...data,
      systems: (data.systems || []).filter((s) => !REPRO.test(s.id + ' ' + s.title)),
      faq: (data.faq || []).filter((f) => !REPRO.test(f.q + ' ' + (f.keywords || []).join(' '))),
    }
  } else if (LAYER_KEYS.includes(key)) sections[key] = data
}

const byObject = new Map()   // object name -> [{ entry, layer }, ...] (eye parts exist in both skin and organs)
export const entries = []           // flat list with layer attached
const extraCommon = new Map()

for (const [layer, sec] of Object.entries(sections)) {
  for (const e of sec.structures || []) {
    if (REPRO.test([e.id, e.medical, e.common, e.category].join(' '))) continue
    const entry = { ...e, layer, match: (e.match || []).filter((n) => !REPRO.test(n)) }
    entries.push(entry)
    for (const n of entry.match) {
      const hits = byObject.get(n) || byObject.set(n, []).get(n)
      if (!hits.some((h) => h.layer === layer)) hits.push({ entry, layer })
    }
  }
  for (const [k, v] of Object.entries(sec.commonNames || {})) extraCommon.set(k, v)
}

/** The researched entry for a 3D object, preferring the one written for the given layer. */
export function entryFor(objName, layer) {
  const hits = byObject.get(objName)
  if (!hits) return null
  return (hits.find((h) => h.layer === layer) || hits[0]).entry
}

export function sideOf(objName) {
  if (/\.l$/.test(objName)) return 'left'
  if (/\.r$/.test(objName)) return 'right'
  return ''
}

export function cleanName(objName) {
  return objName.replace(/\.(l|r)$/, '').replace(/^\((.*)\)$/, '$1').replace(/\s+/g, ' ').trim()
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }

/** Display name for a 3D object, in 'medical', 'medical_hi' (Hindi medical term) or 'common' mode. */
export function displayName(objName, mode, withSide = true, layer) {
  const entry = entryFor(objName, layer)
  const side = withSide ? sideOf(objName) : ''
  let base
  if (entry) base = entryName(entry, mode)
  else if (mode !== 'medical' && extraCommon.has(objName)) base = extraCommon.get(objName)
  else base = cleanName(objName)
  return side ? `${cap(base)} (${SIDE_WORDS[contentLang]?.[side] || side})` : cap(base)
}

export function entryName(entry, mode) {
  if (mode === 'common') return entry.common || entry.medical
  if (mode === 'medical_hi') return entry.medical_hi || entry.medical
  return entry.medical
}

// ---------------- translations ----------------
// content/i18n/<lang>/<layer>.json, loaded only when that language is chosen (keeps the English bundle small).
const translations = import.meta.glob('../../content/i18n/*/*.json', { import: 'default' })
const SIDE_WORDS = { hi: { left: 'बायाँ', right: 'दायाँ' } }
const FIELDS = ['common', 'category', 'summary', 'function', 'location', 'facts']
export let contentLang = 'en'
const englishCommon = new Map(extraCommon)
const englishDoctor = doctorKB && { systems: doctorKB.systems, faq: doctorKB.faq, lines: doctorKB.lines }

export const availableLanguages = ['en', ...new Set(Object.keys(translations).map((p) => p.split('/').slice(-2)[0]))]

/** Switch every entry, overview and Dr. Buddy's knowledge to `lang` in place (falls back to English per field). */
export async function setContentLanguage(lang) {
  const files = {}
  if (lang !== 'en') {
    const paths = Object.keys(translations).filter((p) => p.split('/').slice(-2)[0] === lang)
    await Promise.all(paths.map(async (p) => { files[p.split('/').pop().replace('.json', '')] = await translations[p]() }))
  }
  for (const e of entries) {
    e._en ||= Object.fromEntries(FIELDS.map((f) => [f, e[f]]))
    const tr = files[e.layer]?.structures?.[e.id]
    for (const f of FIELDS) e[f] = (tr && tr[f]) || e._en[f]
    e.medical_hi = files[e.layer]?.structures?.[e.id]?.medical_hi || e.medical_hi
  }
  for (const [layer, sec] of Object.entries(sections)) {
    sec._enOverview ||= sec.overview
    const ov = files[layer]?.overview
    sec.overview = ov ? { ...sec._enOverview, ...ov } : sec._enOverview
  }
  extraCommon.clear()
  for (const [k, v] of englishCommon) extraCommon.set(k, v)
  for (const layer of Object.keys(sections)) for (const [k, v] of Object.entries(files[layer]?.commonNames || {})) extraCommon.set(k, v)
  if (doctorKB && englishDoctor) {
    const d = files.doctor
    doctorKB.systems = englishDoctor.systems.map((s) => {
      const h = d?.systems?.[s.id]
      // Keep the English keywords too, so English questions still work in Hindi mode.
      return h ? { ...s, ...h, keywords: [...(h.keywords || []), ...(s.keywords || [])] } : s
    })
    doctorKB.faq = (englishDoctor.faq || []).map((f) => {
      const h = d?.faq?.[englishDoctorFaqAll.indexOf(f)]
      return h ? { ...f, q: h.q, a: h.a, keywords: [...(h.keywords || []), ...(f.keywords || [])], _enQ: f.q } : f
    })
    doctorKB.lines = d?.lines ? { ...englishDoctor.lines, ...d.lines } : englishDoctor.lines
  }
  contentLang = lang
}

export const LAYER_INFO = {
  skin: { label: 'Skin', color: '#d9a07c' },
  muscles: { label: 'Muscles', color: '#c0443a' },
  skeleton: { label: 'Bones', color: '#e9dcc3' },
  organs: { label: 'Organs', color: '#d98a8a' },
  arteries: { label: 'Arteries', color: '#d62839' },
  veins: { label: 'Veins', color: '#2f5fd0' },
  nerves: { label: 'Nerves', color: '#f2cf43' },
}

// Atlas colour conventions; overridden by the researched values in doctor.json when present.
const cc = doctorKB?.colorConventions || {}
export const COLORS = {
  artery: cc.arteries || '#d62839',
  vein: cc.veins || '#2f5fd0',
  pulmonaryArtery: cc.pulmonaryArteries || '#4a63c9',
  pulmonaryVein: cc.pulmonaryVeins || '#d9434f',
  nerve: cc.nerves || '#f2cf43',
  bone: cc.bone || '#e3d3b4',
  muscle: cc.muscle || '#a32d26',
}
