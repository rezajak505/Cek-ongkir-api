const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Endpoint cek ongkir (pakai RajaOngkir)
app.post('/cek-ongkir', async (req, res) => {
  const { asal, tujuan, berat, kurir } = req.body;

  if (!asal || !tujuan || !berat || !kurir) {
    return res.status(400).json({ error: 'Lengkapi semua input' });
  }

  try {
    const response = await axios.post('https://api.rajaongkir.com/starter/cost', {
      origin: asal,
      destination: tujuan,
      weight: berat,
      courier: kurir
    }, {
      headers: {
        key: process.env.RAJAONGKIR_API_KEY,
        'content-type': 'application/x-www-form-urlencoded'
      }
    });

    const hasil = response.data.rajaongkir.results[0].costs[0];

    res.json({
      kurir: kurir.toUpperCase(),
      service: hasil.service,
      ongkir: hasil.cost[0].value,
      estimasi: hasil.cost[0].etd + ' hari'
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Gagal cek ongkir' });
  }
});

// Root handler
app.get('/', (req, res) => {
  res.send('API Cek Ongkir Aktif dengan RajaOngkir');
});

app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});
