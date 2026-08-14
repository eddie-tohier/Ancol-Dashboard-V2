"use client"

import { useEffect, useState, useCallback, FormEvent } from "react"
import { usersApi, roleModuleApi } from "@/lib/api-client"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import SearchInput from "@/components/shared/SearchInput"

interface Role {
  role_id: number
  role_code: string
  role_name: string
}

interface User {
  user_id: number
  email: string
  nickname: string
  enabled: boolean
  roles: Role[]
}

interface UserForm {
  user_id: number | null
  email: string
  nickname: string
  password: string
  enabled: boolean
  role_ids: number[]
}

const EMPTY_FORM: UserForm = { user_id: null, email: "", nickname: "", password: "", enabled: true, role_ids: [] }

interface UserListData {
  data: User[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UserListData | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    roleModuleApi.roles().then((r) => setRoles(r as Role[])).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await usersApi.list<User>({ page, per_page: 15, search: search || undefined, role_id: roleFilter === "all" ? undefined : roleFilter })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(t)
  }, [fetchData])

  function openCreate() {
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(user: User) {
    setForm({
      user_id: user.user_id,
      email: user.email,
      nickname: user.nickname,
      password: "",
      enabled: user.enabled,
      role_ids: user.roles.map((r) => r.role_id),
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      if (form.user_id) {
        await usersApi.update(form.user_id, {
          email: form.email,
          nickname: form.nickname,
          enabled: form.enabled,
          role_ids: form.role_ids,
          password: form.password || undefined,
        })
      } else {
        await usersApi.create({
          email: form.email,
          nickname: form.nickname,
          password: form.password,
          role_ids: form.role_ids,
        })
      }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan user")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Hapus user ${user.email}?`)) return
    try {
      await usersApi.delete(user.user_id)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus user")
    }
  }

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="Admin Users" description="Kelola user, role, dan akses aplikasi.">
          <button onClick={openCreate} className="button button--primary button--sm">
            <Plus className="h-4 w-4" /> Add User
          </button>
        </PageHeader>

        <div className="flex flex-wrap items-center gap-2">
          <select className="compact-input h-8" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.role_id} value={String(r.role_id)}>
                {r.role_name}
              </option>
            ))}
          </select>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search email / nickname..." />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h3 className="text-base font-bold text-gray-900">User List</h3>
            <span className="text-sm text-muted-foreground">{data?.total ?? 0} users</span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex items-center justify-center py-10">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && data?.data.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-10 text-center text-muted-foreground">No users found.</div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.data.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50">
                      <td className="font-semibold text-gray-900">{u.nickname}</td>
                      <td className="text-sm text-muted-foreground">{u.email}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span key={r.role_id} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              {r.role_name}
                            </span>
                          ))}
                          {u.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td>
                        <StatusBadge label={u.enabled ? "Active" : "Disabled"} color={u.enabled ? "green" : "red"} />
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(u)} className="pagination__button" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(u)} className="pagination__button text-danger hover:bg-red-50" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-stroke px-5 py-3">
              <span className="text-xs text-muted-foreground">
                Page {data.current_page} of {data.last_page}
              </span>
              <div className="flex gap-1">
                <button className="pagination__button" disabled={data.current_page <= 1} onClick={() => setPage(data.current_page - 1)}>‹</button>
                <button className="pagination__button" disabled={data.current_page >= data.last_page} onClick={() => setPage(data.current_page + 1)}>›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{form.user_id ? "Edit User" : "Add User"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="uEmail" className="field__label">Email</label>
                <input id="uEmail" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="uNickname" className="field__label">Nickname</label>
                <input id="uNickname" className="input" required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="uPassword" className="field__label">Password</label>
                <input
                  id="uPassword"
                  type="password"
                  className="input"
                  placeholder={form.user_id ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                  required={!form.user_id}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="field">
                <span className="field__label">Roles</span>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <label key={r.role_id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-gray-700 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={form.role_ids.includes(r.role_id)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            role_ids: e.target.checked ? [...form.role_ids, r.role_id] : form.role_ids.filter((id) => id !== r.role_id),
                          })
                        }
                      />
                      {r.role_name}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <input type="checkbox" className="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                Aktif
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="button button--neutral button--sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button--primary button--sm" disabled={saving}>
                  {saving ? "Saving..." : form.user_id ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
