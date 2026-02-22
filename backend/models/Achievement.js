const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: String,
  date: String,
});

module.exports = mongoose.model('Achievement', achievementSchema);
