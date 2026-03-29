import { useNavigate } from 'react-router-dom'

export default function NotFound({ onNavigateWithTransition }) {
  const navigate = useNavigate()
  const goToCatalogue = () => {
    if (onNavigateWithTransition) {
      onNavigateWithTransition('/catalogued-works')
      return
    }
    navigate('/catalogued-works')
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-16rem)] w-full max-w-[1800px] flex-col items-start justify-center px-5 pb-32 pt-12 md:px-8">
      <p className="m-0 text-caption uppercase tracking-[0.2em] text-neutral-500 md:text-caption-md">
        Error
      </p>
      <h1 className="mt-3 display-condensed text-[clamp(3rem,12vw,7rem)] uppercase leading-none tracking-tight text-gray-900">
        404
      </h1>
      <p className="mt-3 max-w-xl font-body text-sm text-neutral-600 md:text-base">
        The page you are looking for does not exist or has moved.
      </p>
      <button
        type="button"
        onClick={goToCatalogue}
        className="link-underline-ltr mt-7 text-nav uppercase text-gray-900"
      >
        Back to catalogued works
      </button>
    </section>
  )
}
