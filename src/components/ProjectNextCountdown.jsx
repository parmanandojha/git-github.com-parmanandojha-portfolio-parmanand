import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const ACCENT = '#7f7954'
const R = 46
const C = 2 * Math.PI * R

/**
 * Full-page scroll reached “next project” — ring fills clockwise at pointer; center × cancels.
 * Desktop: follows cursor. Touch: fixed above bottom safe area.
 */
export default function ProjectNextCountdown({ open, progress, x, y, onCancel, nextTitle }) {
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const sync = () => setTouch(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!open) return
    if (window.matchMedia('(hover: none)').matches) return
    const prev = document.body.style.cursor
    document.body.style.cursor = 'none'
    return () => {
      document.body.style.cursor = prev
    }
  }, [open])

  if (!open) return null

  const dashOffset = C * (1 - progress)
  const positionStyle = touch
    ? {
        left: '50%',
        bottom: 'max(7.75rem, calc(env(safe-area-inset-bottom, 0px) + 6.25rem))',
        transform: 'translateX(-50%)',
      }
    : {
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }

  const tree = (
    <div
      className="pointer-events-none fixed z-[10050] flex flex-col items-center gap-1"
      style={positionStyle}
      role="status"
      aria-live="polite"
      aria-label={`Loading next project: ${nextTitle ?? ''}. Press center button to stay on this page.`}
    >
      {/*
        data-lenis-prevent: Lenis touch handling otherwise eats taps after scroll (mobile).
        Portal to body: keeps stacking above main/footer without ancestor clipping.
      */}
      <div
        className="pointer-events-auto relative flex h-[120px] w-[120px] items-center justify-center"
        data-lenis-prevent
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          className="absolute inset-0 -rotate-90"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={ACCENT}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
          />
        </svg>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onCancel()
          }}
          className="relative z-[1] flex min-h-12 min-w-12 touch-manipulation items-center justify-center bg-transparent p-0 text-gray-900 transition-opacity duration-300 ease-out hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          aria-label="Cancel — stay on this project"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            className="pointer-events-none shrink-0 text-gray-900"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 3l8 8M11 3L3 11"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <p className="pointer-events-none max-w-[14rem] text-center text-sm font-normal uppercase tracking-[0.14em] text-neutral-500">
        Next · {nextTitle}
      </p>
    </div>
  )

  return typeof document !== 'undefined' && document.body
    ? createPortal(tree, document.body)
    : null
}
