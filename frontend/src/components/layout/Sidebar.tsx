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
  Search,
} from "lucide-react"
import { getMenuWithSep, defaultMenuWithSep, SEP } from "@/lib/menuConfig"
import { getStoredRoles } from "@/lib/api-client"

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
  "/cs-search": { path: "/cs-search", label: "CS Search", icon: Search },
}

const ALL_ROUTES = ["/dashboard", "/orders", "/payments", "/tickets", "/reconciliation", "/customers", "/wahana", "/settings", "/admin/users"]
const CS_ROUTES = ["/cs-search"]

function getVisiblePaths(): string[] {
  const roles = getStoredRoles()
  const roleCodes = roles.map((r) => r.role_code)
  const isCS = roleCodes.includes("CS")
  const isSA = roleCodes.includes("SA")

  if (isCS && !isSA) {
    // CS role: only CS Search
    return CS_ROUTES
  }

  if (isSA) {
    // Super Admin: all routes + CS Search
    return [...ALL_ROUTES, SEP, ...CS_ROUTES]
  }

  // Admin and others: all routes except CS Search
  return ALL_ROUTES
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname()
  const [menuWithSep, setMenuWithSep] = useState<string[]>(defaultMenuWithSep)

  useEffect(() => {
    const t = setTimeout(() => {
      const visiblePaths = getVisiblePaths()
      const storedMenu = getMenuWithSep()

      // Filter stored menu to only include visible paths
      const filtered = storedMenu.filter((p) => p === SEP || visiblePaths.includes(p))

      // If CS Search is visible but not in stored menu, add it
      if (visiblePaths.includes("/cs-search") && !filtered.includes("/cs-search")) {
        filtered.push(SEP, "/cs-search")
      }

      setMenuWithSep(filtered.length > 0 ? filtered : visiblePaths)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const sepIdx = menuWithSep.indexOf(SEP)
  const isMainSection = (path: string) => menuWithSep.indexOf(path) !== -1 && menuWithSep.indexOf(path) < sepIdx

  function isActive(path: string) {
    if (path === "/dashboard") return pathname === "/dashboard"
    if (path === "/cs-search") return pathname === "/cs-search"
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

          {otherItems.length > 0 && (
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
          )}
        </nav>
      </div>

      <div className="sidebar__footer">
        <p>Ancol Connect · Management Dashboard</p>
      </div>
    </aside>
  )
}
