"use strict"

const express = require("express")
const bcrypt = require("bcryptjs")
const { db } = require("../db")
const { auth, signToken, getRolesFor } = require("../middleware/auth")

const router = express.Router()

// Mock login: verifikasi bcrypt bila user ditemukan, tapi terima juga sembarang
// kombinasi untuk mode demo. Role default: Super Admin bila tidak ditemukan.
router.post("/login", (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi" })
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).trim().toLowerCase())
  let roles
  let displayUser

  if (user && user.password) {
    const ok = bcrypt.compareSync(String(password), user.password)
    if (ok) {
      roles = getRolesFor(user.user_id)
      displayUser = { user_id: user.user_id, email: user.email, nickname: user.nickname, enabled: !!user.enabled }
    }
  }

  // Fallback demo: terima sembarang kredensial sebagai Super Admin
  if (!displayUser) {
    displayUser = { user_id: 0, email: String(email).trim(), nickname: "Super Admin (Demo)", enabled: true }
    roles = [{ role_id: 0, role_code: "SA", role_name: "Super Admin" }]
  }

  const token = signToken(displayUser)
  res.json({ token, user: displayUser, roles })
})

router.get("/me", auth, (req, res) => {
  const user = db.prepare("SELECT user_id, email, nickname, enabled FROM users WHERE user_id = ?").get(req.user.user_id)
  const roles = getRolesFor(req.user.user_id)
  if (user) {
    return res.json({ user: { ...user, enabled: !!user.enabled }, roles })
  }
  res.json({ user: { user_id: req.user.user_id, email: req.user.email, nickname: req.user.nickname }, roles })
})

router.post("/logout", auth, (_req, res) => {
  res.json({ message: "Logged out" })
})

router.put("/me", auth, (req, res) => {
  const { nickname, password } = req.body || {}
  const user = db.prepare("SELECT * FROM users WHERE user_id = ?").get(req.user.user_id)
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" })

  const updates = []
  const params = []
  if (nickname) {
    updates.push("nickname = ?")
    params.push(String(nickname))
  }
  if (password && password.length >= 6) {
    updates.push("password = ?")
    params.push(bcrypt.hashSync(String(password), 8))
  }
  if (updates.length) {
    updates.push("updated = ?")
    params.push(new Date().toISOString())
    params.push(user.user_id)
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`).run(...params)
  }
  res.json({ user: db.prepare("SELECT user_id, email, nickname, enabled FROM users WHERE user_id = ?").get(user.user_id) })
})

module.exports = router
