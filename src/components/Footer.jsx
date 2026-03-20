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
      <div className="px-6 pb-6 pt-3">
        <div className="grid grid-cols-1 gap-4 uppercase md:grid-cols-[1fr_auto_1fr] md:items-end md:gap-4">
          <button
            type="button"
            onClick={() => onChangePage?.('work')}
            disabled={isTransitioning}
            aria-current={page === 'work' ? 'page' : undefined}
            className="select-none text-left text-nav font-normal text-gray-900 disabled:opacity-40"
          >
            {underlineSpan('Catalogued works', page === 'work')}
          </button>

          <button
            type="button"
            onClick={() => onChangePage?.('book')}
            disabled={isTransitioning}
            aria-current={page === 'book' ? 'page' : undefined}
            className="mx-auto max-w-full select-none text-center text-nav font-normal text-gray-900 disabled:opacity-40"
          >
            {underlineSpan(`Book ${String(year).slice(-2)}`, page === 'book')}
          </button>

          <nav
            className="flex items-center justify-between gap-6 text-nav font-normal text-gray-900 select-none md:justify-self-end"
            aria-label="Site sections"
          >
            <button
              type="button"
              onClick={() => onChangePage?.('about')}
              disabled={isTransitioning}
              className="disabled:opacity-40"
            >
              {underlineSpan('Overview', page === 'about')}
            </button>
            <button
              type="button"
              onClick={() => onChangePage?.('gallery')}
              disabled={isTransitioning}
              className="disabled:opacity-40"
            >
              {underlineSpan('Selected', page === 'gallery')}
            </button>
          </nav>
        </div>
      </div>
    </footer>
  )
}
