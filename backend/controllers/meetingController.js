const { ObjectId } = require('mongodb');
const { getDB } = require('../db');
const emailService = require('../services/emailService');
const transcriptionService = require('../services/transcriptionService');

// Petit helper pour éviter de répéter la récupération de la collection
function meetingsCollection() {
  return getDB().collection('meetings');
}

// GET /api/meetings - Liste toutes les réunions (avec recherche/filtre optionnels)
exports.getMeetings = async (req, res) => {
  try {
    const { search, date } = req.query;
    const filter = { userId: req.userId };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const meetings = await meetingsCollection()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/meetings/:id - Détail d'une réunion
exports.getMeetingById = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const meeting = await meetingsCollection().findOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId
    });

    if (!meeting) return res.status(404).json({ error: 'Réunion introuvable' });

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/meetings - Créer une nouvelle réunion
exports.createMeeting = async (req, res) => {
  try {
    const { title, description, participants, category } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Le titre est obligatoire' });
    }

    const now = new Date();

    const newMeeting = {
      userId: req.userId,
      title,
      description: description || '',
      participants: (participants || []).map(p => ({
        _id: new ObjectId(),
        name: p.name,
        email: p.email
      })),
      category: category || '',
      videoPath: null,
      duration: 0,
      notes: [],
      transcription: null,
      transcriptionStatus: 'none',
      status: 'recording',
      createdAt: now,
      updatedAt: now
    };

    const result = await meetingsCollection().insertOne(newMeeting);
    const createdMeeting = { ...newMeeting, _id: result.insertedId };

    emailService.sendMeetingInvitation(createdMeeting).catch(err => {
      console.error('Erreur envoi email:', err.message);
    });

    res.status(201).json(createdMeeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/meetings/:id - Modifier une réunion (infos générales)
exports.updateMeeting = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const updateFields = { ...req.body, updatedAt: new Date() };
    delete updateFields._id;
    delete updateFields.userId; // on ne laisse jamais réassigner le propriétaire

    const result = await meetingsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.userId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Réunion introuvable' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/meetings/:id - Supprimer une réunion
exports.deleteMeeting = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const result = await meetingsCollection().findOneAndDelete({
      _id: new ObjectId(req.params.id),
      userId: req.userId
    });

    if (!result) return res.status(404).json({ error: 'Réunion introuvable' });

    res.json({ message: 'Réunion supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/meetings/:id/upload - Upload de la vidéo + notes
exports.uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier vidéo reçu' });
    }
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const updateFields = {
      videoPath: `/uploads/videos/${req.file.filename}`,
      duration: req.body.duration ? parseInt(req.body.duration) : 0,
      status: 'saved',
      updatedAt: new Date()
    };

    if (req.body.notes) {
      updateFields.notes = JSON.parse(req.body.notes).map(n => ({
        _id: new ObjectId(),
        timestamp: n.timestamp,
        content: n.content,
        createdAt: new Date()
      }));
    }

    const result = await meetingsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.userId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Réunion introuvable' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/meetings/:id/notes - Ajouter une note
exports.addNote = async (req, res) => {
  try {
    const { timestamp, content } = req.body;
    if (content === undefined || timestamp === undefined) {
      return res.status(400).json({ error: 'timestamp et content sont requis' });
    }
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const newNote = {
      _id: new ObjectId(),
      timestamp,
      content,
      createdAt: new Date()
    };

    const result = await meetingsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.userId },
      { $push: { notes: newNote }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Réunion introuvable' });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/meetings/:id/notes/:noteId - Modifier une note
exports.updateNote = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.params.noteId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const setFields = { updatedAt: new Date() };
    if (req.body.content !== undefined) setFields['notes.$.content'] = req.body.content;
    if (req.body.timestamp !== undefined) setFields['notes.$.timestamp'] = req.body.timestamp;

    const result = await meetingsCollection().findOneAndUpdate(
      {
        _id: new ObjectId(req.params.id),
        userId: req.userId,
        'notes._id': new ObjectId(req.params.noteId)
      },
      { $set: setFields },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Réunion ou note introuvable' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/meetings/:id/notes/:noteId - Supprimer une note
exports.deleteNote = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.params.noteId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const result = await meetingsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.userId },
      { $pull: { notes: { _id: new ObjectId(req.params.noteId) } }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Réunion introuvable' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/meetings/:id/transcribe - Lancer la transcription
exports.transcribeMeeting = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const meeting = await meetingsCollection().findOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId
    });

    if (!meeting) return res.status(404).json({ error: 'Réunion introuvable' });
    if (!meeting.videoPath) return res.status(400).json({ error: 'Aucune vidéo à transcrire' });

    await meetingsCollection().updateOne(
      { _id: meeting._id },
      { $set: { transcriptionStatus: 'pending', updatedAt: new Date() } }
    );
    res.json({ ...meeting, transcriptionStatus: 'pending' });

    // Traitement asynchrone après la réponse
    try {
      const filename = meeting.videoPath.split('/').pop();
      const text = await transcriptionService.transcribeVideo(filename);

      await meetingsCollection().updateOne(
        { _id: meeting._id },
        { $set: { transcription: text, transcriptionStatus: 'done', updatedAt: new Date() } }
      );
    } catch (err) {
      console.error('Erreur transcription:', err.message);
      await meetingsCollection().updateOne(
        { _id: meeting._id },
        { $set: { transcriptionStatus: 'failed', updatedAt: new Date() } }
      );
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  };
  const fs = require('fs');
const path = require('path');

// Dossier temporaire pour les enregistrements en cours
const tmpDir = path.join(__dirname, '../uploads/tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

function tmpFilePath(meetingId) {
  return path.join(tmpDir, `${meetingId}.webm`);
}

// POST /api/meetings/:id/upload-chunk - Réceptionne un morceau de vidéo
exports.uploadChunk = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: 'Chunk vide' });
    }

    // Ajoute le morceau à la suite du fichier temporaire
    // Les chunks WebM de MediaRecorder, concaténés dans l'ordre, forment un flux valide
    fs.appendFileSync(tmpFilePath(req.params.id), req.body);

    res.status(200).json({ received: req.body.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/meetings/:id/finalize-upload - Finalise l'enregistrement après tous les chunks
exports.finalizeUpload = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const tmpPath = tmpFilePath(req.params.id);
    if (!fs.existsSync(tmpPath)) {
      return res.status(400).json({ error: 'Aucun enregistrement en cours pour cette réunion' });
    }

    // Déplace le fichier temporaire vers son emplacement final
    const finalFilename = `meeting-${Date.now()}-${req.params.id}.webm`;
    const finalPath = path.join(__dirname, '../uploads/videos', finalFilename);
    fs.renameSync(tmpPath, finalPath);

    const updateFields = {
      videoPath: `/uploads/videos/${finalFilename}`,
      duration: req.body.duration ? parseInt(req.body.duration) : 0,
      status: 'saved',
      updatedAt: new Date()
    };

    if (req.body.notes) {
      updateFields.notes = JSON.parse(req.body.notes).map(n => ({
        _id: new ObjectId(),
        timestamp: n.timestamp,
        content: n.content,
        createdAt: new Date()
      }));
    }

    const result = await meetingsCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.userId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Réunion introuvable' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};