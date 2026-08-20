"use strict"

const path = require("node:path")
const fs = require("node:fs")
const { DatabaseSync } = require("node:sqlite")
const bcrypt = require("bcryptjs")
const { SCHEMA_SQL } = require("./schema")

const DB_PATH = path.join(__dirname, "..", "data", "ancol-rec-hub.db")
const SEED = 42
const rng = mulberry32(SEED)

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = (min, max) => Math.floor(rng() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const chance = (p) => rng() < p

function pad(n, len) {
  return String(n).padStart(len, "0")
}

function iso(offsetDays, hour, minute = 0, second = 0) {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  d.setUTCHours(hour, minute, second, 0)
  return d.toISOString().replace("T", " ").replace("Z", "+00")
}

function isoDay(offsetDays) {
  return iso(offsetDays, 0).slice(0, 10)
}

// ── Reference data dari dump ──
const SITES = [
  { site_id: 1, site_code: "dfn", name: "Dufan Ancol", seqno: 3 },
  { site_id: 2, site_code: "swa", name: "Seaworld Ancol", seqno: 6 },
  { site_id: 3, site_code: "ods", name: "Samudra Ancol", seqno: 5 },
  { site_id: 4, site_code: "awa", name: "Atlantis Ancol", seqno: 2 },
  { site_id: 5, site_code: "pgu", name: "Ancol Taman Impian", seqno: 1 },
  { site_id: 6, site_code: "jbl", name: "Jakarta Bird Land Ancol", seqno: 4 },
]

const PRODUCTS = [
  { product_id: 9, code: "TKT-DUFAN-REG", name: "Tiket Reguler Dufan", site_id: null, price: 150000 },
  { product_id: 10, code: "TKT-ATLANTIS-REG", name: "Tiket Reguler Atlantis", site_id: null, price: 130000 },
  { product_id: 11, code: "0001-PGUINR", name: "Tiket Orang Masuk Ancol", site_id: 5, price: 25000 },
  { product_id: 12, code: "0001-PGUPKB", name: "Tiket Kendaraan Mobil", site_id: 5, price: 100000 },
  { product_id: 13, code: "0001-DFNREG", name: "Dufan Reguler Weekday", site_id: 1, price: 150000 },
  { product_id: 14, code: "0001-DFNANN", name: "Dufan Annual Pass", site_id: 1, price: 500000 },
  { product_id: 15, code: "0001-ODSREG", name: "Samudra Reguler Weekday", site_id: 3, price: 100000 },
  { product_id: 16, code: "0001-AWAREG", name: "Atlantis Reguler Weekday", site_id: 4, price: 130000 },
  { product_id: 17, code: "0001-JBLPRE", name: "Jakarta Bird Land Reguler", site_id: 6, price: 90000 },
  { product_id: 18, code: "0001-SWAREG", name: "Sea World Reguler Weekday", site_id: 2, price: 150000 },
  { product_id: 19, code: "0001-PGUPKM", name: "Tiket Kendaraan Motor", site_id: 5, price: 50000 },
  { product_id: 20, code: "0001-DFNVIP", name: "Dufan VIP", site_id: 1, price: 300000 },
  { product_id: 21, code: "0001-DFNFAM", name: "Dufan Family Package", site_id: 1, price: 450000 },
  { product_id: 22, code: "0001-SWAPKG", name: "Sea World Family Package", site_id: 2, price: 400000 },
  { product_id: 23, code: "0001-ODSFAM", name: "Samudra Family Package", site_id: 3, price: 350000 },
  { product_id: 24, code: "0001-AWAVIP", name: "Atlantis VIP", site_id: 4, price: 280000 },
]

const USERS = [
  { user_id: 0, email: "ancolintegraconnect@gmail.com", nickname: "SuperAdmin", role_id: 0 },
  { user_id: 1, email: "adhityarachman@gmail.com", nickname: "Adhitya", role_id: 1 },
  { user_id: 2, email: "probe-test@x.com", nickname: "Probe", role_id: 2 },
  { user_id: 3, email: "test.bruno@ancol.local", nickname: "Test Bruno", role_id: 3 },
  { user_id: 4, email: "eddietohier@gmail.com", nickname: "eddietohier", role_id: 1 },
  { user_id: 5, email: "cs@ancol.local", nickname: "CS Admin", role_id: 4 },
]

const ROLES = [
  { role_id: 0, code: "SA", name: "Super Admin", desc: "Super admin for this system. Do not delete" },
  { role_id: 1, code: "AD", name: "Admin", desc: "Role to access and manage organization data" },
  { role_id: 2, code: "PROBE", name: "Probe", desc: "" },
  { role_id: 3, code: "TESTROL", name: "Test Role", desc: "x" },
  { role_id: 4, code: "CS", name: "Customer Service", desc: "CS role for ticket search and resend" },
]

const MODULES = [
  { module_id: 1, code: "UserMgmt", name: "User Management", sortno: 10, label: "User", icon: "user.png", desc: "Module to create, delete, and maintain user for the system" },
  { module_id: 2, code: "ModuleMgmt", name: "Module Management", sortno: 30, label: "Module", icon: "module.png", desc: "Module to create, delete, and maintain modules for the system" },
  { module_id: 3, code: "RoleMgmt", name: "Role Management", sortno: 20, label: "Role", icon: "role.png", desc: "Module to create, delete, and maintain role for the system" },
  { module_id: 4, code: "PROBE", name: "Probe", sortno: 0, label: null, icon: null, desc: null },
  { module_id: 5, code: "TESTMOD", name: "Test Module", sortno: 99, label: null, icon: null, desc: "x" },
  { module_id: 6, code: "CSModule", name: "CS Ticket Search", sortno: 5, label: "CS Search", icon: "search.png", desc: "Module for CS to search and resend tickets" },
]

const TRXSTATUS = [
  { code: "PD", name: "Paid", state: "paid", desc: "Order sudah dibayar", level: "ok" },
  { code: "TI", name: "Ticket Issued", state: "issued", desc: "Tiket sudah diterbitkan", level: "ok" },
  { code: "PE", name: "Pending", state: "pending", desc: "Menunggu pembayaran", level: "warning" },
  { code: "FL", name: "Failed", state: "failed", desc: "Pembayaran gagal", level: "danger" },
  { code: "EX", name: "Expired", state: "expired", desc: "Transaksi kedaluwarsa", level: "danger" },
  { code: "RF", name: "Refunded", state: "refunded", desc: "Transaksi direfund", level: "warning" },
]

const PAYMENTSTATUS = [
  { code: "PS", name: "Success", desc: "Pembayaran berhasil" },
  { code: "PE", name: "Pending", desc: "Menunggu pembayaran" },
  { code: "FL", name: "Failed", desc: "Pembayaran gagal" },
  { code: "EX", name: "Expired", desc: "Pembayaran kedaluwarsa" },
  { code: "RF", name: "Refunded", desc: "Dana dikembalikan" },
]

const FIRST_NAMES = ["Budi", "Siti", "Agus", "Dewi", "Andi", "Rina", "Joko", "Maya", "Bambang", "Sari", "Rudi", "Lina", "Hendra", "Putri", "Eko", "Nina", "Dodi", "Tari", "Fajar", "Wulan", "Arif", "Ratna", "Yoga", "Cici", "Dimas", "Ani", "Rizky", "Fika", "Bayu", "Lusi", "Gilang", "Nadia", "Rendi", "Ayu", "Tono", "Vina", "Wahyu", "Intan", "Slamet", "Rani"]
const LAST_NAMES = ["Pratama", "Wijaya", "Santoso", "Lestari", "Hidayat", "Kusuma", "Saputra", "Utami", "Nugroho", "Sari", "Ramadhan", "Handayani", "Setiawan", "Puspita", "Maulana", "Anggraini", "Susanto", "Firmansyah", "Cahyono", "Permata"]

const BANK_CODES = ["bca", "bni", "mandiri", "bri", "permata", "cimb"]

// Generate synthetic names (PII asli di DB terenkripsi; di sini memakai data sintetis)
function synthCustomer(i) {
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
  const phone = `08${pad(rand(1000000000, 9999999999), 10)}`
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}${i}@mail.com`
  return { name, phone, email }
}

function randomTicketNo() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let out = ""
  for (let i = 0; i < 24; i++) out += chars[Math.floor(rng() * chars.length)]
  return out
}

function buildDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const db = new DatabaseSync(DB_PATH)
  db.exec(SCHEMA_SQL)
  return db
}

function seed(db) {
  const now = iso(0, 12)
  const DASH = "-"
  const insert = (table, columns, rows) => {
    if (!rows.length) return
    const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`)
    db.exec("BEGIN")
    for (const r of rows) stmt.run(...r)
    db.exec("COMMIT")
  }

  // ── Auth / RBAC ──
  insert("users", ["user_id", "email", "nickname", "password", "created", "updated", "created_by", "updated_by", "enabled"],
    USERS.map((u) => [u.user_id, u.email, u.nickname, bcrypt.hashSync("Ancol123!", 8), now, now, 0, 0, 1]))
  insert("roles", ["role_id", "role_code", "role_name", "created", "updated", "created_by", "updated_by", "description"],
    ROLES.map((r) => [r.role_id, r.code, r.name, now, now, 0, 0, r.desc]))
  insert("user_roles", ["user_id", "role_id", "created_by", "updated_by", "created", "updated"],
    USERS.map((u) => [u.user_id, u.role_id, 0, 0, now, now]))
  insert("modules", ["module_id", "module_code", "module_name", "created", "updated", "created_by", "updated_by", "description", "sortno", "module_icon", "module_label"],
    MODULES.map((m) => [m.module_id, m.code, m.name, now, now, 0, 0, m.desc, m.sortno, m.icon, m.label]))

  // role_modules: Super Admin full, Admin semua module, CS hanya CSModule
  const roleModules = []
  for (const m of MODULES) {
    roleModules.push([m.module_id, 0, "Full access", now, now, 0, 0, 0])   // SA gets ALL modules
    if (m.module_id <= 3) roleModules.push([m.module_id, 1, "Admin access", now, now, 0, 0, 0]) // Admin gets first 3
  }
  // CS role gets CSModule only
  roleModules.push([6, 4, "CS access", now, now, 0, 0, 0])
  insert("role_modules", ["module_id", "role_id", "description", "created", "updated", "updated_by", "created_by", "read_only"], roleModules)

  // ── Reference ──
  insert("sites", ["site_id", "site_code", "name", "created", "updated", "created_by", "updated_by", "seqno"],
    SITES.map((s) => [s.site_id, s.site_code, s.name, now, now, 0, 0, s.seqno]))
  insert("products", ["product_id", "product_code", "product_name", "site_id", "created", "updated", "created_by", "updated_by"],
    PRODUCTS.map((p) => [p.product_id, p.code, p.name, p.site_id, now, now, 0, 0]))
  insert("paymentgateways", ["paymentgateway_id", "pg_code", "name", "created", "updated", "created_by", "updated_by"],
    [[1, "mid", "Midtrans", now, now, 0, 0]])
  insert("trxstatus", ["status_code", "status_name", "status_state", "description", "status_level", "created", "created_by", "updated", "updated_by"],
    TRXSTATUS.map((t) => [t.code, t.name, t.state, t.desc, t.level, now, 0, now, 0]))
  insert("paymentstatus", ["status_code", "status_name", "description"],
    PAYMENTSTATUS.map((p) => [p.code, p.name, p.desc]))
  insert("systemsetting", ["systemsetting_id", "description", "created", "updated", "created_by", "updated_by", "revsharing_pct", "pbjt_rate", "is_pbjt_include"],
    [[1, "Default configuration for Ancol Connect. Do not delete this record", now, now, 0, 0, 2.0, 10, 1]])
  insert("custno", ["custno_id", "prefix", "currentnext", "interval", "minlength", "suffix", "created", "created_by", "updated", "updated_by"],
    [[1, "ANC", 500, 1, 5, null, now, 0, now, 0]])

  // ── Customers: 11 dari dump (code dipertahankan, nama sintetis) + ~600 generate ──
  const customerRows = []
  const dumpCodes = ["ANC-00007", "ANC-00008", "ANC-00009", "ANC-00010", "ANC-00011", "ANC-00012", "ANC-00013", "ANC-00014", "ANC-00015", "ANC-00016", "ANC-00017"]
  dumpCodes.forEach((code, i) => {
    const c = synthCustomer(i + 1)
    customerRows.push([i + 8, c.name, DASH, c.phone, DASH, c.email, DASH, code, `LOY-${pad(123 + i, 4)}`, iso(-rand(10, 180), rand(8, 20)), now, 0, 0, null])
  })
  let nextCustId = 19
  const totalCustomers = 600
  for (let i = customerRows.length; i < totalCustomers; i++) {
    const c = synthCustomer(i)
    customerRows.push([nextCustId++, c.name, DASH, c.phone, DASH, c.email, DASH, `ANC-${pad(500 + i, 5)}`, chance(0.6) ? `LOY-${pad(1000 + i, 4)}` : null, iso(-rand(1, 365), rand(8, 20)), now, 0, 0, null])
  }
  insert("customers", ["customer_id", "name", "name_hashed", "phone", "phone_hashed", "email", "email_hashed", "customer_code", "loyalti_no", "created", "updated", "created_by", "updated_by", "bsuid"], customerRows)

  // ── Orders + details + tickets + payments ──
  // Site weights untuk distribusi order
  const siteWeights = [35, 12, 10, 15, 18, 10]
  const sitePool = []
  SITES.forEach((s, i) => {
    for (let k = 0; k < siteWeights[i]; k++) sitePool.push(s.site_id)
  })

  const orderRows = []
  const detailRows = []
  const ticketRows = []
  const paymentRows = []
  const totalOrders = 1200

  const productsBySite = {}
  for (const p of PRODUCTS) {
    const key = p.site_id == null ? "any" : String(p.site_id)
    ;(productsBySite[key] = productsBySite[key] || []).push(p)
  }

  let orderSeq = 10000
  let detailId = 1
  let ticketId = 1
  let paymentId = 1

  for (let o = 0; o < totalOrders; o++) {
    const dayOffset = -rand(0, 89) // 90 hari kebelakang, include hari ini
    const hour = chance(0.15) ? rand(0, 7) : rand(8, 22)
    const minute = rand(0, 59)
    const second = rand(0, 59)
    const orderDate = iso(dayOffset, hour, minute, second)
    const visitDate = iso(dayOffset + rand(0, 30), rand(8, 17))
    const customerId = rand(8, nextCustId - 1)

    const statusRoll = rng()
    const status = statusRoll < 0.4 ? "PD" : statusRoll < 0.7 ? "TI" : statusRoll < 0.85 ? "PE" : "FL"

    const primarySite = pick(sitePool)
    const siteProducts = productsBySite[String(primarySite)] || []
    const mainPick = siteProducts.length ? pick(siteProducts) : PRODUCTS[0]

    // 1-3 item; entry ticket (pgu) kadang ditambahkan untuk unit non-pgu
    const items = [{ product: mainPick, qty: rand(1, 5) }]
    const extraCount = rand(0, 2)
    for (let e = 0; e < extraCount; e++) {
      if (chance(0.7)) {
        const p2 = siteProducts.length ? pick(siteProducts) : PRODUCTS[0]
        items.push({ product: p2, qty: rand(1, 4) })
      } else if (primarySite !== 5) {
        items.push({ product: productsBySite["5"][0], qty: rand(1, 3) }) // tiket masuk ancol
      }
    }

    let total = 0
    for (const it of items) total += it.qty * it.product.price

    const orderNo = `WBT${pad(orderSeq, 6)}26`
    orderSeq++
    const orderId = 35 + o

    const baseAmt = Math.round(total / 1.1)
    const pbjtAmt = total - baseAmt

    orderRows.push([orderId, orderNo, visitDate, orderDate, total, status, 0, 0, orderDate, orderDate, customerId, pbjtAmt, baseAmt])

    const detailIds = []
    for (const it of items) {
      const lineTotal = it.qty * it.product.price
      const lineBase = Math.round(lineTotal / 1.1)
      const linePbjt = lineTotal - lineBase
      detailRows.push([detailId, orderId, it.qty, it.product.price, lineTotal, it.product.product_id, orderDate, orderDate, 0, 0, linePbjt, lineBase])
      detailIds.push(detailId)
      detailId++

      // tickets per qty
      for (let t = 0; t < it.qty; t++) {
        let tStatus
        if (status === "PD" || status === "TI") tStatus = chance(0.55) ? "USED" : "ACTIVE"
        else tStatus = chance(0.4) ? "REFUND" : "EXPIRED"
        ticketRows.push([ticketId++, detailId - 1, randomTicketNo(), visitDate, orderDate, orderDate, 0, 0, tStatus])
      }
    }

    // payments: hampir semua order punya payment; beberapa sukses tanpa payment (mismatch), beberapa orphan
    const hasPayment = chance(0.97)
    if (hasPayment) {
      let pStatus
      if (status === "PD" || status === "TI") pStatus = "PS"
      else if (status === "PE") pStatus = "PE"
      else pStatus = "FL"

      const method = chance(0.8) ? "va" : "pg"
      const amt = pStatus === "PS" && chance(0.05) ? total + rand(10000, 90000) : total

      const transactionTime = orderDate
      const settlementTime = pStatus === "PS" ? iso(dayOffset, hour, minute + rand(1, 10), second) : null
      const paymentNumber = method === "va" ? `${pick(BANK_CODES)}${pad(rand(100000000, 999999999), 9)}` : `PG-${pad(rand(100000, 999999), 6)}`

      paymentRows.push([paymentId, 1, transactionTime, orderId, amt, orderDate, orderDate, 0, 0,
        method === "va" ? pick(BANK_CODES) : null, method, paymentNumber, settlementTime, pStatus, cryptoUUID(), "IDR"])
      paymentId++
    }
  }

  // orphan payments (payment tanpa order yang valid)
  for (let i = 0; i < 15; i++) {
    const transactionTime = iso(-rand(0, 30), rand(8, 20))
    paymentRows.push([paymentId, 1, transactionTime, 999999 + i, rand(25, 500) * 1000, transactionTime, transactionTime, 0, 0,
      "bca", "va", `bca${pad(rand(100000000, 999999999), 9)}`, null, "PS", cryptoUUID(), "IDR"])
    paymentId++
  }

  // pesanan lama tanpa pembayaran (mismatch / unpaid)
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(rng() * totalOrders)
    // noop — cukup dengan probabilitas hasPayment di atas
    void idx
  }

  insert("orders", ["order_id", "order_no", "visit_date", "order_date", "total_amt", "status", "created_by", "updated_by", "created", "updated", "customer_id", "pbjt_amt", "base_amt"], orderRows)
  insert("orderdetails", ["orderdetail_id", "order_id", "qty", "price", "total_amt", "product_id", "created", "updated", "created_by", "updated_by", "pbjt_amt", "base_amt"], detailRows)
  insert("ordertickets", ["orderticket_id", "orderdetail_id", "ticket_no", "ticket_date", "created", "updated", "created_by", "updated_by", "status"], ticketRows)
  insert("payments", ["payment_id", "paymentgateway_id", "transaction_time", "order_id", "payment_amt", "created", "updated", "created_by", "updated_by", "bank_code", "payment_method", "payment_number", "settlement_time", "payment_status", "transaction_id", "currency"], paymentRows)
}

function cryptoUUID() {
  return (require("node:crypto")).randomUUID()
}

// Main
const exists = fs.existsSync(DB_PATH)
const db = buildDb()
seed(db)
db.close()
console.log(`Seeded database → ${DB_PATH}${exists ? " (overwrote existing)" : ""}`)
console.log("  users:", USERS.length, "| customers: 611 | orders: 1200+ | products:", PRODUCTS.length, "| sites:", SITES.length)
console.log("  Login demo (mock auth): email apa saja / password apa saja")
