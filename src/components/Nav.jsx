import { Link } from 'react-router-dom'

export default function Nav({ onChangePage, isTransitioning }) {
  const navText = 'select-none text-nav font-normal uppercase text-gray-900'

  return (
    <nav className="sticky top-0 z-[100] w-full bg-canvas">
      <div className="mx-auto flex w-full max-w-[1800px] items-end justify-between px-5 pb-3 pt-6 md:px-8">
        {onChangePage ? (
          <button
            type="button"
            data-cursor="view"
            onClick={() => onChangePage('work')}
            disabled={isTransitioning}
            className={`${navText} link-underline-ltr max-w-[min(100%,75%)] shrink text-left no-underline disabled:opacity-70`}
            aria-label="Parmanand Ojha — Catalogued works"
          >
            Parmanand Ojha
          </button>
        ) : (
          <Link
            to="/catalogued-works"
            className={`${navText} link-underline-ltr max-w-[min(100%,75%)] shrink text-left no-underline`}
            aria-label="Parmanand Ojha — Catalogued works"
          >
            Parmanand Ojha
          </Link>
        )}
        <div className={`${navText} text-right`}>visual design & development</div>
      </div>
    </nav>
  )
}
