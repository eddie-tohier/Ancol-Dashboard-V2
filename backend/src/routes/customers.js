"use strict"

const express = require("express")
const { db, paginate } = require("../db")

const router = express.Router()

function enrich(customers) {
  const ids = customers.map((c) => c.customer_id)
  const orders = ids.length
    ? db.prepare(`SELECT customer_id, COUNT(*) AS total_orders, MAX(order_date) AS last_visit FROM orders WHERE customer_id IN (${ids.map(() => "?").join(",")}) GROUP BY customer_id`).all(...ids)
    : []
  const byId = {}
  for (const o of orders) byId[o.customer_id] = o
  return customers.map((c) => {
    const agg = byId[c.customer_id] || { total_orders: 0, last_visit: null }
    return { ...c, total_orders: agg.total_orders, last_visit: agg.last_visit }
  })
}

router.get("/", (req, res) => {
  const { search, activity, date_from, date_to } = req.query
  const page = Number(req.query.page) || 1
  const perPage = Number(req.query.per_page) || 15

  const where = []
  const params = []
  if (search) {
    const q = `%${String(search).trim()}%`
    where.push("(name LIKE ? OR phone LIKE ? OR email LIKE ? OR customer_code LIKE ?)")
    params.push(q, q, q, q)
  }
  if (activity === "active") {
    where.push("EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = customers.customer_id)")
  } else if (activity === "inactive") {
    where.push("NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = customers.customer_id)")
  }
  if (date_from) {
    where.push("(SELECT MAX(o.order_date) FROM orders o WHERE o.customer_id = customers.customer_id) >= ?")
    params.push(`${String(date_from)} 00:00:00`)
  }
  if (date_to) {
    where.push("(SELECT MAX(o.order_date) FROM orders o WHERE o.customer_id = customers.customer_id) < ?")
    params.push(`${String(date_to)} 23:59:59`)
  }

  const rows = db.prepare(
    `SELECT * FROM customers ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY customer_id`
  ).all(...params)
  const result = paginate(rows, page, perPage)
  result.data = enrich(result.data)
  res.json(result)
})

// GET /api/customers/summary — agregasi pelanggan
router.get("/summary", (_req, res) => {
  const customers = db.prepare("SELECT COUNT(*) AS c FROM customers").get().c
  const totalOrders = db.prepare("SELECT COUNT(*) AS c FROM orders").get().c
  const activeCustomers = db
    .prepare("SELECT COUNT(DISTINCT customer_id) AS c FROM orders WHERE customer_id IS NOT NULL")
    .get().c

  res.json({
    customers,
    total_orders: totalOrders,
    avg_orders: customers ? Number((totalOrders / customers).toFixed(1)) : 0,
    active_customers: activeCustomers,
  })
})

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM customers WHERE customer_id = ?").get(Number(req.params.id))
  if (!row) return res.status(404).json({ message: "Customer tidak ditemukan" })
  res.json(enrich([row])[0])
})

module.exports = router
