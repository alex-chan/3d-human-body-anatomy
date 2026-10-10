// Tiny synthesized UI sounds (WebAudio), no audio files needed.
let ctx = null
export const sfx = { enabled: true }

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone({ f0 = 600, f1 = f0, dur = 0.08, type = 'sine', vol = 0.06, delay = 0 }) {
  if (!sfx.enabled) return
  const a = ac(), t = a.currentTime + delay
  const o = a.createOscillator(), g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t); o.stop(t + dur + 0.02)
}

export const play = {
  hover: () => tone({ f0: 1400, f1: 1800, dur: 0.035, type: 'sine', vol: 0.018 }),
  click: () => tone({ f0: 900, f1: 500, dur: 0.06, type: 'square', vol: 0.025 }),
  on: () => { tone({ f0: 520, f1: 780, dur: 0.07, type: 'triangle', vol: 0.05 }); tone({ f0: 780, f1: 1170, dur: 0.08, type: 'triangle', vol: 0.04, delay: 0.06 }) },
  off: () => tone({ f0: 700, f1: 300, dur: 0.1, type: 'triangle', vol: 0.045 }),
  select: () => { tone({ f0: 880, dur: 0.05, type: 'sine', vol: 0.05 }); tone({ f0: 1320, dur: 0.09, type: 'sine', vol: 0.045, delay: 0.05 }) },
  boot: () => { [330, 440, 660, 880].forEach((f, i) => tone({ f0: f, f1: f * 1.01, dur: 0.14, type: 'sawtooth', vol: 0.025, delay: i * 0.09 })) },
  // "Oh-ho!" surprise boing for the doctor
  boing: () => { tone({ f0: 300, f1: 900, dur: 0.18, type: 'sine', vol: 0.08 }); tone({ f0: 900, f1: 500, dur: 0.2, type: 'sine', vol: 0.06, delay: 0.16 }) },
  pop: () => tone({ f0: 500, f1: 1200, dur: 0.07, type: 'sine', vol: 0.05 }),
}
