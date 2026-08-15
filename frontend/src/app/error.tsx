"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <a href="/dashboard" className="error-page__brand">
        <img alt="Ancol Connect" className="h-6 w-auto" src="/ancol-connect_white_1.svg" />
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
