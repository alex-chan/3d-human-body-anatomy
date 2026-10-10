import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh'
import { COLORS, entryFor, displayName, sideOf } from './content.js'
import { makeTissueMaterial, makeHoloMaterial, addFiberAttribute, USES_FIBRE, globalUniforms, BEAT } from './materials.js'

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

const BASE = import.meta.env.BASE_URL

// ---- colours ----------------------------------------------------------------
const ORGAN_RULES = [
  [/liver|segment of liver|caudate lobe|quadrate lobe/i, '#7b2d24'],
  [/gallbladder/i, '#4f7d3a'],
  [/kidney|renal/i, '#8a3530'],
  [/spleen/i, '#6d2a3c'],
  [/leaflet|cusp/i, '#e8d9c8'],
  [/ventricle|atrium|auricle|heart|myocard|septum/i, '#a8303a'],
  [/lung/i, '#e39a9a'],
  [/stomach|duodenum|jejunum|ileum|intestin|colon|caecum|cecum|appendix|rectum|anal canal|oesophag|esophag/i, '#e09a86'],
  [/pancrea/i, '#e8c07a'],
  [/thyroid|parathyroid|suprarenal|adrenal|hypophysis|pituitary|pineal|thymus/i, '#d9a55e'],
  [/bladder/i, '#d9b38c'],
  [/testis|epididym|prostate|seminal|penis|corpus|ductus deferens|spermatic/i, '#d99595'],
  [/tongue/i, '#d0666e'],
]
const MAT_COLORS = {
  organs: {
    Lung: '#e39a9a', Organ: '#8e3b30', Intestine: '#e09a86', Gland: '#e0b36a', Mucosa: '#d9848c', Ductus: '#c8c86a',
    Bronchi: '#e3e8ea', Gallbladder: '#4f7d3a', Eye: '#e6e0d8', Cornea: '#cfe8ff', Iris: '#4f7aa6', Nucleus: '#c7a0d9',
    Cartilage: '#cfe3e8', Trapezius: '#a8303a', 'Frontal lobe': '#e8b8b0', 'Parietal lobe': '#e3b3b8', 'Temporal lobe': '#e6bca6',
    'Occipital lobe': '#dcb0c0', 'Limbic lobe': '#e0a8a0', Insula: '#e0b8a0', Cerebellum: '#d99a9a', Brain: '#e2b6ae',
    'Interlobar sulci': '#c99a94', 'White matter': '#f0e6dc', Lymph: '#8fc97a',
  },
  skeleton: { Bone: COLORS.bone, Cartilage: '#bcdde3', Teeth: '#f7f2e4' },
  skin: { Skin: '#d6a07e', Nail: '#efc6b8', Black: '#2b1d18', Eye: '#e6e0d8', Cornea: '#cfe8ff', Iris: '#5b4030', Garment: '#2c3a5a' },
}
const BRAIN_MATS = new Set(['Frontal lobe', 'Parietal lobe', 'Temporal lobe', 'Occipital lobe', 'Limbic lobe', 'Insula', 'Cerebellum', 'Brain', 'Interlobar sulci', 'White matter', 'Nucleus'])

function colorFor(layer, mat, name) {
  if (layer === 'arteries') return mat === 'Pulmonary artery' ? COLORS.pulmonaryArtery : COLORS.artery
  if (layer === 'veins') return mat === 'Pulmonary vein' ? COLORS.pulmonaryVein : COLORS.vein
  if (layer === 'nerves') return COLORS.nerve
  if (layer === 'muscles') return mat === 'Tendon' ? '#eadfc8' : COLORS.muscle
  if (layer === 'organs') for (const [re, c] of ORGAN_RULES) if (re.test(name)) return c
  return MAT_COLORS[layer]?.[mat] || '#cccccc'
}

function tissueFor(layer, mat, name) {
  switch (layer) {
    case 'skeleton': return mat === 'Teeth' ? 'teeth' : mat === 'Cartilage' ? 'cartilage' : 'bone'
    case 'muscles': return mat === 'Tendon' ? 'tendon' : 'muscle'
    case 'arteries': case 'veins': return 'vessel'
    case 'nerves': return 'nerve'
    case 'skin':
      if (mat === 'Black') return 'hair'
      if (mat === 'Nail') return 'teeth'
      if (mat === 'Skin') return 'skin'
      if (mat === 'Garment') return 'fabric'
      return 'plain'
    case 'organs':
      if (mat === 'Lung') return 'lung'
      if (BRAIN_MATS.has(mat)) return 'brain'
      if (mat === 'Bronchi' || mat === 'Cartilage') return 'cartilage'
      if (mat === 'Eye' || mat === 'Cornea' || mat === 'Iris') return 'plain'
      if (mat === 'Intestine' || mat === 'Mucosa' || /stomach|oesophag|colon|rectum|duoden|jejun|ile/i.test(name)) return 'gut'
      return 'organ'
  }
  return 'plain'
}

