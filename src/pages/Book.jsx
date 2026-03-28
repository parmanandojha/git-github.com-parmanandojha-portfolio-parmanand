/**
 * Editorial “book” spread — full viewport (no top nav on this route); Footer sits above this layer.
 */

export default function Book() {
  return (
    <section
      className="fixed inset-x-0 bottom-[14rem] top-0 z-[95] flex flex-col overflow-y-auto overscroll-y-contain bg-canvas px-5 py-5 text-gray-900 [-webkit-overflow-scrolling:touch] md:bottom-[13.5rem] md:px-8 md:py-6"
      aria-label="Catalogued works"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1800px] flex-1 flex-col">
        {/* Top — flex column (mobile) / row (desktop): contact | roles + social */}
        <div className="flex w-full min-w-0 flex-col md:flex-row md:items-start md:justify-between ">
          <header className="flex shrink-0 flex-col items-start text-[clamp(1rem,2.5vw,2rem)] pb-9 sm:pb-0">
            <p className="font-normal uppercase leading-none">+91 8700070746</p>
            <a
              href="mailto:ojha96p@gmail.com"
              className="link-underline-ltr font-normal uppercase"
            >
              ojha96p@gmail.com
            </a>
          </header>

          {/* Roles + social — flex row, links stack in a column */}
          <div className="flex w-full min-w-0 flex-row flex-wrap items-start justify-between gap-8 md:w-auto md:shrink-0 md:flex-nowrap md:items-start md:justify-end md:gap-12 lg:gap-20">
            <div className="flex shrink-0 flex-col text-caption font-normal uppercase leading-none md:text-caption-md">
              <div>
                <p>Visual designer</p>
                <p>& developer</p>
              </div>
              <div className="pt-2">
                <p>Digital</p>
                <p>experiences</p>
              </div>
            </div>
            <nav
              className="flex shrink-0 flex-col items-start gap-1 text-caption font-normal uppercase md:items-end md:text-caption-md"
              aria-label="Social"
            >
              <a
                href="https://www.linkedin.com/in/parmanand-ojha-b64161204/"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline-ltr"
              >
                LinkedIn
              </a>
              <a
                href="https://www.instagram.com/emelecollab/"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline-ltr"
              >
                Instagram
              </a>
              <a
                href="https://www.behance.net/emelecollab"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline-ltr"
              >
                Behance
              </a>
            </nav>
          </div>
        </div>

        {/* Center — title block */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-6 text-center md:py-10 lg:py-14 text-[clamp(2rem,7vw,4.5rem)]">
            <h1 className="flex flex-col items-center gap-1 uppercase">
              <span className=" font-normal leading-none">
                Catalogued
              </span>
              <span className="display-condensed leading-none ">
                Works
              </span>
              <span className="  font-normal leading-none">
                Parmanand Ojha
              </span>
              <span className=" font-normal ">
                C.{new Date().getFullYear()}
              </span>
            </h1>
        </div>
      </div>
    </section>
  )
}
