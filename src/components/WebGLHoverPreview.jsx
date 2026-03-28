import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getPreloadedHtmlImage } from '../utils/imagePreloadCache.js'

const vertexShader = `
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
`

const fragmentShader = `
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
`

export default function WebGLHoverPreview({ imageUrl, visible, cursor }) {
  const mountRef = useRef(null)
  const cursorRef = useRef(cursor)
  const visibleRef = useRef(visible)
  const stateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    mesh: null,
    material: null,
    frameId: 0,
    currentX: 0,
    currentY: 0,
    reveal: 0,
    motion: 0,
    motionTarget: 0,
  })

  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    /* Match browser / <img> appearance — default ACES tone mapping darkens photos */
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping
    renderer.toneMappingExposure = 1
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      1,
      2000
    )
    camera.position.z = 1000

    const geometry = new THREE.PlaneGeometry(560, 360, 56, 36)
    const emptyTexture = new THREE.Texture()
    const material = new THREE.ShaderMaterial({
      transparent: true,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: emptyTexture },
        uReveal: { value: 0 },
        uMotion: { value: 0 },
        uMouseNorm: { value: new THREE.Vector2(0.5, 0.5) },
      },
      vertexShader,
      fragmentShader,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    stateRef.current = {
      ...stateRef.current,
      renderer,
      scene,
      camera,
      mesh,
      material,
    }

    const onResize = () => {
      const s = stateRef.current
      if (!s.renderer || !s.camera) return
      s.renderer.setSize(window.innerWidth, window.innerHeight)
      s.camera.left = window.innerWidth / -2
      s.camera.right = window.innerWidth / 2
      s.camera.top = window.innerHeight / 2
      s.camera.bottom = window.innerHeight / -2
      s.camera.updateProjectionMatrix()
    }

    window.addEventListener('resize', onResize)

    let lastScrollY = window.scrollY
    const onScroll = () => {
      const s = stateRef.current
      const delta = Math.abs(window.scrollY - lastScrollY)
      lastScrollY = window.scrollY
      s.motionTarget = Math.min(1, s.motionTarget + Math.min(delta / 140, 0.22))
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const timer = new THREE.Timer()
    let prevCursorX = cursorRef.current.x
    let prevCursorY = cursorRef.current.y
    const animate = () => {
      const s = stateRef.current
      if (!s.renderer || !s.scene || !s.camera || !s.mesh || !s.material) return

      timer.update()
      const t = timer.getElapsed()
      s.material.uniforms.uTime.value = t

      const c = cursorRef.current
      const moveDelta = Math.hypot(c.x - prevCursorX, c.y - prevCursorY)
      prevCursorX = c.x
      prevCursorY = c.y
      s.motionTarget = Math.min(1, s.motionTarget + Math.min(moveDelta / 110, 0.2))

      const targetX = c.x - window.innerWidth / 2 - 300
      const targetY = window.innerHeight / 2 - c.y + 28
      s.currentX += (targetX - s.currentX) * 0.14
      s.currentY += (targetY - s.currentY) * 0.14

      s.mesh.position.x = s.currentX
      s.mesh.position.y = s.currentY
      s.mesh.rotation.z = (targetX - s.currentX) * 0.0008

      const nx = Math.min(Math.max(c.x / window.innerWidth, 0), 1)
      const ny = Math.min(Math.max(c.y / window.innerHeight, 0), 1)
      s.material.uniforms.uMouseNorm.value.set(nx, ny)

      s.reveal += ((visibleRef.current ? 1 : 0) - s.reveal) * 0.12
      s.motionTarget *= 0.9
      s.motion += (s.motionTarget - s.motion) * 0.15
      s.material.uniforms.uReveal.value = s.reveal
      s.material.uniforms.uMotion.value = s.motion

      s.renderer.render(s.scene, s.camera)
      s.frameId = requestAnimationFrame(animate)
    }

    stateRef.current.frameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(stateRef.current.frameId)
      timer.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const s = stateRef.current
    if (!s.material || !imageUrl) return

    let cancelled = false
    const prevTex = s.material.uniforms.uTexture.value

    const applyTexture = (texture) => {
      if (cancelled) {
        texture.dispose()
        return
      }
      texture.colorSpace = THREE.LinearSRGBColorSpace
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = true
      texture.needsUpdate = true
      if (prevTex && prevTex.isTexture && prevTex.image && prevTex !== texture) {
        prevTex.dispose()
      }
      s.material.uniforms.uTexture.value = texture
    }

    const cached = getPreloadedHtmlImage(imageUrl)
    if (cached) {
      applyTexture(new THREE.Texture(cached))
      return () => {
        cancelled = true
      }
    }

    const loader = new THREE.TextureLoader()
    loader.load(
      imageUrl,
      (texture) => applyTexture(texture),
      undefined,
      () => {}
    )

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none z-10 hidden md:block" />
}

