import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Neutral checker — stretched with pixelated rendering when the real asset fails (404, etc.). */
const ERROR_PIXEL_BG = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" shape-rendering="crispEdges">' +
    '<rect width="4" height="4" fill="#c9c8bf"/><rect x="4" width="4" height="4" fill="#dddcd3"/>' +
    '<rect y="4" width="4" height="4" fill="#dddcd3"/><rect x="4" y="4" width="4" height="4" fill="#b8b7ae"/>' +
    '</svg>'
)}")`

/**
 * While the full image loads, shows a blocky downscaled preview (same asset, canvas LQIP).
 * Fades in the sharp image on load.
 */
export default function ProgressivePixelImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  draggable,
  /** Longer side of the downscaled canvas — higher = finer “pixels”, slightly larger LQIP. */
  maxPixelDim = 54,
  /** `cover`: fill parent (h-full w-full). `intrinsic`: height from image (e.g. project figures). */
  variant = 'cover',
}) {
  /** LQIP data URL + original dimensions so layout aspect matches the sharp image. */
  const [pixelPreview, setPixelPreview] = useState(null)
  const [fullLoaded, setFullLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const mainImgRef = useRef(null)

  // Cached images often finish before `onLoad` fires — sync from `complete` after src commits.
  useLayoutEffect(() => {
    if (!src) return
    setFailed(false)

    const img = mainImgRef.current
    const alreadyDecoded = Boolean(img?.complete && img.naturalHeight > 0)
    setFullLoaded(alreadyDecoded)
  }, [src])

  useEffect(() => {
    if (!src) return
    setPixelPreview(null)

    let cancelled = false
    const im = new Image()
    im.onload = () => {
      if (cancelled) return
      try {
        const nw = im.naturalWidth || 1
        const nh = im.naturalHeight || 1
        let cw = maxPixelDim
        let ch = Math.round((maxPixelDim * nh) / nw)
        if (ch > maxPixelDim) {
          ch = maxPixelDim
          cw = Math.round((maxPixelDim * nw) / nh)
        }
        cw = Math.max(1, cw)
        ch = Math.max(1, ch)
        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(im, 0, 0, cw, ch)
        setPixelPreview({
          src: canvas.toDataURL('image/jpeg', 0.55),
          natW: nw,
          natH: nh,
        })
      } catch {
        /* CORS-tainted canvas etc. — skip pixel preview */
      }
    }
    im.onerror = () => {}
    im.src = src

    return () => {
      cancelled = true
    }
  }, [src, maxPixelDim])

  const showPixel = Boolean(pixelPreview && !fullLoaded && !failed)
  const showErrorPixel = failed
  const rootClass =
    variant === 'intrinsic'
      ? ['relative w-full overflow-hidden', className].filter(Boolean).join(' ')
      : ['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      {showPixel ? (
        <img
          src={pixelPreview.src}
          width={pixelPreview.natW}
          height={pixelPreview.natH}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover [image-rendering:pixelated]"
          style={{ imageRendering: 'pixelated' }}
          aria-hidden
          draggable={false}
        />
      ) : null}
      {showErrorPixel ? (
        <div
          className={[
            'pointer-events-none select-none [image-rendering:pixelated]',
            variant === 'intrinsic'
              ? 'relative block min-h-[14rem] w-full'
              : 'absolute inset-0 h-full w-full',
          ].join(' ')}
          style={{
            imageRendering: 'pixelated',
            backgroundImage: ERROR_PIXEL_BG,
            backgroundSize: '34px 34px',
          }}
          role="img"
          aria-label={alt}
        />
      ) : (
        <img
          ref={mainImgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          draggable={draggable}
          onLoad={() => setFullLoaded(true)}
          onError={() => {
            setFailed(true)
            setFullLoaded(true)
          }}
          className={[
            imgClassName,
            variant === 'intrinsic' ? 'relative block w-full' : '',
            fullLoaded ? 'opacity-100' : 'opacity-0',
            'transition-opacity duration-300 ease-out',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}
    </div>
  )
}
