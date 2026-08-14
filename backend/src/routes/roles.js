"use strict"

const express = require("express")
const { db } = require("../db")

const rolesRouter = express.Router()
const modulesRouter = express.Router()

// GET /api/roles
rolesRouter.get("/", (_req, res) => {
  const roles = db
    .prepare("SELECT role_id, role_code, role_name, description FROM roles ORDER BY role_id")
    .all()
    .map((r) => ({
      ...r,
      user_count: db.prepare("SELECT COUNT(*) AS c FROM user_roles WHERE role_id = ?").get(r.role_id).c,
      modules: db
        .prepare(
          `SELECT m.module_id, m.module_code, m.module_name, m.description, m.sortno
           FROM role_modules rm JOIN modules m ON m.module_id = rm.module_id
           WHERE rm.role_id = ?
           ORDER BY m.sortno`
        )
        .all(r.role_id),
    }))
  res.json(roles)
})

// PUT /api/roles/:id/modules — atur akses modul sebuah role
rolesRouter.put("/:id/modules", (req, res) => {
  const roleId = Number(req.params.id)
  const existing = db.prepare("SELECT role_id FROM roles WHERE role_id = ?").get(roleId)
  if (!existing) return res.status(404).json({ message: "Role tidak ditemukan" })

  const { module_ids } = req.body || {}
  const moduleIds = Array.isArray(module_ids) ? module_ids.map(Number) : []

  const now = new Date().toISOString()
  db.prepare("DELETE FROM role_modules WHERE role_id = ?").run(roleId)
  const insert = db.prepare(
    "INSERT INTO role_modules (module_id, role_id, description, created, updated, updated_by, created_by, read_only) VALUES (?, ?, 'manual', ?, ?, 0, 0, 0)"
  )
  for (const mid of moduleIds) insert.run(mid, roleId, now, now)

  res.json({ role_id: roleId, module_ids: moduleIds })
})

// GET /api/modules
modulesRouter.get("/", (_req, res) => {
  res.json(db.prepare("SELECT module_id, module_code, module_name, module_icon, module_label, sortno, description FROM modules ORDER BY sortno").all())
})

module.exports = { rolesRouter, modulesRouter }
