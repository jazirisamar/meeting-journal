const OpenAI = require('openai');
const fs = require('fs');
const videoService = require('./videoService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Transcrit une vidéo avec identification des locuteurs (diarisation)
 * @param {string} videoFilename - nom du fichier dans uploads/videos
 * @returns {Promise<{ text: string, segments: Array }>}
 */
exports.transcribeVideo = async (videoFilename) => {
  // 1. Extraire l'audio de la vidéo (réutilise le service existant)
  const audioPath = await videoService.extractAudio(videoFilename);

  try {
    // 2. Envoyer l'audio à OpenAI avec diarisation activée
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'gpt-4o-transcribe-diarize',
      response_format: 'diarized_json'
    });

    const segments = (response.segments || []).map(seg => ({
      speaker: seg.speaker || 'Inconnu',
      text: seg.text,
      start: seg.start,
      end: seg.end
    }));

    return {
      text: response.text || segments.map(s => s.text).join(' '),
      segments
    };
  } finally {
    // 3. Nettoyage : supprime le fichier audio temporaire
    fs.unlink(audioPath, (err) => {
      if (err) console.error('Erreur suppression fichier audio temporaire:', err.message);
    });
  }
};