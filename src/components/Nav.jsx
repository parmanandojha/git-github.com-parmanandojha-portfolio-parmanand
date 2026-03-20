export default function Nav() {
  const navText = 'select-none text-nav font-normal uppercase text-gray-900'

  return (
    <nav className="sticky top-0 z-[100] w-full bg-white">
      <div className="flex items-end justify-between px-6 pb-3 pt-6">
        <div className={navText}>Parmanand Ojha</div>
        <div className={`${navText} text-right`}>visual design & development</div>
      </div>
    </nav>
  )
}
