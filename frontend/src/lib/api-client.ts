const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) {
    localStorage.setItem("auth_token", token)
  } else {
    localStorage.removeItem("auth_token")
  }
}

export function clearAuth() {
  setToken(null)
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_user")
    localStorage.removeItem("auth_roles")
  }
}

export function getStoredUser(): { user_id?: number; email?: string; nickname?: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("auth_user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredRoles(): Array<{ role_id: number; role_code: string; role_name: string }> {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("auth_roles")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function storeAuth(data: { user: unknown; roles: unknown; token: string }) {
  setToken(data.token)
  localStorage.setItem("auth_user", JSON.stringify(data.user))
  localStorage.setItem("auth_roles", JSON.stringify(data.roles))
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export async function api<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const token = getToken()

  let url = `${API_BASE}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    })
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (fetchOptions.body && typeof fetchOptions.body === "string") {
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (response.status === 401) {
    clearAuth()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }))
    throw new Error(error.message || error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ── Auth ──
// ── Auth ──
export async function login(email: string, password: string) {
  const res = await authApi.login(email, password)
  storeAuth(res as { user: unknown; roles: unknown; token: string })
  return res
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ user: unknown; roles: unknown; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => api("/auth/logout", { method: "POST" }),
  me: () => api<{ user: unknown; roles: unknown }>("/auth/me"),
  updateProfile: (data: { nickname?: string; password?: string }) =>
    api("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
}

// ── Dashboard ──
export const dashboardApi = {
  stats: (period?: string, dateFrom?: string, dateTo?: string) =>
    api(`/dashboard/stats`, { params: { period, date_from: dateFrom, date_to: dateTo } }),
  charts: (period?: string, dateFrom?: string, dateTo?: string) =>
    api(`/dashboard/charts`, { params: { period, date_from: dateFrom, date_to: dateTo } }),
  sharing: (period?: string, dateFrom?: string, dateTo?: string) =>
    api(`/dashboard/sharing`, { params: { period, date_from: dateFrom, date_to: dateTo } }),
  recent: () => api("/dashboard/recent"),
  summary: (period?: string, dateFrom?: string, dateTo?: string) =>
    api(`/dashboard/summary`, { params: { period, date_from: dateFrom, date_to: dateTo } }),
}

// ── Orders ──
export const ordersApi = {
  list: <T = Record<string, unknown>>(params?: Record<string, string | number | undefined>) =>
    api<Paginated<T>>("/orders", { params }),
  summary: (params?: Record<string, string | number | undefined>) =>
    api(`/orders/summary`, { params }),
  get: (id: number) => api(`/orders/${id}`),
}

// ── Payments ──
export const paymentsApi = {
  list: <T = Record<string, unknown>>(params?: Record<string, string | number | undefined>) =>
    api<Paginated<T>>("/payments", { params }),
  summary: (params?: Record<string, string | number | undefined>) =>
    api(`/payments/summary`, { params }),
  get: (id: number) => api(`/payments/${id}`),
}

// ── Tickets ──
export const ticketsApi = {
  list: <T = Record<string, unknown>>(params?: Record<string, string | number | undefined>) =>
    api<Paginated<T>>("/tickets", { params }),
  summary: (params?: Record<string, string | number | undefined>) =>
    api(`/tickets/summary`, { params }),
  get: (id: number) => api(`/tickets/${id}`),
}

// ── Customers ──
export const customersApi = {
  list: <T = Record<string, unknown>>(params?: Record<string, string | number | undefined>) =>
    api<Paginated<T>>("/customers", { params }),
  summary: () => api(`/customers/summary`),
  get: (id: number) => api(`/customers/${id}`),
}

// ── Sites / Wahana ──
export const sitesApi = {
  list: <T = Record<string, unknown>>() => api<Array<T>>("/sites"),
  summary: () => api(`/sites/summary`),
}

// ── Reconciliation ──
export const reconciliationApi = {
  sessions: (date?: string) => api(`/reconciliation/sessions`, { params: { date } }),
  session: (id: number) => api(`/reconciliation/sessions/${id}`),
  availableDates: () => api<string[]>("/reconciliation/available-dates"),
}

// ── Settings ──
export const settingsApi = {
  get: () => api("/settings"),
  update: (data: Record<string, unknown>) => api("/settings", { method: "PUT", body: JSON.stringify(data) }),
}

// ── Users & Roles ──
export const usersApi = {
  list: <T = Record<string, unknown>>(params?: Record<string, string | number | undefined>) =>
    api<Paginated<T>>("/users", { params }),
  get: (id: number) => api(`/users/${id}`),
  create: (data: { email: string; nickname: string; password: string; role_ids: number[] }) =>
    api("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    api(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => api(`/users/${id}`, { method: "DELETE" }),
  modules: (id: number) => api(`/users/${id}/modules`),
}

export const roleModuleApi = {
  roles: () => api("/roles"),
  modules: () => api("/modules"),
  updateRoleModules: (roleId: number, moduleIds: number[]) =>
    api(`/roles/${roleId}/modules`, { method: "PUT", body: JSON.stringify({ module_ids: moduleIds }) }),
}
