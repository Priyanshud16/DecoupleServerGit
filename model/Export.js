const mongoose = require("mongoose");

const ExportSchema = new mongoose.Schema({
  filename: String,
  clips: [
    {
      start: Number,
      end: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Export", ExportSchema);
