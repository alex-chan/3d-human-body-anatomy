// Stylised "animated-film" boy doctor, built from primitives so every part can be animated:
// side-swept brown hair, big brown eyes, thin round glasses, long white coat over a light-blue shirt,
// stethoscope around the neck, grey trousers and sneakers.
import * as THREE from 'three'

export const C = {
  skin: '#f6c7a6', skinShade: '#eab08f', blush: '#f29a8e', hair: '#4e3222', hairHi: '#7a5236',
  coat: '#f7f8fa', coatInner: '#dfe4ea', shirt: '#a9cdea', pants: '#8b9098', shoe: '#b9bec6', sole: '#f2f2f2',
  steth: '#2b3140', metal: '#d6dde6', iris: '#6b3f22', pupil: '#1a0f0a', mouth: '#8a2f35', tongue: '#e9737c',
  glasses: '#3a2c26', book: '#3d6fd6', apple: '#d8303b', leaf: '#3fa34d',
}

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0, ...o })
const phys = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, metalness: 0, ...o })

function M(geo, mat, { pos, rot, scale } = {}) {
  const m = new THREE.Mesh(geo, mat)
  if (pos) m.position.set(...pos)
  if (rot) m.rotation.set(...rot)
  if (scale) m.scale.set(...scale)
  return m
}
const sph = (r, w = 40, h = 30) => new THREE.SphereGeometry(r, w, h)
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 10, 24)
const tube = (pts, r, seg = 40) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 10)

