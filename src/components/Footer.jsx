export default function Footer({ page, onChangePage, isTransitioning }) {
  const year = new Date().getFullYear()
  const onCatalogue = page === 'work' || page === 'project'

  /** One size for every footer control (matches `text-nav` at lg+, slightly smaller on narrow screens). */
  const footerLabel =
    'text-[clamp(0.625rem,2.5vw,0.75rem)] font-normal leading-tight text-gray-900 uppercase select-none lg:text-nav'

  const underlineSpan = (label, isActive) => (
    <span
      className={[
        'link-underline-ltr uppercase',
        isActive ? 'link-underline-ltr--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  )

  /** Shared button chrome — typography comes from `footerLabel` only. */
  const btn =
    `m-0 p-0 ${footerLabel} disabled:opacity-40`

  return (
    <footer className="fixed bottom-0 left-0 z-[100] w-full bg-white uppercase">
      <div className="px-5 pb-6 pt-3 md:px-8">
        <div className="mx-auto w-full max-w-[1800px]">
          {/*
            Mobile: Book truly centered (absolute), Catalogue left, Overview+Selected right.
          */}
          <div
            className="relative flex min-h-[1.35rem] w-full items-end justify-between lg:hidden"
            aria-label="Site sections"
          >
            <button
              type="button"
              onClick={() => onChangePage?.('work')}
              disabled={isTransitioning}
              aria-current={onCatalogue ? 'page' : undefined}
              className={`${btn} relative z-[1] min-w-0 max-w-[32%] shrink text-left`}
            >
              {underlineSpan('Catalogued works', onCatalogue)}
            </button>

            <button
              type="button"
              onClick={() => onChangePage?.('book')}
              disabled={isTransitioning}
              aria-current={page === 'book' ? 'page' : undefined}
              className={`${btn} absolute bottom-0 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap text-center`}
            >
              {underlineSpan(`Book ${String(year).slice(-2)}`, page === 'book')}
            </button>

            <div className="relative z-[1] flex shrink-0 flex-row flex-nowrap items-end gap-3">
              <button
                type="button"
                onClick={() => onChangePage?.('about')}
                disabled={isTransitioning}
                className={`${btn} text-left`}
              >
                {underlineSpan('Overview', page === 'about')}
              </button>
              <button
                type="button"
                onClick={() => onChangePage?.('gallery')}
                disabled={isTransitioning}
                className={`${btn} text-left`}
              >
                {underlineSpan('Selected', page === 'gallery')}
              </button>
            </div>
          </div>

          {/*
            lg+: Book centered in the bar (absolute), Catalogue left, Overview+Selected right.
          */}
          <div className="relative hidden min-h-[1.35rem] w-full items-end lg:flex">
            <button
              type="button"
              onClick={() => onChangePage?.('work')}
              disabled={isTransitioning}
              aria-current={onCatalogue ? 'page' : undefined}
              className={`${btn} relative z-[1] min-w-0 max-w-[min(40%,22rem)] shrink text-left`}
            >
              {underlineSpan('Catalogued works', onCatalogue)}
            </button>

            <button
              type="button"
              onClick={() => onChangePage?.('book')}
              disabled={isTransitioning}
              aria-current={page === 'book' ? 'page' : undefined}
              className={`${btn} absolute bottom-0 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap text-center`}
            >
              {underlineSpan(`Book ${String(year).slice(-2)}`, page === 'book')}
            </button>

            <nav
              className="relative z-[1] ml-auto flex shrink-0 flex-row flex-nowrap items-end justify-end gap-12 xl:gap-20"
              aria-label="Site sections"
            >
              <button
                type="button"
                onClick={() => onChangePage?.('about')}
                disabled={isTransitioning}
                className={`${btn} text-left`}
              >
                {underlineSpan('Overview', page === 'about')}
              </button>
              <button
                type="button"
                onClick={() => onChangePage?.('gallery')}
                disabled={isTransitioning}
                className={`${btn} text-left`}
              >
                {underlineSpan('Selected', page === 'gallery')}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
