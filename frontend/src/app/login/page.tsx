"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { login, storeAuth } from "@/lib/api-client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await login(email, password)
      storeAuth(res)
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth">
      <aside className="auth__aside">
        <a href="/dashboard" className="auth__brand">
          <img src="/ancol-connect_white_1.svg" alt="Ancol Connect" style={{ height: "30px", width: "auto" }} />
        </a>
        <div className="auth__pitch">
          <h2 className="auth__pitch-title">Purchase Monitor <span>Ancol Tickets via WhatsApp.</span></h2>
          <p className="auth__pitch-lede">
            Centralized dashboard to monitor ticket purchase transactions in real-time via WhatsApp Business API.
          </p>
        </div>
      </aside>

      <section className="auth__panel">
        <div className="auth__form">
          <div>
            <h1 className="text-2xl">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Sign in to your management dashboard.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="field">
              <label htmlFor="loginEmail" className="field__label">Email</label>
              <div className="input-group input-group--lg">
                <span className="input-group__text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 19c0-2.485-3.582-4.5-8-4.5S4 16.515 4 19" />
                    </g>
                  </svg>
                </span>
                <input
                  type="email"
                  className="input"
                  id="loginEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="loginPassword" className="field__label">Password</label>
              </div>
              <div className="input-group input-group--lg">
                <span className="input-group__text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 16c0-2.828 0-4.243.879-5.121C3.757 10 5.172 10 8 10h8c2.828 0 4.243 0 5.121.879C22 11.757 22 13.172 22 16s0 4.243-.879 5.121C20.243 22 18.828 22 16 22H8c-2.828 0-4.243 0-5.121-.879C2 20.243 2 18.828 2 16Z" />
                      <circle cx="12" cy="16" r="2" />
                      <path strokeLinecap="round" d="M6 10V8a6 6 0 1 1 12 0v2" />
                    </g>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-group__text"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3.275 15.296C2.425 14.192 2 13.639 2 12c0-1.64.425-2.191 1.275-3.296C4.972 6.5 7.818 4 12 4s7.028 2.5 8.725 4.704C21.575 9.81 22 10.361 22 12c0 1.64-.425 2.191-1.275 3.296C19.028 17.5 16.182 20 12 20s-7.028-2.5-8.725-4.704Z" />
                      <path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z" />
                    </g>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="button button--primary button--block button--lg">
              {loading ? "Signing in..." : "Sign in"}
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 12h16m0 0l-6-6m6 6l-6 6" />
              </svg>
            </button>
          </form>

          <div className="rounded-xl border border-dashed border-stroke bg-gray-50 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Demo mode</p>
            <p>Login dengan kombinasi email &amp; password apa saja (mis. <code className="font-mono">eddietohier@gmail.com / Ancol123!</code>).</p>
          </div>
        </div>
      </section>
    </main>
  )
}
