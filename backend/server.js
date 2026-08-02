require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

// On démarre le serveur seulement une fois connecté à la base
connectDB()
  .then(() => {
    const authRoutes = require('./routes/authRoutes');
    const meetingRoutes = require('./routes/meetingRoutes');
    const contactRoutes = require('./routes/contactRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/meetings', meetingRoutes);
    app.use('/api/contacts', contactRoutes);

    app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB :', err);
    process.exit(1);
  });