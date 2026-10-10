// Dr. Buddy: a procedural, toon-shaded 3D cartoon doctor living in a transparent overlay canvas.
// Orthographic camera in pixel units, so he can walk anywhere on screen.
import * as THREE from 'three'
import { play } from './sfx.js'
import { doctorKB } from './content.js'
import { buildDoctor } from './doctorModel.js'
import { getLang, onLangChange, t } from './i18n.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

let S = 72              // pixels per character unit (character is ~2.55 units tall); shrinks on small screens
const fitScale = () => Math.round(Math.max(34, Math.min(72, innerHeight * 0.085, innerWidth * 0.1)))
const HOME_MARGIN = 95
const homeX = () => innerWidth - Math.max(50, Math.min(95, innerWidth * 0.09))

export class Doctor {
  constructor(canvas, { anatomy, brain, goToEntry }) {
    this.canvas = canvas
    this.anatomy = anatomy
    this.brain = brain
    this.goToEntry = goToEntry
    this.lines = doctorKB?.lines || {}
    this.voiceOn = true
    this.state = 'studying'
    this.stateT = 0
    this.nextIdle = 9
    this.speaking = false
    this.mouthOpen = 0
    this.mouthTarget = 0
    this.pos = new THREE.Vector2(homeX(), innerHeight - 58)
    this.docked = true
    this.target = null
    this.facing = 0
    this.pointAt = null
    this.jump = 0
    this.surprise = 0
    this.blinkT = 2
    this.clock = new THREE.Clock()
    this._initRenderer()
    this._build()
    this._initUI()
    this._pickVoice()
    this.setIdle('studying')
  }

