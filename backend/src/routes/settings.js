"use strict"

const express = require("express")
const { db } = require("../db")

const router = express.Router()

// GET /api/settings — config umum (revenue sharing & PBJT)
router.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM systemsetting WHERE systemsetting_id = 1").get())
})

// PUT /api/settings — update config
router.put("/", (req, res) => {
  const { revsharing_pct, pbjt_rate, is_pbjt_include } = req.body || {}
  const existing = db.prepare("SELECT * FROM systemsetting WHERE systemsetting_id = 1").get()
  if (!existing) return res.status(404).json({ message: "Setting tidak ditemukan" })

  const next = {
    revsharing_pct: revsharing_pct !== undefined ? Number(revsharing_pct) : existing.revsharing_pct,
    pbjt_rate: pbjt_rate !== undefined ? Number(pbjt_rate) : existing.pbjt_rate,
    is_pbjt_include: is_pbjt_include !== undefined ? (is_pbjt_include ? 1 : 0) : existing.is_pbjt_include,
  }

  db.prepare("UPDATE systemsetting SET revsharing_pct = ?, pbjt_rate = ?, is_pbjt_include = ?, updated = ? WHERE systemsetting_id = 1").run(
    next.revsharing_pct,
    next.pbjt_rate,
    next.is_pbjt_include,
    new Date().toISOString()
  )

  res.json(db.prepare("SELECT * FROM systemsetting WHERE systemsetting_id = 1").get())
})

module.exports = router
