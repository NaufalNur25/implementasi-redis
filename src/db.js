const { Pool } = require("pg");
const redis = require("redis");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "db_sterdistribusi",
  password: "P@ssw0rd",
  port: 5432,
});

const redisClient = redis.createClient({
  database: 3,
});

redisClient
  .connect()
  .then(() => console.log("✅ Redis connected (DB 3)"))
  .catch((err) => console.error("❌ Redis error:", err));

const allowedTables = ["provinsi", "kabupaten", "kecamatan", "kelurahan"];

const getDataFromDB = async (table) => {
  if (!allowedTables.includes(table)) {
    throw new Error("Table not allowed");
  }

  const result = await pool.query(`SELECT id, kode, nama FROM ${table}`);
  return result.rows;
};

const getPaginatedData = async (table, page = 1, limit = 100) => {
  if (!allowedTables.includes(table)) {
    throw new Error("Table not allowed");
  }

  const offset = (page - 1) * limit;
  const dataQuery = `SELECT id, kode, nama FROM ${table} LIMIT $1 OFFSET $2`;
  const countQuery = `SELECT COUNT(*) FROM ${table}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, [limit, offset]),
    pool.query(countQuery),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil(countResult.rows[0].count / limit),
  };
};

module.exports = {
  getPaginatedData,
  getDataFromDB,
  redisClient,
};
