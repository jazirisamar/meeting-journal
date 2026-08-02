const { AssemblyAI } = require('assemblyai');
const videoService = require('./videoService');
const fs = require('fs');

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

exports.transcribeVideo = async (videoFilename) => {
  // 1. Extraire l'audio de la vidéo
  const audioPath = await videoService.extractAudio(videoFilename);

  try {
    // 2. Envoyer l'audio (plus léger) à AssemblyAI
    const transcript = await client.transcripts.transcribe({
      audio: audioPath,
      language_code: 'fr'
    });

    if (transcript.status === 'error') {
      throw new Error(transcript.error);
    }

    return transcript.text;
  } finally {
    // 3. Nettoyage : supprime le fichier audio temporaire après usage
    fs.unlink(audioPath, (err) => {
      if (err) console.error('Erreur suppression fichier audio temporaire:', err.message);
    });
  }
};