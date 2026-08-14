# Ancol Connect Dashboard V2

Dashboard manajemen untuk Ancol Connect — ringkasan transaksi, pembayaran, tiket, rekonsiliasi, dan manajemen pengguna.

## Struktur Proyek

```
.
├── backend/        # REST API (Express + SQLite)
├── frontend/       # Dashboard web (Next.js)
└── backups/        # Dump cadangan database
```

## Fitur

- **Dashboard** — revenue banner, stat cards (orders, tiket, customer), grafik revenue & tiket, revenue by site, customer growth, top products, revenue sharing, recent orders
- **Quick filter periode** — preset Today / This Week / This Month / Last 3 Months atau custom range tanggal
- **Orders** — daftar, filter, pencarian, dan detail order
- **Payments** — daftar dan detail pembayaran (VA / Payment Gateway)
- **Tickets** — daftar dan detail tiket wahana
- **Reconciliation** — sesi rekonsiliasi per tanggal dengan log proses
- **Customers** — daftar dan detail pelanggan
- **Wahana (Sites)** — status sinkronisasi unit & produk
- **Settings** — konfigurasi revenue sharing & PBJT
- **Admin (Users & Roles)** — manajemen pengguna, role, dan akses modul (RBAC)
- **API Documentation** — OpenAPI 3.0 spec + UI modern (Scalar)

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Backend | Node.js, Express, SQLite (`node:sqlite`), JWT, bcrypt |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, ApexCharts, shadcn/ui |
| API Docs | OpenAPI 3.0 + [Scalar](https://scalar.com) |

## Menjalankan Proyek

### 1. Backend

```bash
cd backend
npm install
npm run seed     # buat database seed (pertama kali)
npm run dev      # http://localhost:4000/api
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

Buka http://localhost:3000 dan login. Mode demo **menerima kredensial apa pun** — jika tidak cocok dengan user di database, otomatis masuk sebagai **Super Admin (Demo)**.

### API Documentation

- **UI (Scalar)**: http://localhost:4000/api/docs
- **Spec mentah (JSON)**: http://localhost:4000/api/openapi.json

Untuk mencoba endpoint terproteksi di docs, login lewat `POST /api/auth/login`, salin token, lalu isi tombol **Authorization** (Bearer).

## Skrip

| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Jalankan server dengan auto-reload (backend) |
| `npm run seed` | Buat/muat ulang database seed |
| `npm run lint` | Jalankan ESLint (frontend) |

## Autentikasi

Semua endpoint (kecuali `/api/health` dan `/api/auth/login`) memerlukan token JWT pada header:

```
Authorization: Bearer <token>
```

Token didapat dari `POST /api/auth/login`. Secara default berlaku 12 jam.

## Konfigurasi Lingkungan

| Variabel | Default | Deskripsi |
| --- | --- | --- |
| `PORT` | `4000` | Port backend |
| `JWT_SECRET` | `ancol-dashboard-dev-secret` | Secret untuk menandatangani token |
| `JWT_EXPIRY` | `12h` | Masa berlaku token |
