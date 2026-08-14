"use strict"

// Mapping status code DB -> { label, color } untuk badge UI
// Warna: green, red, amber, blue, gray, purple

const ORDER_STATUS = {
  PD: { code: "PD", label: "Paid", color: "green" },
  TI: { code: "TI", label: "Issued", color: "blue" },
  PE: { code: "PE", label: "Pending", color: "amber" },
  FL: { code: "FL", label: "Failed", color: "red" },
  EX: { code: "EX", label: "Expired", color: "red" },
  RF: { code: "RF", label: "Refunded", color: "amber" },
}

const PAYMENT_STATUS = {
  PS: { code: "PS", label: "Success", color: "green" },
  PE: { code: "PE", label: "Pending", color: "amber" },
  FL: { code: "FL", label: "Failed", color: "red" },
  EX: { code: "EX", label: "Expired", color: "red" },
  RF: { code: "RF", label: "Refunded", color: "amber" },
}

const TICKET_STATUS = {
  ACTIVE: { code: "ACTIVE", label: "Active", color: "green" },
  USED: { code: "USED", label: "Used", color: "gray" },
  EXPIRED: { code: "EXPIRED", label: "Expired", color: "red" },
  REFUND: { code: "REFUND", label: "Refund", color: "amber" },
}

const reconStatus = {
  reconciled: { label: "Reconciled", color: "green" },
  failed: { label: "Failed", color: "red" },
  unreconciled: { label: "Unreconciled", color: "amber" },
  processing: { label: "Processing", color: "blue" },
  orphan: { label: "Orphan", color: "purple" },
}

module.exports = { ORDER_STATUS, PAYMENT_STATUS, TICKET_STATUS, reconStatus }
