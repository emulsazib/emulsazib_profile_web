require('dotenv').config();

const connectDB = require('./backend/config/db');
const app = require('./backend/app');

const PORT = process.env.PORT || 4000;

// ── Connect to database, then start server ──
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Portfolio server ready on http://localhost:${PORT}`);
  });
});
