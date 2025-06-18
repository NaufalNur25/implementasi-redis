const express = require("express");
const { getPaginatedData, redisClient } = require("./db");

const app = express();
const port = 3000;

app.get("/items", async (req, res) => {
  const { table, page = 1, limit = 100 } = req.query;

  if (!table)
    return res.status(400).json({ message: "Query param ?table= is required" });

  const cacheKey = `items:${table}:page:${page}:limit:${limit}`;

  try {
    const cacheData = await redisClient.get(cacheKey);

    if (cacheData) {
      console.log("⚡ Cache HIT");
      return res.json({ source: "cache", ...JSON.parse(cacheData) });
    }

    console.log("🐢 Cache MISS - ambil dari DB:", table);
    const result = await getPaginatedData(table, page, limit);

    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 60 });

    res.json({ source: "db", ...result });
  } catch (err) {
    console.error("🔥 Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/items/demo", async (req, res) => {
  const { table, page = 1, limit = 100 } = req.query;

  if (!table)
    return res.status(400).json({ message: "Query param ?table= is required" });

  const cacheKey = `items:${table}:page:${page}:limit:${limit}`;

  try {
    const redisStart = Date.now();
    const cacheData = await redisClient.get(cacheKey);
    const redisDuration = Date.now() - redisStart;

    const dbStart = Date.now();
    const dbData = await getPaginatedData(table, page, limit);
    const dbDuration = Date.now() - dbStart;

    res.json({
      endpoint: "/items/demo",
      table,
      page: Number(page),
      limit: Number(limit),
      source: {
        cache: cacheData ? "HIT" : "MISS",
        db: "ALWAYS_USED",
      },
      timing_ms: {
        redis: redisDuration,
        db: dbDuration,
      },
      result: {
        from_cache: cacheData ? JSON.parse(cacheData) : null,
        from_db: dbData,
      },
    });
  } catch (err) {
    console.error("🔥 Error (demo):", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.get("/items/demo/redis", async (req, res) => {
  const { table, page = 1, limit = 100 } = req.query;

  if (!table)
    return res.status(400).json({ message: "Query param ?table= is required" });

  const cacheKey = `items:${table}:page:${page}:limit:${limit}`;

  try {
    const start = Date.now();
    const cacheData = await redisClient.get(cacheKey);
    const duration = Date.now() - start;

    res.json({
      endpoint: "/items/demo/redis",
      table,
      page: Number(page),
      limit: Number(limit),
      source: "cache",
      hit_status: cacheData ? "HIT" : "MISS",
      timing_ms: duration,
      data: cacheData ? JSON.parse(cacheData) : null,
    });
  } catch (err) {
    console.error("🔥 Error (redis only):", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.get("/items/demo/db", async (req, res) => {
  const { table, page = 1, limit = 100 } = req.query;

  if (!table)
    return res.status(400).json({ message: "Query param ?table= is required" });

  try {
    const start = Date.now();
    const dbData = await getPaginatedData(table, page, limit);
    const duration = Date.now() - start;

    res.json({
      endpoint: "/items/demo/db",
      table,
      page: Number(page),
      limit: Number(limit),
      source: "db",
      timing_ms: duration,
      data: dbData,
    });
  } catch (err) {
    console.error("🔥 Error (db only):", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server jalan di http://localhost:${port}`);
});