  // ---------- renderer ----------
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.scene = new THREE.Scene()
    this.cam = new THREE.OrthographicCamera(0, innerWidth, innerHeight, 0, -2000, 2000)
    this.cam.position.z = 1000
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    const pm = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.7
    this.scene.add(new THREE.HemisphereLight(0xfff4e8, 0x40506a, 0.6))
    const key = new THREE.DirectionalLight(0xfff0e0, 2.4); key.position.set(-0.6, 1, 1.2); this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xcfe0ff, 0.8); fill.position.set(1, 0.3, 1); this.scene.add(fill)
    const rim = new THREE.DirectionalLight(0x9ff5ff, 1.6); rim.position.set(1, 0.8, -1); this.scene.add(rim)
    addEventListener('resize', () => {
      this.renderer.setSize(innerWidth, innerHeight)
      this.cam.right = innerWidth; this.cam.top = innerHeight; this.cam.updateProjectionMatrix()
      S = fitScale(); this.root?.scale.setScalar(S)
    })
    this.raycaster = new THREE.Raycaster()
  }

  // ---------- character ----------
  _build() {
    const d = buildDoctor()
    Object.assign(this, {
      root: d.root, body: d.body, shadow: d.shadow, legs: d.legs, arms: d.arms, head: d.head, eyes: d.eyes,
      closedEyes: d.closedEyes, brows: d.brows, smile: d.smile, mouth: d.mouth, props: d.props,
      bookPage: d.bookPage, appleBite: d.appleBite, meshes: d.meshes, H: d.height, shoulderY: d.shoulderY,
    })
    S = fitScale()
    this.root.scale.setScalar(S)
    this.scene.add(this.root)
  }

  // ---------- UI: speech bubble / ask form / mic ----------
  _initUI() {
    const $ = (s) => document.querySelector(s)
    this.bubble = $('#bubble'); this.bubbleText = $('#bubble-text'); this.askForm = $('#ask-form'); this.askInput = $('#ask-input')
    this.suggestEl = $('#bubble-suggest')
    $('#bubble-close').addEventListener('click', () => this.closeChat())
    $('#mute').addEventListener('click', (e) => {
      this.voiceOn = !this.voiceOn
      e.target.textContent = t(this.voiceOn ? 'ui.voiceOn' : 'ui.voiceOff')
      if (!this.voiceOn) window.speechSynthesis?.cancel()
    })
    this.askForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const q = this.askInput.value.trim(); if (!q) return
      this.askInput.value = ''
      this.ask(q)
    })
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const mic = $('#mic')
    if (!SR) mic.style.display = 'none'
    else mic.addEventListener('click', () => {
      const rec = new SR(); rec.lang = getLang() === 'hi' ? 'hi-IN' : 'en-US'; rec.interimResults = false
      mic.classList.add('on'); rec.start()
      rec.onresult = (ev) => { const t = ev.results[0][0].transcript; this.askInput.value = t; this.ask(t) }
      rec.onend = () => mic.classList.remove('on')
    })
  }

  _pickVoice() {
    if (!('speechSynthesis' in window)) return
    const choose = () => {
      const hi = getLang() === 'hi'
      const vs = speechSynthesis.getVoices().filter((v) => (hi ? /^hi(-|_)/i : /^en(-|_)/i).test(v.lang))
      const pref = hi ? [/natural/i, /Google/i, /Swara|Madhur|Kalpana|Hemant/i, /hi-IN/i] : [/natural/i, /Google US English/i, /Aria|Jenny|Guy|Davis|Samantha|Daniel/i, /en-US/i]
      for (const re of pref) { const v = vs.find((x) => re.test(x.name) || re.test(x.lang)); if (v) { this.voice = v; return } }
      this.voice = vs[0]
    }
    choose()
    speechSynthesis.onvoiceschanged = choose
    onLangChange(choose)
  }

  // ---------- public API ----------
  hitTest(x, y) {
    const v = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1)
    this.raycaster.setFromCamera(v, this.cam)
    const hit = this.raycaster.intersectObjects(this.meshes, false).length > 0
    if (hit) this.onClick()
    return hit
  }
  isOver(x, y) {
    const v = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1)
    this.raycaster.setFromCamera(v, this.cam)
    return this.raycaster.intersectObjects(this.meshes, false).length > 0
  }

  onClick() {
    window.speechSynthesis?.cancel()
    this.speaking = false
    play.boing()
    this.jump = 1; this.surprise = 1
    this.setState('surprised')
    const line = this._line('clickReactions', 'Oh-ho! What do you want to know? Ask me anything!')
    setTimeout(() => {
      this.say(line, { openAsk: true, suggestions: this.brain.suggestions(3) })
    }, 250)
  }

  greet() {
    this.say(this._line('greetings', "Hi there! I'm Dr. Buddy. Click any body part to learn about it, or click me to ask a question!"), { openAsk: false })
  }

  ask(q) {
    this.onAsk?.()
    const res = this.brain.answer(q)
    if (res.tour) return   // the tour runner takes over the bubble
    if (res.entry) this.showAndPoint(res.entry)
    this.say(res.text, { openAsk: true, suggestions: res.suggestions || [] })
  }

  explainEntry(entry) {
    this.showAndPoint(entry)
    const r = this.brain._explain(entry)
    this.say(r.text, { openAsk: true, suggestions: r.suggestions })
  }

  /** Select the structure, wait for its layer to load and the camera to finish moving, then walk over and point. */
  showAndPoint(entry) {
    const token = (this._pointToken = {})
    Promise.resolve(this.goToEntry(entry))
      .then(() => this.anatomy.cameraSettled())
      .then(() => { if (this._pointToken === token) this._walkToEntry(entry) })
      .catch(() => {})
  }

  _walkToEntry(entry) {
    const ms = this.anatomy.meshesForEntry(entry)
    if (!ms.length) return
    const sp = this.anatomy.screenPosOf(ms)
    const infoOpen = !document.querySelector('#info').classList.contains('hidden')
    const maxX = innerWidth - (infoOpen && innerWidth > 900 ? 400 : 90)
    let tx = sp.x + (sp.x > innerWidth / 2 ? -170 : 170)
    tx = Math.max(300, Math.min(maxX, tx))
    this.walkTo(tx, () => { this.pointAt = sp })
  }

  walkTo(x, done) {
    this.target = { x, done }
    this.pointAt = null
    this.docked = false
    this.setState('walking')
  }
  goHome() { this.walkTo(homeX(), () => { this.facing = 0; this.docked = true; this.setIdle() }) }
  /** Wait off-screen (right edge) until walkOn() is called; used by the landing page. */
  hideOffstage() { this.docked = false; this.target = null; this.pos.x = innerWidth + 140 }
  walkOn() { this.walkTo(homeX(), () => { this.facing = 0; this.docked = true; this.setIdle('waving') }) }
  atHome() { return this.docked || Math.abs(this.pos.x - (homeX())) < 8 }

  say(text, { openAsk = true, suggestions = [] } = {}) {
    this.bubble.classList.remove('hidden')
    this.askForm.classList.toggle('hidden', !openAsk)
    this.bubbleText.innerHTML = ''
    const safe = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    this.bubbleText.innerHTML = safe(text).replace(/^([^.!?\n]{2,80}[.!?])/, '<b>$1</b>')
    this.suggestEl.innerHTML = ''
    for (const s of suggestions.slice(0, 3)) {
      const b = document.createElement('button'); b.textContent = s
      b.addEventListener('click', () => this.ask(s))
      this.suggestEl.appendChild(b)
    }
    if (this.state !== 'walking') this.setState('talking')
    this._speak(text)
    if (openAsk) setTimeout(() => this.askInput.focus({ preventScroll: true }), 50)
  }

  closeChat() {
    this.onClose?.()
    this.onSpeechDone = null
    this.bubble.classList.add('hidden')
    window.speechSynthesis?.cancel()
    this.speaking = false
    this.pointAt = null
    this._pointToken = null
    if (!this.atHome()) this.goHome()
    else this.setIdle()
  }

  _speak(text) {
    window.speechSynthesis?.cancel()
    const clean = text.replace(/\n+/g, ' ').replace(/[()]/g, ', ')
    this.speaking = true
    this._speakEnd = null
    if (!this.voiceOn || !('speechSynthesis' in window)) {
      const dur = Math.max(3, Math.min(25, 0.32 * clean.split(/\s+/).length))
      this._speakEnd = performance.now() + dur * 1000
      return
    }
    const u = this._utter = new SpeechSynthesisUtterance(clean)
    if (this.voice) u.voice = this.voice
    u.lang = this.voice?.lang || (getLang() === 'hi' ? 'hi-IN' : 'en-US')
    u.pitch = 1.25; u.rate = 1.03; u.volume = 1
    u.onboundary = () => { this.mouthTarget = 1 }
    // Ignore events from an utterance that was cancelled to make way for a newer one.
    u.onend = () => { if (this._utter !== u) return; this.speaking = false; this._afterSpeech() }
    u.onerror = () => { if (this._utter !== u) return; this.speaking = false; this._afterSpeech() }
    speechSynthesis.speak(u)
    // Safety: some browsers never fire onend.
    this._speakEnd = performance.now() + Math.max(4, clean.length * 0.085) * 1000
  }

  _afterSpeech() {
    if (this.state === 'talking' || this.state === 'surprised') this.setState('listening')
    const done = this.onSpeechDone
    this.onSpeechDone = null
    done?.()
  }

  _line(kind, fb) { const a = this.lines[kind]; return a?.length ? a[Math.floor(Math.random() * a.length)] : fb }

  setState(s) { this.state = s; this.stateT = 0 }
  setIdle(which) {
    const opts = ['sleeping', 'studying', 'eating', 'coffee', 'waving']
    const s = which || opts[Math.floor(Math.random() * opts.length)]
    this.setState(s)
    this.nextIdle = 10 + Math.random() * 6
  }

  // ---------- animation ----------
  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    this.stateT += dt
    const st = this.state
    const idle = ['sleeping', 'studying', 'eating', 'coffee', 'waving'].includes(st)
    if (idle && this.stateT > this.nextIdle && this.bubble.classList.contains('hidden')) this.setIdle()
    if (this.speaking && this._speakEnd && performance.now() > this._speakEnd && !window.speechSynthesis?.speaking) { this.speaking = false; this._afterSpeech() }
    if (st === 'listening' && this.stateT > 25 && this.bubble.classList.contains('hidden')) this.goHome()

    // walking
    let walking = false
    this.pos.y = innerHeight - 58
    if (this.docked && !this.target) this.pos.x = homeX()
    if (this.target) {
      const dx = this.target.x - this.pos.x
      if (Math.abs(dx) < 4) {
        const done = this.target.done; this.target = null
        this.setState(this.speaking ? 'talking' : 'listening')
        done && done()
      } else {
        walking = true
        this.pos.x += Math.sign(dx) * Math.min(Math.abs(dx), 330 * dt)
        this.facing = THREE.MathUtils.lerp(this.facing, Math.sign(dx) * 0.9, 0.15)
      }
    } else if (!this.pointAt) this.facing = THREE.MathUtils.lerp(this.facing, st === 'studying' || st === 'sleeping' ? -0.25 : 0, 0.08)

    // pose defaults
    const P = { bodyBob: Math.sin(t * 2) * 0.015, headX: 0, headZ: Math.sin(t * 0.9) * 0.04, headY: 0,
      armL: [0.1, 0, 0.12], elL: [0, 0, 0], armR: [0.1, 0, -0.12], elR: [0, 0, 0], legSwing: 0, eyesClosed: false, brow: 0, props: {} }

    if (walking) {
      const w = t * 11
      P.legSwing = Math.sin(w) * 0.55
      P.bodyBob = Math.abs(Math.sin(w)) * 0.06
      P.armL = [-Math.sin(w) * 0.5, 0, 0.15]; P.armR = [Math.sin(w) * 0.5, 0, -0.15]
      P.elL = [-0.3, 0, 0]; P.elR = [-0.3, 0, 0]
    } else if (st === 'sleeping') {
      P.headX = 0.35; P.headZ = 0.25 + Math.sin(t * 1.2) * 0.03; P.bodyBob = Math.sin(t * 1.3) * 0.025; P.eyesClosed = true
      P.armL = [-0.4, 0, 0.5]; P.elL = [-1.6, 0, 0]; P.armR = [-0.4, 0, -0.5]; P.elR = [-1.6, 0, 0]
      if ((this._zT = (this._zT || 0) - dt) < 0) { this._zT = 1.1; this._spawnZ() }
    } else if (st === 'studying') {
      P.headX = 0.35 + Math.sin(t * 0.7) * 0.05; P.headZ = Math.sin(t * 0.5) * 0.08
      P.armL = [-0.9, 0.2, 0.35]; P.elL = [-1.1, 0, 0]; P.armR = [-0.9, -0.2, -0.35]; P.elR = [-1.1, 0, 0]
      P.props.book = true
      const flip = (t % 5) / 5
      this.bookPage.rotation.y = flip > 0.85 ? -((flip - 0.85) / 0.15) * Math.PI : 0
      if (flip > 0.85 && !this._flipped) { this._flipped = true } else if (flip < 0.85) this._flipped = false
    } else if (st === 'eating' || st === 'coffee') {
      const cyc = (t % 3.2) / 3.2
      const up = cyc < 0.35 ? Math.sin((cyc / 0.35) * Math.PI) : 0
      if (st === 'eating') {
        P.armR = [-0.5 - up * 1.4, 0, -0.35 + up * 0.25]; P.elR = [-1.0 - up * 0.9, 0, 0]; P.props.apple = true
        if (up > 0.9 && !this._bit) { this._bit = true; this.appleBite.visible = true; play.pop() }
        if (cyc > 0.4) this._bit = false
        this.mouthTarget = cyc > 0.35 && cyc < 0.7 ? 0.35 + Math.abs(Math.sin(t * 16)) * 0.35 : 0
      } else {
        P.armL = [-0.5 - up * 1.3, 0, 0.35 - up * 0.2]; P.elL = [-1.0 - up * 0.9, 0, 0]; P.props.mug = true
        P.eyesClosed = up > 0.5
      }
      P.headX = up * -0.1
    } else if (st === 'waving') {
      P.armR = [0, 0, -2.6 + Math.sin(t * 8) * 0.35]; P.elR = [0, 0, -0.3 + Math.sin(t * 8) * 0.3]
      if (this.stateT > 3) this.setIdle('studying')
    } else if (st === 'surprised') {
      P.brow = 0.08; P.armL = [0, 0, 1.2]; P.armR = [0, 0, -1.2]; P.elL = [0, 0, 0.6]; P.elR = [0, 0, -0.6]
      this.mouthTarget = 0.85
    } else if (st === 'talking' || st === 'listening') {
      const g = st === 'talking' ? 1 : 0.3
      P.armL = [-0.3 - Math.sin(t * 2.3) * 0.25 * g, 0, 0.35 + Math.sin(t * 1.7) * 0.2 * g]; P.elL = [-0.9 - Math.sin(t * 3.1) * 0.3 * g, 0, 0]
      P.armR = [-0.1, 0, -0.15]; P.headX = Math.sin(t * 2.6) * 0.05 * g; P.headZ = Math.sin(t * 1.3) * 0.06
      P.brow = Math.max(0, Math.sin(t * 1.9)) * 0.02 * g
    }

    // point at the structure being explained (right arm up toward it)
    if (this.pointAt && !walking) {
      const dx = this.pointAt.x - this.pos.x, dy = (innerHeight - this.pointAt.y) - (innerHeight - this.pos.y + this.shoulderY * S)
      const ang = Math.atan2(dy, dx)
      const side = dx > 0 ? 1 : -1
      this.facing = THREE.MathUtils.lerp(this.facing, side * 0.45, 0.1)
      const arm = side > 0 ? 'R' : 'L'
      const z = side > 0 ? ang - Math.PI / 2 : ang + Math.PI / 2
      P['arm' + arm] = [0, 0, z]; P['el' + arm] = [0, 0, 0]
    }

    // talking mouth
    if (this.speaking) {
      if (Math.random() < 0.18) this.mouthTarget = 0.25 + Math.random() * 0.75
      else this.mouthTarget *= 0.92
    } else if (st !== 'surprised' && st !== 'eating') this.mouthTarget = 0
    this.mouthOpen = THREE.MathUtils.lerp(this.mouthOpen, this.mouthTarget, 0.35)
    this.mouth.visible = this.mouthOpen > 0.08
    this.mouth.scale.set(0.8 + this.mouthOpen * 0.3, Math.max(0.05, this.mouthOpen), 1)
    this.smile.visible = !this.mouth.visible

    // blink
    this.blinkT -= dt
    let blink = 1
    if (this.blinkT < 0) { blink = Math.max(0.08, Math.abs(this.blinkT + 0.08) / 0.08); if (this.blinkT < -0.16) this.blinkT = 2 + Math.random() * 3 }
    for (const e of this.eyes) { e.visible = !P.eyesClosed; e.scale.y = this.surprise > 0.2 ? 1.2 : blink }
    for (const e of this.closedEyes) e.visible = P.eyesClosed
    this.surprise = Math.max(0, this.surprise - dt * 1.2)
    for (const b of this.brows) b.position.y = b.userData.baseY + P.brow + this.surprise * 0.06

    // jump
    if (this.jump > 0) this.jump = Math.max(0, this.jump - dt * 2.2)
    const jy = Math.sin(this.jump * Math.PI) * 0.45 * (this.jump > 0 ? 1 : 0)

    // apply (smoothly)
    const L = (o, k, v, a = 0.18) => { o[k] = THREE.MathUtils.lerp(o[k], v, a) }
    L(this.body.position, 'y', P.bodyBob + jy)
    L(this.head.rotation, 'x', P.headX); L(this.head.rotation, 'z', P.headZ)
    const setArm = (a, r, e) => { L(a.sh.rotation, 'x', r[0]); L(a.sh.rotation, 'y', r[1]); L(a.sh.rotation, 'z', r[2]); L(a.el.rotation, 'x', e[0]); L(a.el.rotation, 'z', e[2]) }
    setArm(this.arms[0], P.armL, P.elL); setArm(this.arms[1], P.armR, P.elR)
    this.legs[0].rotation.x = P.legSwing; this.legs[1].rotation.x = -P.legSwing
    this.props.book.visible = !!P.props.book
    this.props.apple.visible = !!P.props.apple
    if (!P.props.apple) this.appleBite.visible = false
    this.props.mug.visible = !!P.props.mug
    this.shadow.scale.set(1 - jy * 0.5, 1 - jy * 0.5, 0.35)

    this.root.rotation.y = this.facing
    this.root.position.set(this.pos.x, innerHeight - this.pos.y, 0)

    // bubble follows the doctor
    if (!this.bubble.classList.contains('hidden')) {
      const bw = this.bubble.offsetWidth, bh = this.bubble.offsetHeight
      let left = this.pos.x - bw + 70
      left = Math.max(12, Math.min(innerWidth - bw - 12, left))
      const top = Math.max(80, this.pos.y - this.H * S - bh - 10)
      const info = document.querySelector('#info')
      if (innerWidth > 900 && !info.classList.contains('hidden')) {
        const r = info.getBoundingClientRect()
        if (top < r.bottom && left + bw > r.left - 12) left = Math.max(12, r.left - bw - 16)
      }
      this.bubble.style.left = left + 'px'; this.bubble.style.top = top + 'px'
      this.bubble.style.setProperty('--tail', Math.max(16, Math.min(bw - 40, this.pos.x - left - 10)) + 'px')
    }
    this.renderer.render(this.scene, this.cam)
  }

  _spawnZ() {
    const z = document.createElement('div')
    z.className = 'zzz'
    z.textContent = 'z'
    z.style.fontSize = 16 + Math.random() * 12 + 'px'
    z.style.left = this.pos.x + 20 + 'px'
    z.style.top = this.pos.y - this.H * S + 10 + 'px'
    document.body.appendChild(z)
    setTimeout(() => z.remove(), 2700)
  }
}
