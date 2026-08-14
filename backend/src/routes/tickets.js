"use strict"

const express = require("express")
const { db, paginate } = require("../db")
const { TICKET_STATUS } = require("../utils/status")

const router = express.Router()

const BASE_JOIN = `FROM ordertickets ot
    JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id
    JOIN orders o ON o.order_id = od.order_id
    LEFT JOIN products p ON p.product_id = od.product_id
    LEFT JOIN sites s ON s.site_id = p.site_id
    LEFT JOIN customers c ON c.customer_id = o.customer_id`

// Build filter clauses shared by list & summary endpoints
function buildFilters(query) {
  const { search, status, unit } = query
  const where = []
  const params = []

  if (search) {
    const q = `%${String(search).trim()}%`
    where.push(`(ot.ticket_no LIKE ? OR ot.orderticket_id LIKE ? OR o.order_id LIKE ? OR o.order_no LIKE ? OR c.name LIKE ?)`)
    params.push(q, q, q, q, q)
  }
  if (status && status !== "all") {
    where.push("ot.status = ?")
    params.push(String(status))
  }
  if (unit && unit !== "all") {
    where.push("s.site_code = ?")
    params.push(String(unit))
  }
  return { where, params }
}

// GET /api/tickets
// query: page, per_page, search, status (ACTIVE|USED|EXPIRED|REFUND|all), unit
router.get("/", (req, res) => {
  const page = Number(req.query.page) || 1
  const perPage = Number(req.query.per_page) || 15
  const { where, params } = buildFilters(req.query)

  const sql = `
    SELECT ot.orderticket_id, ot.ticket_no, ot.ticket_date, ot.status AS ticket_status,
           od.order_id, o.order_no, o.customer_id,
           p.product_id, p.product_name, p.product_code,
           s.site_id, s.site_code, s.name AS site_name,
           c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
    ${BASE_JOIN}
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ot.ticket_date DESC, ot.orderticket_id DESC
  `
  const rows = db.prepare(sql).all(...params).map((r) => {
    const st = TICKET_STATUS[r.ticket_status] || { label: r.ticket_status, color: "gray" }
    return {
      ...r,
      ticket_id: r.orderticket_id,
      status: st.label,
      status_code: r.ticket_status,
      status_color: st.color,
    }
  })
  res.json(paginate(rows, page, perPage))
})

// GET /api/tickets/summary — aggregated summary respecting the same filters
router.get("/summary", (req, res) => {
  const { where, params } = buildFilters(req.query)

  const base = `${BASE_JOIN} ${where.length ? "WHERE " + where.join(" AND ") : ""}`

  const row = db.prepare(`SELECT COUNT(*) AS tickets ${base}`).get(...params)

  const statusRows = db.prepare(`SELECT ot.status AS status, COUNT(*) AS cnt ${base} GROUP BY ot.status`).all(...params)

  const statusCounts = { ACTIVE: 0, USED: 0, EXPIRED: 0, REFUND: 0 }
  for (const r of statusRows) {
    if (statusCounts[r.status] !== undefined) statusCounts[r.status] = r.cnt
  }

  res.json({
    tickets: row.tickets,
    status_counts: statusCounts,
  })
})

router.get("/:id", (req, res) => {
  const row = db.prepare(
    `SELECT ot.*, od.order_id, o.order_no, o.order_date, o.visit_date, o.customer_id,
            p.product_name, p.product_code, p.site_id, s.site_code, s.name AS site_name,
            c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
            o.status AS order_status
     FROM ordertickets ot
     JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id
     JOIN orders o ON o.order_id = od.order_id
     LEFT JOIN products p ON p.product_id = od.product_id
     LEFT JOIN sites s ON s.site_id = p.site_id
     LEFT JOIN customers c ON c.customer_id = o.customer_id
     WHERE ot.orderticket_id = ?`
  ).get(Number(req.params.id))
  if (!row) return res.status(404).json({ message: "Ticket tidak ditemukan" })
  const st = TICKET_STATUS[row.status] || { label: row.status, color: "gray" }
  res.json({ ...row, ticket_id: row.orderticket_id, status: st.label, status_color: st.color })
})

module.exports = router
