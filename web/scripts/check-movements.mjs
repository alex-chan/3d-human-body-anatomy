import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as T from 'three'
import { EXPANSION_IDS } from '../src/libraryExpansion.js'
import { COMMON } from '../src/commonExercises.js'
import { EXERCISES } from '../src/exercises.js'
import { poseExpansion } from '../src/expansionMotion.js'
import { machineState, poseMachine } from '../src/machineMotion.js'
import { createMachineEquipment } from '../src/machineEquipment.js'
import { standingState } from '../src/standingPose.js'
const V=(...a)=>new T.Vector3(...a)
function makeRig(){
 const root=new T.Group(),joints={}
 const add=(key,rest)=>{const bone=new T.Bone();bone.position.copy(rest);root.add(bone);joints[key]={bone,rest}}
 add('head',V(0,1.47,-.025))
 for(const s of[-1,1])for(const[key,xyz]of Object.entries({arm:[s*.17,1.385,-.03],forearm:[s*.225,1.10,-.025],hand:[s*.272,.856,.005],fingers:[s*.289,.766,.02],tips:[s*.295,.716,.022],thigh:[s*.08,.85,-.03],shin:[s*.085,.43,-.025],foot:[s*.075,.075,-.035]}))add(key+s,V(...xyz))
 return {root,joints,aim:(a,b,start,end)=>{joints[a].bone.position.copy(start);joints[a].bone.quaternion.setFromUnitVectors(joints[b].rest.clone().sub(joints[a].rest).normalize(),end.clone().sub(start).normalize())}}
}
const glb=fs.readFileSync('public/models/muscles.glb'),json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString()),names=json.nodes.map(n=>n.name||'')
for(const exercise of EXERCISES)if(process.argv.includes('--assets'))assert(fs.existsSync('public/'+exercise.thumbnail.replace(/^\.\//,'')),`${exercise.id}: preview asset`)
assert.equal(EXERCISES.length,50);assert.equal(new Set(EXERCISES.map(e=>e.id)).size,50)
for(const id of EXPANSION_IDS){
 const cfg=COMMON[id],rig=makeRig(),scene=new T.Scene();scene.add(rig.root)
 const equipment=cfg.machine?createMachineEquipment(scene,id):null,dumbbells=cfg.prop==='dumbbells'?[new T.Group(),new T.Group()]:[]
 for(const db of dumbbells)scene.add(db)
 assert(names.some(n=>cfg.primary.test(n)),`${id}: primary muscle`);assert(names.some(n=>cfg.assist.test(n)),`${id}: assist muscle`)
 let first,last
 for(let i=0;i<=40;i++){
  const k=i/40
  if(cfg.machine){poseMachine(rig,rig.root,id,k,equipment);const state=machineState(id,k);for(const s of[-1,1])assert(rig.joints[`hand${s}`].bone.getWorldPosition(V()).distanceTo(state.arms[s].wrist)<.005,`${id}: hand contact`)}
  else if(cfg.expansion)poseExpansion(rig,rig.root,id,cfg.isometric?0:k,dumbbells)
  else{const state=standingState(id,k);assert([...state.hip,...state.bar,state.tilt,state.grip].every(Number.isFinite));rig.root.position.copy(state.hip)}
  rig.root.updateMatrixWorld(true)
  scene.traverse(node=>assert([...node.position,...node.quaternion,...node.scale].every(Number.isFinite),`${id}: invalid transform`))
  if(['incline-pushup','knee-pushup','close-pushup','high-plank','mountain-climber'].includes(id))for(const s of[-1,1]){
   const expected=V(s*(id==='close-pushup'?.18:.29),id==='incline-pushup'?.56:.08,id==='incline-pushup'?.24:.47)
   assert(rig.joints[`hand${s}`].bone.getWorldPosition(V()).distanceTo(expected)<.005,`${id}: support hand moved`)
  }
  const signature=[...rig.root.position,...Object.values(rig.joints).flatMap(j=>[...j.bone.position])]
  if(i===0)first=signature;if(i===40)last=signature
 }
 if(cfg.isometric)assert.deepEqual(first,last,`${id}: isometric pose changed`)
 else assert(first.some((v,i)=>Math.abs(v-last[i])>.001),`${id}: no animation`)
 if(process.argv.includes('--assets'))assert(fs.existsSync(`public/previews/${id}.png`),`${id}: thumbnail`)
}
console.log('Movements passed: 50 unique exercises, 21 new actions × 41 poses, finite transforms, muscle mappings, grip/support contacts and static holds.')
