"use strict"

const express = require("express")
const { db } = require("../db")

const router = express.Router()

function dateFilterClause(period, dateFrom, dateTo) {
  // custom range takes precedence over period presets
  if (dateFrom) {
    const clauses = ["substr(o.order_date,1,10) >= ?"]
    const params = [dateFrom]
    if (dateTo) {
      clauses.push("substr(o.order_date,1,10) <= ?")
      params.push(dateTo)
    }
    return { where: clauses.join(" AND "), params }
  }

  // SQLite: order_date simpanan berbentuk 'YYYY-MM-DD HH:MM:SS.mmm+00'
  const today = new Date()
  const pad = (n) => String(n).padStart(2, "0")
  const dstr = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

  switch (period) {
    case "today": {
      const d = dstr(today)
      return { where: "substr(o.order_date,1,10) = ?", params: [d] }
    }
    case "week": {
      const from = new Date(today)
      from.setUTCDate(from.getUTCDate() - 6)
      const fromStr = dstr(from)
      return { where: "substr(o.order_date,1,10) >= ?", params: [fromStr] }
    }
    case "month": {
      const from = new Date(today)
      from.setUTCMonth(from.getUTCMonth() - 1)
      const fromStr = dstr(from)
      return { where: "substr(o.order_date,1,10) >= ?", params: [fromStr] }
    }
    default:
      return { where: "", params: [] }
  }
}

router.get("/stats", (req, res) => {
  const period = req.query.period || "week"
  const { where, params } = dateFilterClause(period, req.query.date_from, req.query.date_to)

  const orders = db.prepare(`SELECT * FROM orders o ${where ? "WHERE " + where : ""}`).all(...params)
  const orderIds = orders.map((o) => o.order_id)

  const totalRevenue = orders.filter((o) => o.status === "PD" || o.status === "TI").reduce((s, o) => s + o.total_amt, 0)

  let tickets = []
  let ticketsUsed = 0
  if (orderIds.length) {
    const ticketsSql = `
      SELECT ot.status, od.order_id FROM ordertickets ot
      JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id
      WHERE od.order_id IN (${orderIds.map(() => "?").join(",")})`
    tickets = db.prepare(ticketsSql).all(...orderIds)
    ticketsUsed = tickets.filter((t) => t.status === "USED").length
  }

  const statusCount = { PD: 0, TI: 0, PE: 0, FL: 0 }
  for (const o of orders) if (statusCount[o.status] !== undefined) statusCount[o.status]++

  const uniqueCustomers = new Set(orders.map((o) => o.customer_id).filter(Boolean)).size

  res.json({
    period,
    revenue: Math.round(totalRevenue),
    revenue_formatted: `Rp ${Math.round(totalRevenue).toLocaleString("id-ID")}`,
    orders: orders.length,
    tickets_issued: tickets.length,
    tickets_used: ticketsUsed,
    customers: uniqueCustomers,
    status_counts: statusCount,
  })
})

