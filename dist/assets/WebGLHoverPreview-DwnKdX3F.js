import{r as e,t}from"./jsx-runtime-DAs1UGHr.js";import{t as n}from"./react-BRPyh-lz.js";import{a as r,b as i,c as a,d as o,f as s,h as c,i as l,l as u,m as d,n as f,o as p,p as m,s as h,u as g}from"./index-DEXoSVWb.js";var _=e(n(),1),v=t(),y=`
uniform float uTime;
uniform vec2 uMouseNorm;
uniform float uReveal;
uniform float uMotion;
varying vec2 vUv;
varying float vRipple;

void main() {
  vUv = uv;
  vec3 p = position;

  vec2 m = vec2(uMouseNorm.x, 1.0 - uMouseNorm.y);
  float d = distance(uv, m);
  float ring = sin((d * 60.0) - (uTime * 7.0));
  float falloff = exp(-d * 7.0);
  float ripple = ring * falloff;

  float drift = sin((uv.x * 14.0 + uTime * 1.1)) * cos((uv.y * 12.0 - uTime * 0.9));
  p.z += (ripple * 18.0 + drift * 3.5) * uMotion;
  p.x += sin((uv.y * 16.0) + (uTime * 1.7)) * 1.6 * uMotion;
  p.y += cos((uv.x * 13.0) - (uTime * 1.4)) * 1.2 * uMotion;
  vRipple = ripple;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`,b=`
uniform sampler2D uTexture;
uniform float uReveal;
uniform float uTime;
uniform float uMotion;
varying vec2 vUv;
varying float vRipple;

void main() {
  vec2 m = vec2(0.5, 0.5);
  vec2 dv = vUv - m;
  float d = length(dv);
  vec2 dir = d > 0.0001 ? normalize(dv) : vec2(0.0);

  // Water-like radial refraction around center + subtle global wave.
  float radial = sin((d * 70.0) - (uTime * 7.5)) * exp(-d * 8.5);
  vec2 uv = vUv;
  uv += dir * radial * 0.018 * uMotion;
  uv.x += sin((uv.y * 18.0) + (uTime * 2.2)) * 0.0028 * uMotion;
  uv.y += cos((uv.x * 22.0) - (uTime * 1.9)) * 0.0022 * uMotion;

  vec4 tex = texture2D(uTexture, uv);

  // Tiny shimmer from ripple energy (no color tint).
  float shimmer = 1.0 + (vRipple * 0.045 * uMotion);
  tex.rgb *= clamp(shimmer, 0.94, 1.06);

  gl_FragColor = vec4(tex.rgb, tex.a * uReveal);
}
`;function x({imageUrl:e,visible:t,cursor:n}){let x=(0,_.useRef)(null),S=(0,_.useRef)(n),C=(0,_.useRef)(t),w=(0,_.useRef)({renderer:null,scene:null,camera:null,mesh:null,material:null,frameId:0,currentX:0,currentY:0,reveal:0,motion:0,motionTarget:0});return(0,_.useEffect)(()=>{S.current=n},[n]),(0,_.useEffect)(()=>{C.current=t},[t]),(0,_.useEffect)(()=>{let e=x.current;if(!e)return;let t=new f({alpha:!0,antialias:!0});t.setPixelRatio(Math.min(window.devicePixelRatio,2)),t.setSize(window.innerWidth,window.innerHeight),t.outputColorSpace=p,t.toneMapping=0,t.toneMappingExposure=1,e.appendChild(t.domElement);let n=new g,r=new a(window.innerWidth/-2,window.innerWidth/2,window.innerHeight/2,window.innerHeight/-2,1,2e3);r.position.z=1e3;let i=new u(560,360,56,36),l=new o({transparent:!0,toneMapped:!1,uniforms:{uTime:{value:0},uTexture:{value:new s},uReveal:{value:0},uMotion:{value:0},uMouseNorm:{value:new c(.5,.5)}},vertexShader:y,fragmentShader:b}),m=new h(i,l);n.add(m),w.current={...w.current,renderer:t,scene:n,camera:r,mesh:m,material:l};let _=()=>{let e=w.current;!e.renderer||!e.camera||(e.renderer.setSize(window.innerWidth,window.innerHeight),e.camera.left=window.innerWidth/-2,e.camera.right=window.innerWidth/2,e.camera.top=window.innerHeight/2,e.camera.bottom=window.innerHeight/-2,e.camera.updateProjectionMatrix())};window.addEventListener(`resize`,_);let v=window.scrollY,T=()=>{let e=w.current,t=Math.abs(window.scrollY-v);v=window.scrollY,e.motionTarget=Math.min(1,e.motionTarget+Math.min(t/140,.22))};window.addEventListener(`scroll`,T,{passive:!0});let E=new d,D=S.current.x,O=S.current.y,k=()=>{let e=w.current;if(!e.renderer||!e.scene||!e.camera||!e.mesh||!e.material)return;E.update();let t=E.getElapsed();e.material.uniforms.uTime.value=t;let n=S.current,r=Math.hypot(n.x-D,n.y-O);D=n.x,O=n.y,e.motionTarget=Math.min(1,e.motionTarget+Math.min(r/110,.2));let i=n.x-window.innerWidth/2-300,a=window.innerHeight/2-n.y+28;e.currentX+=(i-e.currentX)*.14,e.currentY+=(a-e.currentY)*.14,e.mesh.position.x=e.currentX,e.mesh.position.y=e.currentY,e.mesh.rotation.z=(i-e.currentX)*8e-4;let o=Math.min(Math.max(n.x/window.innerWidth,0),1),s=Math.min(Math.max(n.y/window.innerHeight,0),1);e.material.uniforms.uMouseNorm.value.set(o,s),e.reveal+=((C.current?1:0)-e.reveal)*.12,e.motionTarget*=.9,e.motion+=(e.motionTarget-e.motion)*.15,e.material.uniforms.uReveal.value=e.reveal,e.material.uniforms.uMotion.value=e.motion,e.renderer.render(e.scene,e.camera),e.frameId=requestAnimationFrame(k)};return w.current.frameId=requestAnimationFrame(k),()=>{window.removeEventListener(`resize`,_),window.removeEventListener(`scroll`,T),cancelAnimationFrame(w.current.frameId),E.dispose(),i.dispose(),l.dispose(),t.dispose(),e.contains(t.domElement)&&e.removeChild(t.domElement)}},[]),(0,_.useEffect)(()=>{let t=w.current;if(!t.material||!e)return;let n=!1,a=t.material.uniforms.uTexture.value,o=e=>{if(n){e.dispose();return}e.colorSpace=p,e.minFilter=r,e.magFilter=l,e.generateMipmaps=!0,e.needsUpdate=!0,a&&a.isTexture&&a.image&&a!==e&&a.dispose(),t.material.uniforms.uTexture.value=e},c=i(e);return c?(o(new s(c)),()=>{n=!0}):(new m().load(e,e=>o(e),void 0,()=>{}),()=>{n=!0})},[e]),(0,v.jsx)(`div`,{ref:x,className:`fixed inset-0 pointer-events-none z-10 hidden md:block`})}export{x as default};