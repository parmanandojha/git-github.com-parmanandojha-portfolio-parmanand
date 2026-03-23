import { Link } from 'react-router-dom'

export default function Nav() {
  const navText = 'select-none text-nav font-normal uppercase text-gray-900'

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white">
      <div className="mx-auto flex w-full max-w-[1800px] items-end justify-between px-5 pb-3 pt-6 md:px-8">
        <Link
          to="/catalogued-works"
          className={`${navText} link-underline-ltr max-w-[min(100%,75%)] shrink text-left no-underline`}
          aria-label="Parmanand Ojha — Catalogued works"
        >
          Parmanand Ojha
        </Link>
        <div className={`${navText} text-right`}>visual design & development</div>
      </div>
    </nav>
  )
}
