"use strict"

const express = require("express")
const { db } = require("../db")

const router = express.Router()

// GET /api/sites/summary — agregasi wahana (murni dari DB)
router.get("/summary", (_req, res) => {
  const sites = db.prepare("SELECT COUNT(*) AS c FROM sites").get().c
  const products = db.prepare("SELECT COUNT(*) AS c FROM products").get().c
  const activeProducts = db.prepare("SELECT COUNT(DISTINCT product_id) AS c FROM orderdetails").get().c
  const ticketsIssued = db.prepare("SELECT COUNT(*) AS c FROM ordertickets").get().c

  res.json({
    sites,
    products,
    active_products: activeProducts,
    tickets_issued: ticketsIssued,
  })
})

// GET /api/sites — daftar wahana beserta produk & tiket (murni dari DB)
router.get("/", (_req, res) => {
  const sites = db.prepare("SELECT * FROM sites ORDER BY seqno").all()

  const result = sites.map((s) => {
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

    return {
      site_id: s.site_id,
      site_code: s.site_code,
      name: s.name,
      active_products: activeProducts,
      tickets_issued: ticketsIssued,
      products,
    }
  })

  res.json(result)
})

module.exports = router
