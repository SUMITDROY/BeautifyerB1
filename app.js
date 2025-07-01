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
app.use('/images', express.static(path.join(__dirname, 'public/images')));




app.get("/", (req, res) => {
  res.render("anotherindex", { imagePath: null });
});

// app.post("/upload", upload.single("image"), async (req, res) => {
//   try {
//     const file = req.file;
//     const text = req.body.code
//     const beautifiedFilename = await beautifyImage({file,text});
//     res.render("anotherindex", {
//       imagePath: "/images/beautified/" + beautifiedFilename,
//     });
//   } catch (err) {
//     res.render("try again something went wrong", { err });
//   }
// });


app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const text = req.body.code;

    // Return the image buffer directly instead of saving it to disk
    const imageBuffer = await beautifyImage({ file, text, returnBuffer: true });

    const base64Image = imageBuffer.toString("base64");

    res.render("anotherindex", {
      imageBase64: base64Image
    });
  } catch (err) {
    console.error("Error during upload:", err);
    res.status(500).send("Something went wrong!");
  }
});


export default app;

