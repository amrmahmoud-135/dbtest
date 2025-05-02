const express = require('express');
const router = express.Router();
const patientNoteController = require('../controllers/patientNoteController');
const { authenticateUser } = require('../utils/authMiddleware');

// Get all notes for a patient
router.get('/:patientId/notes', authenticateUser, patientNoteController.getPatientNotes);

// Create a new note
router.post('/:patientId/notes', authenticateUser, patientNoteController.createPatientNote);

// Update a note
router.put('/notes/:noteId', authenticateUser, patientNoteController.updatePatientNote);

// Delete a note
router.delete('/notes/:noteId', authenticateUser, patientNoteController.deletePatientNote);

module.exports = router; 