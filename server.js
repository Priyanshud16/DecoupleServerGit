const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');


const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ Ensure uploads folder exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Upload route
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrl = `https://decoupleservergit-1.onrender.com/uploads/${req.file.filename}`;
  return res.json({
    url: fileUrl,
    filename: req.file.filename,
  });
});


if (!fs.existsSync("./exports")) {
  fs.mkdirSync("./exports");
}


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
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`FFmpeg error: ${error.message}`);
            return reject(error);
          }
          resolve();
        });
      });
    });

    await Promise.all(promises);

    res.json({
      message: "Clips exported",
      files: exportPaths,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Export failed" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
