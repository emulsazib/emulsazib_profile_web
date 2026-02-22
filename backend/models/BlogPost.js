const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  date: String,
  tags: [String],
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
