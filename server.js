// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

// --- 1) Ініціалізація Firebase Admin SDK ---
// Якщо є змінна SERVICE_ACCOUNT_JSON, парсимо її
let serviceAccount;
if (process.env.SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
} else {
  // у локальній розробці все ще можна брати з файлу
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --- 2) Налаштування Express ---
const app = express();
app.use(cors());
app.use(express.json());

// --- 3) Роздача React build як статичних файлів ---
app.use(express.static(path.join(__dirname, "build")));

// --- 4) Fallback для React Router ---
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(__dirname, "build", "index.html"));
  }
  next();
});

// --- 5) Публічний маршрут /api/message ---
app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// --- 6) Реєстрація нового користувача ---
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- 7) Логін – повертаємо custom token за email ---
app.post("/api/login", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(user.uid);
    res.json({ token: customToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- 8) Middleware для захисту маршрутів ---
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// --- 9) Профіль користувача (тільки автентифікованим) ---
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email });
});

// --- 10) Захищений маршрут /api/protected ---
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "You have accessed a protected route!",
    user: { uid: req.user.uid, email: req.user.email }
  });
});

// --- 11) Маршрут GET /api/ratings з опцією ?eventId=... ---
app.get("/api/ratings", async (req, res) => {
  try {
    const { eventId } = req.query;
    let queryRef = db.collection("ratings");
    if (eventId) {
      queryRef = queryRef.where("eventId", "==", eventId);
    }
    const snapshot = await queryRef.get();
    const ratings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(ratings);
  } catch (err) {
    console.error("GET /api/ratings помилка:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- 11.2) POST /api/ratings (додаємо рейтинг, тільки автентифіковані) ---
app.post("/api/ratings", verifyToken, async (req, res) => {
  const { eventId, score } = req.body;
  if (!eventId || typeof score !== "number") {
    return res.status(400).json({ error: "eventId та score обов’язкові" });
  }
  try {
    const newDoc = {
      eventId,
      score,
      uid: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    const ref = await db.collection("ratings").add(newDoc);
    res.status(201).json({ id: ref.id });
  } catch (err) {
    console.error("POST /api/ratings помилка:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- 12) Запуск сервера ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
