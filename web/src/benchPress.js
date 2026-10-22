import { localizedExercise, guideFor, browserLocale } from './localization.js'
import * as THREE from 'three'
import './benchPress.css'
import { markBenchMuscles } from './benchMuscles.js'
import { addBenchInstructions } from './benchInstructions.js'

const V = (x, y, z) => new THREE.Vector3(x, y, z)
const smooth = (a, b, v) => THREE.MathUtils.smoothstep(v, a, b)

// These landmarks are measured in the GLBs' baked, metre-scale coordinates.
// All layers share the same bind skeleton, so muscle and bone views stay aligned.
export function createRig(anatomy) {
  const bones = [], joints = {}
  const add = (key, position) => {
    const bone = new THREE.Bone()
    bone.name = key; bone.position.copy(position)
    anatomy.root.add(bone)
    joints[key] = { bone, rest: position.clone(), index: bones.length }
    bones.push(bone)
  }
  add('torso', V(0, 0, 0))
  add('head', V(0, 1.47, -.025))
  for (const s of [-1, 1]) {
    add(`arm${s}`, V(s * .17, 1.385, -.03))
    add(`forearm${s}`, V(s * .225, 1.10, -.025))
    add(`hand${s}`, V(s * .272, .856, .005))
    add(`fingers${s}`, V(s * .289, .766, .02))
    add(`tips${s}`, V(s * .295, .716, .022))
    add(`thigh${s}`, V(s * .08, .85, -.03))
    add(`shin${s}`, V(s * .085, .43, -.025))
    add(`foot${s}`, V(s * .075, .075, -.035))
  }
  // Capture bind matrices before lying the root down or posing any joint.
  anatomy.root.position.set(0, 0, 0)
  anatomy.root.updateMatrixWorld(true)
  const skeleton = new THREE.Skeleton(bones)
  const isArm = /brachii|brachialis|coracobrachialis|deltoid|anconeus|forearm|carpi|digitorum|pollicis|indicis|digiti minimi|palmar|pronator|supinator|brachioradialis|humerus|radius|ulna|carpal|metacarpal|pisiform|scaphoid|lunate|triquetr|trapezium|trapezoid|capitate|hamate/i
  const isLeg = /gluteus|tensor fasciae|iliotibial|femoris|vastus|sartorius|gracilis|adductor|semitendin|semimembran|pectineus|tibialis|fibular|gastrocnem|soleus|plantaris|popliteus|hallucis|digitorum|foot|femur|patella|tibia|fibula|tarsal|metatarsal|calcaneus|calcaneal|talus|navicular|cuneiform|cuboid|toe/i
  for (const key of ['muscles', 'skeleton']) {
    const layer = anatomy.layers[key]
    layer.meshes = layer.meshes.map(mesh => {
      const geo = mesh.geometry, pos = geo.attributes.position
      const indices = new Uint16Array(pos.count * 4), weights = new Float32Array(pos.count * 4)
      geo.computeBoundingBox()
      const center = geo.boundingBox.getCenter(V(0, 0, 0))
      const name = mesh.userData.zname + ' ' + mesh.userData.zgroup
      const arm = center.y > .60 && (isArm.test(name) || /phalanx|lumbrical|interosse/i.test(name) && center.y > .60)
      const leg = center.y < .95 && (isLeg.test(name) || /phalanx|lumbrical|interosse/i.test(name))
      const chest = /pectoralis major|latissimus|teres major|teres minor|infraspinatus|supraspinatus|subscapularis/i.test(name)
      // Rigid bones do not stretch; soft tissues blend across the joint zones.
      const rigid = key === 'skeleton'
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), s = center.x < 0 ? -1 : 1
        let pairs = [['torso', 1]]
        if (y > 1.44 && center.y > 1.43) {
          const w = smooth(1.44, 1.51, y)
          pairs = [['torso', 1 - w], ['head', w]]
        } else if (arm) {
          if (rigid) {
            const segment = /humerus/i.test(name) ? 'arm' : /radius|ulna/i.test(name) ? 'forearm' : /phalanx/i.test(name) ? (center.y < .716 ? 'tips' : 'fingers') : 'hand'
            pairs = [[segment + s, 1]]
          } else if (y > 1.32) {
            const w = smooth(.10, .205, Math.abs(x))
            pairs = [['torso', 1 - w], ['arm' + s, w]]
          } else if (y > .92) {
            const w = 1 - smooth(1.06, 1.135, y)
            pairs = [['arm' + s, 1 - w], ['forearm' + s, w]]
          } else if (y > .79) {
            const w = 1 - smooth(.825, .89, y)
            pairs = [['forearm' + s, 1 - w], ['hand' + s, w]]
          } else if (/pollicis|thumb/i.test(name)) {
            pairs = [['hand' + s, 1]]
          } else if (y > .73) {
            const w = 1 - smooth(.748, .785, y)
            pairs = [['hand' + s, 1 - w], ['fingers' + s, w]]
          } else {
            const w = 1 - smooth(.70, .735, y)
            pairs = [['fingers' + s, 1 - w], ['tips' + s, w]]
          }
        } else if (leg) {
          if (rigid) {
            pairs = [[(/femur|patella/i.test(name) ? 'thigh' : /tibia|fibula/i.test(name) ? 'shin' : 'foot') + s, 1]]
          } else if (y > .72) {
            const w = 1 - smooth(.79, .93, y)
            pairs = [['torso', 1 - w], ['thigh' + s, w]]
          } else if (y > .15) {
            const w = 1 - smooth(.40, .47, y)
            pairs = [['thigh' + s, 1 - w], ['shin' + s, w]]
          } else {
            const w = 1 - smooth(.065, .13, y)
            pairs = [['shin' + s, 1 - w], ['foot' + s, w]]
          }
        } else if (chest) {
          const w = smooth(.105, .21, Math.abs(x)) * .85
          pairs = [['torso', 1 - w], ['arm' + s, w]]
        }
        pairs.forEach(([joint, weight], j) => { indices[i * 4 + j] = joints[joint].index; weights[i * 4 + j] = weight })
      }
      geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4))
      geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4))
      const skinned = new THREE.SkinnedMesh(geo, mesh.material)
      skinned.name = mesh.name; skinned.userData = mesh.userData
      skinned.frustumCulled = false
      // Bind identity: geometry positions already use the common model coordinates.
      skinned.bind(skeleton, new THREE.Matrix4())
      mesh.parent.add(skinned); mesh.removeFromParent()
      return skinned
    })
  }
  anatomy.root.rotation.x = -Math.PI / 2
  anatomy.root.position.set(0, .57, 1.20)
  const direction = (a, b) => b.clone().sub(a).normalize()
  function aim(key, endKey, start, end) {
    const joint = joints[key]
    joint.bone.position.copy(start)
    joint.bone.quaternion.setFromUnitVectors(direction(joint.rest, joints[endKey].rest), direction(start, end))
  }
  const handRestDir = V(.02, -.09, .015).normalize()
  function pose(extension) {
    const barHeight = THREE.MathUtils.lerp(.75, 1.10, extension)
    const barZ = THREE.MathUtils.lerp(-.07, -.19, extension)
    for (const s of [-1, 1]) {
      const shoulder = joints[`arm${s}`].rest
      const wrist = V(s * .31, 1.20 - barZ, barHeight - .57 - .060)
      const delta = wrist.clone().sub(shoulder), distance = delta.length(), axis = delta.normalize()
      const upper = joints[`arm${s}`].rest.distanceTo(joints[`forearm${s}`].rest)
      const lower = joints[`forearm${s}`].rest.distanceTo(joints[`hand${s}`].rest)
      const along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance)
      const pole = V(s * .65, 1.02, -.06).sub(shoulder)
      pole.addScaledVector(axis, -pole.dot(axis)).normalize()
      const elbow = shoulder.clone().addScaledVector(axis, along).addScaledVector(pole, Math.sqrt(Math.max(0, upper ** 2 - along ** 2)))
      aim(`arm${s}`, `forearm${s}`, shoulder, elbow)
      aim(`forearm${s}`, `hand${s}`, elbow, wrist)
      const hand = joints[`hand${s}`].bone
      hand.position.copy(wrist)
      hand.quaternion.setFromUnitVectors(V(s * handRestDir.x, handRestDir.y, handRestDir.z), V(0, 0, 1))
      const finger = joints[`fingers${s}`], tip = joints[`tips${s}`]
      const curl = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -1.45)
      finger.bone.position.copy(finger.rest).sub(joints[`hand${s}`].rest).applyQuaternion(hand.quaternion).add(wrist)
      finger.bone.quaternion.copy(hand.quaternion).multiply(curl)
      tip.bone.position.copy(tip.rest).sub(finger.rest).applyQuaternion(finger.bone.quaternion).add(finger.bone.position)
      tip.bone.quaternion.copy(finger.bone.quaternion).multiply(curl)
      const hip = joints[`thigh${s}`].rest
      const knee = V(s * .18, .445, -.08)
      const ankle = V(s * .23, .45, -.432)
      aim(`thigh${s}`, `shin${s}`, hip, knee)
      aim(`shin${s}`, `foot${s}`, knee, ankle)
      joints[`foot${s}`].bone.position.copy(ankle)
      joints[`foot${s}`].bone.quaternion.setFromAxisAngle(V(1, 0, 0), 1.40)
    }
    return { barHeight, barZ }
  }
  return { pose, joints, aim }
}

