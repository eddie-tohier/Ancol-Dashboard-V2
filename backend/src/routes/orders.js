"use strict"

const express = require("express")
const { db, paginate } = require("../db")
const { enrichOrders, getOrderDetail } = require("../utils/enrich")

const router = express.Router()

// Build filter clauses shared by list & summary endpoints
function buildFilters(query) {
  const { search, status, unit, date_type = "order_date", date_from, date_to } = query
  const where = []
  const params = []

  if (search) {
    const q = `%${String(search).trim()}%`
    where.push(`(o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR c.customer_code LIKE ?)`)
    params.push(q, q, q, q)
  }
  if (status && status !== "all") {
    where.push("o.status = ?")
    params.push(String(status))
  }
  if (unit && unit !== "all") {
    where.push(`EXISTS (SELECT 1 FROM orderdetails od JOIN products p ON p.product_id = od.product_id JOIN sites s ON s.site_id = p.site_id WHERE od.order_id = o.order_id AND s.site_code = ?)`)
    params.push(String(unit))
  }
  const dateCol = date_type === "visit_date" ? "o.visit_date" : "o.order_date"
  if (date_from) {
    where.push(`${dateCol} >= ?`)
    params.push(`${String(date_from)} 00:00:00`)
  }
  if (date_to) {
    where.push(`${dateCol} < ?`)
    params.push(`${String(date_to)} 23:59:59`)
  }
  return { where, params }
}

// GET /api/orders
// query: page, per_page, search, status (PD|TI|PE|FL|all), unit (site_code),
//        date_type (order_date|visit_date), date_from, date_to, sort (field_dir)
router.get("/", (req, res) => {
  const { sort } = req.query
  const page = Number(req.query.page) || 1
  const perPage = Number(req.query.per_page) || 10
  const { where, params } = buildFilters(req.query)

  const allowedSort = {
    order_id: "o.order_id",
    order_no: "o.order_no",
    customer: "c.name",
    amount: "o.total_amt",
    status: "o.status",
    order_date: "o.order_date",
    visit_date: "o.visit_date",
  }
  let orderBy = "o.order_date DESC"
  if (sort) {
    const [field, dir] = String(sort).split("_")
    if (allowedSort[field]) {
      orderBy = `${allowedSort[field]} ${dir === "asc" ? "ASC" : "DESC"}`
    }
  }

  const sql = `
    SELECT o.* FROM orders o
    LEFT JOIN customers c ON c.customer_id = o.customer_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ${orderBy}
  `
  const rows = db.prepare(sql).all(...params)
  const result = paginate(rows, page, perPage)
  result.data = enrichOrders(result.data)
  res.json(result)
})

// GET /api/orders/summary — aggregated summary respecting the same filters
router.get("/summary", (req, res) => {
  const { where, params } = buildFilters(req.query)

  const base = `FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id ${where.length ? "WHERE " + where.join(" AND ") : ""}`

  const row = db
    .prepare(
      `SELECT COUNT(*) AS orders,
              SUM(CASE WHEN o.status IN ('PD','TI') THEN o.total_amt ELSE 0 END) AS revenue,
              SUM(CASE WHEN o.status IN ('PD','TI') THEN o.base_amt ELSE 0 END) AS base_amt,
              SUM(CASE WHEN o.status IN ('PD','TI') THEN o.pbjt_amt ELSE 0 END) AS pbjt_amt,
              SUM(o.total_amt) AS gross_amt
       ${base}`
    )
    .get(...params)

  const statusRows = db
    .prepare(`SELECT o.status, COUNT(*) AS cnt FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id ${where.length ? "WHERE " + where.join(" AND ") : ""} GROUP BY o.status`)
    .all(...params)

  const statusCounts = { PD: 0, TI: 0, PE: 0, FL: 0 }
  for (const r of statusRows) {
    if (statusCounts[r.status] !== undefined) statusCounts[r.status] = r.cnt
  }

  const orderIds = db.prepare(`SELECT o.order_id ${base}`).all(...params).map((r) => r.order_id)
  let tickets = 0
  if (orderIds.length) {
    tickets = db
      .prepare(
        `SELECT COALESCE(SUM(od.qty), 0) AS t FROM orderdetails od WHERE od.order_id IN (${orderIds.map(() => "?").join(",")})`
      )
      .get(...orderIds).t
  }

  res.json({
    orders: row.orders,
    revenue: Math.round(row.revenue || 0),
    gross_amt: Math.round(row.gross_amt || 0),
    base_amt: Math.round(row.base_amt || 0),
    pbjt_amt: Math.round(row.pbjt_amt || 0),
    tickets,
    status_counts: statusCounts,
  })
})

// GET /api/orders/:id — detail + items + tickets + payment
router.get("/:id", (req, res) => {
  const order = getOrderDetail(Number(req.params.id))
  if (!order) return res.status(404).json({ message: "Order tidak ditemukan" })
  res.json(order)
})

module.exports = router
