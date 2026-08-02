const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

function contactsCollection() {
  return getDB().collection('contacts');
}

// GET /api/contacts - Liste des contacts de l'utilisateur
exports.getContacts = async (req, res) => {
  try {
    const contacts = await contactsCollection()
      .find({ userId: req.userId })
      .sort({ name: 1 })
      .toArray();

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/contacts - Ajouter un contact
exports.createContact = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nom et email sont requis' });
    }

    // Évite les doublons pour le même utilisateur
    const existing = await contactsCollection().findOne({
      userId: req.userId,
      email: email.toLowerCase()
    });
    if (existing) {
      return res.status(409).json({ error: 'Ce contact existe déjà' });
    }

    const newContact = {
      userId: req.userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdAt: new Date()
    };

    const result = await contactsCollection().insertOne(newContact);
    res.status(201).json({ ...newContact, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/contacts/:id - Supprimer un contact
exports.deleteContact = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const result = await contactsCollection().findOneAndDelete({
      _id: new ObjectId(req.params.id),
      userId: req.userId
    });

    if (!result) return res.status(404).json({ error: 'Contact introuvable' });
    res.json({ message: 'Contact supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};