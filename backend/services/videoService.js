const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Extrait la piste audio d'une vidéo et la sauvegarde en .mp3
 * @param {string} videoFilename - nom du fichier dans uploads/videos
 * @returns {Promise<string>} chemin absolu du fichier audio généré
 */
exports.extractAudio = (videoFilename) => {
  return new Promise((resolve, reject) => {
    const videoPath = path.join(__dirname, '../uploads/videos', videoFilename);
    const audioFilename = videoFilename.replace(/\.\w+$/, '.mp3');
    const audioDir = path.join(__dirname, '../uploads/audio');
    const audioPath = path.join(audioDir, audioFilename);

    // Crée le dossier audio s'il n'existe pas encore
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('64k') // suffisant pour de la voix, fichier léger
      .save(audioPath)
      .on('end', () => resolve(audioPath))
      .on('error', (err) => reject(err));
  });
};