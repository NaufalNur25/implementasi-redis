const { Pool } = require("pg");
const redis = require("redis");

// PostgreSQL setup
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "db_sterdistribusi",
  password: "P@ssw0rd",
  port: 5432,
});

const redisClient = redis.createClient({
  database: 3
});

redisClient.connect()
  .then(() => console.log("✅ Redis connected (DB 3)"))
  .catch(err => console.error("❌ Redis error:", err));

const getProvinsiesFromDB = async () => {
  const result = await pool.query("SELECT * FROM provinsi");
  return result.rows;
};

module.exports = {
  getProvinsiesFromDB,
  redisClient,
};
