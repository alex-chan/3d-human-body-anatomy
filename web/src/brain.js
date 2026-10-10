// Offline question answering for Dr. Buddy, grounded only in the researched content files.
// Language-aware: the lexicon (stop words, command words, layer words) follows the current interface language,
// and the content it searches is whatever language content.js currently holds.
import { entries, doctorKB, sections } from './content.js'
import { t, tList, getLang } from './i18n.js'

// Unicode-aware "whole word" regex (\b only understands ASCII, so it fails on Devanagari).
const W = '[\\p{L}\\p{M}\\p{N}]'
const wordRe = (alts) => new RegExp(`(?<!${W})(?:${alts})(?!${W})`, 'u')

const LEX = {
  en: {
    stop: ('a an the is are was were be been of to in on at for and or what whats what\'s where wheres how why who which ' +
      'does do did can could would should will me my i you your tell about explain please show describe this that it its there here ' +
      'with from by as into than then so much many some any give know want like doctor dr buddy hey hi hello ok okay mean means called ' +
      'function functions job role work works located location find part parts body human us our'),
    layers: {
      skeleton: 'bones?|skeleton|skeletal', muscles: 'muscles?|muscular', organs: 'organs?|viscera',
      arteries: 'arter(?:y|ies)|arterial', veins: 'veins?|venous', nerves: 'nerves?|nervous', skin: 'skin|integument',
    },
    show: 'show|display|turn on|see|view|open|only|just', hide: 'hide|turn off|remove',
    hello: 'hello|hi|hey|hiya|good (?:morning|afternoon|evening)|namaste', thanks: 'thanks?|thank you|thx|cheers',
    who: 'who are you|what(?:\'s| is) your name|what are you|introduce yourself', howAreYou: 'how are you|how\'s it going|how do you do',
    bye: 'bye|goodbye|see you|good night',
    everything: '(?:show|see|display) (?:me )?(?:everything|all(?: the)? layers|all of it|the whole body|whole body)|show all',
    hideAll: 'hide (?:everything|all(?: the)? layers|all)|clear (?:everything|all|the screen)',
    reset: 'reset(?: the)?(?: view)?|start over|go back|home view|center|centre',
    zoomIn: 'zoom in|closer|get closer|magnify', zoomOut: 'zoom out|further|farther|back up|pull back',
    spinOn: '(?:start )?(?:spin|rotate|turn around)(?: the body| it)?', spinOff: 'stop (?:spinning|rotating|the rotation)',
    liveOn: '(?:turn on|start|show) (?:the )?(?:live|animations?|blood flow|heartbeat)', liveOff: '(?:turn off|stop|hide) (?:the )?(?:live|animations?|blood flow|heartbeat)',
    tour: 'tours?|guided|journey|walk me through|take me (?:on|through)',
    health: 'cause[sd]?|symptoms?|treat(?:ment|ed|ing)?|cure[sd]?|disease|disorder|illness|sick|pain(?:ful)?|hurts?|ache|aching|attack|cancer|' +
      'diabetes|infection|infected|medicine|medication|drugs?|diagnos\\w*|crack(?:s|ing)?|swollen|swelling|injur\\w*|surgery|tumou?r|stroke|' +
      'covid|virus|fever|blood pressure|cholesterol|heal|should i|is it normal',
    ligament: 'ligaments?|acl|mcl|pcl|lcl|menisc\\w*|cruciate',
  },
  hi: {
    stop: ('क्या है हैं था थे कहाँ कहां कैसे कैसा क्यों कौन कौनसा किस किसे का की के को में से पर और या मुझे मेरे मेरा मेरी ' +
      'बताओ बताइए बताइये बताएं बताना समझाओ समझाइए यह ये वह वो इस उस इसका इसकी उसका एक कुछ कितना कितने कितनी डॉक्टर डॉ बडी ' +
      'जी भी तो ही ना होता होती होते करता करती करते करना काम शरीर मानव हमारे हमारा नमस्ते नमस्कार हेलो हैलो हाय ' + 'karta karti karte ' + 'kya hai hain kahan kaise kyon kaun ka ki ke ko mein se aur mujhe batao'),
    layers: {
      skeleton: 'हड्डी|हड्डियां|हड्डियाँ|हड्डियों|अस्थि|अस्थियां|कंकाल|haddi|haddiyan|bones?',
      muscles: 'मांसपेशी|मांसपेशियां|मांसपेशियाँ|मांसपेशियों|पेशी|पेशियां|muscles?',
      organs: 'अंग|अंगों|organs?', arteries: 'धमनी|धमनियां|धमनियाँ|धमनियों|arter(?:y|ies)',
      veins: 'शिरा|शिराएं|शिराएँ|शिराओं|veins?', nerves: 'तंत्रिका|तंत्रिकाएं|तंत्रिकाएँ|तंत्रिकाओं|nerves?', skin: 'त्वचा|चमड़ी|skin',
    },
    show: 'दिखाओ|दिखाइए|दिखाइये|दिखाएं|दिखा|देखना|दिखाना|सिर्फ|केवल|show|dikhao',
    hide: 'छिपाओ|छुपाओ|हटाओ|हटा दो|बंद करो|छिपा दो|hide|hatao',
    hello: 'नमस्ते|नमस्कार|हेलो|हैलो|हाय|namaste|hello|hi', thanks: 'धन्यवाद|शुक्रिया|थैंक्स|थैंक यू|dhanyavad|shukriya|thanks?',
    who: 'तुम कौन हो|आप कौन हैं|आप कौन हो|तुम्हारा नाम|आपका नाम', howAreYou: 'कैसे हो|कैसे हैं|क्या हाल है|kaise ho',
    bye: 'अलविदा|फिर मिलेंगे|बाय|bye',
    everything: 'सब कुछ दिखाओ|सब दिखाओ|पूरा शरीर दिखाओ|सारी परतें दिखाओ|सभी परतें', hideAll: 'सब छिपाओ|सब हटाओ|सब कुछ छिपाओ|सब बंद करो',
    reset: 'रीसेट|शुरू से|वापस जाओ', zoomIn: 'ज़ूम इन|जूम इन|पास से|पास लाओ|बड़ा करो', zoomOut: 'ज़ूम आउट|जूम आउट|दूर से|दूर करो|छोटा करो',
    spinOn: 'घुमाओ|घुमा दो|घुमाइए', spinOff: 'घुमाना बंद|रुको|रोको',
    liveOn: 'एनिमेशन चालू|रक्त प्रवाह दिखाओ|धड़कन दिखाओ', liveOff: 'एनिमेशन बंद',
    tour: 'टूर|यात्रा|सफ़र|सफर|घुमाओ मुझे|tour',
    health: 'बीमारी|रोग|इलाज|उपचार|दवा|दवाई|दर्द|लक्षण|कारण|अटैक|हार्ट अटैक|कैंसर|मधुमेह|डायबिटीज|संक्रमण|बुखार|चोट|सूजन|ऑपरेशन|सर्जरी|स्ट्रोक|ब्लड प्रेशर|रक्तचाप|क्या करूं|क्या करें',
    ligament: 'लिगामेंट|स्नायुबंधन|acl|मेनिस्कस',
  },
}
// English view commands must be the whole sentence ("zoom in please"), so "what muscles rotate the arm" isn't a command.
const FILLER = '(?:please|can you|could you|would you|dr buddy|doctor|buddy|hey|ok|okay|now|and|just)'
const cmdRe = (alts) => new RegExp(`^(?:${FILLER}\\s+)*(?:${alts})(?:\\s+(?:please|now|again|for me))*$`, 'u')
const COMMANDS = ['everything', 'hideAll', 'reset', 'zoomIn', 'zoomOut', 'spinOn', 'spinOff', 'liveOn', 'liveOff']
const WORDS = ['show', 'hide', 'hello', 'thanks', 'who', 'howAreYou', 'bye', 'tour', 'health', 'ligament']