function equipment(scene) {
  const group = new THREE.Group(); scene.add(group)
  const steel = new THREE.MeshStandardMaterial({ color: '#9caebc', metalness: .9, roughness: .23 })
  const frame = new THREE.MeshStandardMaterial({ color: '#25303b', metalness: .75, roughness: .35 })
  const pad = new THREE.MeshStandardMaterial({ color: '#152a33', roughness: .82 })
  const rubber = new THREE.MeshStandardMaterial({ color: '#19242d', roughness: .65, metalness: .2 })
  const accent = new THREE.MeshStandardMaterial({ color: '#37e5c8', metalness: .45, roughness: .3 })
  function box(w, h, d, x, y, z, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z); group.add(m); return m
  }
  box(.32, .075, 1.28, 0, .435, -.08, pad)
  box(.13, .055, 1.17, 0, .35, -.08, frame)
  for (const z of [-.50, .40]) {
    box(.075, .32, .075, 0, .18, z, frame)
    box(.60, .045, .16, 0, .025, z, frame)
    for (const s of [-1, 1]) box(.055, .015, .16, s * .27, .054, z, accent)
  }
  // Uprights sit behind the head and outside the athlete's shoulder path.
  for (const s of [-1, 1]) {
    box(.065, 1.22, .065, s * .70, .61, -.54, frame)
    box(.22, .045, .65, s * .70, .027, -.40, frame)
    box(.10, .045, .18, s * .70, 1.04, -.49, accent)
  }
  box(1.4, .055, .055, 0, .12, -.54, frame)
  const bar = new THREE.Group(); group.add(bar)
  function cylinder(radius, length, x, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 48), mat)
    m.rotation.z = Math.PI / 2; m.position.x = x; bar.add(m)
  }
  cylinder(.014, 1.92, 0, steel)
  for (const s of [-1, 1]) {
    cylinder(.024, .37, s * .77, steel)
    cylinder(.175, .052, s * .66, rubber)
    cylinder(.145, .04, s * .715, rubber)
    cylinder(.046, .026, s * .76, accent)
    cylinder(.04, .018, s * .59, steel)
    // Two grip markers make the wrist/bar relationship readable.
    cylinder(.0148, .10, s * .31, accent)
    for (const x of [.645, .675]) cylinder(.176, .003, s * x, frame)
  }
  return bar
}

