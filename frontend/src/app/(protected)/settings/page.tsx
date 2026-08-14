"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  authApi,
  roleModuleApi,
  settingsApi,
  getStoredRoles,
  getStoredUser,
  getToken,
  storeAuth,
} from "@/lib/api-client"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Avvvatars from "avvvatars-react"
import { getMenuWithSep, saveMenuOrder, SEP } from "@/lib/menuConfig"
import {
  Save,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
  User,
  Shield,
  Lock,
  ShieldCheck,
  ListOrdered,
  Landmark,
  Percent,
} from "lucide-react"

interface Module {
  module_id: number
  module_code: string
  module_name: string
  description?: string
  sortno: number
}

interface Role {
  role_id: number
  role_code: string
  role_name: string
  description?: string
  user_count?: number
  modules: Module[]
}

interface SettingsData {
  revsharing_pct: number
  pbjt_rate: number
  is_pbjt_include: number
}

interface ProfileUser {
  user_id?: number
  email?: string
  nickname?: string
  enabled?: boolean
}

type Tab = "profile" | "roles" | "menu-order" | "revenue"
type MenuGroup = "main" | "settings"

const MENU_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders",
  "/payments": "Payments",
  "/tickets": "Tickets",
  "/reconciliation": "Reconciliation",
  "/customers": "Customers",
  "/wahana": "Wahana",
  "/settings": "Settings",
  "/admin/users": "Admin Users",
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const tabKeys: Tab[] = ["profile", "roles", "menu-order", "revenue"]
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const el = tabRefs.current[activeTab]
    const container = tabContainerRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      })
    }
  }, [activeTab])

  const showMessage = (type: "success" | "error", text: string) => {
    setSaveMessage({ type, text })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  // ── Profile ──
  const storedUser = getStoredUser() as { user_id?: number; email?: string; nickname?: string } | null
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [nickname, setNickname] = useState(storedUser?.nickname || "")
  const [password, setPassword] = useState("")
  const [retypePassword, setRetypePassword] = useState("")

  useEffect(() => {
    authApi
      .me()
      .then((res) => {
        const u = (res as { user?: ProfileUser }).user
        if (u) {
          setUser(u)
          setNickname(u.nickname || "")
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const payload: { nickname?: string; password?: string } = {}
      if (nickname !== user?.nickname) payload.nickname = nickname
      if (password) {
        if (password !== retypePassword) {
          showMessage("error", "Passwords do not match")
          setSaving(false)
          return
        }
        payload.password = password
      }

      if (Object.keys(payload).length === 0) {
        showMessage("success", "No changes to save")
        setSaving(false)
        return
      }

      const res = await authApi.updateProfile(payload)
      const u = (res as { user?: ProfileUser }).user
      if (u) {
        storeAuth({ user: u, roles: getStoredRoles(), token: getToken() ?? "" })
        setUser(u)
        setNickname(u.nickname || "")
      }
      setPassword("")
      setRetypePassword("")
      showMessage("success", "Profile updated successfully")
    } catch (e) {
      showMessage("error", e instanceof Error ? e.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  // ── RBAC Roles ──
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [roleModuleSelections, setRoleModuleSelections] = useState<Record<number, number[]>>({})
  const [roleSaving, setRoleSaving] = useState<number | null>(null)

  const loadRoles = useCallback(async () => {
    setRolesLoading(true)
    try {
      const [rolesData, modulesData] = await Promise.all([
        roleModuleApi.roles(),
        roleModuleApi.modules(),
      ])
      const allRoles = rolesData as Role[]
      const allModules = modulesData as Module[]
      const cleanRoles = allRoles.filter((r) => !/probe|test/i.test(r.role_code))
      const cleanModules = allModules.filter((m) => !/probe|test/i.test(m.module_code))

      setRoles(cleanRoles)
      setModules(cleanModules)
      const selections: Record<number, number[]> = {}
      cleanRoles.forEach((r) => {
        selections[r.role_id] = r.modules.map((m) => m.module_id)
      })
      setRoleModuleSelections(selections)
    } catch {
      showMessage("error", "Failed to load roles")
    } finally {
      setRolesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== "roles") return
    const t = setTimeout(() => loadRoles(), 0)
    return () => clearTimeout(t)
  }, [activeTab, loadRoles])

  const handleRoleToggle = (roleId: number, moduleId: number) => {
    setRoleModuleSelections((prev) => {
      const current = prev[roleId] || []
      return {
        ...prev,
        [roleId]: current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId],
      }
    })
  }

  const handleSaveRoleModules = async (roleId: number) => {
    setRoleSaving(roleId)
    try {
      await roleModuleApi.updateRoleModules(roleId, roleModuleSelections[roleId] || [])
      showMessage("success", "Modules updated for role")
    } catch (e) {
      showMessage("error", e instanceof Error ? e.message : "Failed to update role modules")
    } finally {
      setRoleSaving(null)
    }
  }

  // ── Menu Order ──
  const [menuOrder, setMenuOrder] = useState<{ main: string[]; settings: string[] }>({ main: [], settings: [] })
  const [menuDirty, setMenuDirty] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{ group: MenuGroup; index: number } | null>(null)
  const [dragOverItem, setDragOverItem] = useState<{ group: MenuGroup; index: number } | null>(null)

  const loadMenu = useCallback(() => {
    const menu = getMenuWithSep()
    const sepIdx = menu.indexOf(SEP)
    const main = menu.filter((p) => p !== SEP && menu.indexOf(p) < sepIdx)
    const settings = menu.filter((p) => p !== SEP && menu.indexOf(p) > sepIdx)
    setMenuOrder({ main, settings })
    setMenuDirty(false)
  }, [])

  useEffect(() => {
    if (activeTab !== "menu-order") return
    const t = setTimeout(() => loadMenu(), 0)
    return () => clearTimeout(t)
  }, [activeTab, loadMenu])

  const moveWithinGroup = (group: MenuGroup, index: number, direction: -1 | 1) => {
    setMenuOrder((prev) => {
      const arr = [...prev[group]]
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= arr.length) return prev
      ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
      return { ...prev, [group]: arr }
    })
    setMenuDirty(true)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, group: MenuGroup, index: number) => {
    setDraggedItem({ group, index })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", `${group}-${index}`)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, group: MenuGroup, index: number) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move"
    if (!draggedItem || draggedItem.group !== group) return
    if (draggedItem.index === index) return
    setDragOverItem({ group, index })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, group: MenuGroup, index: number) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.group !== group || draggedItem.index === index) {
      setDragOverItem(null)
      setDraggedItem(null)
      return
    }
    setMenuOrder((prev) => {
      const arr = [...prev[group]]
      const [moved] = arr.splice(draggedItem.index, 1)
      arr.splice(index, 0, moved)
      return { ...prev, [group]: arr }
    })
    setMenuDirty(true)
    setDragOverItem(null)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDragOverItem(null)
    setDraggedItem(null)
  }

  const handleSaveMenuOrder = async () => {
    setSaving(true)
    try {
      saveMenuOrder([...menuOrder.main, SEP, ...menuOrder.settings])
      setMenuDirty(false)
      showMessage("success", "Menu order saved")
    } catch {
      showMessage("error", "Failed to save menu order")
    } finally {
      setSaving(false)
    }
  }

  // ── Revenue Sharing ──
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [form, setForm] = useState({ revsharing_pct: 0, pbjt_rate: 0, is_pbjt_include: true })

  useEffect(() => {
    if (activeTab !== "revenue") return
    const t = setTimeout(() => {
      settingsApi
        .get()
        .then((s) => {
          const data = s as SettingsData
          setSettings(data)
          setForm({
            revsharing_pct: data.revsharing_pct,
            pbjt_rate: data.pbjt_rate,
            is_pbjt_include: !!data.is_pbjt_include,
          })
        })
        .catch((err: unknown) => showMessage("error", err instanceof Error ? err.message : "Failed to load settings"))
    }, 0)
    return () => clearTimeout(t)
  }, [activeTab])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await settingsApi.update({
        revsharing_pct: Number(form.revsharing_pct),
        pbjt_rate: Number(form.pbjt_rate),
        is_pbjt_include: form.is_pbjt_include,
      })
      setSettings(res as SettingsData)
      showMessage("success", "Konfigurasi berhasil disimpan.")
    } catch (err: unknown) {
      showMessage("error", err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const username = user?.email || storedUser?.email || "user"

  return (
    <div className="page content">
      <div className="content__container">
        <PageHeader title="Settings" description="Kelola profil, hak akses, dan menu aplikasi." />

        <div
          ref={tabContainerRef}
          className="relative mb-4 inline-flex gap-1 rounded-lg border border-stroke bg-white p-1.5 shadow-sm"
        >
          <div
            className="absolute top-1.5 bottom-1.5 rounded-md bg-primary transition-all duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
          {tabKeys.map((key) => (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el
              }}
              onClick={() => setActiveTab(key)}
              className={`relative z-10 rounded px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === key ? "text-white" : "text-body hover:text-black"
              }`}
            >
              {key === "profile" && "Profile"}
              {key === "roles" && "RBAC Roles"}
              {key === "menu-order" && "Menu Order"}
              {key === "revenue" && "Revenue Sharing"}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-stroke bg-white shadow-sm">
          {/* ── Profile Tab ── */}
          {activeTab === "profile" && (
            <div key="profile" className="animate-tab-slide">
              <div className="relative w-full bg-[url('/profile-banner-2.webp')] bg-cover bg-[center_50%]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="relative px-6 pt-6 pb-40">
                  <div className="flex justify-end mb-2">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white ${
                        user?.enabled !== false ? "bg-[#0b1a33]/70 backdrop-blur-sm" : "bg-gray-600/70"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {user?.enabled !== false ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-6">
                    <p className="text-md font-bold text-white drop-shadow-md">
                      {user?.nickname || "User"} | @{username}
                    </p>
                  </div>
                </div>
                <div
                  className="absolute -bottom-6 left-6"
                  style={{ borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                >
                  <Avvvatars value={user?.nickname || username || "user"} size={96} style="shape" border borderColor="#fff" borderSize={4} />
                </div>
              </div>

              <div className="pt-10 pb-2 p-4">
                {saveMessage && (
                  <div
                    className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
                      saveMessage.type === "success"
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="relative rounded-xl border border-stroke bg-white p-5 ml-2">
                    <div className="absolute top-4 right-4 text-gray-300">
                      <User className="h-10 w-10" />
                    </div>
                    <h4 className="mb-6 text-lg font-bold text-black">Account Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value={username} disabled className="cursor-not-allowed opacity-60" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settings-nickname">Nickname</Label>
                        <Input
                          id="settings-nickname"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Your display name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative rounded-xl border border-stroke bg-white p-5 mr-2">
                    <div className="absolute top-4 right-4 text-gray-300">
                      <Lock className="h-10 w-10" />
                    </div>
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-black">Change Password</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Leave blank to keep current password.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="settings-password">New Password</Label>
                        <Input
                          id="settings-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="settings-retype-password">Retype Password</Label>
                        <Input
                          id="settings-retype-password"
                          type="password"
                          value={retypePassword}
                          onChange={(e) => setRetypePassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        {password && retypePassword && password !== retypePassword && (
                          <p className="text-xs text-red-500">Passwords do not match.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveProfile} disabled={saving} size="lg">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── RBAC Roles Tab ── */}
          {activeTab === "roles" && (
            <div key="roles" className="animate-tab-slide p-6 relative">
              <div className="absolute top-6 right-8 text-gray-300 hidden sm:block">
                <ShieldCheck className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-bold text-black">Role-Based Access Control</h3>
              <p className="mb-6 text-sm text-muted-foreground mt-1 pr-0 sm:pr-14">
                Manage roles and their access permissions to different modules across the application.
              </p>

              {rolesLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {!rolesLoading && roles.length === 0 && (
                <div className="rounded-xl border border-dashed border-stroke p-8 text-center bg-gray-50/50">
                  <Shield className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-sm font-medium text-black">No roles found</p>
                  <p className="text-xs text-muted-foreground mt-1">There are currently no roles configured in the system.</p>
                </div>
              )}

              {!rolesLoading && roles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {roles.map((role) => {
                    const allModules = modules.length > 0 ? modules : role.modules
                    const selectedCount = roleModuleSelections[role.role_id]?.length || 0

                    return (
                      <div key={role.role_id} className="flex flex-col rounded-xl border border-stroke bg-white h-full">
                        <div className="flex w-full items-end justify-between px-6 py-3 rounded-t-xl">
                          <div className="flex items-center gap-4">
                            <span className="block text-base font-semibold text-black">{role.role_name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="bg-gray-100 text-muted-foreground">
                              {selectedCount} module{selectedCount !== 1 && "s"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col flex-1 border-t border-stroke/50 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50/30 rounded-b-xl">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-black">Module Access</h4>
                            <span className="text-xs text-muted-foreground">Toggle to grant or revoke access</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                            {allModules.map((mod) => {
                              const checked = roleModuleSelections[role.role_id]?.includes(mod.module_id) || false
                              return (
                                <div
                                  key={mod.module_id}
                                  className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg transition-colors ${
                                    checked ? "bg-teal-50/50" : "bg-gray-100"
                                  }`}
                                >
                                  <Label
                                    htmlFor={`role-${role.role_id}-mod-${mod.module_id}`}
                                    className="flex-1 cursor-pointer select-none text-xs font-medium text-body leading-snug break-words"
                                  >
                                    {mod.module_name}
                                  </Label>
                                  <Switch
                                    id={`role-${role.role_id}-mod-${mod.module_id}`}
                                    size="sm"
                                    checked={checked}
                                    onCheckedChange={() => handleRoleToggle(role.role_id, mod.module_id)}
                                  />
                                </div>
                              )
                            })}
                          </div>

                          <div className="mt-auto flex justify-end border-t border-stroke/50 pt-3">
                            <Button
                              variant="default"
                              onClick={() => handleSaveRoleModules(role.role_id)}
                              disabled={roleSaving === role.role_id}
                              className="min-w-[140px]"
                            >
                              {roleSaving === role.role_id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              {roleSaving === role.role_id ? "Saving..." : "Save Permissions"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Menu Order Tab ── */}
          {activeTab === "menu-order" && (
            <div key="menu-order" className="animate-tab-slide p-6 relative">
              <div className="absolute top-6 right-8 text-gray-300 hidden sm:block">
                <ListOrdered className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-bold text-black">Menu Navigation Order</h3>
              <p className="mb-8 text-sm text-muted-foreground mt-1 pr-0 sm:pr-14">
                Drag and drop the items below to rearrange how they appear in the sidebar navigation.
              </p>

              <div className="w-full">
                {menuOrder.main.length === 0 && menuOrder.settings.length === 0 && (
                  <div className="rounded-xl border border-dashed border-stroke p-8 text-center bg-gray-50/50 max-w-xl">
                    <p className="text-sm font-medium text-black">No menu items found</p>
                  </div>
                )}

                {menuOrder.main.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(
                      [
                        { id: "main" as MenuGroup, label: "Main", items: menuOrder.main },
                        { id: "settings" as MenuGroup, label: "Settings", items: menuOrder.settings },
                      ] as const
                    ).map((group) => (
                      <div key={group.id} className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider mb-3 border-b border-stroke pb-2">
                          {group.label}
                        </h4>
                        {group.items.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No items in this group.</p>
                        )}
                        {group.items.map((path, index) => {
                          const isDragging = draggedItem?.group === group.id && draggedItem?.index === index
                          const isDragOver = dragOverItem?.group === group.id && dragOverItem?.index === index

                          return (
                            <div
                              key={path}
                              draggable
                              onDragStart={(e) => handleDragStart(e, group.id, index)}
                              onDragOver={(e) => handleDragOver(e, group.id, index)}
                              onDrop={(e) => handleDrop(e, group.id, index)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 bg-white transition-all ${
                                isDragging
                                  ? "opacity-50 border-dashed border-primary shadow-sm"
                                  : "border-stroke hover:border-gray-300 hover:shadow-sm"
                              } ${isDragOver ? "border-primary ring-1 ring-primary/20 scale-[1.02]" : ""} ${
                                isDragging ? "cursor-grabbing" : "cursor-grab"
                              }`}
                            >
                              <div className="flex items-center justify-center w-7 h-7 rounded bg-gray-50 text-gray-400 transition-colors">
                                <GripVertical className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-black truncate">{MENU_LABELS[path] || path}</p>
                                <p className="text-xs text-muted-foreground truncate">Path: {path}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 border-l border-stroke pl-3">
                                <div className="flex flex-col gap-0 mr-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="h-5 w-5 rounded-sm hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                    onClick={() => moveWithinGroup(group.id, index, -1)}
                                    disabled={index === 0}
                                    title="Move up"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="h-5 w-5 rounded-sm hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                    onClick={() => moveWithinGroup(group.id, index, 1)}
                                    disabled={index === group.items.length - 1}
                                    title="Move down"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-50/50 border border-teal-100/50">
                                  <span className="text-[10px] font-bold text-teal-700">{index + 1}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {menuOrder.main.length > 0 && (
                  <div className="flex items-center gap-4 pt-6 mt-6 border-t border-stroke/50">
                    <Button onClick={handleSaveMenuOrder} disabled={saving || !menuDirty} size="lg">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      {saving ? "Saving..." : "Save Order"}
                    </Button>

                    {menuDirty && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-xs font-medium">Unsaved changes</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Revenue Sharing Tab ── */}
          {activeTab === "revenue" && (
            <div key="revenue" className="animate-tab-slide p-6 relative">
              <div className="absolute top-6 right-8 text-gray-300 hidden sm:block">
                <Landmark className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-bold text-black">Revenue Sharing &amp; PBJT</h3>
              <p className="mb-6 text-sm text-muted-foreground mt-1 pr-0 sm:pr-14">
                Konfigurasi bagi hasil ke Ancol dan pajak barang dan jasa tiket.
              </p>

              {saveMessage && (
                <div
                  className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
                    saveMessage.type === "success"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}

              {!settings && !saveMessage && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {settings && (
                <form onSubmit={handleSaveSettings} className="max-w-xl space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="revshare">Revenue Sharing (%)</Label>
                    <div className="relative">
                      <Percent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="revshare"
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        className="pl-9"
                        value={form.revsharing_pct}
                        onChange={(e) => setForm({ ...form, revsharing_pct: Number(e.target.value) })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Persentase bagi hasil ke Ancol.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pbjt">PBJT Rate (%)</Label>
                    <div className="relative">
                      <Percent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="pbjt"
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        className="pl-9"
                        value={form.pbjt_rate}
                        onChange={(e) => setForm({ ...form, pbjt_rate: Number(e.target.value) })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Pajak barang dan jasa / tiket.</p>
                  </div>

                  <label className="flex items-center gap-3 text-sm font-medium text-gray-900 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={form.is_pbjt_include}
                      onChange={(e) => setForm({ ...form, is_pbjt_include: e.target.checked })}
                    />
                    PBJT sudah termasuk harga tiket
                  </label>

                  <Button type="submit" disabled={saving} size="lg">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
