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

// GET /api/tickets/search?order_no=XXX
// Search tickets by order_no, returns all tickets + payment for that order
// NOTE: must be defined BEFORE /:id to avoid matching "search" as an id
router.get("/search", (req, res) => {
  const { order_no } = req.query
  if (!order_no || !String(order_no).trim()) {
    return res.status(400).json({ message: "order_no wajib diisi" })
  }

  const searchTerm = String(order_no).trim()

  // Find the order first
  const order = db.prepare(
    `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.customer_code
     FROM orders o
     LEFT JOIN customers c ON c.customer_id = o.customer_id
     WHERE o.order_no LIKE ?`
  ).get(`%${searchTerm}%`)

  if (!order) {
    return res.status(404).json({ message: "Order tidak ditemukan" })
  }

  // Get all tickets for this order
  const tickets = db.prepare(
    `SELECT ot.*, od.qty, od.price, od.total_amt AS detail_total,
            p.product_name, p.product_code, s.site_code, s.name AS site_name
     FROM ordertickets ot
     JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id
     LEFT JOIN products p ON p.product_id = od.product_id
     LEFT JOIN sites s ON s.site_id = p.site_id
     WHERE od.order_id = ?
     ORDER BY ot.orderticket_id ASC`
  ).all(order.order_id)

  // Get payment for this order
  const payment = db.prepare(
    `SELECT * FROM payments WHERE order_id = ? ORDER BY transaction_time DESC LIMIT 1`
  ).get(order.order_id)

  const { PAYMENT_STATUS } = require("../utils/status")
  const paymentEnriched = payment ? {
    ...payment,
    status_label: (PAYMENT_STATUS[payment.payment_status] || {}).label || payment.payment_status,
    status_color: (PAYMENT_STATUS[payment.payment_status] || {}).color || "gray",
  } : null

  // Enrich tickets with status labels
  const enrichedTickets = tickets.map((t) => {
    const st = TICKET_STATUS[t.status] || { label: t.status, color: "gray" }
    return {
      ticket_id: t.orderticket_id,
      ticket_no: t.ticket_no,
      ticket_date: t.ticket_date,
      status: st.label,
      status_code: t.status,
      status_color: st.color,
      product_name: t.product_name,
      product_code: t.product_code,
      site_code: t.site_code,
      site_name: t.site_name,
      qty: t.qty,
      price: t.price,
      detail_total: t.detail_total,
    }
  })

  res.json({
    order_id: order.order_id,
    order_no: order.order_no,
    order_date: order.order_date,
    visit_date: order.visit_date,
    order_total: order.total_amt,
    order_status: order.status,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    customer_code: order.customer_code,
    tickets: enrichedTickets,
    payment: paymentEnriched,
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

// POST /api/tickets/:id/resend
// Resend a single ticket — set status to ACTIVE
router.post("/:id/resend", (req, res) => {
  const ticketId = Number(req.params.id)
  const row = db.prepare("SELECT * FROM ordertickets WHERE orderticket_id = ?").get(ticketId)
  if (!row) {
    return res.status(404).json({ message: "Tiket tidak ditemukan" })
  }

  if (row.status === "ACTIVE") {
    return res.status(400).json({ message: "Tiket sudah dalam status ACTIVE" })
  }

  if (row.status === "USED") {
    return res.status(400).json({ message: "Tiket sudah terpakai, tidak bisa dikirim ulang" })
  }

  const now = new Date().toISOString().replace("T", " ").replace("Z", "+00")
  db.prepare("UPDATE ordertickets SET status = 'ACTIVE', updated = ? WHERE orderticket_id = ?").run(now, ticketId)

  const updated = db.prepare(
    `SELECT ot.*, od.order_id, o.order_no,
            p.product_name, p.product_code, s.site_code, s.name AS site_name,
            c.name AS customer_name
     FROM ordertickets ot
     JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id
     JOIN orders o ON o.order_id = od.order_id
     LEFT JOIN products p ON p.product_id = od.product_id
     LEFT JOIN sites s ON s.site_id = p.site_id
     LEFT JOIN customers c ON c.customer_id = o.customer_id
     WHERE ot.orderticket_id = ?`
  ).get(ticketId)

  const st = TICKET_STATUS["ACTIVE"]
  res.json({
    message: "Tiket berhasil dikirim ulang",
    ticket: {
      ticket_id: updated.orderticket_id,
      ticket_no: updated.ticket_no,
      status: st.label,
      status_code: "ACTIVE",
      status_color: st.color,
    },
  })
})

// POST /api/tickets/resend-order
// Resend all eligible tickets in an order at once
router.post("/resend-order", (req, res) => {
  const { order_id } = req.body
  if (!order_id) {
    return res.status(400).json({ message: "order_id wajib diisi" })
  }

  // Find all tickets for this order that are eligible for resend (EXPIRED or REFUND)
  const tickets = db.prepare(
    `SELECT ot.orderticket_id, ot.ticket_no, ot.status
     FROM ordertickets ot
     JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id
     WHERE od.order_id = ? AND ot.status IN ('EXPIRED', 'REFUND')`
  ).all(Number(order_id))

  if (tickets.length === 0) {
    return res.status(400).json({ message: "Tidak ada tiket yang bisa dikirim ulang" })
  }

  const now = new Date().toISOString().replace("T", " ").replace("Z", "+00")
  const updateStmt = db.prepare("UPDATE ordertickets SET status = 'ACTIVE', updated = ? WHERE orderticket_id = ?")

  db.exec("BEGIN")
  for (const t of tickets) {
    updateStmt.run(now, t.orderticket_id)
  }
  db.exec("COMMIT")

  const st = TICKET_STATUS["ACTIVE"]
  res.json({
    message: `${tickets.length} tiket berhasil dikirim ulang`,
    updated_count: tickets.length,
    tickets: tickets.map((t) => ({
      ticket_id: t.orderticket_id,
      ticket_no: t.ticket_no,
      status: st.label,
      status_code: "ACTIVE",
      status_color: st.color,
    })),
  })
})

module.exports = router
