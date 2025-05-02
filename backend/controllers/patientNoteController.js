const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all notes for a patient
const getPatientNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id; // Assuming user ID is stored in req.user after authentication

    // Check if the authenticated user is the patient
    if (parseInt(patientId) !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to patient notes' });
    }

    const notes = await prisma.patientNote.findMany({
      where: { patientId: parseInt(patientId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient notes' });
  }
};

// Create a new note
const createPatientNote = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;
    const { content, doctorName } = req.body;
    
    console.log('Creating note with:', {
      patientId,
      userId,
      content,
      doctorName,
      body: req.body
    });
    
    // Check if the authenticated user is the patient
    if (parseInt(patientId) !== userId) {
      console.log('Authorization failed:', { patientId, userId });
      return res.status(403).json({ error: 'Unauthorized to create notes for this patient' });
    }
    
    const note = await prisma.patientNote.create({
      data: {
        content,
        doctorName,
        patientId: parseInt(patientId)
      }
    });

    console.log('Note created successfully:', note);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error in createPatientNote:', error);
    res.status(500).json({ error: 'Failed to create patient note', details: error.message });
  }
};

// Update a note
const updatePatientNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    const { content, doctorName } = req.body;
    
    // First get the note to check ownership
    const note = await prisma.patientNote.findUnique({
      where: { id: parseInt(noteId) }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if the authenticated user is the owner of the note
    if (note.patientId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this note' });
    }
    
    const updatedNote = await prisma.patientNote.update({
      where: { id: parseInt(noteId) },
      data: { content, doctorName }
    });
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient note' });
  }
};

// Delete a note
const deletePatientNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    // First get the note to check ownership
    const note = await prisma.patientNote.findUnique({
      where: { id: parseInt(noteId) }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if the authenticated user is the owner of the note
    if (note.patientId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this note' });
    }
    
    await prisma.patientNote.delete({
      where: { id: parseInt(noteId) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient note' });
  }
};

module.exports = {
  getPatientNotes,
  createPatientNote,
  updatePatientNote,
  deletePatientNote
}; 