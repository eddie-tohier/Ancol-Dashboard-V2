"use strict"

const { db } = require("../db")
const { ORDER_STATUS, PAYMENT_STATUS } = require("./status")

const CUSTOMER_STMT = db.prepare("SELECT * FROM customers WHERE customer_id = ?")
const DETAILS_STMT = db.prepare(
  `SELECT od.*, p.product_code, p.product_name, p.site_id, s.site_code, s.name AS site_name
   FROM orderdetails od
   LEFT JOIN products p ON p.product_id = od.product_id
   LEFT JOIN sites s ON s.site_id = p.site_id
   WHERE od.order_id = ?`
)
const PAYMENT_STMT = db.prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY transaction_time DESC")
const TICKETS_STMT = db.prepare(
  `SELECT ot.*, od.order_id
   FROM ordertickets ot
   JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id
   WHERE od.order_id = ?`
)
const ORDER_STMT = db.prepare("SELECT * FROM orders WHERE order_id = ?")

function statusOf(orderStatus, map = ORDER_STATUS) {
  return map[orderStatus] || { code: orderStatus, label: orderStatus, color: "gray" }
}

function attachCustomer(row) {
  if (!row || !row.customer_id) return row
  const c = CUSTOMER_STMT.get(row.customer_id)
  if (c) {
    row.customer_name = c.name
    row.customer_phone = c.phone
    row.customer_email = c.email
    row.customer_code = c.customer_code
  }
  return row
}

// Enrich list of orders: tambah customer + items + status objek
function enrichOrders(orders) {
  const stmt = db.prepare(
    `SELECT od.order_id, od.qty, od.price, od.total_amt, od.product_id, p.product_code, p.product_name, p.site_id, s.site_code, s.name AS site_name
     FROM orderdetails od
     LEFT JOIN products p ON p.product_id = od.product_id
     LEFT JOIN sites s ON s.site_id = p.site_id
     WHERE od.order_id IN (${orders.map(() => "?").join(",")})`
  )
  const details = orders.length ? stmt.all(...orders.map((o) => o.order_id)) : []
  const byOrder = {}
  for (const d of details) {
    ;(byOrder[d.order_id] = byOrder[d.order_id] || []).push(d)
  }
  return orders.map((o) => {
    const items = byOrder[o.order_id] || []
    const customer = o.customer_id ? CUSTOMER_STMT.get(o.customer_id) : null
    const totalQty = items.reduce((s, it) => s + it.qty, 0)
    const statusObj = statusOf(o.status)
    return {
      ...o,
      status_label: statusObj.label,
      status_color: statusObj.color,
      customer_name: customer?.name || "-",
      customer_phone: customer?.phone || "-",
      customer_email: customer?.email || null,
      customer_code: customer?.customer_code || null,
      items,
      total_qty: totalQty,
      unit_ids: [...new Set(items.map((it) => it.site_code).filter(Boolean))],
    }
  })
}

function getOrderDetail(orderId) {
  const order = ORDER_STMT.get(orderId)
  if (!order) return null
  const items = DETAILS_STMT.all(orderId)
  const payment = PAYMENT_STMT.get(orderId)
  const tickets = TICKETS_STMT.all(orderId)
  const customer = order.customer_id ? CUSTOMER_STMT.get(order.customer_id) : null
  const statusObj = statusOf(order.status)

  return {
    ...order,
    status_label: statusObj.label,
    status_color: statusObj.color,
    customer_name: customer?.name || "-",
    customer_phone: customer?.phone || "-",
    customer_email: customer?.email || null,
    customer_code: customer?.customer_code || null,
    items,
    tickets,
    payment: payment
      ? {
          ...payment,
          status_label: (PAYMENT_STATUS[payment.payment_status] || {}).label || payment.payment_status,
          status_color: (PAYMENT_STATUS[payment.payment_status] || {}).color || "gray",
        }
      : null,
  }
}

function enrichPayments(payments) {
  const orderIds = [...new Set(payments.map((p) => p.order_id).filter(Boolean))]
  const orders = orderIds.length
    ? db.prepare(`SELECT * FROM orders WHERE order_id IN (${orderIds.map(() => "?").join(",")})`).all(...orderIds)
    : []
  const byId = {}
  for (const o of orders) byId[o.order_id] = o

  return payments.map((p) => {
    const order = p.order_id ? byId[p.order_id] : null
    const customer = order?.customer_id ? CUSTOMER_STMT.get(order.customer_id) : null
    const statusObj = PAYMENT_STATUS[p.payment_status] || { label: p.payment_status, color: "gray" }
    return {
      ...p,
      status_label: statusObj.label,
      status_color: statusObj.color,
      gateway: "Midtrans",
      order_no: order?.order_no || null,
      order_date: order?.order_date || null,
      order_status: order?.status || null,
      customer_name: customer?.name || (p.order_id ? "—" : "Orphan"),
      customer_phone: customer?.phone || "-",
    }
  })
}

function getPaymentDetail(paymentId) {
  const payment = db.prepare("SELECT * FROM payments WHERE payment_id = ?").get(paymentId)
  if (!payment) return null
  return enrichPayments([payment])[0]
}

module.exports = {
  statusOf,
  attachCustomer,
  enrichOrders,
  getOrderDetail,
  enrichPayments,
  getPaymentDetail,
  CUSTOMER_STMT,
  DETAILS_STMT,
}
