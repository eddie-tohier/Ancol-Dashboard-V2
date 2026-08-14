"use strict"

const express = require("express")
const { db } = require("../db")
const { ORDER_STATUS } = require("../utils/status")

const router = express.Router()

const MATCHED_STATUS = ["PD", "TI"]

function sessionsForDate(dateStr) {
  const rows = db
    .prepare(
      `SELECT o.order_id, o.status, o.order_date, o.total_amt,
              s.site_id, s.site_code, s.name AS site_name
       FROM orders o
       JOIN orderdetails od ON od.order_id = o.order_id
       JOIN products p ON p.product_id = od.product_id
       JOIN sites s ON s.site_id = p.site_id
       WHERE substr(o.order_date, 1, 10) = ?
       GROUP BY o.order_id, o.status, o.order_date, o.total_amt, s.site_id, s.site_code, s.name
       ORDER BY o.order_date`
    )
    .all(dateStr)

  // kelompokkan per jam (UTC) + site
  const buckets = new Map()
  for (const r of rows) {
    const hour = parseInt(String(r.order_date).slice(11, 13), 10)
    const key = `${hour}|${r.site_id}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(r)
  }

  let sessionNo = 1
  const sessions = []
  for (const [key, orders] of [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const [hour, siteId] = key.split("|")
    const site = orders[0]
    const matched = orders.filter((o) => MATCHED_STATUS.includes(o.status)).length
    const totalOrders = orders.length
    const matchRate = totalOrders ? Number(((matched / totalOrders) * 100).toFixed(1)) : 0

    // status deterministik: <0.9% failed, 0 orders → NO_ORDERS
    let status = "COMPLETED"
    if (totalOrders === 0) status = "NO_ORDERS"
    else if ((matched / totalOrders) < 0.3) status = "FAILED"
    else if (matchRate < 85) status = "FAILED"

    const durationSec = 300 + totalOrders * 12
    const sessionId = Number(`${dateStr.replace(/-/g, "").slice(4)}${String(hour).padStart(2, "0")}${String(siteId).padStart(2, "0")}`)

    sessions.push({
      id: sessionId,
      session_no: `SES-${String(sessionNo).padStart(2, "0")}`,
      date: dateStr,
      time: `${String(hour).padStart(2, "0")}:00:00`,
      duration: status === "COMPLETED" ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : "--",
      total_orders: status === "COMPLETED" ? totalOrders : 0,
      match_rate: status === "COMPLETED" ? matchRate : 0,
      status,
      site_id: Number(siteId),
      site_code: site.site_code,
      site_name: site.site_name,
    })
    sessionNo++
  }

  // placeholder session untuk jam tanpa order (pola recon lama)
  const units = db.prepare("SELECT site_id, site_code, name FROM sites").all()
  const hourKeys = new Set([...buckets.keys()].map((k) => k.split("|")[0]))
  for (const u of units) {
    for (let h = 0; h < 24; h++) {
      if (hourKeys.has(String(h)) || buckets.has(`${h}|${u.site_id}`)) continue
      const sessionId = Number(`${dateStr.replace(/-/g, "").slice(4)}${String(h).padStart(2, "0")}${String(u.site_id).padStart(2, "0")}`)
      sessions.push({
        id: sessionId,
        session_no: `SES-${String(sessionNo).padStart(2, "0")}`,
        date: dateStr,
        time: `${String(h).padStart(2, "0")}:00:00`,
        duration: "--",
        total_orders: 0,
        match_rate: 0,
        status: "NO_ORDERS",
        site_id: u.site_id,
        site_code: u.site_code,
        site_name: u.name,
      })
      sessionNo++
    }
  }

  return sessions.sort((a, b) => a.time.localeCompare(b.time))
}

// GET /api/reconciliation/sessions?date=YYYY-MM-DD (default hari ini)
router.get("/sessions", (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  res.json(sessionsForDate(date))
})

// GET /api/reconciliation/available-dates
router.get("/available-dates", (_req, res) => {
  const rows = db.prepare("SELECT DISTINCT substr(order_date, 1, 10) AS d FROM orders ORDER BY d").all()
  res.json(rows.map((r) => r.d))
})

// GET /api/reconciliation/sessions/:id
router.get("/sessions/:id", (req, res) => {
  const id = Number(req.params.id)
  const dates = db.prepare("SELECT DISTINCT substr(order_date, 1, 10) AS d FROM orders").all().map((r) => r.d)
  let found = null
  let date = null
  for (const d of dates) {
    const list = sessionsForDate(d)
    const s = list.find((x) => x.id === id)
    if (s) {
      found = s
      date = d
      break
    }
  }
  if (!found) return res.status(404).json({ message: "Session tidak ditemukan" })

  // logs sintetis
  const logs = [
    { level: "INFO", step: "START", message: `Reconciliation session ${found.session_no} dimulai`, createdAt: `${date} ${found.time}` },
    { level: "INFO", step: "FETCH", message: `Memuat ${found.total_orders || 0} transaksi dari tabel orders`, createdAt: `${date} ${found.time}` },
    { level: "INFO", step: "MATCH", message: `Mencocokkan ${found.total_orders || 0} order dengan ${found.total_orders || 0} payment`, createdAt: `${date} ${found.time}` },
    found.status === "FAILED"
      ? { level: "ERROR", step: "MATCH", message: `Match rate ${found.match_rate}% di bawah ambang batas — perlu review manual`, createdAt: `${date} ${found.time}` }
      : found.status === "NO_ORDERS"
        ? { level: "WARN", step: "SKIP", message: "Tidak ada transaksi pada sesi ini", createdAt: `${date} ${found.time}` }
        : { level: "INFO", step: "RESULT", message: `Match rate ${found.match_rate}% (${found.total_orders} transaksi)`, createdAt: `${date} ${found.time}` },
    found.status === "COMPLETED"
      ? { level: "INFO", step: "DONE", message: "Sesi selesai tanpa error", createdAt: `${date} ${found.time}` }
      : { level: "ERROR", step: "FAIL", message: "Sesi gagal — simulasi koneksi database terputus", createdAt: `${date} ${found.time}` },
  ]

  res.json({ ...found, logs })
})

module.exports = router
