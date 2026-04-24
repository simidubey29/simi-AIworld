import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ DEBUG ENV
console.log("MONGO:", process.env.MONGO_URI);
console.log("GEMINI:", process.env.GEMINI_API_KEY ? "OK" : "MISSING");

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("Mongo Error:", err));

// ✅ Schema
const Confession = mongoose.model("Confession", {
  text: String,
  createdAt: { type: Date, default: Date.now }
});

// ✅ Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});

// ================= ROUTES =================

// Health check
app.get("/", (req, res) => {
  res.send("Backend Working ✅");
});

// Chat
app.post("/api/chat", async (req, res) => {
  try {
    const userMsg = req.body.message;

    const result = await model.generateContent(userMsg);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (err) {
    console.log("AI ERROR:", err);
    res.status(500).json({ reply: "AI error ❌" });
  }
});

// Confession
app.post("/api/confession", async (req, res) => {
  try {
    const data = new Confession({ text: req.body.text });
    await data.save();
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// Truth
app.get("/api/game/truth", (req, res) => {
  const questions = ["Your crush?", "Biggest secret?"];
  res.json({ question: questions[Math.floor(Math.random()*questions.length)] });
});

// Dare
app.get("/api/game/dare", (req, res) => {
  const dares = ["Text your crush 😏", "Sing loudly 🎤"];
  res.json({ question: dares[Math.floor(Math.random()*dares.length)] });
});

// Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on " + PORT));