const express = require("express");
const { getProvinsiesFromDB, redisClient } = require("./db");

const app = express();
const port = 3000;

app.get("/provinsi", async (req, res) => {
  const cacheKey = "provinsi:list";

  try {
    const cacheData = await redisClient.get(cacheKey);

    if (cacheData) {
      console.log("⚡ Cache HIT");
      return res.json({ source: "cache", data: JSON.parse(cacheData) });
    }

    console.log("🐢 Cache MISS - ambil dari DB");
    const result = await getProvinsiesFromDB();

    await redisClient.set(cacheKey, JSON.stringify(result), {
      EX: 60,
    });

    res.json({ source: "db", data: result });
  } catch (err) {
    console.error("🔥 Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/provinsi/demo", async (req, res) => {
  const cacheKey = "provinsi:list";

  try {
    const startTime = Date.now();
    const cacheData = await redisClient.get(cacheKey);
    const redisDuration = Date.now() - startTime;

    const dbStartTime = Date.now();
    const dbData = await getProvinsiesFromDB();
    const dbDuration = Date.now() - dbStartTime;

    res.json({
      data_source: {
        cache: cacheData ? "HIT" : "MISS",
        db: "always called (for comparison)",
      },
      timing_ms: {
        redis: redisDuration,
        postgres: dbDuration,
      },
      data: {
        from_cache: cacheData ? JSON.parse(cacheData) : null,
        from_db: dbData,
      },
    });
  } catch (err) {
    console.error("🔥 Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/provinsi/demo/redis", async (req, res) => {
  const cacheKey = "provinsi:list";

  try {
    const startTime = Date.now();

    const cacheData = await redisClient.get(cacheKey);
    const duration = Date.now() - startTime;

    if (cacheData) {
      res.json({
        source: "cache",
        timing_ms: duration,
        data: JSON.parse(cacheData),
      });
    } else {
      res.json({
        source: "cache",
        timing_ms: duration,
        message: "Cache MISS. No data found in Redis.",
        data: null,
      });
    }
  } catch (err) {
    console.error("🔥 Redis Demo Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server jalan di http://localhost:${port}`);
});
