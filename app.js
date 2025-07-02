import express from "express";
import path from "path";
import mongoose from "mongoose";
import upload from './config/multer.js';
import beautifyImage from './utils/beautifier.sharp.js';
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ Connected to MongoDB Atlas");
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


app.get("/", (req, res) => {
  res.render("anotherindex", { imagePath: null });
});

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const text = req.body.code;

    const filename = await beautifyImage({ file, text }); 

    res.render("anotherindex", {
      imagePath: "/images/beautified/" + filename, 
    });
  } catch (err) {
    console.error("🚨 Error during upload:", err);
    res.status(500).send("Something went wrong!");
  }
});

export default app;
