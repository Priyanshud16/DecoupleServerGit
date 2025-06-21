const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');
const mongoose = require('mongoose');
const Export = require("./model/Export");
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // for using .env file

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/videoeditor', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error(" MongoDB connection error:", err));

// ✅ Ensure folders exist
const uploadsDir = './uploads';
const exportsDir = './exports';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir);

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ✅ Upload Route
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl, filename: req.file.filename });
});

// ✅ Export Clips Route
app.post("/export", async (req, res) => {
  try {
    const { filename, clips } = req.body;
    if (!filename || !clips || !Array.isArray(clips)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const inputPath = path.join(__dirname, "uploads", filename);
    const exportPaths = [];

    const promises = clips.map((clip, index) => {
      const outputName = `${Date.now()}_clip${index + 1}.mp4`;
      const outputPath = path.join(__dirname, "exports", outputName);
      const command = `"${ffmpegPath}" -i "${inputPath}" -ss ${clip.start} -to ${clip.end} -c copy "${outputPath}"`;

      exportPaths.push(`/exports/${outputName}`);

      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) {
            console.error(`FFmpeg error: ${error.message}`);
            return reject(error);
          }
          resolve();
        });
      });
    });

    await Promise.all(promises);

    // ✅ Save export info to DB
    await Export.create({ filename, clips });

    res.json({
      message: "Clips exported",
      files: exportPaths,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Export failed", error: error.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
