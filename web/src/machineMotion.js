import * as THREE from 'three'
import { V, solveJoint } from './standingPose.js'

// World-space contact targets also drive handles, rollers and cables.
export function machineState(id,k) {
  const standing=['cable-pushdown','cable-curl','face-pull'].includes(id),hip=V(0,standing?.85:.55,-.03)
  const state={hip,legs:{},arms:{},grips:[]}
  for(const s of[-1,1]){
    let ankle=V(s*.12,.174,.389),knee=standing||id==='cable-row'?null:hip.clone().add(V(s*.12,-.02,Math.sqrt(.421**2-.04**2-.02**2))),footAngle=0
    if(standing)ankle=V(s*.15,.075,.015)
    if(id==='cable-row')ankle=V(s*.14,.16,.61)
    if(id==='leg-extension'||id==='seated-leg-curl'){
      knee=hip.clone().add(V(s*.12,-.02,Math.sqrt(.421**2-.04**2-.02**2)))
      const angle=1.38*(id==='seated-leg-curl'?k:1-k)
      ankle=knee.clone().add(V(0,-.356*Math.cos(angle),.356*Math.sin(angle)));footAngle=-angle
    }
    state.legs[s]={ankle,knee,footAngle,pole:V(s*.16,standing?.45:.68,.43)}
    let wrist,pole=V(s*.56,1.0,-.15),handDir=V(0,0,1),elbow
    if(id==='lat-pulldown'){handDir=V(0,1,0);wrist=V(s*.36,1.06+.48*k,.17);pole=V(s*.62,1.05,.02)}
    if(id==='cable-row')wrist=V(s*.20,.94,.19+.28*k)
    if(id==='machine-chest-press'){wrist=V(s*.26,1.00,.18+.28*(1-k));pole=V(s*.60,.92,-.10)}
    if(id==='leg-extension'||id==='seated-leg-curl'){wrist=V(s*.29,.57,-.01);handDir=V(0,-1,0);pole=V(s*.45,.8,-.12)}
    if(standing){elbow=V(s*.22,1.10,.02);const angle=.12+1.40*k;handDir=V(0,-Math.cos(angle),Math.sin(angle));wrist=elbow.clone().addScaledVector(handDir,.248)}
    if(id==='machine-shoulder-press'){wrist=V(s*(.33-.10*(1-k)),1.18+.40*(1-k),.12);handDir=V(0,1,0);pole=V(s*.60,1.0,.20)}
    if(id==='cable-curl'){elbow=V(s*.22,1.10,.02);const angle=.20+2.05*(1-k);handDir=V(0,-Math.cos(angle),Math.sin(angle));wrist=elbow.clone().addScaledVector(handDir,.248)}
    if(id==='face-pull'){elbow=null;wrist=V(s*.24,1.38,.13+.30*k);handDir=V(0,0,1);pole=V(s*.65,1.45,-.05)}
    state.arms[s]={wrist,pole,handDir,elbow}
    state.grips.push(wrist.clone().addScaledVector(handDir,.06))
  }
  return state
}
export function poseMachine(rig,root,id,k,equipment) {
  const state=machineState(id,k),j=rig.joints
  root.rotation.set(0,0,0);root.position.copy(state.hip).sub(V(0,.85,-.03));root.updateMatrixWorld(true)
  const inv=root.matrixWorld.clone().invert(),local=p=>p.clone().applyMatrix4(inv)
  for(const s of[-1,1]){
    const legState=state.legs[s],hip=j[`thigh${s}`].rest
    const leg=legState.knee?{joint:local(legState.knee),end:local(legState.ankle)}:solveJoint(hip,local(legState.ankle),local(legState.pole),.421,.356)
    rig.aim(`thigh${s}`,`shin${s}`,hip,leg.joint);rig.aim(`shin${s}`,`foot${s}`,leg.joint,leg.end)
    j[`foot${s}`].bone.position.copy(leg.end);j[`foot${s}`].bone.quaternion.setFromAxisAngle(V(1,0,0),legState.footAngle)
    const a=state.arms[s],shoulder=j[`arm${s}`].rest
    const arm=a.elbow?{joint:local(a.elbow),end:local(a.wrist)}:solveJoint(shoulder,local(a.wrist),local(a.pole),.29,.248)
    rig.aim(`arm${s}`,`forearm${s}`,shoulder,arm.joint);rig.aim(`forearm${s}`,`hand${s}`,arm.joint,arm.end)
    const hand=j[`hand${s}`];hand.bone.position.copy(arm.end);hand.bone.quaternion.setFromUnitVectors(V(s*.02,-.09,.015).normalize(),a.handDir)
    const finger=j[`fingers${s}`],tip=j[`tips${s}`],curl=new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-1.4)
    finger.bone.position.copy(finger.rest).sub(hand.rest).applyQuaternion(hand.bone.quaternion).add(arm.end);finger.bone.quaternion.copy(hand.bone.quaternion).multiply(curl)
    tip.bone.position.copy(tip.rest).sub(finger.rest).applyQuaternion(finger.bone.quaternion).add(finger.bone.position);tip.bone.quaternion.copy(finger.bone.quaternion).multiply(curl)
  }
  root.updateMatrixWorld(true);equipment.update(state,k)
}