const LEX_RE = {}
function lex() {
  const code = LEX[getLang()] ? getLang() : 'en'
  if (!LEX_RE[code]) {
    const L = LEX[code], E = LEX.en, other = L !== E
    // English keeps working in every language; the local language's words are added on top.
    const either = (a, b) => (b ? { test: (s) => a.test(s) || b.test(s) } : a)
    LEX_RE[code] = {
      stop: new Set([...E.stop.split(/\s+/), ...(other ? L.stop.split(/\s+/) : [])]),
      layers: Object.fromEntries(Object.keys(E.layers).map((k) => [k, wordRe(other ? `${L.layers[k]}|${E.layers[k]}` : E.layers[k])])),
      ...Object.fromEntries(WORDS.map((k) => [k, wordRe(other ? `${L[k]}|${E[k]}` : E[k])])),
      ...Object.fromEntries(COMMANDS.map((k) => [k, either(cmdRe(E[k]), other ? wordRe(L[k]) : null)])),
    }
  }
  return LEX_RE[code]
}

// Well-known names for groups of structures that the content describes one by one (ids from content/*.json).
const ALIASES = [
  { re: 'rotator cuff|रोटेटर कफ', name: { en: 'Rotator cuff', hi: 'रोटेटर कफ' }, layer: 'muscles', ids: ['supraspinatus', 'infraspinatus', 'teres-minor', 'subscapularis'] },
  { re: 'quads?|quadriceps|क्वाड्रिसेप्स', name: { en: 'Quadriceps', hi: 'क्वाड्रिसेप्स' }, layer: 'muscles', ids: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius'] },
  { re: 'hamstrings?|हैमस्ट्रिंग', name: { en: 'Hamstrings', hi: 'हैमस्ट्रिंग' }, layer: 'muscles', ids: ['biceps-femoris', 'semitendinosus', 'semimembranosus'] },
  { re: 'funny bone', id: 'ulnar-nerve' },
  { re: 'longest muscle|सबसे लंबी (?:मांस)?पेशी', id: 'sartorius' },
]

// Hindi spelling variants: chandrabindu ँ vs anusvara ं (जाँघ/जांघ) and the nukta dot (ज़/ज) are treated as the same.
const norm = (s) => String(s || '').toLowerCase().normalize('NFC').replace(/ँ/g, 'ं').replace(/़/g, '').replace(/[’']/g, "'").replace(/[^\p{L}\p{M}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim()
// Translated names often carry alternatives: "उर्विका (फीमर)", "जिगर / लीवर". Each alternative is matched on its own.
// A fragment made only of filler and layer words ("muscles", "की शिराएँ") would match almost any question, so it is dropped.
const isGenericFrag = (f) => {
  const L = lex()
  const words = f.split(' ').filter((w) => w && !L.stop.has(w))
  return !words.length || words.every((w) => Object.values(L.layers).some((re) => re.test(w)))
}
const hiNames = (s) => {
  if (!s) return []
  const whole = norm(s)
  const parts = String(s).split(/[()/,;]/).map(norm).filter((x) => x.length > 2 && x !== whole && !isGenericFrag(x))
  return [whole, ...parts]
}
const isLatin = (w) =>/^[a-z0-9']+$/.test(w)
const stem = (w) => !isLatin(w) ? w : w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/(es|s)$/, (m, g, i, str) => (str.length > 4 ? '' : m))
const tokens = (s) => { const stop = lex().stop; return norm(s).split(' ').filter((w) => w && !stop.has(w)).map(stem) }

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
const tokMatch = (q, t) => q === t || (q.length > 4 && t.length > 4 && (lev(q, t) <= 1 || t.startsWith(q) || q.startsWith(t)))

function overlap(qt, docTokens) {
  if (!docTokens.length) return 0
  let hit = 0
  for (const q of qt) if (docTokens.some((t) => tokMatch(q, t))) hit++
  return hit
}

const pick = (arr, fallback = '') => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : fallback)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Everyday words for the content's category names.
const GROUP_SYNONYMS = {
  'lower limb': 'legs?|lower limbs?|पैर|पैरों|टांग|टांगों', 'upper limb': 'arms?|upper limbs?|बांह|बाहें|बाहों',
  'heart': 'दिल|dil|हार्ट', 'lungs': 'फेफड़े|फेफड़ा|फेफड़ों|lungs?', 'brain': 'दिमाग|dimag|ब्रेन', 'hand': 'हाथ|हाथों|hands?', 'foot': 'पंजा|पंजे|feet|foot',
  'skull': 'skull|cranium|खोपड़ी', 'vertebral column': 'spine|backbone|vertebrae|रीढ़|मेरुदंड',
}
// When a question doesn't name a layer, a group like "Brain" or "Hand" most likely means this layer's version.
const LAYER_PRIORITY = ['organs', 'skeleton', 'muscles', 'nerves', 'arteries', 'veins', 'skin']

export class Brain {
  /** actions: { applyLayers, currentLayers, resetView, zoom(factor), setSpin(bool), setLive(bool), tours: { list(), start(id) } } */
  constructor(actions) {
    this.actions = actions
    this.rebuild()
  }

  /** (Re)index the content; called again after the language changes. */
  rebuild() {
    this.index = entries.map((e) => ({
      e,
      nameTokens: [...new Set([...tokens(e.medical), ...tokens(e.common), ...tokens(e._en?.common), ...tokens(e.medical_hi), ...tokens(e.id.replace(/-/g, ' '))])],
      names: [norm(e.medical), norm(e.common), norm(e._en?.common), ...hiNames(e.medical_hi), ...hiNames(e.common),
        norm(e.medical.replace(/\s+(muscle|bone|artery|vein|nerve)$/i, ''))].filter(Boolean),
      catTokens: tokens(e.category),
    }))
    this.byId = new Map(entries.map((e) => [e.id + '|' + e.layer, e]))
    this.faq = (doctorKB?.faq || []).map((f) => ({ f, qt: tokens(f.q), kt: (f.keywords || []).flatMap(tokens) }))
    this.systems = (doctorKB?.systems || []).map((s) => ({ s, kt: [...tokens(s.title), ...(s.keywords || []).flatMap(tokens)] }))
    this.lines = doctorKB?.lines || {}
    // Groups of structures (e.g. all "Heart" chambers + valves) that can be shown together. Categories like
    // "Brain - cerebrum" also feed a broader "Brain" group.
    this.groups = new Map()
    // enName is the English category, so tours and synonyms work whatever language the content is in.
    const addTo = (name, enName, e) => {
      const k = norm(name) + '|' + e.layer
      if (!norm(name)) return
      const syn = GROUP_SYNONYMS[norm(enName)]
      if (!this.groups.has(k)) this.groups.set(k, { name, enName, layer: e.layer, entries: [], tokens: tokens(name), re: wordRe([esc(norm(name)), esc(norm(enName)), syn].filter(Boolean).join('|')) })
      this.groups.get(k).entries.push(e)
    }
    const broadOf = (c) => c.split(/\s+[-–/]\s+/)[0]
    for (const e of entries) {
      const en = e._en?.category || e.category
      addTo(e.category, en, e)
      if (broadOf(en) !== en) addTo(broadOf(e.category), broadOf(en), e)
    }
  }

  _entryById(id, layer) {
    if (layer) return this.byId.get(id + '|' + layer)
    return entries.find((e) => e.id === id)
  }

  _makeGroup(name, layer, list, qt) {
    const nameTok = tokens(name)
    const faq = this._bestFaq(qt)
    // An FAQ about "the brain" describes the organ; only reuse it for the brain's arteries if it is about arteries.
    const faqFits = faq && faq.score >= 1.5 && overlap(nameTok, faq.qt) > 0 && (layer === 'organs' || lex().layers[layer].test(norm(faq.f.q)))
    const sys = this._bestSystem(nameTok)
    const parts = list.map((e) => e.common || e.medical).join(', ')
    const summary = (faqFits ? faq.f.a : '') || t('group.parts', { name: name.toLowerCase(), parts })
    return {
      id: 'group-' + norm(name).replace(/ /g, '-'), medical: name, common: name, category: 'Group', layer,
      match: list.flatMap((e) => e.match || []), summary,
      function: t('group.partsShown', { parts }),
      facts: sys && sys.score >= 1 ? sys.s.keyFacts?.slice(0, 2) || [] : [], sources: sys && sys.score >= 1 ? sys.s.sources || [] : [],
    }
  }

  _groupEntry(q, qt, wantLayers) {
    let best = null
    const rank = (g) => LAYER_PRIORITY.indexOf(g.layer)
    for (const g of this.groups.values()) {
      if (g.entries.length < 2 || !g.tokens.length || !g.re.test(q)) continue
      if (wantLayers.length && !wantLayers.includes(g.layer)) continue
      if (!best || g.tokens.length > best.tokens.length ||
        (g.tokens.length === best.tokens.length && (rank(g) < rank(best) || (rank(g) === rank(best) && g.entries.length > best.entries.length)))) best = g
    }
    return best ? this._makeGroup(best.name, best.layer, best.entries, qt) : null
  }

  /** A category group (e.g. "Skull" in skeleton) as one selectable entry; used by guided tours. */
  groupByName(enName, layer) {
    const enCat = (e) => e._en?.category || e.category
    const list = entries.filter((e) => e.layer === layer && (enCat(e) === enName || enCat(e).split(/\s+[-–/]\s+/)[0] === enName))
    if (!list.length) return null
    const exact = list.find((e) => enCat(e) === enName)
    const name = exact ? exact.category : list[0].category.split(/\s+[-–/]\s+/)[0]
    return this._makeGroup(name, layer, list, [])
  }

  _aliasEntry(q, qt) {
    for (const a of ALIASES) {
      if (!wordRe(a.re).test(q)) continue
      if (a.id) { const e = this._entryById(a.id); if (e) return e; continue }
      const list = a.ids.map((id) => this._entryById(id, a.layer)).filter(Boolean)
      if (list.length) return this._makeGroup(a.name[getLang()] || a.name.en, a.layer, list, qt)
    }
    return null
  }

  line(kind, fallback) { return pick(this.lines[kind], fallback) }

  suggestions(n = 3) {
    const pool = [...tList('suggest')]
    for (const f of this.faq.slice(0, 12)) pool.push(f.f.q)
    const out = new Set()
    while (out.size < n && out.size < pool.length) out.add(pick(pool))
    return [...out]
  }

  /** @returns {{text:string, entry?:object, layers?:object, tour?:string, suggestions?:string[]}} */
  answer(question) {
    const q = norm(question)
    const qt = tokens(question)
    const L = lex()
    const A = this.actions
    if (!q) return { text: t('emptyAsk'), suggestions: this.suggestions() }
    const short = q.split(' ').length <= 6

    // 1) Small talk
    if (short && L.who.test(q)) return { text: t('chat.who'), suggestions: this.suggestions(2) }
    if (short && L.howAreYou.test(q)) return { text: t('chat.howAreYou'), suggestions: this.suggestions(2) }
    if (short && L.thanks.test(q)) return { text: t('chat.thanks'), suggestions: this.suggestions(2) }
    if (short && L.bye.test(q)) return { text: t('chat.bye') }
    if (short && L.hello.test(q) && !qt.length) return { text: this.line('greetings', t('chat.hello')), suggestions: this.suggestions(3) }

    // 2) Guided tours
    if (A.tours && L.tour.test(q)) {
      const list = A.tours.list()
      const chosen = list.find((tr) => tr.match && wordRe(tr.match).test(q))
      if (chosen) { A.tours.start(chosen.id); return { text: '', tour: chosen.id } }
      return { text: A.tours.menuText(), suggestions: list.map((tr) => tr.prompt) }
    }

    // 3) View commands
    if (L.everything.test(q)) {
      const cfg = { skin: 0.2, skeleton: 1, organs: 1, arteries: 1, veins: 1, nerves: 1 }
      A.applyLayers(cfg); return { text: t('cmd.everything'), layers: cfg }
    }
    if (L.hideAll.test(q)) { A.applyLayers({}); return { text: t('cmd.hideAll'), layers: {} } }
    if (short && L.spinOff.test(q)) { A.setSpin?.(false); return { text: t('cmd.spinOff') } }
    if (short && L.liveOff.test(q)) { A.setLive?.(false); return { text: t('cmd.liveOff') } }
    if (short && L.liveOn.test(q)) { A.setLive?.(true); return { text: t('cmd.liveOn') } }
    if (short && L.zoomIn.test(q)) { A.zoom?.(0.6); return { text: t('cmd.zoomIn') } }
    if (short && L.zoomOut.test(q)) { A.zoom?.(1.6); return { text: t('cmd.zoomOut') } }
    if (short && L.reset.test(q)) { A.resetView?.(); return { text: t('cmd.reset') } }
    if (short && L.spinOn.test(q)) { A.setSpin?.(true); return { text: t('cmd.spinOn') } }

    // 4) Layer commands: "show me the veins", "hide muscles", "only bones"
    const layerWords = Object.entries(L.layers).filter(([, re]) => re.test(q)).map(([k]) => k)
    if ((L.show.test(q) || L.hide.test(q)) && layerWords.length) {
      const namesAPart = this._bestEntry(q, qt)
      if (!(namesAPart && namesAPart.score >= 3)) {
        const labels = layerWords.map((k) => t('layer.' + k).toLowerCase())
        if (L.hide.test(q)) {
          const cfg = Object.fromEntries(Object.entries(A.currentLayers()).filter(([k]) => !layerWords.includes(k)))
          A.applyLayers(cfg)
          return { text: t('cmd.hidden', { layers: labels.join(' & ') }), layers: cfg }
        }
        const cfg = Object.fromEntries(layerWords.map((k) => [k, 1]))
        A.applyLayers(cfg)
        const ov = sections[layerWords[0]]?.overview
        const verb = labels.length > 1 || /s$/.test(labels[0]) ? 'are' : 'is'
        return { text: `${t('cmd.shown', { verb, layers: labels.join(' & ') })} ${ov ? ov.summary : ''}`.trim(), layers: cfg }
      }
    }

    // 5) Things this model doesn't contain
    if (L.ligament.test(q)) return { text: t('scope.ligaments'), suggestions: this.suggestions(2) }

    // 6) Find what the question is about
    const health = L.health.test(q)
    const target = this._findTarget(q, qt, layerWords)
    if (health) {
      if (target?.entry) {
        return { text: `${t('scope.health')}\n\n${this._explain(target.entry, '').text}`, entry: target.entry, suggestions: this.suggestions(2) }
      }
      return { text: t('scope.healthNoEntity'), suggestions: this.suggestions(2) }
    }
    if (target) return target.entry ? (target.group ? { text: `${t('group.intro', { name: target.entry.medical })} ${target.entry.summary}`, entry: target.entry, suggestions: this.suggestions(2) } : this._explain(target.entry, q)) : target.answer
    return { text: this.line('dontKnow', t('dontKnow')), suggestions: this.suggestions() }
  }

  /** The best match for a question: a structure, a group, an FAQ or a system overview. */
  _findTarget(q, qt, layerWords) {
    const alias = this._aliasEntry(q, qt)
    if (alias) return { entry: alias, group: alias.category === 'Group' }
    const best = this._bestEntry(q, qt, layerWords)
    const faq = this._bestFaq(qt)
    const sys = this._bestSystem(qt)
    const full = (x) => x && qt.length && x.score >= qt.length   // every question keyword matched
    // Prefer a named structure when the question clearly names it; prefer an FAQ when it matches much better.
    if (best && best.score >= 3 && !(faq && faq.score > best.score + 1.5)) return { entry: best.e }
    const group = this._groupEntry(q, qt, layerWords)
    if (group) return { entry: group, group: true }
    if (faq && (faq.score >= 2 || (full(faq) && faq.score >= 1))) return { answer: { text: faq.f.a, suggestions: this.suggestions(2) } }
    if (best && best.score >= 2) return { entry: best.e }
    if (sys && (sys.score >= 1.5 || full(sys))) {
      const s = sys.s
      return { answer: { text: `${s.summary}${s.keyFacts?.length ? '\n\n' + t('explain.didYouKnow', { fact: s.keyFacts[0] }) : ''}`, suggestions: this.suggestions(2) } }
    }
    return null
  }

  _bestEntry(q, qt, wantLayers = []) {
    let best = null
    for (const it of this.index) {
      let s = 0
      for (const n of it.names) if (n && n.length > 2 && wordRe(esc(n) + '(?:s|es)?').test(q)) s = Math.max(s, 4 + n.split(' ').length)
      const ov = overlap(qt, it.nameTokens)
      s += ov * 1.2 + overlap(qt, it.catTokens) * 0.3
      // penalise long names only partially matched
      if (ov && ov < it.nameTokens.length) s -= (it.nameTokens.length - ov) * 0.25
      if (wantLayers.length && wantLayers.includes(it.e.layer)) s += 0.5
      if (!best || s > best.score) best = { e: it.e, score: s }
    }
    return best
  }

  _bestFaq(qt) {
    let best = null
    for (const it of this.faq) {
      const s = overlap(qt, it.qt) * 1.0 + overlap(qt, it.kt) * 0.8 - Math.max(0, it.qt.length - qt.length) * 0.05
      if (!best || s > best.score) best = { f: it.f, qt: it.qt, score: s }
    }
    return best
  }

  _bestSystem(qt) {
    let best = null
    for (const it of this.systems) {
      const s = overlap(qt, it.kt)
      if (!best || s > best.score) best = { s: it.s, score: s }
    }
    return best
  }

  _explain(e, q = '') {
    // Use the same medical name as the info card (English, or Hindi when that name style is chosen).
    const medical = this.actions.nameMode?.() === 'medical_hi' && e.medical_hi ? e.medical_hi : e.medical
    const common = e.common && e.common.toLowerCase() !== medical.toLowerCase() ? e.common : ''
    const name = common ? t('explain.alsoCalled', { medical, common: getLang() === 'en' ? common.toLowerCase() : common }) : medical
    let text
    const where = getLang() === 'hi' ? /कहाँ|कहां|kahan|\bwhere\b/ : /\bwhere\b/
    const does = getLang() === 'hi' ? /क्या करत|काम|कार्य|\b(do|does|function|job|purpose|role)\b/ : /\b(do|does|function|job|purpose|for|role|use)\b/
    if (where.test(q) && e.location) text = t('explain.where', { name, location: e.location })
    else if (does.test(q) && e.function) text = t('explain.does', { name, fn: e.function })
    else text = `${t('explain.intro', { name })} ${e.summary}${e.function ? ' ' + e.function : ''}`
    if (e.facts?.length) text += '\n\n' + t('explain.didYouKnow', { fact: pick(e.facts) })
    return { text, entry: e, suggestions: [t('explain.whereIs', { name: getLang() === 'en' ? (e.common || e.medical).toLowerCase() : (e.common || e.medical) }), ...this.suggestions(1)] }
  }

  explainText(e) { return this._explain(e).text }
}
