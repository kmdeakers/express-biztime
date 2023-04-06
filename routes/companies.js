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

router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
            FROM companies`
  );
  const companies = results.rows;
  return res.json({ companies });
});

router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const result = await db.query(
    `SELECT code, name, description
            FROM companies
                WHERE code = $1`,
    [code]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError();
  }

  const company = result.rows[0];

  return res.json({ company });
});

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

  if (result.rows.length === 0) {
    throw new NotFoundError();
  }

  const company = result.rows[0];

  return res.json({ company });
});


module.exports = router;
