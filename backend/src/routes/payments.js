"use strict"

const express = require("express")
const { db, paginate } = require("../db")
const { enrichPayments, getPaymentDetail } = require("../utils/enrich")

const router = express.Router()

// Build filter clauses shared by list & summary endpoints
function buildFilters(query) {
  const { search, status, method, date_from, date_to } = query
  const where = []
  const params = []

  if (search) {
    const q = `%${String(search).trim()}%`
    where.push(`(p.payment_id LIKE ? OR p.order_id LIKE ? OR c.name LIKE ? OR p.transaction_id LIKE ?)`)
    params.push(q, q, q, q)
  }
  if (status && status !== "all") {
    where.push("p.payment_status = ?")
    params.push(String(status))
  }
  if (method && method !== "all") {
    where.push("p.payment_method = ?")
    params.push(String(method))
  }
  if (date_from) {
    where.push("p.transaction_time >= ?")
    params.push(`${String(date_from)} 00:00:00`)
  }
  if (date_to) {
    where.push("p.transaction_time < ?")
    params.push(`${String(date_to)} 23:59:59`)
  }
  return { where, params }
}

// GET /api/payments
// query: page, per_page, search, status (PS|PE|FL|all), method (va|pg|all),
//        date_from, date_to, sort
router.get("/", (req, res) => {
  const { sort } = req.query
  const page = Number(req.query.page) || 1
  const perPage = Number(req.query.per_page) || 15
  const { where, params } = buildFilters(req.query)

  const allowedSort = {
    payment_id: "p.payment_id",
    order_id: "p.order_id",
    customer: "c.name",
    amount: "p.payment_amt",
    payment_method: "p.payment_method",
    status: "p.payment_status",
    paid_at: "p.transaction_time",
  }
  let orderBy = "p.transaction_time DESC"
  if (sort) {
    const [field, dir] = String(sort).split("_")
    if (allowedSort[field]) orderBy = `${allowedSort[field]} ${dir === "asc" ? "ASC" : "DESC"}`
  }

  const sql = `
    SELECT p.* FROM payments p
    LEFT JOIN orders o ON o.order_id = p.order_id
    LEFT JOIN customers c ON c.customer_id = o.customer_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ${orderBy}
  `
  const rows = db.prepare(sql).all(...params)
  const result = paginate(rows, page, perPage)
  result.data = enrichPayments(result.data)
  res.json(result)
})

// GET /api/payments/summary — aggregated summary respecting the same filters
router.get("/summary", (req, res) => {
  const { where, params } = buildFilters(req.query)

  const base = `FROM payments p LEFT JOIN orders o ON o.order_id = p.order_id LEFT JOIN customers c ON c.customer_id = o.customer_id ${where.length ? "WHERE " + where.join(" AND ") : ""}`

  const row = db
    .prepare(
      `SELECT COUNT(*) AS payments,
              SUM(CASE WHEN p.payment_status = 'PS' THEN p.payment_amt ELSE 0 END) AS collected,
              SUM(p.payment_amt) AS total_amt
       ${base}`
    )
    .get(...params)

  const statusRows = db
    .prepare(`SELECT p.payment_status AS status, COUNT(*) AS cnt ${base} GROUP BY p.payment_status`)
    .all(...params)

  const statusCounts = { PS: 0, PE: 0, FL: 0 }
  for (const r of statusRows) {
    if (statusCounts[r.status] !== undefined) statusCounts[r.status] = r.cnt
  }

  res.json({
    payments: row.payments,
    collected: Math.round(row.collected || 0),
    total_amt: Math.round(row.total_amt || 0),
    status_counts: statusCounts,
  })
})

router.get("/:id", (req, res) => {
  const payment = getPaymentDetail(Number(req.params.id))
  if (!payment) return res.status(404).json({ message: "Payment tidak ditemukan" })
  res.json(payment)
})

module.exports = router
