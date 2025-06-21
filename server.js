const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors()); // Allow requests from frontend
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to 'uploads' folder
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Upload Route
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrl = `https://decoupleservergit-1.onrender.com/uploads/${req.file.filename}`; // ✅ PUBLIC URL
  return res.json({
    url: fileUrl,
    filename: req.file.filename,
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
