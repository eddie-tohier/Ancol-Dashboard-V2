"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <a href="/dashboard" className="error-page__brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 1.5l3.4 7.1 7.1 3.4-7.1 3.4-3.4 7.1-3.4-7.1L1.5 12l7.1-3.4z" opacity=".45" />
          <path d="M12 1.5l3.4 7.1L12 12 8.6 8.6z" />
        </svg>
        <span>REC-H</span>
      </a>

      <div className="empty-state empty-state--danger">
        <span className="empty-state__media">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </span>
        <h3 className="empty-state__title">Something went wrong</h3>
        <p className="empty-state__text">
          {error.message || "An unexpected error occurred on our end. Try again in a moment."}
        </p>
        <div className="empty-state__action flex-col">
          <a href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
            <Home className="h-4 w-4" />
            Back to dashboard
          </a>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </main>
  )
}
