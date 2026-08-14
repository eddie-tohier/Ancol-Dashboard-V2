"use strict"

const express = require("express")
const bcrypt = require("bcryptjs")
const { db, paginate } = require("../db")
const { getRolesFor } = require("../middleware/auth")

const router = express.Router()

// GET /api/users — daftar user + roles
router.get("/", (req, res) => {
  const { search, role_id } = req.query
  const page = Number(req.query.page) || 1
  const perPage = Number(req.query.per_page) || 15

  const where = []
  const params = []
  if (search) {
    const q = `%${String(search).trim()}%`
    where.push("(email LIKE ? OR nickname LIKE ?)")
    params.push(q, q)
  }
  if (role_id && role_id !== "all") {
    where.push("EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.user_id AND ur.role_id = ?)")
    params.push(Number(role_id))
  }

  const rows = db
    .prepare(
      `SELECT u.user_id, u.email, u.nickname, u.enabled, u.created, u.updated
       FROM users u
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY u.user_id`
    )
    .all(...params)
    .map((u) => ({ ...u, enabled: !!u.enabled, roles: getRolesFor(u.user_id) }))

  res.json(paginate(rows, page, perPage))
})

// GET /api/users/:id
router.get("/:id", (req, res) => {
  const u = db.prepare("SELECT user_id, email, nickname, enabled, created, updated FROM users WHERE user_id = ?").get(Number(req.params.id))
  if (!u) return res.status(404).json({ message: "User tidak ditemukan" })
  res.json({ ...u, enabled: !!u.enabled, roles: getRolesFor(u.user_id) })
})

// POST /api/users — create user
router.post("/", (req, res) => {
  const { email, nickname, password, role_ids } = req.body || {}
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: "Email dan password (min 6 karakter) wajib diisi" })
  }
  const existing = db.prepare("SELECT user_id FROM users WHERE email = ?").get(String(email).trim().toLowerCase())
  if (existing) return res.status(409).json({ message: "Email sudah terdaftar" })

  const now = new Date().toISOString()
  const hash = bcrypt.hashSync(String(password), 8)
  const info = db
    .prepare("INSERT INTO users (email, nickname, password, enabled, created, updated, created_by, updated_by) VALUES (?, ?, ?, 1, ?, ?, 0, 0)")
    .run(String(email).trim().toLowerCase(), nickname || null, hash, now, now)
  const userId = Number(info.lastInsertRowid)

  const roleIds = Array.isArray(role_ids) ? role_ids.map(Number) : []
  const insertUR = db.prepare("INSERT INTO user_roles (user_id, role_id, created_by, updated_by, created, updated) VALUES (?, ?, 0, 0, ?, ?)")
  for (const rid of roleIds) insertUR.run(userId, rid, now, now)

  res.status(201).json({ user_id: userId })
})

// PUT /api/users/:id — update user
router.put("/:id", (req, res) => {
  const userId = Number(req.params.id)
  const existing = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId)
  if (!existing) return res.status(404).json({ message: "User tidak ditemukan" })

  const { nickname, email, password, enabled, role_ids } = req.body || {}
  const updates = []
  const params = []
  if (nickname !== undefined) {
    updates.push("nickname = ?")
    params.push(nickname)
  }
  if (email) {
    updates.push("email = ?")
    params.push(String(email).trim().toLowerCase())
  }
  if (password && password.length >= 6) {
    updates.push("password = ?")
    params.push(bcrypt.hashSync(String(password), 8))
  }
  if (enabled !== undefined) {
    updates.push("enabled = ?")
    params.push(enabled ? 1 : 0)
  }
  if (updates.length) {
    updates.push("updated = ?")
    params.push(new Date().toISOString())
    params.push(userId)
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`).run(...params)
  }

  if (Array.isArray(role_ids)) {
    db.prepare("DELETE FROM user_roles WHERE user_id = ?").run(userId)
    const now = new Date().toISOString()
    const insertUR = db.prepare("INSERT INTO user_roles (user_id, role_id, created_by, updated_by, created, updated) VALUES (?, ?, 0, 0, ?, ?)")
    for (const rid of role_ids.map(Number)) insertUR.run(userId, rid, now, now)
  }

  res.json({ user_id: userId })
})

// DELETE /api/users/:id
router.delete("/:id", (req, res) => {
  const userId = Number(req.params.id)
  const existing = db.prepare("SELECT user_id FROM users WHERE user_id = ?").get(userId)
  if (!existing) return res.status(404).json({ message: "User tidak ditemukan" })
  db.prepare("DELETE FROM user_roles WHERE user_id = ?").run(userId)
  db.prepare("DELETE FROM users WHERE user_id = ?").run(userId)
  res.json({ message: "User dihapus" })
})

// GET /api/users/:id/modules — akses modul user (RBAC ringkas)
router.get("/:id/modules", (req, res) => {
  const userId = Number(req.params.id)
  const modules = db
    .prepare(
      `SELECT DISTINCT m.module_id, m.module_code, m.module_name, m.module_icon, m.module_label, m.sortno
       FROM user_roles ur
       JOIN role_modules rm ON rm.role_id = ur.role_id
       JOIN modules m ON m.module_id = rm.module_id
       WHERE ur.user_id = ?
       ORDER BY m.sortno`
    )
    .all(userId)
  res.json(modules)
})

module.exports = router
