"use strict"

const path = require("node:path")
const fs = require("node:fs")
const { DatabaseSync } = require("node:sqlite")
const { SCHEMA_SQL } = require("./schema")

const DB_PATH = path.join(__dirname, "..", "data", "ancol-rec-hub.db")

if (!fs.existsSync(DB_PATH)) {
  console.error(`[db] Database tidak ditemukan di ${DB_PATH}. Jalankan dulu: npm run seed`)
  process.exit(1)
}

const db = new DatabaseSync(DB_PATH)
db.exec(SCHEMA_SQL)

// helper pagination: {data, current_page, last_page, total, per_page}
function paginate(all, page, perPage) {
  page = Math.max(1, Number(page) || 1)
  perPage = Math.max(1, Number(perPage) || 15)
  const total = all.length
  const start = (page - 1) * perPage
  const data = all.slice(start, start + perPage)
  return {
    data,
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    total,
    per_page: perPage,
  }
}

// query list sederhana dengan SQL dinamis (semua input ter-parameterisasi)
function runList(table, { where = [], params = [], page, perPage, orderBy }) {
  const sql = `SELECT * FROM ${table} ${where.length ? "WHERE " + where.join(" AND ") : ""} ${orderBy ? `ORDER BY ${orderBy}` : ""}`
  const rows = db.prepare(sql).all(...params)
  return paginate(rows, page, perPage)
}

module.exports = { db, DB_PATH, paginate, runList }