export function buildDoctor() {
  const mats = {
    skin: phys(C.skin, { roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#ffb59c'), sheenRoughness: 0.6 }),
    hair: phys(C.hair, { roughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color(C.hairHi), sheenRoughness: 0.4 }),
    coat: phys(C.coat, { roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide }),
    coatInner: std(C.coatInner, { roughness: 0.8, side: THREE.DoubleSide }),
    shirt: phys(C.shirt, { roughness: 0.7, sheen: 0.3 }),
    pants: std(C.pants, { roughness: 0.8 }),
    shoe: std(C.shoe, { roughness: 0.6 }),
    sole: std(C.sole, { roughness: 0.5 }),
    steth: phys(C.steth, { roughness: 0.3, clearcoat: 0.6 }),
    metal: std(C.metal, { roughness: 0.2, metalness: 0.9 }),
    glasses: std(C.glasses, { roughness: 0.3, metalness: 0.4 }),
  }

  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1, 1, 0.35); shadow.position.y = 0.005
  root.add(shadow)

  // ---- legs: grey trousers + sneakers ----
  const legs = []
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.13 * s, 0.78, 0)
    hip.add(M(cap(0.105, 0.5), mats.pants, { pos: [0, -0.33, 0] }))
    const shoe = new THREE.Group(); shoe.position.set(0, -0.68, 0.05)
    shoe.add(M(sph(0.12), mats.shoe, { scale: [0.95, 0.62, 1.45], pos: [0, 0.03, 0] }))
    shoe.add(M(new THREE.CylinderGeometry(0.12, 0.125, 0.045, 28), mats.sole, { scale: [0.95, 1, 1.5], pos: [0, -0.03, 0.005] }))
    shoe.add(M(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), mats.sole, { pos: [0, 0.08, 0.06], rot: [-1.2, 0, 0] }))  // lace hint
    hip.add(shoe)
    body.add(hip); legs.push(hip)
  }

  // ---- shirt torso (light blue) ----
  const shirtProf = [[0.0, 0.72], [0.25, 0.74], [0.26, 0.95], [0.27, 1.2], [0.25, 1.38], [0.15, 1.5], [0.0, 1.52]].map(([x, y]) => new THREE.Vector2(x, y))
  body.add(new THREE.Mesh(new THREE.LatheGeometry(shirtProf, 40), mats.shirt))
  // shirt collar
  for (const s of [-1, 1]) body.add(M(new THREE.ConeGeometry(0.07, 0.13, 3), mats.shirt, { pos: [0.065 * s, 1.47, 0.12], rot: [0.9, 0, 0.5 * s], scale: [1, 1, 0.35] }))

  // ---- long open lab coat: lathe with a front opening ----
  const coatProf = [[0.37, 0.42], [0.35, 0.62], [0.32, 0.88], [0.305, 1.05], [0.32, 1.25], [0.31, 1.38], [0.24, 1.47], [0.14, 1.52]].map(([x, y]) => new THREE.Vector2(x, y))
  const gap = 0.62
  const coatGeo = new THREE.LatheGeometry(coatProf, 48, gap / 2, Math.PI * 2 - gap)
  const coat = new THREE.Mesh(coatGeo, mats.coat)
  body.add(coat)
  const coatIn = new THREE.Mesh(new THREE.LatheGeometry(coatProf.map((v) => new THREE.Vector2(v.x - 0.012, v.y)), 48, gap / 2, Math.PI * 2 - gap), mats.coatInner)
  coatIn.material.side = THREE.BackSide
  body.add(coatIn)
  // lapels folding back from the opening
  for (const s of [-1, 1]) {
    const lap = new THREE.Shape()
    lap.moveTo(0, 0); lap.lineTo(0.11, 0.02); lap.lineTo(0.05, 0.36); lap.lineTo(0.0, 0.4); lap.closePath()
    const g = new THREE.ExtrudeGeometry(lap, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 })
    const m = new THREE.Mesh(g, mats.coat)
    m.position.set(0.09 * s, 1.08, 0.285); m.scale.x = s; m.rotation.set(-0.12, 0.35 * s, 0.1 * s)
    body.add(m)
  }
  // pockets
  for (const s of [-1, 1]) body.add(M(new THREE.BoxGeometry(0.17, 0.13, 0.02), mats.coat, { pos: [0.2 * s, 0.76, 0.29], rot: [-0.05, 0.55 * s, 0] }))
  body.add(M(new THREE.BoxGeometry(0.12, 0.09, 0.015), mats.coat, { pos: [-0.2, 1.2, 0.27], rot: [-0.1, -0.6, 0] }))
  body.add(M(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), std('#2f6fdd'), { pos: [-0.21, 1.25, 0.27] }))
  // name badge
  const bc = document.createElement('canvas'); bc.width = 160; bc.height = 56
  const bx = bc.getContext('2d'); bx.fillStyle = '#fff'; bx.fillRect(0, 0, 160, 56); bx.fillStyle = '#1fb5a8'; bx.fillRect(0, 0, 160, 12)
  bx.fillStyle = '#1b2a44'; bx.font = 'bold 26px sans-serif'; bx.textAlign = 'center'; bx.fillText('Dr. Buddy', 80, 44)
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace
  body.add(M(new THREE.PlaneGeometry(0.15, 0.052), new THREE.MeshBasicMaterial({ map: bt }), { pos: [0.2, 1.2, 0.285], rot: [-0.1, 0.6, 0] }))

  // ---- arms (long white sleeves) ----
  const arms = []
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.33 * s, 1.4, 0)
    sh.add(M(sph(0.105), mats.coat, { pos: [0, -0.02, 0] }))
    sh.add(M(cap(0.088, 0.26), mats.coat, { pos: [0, -0.18, 0] }))
    const el = new THREE.Group(); el.position.set(0, -0.36, 0); sh.add(el)
    el.add(M(cap(0.08, 0.24), mats.coat, { pos: [0, -0.15, 0] }))
    el.add(M(new THREE.CylinderGeometry(0.083, 0.078, 0.05, 20), mats.coatInner, { pos: [0, -0.3, 0] }))
    const hand = new THREE.Group(); hand.position.set(0, -0.37, 0)
    hand.add(M(sph(0.068), mats.skin, { scale: [0.9, 1.15, 0.75] }))
    hand.add(M(sph(0.028), mats.skin, { pos: [0.045 * -s, 0.0, 0.035], scale: [1, 1.5, 1] }))
    el.add(hand)
    body.add(sh)
    arms.push({ sh, el, hand, s })
  }

  // ---- stethoscope draped around the neck ----
  body.add(M(tube([[-0.16, 1.5, -0.02], [0, 1.54, -0.12], [0.16, 1.5, -0.02]], 0.016, 20), mats.steth))
  body.add(M(tube([[-0.16, 1.5, -0.02], [-0.2, 1.45, 0.14], [-0.15, 1.3, 0.28], [-0.12, 1.12, 0.33], [-0.12, 1.0, 0.34]], 0.017), mats.steth))
  body.add(M(tube([[0.16, 1.5, -0.02], [0.2, 1.45, 0.14], [0.15, 1.32, 0.28], [0.12, 1.18, 0.32], [0.11, 1.1, 0.33]], 0.017), mats.steth))
  const chest = new THREE.Group(); chest.position.set(-0.12, 0.96, 0.345); chest.rotation.x = Math.PI / 2 - 0.15
  chest.add(M(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 32), mats.metal))
  chest.add(M(new THREE.CylinderGeometry(0.045, 0.045, 0.034, 32), std('#9aa6b5', { roughness: 0.3, metalness: 0.6 })))
  body.add(chest)
  for (const s of [-1, 1]) {
    body.add(M(tube([[0.11, 1.1, 0.33], [0.11 + 0.035 * s, 1.03, 0.34], [0.11 + 0.05 * s, 0.97, 0.34]], 0.008, 12), mats.metal))
    body.add(M(sph(0.016), std('#222'), { pos: [0.11 + 0.05 * s, 0.96, 0.34] }))
  }

  // ---- head ----
  const head = new THREE.Group(); head.position.set(0, 1.5, 0)
  body.add(head)
  head.add(M(new THREE.CylinderGeometry(0.075, 0.085, 0.14, 20), mats.skin, { pos: [0, 0.04, 0] }))  // neck
  const HC = 0.52  // head centre height (local)
  head.add(M(sph(0.46, 56, 44), mats.skin, { pos: [0, HC, 0], scale: [1.02, 1.0, 0.96] }))
  for (const s of [-1, 1]) head.add(M(sph(0.085), mats.skin, { pos: [0.45 * s, HC - 0.02, -0.02], scale: [0.55, 1, 0.85] }))  // ears
  head.add(M(sph(0.05, 24, 18), mats.skin, { pos: [0, HC - 0.1, 0.44], scale: [1, 0.8, 0.9] }))  // nose
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(sph(0.075, 20, 16), new THREE.MeshBasicMaterial({ color: C.blush, transparent: true, opacity: 0.32, depthWrite: false }))
    b.position.set(0.26 * s, HC - 0.17, 0.35); b.scale.set(1.2, 0.7, 0.4); head.add(b)
  }

  // eyes: sclera + brown iris + pupil + highlights
  const eyes = []
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(0.165 * s, HC + 0.01, 0.37)
    g.add(M(sph(0.1, 32, 24), std('#fbfbfb', { roughness: 0.2 }), { scale: [0.95, 1.1, 0.75] }))
    g.add(M(sph(0.064, 28, 20), phys(C.iris, { roughness: 0.25, clearcoat: 1 }), { pos: [0.004 * s, -0.005, 0.052], scale: [1, 1.1, 0.5] }))
    g.add(M(sph(0.034, 20, 14), new THREE.MeshBasicMaterial({ color: C.pupil }), { pos: [0.004 * s, -0.005, 0.078], scale: [1, 1.1, 0.4] }))
    g.add(M(sph(0.019, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff' }), { pos: [0.025, 0.03, 0.088] }))
    g.add(M(sph(0.009, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff' }), { pos: [-0.018, -0.025, 0.088] }))
    head.add(g); eyes.push(g)
  }
  const closedEyes = []
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.011, 8, 20, Math.PI), std('#4a2d22'))
    a.position.set(0.165 * s, HC - 0.01, 0.44); a.rotation.z = Math.PI; a.visible = false
    head.add(a); closedEyes.push(a)
  }
  const brows = []
  for (const s of [-1, 1]) {
    const b = M(tube([[-0.06, -0.01, 0], [0, 0.015, 0.01], [0.06, 0, 0]], 0.016, 12), mats.hair, { pos: [0.17 * s, HC + 0.155, 0.43], rot: [-0.2, 0, -0.12 * s] })
    b.userData.baseY = HC + 0.155
    head.add(b); brows.push(b)
  }

  // thin round glasses
  for (const s of [-1, 1]) {
    head.add(M(new THREE.TorusGeometry(0.125, 0.011, 10, 48), mats.glasses, { pos: [0.165 * s, HC + 0.01, 0.46] }))
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 40), new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.12, roughness: 0, clearcoat: 1, depthWrite: false }))
    lens.position.set(0.165 * s, HC + 0.01, 0.462); head.add(lens)
    head.add(M(tube([[0.29 * s, HC + 0.02, 0.44], [0.4 * s, HC + 0.03, 0.2], [0.43 * s, HC + 0.0, -0.02]], 0.008, 12), mats.glasses))
  }
  head.add(M(new THREE.TorusGeometry(0.04, 0.009, 8, 16, Math.PI), mats.glasses, { pos: [0, HC + 0.02, 0.465] }))

  // mouth: closed smile + open mouth
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.011, 8, 24, Math.PI * 0.9), std('#9a4a45'))
  smile.position.set(0, HC - 0.2, 0.395); smile.rotation.z = Math.PI * 1.05
  head.add(smile)
  const mouth = new THREE.Group(); mouth.position.set(0, HC - 0.215, 0.39)
  mouth.add(M(sph(0.072, 24, 16), new THREE.MeshBasicMaterial({ color: C.mouth }), { scale: [1, 1, 0.35] }))
  mouth.add(M(sph(0.045, 16, 12), std(C.tongue), { pos: [0, -0.035, 0.012], scale: [1, 0.55, 0.4] }))
  mouth.add(M(new THREE.BoxGeometry(0.075, 0.018, 0.02), std('#ffffff'), { pos: [0, 0.052, 0.012] }))
  head.add(mouth)

  // hair: rounded cap + big side-swept quiff
  const hair = mats.hair
  head.add(M(new THREE.SphereGeometry(0.49, 56, 30, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, { pos: [0, HC + 0.03, -0.03], rot: [-0.42, 0, 0], scale: [1.02, 1.0, 1.0] }))
  head.add(M(sph(0.46), hair, { pos: [0, HC + 0.02, -0.12], scale: [1.03, 0.98, 0.9] }))   // back of head
  const quiff = [
    // x, y, z, r, sx, sy, sz, rotZ  -> front hairline swept up and to his left
    [-0.14, 0.37, 0.3, 0.16, 1.5, 0.66, 0.85, 0.35],
    [0.08, 0.41, 0.29, 0.17, 1.55, 0.7, 0.85, -0.05],
    [0.27, 0.33, 0.24, 0.14, 1.2, 0.75, 0.85, -0.5],
    [-0.33, 0.27, 0.18, 0.13, 1.05, 0.85, 0.85, 0.65],
    [0.36, 0.2, 0.14, 0.11, 0.9, 1.0, 0.8, -0.8],
    [0.0, 0.47, 0.25, 0.13, 1.7, 0.55, 0.8, -0.3],   // swoop crest
  ]
  for (const [x, y, z, r, sx, sy, sz, rz] of quiff) head.add(M(sph(r, 32, 24), hair, { pos: [x, HC + y, z], scale: [sx, sy, sz], rot: [0.2, 0, rz] }))
  for (const s of [-1, 1]) head.add(M(sph(0.07, 16, 12), hair, { pos: [0.42 * s, HC + 0.12, 0.1], scale: [0.5, 1.4, 0.8] }))  // sideburns

  // ---- props ----
  const props = {}
  const book = new THREE.Group()
  book.add(M(new THREE.BoxGeometry(0.4, 0.29, 0.035), phys(C.book, { roughness: 0.5, clearcoat: 0.4 })))
  book.add(M(new THREE.BoxGeometry(0.38, 0.27, 0.045), std('#fffaf0'), { pos: [0, 0, 0.012] }))
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ color: '#ff4d6d' })); cross.position.set(0, 0, -0.019); cross.rotation.y = Math.PI
  book.add(cross)
  const bookPage = M(new THREE.PlaneGeometry(0.18, 0.26), std('#fffdf5', { side: THREE.DoubleSide }), { pos: [0, 0, 0.037] })
  bookPage.geometry.translate(0.09, 0, 0)
  book.add(bookPage)
  book.position.set(0, 1.05, 0.5); book.rotation.x = -0.7
  body.add(book); props.book = book

  const apple = new THREE.Group()
  apple.add(M(sph(0.1), phys(C.apple, { roughness: 0.25, clearcoat: 1 }), { scale: [1, 0.92, 1] }))
  apple.add(M(new THREE.CylinderGeometry(0.008, 0.01, 0.06, 6), std('#6b4226'), { pos: [0, 0.1, 0] }))
  apple.add(M(sph(0.035, 10, 8), std(C.leaf), { pos: [0.035, 0.115, 0], scale: [1.4, 0.4, 0.8] }))
  const appleBite = M(sph(0.045, 12, 10), std('#fff4dc'), { pos: [0.085, 0.02, 0.03] }); appleBite.visible = false
  apple.add(appleBite)
  arms[1].el.add(apple); apple.position.set(0, -0.45, 0.06)
  props.apple = apple

  const mug = new THREE.Group()
  mug.add(M(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 24), phys('#ffffff', { clearcoat: 0.8, roughness: 0.3 })))
  mug.add(M(new THREE.TorusGeometry(0.04, 0.012, 8, 16), phys('#ffffff', { clearcoat: 0.8 }), { pos: [0.075, 0, 0] }))
  mug.add(M(new THREE.CylinderGeometry(0.06, 0.06, 0.005, 20), std('#5a3522'), { pos: [0, 0.065, 0] }))
  arms[0].el.add(mug); mug.position.set(0, -0.46, 0.06)
  props.mug = mug

  const meshes = []
  root.traverse((o) => { if (o.isMesh && o !== shadow) meshes.push(o) })
  return {
    root, body, shadow, legs, arms, head, eyes, closedEyes, brows, smile, mouth, props, bookPage, appleBite, meshes,
    height: 2.55, shoulderY: 1.4,
  }
}
