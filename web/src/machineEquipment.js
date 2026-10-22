import * as THREE from 'three'
import { V } from './standingPose.js'

export function createMachineEquipment(scene,id) {
  const group=new THREE.Group();group.name=`equipment-${id}`;scene.add(group)
  const frame=new THREE.MeshStandardMaterial({color:'#35515e',metalness:.7,roughness:.38})
  const pad=new THREE.MeshStandardMaterial({color:'#173f49',roughness:.82})
  const grip=new THREE.MeshStandardMaterial({color:'#7ad9c2',roughness:.6})
  const weight=new THREE.MeshStandardMaterial({color:'#172631',metalness:.5,roughness:.5})
  const cableMat=new THREE.MeshStandardMaterial({color:'#b8c9cd',metalness:.7,roughness:.32})
  const box=(size,pos,mat=frame,parent=group)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);parent.add(m);return m}
  const segment=(radius=.025,mat=frame,parent=group)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,16),mat);parent.add(m);return m}
  const link=(mesh,a,b)=>{mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize())}
  const rod=(a,b,r=.025,mat=frame)=>{const m=segment(r,mat);link(m,V(...a),V(...b));return m}
  const standing=['cable-pushdown','cable-curl','face-pull'].includes(id),isRow=id==='cable-row',isLeg=['leg-extension','seated-leg-curl'].includes(id),isChest=['machine-chest-press','machine-shoulder-press'].includes(id),isCurl=id==='cable-curl',isFace=id==='face-pull'
  const towerZ=isRow?1.05:standing?.80:-.42
  box([1.45,standing?.07:.10,standing?.65:isRow?1.7:1.2],[.15,standing?.035:.05,standing?.80:isRow?.35:.15])
  for(const x of[.50,.82])box([.045,1.9,.045],[x,.98,towerZ])
  box([.43,.07,.24],[.66,1.94,towerZ])
  const stack=new THREE.Group();group.add(stack)
  for(let i=0;i<10;i++)box([.27,.045,.20],[.66,.13+i*.05,towerZ],weight,stack)
  box([.04,.025,.24],[.80,.36,towerZ],grip,stack)
  if(!standing){
    box([.43,.09,.38],[0,.445,.08],pad);box([.07,.40,.08],[0,.23,.08])
    if(!isRow){box([.40,.65,.08],[0,.82,-.14],pad);box([.07,.70,.07],[0,.77,-.22])}
  }
  if(id==='lat-pulldown'){
    rod([.66,1.95,towerZ],[0,1.95,.20]);rod([0,.05,-.25],[0,1.95,-.25])
    rod([-.28,.65,.28],[.28,.65,.28],.065,pad)
  }
  if(isRow){
    for(const s of[-1,1]){const footplate=box([.22,.05,.30],[s*.15,.09,.70],pad);footplate.rotation.x=-.45}
    rod([.66,.45,towerZ],[0,.45,towerZ]);rod([.66,1.92,towerZ],[.66,.45,towerZ],.008,cableMat)
  }
  if(standing)rod([.66,isCurl?.25:isFace?1.48:1.95,towerZ],[0,isCurl?.25:isFace?1.48:1.95,.48])
  if(id==='seated-leg-curl')rod([-.28,.65,.25],[.28,.65,.25],.065,pad)
  const movingHandles=[],levers=[]
  if(isChest){
    for(const s of[-1,1]){rod([s*.46,.06,-.22],[s*.46,(id==='machine-shoulder-press'?1.75:1.43),-.22]);levers.push(segment(.023));movingHandles.push(segment(.017,grip))}
  }else if(isLeg){
    for(const s of[-1,1]){rod([s*.29,.42,-.10],[s*.29,.54,-.02],.018,grip);levers.push(segment(.024))}
    movingHandles.push(segment(.065,pad))
  }else if(isRow||isFace){
    for(let i=0;i<2;i++)movingHandles.push(segment(.018,grip))
    levers.push(segment(.013));if(isFace)levers.push(segment(.009,cableMat))
  }else{
    movingHandles.push(segment(.017,grip))
  }
  const cable=segment(.006,cableMat)
  // High and low pulley wheels make the cable's direction visible.
  const anchor=isRow?V(0,.45,towerZ):standing?V(0,isCurl?.25:isFace?1.48:1.95,.48):V(0,1.95,.20)
  if(!isLeg&&!isChest){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.055,.012,8,24),weight);wheel.position.copy(anchor);wheel.rotation.y=Math.PI/2;group.add(wheel)}
  return {group,update(state,k){
    stack.position.y=.10*(1-k)
    const center=state.grips[0].clone().add(state.grips[1]).multiplyScalar(.5)
    if(isChest){
      for(let i=0;i<2;i++){const p=state.grips[i],s=i===0?-1:1;link(movingHandles[i],p.clone().add(V(0,-.07,0)),p.clone().add(V(0,.07,0)));link(levers[i],V(s*.46,(id==='machine-shoulder-press'?1.75:1.43),-.22),p)}
      link(cable,V(.66,1.92,towerZ),V(.66,.64+.10*(1-k),towerZ))
    }else if(isLeg){
      const angle=1.38*(id==='seated-leg-curl'?k:1-k),normal=id==='seated-leg-curl'?-1:1,roller=state.legs[-1].ankle.clone().add(state.legs[1].ankle).multiplyScalar(.5).add(V(0,.08*Math.cos(angle)+normal*.065*Math.sin(angle),-.08*Math.sin(angle)+normal*.065*Math.cos(angle)))
      link(movingHandles[0],roller.clone().add(V(-.31,0,0)),roller.clone().add(V(.31,0,0)))
      for(let i=0;i<2;i++){const s=i===0?-1:1;link(levers[i],state.legs[s].knee.clone().setX(s*.33),roller.clone().setX(s*.33))}
      link(cable,V(.66,1.92,towerZ),V(.66,.64+.10*(1-k),towerZ))
    }else if(isRow||isFace){
      for(let i=0;i<2;i++){const p=state.grips[i];link(movingHandles[i],p.clone().add(V(0,-.07,0)),p.clone().add(V(0,.07,0)))}
      if(isFace){center.z+=.12;link(levers[0],center,state.grips[0]);link(levers[1],center,state.grips[1])}else link(levers[0],state.grips[0],state.grips[1]);link(cable,center,anchor)
    }else{
      const span=id==='lat-pulldown'?.54:.30
      link(movingHandles[0],center.clone().add(V(-span,0,0)),center.clone().add(V(span,0,0)));link(cable,center,anchor)
    }
  }}
}
