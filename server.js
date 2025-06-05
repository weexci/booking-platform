require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

let serviceAccount;
if (process.env.SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
  } catch (err) {
    console.error("Не вдалося розпарсити JSON з SERVICE_ACCOUNT_JSON:", err);
    process.exit(1);
  }
} else {
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "build")));

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(__dirname, "build", "index.html"));
  }
  next();
});



app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email });
});

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "You have accessed a protected route!",
    user: { uid: req.user.uid, email: req.user.email },
  });
});

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
      ...doc.data(),
    }));

    res.json(ratings);
  } catch (err) {
    console.error("GET /api/ratings error:", err);
    res.status(500).json({ error: err.message });
  }
});

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
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection("ratings").add(newDoc);
    res.status(201).json({ id: ref.id });
  } catch (err) {
    console.error("POST /api/ratings error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
