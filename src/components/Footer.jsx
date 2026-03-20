export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 z-[100] w-full bg-white">
      <div className=" px-6 pb-6 pt-3 flex items-center justify-between text-[12px] text-gray-900 select-none">
        <span>Visual Designer & Developer</span>
        <div className="flex items-center gap-2">
          <a href="mailto:ojha96p@gmail.com">Email Me</a>
          <a href="mailto:ojha96p@gmail.com" className="underline">Resume Here</a>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://www.linkedin.com/in/parmanand-ojha-b64161204/">LinkedIn</a>
          <a href="https://www.instagram.com/emelecollab/">Instagram</a>
          <a href="https://www.pinterest.com/emelecollab/">Behance</a>
        </div>
      </div>
    </footer>
  )
}

