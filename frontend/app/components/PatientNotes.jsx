import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Assuming you have an auth context

const PatientNotes = ({ patientId }) => {
  const { user } = useAuth(); // Get the authenticated user
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.id === parseInt(patientId)) {
      fetchNotes();
    }
  }, [patientId, user]);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`/api/patients/${patientId}/notes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` // Assuming you store the token in localStorage
        }
      });
      setNotes(response.data);
      setError('');
    } catch (error) {
      if (error.response?.status === 403) {
        setError('You are not authorized to view these notes');
      } else {
        setError('Failed to fetch notes');
      }
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const response = await axios.post(`/api/patients/${patientId}/notes`, {
        content: newNote
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotes([response.data, ...notes]);
      setNewNote('');
      setError('');
    } catch (error) {
      if (error.response?.status === 403) {
        setError('You are not authorized to add notes');
      } else {
        setError('Failed to add note');
      }
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await axios.put(`/api/patients/notes/${noteId}`, {
        content: editContent
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotes(notes.map(note => 
        note.id === noteId ? response.data : note
      ));
      setEditingNote(null);
      setEditContent('');
      setError('');
    } catch (error) {
      if (error.response?.status === 403) {
        setError('You are not authorized to update this note');
      } else {
        setError('Failed to update note');
      }
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`/api/patients/notes/${noteId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotes(notes.filter(note => note.id !== noteId));
      setError('');
    } catch (error) {
      if (error.response?.status === 403) {
        setError('You are not authorized to delete this note');
      } else {
        setError('Failed to delete note');
      }
    }
  };

  // If the user is not authenticated or not the patient, show a message
  if (!user || user.id !== parseInt(patientId)) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Patient Notes</h2>
        <p className="text-red-500">You are not authorized to view or manage these notes.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Patient Notes</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Add new note */}
      <div className="mb-6">
        <textarea
          className="w-full p-2 border rounded"
          rows="3"
          placeholder="Add a new note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleAddNote}
        >
          Add Note
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="border p-4 rounded">
            {editingNote === note.id ? (
              <div>
                <textarea
                  className="w-full p-2 border rounded"
                  rows="3"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="mt-2 space-x-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    onClick={() => handleUpdateNote(note.id)}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                    onClick={() => {
                      setEditingNote(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="whitespace-pre-wrap">{note.content}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => {
                      setEditingNote(note.id);
                      setEditContent(note.content);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientNotes; 