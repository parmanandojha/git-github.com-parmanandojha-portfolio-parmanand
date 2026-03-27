import { useNavigate } from 'react-router-dom'
import projects from '../data/projects.json'
import {
  awards,
  fieldsOfPractice,
  furtherInformation,
  overviewIntro,
} from '../data/overviewContent.js'
import { getProjectPath } from '../utils/projects.js'

const colTitle =
  'mb-4 text-caption font-normal uppercase tracking-[0.2em] text-neutral-400 md:text-caption-md'

const listLink =
  'link-underline-ltr text-left text-nav font-normal normal-case tracking-normal text-gray-900'

const listItem = 'text-nav font-normal leading-snug text-gray-900'

function Column({ title, children }) {
  return (
    <div className="min-w-0">
      <h2 className={colTitle}>{title}</h2>
      {children}
    </div>
  )
}

export default function About({ onNavigateWithTransition }) {
  const navigate = useNavigate()
  const recentWork = [...projects].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 8)
  const goToProject = (project) => {
    const path = getProjectPath(project)
    if (onNavigateWithTransition) {
      onNavigateWithTransition(path)
      return
    }
    navigate(path)
  }

  return (
    <div className="mx-auto w-full max-w-[1800px] px-5 pb-28 pt-10 md:px-8 md:pt-14">
      {/* Intro — large serif, reference-style */}
      <header className="max-w-[min(100%,52rem)]">
        <div className="space-y-6 font-sans text-[clamp(1.125rem,2.2vw,1.75rem)] font-normal leading-[1.45] tracking-[-0.01em] text-black md:space-y-8 md:leading-[1.5]">
          {overviewIntro.map((paragraph, i) => (
            <p key={i} className="m-0">
              {paragraph}
            </p>
          ))}
        </div>
      </header>

      {/* Five-column grid — stacks on small screens */}
      <div
        className="mt-20 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:mt-28 lg:grid-cols-5 lg:gap-x-6 xl:gap-x-8"
        aria-label="Overview details"
      >
        <Column title="Recent Work">
          <ul className="m-0 list-none space-y-1.5 p-0">
            {recentWork.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => goToProject(p)}
                  className={`${listLink} border-0 bg-transparent p-0`}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        </Column>

        <Column title="Fields of Practice">
          <ul className="m-0 list-none space-y-2.5 p-0">
            {fieldsOfPractice.map((field) => (
              <li key={field} className={listItem}>
                {field}
              </li>
            ))}
          </ul>
        </Column>

        <Column title="Awards & recognition">
          <ul className="m-0 list-none space-y-2.5 p-0">
            {awards.map((line) => (
              <li key={line} className={listItem}>
                {line}
              </li>
            ))}
          </ul>
        </Column>

        <Column title="Further Information">
          <div className="space-y-4 text-nav font-normal leading-relaxed text-gray-900">
            {furtherInformation.map((block, i) => (
              <p key={i} className="m-0">
                {block}
              </p>
            ))}
          </div>
        </Column>
      </div>
    </div>
  )
}
