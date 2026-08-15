import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className="error-page">
      <Link href="/dashboard" className="error-page__brand">
        <img alt="Ancol Connect" className="h-6 w-auto" src="/ancol-connect_white_1.svg" />
      </Link>

      <div className="empty-state empty-state--primary">
        <span className="empty-state__media">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11.5" cy="11.5" r="9.5" />
              <path strokeLinecap="round" d="M18.5 18.5L22 22M9 11.5h2.5m0 0H14m-2.5 0V14m0-2.5V9" />
            </g>
          </svg>
        </span>
        <h3 className="empty-state__title">Page not found</h3>
        <p className="empty-state__text">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
        <div className="empty-state__action flex-col">
          <Link href="/dashboard" className="button button--primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M2.5 6.5c0-1.886 0-2.828.586-3.414S4.614 2.5 6.5 2.5s2.828 0 3.414.586s.586 1.528.586 3.414s0 2.828-.586 3.414s-1.528.586-3.414.586s-2.828 0-3.414-.586S2.5 8.386 2.5 6.5Zm11 11c0-1.886 0-2.828.586-3.414s1.528-.586 3.414-.586s2.828 0 3.414.586s.586 1.528.586 3.414s0 2.828-.586 3.414s-1.528.586-3.414.586s-2.828 0-3.414-.586s-.586-1.528-.586-3.414Zm-11 0c0-1.886 0-2.828.586-3.414S4.614 13.5 6.5 13.5s2.828 0 3.414.586s.586 1.528.586 3.414s0 2.828-.586 3.414s-1.528.586-3.414.586s-2.828 0-3.414-.586S2.5 19.386 2.5 17.5Zm11-11c0-1.886 0-2.828.586-3.414S15.614 2.5 17.5 2.5s2.828 0 3.414.586s.586 1.528.586 3.414s0 2.828-.586 3.414s-1.528.586-3.414.586s-2.828 0-3.414-.586S13.5 8.386 13.5 6.5Z" />
            </svg>
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
