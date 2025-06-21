const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

const app = express();
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


const clipSchema = new mongoose.Schema({ filename: String, start: Number, end: Number });
const Clip = mongoose.model('Clip', clipSchema);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.post('/upload', upload.single('video'), (req, res) => {
 res.json({ url: `http://localhost:${PORT}/uploads/${req.file.filename}`, filename: req.file.filename });

});

app.post('/export', async (req, res) => {
  const { filename, clips } = req.body;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const outputPath = `./uploads/clip_${i}_${filename}`;
    await new Promise((resolve, reject) => {
      ffmpeg(`./uploads/${filename}`)
        .setStartTime(clip.start)
        .setDuration(clip.end - clip.start)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
    await Clip.create({ filename: outputPath, start: clip.start, end: clip.end });
  }
  res.json({ message: 'Clips exported successfully' });
});

app.listen(PORT, () => console.log(`Server running on ${PORT} DB is created sucessfully`));