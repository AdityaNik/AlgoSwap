const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Pool } = require("./db/db");

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/algoswap", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/pools", (req, res) => {
  Pool.find()
    .then((pools) => {
      res.json(pools);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error retrieving pools" });
    });
});

app.post("/createPool", (req, res) => {
  const pool = new Pool({
    name: req.body.name,
    tvl: req.body.tvl,
    liquidity: req.body.liquidity,
  });
  pool
    .save()
    .then((pool) => {
      res.json(pool);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error creating pool" });
    });
});

app.post("/updatePool", (req, res) => {
  const { id, tvl, liquidity } = req.body;
  Pool.findByIdAndUpdate(id, { tvl, liquidity }, { new: true })
    .then((pool) => {
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      res.json(pool);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error updating pool" });
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