/** Average normals of coincident vertices across separate meshes (skin region patches) so seams disappear.
 *  Only normals facing roughly the same way are merged, so inside-out patches stay untouched. */
function weldNormals(meshes, q = 650) {
  const buckets = new Map()
  for (const m of meshes) {
    const pos = m.geometry.attributes.position, nor = m.geometry.attributes.normal
    if (!nor) continue
    for (let i = 0; i < pos.count; i++) {
      const k = Math.round(pos.getX(i) * q) + ',' + Math.round(pos.getY(i) * q) + ',' + Math.round(pos.getZ(i) * q)
      let b = buckets.get(k); if (!b) buckets.set(k, (b = []))
      b.push(m.geometry, i)
    }
  }
  const n = new THREE.Vector3(), o = new THREE.Vector3(), sum = new THREE.Vector3()
  const out = new Map()
  for (const b of buckets.values()) {
    if (b.length <= 2) continue
    for (let a = 0; a < b.length; a += 2) {
      n.fromBufferAttribute(b[a].attributes.normal, b[a + 1])
      sum.set(0, 0, 0)
      for (let c = 0; c < b.length; c += 2) {
        o.fromBufferAttribute(b[c].attributes.normal, b[c + 1])
        if (o.dot(n) > 0.2) sum.add(o)
      }
      sum.normalize()
      let arr = out.get(b[a]); if (!arr) out.set(b[a], (arr = []))
      arr.push(b[a + 1], sum.x, sum.y, sum.z)
    }
  }
  for (const [g, arr] of out) {
    const nor = g.attributes.normal
    for (let i = 0; i < arr.length; i += 4) nor.setXYZ(arr[i], arr[i + 1], arr[i + 2], arr[i + 3])
    nor.needsUpdate = true
  }
}

/** Which live pulse a vessel or nerve material carries (see FLOW in materials.js). */
function flowFor(layer, mat) {
  if (layer === 'arteries') return mat === 'Pulmonary artery' ? 'pulmonaryArtery' : 'artery'
  if (layer === 'veins') return mat === 'Pulmonary vein' ? 'pulmonaryVein' : 'vein'
  if (layer === 'nerves') return 'nerve'
  return undefined
}

// Parts that move in the live animations. The coronary vessels sit on the heart, so they beat with it.
const HEART_RE = /atri|ventric|valve|leaflet|papillary|^heart/i
const CORONARY_RE = /coronar|cardiac vein|arteries of heart|circumflex artery of heart|interventricular artery|vein of left ventricle/i
const LUNG_RE = /lobe of (right|left) lung|bronch/i
const BRAINSTEM_RE = /medulla oblongata|^pons|midbrain/i

export const LAYER_ORDER =['skeleton', 'organs', 'arteries', 'veins', 'nerves', 'muscles', 'skin']
const HOLO_TINT = { skeleton: '#9ee7ff', organs: '#ff8fb1', arteries: '#ff4d6d', veins: '#4d8dff', nerves: '#ffe066', muscles: '#ff7a5c', skin: '#7ff5e6' }

export class Anatomy extends EventTarget {
  constructor(canvas, labelsEl) {
    super()
    this.canvas = canvas
    this.labelsEl = labelsEl
    this.nameMode = 'medical'
    this.renderMode = 'realistic'
    this.quality = 'ultra'
    this.layers = {}
    this.meshByName = new Map()
    this.selected = null
    this.hovered = null
    this.isolated = false
    this.showLabels = false
    this.scanner = true
    this.live = true
    this.labels = []
    this._initThree()
    this._initStage()
    this._initComposer()
  }

