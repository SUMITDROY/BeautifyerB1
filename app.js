import express from "express";
import path from "path";
import mongoose from "mongoose";
import upload from './config/multer.js'
import beautifyImage from './utils/beautifier.sharp.js';
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

mongoose
  .connect("mongodb://127.0.0.1:27017/SnapB")
  .then(() => {
    console.log("connected");
  })
  .catch((err) => {
    console.error("connection error:", err);
  });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


app.listen(3005, () => {
  console.log("server started");
});

app.get("/", (req, res) => {
  res.render("index", { imagePath: null });
});

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const beautifiedFilename = await beautifyImage(file);
    res.render("index", {
      imagePath: "/images/beautified/" + beautifiedFilename,
    });
  } catch (err) {
    res.render("try again something went wrong", { err });
  }
});
