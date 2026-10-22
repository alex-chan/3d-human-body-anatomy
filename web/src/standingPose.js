import * as THREE from 'three'
export const V = (x,y,z) => new THREE.Vector3(x,y,z)
// Analytic two-link IK: clamp reach before solving to keep joints finite.
export function solveJoint(start, end, pole, upper, lower) {
  const axis=end.clone().sub(start), raw=axis.length(), d=THREE.MathUtils.clamp(raw,.001,upper+lower-.001)
  axis.normalize()
  const actual=start.clone().addScaledVector(axis,d)
  const along=(upper*upper-lower*lower+d*d)/(2*d)
  const bend=pole.clone().sub(start).addScaledVector(axis,-pole.clone().sub(start).dot(axis))
  if(bend.lengthSq()<1e-8) bend.crossVectors(axis,V(1,0,0))
  bend.normalize()
  return {joint:start.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,upper*upper-along*along))),end:actual}
}
export function standingState(id,k) {
  const state={hip:V(0,.85,-.03),tilt:0,grip:.26,bar:V(0,.90,.18),palm:V(0,0,-1)}
  if(id==='squat') { state.hip.set(0,.85-.34*k,-.03-.16*k);state.tilt=.10+.32*k;state.grip=.38;state.localBar=V(0,1.43,-.12);state.palm=V(0,1,0) }
  if(id==='deadlift') { state.hip.set(0,.85-.30*k,-.03-.18*k);state.tilt=1.02*k;state.bar.set(0,.82-.58*k,.13+.10*k);state.palm=V(0,0,-1) }
  if(id==='press') {state.grip=.30;state.bar.set(0,1.95-.57*k,.02+.17*k);state.palm=V(0,1,0)}
  if(id==='row') {state.hip.set(0,.76,-.18);state.tilt=.88;state.bar.set(0,.92-.35*k,.35+.12*k);state.palm=V(0,0,-1)}
  if(id==='curl') {state.grip=.225;const angle=.20+2.05*(1-k);state.bar.set(0,1.11-.248*Math.cos(angle),.04+.248*Math.sin(angle));state.palm=V(0,0,1)}
  if(id==='front-squat'){state.hip.set(0,.85-.32*k,-.03-.12*k);state.tilt=.08+.20*k;state.grip=.23;state.localBar=V(0,1.40,.12)}
  if(id==='barbell-rdl'){state.hip.set(0,.85-.06*k,-.03-.25*k);state.tilt=.98*k;state.bar.set(0,.82,.18)}
  if(id==='sumo-deadlift'){state.hip.set(0,.85-.36*k,-.03-.12*k);state.tilt=.75*k;state.grip=.20;state.bar.set(0,.82,.16)}
  if(id==='good-morning'){state.hip.set(0,.85-.05*k,-.03-.23*k);state.tilt=.88*k;state.grip=.38;state.localBar=V(0,1.43,-.12)}
  return state
}
