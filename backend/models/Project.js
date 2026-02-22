const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  stack: [String],
  description: { type: String, required: true },
  link: String,
  github: String,
});

module.exports = mongoose.model('Project', projectSchema);
