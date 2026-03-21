/**
 * Editorial “book” spread — full viewport (no top nav on this route); Footer sits above this layer.
 */

export default function Book() {
  return (
    <section
      className="fixed inset-x-0 bottom-[14rem] top-0 z-[95] flex flex-col overflow-y-auto bg-white px-5 py-5 text-gray-900 md:bottom-[13.5rem] md:px-8 md:py-6"
      aria-label="Catalogued works"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1800px] flex-1 flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 md:grid-cols-[1fr_auto_auto] md:grid-rows-[minmax(0,auto)_1fr] md:gap-x-10 md:gap-x-16 lg:gap-x-24">
          {/* Top left — contact */}
          <header className="flex flex-col items-start gap-1 md:col-start-1 md:row-start-1">
            <p className="text-caption md:text-caption-md font-normal uppercase leading-relaxed tracking-[0.18em]">
              Available for projects
            </p>
            <a
              href="mailto:ojha96p@gmail.com"
              className="link-underline-ltr text-caption font-normal uppercase tracking-[0.18em] md:text-caption-md"
            >
              ojha96p@gmail.com
            </a>
          </header>

          {/* Top right — roles + social */}
          <div className="flex flex-row flex-wrap justify-between gap-8 md:col-span-2 md:col-start-2 md:row-start-1 md:flex-nowrap md:justify-end md:gap-12 md:self-start lg:gap-20">
            <div className="flex flex-col gap-4 text-caption md:text-caption-md font-normal uppercase leading-none">
              <div>
                <p>Visual designer</p>
                <p>& developer</p>
              </div>
              <div className="pt-1">
                <p>Digital</p>
                <p>experiences</p>
              </div>
            </div>
            <nav
              className="flex w-full flex-col items-start gap-1 text-caption md:text-caption-md font-normal uppercase"
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

          {/* Center — title block */}
          <div className="flex min-h-0 flex-col items-center justify-center py-6 text-center md:col-span-3 md:row-start-2 md:py-10 lg:py-14 text-[clamp(2rem,7vw,4.5rem)]">
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
      </div>
    </section>
  )
}
