const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = "nJdqJwaE157fbeea21508cb0T3B9h6sz";

app.get("/api/cities", async (req, res) => {
  try {
    const response = await axios.get("https://api.rajaongkir.com/starter/city", {
      headers: { key: API_KEY }
    });
    res.json(response.data.rajaongkir.results);
  } catch (err) {
    res.status(500).json({ error: "Gagal ambil data kota" });
  }
});

app.post("/api/ongkir", async (req, res) => {
  const { origin, destination, weight, courier } = req.body;
  try {
    const response = await axios.post("https://api.rajaongkir.com/starter/cost", {
      origin,
      destination,
      weight,
      courier
    }, {
      headers: {
        key: API_KEY,
        "content-type": "application/json"
      }
    });
    res.json(response.data.rajaongkir);
  } catch (err) {
    res.status(500).json({ error: "Gagal cek ongkir" });
  }
});

app.listen(3000, () => console.log("Server jalan di http://localhost:3000"));
