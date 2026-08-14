const STORAGE_KEY = "sidebar_menu_order"

export const SEP = "__sep__"

export const defaultMenuWithSep = [
  "/dashboard",
  "/orders",
  "/payments",
  "/tickets",
  "/reconciliation",
  "/customers",
  SEP,
  "/wahana",
  "/settings",
  "/admin/users",
]

export function getMenuWithSep(): string[] {
  if (typeof window === "undefined") return defaultMenuWithSep
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return defaultMenuWithSep
  try {
    const parsed = JSON.parse(stored) as string[]
    const paths = defaultMenuWithSep.filter((p) => p !== SEP)
    const parsedPaths = parsed.filter((p) => p !== SEP)
    if (parsedPaths.length !== paths.length) return defaultMenuWithSep
    return parsed
  } catch {
    return defaultMenuWithSep
  }
}

export function saveMenuOrder(items: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function resetMenuOrder() {
  localStorage.removeItem(STORAGE_KEY)
}
