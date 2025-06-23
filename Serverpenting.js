const express = require("express");                                   const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const SECRET = "paylin-secret";

app.use(cors());
app.use(bodyParser.json());                                                                                                                 // File JSON lokal (gunakan jika ingin persistensi)
const tokoPath = path.join(__dirname, "toko.json");
const produkPath = path.join(__dirname, "produk.json");

// Load dari file
function loadJson(filePath) {                                           try { return JSON.parse(fs.readFileSync(filePath)); } catch { return []; }
}                                                                     function saveJson(filePath, data) {                                     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));          }
                                                                      let carts = {}; // key: email, value: array of cart items             let tokos = loadJson(tokoPath);                                       let products = loadJson(produkPath);
                                                                      // Middleware auth
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];               if (!token) return res.status(401).json({ message: "Token hilang" })
;
  try {                                                                   req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token tidak valid" });
  }
}

// == users.json ==
const userPath = path.join(__dirname, "users.json");

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(userPath, "utf-8"));
  } catch {
    return [];
  }
}

function simpanUsers(data) {
  fs.writeFileSync(userPath, JSON.stringify(data, null, 2));
}

let users = loadUsers();

// == orders.json ==
const orderPath = path.join(__dirname, "orders.json");

function loadOrders() {
  try {
    return JSON.parse(fs.readFileSync(orderPath, "utf-8"));             } catch {
    return [];
  }                                                                   }
                                                                      function simpanOrders(data) {                                           fs.writeFileSync(orderPath, JSON.stringify(data, null, 2));
}                                                                     
let orders = loadOrders();

// === AUTH ===
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ message: "Email sudah terdaftar" });
  }

  const user = { name, email, password, role: "user" };
  users.push(user);
  simpanUsers(users); // << Simpan ke file

  res.json({ message: "Pendaftaran berhasil" });
});
                                                                      
app.post("/api/login", (req, res) => {                                  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);                                                                 if (!user) return res.status(401).json({ message: "Email atau sandi
salah" });
  const token = jwt.sign({ email: user.email, role: user.role }, SECRE
T, { expiresIn: "1h" });
  res.json({ token, user });
});
                                                                      app.post("/api/register-admin", (req, res) => {
  const { name, email, password } = req.body;
  const existing = users.find(u => u.email === email);
  if (existing) return res.status(400).json({ message: "Email sudah te
rdaftar" });

  const admin = { name, email, password, role: "admin" };               users.push(admin);                                                    simpanUsers(users);

  res.json({ message: "Pendaftaran admin berhasil" });
});


// === TOKO ===
app.post("/api/toko/register", auth, (req, res) => {
  const { nama, deskripsi } = req.body;
  const email = req.user.email;
  if (tokos.find(t => t.pemilik === email)) return res.status(400).jso
n({ message: "Sudah punya toko" });
  const tokoBaru = { id: tokos.length + 1, nama, deskripsi, pemilik: e
mail };
  tokos.push(tokoBaru);                                                 saveJson(tokoPath, tokos);
  const user = users.find(u => u.email === email);                      if (user) user.role = "seller";
  res.json({ message: "Toko berhasil dibuat", toko: tokoBaru });
});

app.get("/api/toko/user", auth, (req, res) => {
  const toko = tokos.find(t => t.pemilik === req.user.email);
  if (!toko) return res.status(404).json({ message: "Belum punya toko"
 });
  res.json(toko);
});
                                                                      app.get("/api/toko/:id", (req, res) => {
  const toko = tokos.find(t => t.id == req.params.id);                  if (!toko) return res.status(404).json({ message: "Toko tidak ditemu
kan" });                                                                const produkToko = products.filter(p => p.tokoId == toko.id);
  res.json({ toko, produk: produkToko });
});

// === PRODUK ===
app.get("/api/products", (req, res) => {
  let hasil = products;                                                 if (req.query.kategori) hasil = hasil.filter(p => p.kategori?.toLowerCase() === req.query.kategori.toLowerCase());                          if (req.query.search) hasil = hasil.filter(p => p.nama.toLowerCase()
.includes(req.query.search.toLowerCase()));
  res.json(hasil);
});

app.get("/api/products/:id", (req, res) => {
  const produk = products.find(p => p.id == req.params.id);             if (!produk) return res.status(404).json({ message: "Produk tidak di
temukan" });                                                            res.json(produk);
});

app.post("/api/admin/products", auth, (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "seller") return
res.status(403).json({ message: "Akses ditolak" });
  const { nama, harga, gambar, kategori, stok, tokoId } = req.body;     const id = products.length ? products[products.length - 1].id + 1 :
1;
  const produkBaru = { id, nama, harga, gambar, kategori, stok, tokoId
 };
  products.push(produkBaru);
  saveJson(produkPath, products);                                       res.json({ message: "Produk ditambahkan", produk: produkBaru });
});
                                                                      // === CART ===
app.post("/api/cart", auth, (req, res) => {                             const { produkId, jumlah } = req.body;
  if (!carts[req.user.email]) carts[req.user.email] = [];
  const produk = products.find(p => p.id == produkId);
  if (!produk) return res.status(404).json({ message: "Produk tidak di
temukan" });
  carts[req.user.email].push({ ...produk, jumlah });
  res.json({ message: "Ditambahkan ke keranjang" });                  });
                                                                      app.get("/api/cart", auth, (req, res) => {                              res.json(carts[req.user.email] || []);                              });
                                                            
// === ORDER ===
app.post("/api/order", auth, (req, res) => {
  const { items, metode, alamat } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Item pesanan tidak valid"
});
  }

  if (!metode || !alamat) {
    return res.status(400).json({ message: "Metode pembayaran dan alamat wajib diisi" });
  }

  const order = {
    id: Date.now(),                                                       user: req.user.email,
    items,
    metode,
    alamat,
    status: "Belum Dibayar",                                              tanggal: new Date().toISOString()                                   };                                                                                                                                          orders.push(order);                                                   simpanOrders(orders);                                                                                                                       res.json({ message: "Pesanan berhasil dibuat", order });            });


app.get("/api/my-orders", auth, (req, res) => {
  const userOrders = orders.filter(o => o.user === req.user.email);     res.json(userOrders);                                               });

app.get("/api/admin/orders", auth, (req, res) => {                      if (req.user.role !== "admin") return res.status(403).json({ message: "Akses ditolak" });
  res.json(orders);                                                   });                                                                                                                                         app.post("/api/admin/orders/update", auth, (req, res) => {              if (req.user.role !== "admin") return res.status(403).json({ message: "Akses ditolak" });                                                   const { index, status } = req.body;                                   if (orders[index]) {
    orders[index].status = status;
    res.json({ message: "Status diperbarui" });
  } else {
    res.status(404).json({ message: "Order tidak ditemukan" });
  }                                                                   });
  
// Start server
app.listen(PORT, () => {
  console.log("✅ Server Paylin jalan di http://localhost:" + PORT);  });