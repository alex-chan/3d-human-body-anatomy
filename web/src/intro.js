// Landing-page intro: the real 3D body turns slowly behind the title while a scanner sweeps up it,
// peeling away one layer per pass (skin -> muscles -> organs & vessels -> bones -> skin ...).
const STAGES = [['skin'], ['muscles'], ['organs', 'arteries', 'veins'], ['skeleton']]
const SWEEP = 3.2   // seconds for the scanner to travel feet -> head
const HOLD = 2.2    // seconds to admire each layer before the next sweep

export class Intro {
  constructor(anatomy, { onStage } = {}) {
    this.anatomy = anatomy
    this.onStage = onStage
    this.running = false
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  start() {
    const a = this.anatomy
    this.running = true
    this.current = 3          // the skeleton is the first layer to arrive
    this.next = null
    this.t = 0
    this.phase = 'hold'
    this._gtao = a.gtao.enabled
    a.gtao.enabled = false    // ambient occlusion ignores the cut, so it would leave a dark ghost of the peeled layer
    a.controls.autoRotate = !this.reduced
    a.controls.autoRotateSpeed = 1.4
    this._applyOffset()
    this._onResize = () => this._applyOffset()
    addEventListener('resize', this._onResize)
    this._show(STAGES[this.current])
    this.onStage?.(STAGES[this.current], null)
  }

  /** Shift the picture so the body sits beside the landing text (right of it on wide screens, above it on phones). */
  _applyOffset() {
    const a = this.anatomy, cam = a.camera, w = innerWidth, h = innerHeight
    if (w > 900) { cam.setViewOffset(w, h, -w * 0.2, 0, w, h); return }
    // Phones: the text fills the lower half, so pull the camera back and lift the body into the top part of the screen.
    if (a.homePos && a.homeTarget) {
      const back = w < h ? 2.1 : 1.3
      cam.position.copy(a.homeTarget).add(a.homePos.clone().sub(a.homeTarget).multiplyScalar(back))
      a.controls.target.copy(a.homeTarget)
    }
    cam.setViewOffset(w, h, 0, h * 0.24, w, h)
  }

  /** Re-announce the current stage (e.g. after the language changes). */
  relabel() { if (this.running) this.onStage?.(STAGES[this.current], this.next != null ? STAGES[this.next] : null) }

  _loaded(stage) { return stage.every((k) => this.anatomy.layers[k]?.loaded) }

  _show(stage) {
    for (const k of ['skin', 'muscles', 'organs', 'arteries', 'veins', 'nerves', 'skeleton']) {
      const on = stage.includes(k)
      this.anatomy.setVisible(k, on)
      if (on) this.anatomy.setOpacity(k, 1)
    }
  }

  update() {
    const now = performance.now()
    const dt = Math.min(0.1, (now - (this._last || now)) / 1000)
    this._last = now
    if (!this.running || this.reduced) return
    const a = this.anatomy
    this.t += dt
    if (this.phase === 'hold') {
      a.scanOverride = -10
      if (this.t < HOLD) return
      // Pick the next stage whose layers have finished downloading.
      for (let s = 1; s <= STAGES.length; s++) {
        const idx = (this.current + s) % STAGES.length
        if (this._loaded(STAGES[idx])) { this.next = idx; break }
      }
      if (this.next == null || this.next === this.current) { this.t = 0; this.next = null; return }
      const from = STAGES[this.current], to = STAGES[this.next]
      for (const k of to) { a.setVisible(k, true); a.setOpacity(k, 1) }
      this.phase = 'sweep'
      this.t = 0
      this.onStage?.(from, to)
    }
    if (this.phase === 'sweep') {
      const from = STAGES[this.current], to = STAGES[this.next]
      const k = Math.min(1, this.t / SWEEP)
      const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
      const y = ease * (a.bodyHeight + 0.06)
      a.scanOverride = y
      for (const key of from) a.setLayerClip(key, 'above', y)   // the outer layer dissolves upward...
      for (const key of to) a.setLayerClip(key, 'below', y)     // ...revealing the next one underneath
      if (k >= 1) {
        for (const key of from) { a.setLayerClip(key, null); if (!to.includes(key)) a.setVisible(key, false) }
        for (const key of to) a.setLayerClip(key, null)
        this.current = this.next
        this.next = null
        this.phase = 'hold'
        this.t = 0
        this.onStage?.(to, null)
      }
    }
  }

  stop() {
    if (!this.running) return
    const a = this.anatomy
    this.running = false
    for (const k of Object.keys(a.layers)) a.setLayerClip(k, null)
    a.scanOverride = null
    a.gtao.enabled = this._gtao && a.quality === 'ultra'
    a.controls.autoRotateSpeed = 0.8
    a.controls.autoRotate = false
    a.camera.clearViewOffset()
    removeEventListener('resize', this._onResize)
  }
}
