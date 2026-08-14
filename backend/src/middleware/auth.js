"use strict"

const jwt = require("jsonwebtoken")
const { db } = require("../db")

const JWT_SECRET = process.env.JWT_SECRET || "ancol-dashboard-dev-secret"
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || "12h"

// Mock auth (dev): verifikasi token. Login sendiri menerima kredensial apa pun.
function auth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: "Unauthorized" })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: "Unauthorized" })
  }
}

function signToken(user) {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, nickname: user.nickname },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  )
}

function getRolesFor(userId) {
  return db
    .prepare(
      `SELECT r.role_id, r.role_code, r.role_name
       FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = ?`
    )
    .all(userId)
}

module.exports = { auth, signToken, getRolesFor }
