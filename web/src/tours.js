// Guided tours: Dr. Buddy walks through a sequence of structures, moving the camera and narrating each stop.
// The medical explanation at each stop comes from the researched content (entry fields or system overviews);
// the short linking lines below ("First stop: ...") carry no medical claims of their own.
import { getLang, t } from './i18n.js'
import { doctorKB } from './content.js'

const S = (en, hi) => ({ en, hi })

export const TOURS = [
  {
    id: 'blood', icon: '❤', match: 'blood|circulat\\w*|heart|रक्त|खून|परिसंचरण',
    title: S('Journey of blood', 'रक्त की यात्रा'), prompt: S('Take the journey of blood tour', 'रक्त की यात्रा वाला टूर'),
    live: true,
    steps: [
      { layers: { arteries: 1, veins: 1, organs: 0.35 }, system: 'circulatory',
        say: S("Let's follow blood around the body! Watch the glowing pulses: they travel out from the heart in the arteries and back to it in the veins.", 'चलो, पूरे शरीर में रक्त के साथ सफ़र करते हैं! चमकती लहरों को देखो: वे धमनियों में दिल से बाहर जाती हैं और शिराओं में वापस दिल तक आती हैं।') },
      { layers: { arteries: 1, veins: 1, organs: 0.35 }, focus: { id: 'superior-vena-cava', layer: 'veins' }, field: 'summary',
        say: S('Our journey starts as blood comes back to the heart.', 'हमारा सफ़र वहाँ से शुरू होता है जहाँ रक्त दिल में वापस आता है।') },
      { layers: { organs: 1, arteries: 0.3, veins: 0.3 }, focus: { id: 'right-atrium', layer: 'organs' }, field: 'function',
        say: S('First stop inside the heart: the right atrium.', 'दिल के अंदर पहला पड़ाव: दायाँ आलिंद।') },
      { layers: { organs: 1, arteries: 0.3, veins: 0.3 }, focus: { id: 'right-ventricle', layer: 'organs' }, field: 'function',
        say: S('Next, the right ventricle.', 'अब, दायाँ निलय।') },
      { layers: { arteries: 1, veins: 1, organs: 0.35 }, focus: { id: 'pulmonary-trunk', layer: 'arteries' }, field: 'summary',
        say: S('Now the blood heads for the lungs.', 'अब रक्त फेफड़ों की ओर चलता है।') },
      { layers: { organs: 1, arteries: 0.4, veins: 0.4 }, focus: { id: 'right-lung', layer: 'organs' }, field: 'function',
        say: S('Here in the lungs, blood picks up fresh oxygen.', 'यहाँ फेफड़ों में रक्त ताज़ी ऑक्सीजन लेता है।') },
      { layers: { arteries: 1, veins: 1, organs: 0.35 }, focus: { id: 'pulmonary-veins', layer: 'veins' }, field: 'summary',
        say: S('Oxygen-rich blood now returns to the heart.', 'अब ऑक्सीजन से भरपूर रक्त दिल में लौटता है।') },
      { layers: { organs: 1, arteries: 0.3, veins: 0.3 }, focus: { id: 'left-ventricle', layer: 'organs' }, field: 'function',
        say: S("Meet the left ventricle, the heart's main pumping chamber.", 'मिलो बाएँ निलय से, जो दिल का मुख्य पंप करने वाला कक्ष है।') },
      { layers: { arteries: 1, veins: 1, organs: 0.35 }, focus: { id: 'aortic-arch', layer: 'arteries' }, field: 'summary',
        say: S('Out it goes, into the aorta.', 'और रक्त निकल पड़ता है महाधमनी में।') },
      { layers: { arteries: 1, veins: 1 }, focus: { id: 'femoral-artery', layer: 'arteries' }, field: 'summary',
        say: S('Arteries carry it all the way down to the legs.', 'धमनियाँ इसे पैरों तक ले जाती हैं।') },
      { layers: { arteries: 1, veins: 1 }, focus: { id: 'great-saphenous-vein', layer: 'veins' }, field: 'summary',
        say: S('Then the veins start bringing it back.', 'फिर शिराएँ इसे वापस लाना शुरू करती हैं।') },
      { layers: { arteries: 1, veins: 1, organs: 0.35 }, focus: { id: 'inferior-vena-cava', layer: 'veins' }, field: 'summary',
        say: S('And back into the heart it goes. The circle is complete!', 'और रक्त फिर से दिल में पहुँच जाता है। चक्र पूरा हुआ!') },
    ],
  },
  {
    id: 'skeleton', icon: '🦴', match: 'skeleton|bones?|कंकाल|हड्डी|हड्डियों',
    title: S('Your skeleton', 'तुम्हारा कंकाल'), prompt: S('Take the skeleton tour', 'कंकाल वाला टूर'),
    steps: [
      { layers: { skeleton: 1 }, system: 'skeletal', say: S("Let's explore the skeleton, the frame that holds you up.", 'चलो कंकाल को देखते हैं, वह ढाँचा जो तुम्हें सीधा खड़ा रखता है।') },
      { layers: { skeleton: 1 }, focus: { group: 'Skull', layer: 'skeleton' }, say: S('We start at the top: the skull.', 'हम सबसे ऊपर से शुरू करते हैं: खोपड़ी।') },
      { layers: { skeleton: 1 }, focus: { group: 'Vertebral column', layer: 'skeleton' }, say: S('Running down your back is the spine.', 'पीठ में नीचे तक जाती है रीढ़ की हड्डी।') },
      { layers: { skeleton: 1 }, focus: { id: 'true-ribs', layer: 'skeleton' }, field: 'summary', say: S('Next, the ribs, which wrap around your chest.', 'अब पसलियाँ, जो तुम्हारी छाती को घेरती हैं।') },
      { layers: { skeleton: 1 }, focus: { id: 'humerus', layer: 'skeleton' }, field: 'summary', say: S('Down to the arm.', 'अब बाँह की ओर।') },
      { layers: { skeleton: 1 }, focus: { group: 'Hand', layer: 'skeleton' }, say: S('Then the hand.', 'फिर हाथ।') },
      { layers: { skeleton: 1 }, focus: { id: 'hip-bone', layer: 'skeleton' }, field: 'summary', say: S('Now the hip.', 'अब कूल्हा।') },
      { layers: { skeleton: 1 }, focus: { id: 'femur', layer: 'skeleton' }, field: 'summary', say: S('Here is the thigh bone.', 'यह है जाँघ की हड्डी।') },
      { layers: { skeleton: 1 }, focus: { id: 'patella', layer: 'skeleton' }, field: 'summary', say: S('The kneecap.', 'घुटने की टोपी।') },
      { layers: { skeleton: 1 }, focus: { group: 'Foot', layer: 'skeleton' }, say: S('And finally, the foot. That was the skeleton tour!', 'और आख़िर में, पैर का पंजा। कंकाल का टूर पूरा हुआ!') },
    ],
  },
  {
    id: 'digestion', icon: '🍎', match: 'digest\\w*|food|stomach|पाचन|खाना|भोजन',
    title: S('Digestion', 'पाचन'), prompt: S('Take the digestion tour', 'पाचन वाला टूर'),
    steps: [
      { layers: { organs: 1, skeleton: 0.2 }, system: 'digestive', say: S("Let's follow food through the digestive system!", 'चलो पाचन तंत्र में भोजन के सफ़र पर चलते हैं!') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'oesophagus', layer: 'organs' }, field: 'summary', say: S('After you swallow, food travels down the oesophagus.', 'निगलने के बाद भोजन ग्रासनली से नीचे जाता है।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'stomach', layer: 'organs' }, field: 'summary', say: S('Next stop: the stomach.', 'अगला पड़ाव: आमाशय।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'liver', layer: 'organs' }, field: 'function', say: S('The liver is a big helper.', 'यकृत एक बड़ा मददगार है।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'gallbladder', layer: 'organs' }, field: 'function', say: S('Tucked under the liver is the gallbladder.', 'यकृत के नीचे छिपी है पित्ताशय की थैली।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'pancreas', layer: 'organs' }, field: 'function', say: S('Behind the stomach sits the pancreas.', 'आमाशय के पीछे है अग्न्याशय।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'duodenum', layer: 'organs' }, field: 'summary', say: S('Now into the small intestine, starting with the duodenum.', 'अब छोटी आँत में, शुरुआत ग्रहणी से।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'jejunum', layer: 'organs' }, field: 'summary', say: S('The small intestine keeps going.', 'छोटी आँत आगे बढ़ती रहती है।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { group: 'Large intestine', layer: 'organs' }, say: S('Then comes the large intestine.', 'फिर आती है बड़ी आँत।') },
      { layers: { organs: 1, skeleton: 0.2 }, focus: { id: 'vermiform-appendix', layer: 'organs' }, field: 'summary', say: S('Last stop, the appendix. That was the digestion tour!', 'आख़िरी पड़ाव, अपेंडिक्स। पाचन का टूर पूरा हुआ!') },
    ],
  },
  {
    id: 'nerves', icon: '⚡', match: 'brain|nerves?|nervous|मस्तिष्क|दिमाग|तंत्रिका|नस',
    title: S('Brain & nerves', 'मस्तिष्क और तंत्रिकाएँ'), prompt: S('Take the brain and nerves tour', 'मस्तिष्क और तंत्रिकाओं वाला टूर'),
    live: true,
    steps: [
      { layers: { organs: 1, nerves: 1, skeleton: 0.2 }, system: 'nervous', say: S("Let's explore the nervous system. Watch the signals racing along the nerves!", 'चलो तंत्रिका तंत्र को देखते हैं। तंत्रिकाओं में दौड़ते संकेतों को देखो!') },
      { layers: { organs: 1, nerves: 1, skeleton: 0.2 }, focus: { group: 'Brain', layer: 'organs' }, say: S('It all starts in the brain.', 'सब कुछ मस्तिष्क से शुरू होता है।') },
      { layers: { organs: 1, nerves: 1, skeleton: 0.2 }, focus: { id: 'frontal-lobe', layer: 'organs' }, field: 'function', say: S('At the front is the frontal lobe.', 'सबसे आगे है अग्र पालि (frontal lobe)।') },
      { layers: { organs: 1, nerves: 1, skeleton: 0.2 }, focus: { id: 'cerebellum', layer: 'organs' }, field: 'function', say: S('At the back sits the cerebellum.', 'पीछे की ओर है अनुमस्तिष्क।') },
      { layers: { organs: 1, nerves: 1, skeleton: 0.2 }, focus: { id: 'medulla-oblongata', layer: 'organs' }, field: 'function', say: S('The brainstem links the brain to the body.', 'मस्तिष्क स्तंभ (brainstem) मस्तिष्क को शरीर से जोड़ता है।') },
      { layers: { organs: 1, nerves: 1, skeleton: 0.2 }, focus: { id: 'optic-nerve', layer: 'nerves' }, field: 'summary', say: S('Some nerves come straight from the brain, like this one.', 'कुछ तंत्रिकाएँ सीधे मस्तिष्क से निकलती हैं, जैसे यह।') },
      { layers: { nerves: 1, skeleton: 0.3 }, focus: { id: 'vagus-nerve', layer: 'nerves' }, field: 'summary', say: S('This one travels a long way.', 'यह तंत्रिका बहुत लंबा सफ़र करती है।') },
      { layers: { nerves: 1, skeleton: 0.3 }, focus: { id: 'brachial-plexus', layer: 'nerves' }, field: 'summary', say: S('Now to the arm.', 'अब बाँह की ओर।') },
      { layers: { nerves: 1, skeleton: 0.3 }, focus: { id: 'median-nerve', layer: 'nerves' }, field: 'summary', say: S('Down into the forearm and hand.', 'नीचे अग्रबाहु और हाथ में।') },
      { layers: { nerves: 1, skeleton: 0.3 }, focus: { id: 'sciatic-nerve', layer: 'nerves' }, field: 'summary', say: S('And finally, the leg. That was the brain and nerves tour!', 'और आख़िर में, पैर। मस्तिष्क और तंत्रिकाओं का टूर पूरा हुआ!') },
    ],
  },
  {
    id: 'muscles', icon: '💪', match: 'muscles?|muscular|मांसपेशी|मांसपेशियों|पेशी',
    title: S('Muscles in action', 'मांसपेशियाँ काम पर'), prompt: S('Take the muscles tour', 'मांसपेशियों वाला टूर'),
    steps: [
      { layers: { muscles: 1 }, system: 'muscular', say: S("Let's meet the muscles that move you!", 'चलो उन मांसपेशियों से मिलते हैं जो तुम्हें हिलाती-डुलाती हैं!') },
      { layers: { muscles: 1 }, focus: { id: 'deltoid', layer: 'muscles' }, field: 'summary', say: S('We start at the shoulder.', 'हम कंधे से शुरू करते हैं।') },
      { layers: { muscles: 1 }, focus: { id: 'biceps-brachii', layer: 'muscles' }, field: 'function', say: S('On the front of the upper arm: the biceps.', 'बाँह के ऊपरी हिस्से के आगे: बाइसेप्स।') },
      { layers: { muscles: 1 }, focus: { id: 'triceps-brachii', layer: 'muscles' }, field: 'function', say: S('And on the back: the triceps.', 'और पीछे: ट्राइसेप्स।') },
      { layers: { muscles: 1 }, focus: { id: 'pectoralis-major', layer: 'muscles' }, field: 'function', say: S('Across the chest.', 'छाती पर।') },
      { layers: { muscles: 1 }, focus: { id: 'rectus-abdominis', layer: 'muscles' }, field: 'summary', say: S('Down to the belly.', 'नीचे पेट की ओर।') },
      { layers: { muscles: 1 }, focus: { id: 'diaphragm', layer: 'muscles' }, field: 'function', say: S('Hidden inside is a muscle you use with every breath.', 'अंदर छिपी है एक मांसपेशी जिसे तुम हर साँस में इस्तेमाल करते हो।') },
      { layers: { muscles: 1 }, focus: { id: 'gluteus-maximus', layer: 'muscles' }, field: 'summary', say: S('Round the back to the hip.', 'पीछे कूल्हे की ओर।') },
      { layers: { muscles: 1 }, focus: { alias: 'quads' }, say: S('The front of the thigh.', 'जाँघ का अगला भाग।') },
      { layers: { muscles: 1 }, focus: { alias: 'hamstrings' }, say: S('The back of the thigh.', 'जाँघ का पिछला भाग।') },
      { layers: { muscles: 1 }, focus: { id: 'gastrocnemius', layer: 'muscles' }, field: 'summary', say: S('And finally, the calf. That was the muscles tour!', 'और आख़िर में, पिंडली। मांसपेशियों का टूर पूरा हुआ!') },
    ],
  },
]

const tx = (v) => (v ? v[getLang()] || v.en : '')

export class TourRunner {
  /** deps: { anatomy, doctor, brain, applyLayers, setLive } */
  constructor(deps) {
    Object.assign(this, deps)
    this.tour = null
    this.i = 0
    this.paused = false
    this._timer = 0
    this._buildBar()
  }

  list() { return TOURS.map((tr) => ({ id: tr.id, match: tr.match, prompt: tx(tr.prompt), title: tx(tr.title), icon: tr.icon })) }
  menuText() { return t('tour.menu', { list: TOURS.map((tr) => tx(tr.title)).join(', ') }) }
  get active() { return !!this.tour }

  start(id) {
    const tour = TOURS.find((tr) => tr.id === id)
    if (!tour) return
    this.stop(true)
    this.tour = tour
    this.i = 0
    this.paused = false
    this._liveBefore = this.anatomy.live
    if (tour.live) this.setLive(true)
    this.bar.classList.remove('hidden')
    this._show()
  }

  stop(silent) {
    clearTimeout(this._timer)
    if (!this.tour) return
    const wasLive = this.tour.live
    this.tour = null
    this.bar.classList.add('hidden')
    if (wasLive && !this._liveBefore) this.setLive(false)
    this.doctor.onSpeechDone = null
    if (!silent) this.doctor.closeChat()
  }

  next() { if (!this.tour) return; if (this.i < this.tour.steps.length - 1) { this.i++; this._show() } else this.stop() }
  prev() { if (!this.tour || this.i === 0) return; this.i--; this._show() }
  togglePause() {
    if (!this.tour) return
    this.paused = !this.paused
    this._renderBar()
    if (this.paused) { clearTimeout(this._timer); window.speechSynthesis?.cancel() } else this._show()
  }

  _entryFor(focus) {
    if (!focus) return null
    if (focus.id) return this.brain._entryById(focus.id, focus.layer)
    if (focus.group) return this.brain.groupByName(focus.group, focus.layer)
    if (focus.alias) return this.brain._aliasEntry(focus.alias, [])
    return null
  }

  _show() {
    clearTimeout(this._timer)
    const step = this.tour.steps[this.i]
    this.applyLayers(step.layers)
    const entry = this._entryFor(step.focus)
    let detail = ''
    if (entry) detail = step.field ? entry[step.field] || entry.summary : entry.summary
    else if (step.system) detail = (doctorKB?.systems || []).find((s) => s.id === step.system)?.summary || ''
    const text = `${tx(step.say)}${detail ? '\n\n' + detail : ''}`
    if (entry) this.doctor.showAndPoint(entry)
    else { this.anatomy.select(null); this.anatomy.resetView(); this.doctor.pointAt = null }
    this._renderBar()
    this.doctor.say(text, { openAsk: false, suggestions: [] })
    // Move on a moment after Dr. Buddy finishes speaking, but never faster than the text can be read
    // (speech can end instantly when the browser has no voice for this language or blocks audio).
    const started = performance.now()
    const readMs = Math.max(5000, text.split(/\s+/).length * 300)
    this.doctor.onSpeechDone = () => {
      if (!this.tour || this.paused) return
      const left = readMs - (performance.now() - started)
      this._timer = setTimeout(() => this.next(), Math.max(1400, left + 800))
    }
  }

  _buildBar() {
    const bar = this.bar = document.createElement('div')
    bar.id = 'tour-bar'
    bar.className = 'tour-bar cut hidden'
    bar.innerHTML = `
      <span class="tour-title"></span>
      <span class="tour-step"></span>
      <div class="tour-dots"></div>
      <div class="tour-btns">
        <button data-a="prev" aria-label="Previous stop">◀</button>
        <button data-a="pause" aria-label="Pause"></button>
        <button data-a="next" aria-label="Next stop">▶</button>
        <button data-a="exit" aria-label="Exit tour">✕</button>
      </div>`
    bar.addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a
      if (a === 'prev') this.prev()
      if (a === 'next') this.next()
      if (a === 'pause') this.togglePause()
      if (a === 'exit') this.stop()
    })
    document.body.appendChild(bar)
  }

  _renderBar() {
    if (!this.tour) return
    const n = this.tour.steps.length
    this.bar.querySelector('.tour-title').textContent = `${this.tour.icon} ${tx(this.tour.title)}`
    this.bar.querySelector('.tour-step').textContent = t('tour.step', { i: this.i + 1, n })
    this.bar.querySelector('.tour-dots').innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < this.i ? 'done' : k === this.i ? 'cur' : ''}"></i>`).join('')
    this.bar.querySelector('[data-a=pause]').textContent = this.paused ? '▶︎ ' + t('tour.resume') : '❚❚ ' + t('tour.pause')
  }
}
