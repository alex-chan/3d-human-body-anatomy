import { poseExpansion, createExpansionEquipment } from './expansionMotion.js'
import { localizedConfig, browserLocale } from './localization.js'
import { createMachineEquipment } from './machineEquipment.js'
import { poseMachine } from './machineMotion.js'
import * as THREE from 'three'
import { createRig } from './benchPress.js'
import { COMMON } from './commonExercises.js'
import { V, solveJoint, standingState } from './standingPose.js'
import './standingExercises.css'
import { EXTRA } from './extraExercises.js'
import { poseExpanded } from './expandedPose.js'

export function startStandingExercise(anatomy,id) {
  const cfg=localizedConfig(COMMON[id],id,browserLocale()), rig=createRig(anatomy), root=anatomy.root, joints=rig.joints
  anatomy.live=false; anatomy.scanner=false; anatomy.scanOverride=-10;anatomy.controls.autoRotate=false
  anatomy.stage.visible=false;anatomy.setQuality('high');anatomy.bloom.enabled=false;anatomy.scene.fog=null
  anatomy.scene.background=new THREE.Color('#0b1520');anatomy.scene.environmentIntensity=.5
  anatomy.scene.children.filter(o=>o.isDirectionalLight).forEach(o=>o.intensity*=.5)
  const key=new THREE.DirectionalLight('#ffefde',2);key.position.set(1,4,3);anatomy.scene.add(key)
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:'#152330',roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.008;anatomy.scene.add(floor,new THREE.GridHelper(6,30,'#314958','#1d303d'))
  for(const layer of Object.keys(anatomy.layers))anatomy.setVisible(layer,layer==='muscles')
  const mats={primary:new THREE.MeshStandardMaterial({color:'#961c38',roughness:.65}),assist:new THREE.MeshStandardMaterial({color:'#df8d87',roughness:.7}),neutral:new THREE.MeshStandardMaterial({color:'#e8ecef',roughness:.88})}
  for(const mesh of anatomy.layers.muscles.meshes){const n=mesh.userData.zname;const role=cfg.primary.test(n)?'primary':cfg.assist.test(n)?'assist':'neutral';mesh.material=mats[role];mesh.userData.baseMat=mesh.material}
  const bar=new THREE.Group();anatomy.scene.add(bar)
  const steel=new THREE.MeshStandardMaterial({color:'#acbbc4',metalness:.9,roughness:.28}),rubber=new THREE.MeshStandardMaterial({color:'#1b2a37',roughness:.7}),mint=new THREE.MeshStandardMaterial({color:'#72d4bd',metalness:.3,roughness:.5})
  const cylinder=(r,len,x,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,40),mat);m.rotation.z=Math.PI/2;m.position.x=x;bar.add(m)}
  cylinder(.014,1.8,0,steel)
  for(const side of[-1,1]){cylinder(.024,.30,side*.74,steel);cylinder(id==='curl'?.115:.215,.05,side*.65,rubber);cylinder(.045,.025,side*.70,mint)}
  const dumbbells=[]
  if(cfg.prop==='none'||cfg.prop==='dumbbells'||cfg.machine)bar.visible=false
  if(cfg.prop==='dumbbells')for(let i=0;i<2;i++){
    const db=new THREE.Group();anatomy.scene.add(db);dumbbells.push(db)
    const part=(radius,length,x,material)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,20),material);m.rotation.z=Math.PI/2;m.position.x=x;db.add(m)}
    part(.014,.24,0,steel);for(const side of[-1,1]){part(.062,.055,side*.095,rubber);part(.025,.015,side*.13,mint)}
  }
  createExpansionEquipment(anatomy.scene,cfg.support)
  const machine=cfg.machine?createMachineEquipment(anatomy.scene,id):null
  if(cfg.floor){const mat=new THREE.Mesh(new THREE.BoxGeometry(1.1,.015,2.1),new THREE.MeshStandardMaterial({color:'#1b3c45',roughness:.95}));mat.position.set(0,.005,0);anatomy.scene.add(mat)}
  const views={perspective:V(2.6,1.65,3),side:V(3.4,1.15,.1),back:V(-2.1,1.7,-3)}
  anatomy.homeTarget=cfg.floor?V(0,.30,0):V(0,.95,.05);anatomy.controls.minDistance=1.25;anatomy.controls.maxDistance=7;anatomy._camAnim=null;anatomy.camera.clearViewOffset()
  const view=name=>{anatomy.camera.position.copy(anatomy.homeTarget).add(views[name].clone().sub(anatomy.homeTarget).multiplyScalar(1.18*(cfg.cameraScale||1)*Math.max(1,.85/anatomy.camera.aspect)));anatomy.controls.target.copy(anatomy.homeTarget);anatomy.controls.update()};view(cfg.initialView||(id==='row'?'back':'perspective'));anatomy.homePos=anatomy.camera.position.clone()
  const panel=document.createElement('section');panel.className='standing-ui bench-ui'
  panel.innerHTML=`<header class="bench-heading"><a href="./" class="bench-back">← 全部动作</a><span class="bench-kicker">MOVEMENT LAB</span><h1>${cfg.title}</h1><p>${cfg.english}</p></header>
    <aside class="press-legend"><h2>发力肌群 <span>按动作分工标色</span></h2><div class="press-role-row"><i class="role-primary"></i><b>主发力</b><span>${cfg.primaryText}</span></div><div class="press-role-row"><i class="role-assist"></i><b>辅助／稳定</b><span>${cfg.assistText}</span></div><div class="press-role-row"><i class="role-neutral"></i><b>其他部位</b><span>白模 · 未重点标记</span></div><p>颜色不是实测发力强度；白色部位也可能参与稳定。</p></aside>
    <aside class="bench-readout"><span class="bench-status">${cfg.isometric?'静态保持 · 提示轮换':'循环演示中'}</span><strong id="common-phase"></strong><div class="press-meter"><i></i></div><label class="press-scrub-label">动作进度<input id="common-scrub" type="range" min="0" max="5" step=".01" value="0" aria-label="动作进度"></label><p id="common-cue"></p></aside>
    <nav class="bench-toolbar" aria-label="动作控制"><button id="common-play">暂停</button><button id="common-reset">重新开始</button><label>速度 <select aria-label="动作速度"><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></label><button data-common-view="perspective">斜侧</button><button data-common-view="side">侧面</button><button data-common-view="back">背面</button><button id="common-layer">查看骨骼</button></nav><p class="bench-hint">拖动旋转 · 滚轮缩放 ／ 程序化动作示意，未模拟真实负重和软组织力学</p>
    <button class="press-instructions-toggle" aria-expanded="false" aria-controls="common-instructions">动作说明</button><aside class="press-instructions" id="common-instructions" aria-label="动作说明面板" hidden><div class="press-instructions-head"><div><span>HOW TO / 动作要领</span><h2>${cfg.title}</h2></div><button aria-label="关闭动作说明">×</button></div><ol class="press-steps"><li><span class="press-step-number">01</span><div><h3>准备姿势</h3><p>${cfg.setup}</p></div></li>${cfg.phases.map((p,i)=>`<li data-phase="${i}"><span class="press-step-number">0${i+2}</span><div><h3>${p}</h3><p>${cfg.cues[i]}</p></div></li>`).join('')}</ol><section class="press-errors"><h3>常见错误</h3><p>${cfg.errors}</p></section><p class="press-instructions-note">${cfg.isometric?'这是静态支撑演示，时间循环仅用于轮换提示，不是训练时长建议。':'演示中的停顿用于观察动作，可拖动进度逐步查看。'}</p><a class="press-instructions-source" href="${cfg.source}" target="_blank" rel="noopener noreferrer">动作参考资料 ↗</a></aside>`
  document.body.append(panel)
  const preview=new URLSearchParams(location.search).has('preview')
  if(preview)panel.style.display='none'
  let playing=!preview,elapsed=preview?(cfg.previewTime??(cfg.prop==='dumbbells'||id==='bridge'||id==='calf-raise'||id==='curl'||id==='press'||id==='row'?4.7:2.4)):0,speed=1,boneView=false
  const play=panel.querySelector('#common-play'),scrub=panel.querySelector('#common-scrub'),drawer=panel.querySelector('#common-instructions'),toggle=panel.querySelector('.press-instructions-toggle')
  const open=v=>{drawer.hidden=!v;toggle.setAttribute('aria-expanded',String(v))};toggle.onclick=()=>open(drawer.hidden);drawer.querySelector('button').onclick=()=>open(false)
  panel.addEventListener('keydown',e=>{if(e.key==='Escape')open(false)})
  const setPlay=v=>{playing=v;play.textContent=v?'暂停':'播放';panel.querySelector('.bench-status').textContent=v?(cfg.isometric?'静态保持 · 提示轮换':'循环演示中'):'已暂停'}
  play.onclick=()=>setPlay(!playing);scrub.oninput=()=>{elapsed=+scrub.value;setPlay(false);pose()};panel.querySelector('#common-reset').onclick=()=>{elapsed=0;pose()};panel.querySelector('select').onchange=e=>speed=+e.target.value
  panel.querySelectorAll('[data-common-view]').forEach(b=>b.onclick=()=>view(b.dataset.commonView))
  panel.querySelector('#common-layer').onclick=e=>{boneView=!boneView;anatomy.setVisible('muscles',!boneView);anatomy.setVisible('skeleton',boneView);e.target.textContent=boneView?'查看肌肉':'查看骨骼';panel.querySelector('.press-legend').hidden=boneView}
  const inverse=new THREE.Matrix4(),restHip=V(0,.85,-.03),curlQ=new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-1.4)
  function pose(){
    const t=elapsed%5;let k,phase
    if(t<2.2){k=THREE.MathUtils.smoothstep(t,0,2.2);phase=0}else if(t<2.6){k=1;phase=1}else if(t<4.5){k=1-THREE.MathUtils.smoothstep(t,2.6,4.5);phase=2}else{k=0;phase=3}
    if(cfg.machine){poseMachine(rig,root,id,k,machine)}else if(cfg.expansion){poseExpansion(rig,root,id,cfg.isometric?0:k,dumbbells)}else if(EXTRA[id]){poseExpanded(rig,root,id,cfg.isometric?0:k,dumbbells)}else{
    const motion=cfg.standingMotion||id;const state=standingState(motion,k);root.rotation.set(state.tilt,0,0);root.position.copy(state.hip).sub(restHip.clone().applyEuler(root.rotation));root.updateMatrixWorld(true);inverse.copy(root.matrixWorld).invert()
    if(state.localBar)state.bar.copy(state.localBar).applyMatrix4(root.matrixWorld)
    if(['deadlift','barbell-rdl','sumo-deadlift'].includes(motion)){const shoulderWorld=V(.17,1.385,-.03).applyMatrix4(root.matrixWorld);const dz=state.bar.z-shoulderWorld.z;state.bar.y=shoulderWorld.y-Math.sqrt(Math.max(.01,.535**2-(state.grip-.17)**2-dz**2))-.065}
    bar.position.copy(state.bar)
    const local=p=>p.clone().applyMatrix4(inverse)
    for(const s of[-1,1]){
      const shoulder=joints[`arm${s}`].rest,hip=joints[`thigh${s}`].rest
      const ankle=local(V(s*(motion==='sumo-deadlift'?.28:.16),.075,.015))
      const leg=solveJoint(hip,ankle,local(V(s*.22,.42,.8)),.421,.356)
      rig.aim(`thigh${s}`,`shin${s}`,hip,leg.joint);rig.aim(`shin${s}`,`foot${s}`,leg.joint,leg.end)
      joints[`foot${s}`].bone.position.copy(leg.end);joints[`foot${s}`].bone.quaternion.copy(root.quaternion).invert()
      const handDirection=motion==='front-squat'?V(0,-1,0):motion==='curl'?V(0,.15,1).normalize():['squat','good-morning'].includes(motion)?V(0,0,-1):motion==='press'?V(0,1,0):V(0,-1,0)
      const wristWorld=state.bar.clone().add(V(motion==='front-squat'?-s*.13:s*state.grip,0,0)).addScaledVector(handDirection,-.065)
      const wrist=local(wristWorld)
      let elbow
      if(motion==='curl'){elbow=V(s*.225,1.10,-.025)}else{
        const pole=motion==='front-squat'?V(s*.20,state.hip.y+.54,state.hip.z+.60):['squat','good-morning'].includes(motion)?V(s*.6,1.0,-.6):motion==='press'?V(s*.6,1.15,.15):V(s*.40,.8,-.3)
        elbow=solveJoint(shoulder,wrist,local(pole),.29,.248).joint
      }
      rig.aim(`arm${s}`,`forearm${s}`,shoulder,elbow);rig.aim(`forearm${s}`,`hand${s}`,elbow,wrist)
      const hand=joints[`hand${s}`].bone;hand.position.copy(wrist)
      const dir=handDirection.clone().transformDirection(inverse)
      hand.quaternion.setFromUnitVectors(V(s*.02,-.09,.015).normalize(),dir)
      const finger=joints[`fingers${s}`],tip=joints[`tips${s}`]
      finger.bone.position.copy(finger.rest).sub(joints[`hand${s}`].rest).applyQuaternion(hand.quaternion).add(wrist);finger.bone.quaternion.copy(hand.quaternion).multiply(curlQ)
      tip.bone.position.copy(tip.rest).sub(finger.rest).applyQuaternion(finger.bone.quaternion).add(finger.bone.position);tip.bone.quaternion.copy(finger.bone.quaternion).multiply(curlQ)
    }
    }
    root.updateMatrixWorld(true)
    panel.querySelector('#common-phase').textContent=cfg.phases[phase];panel.querySelector('#common-cue').textContent=cfg.cues[phase];panel.querySelector('.press-meter i').style.width=`${(1-k)*100}%`;scrub.value=t
    panel.querySelectorAll('[data-phase]').forEach(li=>{const active=+li.dataset.phase===phase;li.classList.toggle('current',active);if(active)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')})
  }
  let last=performance.now();anatomy.updateExercise=()=>{const now=performance.now();if(playing&&!document.hidden)elapsed+=Math.min(.1,(now-last)/1000)*speed;last=now;pose()};pose();document.body.dataset.exerciseReady=id
}
