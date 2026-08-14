"use client"

import { Menu, LogOut, User, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { clearAuth, getStoredUser } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import Avvvatars from "avvvatars-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const router = useRouter()
  const user = getStoredUser()

  function handleLogout() {
    clearAuth()
    router.push("/login")
  }

  return (
    <header className="navbar">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden text-white/80 hover:text-white"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="navbar__menu">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors duration-200 outline-none border-none cursor-pointer" />
            }
          >
            <span className="flex items-center gap-2">
              <Avvvatars
                value={user?.nickname || user?.email || "User"}
                size={28}
                style="shape"
              />
              <span className="hidden sm:inline text-sm font-medium text-white/90">{user?.nickname || user?.email || "User"}</span>
              <ChevronDown className="h-4 w-4 text-white/60 hidden sm:inline" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2.5 flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground block truncate">
                  {user?.nickname || user?.email || "User"}
                </span>
                <span className="text-xs text-muted-foreground block truncate font-normal">
                  {user?.email || "user@example.com"}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")} className="px-3 py-2 cursor-pointer gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} className="px-3 py-2 cursor-pointer gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