// chart: order + revenue per hari
router.get("/charts", (req, res) => {
  const period = req.query.period || "week"
  let days = period === "month" ? 30 : period === "today" ? 1 : 7
  if (req.query.date_from) {
    const f = new Date(req.query.date_from)
    const t = req.query.date_to ? new Date(req.query.date_to) : f
    days = Math.round((t - f) / 86400000) + 1
    if (days < 1) days = 1
  }
  const { where, params } = dateFilterClause(period, req.query.date_from, req.query.date_to)

  const orders = db.prepare(`SELECT order_id, order_date, total_amt, status FROM orders o ${where ? "WHERE " + where : ""}`).all(...params)
  const byDay = {}
  if (req.query.date_from) {
    const parse = (s) => s.split("-").map(Number)
    const [fy, fm, fd] = parse(req.query.date_from)
    const [ty, tm, td] = parse(req.query.date_to || req.query.date_from)
    const start = new Date(Date.UTC(fy, fm - 1, fd))
    const end = new Date(Date.UTC(ty, tm - 1, td))
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
      byDay[key] = { date: key, orders: 0, revenue: 0, tickets: 0 }
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
      byDay[key] = { date: key, orders: 0, revenue: 0, tickets: 0 }
    }
  }

  const ticketStmt = db.prepare(`SELECT od.order_id, COUNT(*) c FROM ordertickets ot JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id WHERE od.order_id = ? GROUP BY od.order_id`)
  for (const o of orders) {
    const key = String(o.order_date).slice(0, 10)
    if (byDay[key]) {
      byDay[key].orders++
      if (o.status === "PD" || o.status === "TI") byDay[key].revenue += o.total_amt
      const t = ticketStmt.get(o.order_id)
      if (t) byDay[key].tickets += t.c
    }
  }

  const series = Object.values(byDay).map((d) => ({
    ...d,
    revenue: Math.round(d.revenue),
    tickets_used: 0,
  }))

  // customer growth: customer baru (first-time) vs lama (returning) per hari
  const firstPurchase = {}
  for (const r of db
    .prepare(`SELECT customer_id, MIN(order_date) AS first FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id`)
    .all()) {
    firstPurchase[r.customer_id] = String(r.first).slice(0, 10)
  }
  const activeByDay = {}
  for (const r of db
    .prepare(`SELECT o.customer_id, substr(o.order_date, 1, 10) AS d FROM orders o WHERE o.customer_id IS NOT NULL ${where ? "AND " + where : ""}`)
    .all(...params)) {
    if (!byDay[r.d]) continue
    if (!activeByDay[r.d]) activeByDay[r.d] = { date: r.d, new_customers: 0, returning_customers: 0 }
    if (firstPurchase[r.customer_id] === r.d) activeByDay[r.d].new_customers++
    else activeByDay[r.d].returning_customers++
  }
  const customerGrowth = Object.values(byDay).map((d) =>
    activeByDay[d.date] || { date: d.date, new_customers: 0, returning_customers: 0 }
  )

  // distribusi per site
  const bySite = db
    .prepare(
      `SELECT s.site_code, s.name AS site_name, COUNT(DISTINCT o.order_id) AS orders,
              SUM(CASE WHEN o.status IN ('PD','TI') THEN o.total_amt ELSE 0 END) AS revenue
       FROM orders o
       JOIN orderdetails od ON od.order_id = o.order_id
       JOIN products p ON p.product_id = od.product_id
       JOIN sites s ON s.site_id = p.site_id
       ${where ? "WHERE " + where : ""}
       GROUP BY s.site_id
       ORDER BY revenue DESC`
    )
    .all(...params)
    .map((r) => ({ ...r, revenue: Math.round(r.revenue) }))

  // top products
  const topProducts = db
    .prepare(
      `SELECT p.product_code, p.product_name, SUM(od.qty) AS qty, SUM(od.total_amt) AS revenue
       FROM orderdetails od
       JOIN orders o ON o.order_id = od.order_id
       JOIN products p ON p.product_id = od.product_id
       ${where ? "WHERE " + where : ""}
       GROUP BY p.product_id
       ORDER BY revenue DESC
       LIMIT 6`
    )
    .all(...params)
    .map((r) => ({ ...r, revenue: Math.round(r.revenue) }))

  res.json({ series, by_site: bySite, top_products: topProducts, customer_growth: customerGrowth })
})

// revenue sharing breakdown
router.get("/sharing", (req, res) => {
  const period = req.query.period || "week"
  const { where, params } = dateFilterClause(period, req.query.date_from, req.query.date_to)

  const row = db
    .prepare(
      `SELECT SUM(CASE WHEN o.status IN ('PD','TI') THEN o.total_amt ELSE 0 END) AS total_revenue,
              SUM(CASE WHEN o.status IN ('PD','TI') THEN o.base_amt ELSE 0 END) AS base_amt,
              SUM(CASE WHEN o.status IN ('PD','TI') THEN o.pbjt_amt ELSE 0 END) AS pbjt_amt
       FROM orders o ${where ? "WHERE " + where : ""}`
    )
    .get(...params)

  const setting = db.prepare("SELECT revsharing_pct, pbjt_rate, is_pbjt_include FROM systemsetting WHERE systemsetting_id = 1").get()

  const totalRevenue = row.total_revenue || 0
  const base = row.base_amt || 0
  const pbjt = row.pbjt_amt || 0
  const pct = Number(setting?.revsharing_pct) || 0
  const partnerShare = Math.round((base * pct) / 100)
  const pjaShare = Math.round(base - partnerShare)

  res.json({
    period,
    total_revenue: Math.round(totalRevenue),
    base_amt: Math.round(base),
    pbjt_amt: Math.round(pbjt),
    revsharing_pct: pct,
    pbjt_rate: Number(setting?.pbjt_rate) || 10,
    is_pbjt_include: !!setting?.is_pbjt_include,
    partner_share: partnerShare,
    pja_share: pjaShare,
  })
})

// summary per unit/site
router.get("/summary", (req, res) => {
  const { where, params } = dateFilterClause(req.query.period || "week", req.query.date_from, req.query.date_to)
  const bySite = db
    .prepare(
      `SELECT s.site_id, s.site_code, s.name AS site_name, COUNT(DISTINCT o.order_id) AS orders,
              SUM(CASE WHEN o.status IN ('PD','TI') THEN o.total_amt ELSE 0 END) AS revenue,
              SUM(od.qty) AS tickets
       FROM orders o
       JOIN orderdetails od ON od.order_id = o.order_id
       JOIN products p ON p.product_id = od.product_id
       JOIN sites s ON s.site_id = p.site_id
       ${where ? "WHERE " + where : ""}
       GROUP BY s.site_id
       ORDER BY revenue DESC`
    )
    .all(...params)
    .map((r) => ({ ...r, revenue: Math.round(r.revenue) }))

  res.json(bySite)
})

module.exports = router
