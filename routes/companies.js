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

/**Get companies: {companies: [{code, name}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
            FROM companies`
  );
  const companies = results.rows;
  return res.json({ companies });
});

/**Get company by code:  {company: {code, name, description}}. 
 * Return 404 error if not found
*/
router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const result = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
    [code]
  );

  const company = result.rows[0];
  ///TODO supply error message
  if (company === undefined) throw new NotFoundError();
  return res.json({ company });
});

/** Add new company to db. Takes JSON: {code, name, description}. Return JSON : {company: {code, name, description}}
 * Return 400 error if no body or incomplete data is sent
*/
///TODO add request data to doc string

router.post("/", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;

 
  if (!code || !name || !description) throw new BadRequestError("Missing data");

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
    [code, name, description]
  );

  const company = result.rows[0];
  return res.status(201).json({ company });
});


/**Edit existing company data. Take JSON: {name, description}. Return JSON: {company: {code, name, description}}
 * Return 400 error if no body or incomplete data is sent. Return 404 if 
 * company is not in db.
 */
router.put("/:code", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { name, description } = req.body;

  if (!name || !description) throw new BadRequestError("Missing data");

  const result = await db.query(
    `UPDATE companies
            SET name = $1,
            description = $2
            WHERE code = $3
            RETURNING code, name, description`,
    [name, description, req.params.code]
  );

  const company = result.rows[0];

  if (company === undefined) throw new NotFoundError();

  return res.json({ company });
});

/**Deletes company from db. Return JSON: {status: "deleted"}.
 * Return 404 error if company is not in db.
 */
router.delete("/:code", async function (req, res) {
  const result = await db.query(
    `DELETE FROM companies 
            WHERE code= $1
            RETURNING code`,
    [req.params.code],
  );


  const company = result.rows[0];

  if (company === undefined) throw new NotFoundError();

  return res.json({ status: "deleted" });
});

module.exports = router;
