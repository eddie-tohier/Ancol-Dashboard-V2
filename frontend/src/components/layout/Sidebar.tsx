"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  TicketCheck,
  FileSpreadsheet,
  Users,
  Settings,
  Ticket,
  UserCog,
} from "lucide-react"
import { getMenuWithSep, defaultMenuWithSep, SEP } from "@/lib/menuConfig"

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const menuMap: Record<string, { path: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  "/dashboard": { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  "/orders": { path: "/orders", label: "Orders", icon: ShoppingCart },
  "/payments": { path: "/payments", label: "Payments", icon: Wallet },
  "/tickets": { path: "/tickets", label: "Tickets", icon: TicketCheck },
  "/reconciliation": { path: "/reconciliation", label: "Reconciliation", icon: FileSpreadsheet },
  "/customers": { path: "/customers", label: "Customers", icon: Users },
  "/wahana": { path: "/wahana", label: "Wahana", icon: Ticket },
  "/settings": { path: "/settings", label: "Settings", icon: Settings },
  "/admin/users": { path: "/admin/users", label: "Admin Users", icon: UserCog },
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname()
  const [menuWithSep, setMenuWithSep] = useState<string[]>(defaultMenuWithSep)

  useEffect(() => {
    const t = setTimeout(() => setMenuWithSep(getMenuWithSep()), 0)
    return () => clearTimeout(t)
  }, [])

  const sepIdx = menuWithSep.indexOf(SEP)
  const isMainSection = (path: string) => menuWithSep.indexOf(path) !== -1 && menuWithSep.indexOf(path) < sepIdx

  function isActive(path: string) {
    if (path === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(path)
  }

  const mainItems = menuWithSep.filter((p) => p !== SEP && isMainSection(p)).map((p) => menuMap[p]).filter(Boolean)
  const otherItems = menuWithSep.filter((p) => p !== SEP && !isMainSection(p)).map((p) => menuMap[p]).filter(Boolean)

  return (
    <aside
      className={`sidebar sidebar--lg sidebar--app ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      <header className="sidebar__header">
        <Link href="/dashboard" className="sidebar__brand">
          <img src="/ancol-connect_white_1.svg" alt="Ancol Connect" className="h-6 w-auto" />
        </Link>
      </header>

      <div className="sidebar__content no-scrollbar">
        <nav className="sidebar__menu">
          <div className="sidebar__group">
            <ul className="sidebar__list">
              {mainItems.map((item) => {
                const Icon = item.icon
                return (
                  <li className="sidebar__item" key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className="sidebar__button"
                      aria-current={isActive(item.path) ? "page" : undefined}
                    >
                      <Icon className="sidebar__icon" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="sidebar__group">
            <span className="sidebar__group-title">Settings</span>
            <ul className="sidebar__list">
              {otherItems.map((item) => {
                const Icon = item.icon
                return (
                  <li className="sidebar__item" key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className="sidebar__button"
                      aria-current={isActive(item.path) ? "page" : undefined}
                    >
                      <Icon className="sidebar__icon" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      </div>

      <div className="sidebar__footer">
        <p>Ancol Connect · Management Dashboard</p>
      </div>
    </aside>
  )
}
