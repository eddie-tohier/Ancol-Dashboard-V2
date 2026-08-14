"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/lib/api-client"
import Sidebar from "./Sidebar"
import Header from "./Header"

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    const t = setTimeout(() => setChecked(true), 0)
    return () => clearTimeout(t)
  }, [router])

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div
        className="app-shell__main relative flex flex-1 flex-col"
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex flex-col flex-1 overflow-y-auto thin-scrollbar">
          {children}
        </main>
      </div>
    </div>
  )
}
