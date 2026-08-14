"use strict"

const express = require("express")
const { db } = require("../db")

const router = express.Router()

// GET /api/sites — status sync wahana
// syncStatus deterministik: swa=syncing, jbl=error, sisanya synced
router.get("/", (_req, res) => {
  const sites = db.prepare("SELECT * FROM sites ORDER BY seqno").all()

  const result = sites.map((s, i) => {
    let syncStatus = "synced"
    if (s.site_code === "swa") syncStatus = "syncing"
    if (s.site_code === "jbl") syncStatus = "error"

    const products = db.prepare("SELECT * FROM products WHERE site_id = ?").all(s.site_id)
    const productIds = products.map((p) => p.product_id)
    let ticketsIssued = 0
    let activeProducts = 0
    if (productIds.length) {
      const t = db
        .prepare(`SELECT COUNT(*) AS c FROM ordertickets ot JOIN orderdetails od ON od.orderdetail_id = ot.orderdetail_id WHERE od.product_id IN (${productIds.map(() => "?").join(",")})`)
        .get(...productIds)
      ticketsIssued = t.c
      const ap = db
        .prepare(`SELECT COUNT(DISTINCT od.product_id) AS c FROM orderdetails od WHERE od.product_id IN (${productIds.map(() => "?").join(",")})`)
        .get(...productIds)
      activeProducts = ap.c || products.length
    }

    const lastSyncMin = i * 5 + (i * 7) % 4
    const lastSync = new Date(Date.now() - lastSyncMin * 60000).toISOString()

    return {
      site_id: s.site_id,
      site_code: s.site_code,
      name: s.name,
      sync_status: syncStatus,
      last_sync: lastSync,
      active_products: activeProducts,
      tickets_issued: ticketsIssued,
      products,
    }
  })

  res.json(result)
})

module.exports = router
