// =====================================================================
// MOCKUP: "hari ini" DIPAKSA = 13 Agustus 2026.
// Dipakai di dashboard & DateRangePicker (quick filter Today/This Week/
// This Month/Last 3 Months) agar hasil mockup selalu sama kapan pun
// aplikasi di-test.
//
// ⚠️ PRODUCTION: MATIKAN var ini (MOCK_ENABLED = false) atau hapus file
//    ini sebelum deploy, agar aplikasi memakai tanggal asli.
// =====================================================================
const MOCK_ENABLED = true

export const TODAY: Date = MOCK_ENABLED ? new Date(2026, 7, 13) : new Date()

export function todayISO(): string {
  const d = TODAY
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
