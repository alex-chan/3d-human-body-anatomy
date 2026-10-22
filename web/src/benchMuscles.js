import * as THREE from 'three'

// Exercise-target emphasis, not measured EMG or a claim of zero activity elsewhere.
// Role reference: https://www.nasm.org/resource-center/exercise-library/barbell-bench-press
export function muscleRole(name) {
  if (/pectoralis major/i.test(name)) return 'primary'
  if (/triceps brachii|clavicular part of deltoid/i.test(name)) return 'assist'
  return 'neutral'
}

export function markBenchMuscles(anatomy, panel) {
  const materials = {
    primary: new THREE.MeshStandardMaterial({ color: '#961c38', roughness: .64 }),
    assist: new THREE.MeshStandardMaterial({ color: '#df8d87', roughness: .68 }),
    neutral: new THREE.MeshStandardMaterial({ color: '#e8ecef', roughness: .88 }),
  }
  const layer = anatomy.layers.muscles
  for (const mesh of layer.meshes) {
    const role = muscleRole(mesh.userData.zname)
    mesh.userData.pressRole = role
    mesh.material = materials[role]
    mesh.userData.baseMat = materials[role]
  }
  const legend = document.createElement('aside')
  legend.className = 'press-legend'
  legend.setAttribute('aria-label', '卧推肌肉作用图例')
  legend.innerHTML = `
    <h2>发力肌群 <span>按动作分工标色</span></h2>
    <div class="press-role-row"><i class="role-primary"></i><b>主发力</b><span>胸大肌</span></div>
    <div class="press-role-row"><i class="role-assist"></i><b>辅助发力</b><span>三角肌前束、肱三头肌</span></div>
    <div class="press-role-row"><i class="role-neutral"></i><b>其他部位</b><span>白模 · 未重点标记</span></div>
    <p>颜色表示作用分工，不代表实测强度。<br>白色部位仍可能参与稳定。</p>
    <a href="https://www.nasm.org/resource-center/exercise-library/barbell-bench-press" target="_blank" rel="noopener noreferrer">肌肉作用参考：NASM ↗</a>`
  panel.append(legend)
  const overlay = document.createElement('div')
  overlay.className = 'press-muscle-labels'
  overlay.innerHTML = '<svg aria-hidden="true"></svg>'
  panel.append(overlay)
  const svg = overlay.querySelector('svg')
  const specs = [
    { name: '胸大肌', role: '主发力', type: 'primary', match: /Sternocostal head of pectoralis major muscle\.l$/, dx: -130, dy: -25 },
    { name: '三角肌前束', role: '辅助', type: 'assist', match: /Clavicular part of deltoid muscle\.l$/, dx: 55, dy: -65 },
    { name: '肱三头肌', role: '辅助', type: 'assist', match: /Lateral head of triceps brachii\.l$/, dx: 70, dy: 28 },
  ]
  const point = new THREE.Vector3()
  const markers = specs.map(spec => {
    const mesh = layer.meshes.find(m => spec.match.test(m.userData.zname))
    if (!mesh) return null
    // Pick a real skinned vertex nearest the mesh centre. Labels follow the same
    // GPU skeleton using Three's CPU skin transform, including elbow rotation.
    const pos = mesh.geometry.attributes.position
    const center = mesh.geometry.boundingBox.getCenter(new THREE.Vector3())
    let index = 0, best = Infinity
    for (let i = 0; i < pos.count; i++) {
      point.fromBufferAttribute(pos, i)
      const distance = point.distanceToSquared(center)
      if (distance < best) { best = distance; index = i }
    }
    const badge = document.createElement('div')
    badge.className = `press-muscle-tag ${spec.type}`
    badge.innerHTML = `<b>${spec.name}</b><span>${spec.role}</span>`
    overlay.append(badge)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('class', spec.type)
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    dot.setAttribute('r', '3'); dot.setAttribute('class', spec.type)
    svg.append(line, dot)
    return { ...spec, mesh, index, badge, line, dot }
  }).filter(Boolean)
  const clamp = THREE.MathUtils.clamp
  return {
    setVisible(visible) { overlay.hidden = !visible; legend.hidden = !visible },
    update() {
      if (overlay.hidden) return
      anatomy.root.updateMatrixWorld(true)
      const rects = [], width = innerWidth, height = innerHeight
      const mobile = width <= 800
      for (const marker of markers) {
        marker.mesh.getVertexPosition(marker.index, point)
        point.applyMatrix4(marker.mesh.matrixWorld).project(anatomy.camera)
        const x = (point.x * .5 + .5) * width, y = (-point.y * .5 + .5) * height
        const visible = point.z > -1 && point.z < 1 && x >= 0 && x <= width && y >= 0 && y <= height
        marker.badge.hidden = !visible
        marker.line.style.display = marker.dot.style.display = visible ? '' : 'none'
        if (!visible) continue
        const w = mobile ? 100 : 120, h = 43
        let bx = clamp(x + marker.dx - w / 2, 12, width - w - 12)
        let by = clamp(y + marker.dy - h / 2, mobile ? 285 : 120, height - 170)
        for (const rect of rects) {
          if (bx < rect.x + w + 8 && bx + w + 8 > rect.x && by < rect.y + h + 8 && by + h + 8 > rect.y) by = rect.y + h + 8
        }
        rects.push({ x: bx, y: by })
        marker.badge.style.transform = `translate(${bx}px, ${by}px)`
        const endX = clamp(x, bx + 8, bx + w - 8), endY = clamp(y, by + 5, by + h - 5)
        marker.line.setAttribute('x1', x); marker.line.setAttribute('y1', y)
        marker.line.setAttribute('x2', endX); marker.line.setAttribute('y2', endY)
        marker.dot.setAttribute('cx', x); marker.dot.setAttribute('cy', y)
      }
    },
  }
}
