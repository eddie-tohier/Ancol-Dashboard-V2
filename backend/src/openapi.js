"use strict"

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Ancol Connect Dashboard API",
    description:
      "REST API untuk Ancol Connect Dashboard V2 — order, pembayaran, tiket, rekonsiliasi, dan manajemen pengguna. Seluruh endpoint (kecuali login) memerlukan token JWT pada header `Authorization: Bearer <token>`.",
    version: "1.0.0",
    contact: { name: "Ancol Dashboard Team" },
  },
  servers: [{ url: "/api", description: "Current server" }],
  tags: [
    { name: "Health", description: "Pengecekan status server" },
    { name: "Auth", description: "Login & profil pengguna" },
    { name: "Dashboard", description: "Ringkasan statistik, grafik, dan revenue sharing" },
    { name: "Orders", description: "Data transaksi order" },
    { name: "Payments", description: "Data pembayaran" },
    { name: "Tickets", description: "Data tiket wahana" },
    { name: "Customers", description: "Data pelanggan" },
    { name: "Sites", description: "Status sinkronisasi unit/wahana" },
    { name: "Reconciliation", description: "Sesi rekonsiliasi transaksi" },
    { name: "Settings", description: "Konfigurasi umum (revenue sharing & PBJT)" },
    { name: "Users", description: "Manajemen pengguna" },
    { name: "Roles", description: "Manajemen role & modul akses" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Token dari POST /api/auth/login" },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["message"],
        properties: { message: { type: "string", example: "Order tidak ditemukan" } },
      },
      Pagination: {
        type: "object",
        properties: {
          data: { type: "array", items: { type: "object" } },
          current_page: { type: "integer", example: 1 },
          last_page: { type: "integer", example: 5 },
          total: { type: "integer", example: 42 },
          per_page: { type: "integer", example: 15 },
        },
      },
      User: {
        type: "object",
        properties: {
          user_id: { type: "integer" },
          email: { type: "string", example: "admin@ancol.co.id" },
          nickname: { type: "string", nullable: true },
          enabled: { type: "boolean" },
          created: { type: "string", format: "date-time" },
          updated: { type: "string", format: "date-time" },
          roles: { type: "array", items: { $ref: "#/components/schemas/Role" } },
        },
      },
      Role: {
        type: "object",
        properties: {
          role_id: { type: "integer" },
          role_code: { type: "string", example: "SA" },
          role_name: { type: "string", example: "Super Admin" },
          description: { type: "string", nullable: true },
          user_count: { type: "integer" },
          modules: { type: "array", items: { $ref: "#/components/schemas/Module" } },
        },
      },
      Module: {
        type: "object",
        properties: {
          module_id: { type: "integer" },
          module_code: { type: "string", example: "dashboard" },
          module_name: { type: "string" },
          module_icon: { type: "string", nullable: true },
          module_label: { type: "string", nullable: true },
          sortno: { type: "integer" },
          description: { type: "string", nullable: true },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@ancol.co.id" },
          password: { type: "string", format: "password", example: "secret123" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
          user: { $ref: "#/components/schemas/User" },
          roles: { type: "array", items: { $ref: "#/components/schemas/Role" } },
        },
      },
      Order: {
        type: "object",
        properties: {
          order_id: { type: "integer" },
          order_no: { type: "string", example: "ORD-20240814-0001" },
          order_date: { type: "string", format: "date-time" },
          visit_date: { type: "string", format: "date-time", nullable: true },
          status: { type: "string", enum: ["PD", "TI", "PE", "FL"], description: "PD=Paid, TI=Checked-in, PE=Pending, FL=Failed" },
          total_amt: { type: "number" },
          base_amt: { type: "number" },
          pbjt_amt: { type: "number" },
          customer_id: { type: "integer", nullable: true },
        },
      },
      Payment: {
        type: "object",
        properties: {
          payment_id: { type: "integer" },
          order_id: { type: "integer" },
          payment_method: { type: "string", enum: ["va", "pg"] },
          payment_status: { type: "string", enum: ["PS", "PE", "FL"] },
          payment_amt: { type: "number" },
          transaction_time: { type: "string", format: "date-time" },
          transaction_id: { type: "string", nullable: true },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          orderticket_id: { type: "integer" },
          ticket_no: { type: "string", example: "TKT-123456" },
          ticket_status: { type: "string", enum: ["ACTIVE", "USED", "EXPIRED", "REFUND"] },
          status: { type: "string" },
          status_code: { type: "string" },
          status_color: { type: "string" },
          order_id: { type: "integer" },
          product_name: { type: "string" },
          site_code: { type: "string" },
          site_name: { type: "string" },
        },
      },
      Customer: {
        type: "object",
        properties: {
          customer_id: { type: "integer" },
          customer_code: { type: "string" },
          name: { type: "string" },
          phone: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          loyalti_no: { type: "string", nullable: true },
          total_orders: { type: "integer" },
          last_visit: { type: "string", format: "date-time", nullable: true },
        },
      },
      Site: {
        type: "object",
        properties: {
          site_id: { type: "integer" },
          site_code: { type: "string", example: "jbg" },
          name: { type: "string" },
          sync_status: { type: "string", enum: ["synced", "syncing", "error"] },
          last_sync: { type: "string", format: "date-time" },
          active_products: { type: "integer" },
          tickets_issued: { type: "integer" },
          products: { type: "array", items: { type: "object" } },
        },
      },
      Setting: {
        type: "object",
        properties: {
          systemsetting_id: { type: "integer" },
          revsharing_pct: { type: "number", example: 10 },
          pbjt_rate: { type: "number", example: 10 },
          is_pbjt_include: { type: "boolean" },
          updated: { type: "string", format: "date-time", nullable: true },
        },
      },
      UpdateSettingRequest: {
        type: "object",
        properties: {
          revsharing_pct: { type: "number", example: 10 },
          pbjt_rate: { type: "number", example: 10 },
          is_pbjt_include: { type: "boolean", example: true },
        },
      },
      ReconciliationSession: {
        type: "object",
        properties: {
          id: { type: "integer" },
          session_no: { type: "string", example: "SES-01" },
          date: { type: "string", format: "date", example: "2024-08-14" },
          time: { type: "string", example: "09:00:00" },
          duration: { type: "string", nullable: true },
          total_orders: { type: "integer" },
          match_rate: { type: "number" },
          status: { type: "string", enum: ["COMPLETED", "FAILED", "NO_ORDERS"] },
          site_id: { type: "integer" },
          site_code: { type: "string" },
          site_name: { type: "string" },
        },
      },
      UserRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          nickname: { type: "string", nullable: true },
          password: { type: "string", format: "password", minLength: 6 },
          role_ids: { type: "array", items: { type: "integer" } },
        },
      },
      RoleModulesRequest: {
        type: "object",
        required: ["module_ids"],
        properties: { module_ids: { type: "array", items: { type: "integer" } } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Cek status server",
        operationId: "healthCheck",
        security: [],
        responses: {
          200: {
            description: "Server sehat",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    time: { type: "string", format: "date-time" },
                    db: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login (mode demo menerima kredensial apa pun)",
        operationId: "authLogin",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
          },
        },
        responses: {
          200: { description: "Login berhasil", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
          400: { description: "Email/password wajib diisi", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Ambil profil pengguna yang sedang login",
        operationId: "authMe",
        responses: {
          200: { description: "Profil user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Auth"],
        summary: "Update profil (nickname & password)",
        operationId: "authUpdateMe",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nickname: { type: "string" },
                  password: { type: "string", format: "password", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profil diperbarui", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "User tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        operationId: "authLogout",
        responses: {
          200: { description: "Logged out", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/dashboard/stats": {
      get: {
        tags: ["Dashboard"],
        summary: "Ringkasan statistik (revenue, order, tiket, customer)",
        operationId: "dashboardStats",
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month"], default: "week" }, description: "Periode preset" },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" }, description: "Tanggal awal (YYYY-MM-DD), mengalahkan period" },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" }, description: "Tanggal akhir (YYYY-MM-DD)" },
        ],
        responses: {
          200: {
            description: "Ringkasan statistik",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    period: { type: "string" },
                    revenue: { type: "integer" },
                    revenue_formatted: { type: "string" },
                    orders: { type: "integer" },
                    tickets_issued: { type: "integer" },
                    tickets_used: { type: "integer" },
                    customers: { type: "integer" },
                    status_counts: { type: "object", additionalProperties: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/dashboard/charts": {
      get: {
        tags: ["Dashboard"],
        summary: "Data grafik: order/revenue per hari, pertumbuhan customer, distribusi site, top produk",
        operationId: "dashboardCharts",
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month"], default: "week" } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Data grafik",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    series: { type: "array", items: { type: "object" } },
                    by_site: { type: "array", items: { type: "object" } },
                    top_products: { type: "array", items: { type: "object" } },
                    customer_growth: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/dashboard/sharing": {
      get: {
        tags: ["Dashboard"],
        summary: "Breakdown revenue sharing (mitra vs PJA) dan PBJT",
        operationId: "dashboardSharing",
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month"], default: "week" } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Rincian sharing",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total_revenue: { type: "integer" },
                    base_amt: { type: "integer" },
                    pbjt_amt: { type: "integer" },
                    revsharing_pct: { type: "number" },
                    pbjt_rate: { type: "number" },
                    is_pbjt_include: { type: "boolean" },
                    partner_share: { type: "integer" },
                    pja_share: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/dashboard/recent": {
      get: {
        tags: ["Dashboard"],
        summary: "10 order terbaru",
        operationId: "dashboardRecent",
        responses: {
          200: {
            description: "Daftar order terbaru",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } },
          },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Ringkasan per unit/site",
        operationId: "dashboardSummary",
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month"], default: "week" } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Ringkasan per site",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      site_id: { type: "integer" },
                      site_code: { type: "string" },
                      site_name: { type: "string" },
                      orders: { type: "integer" },
                      revenue: { type: "integer" },
                      tickets: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "Daftar order (dengan filter & pagination)",
        operationId: "listOrders",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Cari order_no / nama customer / phone / customer_code" },
          { name: "status", in: "query", schema: { type: "string", enum: ["PD", "TI", "PE", "FL", "all"] }, description: "Filter status" },
          { name: "unit", in: "query", schema: { type: "string" }, description: "Filter site_code" },
          { name: "date_type", in: "query", schema: { type: "string", enum: ["order_date", "visit_date"], default: "order_date" } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
          { name: "sort", in: "query", schema: { type: "string" }, description: "Format `field_dir`, contoh `order_date_asc`" },
        ],
        responses: {
          200: { description: "Daftar order", content: { "application/json": { schema: { $ref: "#/components/schemas/Pagination" } } } },
        },
      },
    },
    "/orders/summary": {
      get: {
        tags: ["Orders"],
        summary: "Agregasi order (revenue, tiket, status) mengikuti filter yang sama",
        operationId: "orderSummary",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PD", "TI", "PE", "FL", "all"] } },
          { name: "unit", in: "query", schema: { type: "string" } },
          { name: "date_type", in: "query", schema: { type: "string", enum: ["order_date", "visit_date"] } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Ringkasan order",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orders: { type: "integer" },
                    revenue: { type: "integer" },
                    gross_amt: { type: "integer" },
                    base_amt: { type: "integer" },
                    pbjt_amt: { type: "integer" },
                    tickets: { type: "integer" },
                    status_counts: { type: "object", additionalProperties: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Detail order + items + tiket + pembayaran",
        operationId: "getOrder",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Detail order", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
          404: { description: "Order tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/payments": {
      get: {
        tags: ["Payments"],
        summary: "Daftar pembayaran (dengan filter & pagination)",
        operationId: "listPayments",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 15 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PS", "PE", "FL", "all"] }, description: "PS=Success, PE=Pending, FL=Failed" },
          { name: "method", in: "query", schema: { type: "string", enum: ["va", "pg", "all"] }, description: "va=Virtual Account, pg=Payment Gateway" },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
          { name: "sort", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Daftar pembayaran", content: { "application/json": { schema: { $ref: "#/components/schemas/Pagination" } } } },
        },
      },
    },
    "/payments/summary": {
      get: {
        tags: ["Payments"],
        summary: "Agregasi pembayaran mengikuti filter yang sama",
        operationId: "paymentSummary",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PS", "PE", "FL", "all"] } },
          { name: "method", in: "query", schema: { type: "string", enum: ["va", "pg", "all"] } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: {
            description: "Ringkasan pembayaran",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    payments: { type: "integer" },
                    collected: { type: "integer" },
                    total_amt: { type: "integer" },
                    status_counts: { type: "object", additionalProperties: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Detail pembayaran",
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Detail pembayaran", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
          404: { description: "Payment tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "Daftar tiket (dengan filter & pagination)",
        operationId: "listTickets",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 15 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "USED", "EXPIRED", "REFUND", "all"] } },
          { name: "unit", in: "query", schema: { type: "string" }, description: "Filter site_code" },
        ],
        responses: {
          200: { description: "Daftar tiket", content: { "application/json": { schema: { $ref: "#/components/schemas/Pagination" } } } },
        },
      },
    },
    "/tickets/summary": {
      get: {
        tags: ["Tickets"],
        summary: "Agregasi tiket mengikuti filter yang sama",
        operationId: "ticketSummary",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "USED", "EXPIRED", "REFUND", "all"] } },
          { name: "unit", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Ringkasan tiket",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tickets: { type: "integer" },
                    status_counts: { type: "object", additionalProperties: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/tickets/{id}": {
      get: {
        tags: ["Tickets"],
        summary: "Detail tiket",
        operationId: "getTicket",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Detail tiket", content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } } },
          404: { description: "Ticket tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/customers": {
      get: {
        tags: ["Customers"],
        summary: "Daftar customer (dengan search & pagination)",
        operationId: "listCustomers",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 15 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Daftar customer", content: { "application/json": { schema: { $ref: "#/components/schemas/Pagination" } } } },
        },
      },
    },
    "/customers/{id}": {
      get: {
        tags: ["Customers"],
        summary: "Detail customer",
        operationId: "getCustomer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Detail customer", content: { "application/json": { schema: { $ref: "#/components/schemas/Customer" } } } },
          404: { description: "Customer tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/sites": {
      get: {
        tags: ["Sites"],
        summary: "Status sinkronisasi seluruh unit/wahana beserta produknya",
        operationId: "listSites",
        responses: {
          200: {
            description: "Daftar site",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Site" } } } },
          },
        },
      },
    },

    "/reconciliation/sessions": {
      get: {
        tags: ["Reconciliation"],
        summary: "Sesi rekonsiliasi per tanggal (default hari ini)",
        operationId: "listSessions",
        parameters: [{ name: "date", in: "query", schema: { type: "string", format: "date" }, description: "Tanggal (YYYY-MM-DD)" }],
        responses: {
          200: {
            description: "Daftar sesi rekonsiliasi",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ReconciliationSession" } } } },
          },
        },
      },
    },
    "/reconciliation/available-dates": {
      get: {
        tags: ["Reconciliation"],
        summary: "Daftar tanggal yang tersedia untuk rekonsiliasi",
        operationId: "listAvailableDates",
        responses: {
          200: {
            description: "Array tanggal (YYYY-MM-DD)",
            content: { "application/json": { schema: { type: "array", items: { type: "string", format: "date" } } } },
          },
        },
      },
    },
    "/reconciliation/sessions/{id}": {
      get: {
        tags: ["Reconciliation"],
        summary: "Detail sesi rekonsiliasi + log proses",
        operationId: "getSession",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Detail sesi dengan logs",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ReconciliationSession" },
                    {
                      type: "object",
                      properties: {
                        logs: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              level: { type: "string", enum: ["INFO", "WARN", "ERROR"] },
                              step: { type: "string" },
                              message: { type: "string" },
                              createdAt: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: "Session tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/settings": {
      get: {
        tags: ["Settings"],
        summary: "Ambil konfigurasi umum (revenue sharing & PBJT)",
        operationId: "getSettings",
        responses: {
          200: { description: "Konfigurasi", content: { "application/json": { schema: { $ref: "#/components/schemas/Setting" } } } },
        },
      },
      put: {
        tags: ["Settings"],
        summary: "Perbarui konfigurasi umum",
        operationId: "updateSettings",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateSettingRequest" } },
          },
        },
        responses: {
          200: { description: "Konfigurasi terbaru", content: { "application/json": { schema: { $ref: "#/components/schemas/Setting" } } } },
          404: { description: "Setting tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/users": {
      get: {
        tags: ["Users"],
        summary: "Daftar user (dengan search, filter role & pagination)",
        operationId: "listUsers",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 15 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role_id", in: "query", schema: { type: "integer" }, description: "Filter role" },
        ],
        responses: {
          200: { description: "Daftar user", content: { "application/json": { schema: { $ref: "#/components/schemas/Pagination" } } } },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Buat user baru",
        operationId: "createUser",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserRequest" } } },
        },
        responses: {
          201: { description: "User dibuat", content: { "application/json": { schema: { type: "object", properties: { user_id: { type: "integer" } } } } } },
          400: { description: "Validasi gagal", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Email sudah terdaftar", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Detail user",
        operationId: "getUser",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Detail user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "User tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update user (profil, enabled, role)",
        operationId: "updateUser",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  nickname: { type: "string" },
                  password: { type: "string", format: "password", minLength: 6 },
                  enabled: { type: "boolean" },
                  role_ids: { type: "array", items: { type: "integer" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User diperbarui", content: { "application/json": { schema: { type: "object", properties: { user_id: { type: "integer" } } } } } },
          404: { description: "User tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Hapus user",
        operationId: "deleteUser",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "User dihapus", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "User tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/users/{id}/modules": {
      get: {
        tags: ["Users"],
        summary: "Akses modul seorang user (RBAC)",
        operationId: "getUserModules",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Daftar modul", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Module" } } } } },
        },
      },
    },

    "/roles": {
      get: {
        tags: ["Roles"],
        summary: "Daftar role beserta jumlah user & modul aksesnya",
        operationId: "listRoles",
        responses: {
          200: { description: "Daftar role", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Role" } } } } },
        },
      },
    },
    "/roles/{id}/modules": {
      put: {
        tags: ["Roles"],
        summary: "Atur modul akses sebuah role",
        operationId: "updateRoleModules",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RoleModulesRequest" } } },
        },
        responses: {
          200: {
            description: "Modul role diperbarui",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { role_id: { type: "integer" }, module_ids: { type: "array", items: { type: "integer" } } },
                },
              },
            },
          },
          404: { description: "Role tidak ditemukan", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/modules": {
      get: {
        tags: ["Roles"],
        summary: "Daftar seluruh modul aplikasi",
        operationId: "listModules",
        responses: {
          200: { description: "Daftar modul", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Module" } } } } },
        },
      },
    },
  },
}

module.exports = { openapi }
