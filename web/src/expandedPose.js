import * as THREE from 'three'
import { V, solveJoint } from './standingPose.js'

// All targets use the same metre-scale anatomy landmarks as the original rig.
export function expandedState(id,k) {
  const p=1-k
  const state={hip:V(0,.85,-.03),tilt:0,footAngle:0}
  if(id==='sumo-squat'){state.hip.set(0,.81-.30*k,-.03-.11*k);state.tilt=.10+.22*k}
  if(id==='floor-press'||id==='dead-bug'){state.hip.set(0,.16,.20);state.tilt=-Math.PI/2}
  if(id==='dumbbell-row'){state.hip.set(0,.76,-.18);state.tilt=.88}
  if(id==='bodyweight-squat'){state.hip.set(0,.85-.34*k,-.03-.16*k);state.tilt=.10+.32*k}
  if(id==='dumbbell-rdl'){state.hip.set(0,.85-.06*k,-.03-.25*k);state.tilt=.98*k}
  if(id==='triceps-kickback'){state.hip.set(0,.76,-.18);state.tilt=.88}
  if(id==='split-squat')state.hip.set(0,.76-.25*k,-.03)
  if(id==='calf-raise'){state.hip.y+=.072*p;state.footAngle=.38*p}
  if(id==='reverse-fly'){state.hip.set(0,.76,-.18);state.tilt=.88}
  if(id==='bridge'){state.hip.set(0,.16+.22*p,.20);state.tilt=-Math.PI/2-(.07+.35*p)}
  if(id==='pushup'||id==='plank'){
    const h=id==='plank'?.25:.40-.19*k,dy=h-.16,span=Math.sqrt(.775**2-dy**2)
    state.hip.set(0,h,-.80+span);state.tilt=Math.atan2(span,dy)
  }
  return state
}
export function poseExpanded(rig,root,id,k,dumbbells) {
  const state=expandedState(id,k),j=rig.joints
  root.rotation.set(state.tilt,0,0)
  root.position.copy(state.hip).sub(V(0,.85,-.03).applyEuler(root.rotation))
  if(id==='bridge'){j.head.bone.position.copy(j.head.rest);j.head.bone.quaternion.copy(root.quaternion).invert().multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-Math.PI/2))}
  root.updateMatrixWorld(true)
  const inv=root.matrixWorld.clone().invert(),world=p=>p.clone().applyMatrix4(root.matrixWorld),local=p=>p.clone().applyMatrix4(inv)
  const curl=new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-1.4)
  for(const s of[-1,1]){
    const hip=j[`thigh${s}`].rest,shoulder=j[`arm${s}`].rest,shoulderWorld=world(shoulder)
    let ankle=V(s*.15,.075,.015),footAngle=state.footAngle,legPole=V(s*.20,.50,.8)
    if(id==='split-squat'){ankle=V(s*.13,s===1?.075:.135,s===1?.28:-.34);if(s===-1)footAngle=.62}
    if(id==='calf-raise')ankle.y+=.072*(1-k)
    if(id==='bridge'||id==='floor-press'){ankle=V(s*.14,.075,.72);legPole=V(s*.16,.65,.55)}
    if(id==='pushup'||id==='plank'){ankle=V(s*.10,.16,-.8);footAngle=.70;legPole=V(s*.10,.30,-.45)}
    if(id==='sumo-squat'){ankle=V(s*.28,.075,.02);legPole=V(s*.40,.45,.65)}
    if(id==='dead-bug'){
      const reach=Math.max(0,s===1?2*k-1:1-2*k)
      ankle=V(s*.12,.48-.34*reach,.60+.34*reach);legPole=V(s*.12,.72,.22)
    }
    const leg=solveJoint(hip,local(ankle),local(legPole),.421,.356)
    rig.aim(`thigh${s}`,`shin${s}`,hip,leg.joint);rig.aim(`shin${s}`,`foot${s}`,leg.joint,leg.end)
    j[`foot${s}`].bone.position.copy(leg.end)
    j[`foot${s}`].bone.quaternion.copy(root.quaternion).invert().multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0),footAngle))
    if(id==='sumo-squat')j[`foot${s}`].bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),s*.30))
    if(id==='dumbbell-shrug')shoulderWorld.y+=.055*(1-k)
    let elbowWorld,wristWorld,handDir
    if(id==='dumbbell-row'){
      const target=V(s*.24,.56+.30*(1-k),.36-.18*(1-k))
      const arm=solveJoint(shoulderWorld,target,V(s*.34,.95,-.35),.29,.248)
      elbowWorld=arm.joint;wristWorld=arm.end;handDir=V(0,-1,0)
    }else if(id==='floor-press'){
      const target=V(s*(.33-.11*(1-k)),.25+.41*(1-k),shoulderWorld.z+.07)
      const arm=solveJoint(shoulderWorld,target,V(s*.62,.10,-.12),.29,.248)
      elbowWorld=arm.joint;wristWorld=arm.end;handDir=V(0,1,0)
    }else if(id==='dead-bug'){
      const reach=Math.max(0,s===-1?2*k-1:1-2*k),angle=1.30*reach
      const dir=V(0,Math.cos(angle),-Math.sin(angle))
      elbowWorld=shoulderWorld.clone().addScaledVector(dir,.29)
      wristWorld=elbowWorld.clone().addScaledVector(dir,.248);handDir=dir
    }else if(id==='dumbbell-shrug'){
      handDir=V(0,-1,0)
      elbowWorld=shoulderWorld.clone().add(V(s*.04,-.29,0))
      wristWorld=elbowWorld.clone().add(V(s*.02,-.248,0))
    }else if(id==='front-raise'||id==='bodyweight-squat'||id==='sumo-squat'){
      const angle=['bodyweight-squat','sumo-squat'].includes(id)?Math.PI/2:.10+(Math.PI/2-.10)*(1-k)
      const upperDir=V(s*.04,-Math.cos(angle),Math.sin(angle)).normalize()
      const lowerDir=V(0,-Math.cos(angle+.08),Math.sin(angle+.08)).normalize()
      elbowWorld=shoulderWorld.clone().addScaledVector(upperDir,.29)
      wristWorld=elbowWorld.clone().addScaledVector(lowerDir,.248);handDir=lowerDir
    }else if(id==='dumbbell-press'){
      const target=V(s*(.33-.11*(1-k)),1.48+.42*(1-k),.12)
      const arm=solveJoint(shoulderWorld,target,V(s*.65,1.35,.20),.29,.248)
      elbowWorld=arm.joint;wristWorld=arm.end;handDir=V(0,1,0)
    }else if(id==='dumbbell-rdl'){
      const dir=V(0,-1,0)
      elbowWorld=shoulderWorld.clone().addScaledVector(dir,.29)
      wristWorld=elbowWorld.clone().addScaledVector(dir,.248);handDir=dir
    }else if(id==='triceps-kickback'){
      const upperDir=V(s*.06,-1,0).normalize().transformDirection(root.matrixWorld)
      elbowWorld=shoulderWorld.clone().addScaledVector(upperDir,.29)
      const lowerDir=V(0,-Math.cos(.88*(1-k)),-Math.sin(.88*(1-k)))
      wristWorld=elbowWorld.clone().addScaledVector(lowerDir,.248);handDir=lowerDir
    }else if(id==='lateral-raise'||id==='reverse-fly'){
      const angle=.10+(Math.PI/2-.16)*(1-k)
      const upperDir=V(s*Math.sin(angle),-Math.cos(angle),.06).normalize(),lowerDir=V(s*Math.sin(angle-.08),-Math.cos(angle-.08),.08).normalize()
      elbowWorld=shoulderWorld.clone().addScaledVector(upperDir,.29)
      wristWorld=elbowWorld.clone().addScaledVector(lowerDir,.248);handDir=lowerDir
    }else if(id==='hammer-curl'){
      elbowWorld=world(V(s*.225,1.10,-.025))
      const angle=.20+2.05*(1-k)
      const dir=V(0,-Math.cos(angle),Math.sin(angle))
      wristWorld=elbowWorld.clone().addScaledVector(dir,.248);handDir=dir
    }else if(id==='pushup'){
      wristWorld=V(s*.29,.08,.47)
      const arm=solveJoint(shoulderWorld,wristWorld,V(s*.65,.15,.25),.29,.248)
      elbowWorld=arm.joint;wristWorld=arm.end;handDir=V(0,0,1)
    }else if(id==='plank'){
      const upperDir=V(s*.03,-.26,.12).normalize()
      elbowWorld=shoulderWorld.clone().addScaledVector(upperDir,.29)
      wristWorld=elbowWorld.clone().add(V(0,0,.248));handDir=V(0,0,1)
    }else if(id==='bridge'){
      wristWorld=V(s*.29,.05,.14)
      const arm=solveJoint(shoulderWorld,wristWorld,V(s*.5,.05,-.10),.29,.248)
      elbowWorld=arm.joint;wristWorld=arm.end;handDir=V(0,0,1)
    }else{
      elbowWorld=world(j[`forearm${s}`].rest);wristWorld=world(j[`hand${s}`].rest);handDir=V(0,-1,0)
    }
    rig.aim(`arm${s}`,`forearm${s}`,local(shoulderWorld),local(elbowWorld))
    rig.aim(`forearm${s}`,`hand${s}`,local(elbowWorld),local(wristWorld))
    const hand=j[`hand${s}`].bone;hand.position.copy(local(wristWorld))
    const localHandDir=handDir.clone().transformDirection(inv)
    hand.quaternion.setFromUnitVectors(V(s*.02,-.09,.015).normalize(),localHandDir)
    if(['pushup','plank','bridge'].includes(id))hand.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(localHandDir,Math.PI))
    const finger=j[`fingers${s}`],tip=j[`tips${s}`]
    // Hands remain open on the floor; gripping poses flex the finger segments.
    const closeFingers=dumbbells.length>0
    finger.bone.position.copy(finger.rest).sub(j[`hand${s}`].rest).applyQuaternion(hand.quaternion).add(hand.position)
    finger.bone.quaternion.copy(hand.quaternion);if(closeFingers)finger.bone.quaternion.multiply(curl)
    tip.bone.position.copy(tip.rest).sub(finger.rest).applyQuaternion(finger.bone.quaternion).add(finger.bone.position)
    tip.bone.quaternion.copy(finger.bone.quaternion);if(closeFingers)tip.bone.quaternion.multiply(curl)
    if(dumbbells.length){
      const db=dumbbells[s===-1?0:1]
      db.position.copy(wristWorld).addScaledVector(handDir,.06)
      db.quaternion.setFromUnitVectors(V(1,0,0),['front-raise','dumbbell-rdl','dumbbell-press','floor-press'].includes(id)?V(1,0,0):V(0,0,1))
    }
  }
  root.updateMatrixWorld(true)
}
