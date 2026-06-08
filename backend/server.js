const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/database');
const routes = require('./src/routes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize DB on start
initializeDatabase();

// Mount API routes
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
