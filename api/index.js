require('dotenv').config();

// An Express app instance is itself a (req, res) handler, so Vercel can invoke
// it directly as a serverless function. No app.listen() in this environment.
module.exports = require('../backend/app');
