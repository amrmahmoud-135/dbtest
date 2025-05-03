import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientProfile.css";
import babyLogo from "../images/imgg.png";
import { getuserDetails } from "../auth/loginAuth";

const INITIAL_STATE = {
  user: {
    name: "",
    id: "",
    nationalId: "",
    dob: "",
    email: "",
    phone: "",
    address: "",
    profilePhoto: null,
    allergies: [],
    surgeries: [],
    chronicConditions: [],
    medications: []
  },
  pregnancyInfo: {
    currentWeek: 0,
    lmp: "",
    edd: "",
    gravida: 0,
    para: 0,
    abortions: 0,
    ultrasoundDates: []
  },
  bloodGroup: { bloodGroup: "" },
  medicalHistory: {
    allergies: [],
    surgeries: [],
    chronicConditions: [],
    medications: []
  },
  notes: []
};

const PatientProfile = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("basic-info");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const [editFormData, setEditFormData] = useState({
    name: "",
    dob: "",
    nationalId: "",
    patientId: ""
  });
  
  const [editContactFormData, setEditContactFormData] = useState({
    email: "",
    phone: "",
    address: ""
  });
  
  const [editMedicalFormData, setEditMedicalFormData] = useState({
    allergies: "",
    surgeries: "",
    chronicConditions: "",
    medications: ""
  });
  
  const [newNote, setNewNote] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedNoteText, setEditedNoteText] = useState("");

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const response = await getuserDetails();
        console.log("Full patient data received:", response);
        
        if (!response || !response.success) {
          throw new Error("Failed to fetch patient data");
        }

        const { user, age } = response.data;
        console.log("User data:", user);
        
        if (!user) {
          throw new Error("No user data received");
        }

        // Update state with fetched data while preserving structure
        setPatientData(prevData => ({
          ...prevData,
          user: {
            ...prevData.user,
            ...user,
            // Ensure dob has a default value if it's missing
            dob: user.dob || ""
          },
          age
        }));

        // Fetch notes separately
        try {
          const notesResponse = await fetch(`http://localhost:5000/api/patients/${user.id}/notes`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (notesResponse.ok) {
            const notes = await notesResponse.json();
            setPatientData(prevData => ({
              ...prevData,
              notes: notes || []
            }));
          }
        } catch (noteError) {
          console.error("Error fetching notes:", noteError);
          // Don't throw here, just log the error and continue
        }
        
        // Update form data with safe defaults
        setEditFormData({
          name: user.name || "",
          dob: user.dob || "", // Remove the slice operation since dob might be missing
          nationalId: user.nationalId || "",
          patientId: user.id || ""
        });
        
        setEditContactFormData({
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || ""
        });
        
        setEditMedicalFormData({
          allergies: user.allergies?.join(", ") || "",
          surgeries: user.surgeries?.join(", ") || "",
          chronicConditions: user.chronicConditions?.join(", ") || "",
          medications: user.medications?.join(", ") || ""
        });
      } catch (error) {
        console.error("Error fetching patient data:", error);
        setError(error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [navigate]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const token = localStorage.getItem("token");

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('profilePhoto', file);
    
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Uploading photo...', file);
      const response = await fetch('http://localhost:5000/api/signup/user/update-photo', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('Upload response:', response);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile photo');
      }

        const result = await response.json();
      console.log('Upload result:', result);

        setPatientData(prev => ({
          ...prev,
          user: {
            ...prev.user,
            profilePhoto: result.profilePhoto
          }
        }));

      setNotification({
        show: true,
        message: 'Profile photo updated successfully!',
        type: 'success'
      });

      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating profile photo:', error);
      setNotification({
        show: true,
        message: error.message || 'An error occurred while updating the profile photo.',
        type: 'error'
      });
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContactEditChange = (e) => {
    const { name, value } = e.target;
    setEditContactFormData({
      ...editContactFormData,
      [name]: value,
    });
  };

  const handleMedicalEditChange = (e) => {
    const { name, value } = e.target;
    setEditMedicalFormData({
      ...editMedicalFormData,
      [name]: value,
    });
  };

  const handleSavePersonalInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name,
          dob: editFormData.dob,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPatientData(prev => ({
          ...prev,
          user: {
            ...prev.user,
            name: result.user.name,
            dob: result.user.dob
          }
        }));
        setIsEditing(false);
        setNotification({
          show: true,
          message: 'Personal information updated successfully!',
          type: 'success'
        });
      } else {
        setNotification({
          show: true,
          message: result.message || 'Failed to update personal information',
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error saving personal info:", error);
      setNotification({
        show: true,
        message: 'An error occurred while saving changes',
        type: 'error'
      });
    }
  };
  
  const handleSaveContactDetails = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: editContactFormData.email,
          phone: editContactFormData.phone,
          address: editContactFormData.address
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPatientData(prev => ({
          ...prev,
          user: {
            ...prev.user,
            email: result.user.email,
            phone: result.user.phone,
            address: result.user.address
          }
        }));
        setIsEditingContact(false);
        setNotification({
          show: true,
          message: 'Contact information updated successfully!',
          type: 'success'
        });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error saving contact details:", error);
    }
  };

  const handleSaveMedicalHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/medical-history', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allergies: editMedicalFormData.allergies.split(',').map(item => item.trim()),
          surgeries: editMedicalFormData.surgeries.split(',').map(item => item.trim()),
          chronicConditions: editMedicalFormData.chronicConditions.split(',').map(item => item.trim()),
          medications: editMedicalFormData.medications.split(',').map(item => item.trim())
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPatientData(prev => ({
          ...prev,
          medicalHistory: result.medicalHistory
        }));
        setIsEditingMedical(false);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error saving medical history:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setNotification({
        show: true,
        message: 'Please enter a note before saving.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
      return;
    }
    
    if (!patientData?.user?.id) {
      setNotification({
        show: true,
        message: 'Patient ID is missing. Please try logging in again.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
      return;
    }

    if (!token) {
      setNotification({
        show: true,
        message: 'Authentication token is missing. Please try logging in again.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
      return;
    }
    
    try {
      const requestData = {
        content: newNote.trim(),
        doctorName: doctorName.trim() || null
      };

      console.log('Sending note creation request:', {
        url: `http://localhost:5000/api/patients/${patientData.user.id}/notes`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: requestData
      });

      const response = await fetch(`http://localhost:5000/api/patients/${patientData.user.id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        setNewNote("");
        setDoctorName("");
        setPatientData(prev => ({
          ...prev,
          notes: [...(prev.notes || []), {
            ...result,
            doctorName: doctorName.trim() || null
          }]
        }));
        setNotification({
          show: true,
          message: 'Note created successfully!',
          type: 'success'
        });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
      } else {
        const errorMessage = result.error || result.details || 'Failed to create note';
        setNotification({
          show: true,
          message: `Error: ${errorMessage}`,
          type: 'error'
        });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
      }
    } catch (error) {
      console.error("Error adding note:", error);
      setNotification({
        show: true,
        message: 'Failed to create note. Please check your connection and try again.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditedNoteText(note.content);
    setDoctorName(note.doctorName || "");
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditedNoteText("");
    setDoctorName("");
  };

  const handleUpdateNote = async (noteId) => {
    if (!editedNoteText.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/patients/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedNoteText,
          doctorName: doctorName.trim() || null
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPatientData(prev => ({
          ...prev,
          notes: prev.notes.map(note => 
            note.id === noteId ? { ...note, content: result.content, doctorName: doctorName.trim() || null } : note
          )
        }));
        setEditingNoteId(null);
        setEditedNoteText("");
        setDoctorName("");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    setNotification({
      show: true,
      message: 'Are you sure you want to delete this note?',
      type: 'confirm',
      onConfirm: async () => {
    try {
          const response = await fetch(`http://localhost:5000/api/patients/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPatientData(prev => ({
          ...prev,
              notes: prev.notes.filter(note => note.id !== noteId)
        }));
            setNotification({
              show: true,
              message: 'Note deleted successfully',
              type: 'success'
            });
            setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
      } else {
        const error = await response.json();
            setNotification({
              show: true,
              message: `Error: ${error.error}`,
              type: 'error'
            });
            setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
          setNotification({
            show: true,
            message: 'Error deleting note. Please try again.',
            type: 'error'
          });
          setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
        }
      },
      onCancel: () => {
        setNotification({ show: false, message: '', type: '' });
      }
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <img src={babyLogo} alt="Hospital Logo" className="loading-logo" />
        <h2 className="loading-text">Loading Your Profile</h2>
        <p className="loading-subtext">Please wait while we prepare your medical information...</p>
        <div className="loading-spinner"></div>
        <div className="loading-progress">
          <div className="loading-progress-bar"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!patientData || !patientData.user) {
    return (
      <div className="error-container">
        <p>No patient data available</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const { user, pregnancyInfo, bloodGroup, medicalHistory, notes } = patientData;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('') || 'P';
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return "Invalid date";
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "basic-info":
        return (
          <div className="content-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-user-circle"></i>
                Personal Information
              </h2>
              {!isEditing && (
                <button className="edit-button" onClick={() => setIsEditing(true)}>
                  <i className="fas fa-edit"></i>
                  Edit Information
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label><i className="fas fa-user"></i> Patient Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-id-card"></i> National ID</label>
                  <input
                    type="text"
                    name="nationalId"
                    value={editFormData.nationalId}
                    onChange={handleEditChange}
                    disabled 
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-hospital-user"></i> Patient ID</label>
                  <input
                    type="text"
                    name="patientId"
                    value={editFormData.patientId}
                    onChange={handleEditChange}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-calendar-alt"></i> Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={editFormData.dob || ""}
                    onChange={handleEditChange}
                    placeholder="Select date of birth"
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => setIsEditing(false)}>
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleSavePersonalInfo}>
                    <i className="fas fa-check"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <InfoRow label={<><i className="fas fa-user"></i> Patient Name</>} value={user?.name || "N/A"} />
                <InfoRow label={<><i className="fas fa-hospital-user"></i> Patient ID</>} value={user?.id || "N/A"} />
                <InfoRow label={<><i className="fas fa-id-card"></i> National ID</>} value={user?.nationalId || "N/A"} />
                <InfoRow 
                  label={<><i className="fas fa-calendar-alt"></i> Date of Birth</>} 
                  value={formatDate(user?.dob)} 
                />
                <InfoRow label={<><i className="fas fa-tint"></i> Blood Group</>} value={bloodGroup?.bloodGroup || "N/A"} />
              </>
            )}
          </div>
        );

      case "contact":
        return (
          <div className="content-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-address-card"></i>
                Contact Details
              </h2>
              {!isEditingContact && (
                <button className="edit-button" onClick={() => setIsEditingContact(true)}>
                  <i className="fas fa-edit"></i>
                  Edit Contact Details
                </button>
              )}
            </div>

            {isEditingContact ? (
              <div className="edit-form">
                <div className="form-group">
                  <label><i className="fas fa-envelope"></i> Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editContactFormData.email}
                    onChange={handleContactEditChange}
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-phone"></i> Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editContactFormData.phone}
                    onChange={handleContactEditChange}
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-map-marker-alt"></i> Address</label>
                  <textarea
                    name="address"
                    value={editContactFormData.address}
                    onChange={handleContactEditChange}
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => setIsEditingContact(false)}>
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleSaveContactDetails}>
                    <i className="fas fa-check"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <InfoRow label={<><i className="fas fa-envelope"></i> Email</>} value={user?.email || "N/A"} />
                <InfoRow label={<><i className="fas fa-phone"></i> Phone</>} value={user?.phone || "N/A"} />
                <InfoRow label={<><i className="fas fa-map-marker-alt"></i> Address</>} value={user?.address || "N/A"} />
              </>
            )}
          </div>
        );

      case "pregnancy":
        return (
          <div className="content-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-baby"></i>
                Pregnancy Information
              </h2>
            </div>
            <div className="pregnancy-timeline">
              <h3><i className="fas fa-clock"></i> Progress</h3>
              <div className="timeline-bar">
                <div
                  className="progress"
                  style={{
                    width: `${((pregnancyInfo?.currentWeek || 0) / 40) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="timeline-labels">
                <span><i className="fas fa-calendar-check"></i> LMP: {pregnancyInfo?.lmp || "N/A"}</span>
                <span><i className="fas fa-calendar-alt"></i> EDD: {pregnancyInfo?.edd || "N/A"}</span>
              </div>
            </div>
            
            <InfoRow
              label={<><i className="fas fa-hourglass-half"></i> Current Week</>} 
              value={`${pregnancyInfo?.currentWeek || "N/A"} weeks`} 
            />
            <InfoRow
              label={<><i className="fas fa-history"></i> Obstetric History</>}
              value={`G${pregnancyInfo?.gravida || 0}P${pregnancyInfo?.para || 0}A${pregnancyInfo?.abortions || 0}`}
            />
            
            <div className="ultrasound-dates">
              <h3><i className="fas fa-ultrasound"></i> Ultrasound Dates</h3>
              {pregnancyInfo?.ultrasoundDates?.length > 0 ? (
                <div className="date-badges">
                  {pregnancyInfo.ultrasoundDates.map((date, i) => (
                  <div key={i} className="date-badge">
                      <i className="fas fa-calendar-day"></i> {date}
                  </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-calendar-times"></i>
                <p>No ultrasound dates recorded</p>
                </div>
              )}
            </div>
          </div>
        );

      case "medical":
        return (
          <div className="content-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-notes-medical"></i>
                Medical History
              </h2>
              {!isEditingMedical && (
                <button className="edit-button" onClick={() => setIsEditingMedical(true)}>
                  <i className="fas fa-edit"></i>
                  Edit Medical History
                </button>
              )}
            </div>
            
            {isEditingMedical ? (
              <div className="edit-form">
                <div className="form-group">
                  <label><i className="fas fa-allergies"></i> Allergies (comma separated)</label>
                  <input
                    type="text"
                    name="allergies"
                    value={editMedicalFormData.allergies}
                    onChange={handleMedicalEditChange}
                  />
                </div>
                
                <div className="form-group">
                  <label><i className="fas fa-procedures"></i> Surgeries (comma separated)</label>
                  <input
                    type="text"
                    name="surgeries"
                    value={editMedicalFormData.surgeries}
                    onChange={handleMedicalEditChange}
                  />
                </div>
                
                <div className="form-group">
                  <label><i className="fas fa-heartbeat"></i> Chronic Conditions (comma separated)</label>
                  <input
                    type="text"
                    name="chronicConditions"
                    value={editMedicalFormData.chronicConditions}
                    onChange={handleMedicalEditChange}
                  />
                </div>
                
                <div className="form-group">
                  <label><i className="fas fa-pills"></i> Current Medications (comma separated)</label>
                  <input
                    type="text"
                    name="medications"
                    value={editMedicalFormData.medications}
                    onChange={handleMedicalEditChange}
                  />
                </div>
                
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => setIsEditingMedical(false)}>
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleSaveMedicalHistory}>
                    <i className="fas fa-check"></i>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="medical-category">
                  <h3><i className="fas fa-allergies"></i> Allergies</h3>
                  <div className="tags">
                    {medicalHistory?.allergies?.length > 0 ? (
                      medicalHistory.allergies.map((allergy, i) => (
                        <span key={i} className="tag allergy">
                          <i className="fas fa-exclamation-circle"></i> {allergy}
                        </span>
                      ))
                    ) : (
                      <span className="tag">None recorded</span>
                    )}
                  </div>
                </div>
                
                <div className="medical-category">
                  <h3><i className="fas fa-procedures"></i> Previous Surgeries</h3>
                    {medicalHistory?.surgeries?.length > 0 ? (
                    <ul className="medical-list">
                      {medicalHistory.surgeries.map((surgery, i) => (
                        <li key={i}><i className="fas fa-check"></i> {surgery}</li>
                      ))}
                    </ul>
                    ) : (
                    <div className="empty-state">
                      <i className="fas fa-clipboard-list"></i>
                      <p>No surgeries recorded</p>
                    </div>
                    )}
                </div>
                
                <div className="medical-category">
                  <h3><i className="fas fa-heartbeat"></i> Chronic Conditions</h3>
                    {medicalHistory?.chronicConditions?.length > 0 ? (
                    <ul className="medical-list">
                      {medicalHistory.chronicConditions.map((condition, i) => (
                        <li key={i}><i className="fas fa-circle"></i> {condition}</li>
                      ))}
                    </ul>
                    ) : (
                    <div className="empty-state">
                      <i className="fas fa-heart"></i>
                      <p>No chronic conditions recorded</p>
                    </div>
                    )}
                </div>
                
                <div className="medical-category">
                  <h3><i className="fas fa-pills"></i> Current Medications</h3>
                    {medicalHistory?.medications?.length > 0 ? (
                    <ul className="medical-list">
                      {medicalHistory.medications.map((medication, i) => (
                        <li key={i}><i className="fas fa-prescription-bottle-alt"></i> {medication}</li>
                      ))}
                    </ul>
                    ) : (
                    <div className="empty-state">
                      <i className="fas fa-prescription"></i>
                      <p>No medications recorded</p>
                    </div>
                    )}
                </div>
              </>
            )}
          </div>
        );

      case "notes":
        return (
          <div className="content-section">
            <h2>Patient Notes</h2>
            <div className="notes-container">
              {notes?.length > 0 ? (
                notes.map((note, index) => (
                  <div key={note.id} className="note-item">
                    {editingNoteId === note.id ? (
                      <div className="note-edit-form">
                        <textarea
                          value={editedNoteText}
                          onChange={(e) => setEditedNoteText(e.target.value)}
                          rows="3"
                        />
                        <div className="doctor-input-container">
                          <input
                            type="text"
                            value={doctorName}
                            onChange={(e) => setDoctorName(e.target.value)}
                            placeholder="Doctor's name (optional)"
                            className="doctor-input"
                          />
                        </div>
                        <div className="note-edit-actions">
                          <button 
                            className="save-button small"
                            onClick={() => handleUpdateNote(note.id)}
                          >
                            Save
                          </button>
                          <button 
                            className="cancel-button small"
                            onClick={handleCancelEditNote}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="note-text">{note.content}</div>
                        <div className="note-meta">
                          <div className="date">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                          {note.doctorName && (
                            <div className="doctor">
                              <span>Dr. {note.doctorName}</span>
                            </div>
                          )}
                        </div>
                        <div className="note-actions">
                          <button 
                            className="edit-button small"
                            onClick={() => handleEditNote(note)}
                          >
                            <i className="fas fa-edit"></i>
                            Edit
                          </button>
                          <button 
                            className="delete-button small"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <i className="fas fa-trash"></i>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                    {index < notes.length - 1 && <hr className="note-divider" />}
                  </div>
                ))
              ) : (
                <p>No notes available</p>
              )}
            </div>
            
            <div className="add-note-section">
              <h3>Add New Note</h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your note here..."
                rows="4"
                maxLength={1000}
                style={{ maxHeight: "180px", overflowY: "auto", resize: "vertical" }}
              />
              <div className="doctor-input-container">
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Doctor's name (optional)"
                  className="doctor-input"
                />
              </div>
              <button className="add-note-button" onClick={handleAddNote}>
                Add Note
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {notification.show && (
        notification.type === 'confirm' ? (
          <div className="notification confirm">
            <span style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Confirm Deletion</span>
            <span style={{ marginBottom: 12 }}>{notification.message}</span>
            <div className="notification-buttons">
              <button className="confirm-button" onClick={notification.onConfirm}>Delete</button>
              <button className="cancel-button" onClick={notification.onCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className={`notification ${notification.type}`}>{notification.message}</div>
        )
      )}
      <nav className="top-nav">
        <div className="nav-left">
          <div className="logo">
            <img src={babyLogo} alt="Baby Logo" className="logo-image" />
            <span className="logo-text">Saudi German Hospital</span>
          </div>
          <div className="nav-links">
            <a href="#office" className="nav-link">Locations</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#specialties" className="nav-link">Find an obstetrician</a>
            <a href="#pricing" className="nav-link">Appointments</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#contact" className="nav-link">Contact Us</a>
          </div>
        </div>
        <div className="nav-right">
          <button className="nav-button" onClick={() => navigate("/")}>
            <i className="icon-calendar"></i> Home
          </button>
          <button className="nav-button">
            <i className="icon-settings"></i> Settings
          </button>
          <div className="user-profile">
            <div className="user-avatar">
              {getInitials(user.name)}
            </div>
          </div>
        </div>
      </nav>

      <div className={`patient-profile-container ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "◄" : "►"}
        </div>

        <aside className="profile-sidebar">
          <div className="profile-header">
            <div className="profile-photo-container">
              {isUploading ? (
                <div className="photo-uploading">
                  <div className="spinner"></div>
                  <span>Uploading...</span>
                </div>
              ) : user?.profilePhoto ? (
                <img 
                  src={`http://localhost:5000/uploads/${user.profilePhoto}?${new Date().getTime()}`} 
                  alt="Patient" 
                  className="profile-photo" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
              ) : (
                <div className="profile-photo-placeholder">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="edit-photo-wrapper">
                <label htmlFor="photo-upload" className="edit-photo-btn">
                  {isUploading ? (
                    <div className="uploading-spinner"></div>
                  ) : (
                    "+"
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handlePhotoUpload(file);
                    }
                  }}
                  disabled={isUploading}
                />
              </div>
            </div>
            <h1>{user?.name || "Patient"}</h1>
            <p className="patient-id">ID: {user?.id || "N/A"}</p>
            <div className="patient-status-tag">
              <span className={`status-indicator ${pregnancyInfo?.currentWeek > 20 ? "active" : ""}`}></span>
              {pregnancyInfo?.currentWeek || "N/A"} weeks
            </div>
          </div>

          <nav className="sidebar-nav">
            <ul>
              <li className={activeSection === "basic-info" ? "active" : ""} onClick={() => setActiveSection("basic-info")}>
                Personal Information
              </li>
              <li className={activeSection === "pregnancy" ? "active" : ""} onClick={() => setActiveSection("pregnancy")}>
                Pregnancy Info
              </li>
              <li className={activeSection === "contact" ? "active" : ""} onClick={() => setActiveSection("contact")}>
                Contact Details
              </li>
              <li className={activeSection === "medical" ? "active" : ""} onClick={() => setActiveSection("medical")}>
                Medical History
              </li>
              <li className={activeSection === "notes" ? "active" : ""} onClick={() => setActiveSection("notes")}>
                Patient Notes
              </li>
            </ul>
          </nav>
        </aside>

        <main className="profile-content">{renderSection()}</main>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, isEmergency = false }) => (
  <div className={`info-row ${isEmergency ? "emergency" : ""}`}>
    <span className="info-label">{label}:</span>
    <span className="info-value">{value}</span>
  </div>
);

export default PatientProfile;