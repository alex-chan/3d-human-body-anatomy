import * as THREE from 'three'
import { V, solveJoint } from './standingPose.js'
import { poseExpanded, expandedState } from './expandedPose.js'
import { machineState, poseMachine } from './machineMotion.js'
export function expansionState(id,k){
 if(id==='goblet-squat')return expandedState('bodyweight-squat',k)
 if(id==='reverse-lunge'){const travel=THREE.MathUtils.smoothstep(k,0,.65);return {hip:V(0,.85-.32*k,-.03-.12*k),tilt:.10*k,travel}}
 if(id==='floor-fly')return expandedState('floor-press',k)
 if(id==='knee-pushup'){const h=.33-.13*k;return {hip:V(0,h,-.36+Math.sqrt(.421**2-(h-.075)**2)),tilt:1.18}}
 if(id==='incline-pushup'){const h=.70-.15*k,dy=h-.16,span=Math.sqrt(.775**2-dy**2);return {hip:V(0,h,-.8+span),tilt:Math.atan2(span,dy)}}
 if(['close-pushup','high-plank','mountain-climber'].includes(id))return expandedState('pushup',id==='close-pushup'?k:0)
 if(id==='bird-dog')return {hip:V(0,.48,-.10),tilt:Math.PI/2}
 if(id==='pullup')return {hip:V(0,1.05+.42*(1-k),-.03),tilt:0}
 return expandedState('bodyweight-squat',0)
}
export function poseExpansion(rig,root,id,k,dumbbells){
 if(id==='dumbbell-split-squat'){poseExpanded(rig,root,'split-squat',k,dumbbells);return}
 if(id==='dumbbell-curl'){
  poseExpanded(rig,root,'hammer-curl',k,dumbbells)
  for(const db of dumbbells)db.quaternion.identity()
  return
 }
 if(id==='seated-dumbbell-press'){
  poseMachine(rig,root,'machine-shoulder-press',k,{update(state){state.grips.forEach((p,i)=>{dumbbells[i].position.copy(p);dumbbells[i].quaternion.identity()})}});return
 }
 const state=expansionState(id,k),j=rig.joints
 root.rotation.set(state.tilt,0,0);root.position.copy(state.hip).sub(V(0,.85,-.03).applyEuler(root.rotation));root.updateMatrixWorld(true)
 const inverse=root.matrixWorld.clone().invert(),world=p=>p.clone().applyMatrix4(root.matrixWorld),local=p=>p.clone().applyMatrix4(inverse)
 for(const s of[-1,1]){
  let ankle=V(s*.15,.075,.015),pole=V(s*.20,.50,.80),knee,footAngle=0
  if(id==='reverse-lunge'){ankle=V(s*.13,s===-1?.075+.06*state.travel:.075,s===-1?.015-.40*state.travel:.015);if(s===-1)footAngle=.6*state.travel}
  if(id==='floor-fly'){ankle=V(s*.14,.075,.72);pole=V(s*.16,.65,.55)}
  if(['close-pushup','high-plank','incline-pushup','mountain-climber'].includes(id)){ankle=V(s*.1,.16,-.8);pole=V(s*.10,.30,-.45);footAngle=.70}
  if(id==='knee-pushup'){knee=V(s*.08,.075,-.36);ankle=knee.clone().add(V(0,.15,-Math.sqrt(.356**2-.15**2)));footAngle=-.6}
  const reach=Math.max(0,s===1?2*k-1:1-2*k)
  if(id==='mountain-climber'){ankle.y+=.04*reach;ankle.z+=.78*reach;pole=V(s*.14,.30,.5)}
  if(id==='bird-dog'){ankle=V(s*.1,.075+.405*reach,-.456-.419*reach);pole=V(s*.1,.02,-.1);footAngle=.5*(1-reach)}
  if(id==='pullup'){ankle=V(s*.13,state.hip.y-.70,-.12);pole=V(s*.14,state.hip.y-.35,.35)}
  const hip=j[`thigh${s}`].rest,leg=knee?{joint:local(knee),end:local(ankle)}:solveJoint(hip,local(ankle),local(pole),.421,.356)
  rig.aim(`thigh${s}`,`shin${s}`,hip,leg.joint);rig.aim(`shin${s}`,`foot${s}`,leg.joint,leg.end);j[`foot${s}`].bone.position.copy(leg.end)
  j[`foot${s}`].bone.quaternion.copy(root.quaternion).invert().multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0),footAngle))
  const shoulder=j[`arm${s}`].rest,sw=world(shoulder)
  let wrist,elbow,handDir=V(0,-1,0),armPole=V(s*.55,.25,.20)
  if(id==='goblet-squat'){wrist=world(V(s*.07,1.27,.20));armPole=world(V(s*.32,1.0,.20));handDir=V(0,1,0)}
  else if(id==='reverse-lunge'){elbow=world(j[`forearm${s}`].rest);wrist=world(j[`hand${s}`].rest)}
  else if(id==='floor-fly'){
   const angle=-.15+1.25*k,upper=V(s*Math.sin(angle),Math.cos(angle),.06).normalize(),lower=V(s*Math.sin(angle-.02),Math.cos(angle-.02),.06).normalize()
   elbow=sw.clone().addScaledVector(upper,.29);wrist=elbow.clone().addScaledVector(lower,.248);handDir=lower
  }else if(id==='bird-dog'){
   const armReach=Math.max(0,s===-1?2*k-1:1-2*k)
   wrist=V(s*.18,.08+.40*armReach,.47+.48*armReach);armPole=V(s*.4,.25,.65);handDir=V(0,0,1)
  }else if(id==='pullup'){wrist=V(s*.35,2.075,.08);armPole=V(s*.65,1.55,0);handDir=V(0,1,0)}
  else{wrist=V(s*(id==='close-pushup'?.18:.29),id==='incline-pushup'?.56:.08,id==='incline-pushup'?.24:.47);handDir=V(0,0,1);armPole=V(s*(id==='close-pushup'?.34:.65),.15,.20)}
  const arm=elbow?{joint:local(elbow),end:local(wrist)}:solveJoint(shoulder,local(wrist),local(armPole),.29,.248)
  rig.aim(`arm${s}`,`forearm${s}`,shoulder,arm.joint);rig.aim(`forearm${s}`,`hand${s}`,arm.joint,arm.end)
  const hand=j[`hand${s}`],dir=handDir.clone().transformDirection(inverse);hand.bone.position.copy(arm.end);hand.bone.quaternion.setFromUnitVectors(V(s*.02,-.09,.015).normalize(),dir)
  const gripping=dumbbells.length>0||id==='pullup'
  if(!gripping&&id!=='reverse-lunge')hand.bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(dir,Math.PI))
  const finger=j[`fingers${s}`],tip=j[`tips${s}`],curl=new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-1.4)
  finger.bone.position.copy(finger.rest).sub(hand.rest).applyQuaternion(hand.bone.quaternion).add(arm.end);finger.bone.quaternion.copy(hand.bone.quaternion);if(gripping)finger.bone.quaternion.multiply(curl)
  tip.bone.position.copy(tip.rest).sub(finger.rest).applyQuaternion(finger.bone.quaternion).add(finger.bone.position);tip.bone.quaternion.copy(finger.bone.quaternion);if(gripping)tip.bone.quaternion.multiply(curl)
  if(dumbbells.length){const db=dumbbells[s===-1?0:1];db.position.copy(wrist).addScaledVector(handDir,.06);db.quaternion.setFromAxisAngle(V(0,1,0),Math.PI/2)}
 }
 if(id==='goblet-squat'){dumbbells[1].visible=false;dumbbells[0].position.copy(world(V(0,1.20,.20)));dumbbells[0].quaternion.setFromAxisAngle(V(0,0,1),Math.PI/2)}
 root.updateMatrixWorld(true)
}
export function createExpansionEquipment(scene,type){
 if(!type||type==='goblet')return
 const frame=new THREE.MeshStandardMaterial({color:'#35515e',metalness:.65,roughness:.4}),pad=new THREE.MeshStandardMaterial({color:'#173f49',roughness:.8})
 const box=(size,pos,mat=frame)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.position.set(...pos);scene.add(mesh);return mesh}
 if(type==='pullup'){
  for(const s of[-1,1]){box([.07,2.20,.07],[s*.65,1.1,.08]);box([.22,.06,.70],[s*.65,.03,.08])}
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.40,24),frame);bar.rotation.z=Math.PI/2;bar.position.set(0,2.14,.08);scene.add(bar)
 }else if(type==='incline'){
  box([.95,.09,.38],[0,.475,.37],pad)
  for(const x of[-.35,.35])box([.07,.43,.30],[x,.215,.37])
 }else if(type==='seat'){
  box([.43,.09,.38],[0,.445,.08],pad);box([.40,.65,.08],[0,.82,-.14],pad);box([.08,.4,.08],[0,.22,.08]);box([.75,.10,.65],[0,.05,.05])
 }
}
