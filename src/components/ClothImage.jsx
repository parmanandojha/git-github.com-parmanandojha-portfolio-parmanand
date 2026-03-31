import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getPreloadedHtmlImage } from '../utils/imagePreloadCache.js'
import { getLenis } from '../utils/lenisBridge.js'

/*
 * UV-only distortion — zero vertex displacement, so nothing ever leaves the canvas.
 * The image texture warps in place like fabric printed on cloth.
 */
const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float     uTime;
  uniform float     uVelocity;
  uniform float     uReveal;
  varying vec2      vUv;

  #define PI 3.14159265

  void main() {
    /* pin = 0 at all four edges → 1 at centre; prevents border tearing */
    float pin = sin(vUv.x * PI) * sin(vUv.y * PI);

    /* always-on ambient sway */
    float ax = sin(vUv.y * PI * 4.5 + uTime * 0.18) * 0.0005 * pin;
    float ay = sin(vUv.x * PI * 3.5 - uTime * 0.14) * 0.0003 * pin;

    /* scroll-reactive cloth wave */
    float wx = sin(vUv.y * PI * 3.2 + uTime * 1.1) * uVelocity * 0.006 * pin;
    float wy = sin(vUv.x * PI * 2.6 - uTime * 0.85 + vUv.y * PI) * uVelocity * 0.004 * pin;

    vec2 uv = clamp(vUv + vec2(ax + wx, ay + wy), 0.001, 0.999);
    vec4 col = texture2D(uTexture, uv);

    gl_FragColor = vec4(col.rgb, col.a * uReveal);
  }
`

export default function ClothImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  loading,
  fetchPriority,
  decoding,
  draggable,
  variant,
}) {
  const wrapRef = useRef(null)
  const [glActive, setGlActive] = useState(false)

  useEffect(() => {
    if (window.innerWidth < 768) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const wrap = wrapRef.current
    if (!wrap) return

    /* ── renderer ───────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping

    const setSize = () => {
      const w = wrap.offsetWidth, h = wrap.offsetHeight
      if (w && h) renderer.setSize(w, h)
    }
    setSize()

    const cvs = renderer.domElement
    cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
    wrap.appendChild(cvs)

    /* ── scene (ortho, single quad — no subdivision needed) ─────── */
    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const geo = new THREE.PlaneGeometry(2, 2)   // 1 quad, UV distortion only
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      toneMapped:  false,
      uniforms: {
        uTexture:  { value: null },
        uTime:     { value: 0 },
        uVelocity: { value: 0 },
        uReveal:   { value: 0 },
      },
      vertexShader:   vert,
      fragmentShader: frag,
    })
    scene.add(new THREE.Mesh(geo, mat))

    /* ── texture (preloader cache → Texture, else loader) ─────── */
    let loaded = false
    const applyTex = (tex) => {
      tex.colorSpace = THREE.LinearSRGBColorSpace
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.needsUpdate = true
      mat.uniforms.uTexture.value = tex
      loaded = true
      setGlActive(true)
    }

    const cachedImg = getPreloadedHtmlImage(src)
    if (cachedImg) {
      applyTex(new THREE.Texture(cachedImg))
    } else {
      new THREE.TextureLoader().load(src, (tex) => {
        applyTex(tex)
      })
    }

    /* ── scroll velocity ────────────────────────────────────────── */
    let targetVel = 0, smoothVel = 0
    const onScroll = ({ velocity }) => {
      targetVel = Math.min(Math.max(velocity * 0.012, -1), 1)
    }
    let lenis = getLenis()
    let retry = null
    const attach = (l) => { if (l) l.on('scroll', onScroll) }
    if (lenis) attach(lenis)
    else retry = setTimeout(() => { lenis = getLenis(); attach(lenis) }, 200)

    /* ── pause when off-screen ──────────────────────────────────── */
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '150px' })
    io.observe(wrap)

    const ro = new ResizeObserver(setSize)
    ro.observe(wrap)

    /* ── loop ───────────────────────────────────────────────────── */
    const clock = new THREE.Clock()
    let raf

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return

      smoothVel += (targetVel - smoothVel) * 0.07
      targetVel *= 0.88

      mat.uniforms.uTime.value     = clock.getElapsedTime()
      mat.uniforms.uVelocity.value = smoothVel
      mat.uniforms.uReveal.value  += ((loaded ? 1 : 0) - mat.uniforms.uReveal.value) * 0.10

      renderer.render(scene, camera)
    }
    tick()

    /* ── cleanup ────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(retry)
      io.disconnect()
      ro.disconnect()
      if (lenis) lenis.off('scroll', onScroll)
      geo.dispose()
      mat.dispose()
      mat.uniforms.uTexture.value?.dispose()
      renderer.dispose()
      if (wrap.contains(cvs)) wrap.removeChild(cvs)
      setGlActive(false)
    }
  }, [src])

  return (
    <div ref={wrapRef} className={`relative w-full overflow-hidden ${className}`}>
      {/* Always in DOM — provides layout height + screen-reader alt */}
      <img
        src={src}
        alt={alt}
        className={[
          imgClassName,
          variant === 'intrinsic' ? 'relative block w-full' : 'h-full w-full',
          glActive ? 'opacity-0' : '',
        ].filter(Boolean).join(' ')}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        draggable={draggable}
      />
    </div>
  )
}
