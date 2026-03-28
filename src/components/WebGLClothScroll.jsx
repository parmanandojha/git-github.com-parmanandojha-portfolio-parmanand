import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getLenis } from '../utils/lenisBridge.js'

/* ─── tunables ────────────────────────────────────────────────────────────── */
const SEGS  = 48
const BASE  = '#e9e8df'
const DARK  = '#a9a89e'   // shadow troughs — clearly darker

/* ─── vertex shader ──────────────────────────────────────────────────────── */
const vert = /* glsl */ `
  uniform float uTime;
  uniform float uVelocity;

  varying vec3  vNorm;

  void main() {
    vec3 p = position;
    float v = uVelocity;

    /* always-on fabric drape — two overlapping slow waves */
    float a1 = sin(uv.x * 4.8 + uTime * 0.21) * cos(uv.y * 3.6 - uTime * 0.17) * 0.055;
    float a2 = sin(uv.x * 9.5 - uTime * 0.31 + uv.y * 7.2)                     * 0.022;
    float amb = a1 + a2;

    /* scroll-reactive ripple (3 octaves) */
    float r1 = sin(uv.x * 8.0  + uTime * 0.9 ) * cos(uv.y * 6.0  - uTime * 0.65);
    float r2 = sin(uv.x * 16.0 - uTime * 1.5  + uv.y * 10.0)                    * 0.55;
    float r3 = cos((uv.x + uv.y) * 13.0       + uTime * 1.2 )                   * 0.30;
    float rip = (r1 + r2 + r3) * abs(v) * 0.11;

    float dz = amb + rip;
    p.z += dz;

    /* ── surface normal (analytic derivatives) ──────────────────────── */
    // d(amb)/dx
    float dadx = cos(uv.x * 4.8 + uTime * 0.21) * cos(uv.y * 3.6 - uTime * 0.17) * 4.8  * 0.055
               + cos(uv.x * 9.5 - uTime * 0.31 + uv.y * 7.2)                     * 9.5  * 0.022;
    // d(rip)/dx  
    float drdx = cos(uv.x * 8.0  + uTime * 0.9 ) * cos(uv.y * 6.0  - uTime * 0.65) * 8.0  * abs(v) * 0.11
               + cos(uv.x * 16.0 - uTime * 1.5  + uv.y * 10.0)                    * 16.0 * abs(v) * 0.11 * 0.55
               - sin((uv.x + uv.y) * 13.0       + uTime * 1.2 )                   * 13.0 * abs(v) * 0.11 * 0.30;

    // d(amb)/dy
    float dady = sin(uv.x * 4.8 + uTime * 0.21) * (-sin(uv.y * 3.6 - uTime * 0.17)) * 3.6 * 0.055
               + cos(uv.x * 9.5 - uTime * 0.31 + uv.y * 7.2)                        * 7.2 * 0.022;
    // d(rip)/dy
    float drdy = sin(uv.x * 8.0  + uTime * 0.9 ) * (-sin(uv.y * 6.0  - uTime * 0.65)) * 6.0  * abs(v) * 0.11
               + cos(uv.x * 16.0 - uTime * 1.5  + uv.y * 10.0)                        * 10.0 * abs(v) * 0.11 * 0.55
               - sin((uv.x + uv.y) * 13.0       + uTime * 1.2 )                        * 13.0 * abs(v) * 0.11 * 0.30;

    vNorm = normalize(vec3(-(dadx + drdx), -(dady + drdy), 1.0));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

/* ─── fragment shader ────────────────────────────────────────────────────── */
const frag = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uDark;

  varying vec3 vNorm;

  void main() {
    /* key light — high and slightly to the right */
    vec3 L     = normalize(vec3(0.4, 0.9, 1.0));
    float diff = max(dot(vNorm, L), 0.0);

    /* fill light from below to soften shadows */
    vec3 Lf    = normalize(vec3(-0.2, -0.5, 0.6));
    float fill = max(dot(vNorm, Lf), 0.0) * 0.25;

    float light = 0.20 + diff * 0.65 + fill;
    vec3  col   = mix(uDark, uBase, clamp(light, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
  }
`

/* ─── component ──────────────────────────────────────────────────────────── */
export default function WebGLClothScroll() {
  const mountRef = useRef(null)

  useEffect(() => {
    if (window.innerWidth < 768) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = mountRef.current
    if (!el) return

    /* ── renderer ─────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(new THREE.Color(BASE), 1)
    el.appendChild(renderer.domElement)

    /* ── scene ────────────────────────────────────────────────────── */
    const scene = new THREE.Scene()

    /*
     * Perspective camera looking straight at the plane.
     * We size the plane so it always fills the viewport exactly:
     *   visible_height = 2 * tan(fov/2) * camera_z
     *   → camera_z = 1 / tan(fov/2)  when plane height = 2
     */
    const FOV   = 55   // degrees
    const CAM_Z = 1 / Math.tan((FOV / 2) * (Math.PI / 180))
    const W = window.innerWidth, H = window.innerHeight

    const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.01, 100)
    camera.position.z = CAM_Z

    /* plane sized to fill viewport at z=0 */
    const planeH = 2
    const planeW = planeH * (W / H)
    const geo    = new THREE.PlaneGeometry(planeW, planeH, SEGS, SEGS)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:     { value: 0 },
        uVelocity: { value: 0 },
        uBase:     { value: new THREE.Color(BASE) },
        uDark:     { value: new THREE.Color(DARK) },
      },
      vertexShader:   vert,
      fragmentShader: frag,
    })

    scene.add(new THREE.Mesh(geo, mat))

    /* ── scroll velocity via Lenis ────────────────────────────────── */
    let targetVel = 0, smoothVel = 0

    const onScroll = ({ velocity }) => { targetVel = velocity * 0.013 }

    let lenis = getLenis()
    let retry = null
    const attach = (l) => { if (l) l.on('scroll', onScroll) }
    if (lenis) attach(lenis)
    else retry = setTimeout(() => { lenis = getLenis(); attach(lenis) }, 200)

    /* ── resize ───────────────────────────────────────────────────── */
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    /* ── loop ─────────────────────────────────────────────────────── */
    const clock = new THREE.Clock()
    let raf

    const tick = () => {
      raf = requestAnimationFrame(tick)
      smoothVel  += (targetVel - smoothVel) * 0.06
      targetVel  *= 0.87
      mat.uniforms.uTime.value     = clock.getElapsedTime()
      mat.uniforms.uVelocity.value = smoothVel
      renderer.render(scene, camera)
    }
    tick()

    /* ── cleanup ──────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(retry)
      if (lenis) lenis.off('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      geo.dispose(); mat.dispose(); renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  )
}
