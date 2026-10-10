// Procedural tissue materials: MeshPhysicalMaterial + injected GLSL for micro-detail
// (muscle fibres, bone pores, wet organ surfaces, skin pores) and a sci-fi scan line.
// Models have no UVs, so everything is driven by object-space 3D noise (units = metres).
import * as THREE from 'three'

export const globalUniforms = {
  uTime: { value: 0 },
  uScanY: { value: -10 },
  uScanColor: { value: new THREE.Color('#38f5e6') },
  uDetail: { value: 1 },
  // Live body animations (0 = off, 1 = on, eased in between)
  uLive: { value: 1 },
  uHeartPos: { value: new THREE.Vector3(0, 1.25, 0.05) },   // world-space centre of the heart (set once organs load)
  uBrainPos: { value: new THREE.Vector3(0, 1.5, 0) },      // world-space brainstem, where nerve signals start
}

// One heartbeat every 0.85 s (~70 bpm). Blood pulses and the beating heart share this clock.
export const BEAT = 0.85

/** Travelling glow pulses: arteries carry them away from the heart, veins back toward it, nerves out from the brainstem.
 *  The wavelength equals speed x period, so exactly one pulse leaves per heartbeat. */
const FLOW = {
  artery: { origin: 'uHeartPos', dir: 1, speed: 0.55, period: BEAT, width: 0.13, color: '#ff6a5a', gain: 2.6 },
  pulmonaryArtery: { origin: 'uHeartPos', dir: 1, speed: 0.55, period: BEAT, width: 0.13, color: '#7d9bff', gain: 2.6 },
  vein: { origin: 'uHeartPos', dir: -1, speed: 0.35, period: BEAT, width: 0.15, color: '#6aa8ff', gain: 2.1 },
  pulmonaryVein: { origin: 'uHeartPos', dir: -1, speed: 0.35, period: BEAT, width: 0.15, color: '#ff7a6a', gain: 2.1 },
  nerve: { origin: 'uBrainPos', dir: 1, speed: 1.6, period: 0.33, width: 0.09, color: '#fff3a0', gain: 2.6 },
}
const flowGLSL = (f, pos = 'vWPos', out = 'totalEmissiveRadiance') => /* glsl */`
  {
    float zd = length(${pos} - ${f.origin});
    float zph = fract(zd / ${(f.speed * f.period).toFixed(4)} - ${(f.dir).toFixed(1)} * uTime / ${f.period.toFixed(4)});
    float zp = smoothstep(${f.width.toFixed(3)}, 0.0, zph) + smoothstep(1.0 - ${(f.width * 0.35).toFixed(3)}, 1.0, zph);
    ${out} += vec3(${new THREE.Color(f.color).toArray().map((v) => v.toFixed(3)).join(',')}) * zp * ${f.gain.toFixed(2)} * uLive;
  }`

const NOISE = /* glsl */`
vec3 z_mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 z_mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 z_perm(vec4 x){return z_mod289(((x*34.0)+10.0)*x);}
vec4 z_tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=z_mod289(i);
  vec4 p=z_perm(z_perm(z_perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=z_tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm3(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<3;i++){ s+=a*snoise(p); p*=2.03; a*=0.5; } return s; }
float zfp;
float N(vec3 q, float fr){ return snoise(q*fr) * smoothstep(0.9, 0.2, zfp*fr); }
float F(vec3 q, float fr){ return fbm3(q*fr) * smoothstep(0.9, 0.2, zfp*fr); }
vec3 zPerturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir){
  vec3 vSigmaX=normalize(dFdx(surf_pos)); vec3 vSigmaY=normalize(dFdy(surf_pos)); vec3 vN=surf_norm;
  vec3 R1=cross(vSigmaY,vN); vec3 R2=cross(vN,vSigmaX); float fDet=dot(vSigmaX,R1)*faceDir;
  vec3 vGrad=sign(fDet)*(dHdxy.x*R1+dHdxy.y*R2); return normalize(abs(fDet)*surf_norm-vGrad);
}
`

