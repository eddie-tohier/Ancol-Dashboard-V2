"use strict"

// Schema 1:1 dari dump ancol-rec-hub (Postgres -> SQLite)
// Timestamps disimpan sebagai TEXT (ISO 8601), boolean sebagai INTEGER 0/1.

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS custno (
  custno_id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix TEXT,
  currentnext INTEGER DEFAULT 1 NOT NULL,
  "interval" INTEGER DEFAULT 1 NOT NULL,
  minlength INTEGER DEFAULT 5,
  suffix TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  name_hashed TEXT,
  phone TEXT,
  phone_hashed TEXT,
  email TEXT,
  email_hashed TEXT,
  customer_code TEXT,
  loyalti_no TEXT,
  created TEXT,
  updated TEXT,
  created_by INTEGER,
  updated_by INTEGER,
  bsuid TEXT
);

CREATE TABLE IF NOT EXISTS modules (
  module_id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  description TEXT,
  sortno INTEGER NOT NULL,
  module_icon TEXT,
  module_label TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  role_id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_code TEXT NOT NULL,
  role_name TEXT NOT NULL,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  password TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_by INTEGER,
  updated_by INTEGER,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_modules (
  module_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  description TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  created_by INTEGER,
  read_only INTEGER DEFAULT 0,
  PRIMARY KEY (module_id, role_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  user_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
  site_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_code TEXT NOT NULL,
  name TEXT NOT NULL,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  seqno INTEGER
);

CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  site_id INTEGER,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS paymentgateways (
  paymentgateway_id INTEGER PRIMARY KEY AUTOINCREMENT,
  pg_code TEXT NOT NULL,
  name TEXT NOT NULL,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  order_date TEXT NOT NULL,
  total_amt REAL DEFAULT 0 NOT NULL,
  status TEXT,
  created_by INTEGER,
  updated_by INTEGER,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  customer_id INTEGER,
  pbjt_amt REAL DEFAULT 0,
  base_amt REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orderdetails (
  orderdetail_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  qty REAL DEFAULT 0 NOT NULL,
  price REAL,
  total_amt REAL,
  product_id INTEGER,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  pbjt_amt REAL DEFAULT 0,
  base_amt REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ordertickets (
  orderticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderdetail_id INTEGER NOT NULL,
  ticket_no TEXT NOT NULL,
  ticket_date TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  status TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  paymentgateway_id INTEGER NOT NULL,
  transaction_time TEXT NOT NULL,
  order_id INTEGER,
  payment_amt REAL DEFAULT 0 NOT NULL,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  bank_code TEXT,
  payment_method TEXT,
  payment_number TEXT,
  settlement_time TEXT,
  payment_status TEXT,
  transaction_id TEXT,
  currency TEXT
);

CREATE TABLE IF NOT EXISTS paymentstatus (
  paymentstatus_id INTEGER PRIMARY KEY AUTOINCREMENT,
  status_code TEXT NOT NULL,
  status_name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS trxstatus (
  trxstatus_id INTEGER PRIMARY KEY AUTOINCREMENT,
  status_code TEXT NOT NULL,
  status_name TEXT NOT NULL,
  status_state TEXT,
  description TEXT,
  status_level TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS systemsetting (
  systemsetting_id INTEGER DEFAULT 1 NOT NULL PRIMARY KEY,
  description TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER DEFAULT 0,
  updated_by INTEGER DEFAULT 0,
  revsharing_pct REAL NOT NULL,
  pbjt_rate REAL DEFAULT 10,
  is_pbjt_include INTEGER DEFAULT 1 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orderdetails_order ON orderdetails(order_id);
CREATE INDEX IF NOT EXISTS idx_ordertickets_detail ON ordertickets(orderdetail_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_time ON payments(transaction_time);
`

module.exports = { SCHEMA_SQL }
