"use strict";

const express = require("express");

const db = require("../db");
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} = require("../expressError");

const router = new express.Router();

/** Return info on invoices: {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
            FROM invoices`
  );

  const invoices = results.rows;
  return res.json({ invoices });
});

/** Gets invoice info for a given invoice id.
 * Returns {invoice:
 *            {id, amt, paid, add_date, paid_date,
 *              company: {code, name, description}}}
 * Returns 404 error if invoice not found.
 */
router.get("/:id", async function (req, res) {
  const iResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
            FROM invoices
            WHERE id = $1`,
    [req.params.id]
  );

  const invoice = iResults.rows[0];

  if (!invoice)
    throw new NotFoundError(`No invoice found for ${req.params.id}`);

  const cResults = await db.query(
    `SELECT code, name, description
            FROM companies
            JOIN invoices ON code = comp_code
            WHERE id = $1`,
    [req.params.id]
  );

  const company = cResults.rows[0];
  invoice.company = company;

  return res.json({ invoice });
});

/** Add an invoice. Input: JSON like {comp_code, amt}
 * Returns JSON {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  const { comp_code, amt } = req.body;

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = result.rows[0];

  return res.status(201).json({ invoice });
});

module.exports = router;