// Tissue "recipes": height field + colour variation + roughness variation.
// h in [-1,1]. p = object-space position (m). f = fibre axis.
const TISSUE = {
  bone: `
    float big = F(p, 9.0);
    float pores = N(p, 420.0);
    float h = pores*0.55 + big*0.25 + N(p, 110.0)*0.2;
    float cvar = big*0.10 + pores*0.03; float rvar = pores*0.12; float bump = 0.14;`,
  cartilage: `
    float h = N(p, 160.0)*0.5; float cvar = F(p, 20.0)*0.05; float rvar = 0.0; float bump = 0.05;`,
  teeth: `
    float h = N(p, 300.0)*0.3; float cvar = F(p, 60.0)*0.05; float rvar = 0.0; float bump = 0.04;`,
  muscle: `
    vec3 fa = normalize(f + vec3(1e-4));
    float along = dot(p, fa); vec3 perp = p - fa*along;
    float fib = N(perp + fa*along*(25.0/900.0), 900.0);
    float bundle = N(perp + fa*along*(6.0/160.0), 160.0);
    float h = fib*0.45 + bundle*0.55;
    float cvar = bundle*0.12 + fib*0.05 + F(p, 8.0)*0.06; float rvar = -bundle*0.12; float bump = 0.16;`,
  tendon: `
    vec3 fa = normalize(f + vec3(1e-4)); float along = dot(p, fa); vec3 perp = p - fa*along;
    float h = N(perp + fa*along*(20.0/1200.0), 1200.0)*0.6; float cvar = h*0.05; float rvar = 0.0; float bump = 0.07;`,
  nerve: `
    vec3 fa = normalize(f + vec3(1e-4)); float along = dot(p, fa); vec3 perp = p - fa*along;
    float h = N(perp + fa*along*(40.0/1400.0), 1400.0)*0.6; float cvar = h*0.08; float rvar = 0.0; float bump = 0.07;`,
  vessel: `
    float h = N(p, 220.0)*0.35; float cvar = F(p, 30.0)*0.10; float rvar = 0.0; float bump = 0.05;`,
  organ: `
    float big = F(p, 18.0);
    float h = N(p, 180.0)*0.4 + big*0.3; float cvar = big*0.12; float rvar = N(p, 90.0)*0.15; float bump = 0.09;`,
  lung: `
    float h = N(p, 350.0)*0.5 + N(p, 90.0)*0.3; float cvar = F(p, 25.0)*0.16; float rvar = 0.1; float bump = 0.12;`,
  brain: `
    float h = N(p, 260.0)*0.3; float cvar = F(p, 40.0)*0.08; float rvar = 0.0; float bump = 0.07;`,
  gut: `
    float h = N(p, 140.0)*0.5 + N(p, 400.0)*0.2; float cvar = F(p, 22.0)*0.12; float rvar = N(p, 60.0)*0.12; float bump = 0.10;`,
  skin: `
    float pores = N(p, 900.0);
    float mottle = F(p, 14.0);
    float h = pores*0.5 + N(p, 260.0)*0.3;
    float cvar = mottle*0.05 + pores*0.015; float rvar = pores*0.08 + mottle*0.05; float bump = 0.05;`,
  hair: `
    float h = N(p*vec3(1.0,0.1,1.0), 600.0)*0.7; float cvar = h*0.12; float rvar = 0.1; float bump = 0.09;`,
  fabric: `
    float h = N(p, 1600.0)*0.35 + N(p*vec3(1.0,3.0,1.0), 700.0)*0.25; float cvar = F(p, 30.0)*0.05; float rvar = 0.0; float bump = 0.06;`,
  plain: `float h = 0.0; float cvar = 0.0; float rvar = 0.0; float bump = 0.0;`,
}

const PHYS = {
  bone: { roughness: 0.62, clearcoat: 0.05, sheen: 0.0 },
  cartilage: { roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.25 },
  teeth: { roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 },
  muscle: { roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.5, sheenRoughness: 0.4, sheenColor: '#ff9a8a' },
  tendon: { roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0.6, sheenColor: '#ffffff' },
  nerve: { roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: '#fff4c0' },
  vessel: { roughness: 0.28, clearcoat: 0.85, clearcoatRoughness: 0.15 },
  organ: { roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 },
  lung: { roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.5, sheenColor: '#ffd0d0' },
  brain: { roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.3 },
  gut: { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 },
  skin: { roughness: 0.5, clearcoat: 0.08, clearcoatRoughness: 0.5, sheen: 0.55, sheenRoughness: 0.55, sheenColor: '#ffb49a' },
  hair: { roughness: 0.45, sheen: 0.8, sheenColor: '#8a6a50' },
  fabric: { roughness: 0.85, sheen: 0.7, sheenRoughness: 0.5, sheenColor: '#8fa4d8' },
  plain: { roughness: 0.4 },
}

export const USES_FIBRE = new Set(['muscle', 'tendon', 'nerve'])

