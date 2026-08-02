const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

function usersCollection() {
  return getDB().collection('users');
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nom, email et mot de passe sont requis' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const existing = await usersCollection().findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await usersCollection().insertOne(newUser);

    const token = jwt.sign(
      { userId: result.insertedId.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { _id: result.insertedId, name, email: newUser.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis' });
    }

    const user = await usersCollection().findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me - Vérifie le token et renvoie l'utilisateur courant
exports.getCurrentUser = async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const user = await usersCollection().findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } } // on exclut le mot de passe de la réponse
    );
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// PUT /api/auth/me - Modifier le profil (nom, email, mot de passe)
exports.updateProfile = async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await usersCollection().findOne({ _id: new ObjectId(req.userId) });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const updateFields = {};

    if (name && name.trim()) {
      updateFields.name = name.trim();
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const existing = await usersCollection().findOne({ email: email.trim().toLowerCase() });
      if (existing) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
      }
      updateFields.email = email.trim().toLowerCase();
    }

    // Changement de mot de passe : uniquement si demandé explicitement
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel requis pour le changer' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      }
      updateFields.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    await usersCollection().updateOne({ _id: user._id }, { $set: updateFields });

    const updatedUser = await usersCollection().findOne(
      { _id: user._id },
      { projection: { password: 0 } }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};