export function startBenchPress(anatomy) {
  document.body.classList.add('bench-mode')
  anatomy.live = false; anatomy.scanner = false; anatomy.scanOverride = -10
  anatomy.controls.autoRotate = false
  anatomy.setQuality('high')
  anatomy.stage.visible = false
  anatomy.scene.fog = null
  anatomy.scene.background = new THREE.Color('#090f18')
  anatomy.scene.environmentIntensity = .5
  anatomy.bloom.enabled = false
  anatomy.scene.children.filter(o => o.isDirectionalLight).forEach(o => { o.intensity *= .4 })
  anatomy.renderer.shadowMap.enabled = true
  anatomy.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  anatomy.renderer.toneMappingExposure = .95
  for (const key of Object.keys(anatomy.layers)) anatomy.setVisible(key, key === 'muscles')
  const rig = createRig(anatomy), bar = equipment(anatomy.scene)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#111c28', roughness: .9 }))
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.012; anatomy.scene.add(floor)
  const grid = new THREE.GridHelper(8, 40, '#293c4c', '#172633'); grid.position.y = -.01; anatomy.scene.add(grid)
  const light = new THREE.DirectionalLight('#fff2de', 2.2); light.position.set(1, 4, 2); anatomy.scene.add(light)
  light.castShadow = true; light.shadow.mapSize.set(2048, 2048)
  Object.assign(light.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: .1, far: 10 })
  light.shadow.bias = -.0002; light.shadow.normalBias = .012
  anatomy.scene.traverse(o => { if (o.isMesh) { o.castShadow = o !== floor; o.receiveShadow = true } })
  anatomy.homeTarget = V(0, .57, .10)
  const views = { perspective: V(2.8, 2.05, 2.8), side: V(3.6, 1.1, .12), head: V(.06, 1.6, -3.7) }
  anatomy.homePos = views.perspective.clone()
  anatomy.camera.clearViewOffset()
  const view = name => {
    anatomy._camAnim = null
    const distanceFactor = Math.max(1, .95 / anatomy.camera.aspect)
    anatomy.camera.position.copy(anatomy.homeTarget).add(views[name].clone().sub(anatomy.homeTarget).multiplyScalar(distanceFactor)); anatomy.controls.target.copy(anatomy.homeTarget)
    anatomy.controls.update()
  }
  anatomy.controls.minDistance = 1.5; anatomy.controls.maxDistance = 7
  view('perspective')
  const panel = document.createElement('section')
  panel.className = 'bench-ui'
  panel.innerHTML = `
    <header class="bench-heading"><a href="./" class="bench-back">← 全部动作</a><span class="bench-kicker">MOVEMENT LAB / 01</span><h1>仰卧杠铃胸推</h1><p>BARBELL BENCH PRESS</p></header>
    <aside class="bench-readout"><span class="bench-status">循环演示中</span><strong id="press-phase">下放</strong><div class="press-meter"><i></i></div><label class="press-scrub-label">动作进度<input id="press-scrub" type="range" aria-label="动作进度" min="0" max="5" step="0.01" value="0"></label><p id="press-phase-cue" class="press-phase-cue"></p><small>点击「动作说明」查看完整要领</small></aside>
    <nav class="bench-toolbar" aria-label="卧推动画控制">
      <button id="press-play">暂停</button><button id="press-reset">重新开始</button>
      <label>速度 <select id="press-speed" aria-label="动作速度"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></label>
      <span class="bench-divider"></span><button data-press-view="perspective" class="active">斜侧视角</button><button data-press-view="side">侧面</button><button data-press-view="head">头侧</button>
      <span class="bench-divider"></span><button id="press-layer">查看骨骼</button>
    </nav><p class="bench-hint">拖动旋转 · 滚轮缩放 <span>／</span> 动作示意 · 未模拟真实负重和软组织力学</p>`
  const locale=browserLocale()
  if(locale!=='zh')panel.querySelector('h1').textContent=localizedExercise({id:'bench',muscles:[],equipment:[]},locale).title
  document.body.append(panel)
  const muscleMarks = markBenchMuscles(anatomy, panel)
  const instructions = addBenchInstructions(panel)
  const preview = new URLSearchParams(location.search).has('preview')
  if (preview) panel.style.display = 'none'
  let playing = !preview, speed = 1, elapsed = preview ? 3.7 : 0, boneView = false
  const phaseEl = panel.querySelector('#press-phase'), fill = panel.querySelector('.press-meter i'), play = panel.querySelector('#press-play')
  play.onclick = () => { playing = !playing; play.textContent = playing ? '暂停' : '播放'; panel.querySelector('.bench-status').textContent = playing ? '循环演示中' : '已暂停' }
  const scrub = panel.querySelector('#press-scrub')
  scrub.oninput = () => { elapsed = +scrub.value; playing = false; play.textContent = '播放'; panel.querySelector('.bench-status').textContent = '已暂停'; poseFrame() }
  panel.querySelector('#press-speed').onchange = e => { speed = +e.target.value }
  panel.querySelector('#press-reset').onclick = () => { elapsed = 0; poseFrame() }
  panel.querySelectorAll('[data-press-view]').forEach(b => { b.onclick = () => { view(b.dataset.pressView); panel.querySelectorAll('[data-press-view]').forEach(x => x.classList.toggle('active', x === b)) } })
  panel.querySelector('#press-layer').onclick = e => {
    boneView = !boneView
    anatomy.setVisible('muscles', !boneView); anatomy.setVisible('skeleton', boneView)
    e.target.textContent = boneView ? '查看肌肉' : '查看骨骼'
    muscleMarks.setVisible(!boneView)
  }
  function poseFrame() {
    const time = elapsed % 5
    let extension, phase
    if (time < 2.4) { extension = 1 - smooth(0, 2.4, time); phase = '下放' }
    else if (time < 2.9) { extension = 0; phase = '底部停顿' }
    else if (time < 4.5) { extension = smooth(2.9, 4.5, time); phase = '推起' }
    else { extension = 1; phase = '顶部停顿' }
    const state = rig.pose(extension)
    bar.position.set(0, state.barHeight, state.barZ)
    scrub.value = time
    instructions.update(phase)
    phaseEl.textContent = locale==='zh'?phase:guideFor('bench',locale).phases[['下放','底部停顿','推起','顶部停顿'].indexOf(phase)]; fill.style.width = `${extension * 100}%`
    panel.dataset.extension = extension.toFixed(3)
  }
  poseFrame()
  // Run before Anatomy.update renders, using wall time so cadence is frame-rate independent.
  let last = performance.now()
  anatomy.updateExercise = () => {
    const now = performance.now(), dt = Math.min((now - last) / 1000, .1); last = now
    if (playing && !document.hidden) elapsed += dt * speed
    poseFrame()
  }
  anatomy.updateExerciseLabels = () => muscleMarks.update()
  document.body.dataset.exerciseReady = 'bench'
}