  _initThree() {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' })
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    r.setSize(innerWidth, innerHeight)
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.0
    r.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    const pm = new THREE.PMREMGenerator(r)
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.45

    // Studio light rig: warm key, cyan + magenta rims for the "game" look.
    const key = new THREE.DirectionalLight(0xfff1e0, 1.7); key.position.set(1.5, 3, 2.5)
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.6); fill.position.set(-2, 1.5, 2)
    const rimC = new THREE.DirectionalLight(0x38f5e6, 2.4); rimC.position.set(-2.5, 2, -2.5)
    const rimM = new THREE.DirectionalLight(0xb967ff, 1.8); rimM.position.set(2.5, 1.2, -2.5)
    this.scene.add(key, fill, rimC, rimM, new THREE.HemisphereLight(0xc8dcff, 0x1a1030, 0.35))

    this.camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 100)
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.autoRotateSpeed = 0.8

    this.root = new THREE.Group()
    this.scene.add(this.root)

    this.raycaster = new THREE.Raycaster()
    this.raycaster.firstHitOnly = true
    this.pointer = new THREE.Vector2()

    this.loader = new GLTFLoader()
    const draco = new DRACOLoader(); draco.setDecoderPath(BASE + 'draco/')
    this.loader.setDRACOLoader(draco)

    addEventListener('resize', () => this.resize())
    this._camAnim = null
    this.clock = new THREE.Clock()
    this.bodyHeight = 1.7
  }

  // ---------- sci-fi stage: background, grid floor, holo rings, particles, scanner ----------
  _initStage() {
    const bg = document.createElement('canvas'); bg.width = 16; bg.height = 512
    const g = bg.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512)
    gr.addColorStop(0, '#05070f'); gr.addColorStop(0.55, '#0b1330'); gr.addColorStop(1, '#070a18')
    g.fillStyle = gr; g.fillRect(0, 0, 16, 512)
    const bgt = new THREE.CanvasTexture(bg); bgt.colorSpace = THREE.SRGBColorSpace
    this.scene.background = bgt
    this.scene.fog = new THREE.FogExp2(0x070b1a, 0.06)

    this.stage = new THREE.Group()
    this.scene.add(this.stage)

    // Grid floor (shader): fine + coarse lines, radial fade, pulse ripple
    const floorMat = new THREE.ShaderMaterial({
      uniforms: { ...globalUniforms },
      transparent: true, depthWrite: false,
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform float uTime; varying vec3 vW;
        float gridLine(vec2 p, float s, float w){ vec2 g = abs(fract(p/s - 0.5) - 0.5) / fwidth(p/s); return 1.0 - min(min(g.x,g.y)/w, 1.0); }
        void main(){
          float r = length(vW.xz);
          float fine = gridLine(vW.xz, 0.1, 1.0) * 0.35;
          float coarse = gridLine(vW.xz, 0.5, 1.4) * 0.7;
          float fade = smoothstep(4.5, 0.2, r);
          float ripple = smoothstep(0.03, 0.0, abs(fract(r*0.6 - uTime*0.25) - 0.5) - 0.47) * 0.6;
          float disc = smoothstep(0.62, 0.58, r) * 0.18 + smoothstep(0.015, 0.0, abs(r - 0.6)) * 1.2 + smoothstep(0.01, 0.0, abs(r - 0.66)) * 0.6;
          vec3 c = vec3(0.22, 0.96, 0.9) * (fine + coarse + ripple*fade + disc) + vec3(0.72,0.4,1.0) * smoothstep(0.012,0.0,abs(r-0.75))*0.5;
          gl_FragColor = vec4(c, (fine*0.5 + coarse*0.55 + ripple*0.6 + disc) * fade * 0.45);
        }`,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.userData.noPick = true
    this.stage.add(floor)

    // Rotating hologram rings at the feet
    const ringMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    this.rings = []
    const mkRing = (r, w, c, o, y, segs = 128, arc = Math.PI * 2) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r, r + w, segs, 1, 0, arc), ringMat(c, o))
      m.rotation.x = -Math.PI / 2; m.position.y = y; this.stage.add(m); this.rings.push(m); return m
    }
    mkRing(0.5, 0.012, 0x38f5e6, 0.9, 0.004, 128, Math.PI * 1.4).userData.spin = 0.4
    mkRing(0.54, 0.006, 0xb967ff, 0.9, 0.006, 128, Math.PI * 0.8).userData.spin = -0.7
    mkRing(0.7, 0.02, 0x38f5e6, 0.35, 0.002, 6).userData.spin = 0.1

    // Soft light beam
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 2.3, 48, 1, true), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 2.0) * 0.035; gl_FragColor = vec4(0.22,0.96,0.9, a); }`,
    }))
    beam.position.y = 1.15
    this.stage.add(beam)

    // Floating particles
    const N = 600, pos = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.4 + Math.random() * 2.6
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 2.6; pos[i * 3 + 2] = Math.sin(a) * r; seed[i] = Math.random()
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
    this.particles = new THREE.Points(pg, new THREE.ShaderMaterial({
      uniforms: { ...globalUniforms }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uTime; attribute float seed; varying float vA;
        void main(){ vec3 p = position; p.y = mod(p.y + uTime*(0.03+seed*0.05), 2.6);
          vA = sin(uTime*(1.0+seed*2.0) + seed*40.0)*0.5+0.5; vec4 mv = modelViewMatrix*vec4(p,1.0);
          gl_PointSize = (1.5 + seed*3.0) * (3.0 / -mv.z); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d)*vA*0.8;
        gl_FragColor = vec4(mix(vec3(0.22,0.96,0.9), vec3(0.72,0.4,1.0), vA), a); }`,
    }))
    this.stage.add(this.particles)

    // Scanner ring that travels with the scan line
    this.scanRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.0025, 8, 160), ringMat(0x38f5e6, 0.9))
    this.scanRing.rotation.x = Math.PI / 2
    this.scanRing.scale.set(1, 0.55, 1)
    this.stage.add(this.scanRing)
  }

  _initComposer() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2())
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 })
    const c = this.composer = new EffectComposer(this.renderer, rt)
    c.addPass(new RenderPass(this.scene, this.camera))

    this.gtao = new GTAOPass(this.scene, this.camera, size.x, size.y)
    this.gtao.output = GTAOPass.OUTPUT.Default
    this.gtao.blendIntensity = 0.9
    this.gtao.updateGtaoMaterial({ radius: 0.06, distanceExponent: 1.4, thickness: 1.0, scale: 1.2, samples: 12 })
    this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 })
    // Leave transparent layers, the stage and particles out of the ambient-occlusion pass.
    const origHide = this.gtao._overrideVisibility.bind(this.gtao)
    this.gtao._overrideVisibility = () => {
      origHide()
      const cache = this.gtao._visibilityCache
      this.stage.visible && (this.stage.visible = false, cache.push(this.stage))
      for (const L of Object.values(this.layers)) {
        if (L.group?.visible && L.opacity < 0.999) { L.group.visible = false; cache.push(L.group) }
      }
    }
    c.addPass(this.gtao)

    this.outline = new OutlinePass(new THREE.Vector2(size.x, size.y), this.scene, this.camera)
    Object.assign(this.outline, { edgeStrength: 4, edgeGlow: 0.6, edgeThickness: 1.5, pulsePeriod: 2.2 })
    this.outline.visibleEdgeColor.set('#38f5e6')
    this.outline.hiddenEdgeColor.set('#1b5a66')
    c.addPass(this.outline)

    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.28, 0.35, 0.97)
    c.addPass(this.bloom)
    c.addPass(new OutputPass())
    this.smaa = new SMAAPass(size.x, size.y)
    c.addPass(this.smaa)
  }

  setQuality(q) {
    this.quality = q
    this.gtao.enabled = q === 'ultra'
    this.bloom.enabled = q !== 'performance'
    this.outline.enabled = q !== 'performance'
    globalUniforms.uDetail.value = q === 'performance' ? 0 : 1
    this.renderer.setPixelRatio(q === 'performance' ? 1 : Math.min(devicePixelRatio, 1.75))
    this.resize()
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
    const s = this.renderer.getDrawingBufferSize(new THREE.Vector2())
    this.composer?.setSize(innerWidth, innerHeight)
    this.composer?.setPixelRatio(this.renderer.getPixelRatio())
    this.gtao?.setSize(s.x, s.y)
  }

  // ---------- loading ----------
  async loadLayer(key, onProgress) {
    if (this.layers[key]?.loaded) return this.layers[key]
    if (this.layers[key]?.loading) return this.layers[key].loading
    const L = this.layers[key] || (this.layers[key] = { key, visible: false, opacity: 1, meshes: [] })
    L.loading = new Promise((resolve, reject) => {
      this.loader.load(BASE + `models/${key}.glb`, (gltf) => {
        const group = gltf.scene
        L.group = group
        L.materials = new Map()
        L.holo = makeHoloMaterial(HOLO_TINT[key], { flow: { arteries: 'artery', veins: 'vein', nerves: 'nerve' }[key] })
        group.traverse((o) => {
          if (!o.isMesh) return
          const ud = Object.keys(o.userData).length ? o.userData : o.parent?.userData || {}
          const name = ud.zname || o.name
          const mat = ud.zmat || ''
          const col = colorFor(key, mat, name)
          const tissue = tissueFor(key, mat, name)
          const flow = flowFor(key, mat)
          const mkey = col + '|' + tissue + '|' + mat + '|' + flow
          if (!L.materials.has(mkey)) {
            const m = makeTissueMaterial(col, tissue, { flow })
            if (tissue === 'fabric') { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2 }
            if (mat === 'Cornea') { m.transparent = true; m.opacity = 0.06; m.depthWrite = false; m.userData.fixedOpacity = true; m.roughness = 0.02; m.clearcoat = 1 }
            L.materials.set(mkey, m)
          }
          if (USES_FIBRE.has(tissue)) addFiberAttribute(o.geometry)
          o.material = L.materials.get(mkey)
          o.userData = { zname: name, zmat: mat, zgroup: ud.zgroup || '', layer: key, baseMat: o.material, tissue, color: col, flow }
          o.geometry.computeBoundsTree()
          L.meshes.push(o)
          if (!this.meshByName.has(name)) this.meshByName.set(name, [])
          this.meshByName.get(name).push(o)
        })
        if (key === 'skin') weldNormals(L.meshes.filter((m) => m.userData.tissue === 'skin'))
        this._collectLiveParts(L)
        group.visible = L.visible
        this.root.add(group)
        L.loaded = true
        L.failed = false
        // Frame on the skeleton, or on whichever layer arrives first if the skeleton failed to download.
        if (!this._framed) this._frameBody(group)
        this._applyOpacity(key)
        this._applyRenderMode(key)
        this._applyIsolation()
        this.dispatchEvent(new CustomEvent('layerloaded', { detail: { key, count: L.meshes.length } }))
        resolve(L)
      }, onProgress, (err) => {
        // Forget the failed attempt so turning the layer on again retries the download.
        L.loading = null
        L.failed = true
        this.dispatchEvent(new CustomEvent('layerfailed', { detail: { key, error: err } }))
        reject(err)
      })
    })
    return L.loading
  }

  // ---------- live body: beating heart, breathing lungs, pulse origins ----------
  _collectLiveParts(L) {
    const live = this._live || (this._live = { heart: [], lungs: [], heartCenter: null, lungCenters: {}, brainstem: null })
    const test = (m, re) => re.test(m.userData.zname) || re.test(m.userData.zgroup)
    const centerOf = (ms) => { const b = new THREE.Box3(); for (const m of ms) { m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox) } return b.getCenter(new THREE.Vector3()) }
    if (L.key === 'organs') {
      const heart = L.meshes.filter((m) => test(m, HEART_RE))
      if (heart.length) live.heartCenter = centerOf(heart)
      live.heart.push(...heart)
      for (const side of ['right', 'left']) {
        const lung = L.meshes.filter((m) => test(m, LUNG_RE) && new RegExp(side, 'i').test(m.userData.zname + m.userData.zgroup))
        if (lung.length) { live.lungCenters[side] = centerOf(lung); live.lungs.push(...lung.map((m) => [m, side])) }
      }
      const bs = L.meshes.filter((m) => test(m, BRAINSTEM_RE))
      if (bs.length) live.brainstem = centerOf(bs)
    }
    if (L.key === 'arteries' || L.key === 'veins') live.heart.push(...L.meshes.filter((m) => test(m, CORONARY_RE)))
  }

  setLive(on) { this.live = on }

  /** Cut a layer at a height (world y): 'above' keeps only what is above it, 'below' only what is below; null removes the cut.
   *  Used by the landing-page scan that peels the body layer by layer. */
  setLayerClip(key, mode, y = 0) {
    const L = this.layers[key]
    if (!L?.materials) return
    this.renderer.localClippingEnabled = true
    if (!L.clipPlane) { L.clipPlane = new THREE.Plane(); L.clipList = [L.clipPlane] }
    if (mode) { L.clipPlane.normal.set(0, mode === 'above' ? 1 : -1, 0); L.clipPlane.constant = mode === 'above' ? -y : y }
    const planes = mode ? L.clipList : null   // same array every frame, so materials only recompile when the cut turns on/off
    for (const m of [...L.materials.values(), L.holo]) if (m.clippingPlanes !== planes) { m.clippingPlanes = planes; m.needsUpdate = true }
  }

  _updateLive(dt, t) {
    const u = globalUniforms.uLive
    u.value += ((this.live ? 1 : 0) - u.value) * Math.min(1, dt * 4)
    const live = this._live
    if (!live) return
    // Pulse origins in world space (the model sits inside this.root, which is offset when the body is framed).
    const parent = this.root
    if (live.heartCenter) globalUniforms.uHeartPos.value.copy(live.heartCenter).applyMatrix4(parent.matrixWorld)
    if (live.brainstem) globalUniforms.uBrainPos.value.copy(live.brainstem).applyMatrix4(parent.matrixWorld)
    const k = u.value
    // Heartbeat "lub-dub": a strong contraction, then a smaller one, then rest.
    const ph = (t % BEAT) / BEAT
    const bump = (c, w) => Math.exp(-(((ph - c) / w) ** 2))
    const s = 1 - 0.045 * k * (bump(0.08, 0.06) + 0.55 * bump(0.3, 0.05))
    if (live.heartCenter) for (const m of live.heart) { m.scale.setScalar(s); m.position.copy(live.heartCenter).multiplyScalar(1 - s) }
    // Breathing: about 12 breaths a minute.
    const b = 1 + 0.028 * k * (0.5 - 0.5 * Math.cos((t / 5) * Math.PI * 2))
    for (const [m, side] of live.lungs) { const c = live.lungCenters[side]; m.scale.setScalar(b); m.position.copy(c).multiplyScalar(1 - b) }
  }

  _frameBody(group) {
    const box = new THREE.Box3().setFromObject(group)
    const c = box.getCenter(new THREE.Vector3())
    this.root.position.set(-c.x, -box.min.y, -c.z)
    this.bodyHeight = box.max.y - box.min.y
    this.homeTarget = new THREE.Vector3(0, this.bodyHeight * 0.5, 0)
    this.homePos = new THREE.Vector3(0, this.bodyHeight * 0.62, this.bodyHeight * 2.05)
    this.camera.position.copy(this.homePos)
    this.controls.target.copy(this.homeTarget)
    this.controls.minDistance = 0.12
    this.controls.maxDistance = this.bodyHeight * 4
    this.camera.near = 0.01
    this.camera.far = 60
    this.camera.updateProjectionMatrix()
    this._framed = true
  }

  resetView() { if (this.homePos) this._animateCamera(this.homePos, this.homeTarget) }

  /** Move the camera toward (factor < 1) or away from (factor > 1) what it is looking at. */
  zoom(factor) {
    const target = this.controls.target
    const offset = this.camera.position.clone().sub(target)
    const dist = THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance)
    this._animateCamera(target.clone().add(offset.setLength(dist)), target)
  }

  setVisible(key, v) {
    const L = this.layers[key] || (this.layers[key] = { key, visible: v, opacity: 1, meshes: [] })
    L.visible = v
    if (L.group) L.group.visible = v
    if (v && !L.loaded) this.loadLayer(key).catch(() => {})
    this._applyIsolation()
  }

  setOpacity(key, a) {
    const L = this.layers[key] || (this.layers[key] = { key, visible: false, opacity: a, meshes: [] })
    L.opacity = a
    this._applyOpacity(key)
  }

  _applyOpacity(key) {
    const L = this.layers[key]
    if (!L?.materials) return
    const a = L.opacity
    for (const m of L.materials.values()) {
      if (m.userData.fixedOpacity) continue
      m.opacity = a
      m.transparent = a < 0.999
      m.depthWrite = a > 0.6
    }
    L.holo.uniforms.uOpacity.value = Math.max(0.15, a)
    for (const mesh of L.meshes) mesh.renderOrder = a < 0.999 ? (key === 'skin' ? 10 : 5) : 0
  }

  setRenderMode(mode) {
    this.renderMode = mode
    for (const k of Object.keys(this.layers)) this._applyRenderMode(k)
    if (this.selected) this.select(this.selected.entry || this.selected.meshes[0], { focus: false, silent: true })
  }

  _applyRenderMode(key) {
    const L = this.layers[key]
    if (!L?.loaded) return
    const sel = new Set(this.selected?.meshes || [])
    for (const m of L.meshes) {
      if (sel.has(m)) continue
      if (this.renderMode === 'realistic') m.material = m.userData.baseMat
      else if (this.renderMode === 'hologram') m.material = L.holo
      else m.material = this._xray || (this._xray = makeHoloMaterial('#bfe3ff'))
    }
  }

  // ---------- picking ----------
  pick(clientX, clientY) {
    this.pointer.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const targets = []
    for (const L of Object.values(this.layers)) {
      if (!L.visible || !L.loaded || L.opacity < 0.25) continue
      for (const m of L.meshes) if (m.visible) targets.push(m)
    }
    return this.raycaster.intersectObjects(targets, false)[0]?.object || null
  }

  meshesForEntry(entry) {
    const out = []
    for (const n of entry.match || []) for (const m of this.meshByName.get(n) || []) if (m.userData.layer === entry.layer) out.push(m)
    return out
  }

  _highlightMat(m) {
    const ud = m.userData
    if (!ud.hlMat) {
      const hm = makeTissueMaterial(ud.color, ud.tissue, { flow: ud.flow })
      hm.emissive = new THREE.Color('#1fb5a8')
      hm.emissiveIntensity = 0.35
      ud.hlMat = hm
    }
    return ud.hlMat
  }

  select(target, { focus = false, silent = false } = {}) {
    this._clearHighlight()
    if (!target) {
      this.selected = null; this.isolated = false; this.outline.selectedObjects = this.hovered ? [this.hovered] : []
      this._applyIsolation()
      this.dispatchEvent(new CustomEvent('select', { detail: null })); return
    }
    let entry = null, meshes = [], objName = null
    if (target.isMesh) {
      objName = target.userData.zname
      entry = entryFor(objName, target.userData.layer)
      meshes = entry ? this.meshesForEntry(entry) : [target]
    } else {
      entry = target
      meshes = this.meshesForEntry(entry)
    }
    this.selected = { entry, meshes, objName, layer: entry?.layer || target.userData?.layer }
    for (const m of meshes) m.material = this._highlightMat(m)
    this.outline.selectedObjects = meshes.filter((m) => this.layers[m.userData.layer]?.visible)
    this._applyIsolation()
    if (focus && meshes.length) this.focusMeshes(meshes)
    if (!silent) this.dispatchEvent(new CustomEvent('select', { detail: this.selected }))
  }

  _clearHighlight() {
    if (!this.selected) return
    const ms = this.selected.meshes
    this.selected = null
    for (const k of new Set(ms.map((m) => m.userData.layer))) this._applyRenderMode(k)
  }

  setHover(mesh) {
    if (this.hovered === mesh) return
    this.hovered = mesh
    if (!this.selected) this.outline.selectedObjects = mesh ? [mesh] : []
  }

  toggleIsolate() { this.isolated = !this.isolated; this._applyIsolation(); return this.isolated }

  _applyIsolation() {
    const sel = new Set(this.selected?.meshes || [])
    // The eyes are exported into both the skin and organs layers; draw only the organs copy when both are on.
    const organsOn = this.layers.organs?.visible && this.layers.organs?.loaded
    for (const L of Object.values(this.layers)) for (const m of L.meshes || []) {
      const shadowed = organsOn && L.key === 'skin' && this.meshByName.get(m.userData.zname).some((x) => x.userData.layer === 'organs')
      m.visible = !shadowed && (!this.isolated || !sel.size || sel.has(m))
    }
    this._labelsDirty = true
  }

  focusMeshes(meshes) {
    const box = new THREE.Box3()
    for (const m of meshes) box.expandByObject(m)
    const c = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3()).length()
    const dir = this.camera.position.clone().sub(this.controls.target).normalize()
    const dist = Math.max(size * 1.8, 0.28)
    this._animateCamera(c.clone().add(dir.multiplyScalar(dist)), c)
  }

  _animateCamera(pos, target) {
    this._camAnim = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos.clone(), t1: target.clone(), t: 0 }
  }

  /** Resolves once the current camera move (if any) has finished. */
  cameraSettled() {
    if (!this._camAnim) return Promise.resolve()
    return new Promise((resolve) => (this._camWaiters ||= []).push(resolve))
  }

  screenPosOf(meshes) {
    const box = new THREE.Box3()
    for (const m of meshes) box.expandByObject(m)
    const v = box.getCenter(new THREE.Vector3()).project(this.camera)
    return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, onScreen: v.z < 1 }
  }

  // ---------- labels ----------
  setNameMode(mode) { this.nameMode = mode; this._labelsDirty = true }
  setShowLabels(v) { this.showLabels = v; this._labelsDirty = true; if (!v) this._clearLabels() }
  _clearLabels() { this.labelsEl.innerHTML = ''; this.labels = [] }

  _buildLabels() {
    this._clearLabels()
    if (!this.showLabels) return
    const seen = new Set()
    for (const L of Object.values(this.layers)) {
      if (!L.visible || !L.loaded || L.opacity < 0.25) continue
      for (const m of L.meshes) {
        const entry = entryFor(m.userData.zname, L.key)
        if (!entry || !m.visible) continue
        const side = sideOf(m.userData.zname)
        const k = entry.id + '|' + side + '|' + L.key
        if (seen.has(k)) continue
        seen.add(k)
        const ms = this.meshesForEntry(entry).filter((x) => sideOf(x.userData.zname) === side && x.userData.layer === L.key)
        if (!ms.length) continue
        const box = new THREE.Box3(); for (const x of ms) box.expandByObject(x)
        const el = document.createElement('div')
        el.className = 'label3d'
        el.style.setProperty('--dot', HOLO_TINT[L.key])
        el.textContent = displayName(ms[0].userData.zname, this.nameMode, false, L.key) + (side ? ` (${side[0].toUpperCase()})` : '')
        el.addEventListener('click', (ev) => { ev.stopPropagation(); this.select(entry, { focus: true }) })
        this.labelsEl.appendChild(el)
        this.labels.push({ el, pos: box.getCenter(new THREE.Vector3()), meshes: new Set(ms), size: box.getSize(new THREE.Vector3()).length() })
      }
    }
  }

  _updateLabels() {
    if (!this.showLabels) return
    if (this._labelsDirty) { this._buildLabels(); this._labelsDirty = false }
    const now = performance.now()
    const full = now - (this._lastLabelCull || 0) > 180
    if (full) this._lastLabelCull = now
    const placed = [], cand = [], v = new THREE.Vector3()
    for (const lb of this.labels) {
      v.copy(lb.pos).project(this.camera)
      const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight
      lb.sx = x; lb.sy = y
      lb.inView = v.z < 1 && x > 0 && x < innerWidth && y > 60 && y < innerHeight
      if (!lb.inView) { lb.el.style.opacity = 0; lb.el.style.pointerEvents = 'none'; continue }
      lb.el.style.transform = `translate(${x - 6}px, ${y - 10}px)`
      cand.push(lb)
    }
    if (!full) return
    const targets = []
    for (const L of Object.values(this.layers)) if (L.visible && L.loaded && L.opacity > 0.6) for (const m of L.meshes) if (m.visible) targets.push(m)
    const camPos = this.camera.position
    cand.sort((a, b) => b.size - a.size)
    for (const lb of cand) {
      this.raycaster.set(camPos, lb.pos.clone().sub(camPos).normalize())
      const hit = this.raycaster.intersectObjects(targets, false)[0]
      let ok = !hit || lb.meshes.has(hit.object) || hit.distance > lb.pos.distanceTo(camPos) - lb.size * 0.35
      if (ok) {
        const w = lb.el.offsetWidth || 90, h = 20
        for (const p of placed) if (Math.abs(p.x - lb.sx) < (p.w + w) / 2 + 4 && Math.abs(p.y - lb.sy) < h) { ok = false; break }
        if (ok) placed.push({ x: lb.sx, y: lb.sy, w })
      }
      lb.el.style.opacity = ok ? 1 : 0
      lb.el.style.pointerEvents = ok ? 'auto' : 'none'
    }
  }

  // ---------- loop ----------
  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = (globalUniforms.uTime.value += dt)
    if (this._camAnim) {
      const a = this._camAnim
      a.t = Math.min(1, a.t + dt / 0.9)
      const k = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2
      this.camera.position.lerpVectors(a.p0, a.p1, k)
      this.controls.target.lerpVectors(a.t0, a.t1, k)
      if (a.t >= 1) {
        this._camAnim = null
        for (const resolve of this._camWaiters?.splice(0) || []) resolve()
      }
    }
    // Scanner sweep: bottom -> top every 7 s, then pause.
    const cyc = (t % 9) / 7
    const sy = this.scanOverride != null ? this.scanOverride : this.scanner && cyc <= 1 ? cyc * (this.bodyHeight + 0.05) : -10
    globalUniforms.uScanY.value = sy
    this.scanRing.visible = sy > 0
    this.scanRing.position.y = sy
    for (const r of this.rings) r.rotation.z += (r.userData.spin || 0) * dt
    this._updateLive(dt, t)
    this.controls.update()
    if (this.quality === 'performance') this.renderer.render(this.scene, this.camera)
    else this.composer.render(dt)
    this._updateLabels()
  }
}
