"use strict"

const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("node:path")

const { db } = require("./db")
const { auth } = require("./middleware/auth")

const { openapi } = require("./openapi")

const authRoutes = require("./routes/auth")
const dashboardRoutes = require("./routes/dashboard")
const orderRoutes = require("./routes/orders")
const paymentRoutes = require("./routes/payments")
const ticketRoutes = require("./routes/tickets")
const customerRoutes = require("./routes/customers")
const siteRoutes = require("./routes/sites")
const reconciliationRoutes = require("./routes/reconciliation")
const settingsRoutes = require("./routes/settings")
const userRoutes = require("./routes/users")
const { rolesRouter, modulesRouter } = require("./routes/roles")

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), db: !!db })
})

// Public
app.use("/api/auth", authRoutes)

// OpenAPI spec & API docs (Scalar)
app.get("/api/openapi.json", (_req, res) => {
  res.json(openapi)
})
app.get("/api/docs", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Reference — Ancol Connect Dashboard</title>
    <style>
      body { margin: 0; background: #0b1220; }
    </style>
  </head>
  <body>
    <script id="api-reference" type="application/json" data-url="/api/openapi.json" data-theme="default"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.14"></script>
  </body>
</html>`)
})


// Protected
app.use("/api/dashboard", auth, dashboardRoutes)
app.use("/api/orders", auth, orderRoutes)
app.use("/api/payments", auth, paymentRoutes)
app.use("/api/tickets", auth, ticketRoutes)
app.use("/api/customers", auth, customerRoutes)
app.use("/api/sites", auth, siteRoutes)
app.use("/api/reconciliation", auth, reconciliationRoutes)
app.use("/api/settings", auth, settingsRoutes)
app.use("/api/users", auth, userRoutes)
app.use("/api/roles", auth, rolesRouter)
app.use("/api/modules", auth, modulesRouter)

// 404 & error handler
app.use((_req, res) => res.status(404).json({ message: "Not Found" }))
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: err.message || "Internal Server Error" })
})

app.listen(PORT, () => {
  console.log(`[server] Ancol Dashboard API berjalan di http://localhost:${PORT}/api`)
})
