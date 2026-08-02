const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const upload = require('../middleware/uploads');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', meetingController.getMeetings);
router.get('/:id', meetingController.getMeetingById);
router.post('/', meetingController.createMeeting);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);
router.post('/:id/upload', upload.single('video'), meetingController.uploadRecording);
router.post('/:id/notes', meetingController.addNote);
router.put('/:id/notes/:noteId', meetingController.updateNote);
router.delete('/:id/notes/:noteId', meetingController.deleteNote);
router.post('/:id/transcribe', meetingController.transcribeMeeting);
router.post(
  '/:id/upload-chunk',
  express.raw({ type: 'application/octet-stream', limit: '20mb' }),
  meetingController.uploadChunk
);

router.post('/:id/finalize-upload', meetingController.finalizeUpload);
module.exports = router;