export default function Nav({ page, onChangePage, isTransitioning }) {
  return (
    <nav className="w-full bg-white sticky top-0 z-[100]">
      <div className=" px-6 pt-6 pb-3 flex items-start justify-between shrink-0">
        <div className="text-[12px] text-gray-900 select-none">
          Parmanand Ojha
        </div>

        <div className="text-[12px] text-gray-900 select-none">
          <button
            type="button"
            onClick={() => onChangePage('about')}
            disabled={isTransitioning}
            className={page === 'about' ? 'font-bold' : 'font-medium'}
          >
            About
          </button>
          <span className="px-2">/</span>
          <button
            type="button"
            onClick={() => onChangePage('work')}
            disabled={isTransitioning}
            className={page === 'work' ? 'font-bold' : 'font-medium'}
          >
            Work
          </button>
          <span className="px-2">/</span>
          <button
            type="button"
            onClick={() => onChangePage('gallery')}
            disabled={isTransitioning}
            className={page === 'gallery' ? 'font-bold' : 'font-medium'}
          >
            Gallery
          </button>
        </div>
      </div>
    </nav>
  )
}