/** opts.flow: a key of FLOW ('artery', 'vein', 'nerve', ...) to add live travelling pulses. */
export function makeTissueMaterial(color, tissue, opts = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color, metalness: 0, side: opts.side ?? THREE.DoubleSide, ...PHYS[tissue],
    ...(PHYS[tissue]?.sheenColor ? { sheenColor: new THREE.Color(PHYS[tissue].sheenColor) } : {}),
  })
  m.userData.tissue = tissue
  const recipe = TISSUE[tissue] || TISSUE.plain
  const fibre = USES_FIBRE.has(tissue)
  const flow = FLOW[opts.flow]
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, globalUniforms)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vObjPos; varying vec3 vWPos; ${fibre ? 'attribute vec3 aFiber; varying vec3 vFiber;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vObjPos = position; vWPos = (modelMatrix * vec4(position,1.0)).xyz; ${fibre ? 'vFiber = aFiber;' : ''}`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform float uScanY; uniform vec3 uScanColor; uniform float uDetail;
        uniform float uLive; uniform vec3 uHeartPos; uniform vec3 uBrainPos;
        varying vec3 vObjPos; varying vec3 vWPos; ${fibre ? 'varying vec3 vFiber;' : ''}
        ${NOISE}
        float zH; float zC; float zR; float zB;
        void zTissue(){ vec3 p = vObjPos; zfp = length(fwidth(vObjPos)); vec3 f = ${fibre ? 'vFiber' : 'vec3(0.0,1.0,0.0)'}; ${recipe} zH=h; zC=cvar; zR=rvar; zB=bump; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        zTissue();
        diffuseColor.rgb *= clamp(1.0 + zC*uDetail*2.0 - max(0.0,-zH)*0.06*uDetail, 0.0, 2.0);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + zR*uDetail, 0.04, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (uDetail > 0.0 && zB > 0.0) {
          normal = zPerturb(-vViewPosition, normal, vec2(dFdx(zH), dFdy(zH)) * zB * uDetail, faceDirection);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float zd = abs(vWPos.y - uScanY);
        totalEmissiveRadiance += uScanColor * (smoothstep(0.012, 0.0, zd) * 1.6 + smoothstep(0.12, 0.0, zd) * 0.12);
        ${flow ? `if (uLive > 0.001) ${flowGLSL(flow)}` : ''}`)
  }
  m.customProgramCacheKey = () => 'tissue-' + tissue + '-' + (opts.flow || '')
  return m
}

/** Hologram look: fresnel rim + scanlines, additive. opts.flow adds the same live pulses as the tissue material. */
export function makeHoloMaterial(color, opts = {}) {
  const flow = FLOW[opts.flow]
  return new THREE.ShaderMaterial({
    uniforms: { ...globalUniforms, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz;
        vN = normalize(normalMatrix*normal); vec4 mv = viewMatrix*wp; vV = -mv.xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uTime; uniform float uScanY; uniform vec3 uScanColor; uniform float uOpacity;
      uniform float uLive; uniform vec3 uHeartPos; uniform vec3 uBrainPos;
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){
        float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float lines = 0.75 + 0.25*sin(vW.y*900.0 - uTime*4.0);
        float scan = smoothstep(0.02, 0.0, abs(vW.y - uScanY));
        vec3 c = mix(uColor*0.25, uColor*1.6 + 0.2, fr) * lines + uScanColor*scan*1.5;
        ${flow ? `if (uLive > 0.001) ${flowGLSL(flow, 'vW', 'c')}` : ''}
        gl_FragColor = vec4(c, (0.12 + fr*0.85) * uOpacity);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })
}

/** Per-mesh principal (longest) axis in object space, stored as a vertex attribute for fibre direction. */
export function addFiberAttribute(geometry) {
  const pos = geometry.attributes.position
  const n = pos.count
  // PCA via covariance power iteration
  let cx = 0, cy = 0, cz = 0
  for (let i = 0; i < n; i++) { cx += pos.getX(i); cy += pos.getY(i); cz += pos.getZ(i) }
  cx /= n; cy /= n; cz /= n
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0
  const step = Math.max(1, Math.floor(n / 4000))
  for (let i = 0; i < n; i += step) {
    const x = pos.getX(i) - cx, y = pos.getY(i) - cy, z = pos.getZ(i) - cz
    xx += x * x; xy += x * y; xz += x * z; yy += y * y; yz += y * z; zz += z * z
  }
  let v = new THREE.Vector3(0.3, 1, 0.2).normalize()
  for (let k = 0; k < 24; k++) {
    v = new THREE.Vector3(xx * v.x + xy * v.y + xz * v.z, xy * v.x + yy * v.y + yz * v.z, xz * v.x + yz * v.y + zz * v.z).normalize()
  }
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z }
  geometry.setAttribute('aFiber', new THREE.BufferAttribute(arr, 3))
}
