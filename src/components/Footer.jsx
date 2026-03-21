export default function Footer({ page, onChangePage, isTransitioning }) {
  const year = new Date().getFullYear()

  const underlineSpan = (label, isActive) => (
    <span
      className={[
        'link-underline-ltr',
        isActive ? 'link-underline-ltr--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  )

  return (
    <footer className="fixed bottom-0 left-0 z-[100] w-full bg-white">
      <div className="px-4 pb-6 pt-3 md:px-6">
        {/*
          Mobile: one row — catalogue | book | overview + selected
          md+: same three-column grid, more spacing
        */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 uppercase md:gap-4">
          <button
            type="button"
            onClick={() => onChangePage?.('work')}
            disabled={isTransitioning}
            aria-current={page === 'work' ? 'page' : undefined}
            className="min-w-0 select-none text-left text-[clamp(0.625rem,2.8vw,0.75rem)] font-normal leading-tight text-gray-900 disabled:opacity-40 md:text-nav"
          >
            {underlineSpan('Catalogued works', page === 'work')}
          </button>

          <button
            type="button"
            onClick={() => onChangePage?.('book')}
            disabled={isTransitioning}
            aria-current={page === 'book' ? 'page' : undefined}
            className="shrink-0 select-none text-center text-[clamp(0.625rem,2.8vw,0.75rem)] font-normal leading-tight text-gray-900 disabled:opacity-40 md:text-nav"
          >
            {underlineSpan(`Book ${String(year).slice(-2)}`, page === 'book')}
          </button>

          <nav
            className="flex min-w-0 items-center justify-end gap-2 text-[clamp(0.625rem,2.8vw,0.75rem)] font-normal text-gray-900 select-none md:gap-6 md:text-nav"
            aria-label="Site sections"
          >
            <button
              type="button"
              onClick={() => onChangePage?.('about')}
              disabled={isTransitioning}
              className="shrink-0 disabled:opacity-40"
            >
              {underlineSpan('Overview', page === 'about')}
            </button>
            <button
              type="button"
              onClick={() => onChangePage?.('gallery')}
              disabled={isTransitioning}
              className="shrink-0 disabled:opacity-40"
            >
              {underlineSpan('Selected', page === 'gallery')}
            </button>
          </nav>
        </div>
      </div>
    </footer>
  )
}
