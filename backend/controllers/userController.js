const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

function calcAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let user;
        if (role === 'admin') {
            user = await prisma.admin.findUnique({
                where: { id: userId }
            });
        } else if (role === 'doctor') {
            user = await prisma.doctor.findUnique({
                where: { id: userId }
            });
        } else if (role === 'patient') {
            user = await prisma.patient.findUnique({
                where: { id: userId }
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const age = user.dob ? calcAge(user.dob) : null;

        res.status(200).json({ 
            success: true, 
            data: { user, age } 
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user details' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { name, email, phone, dob, password, address } = req.body;
        const profilePhoto = req.file ? req.file.filename : null;

        const updateData = {
            name,
            email,
            phone,
            address,
            dob: dob ? new Date(dob) : undefined,
            profilePhoto: profilePhoto || undefined,
        };
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        let updatedUser;
        if (role === 'patient') {
            updatedUser = await prisma.patient.update({
                where: { id: userId },
                data: updateData,
            });
        } else if (role === 'doctor') {
            updatedUser = await prisma.doctor.update({
                where: { id: userId },
                data: updateData,
            });
        } else if (role === 'admin') {
            updatedUser = await prisma.admin.update({
                where: { id: userId },
                data: updateData,
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const age = updatedUser.dob ? calcAge(updatedUser.dob) : null;

        return res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully', 
            user: updatedUser, 
            age 
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile', 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
        });
    }
};

exports.updateMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    if (role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can update medical history' });
    }
    // Convert comma-separated strings to arrays if needed
    const toArray = (val) =>
      Array.isArray(val)
        ? val
        : typeof val === 'string'
        ? val.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

    const allergies = toArray(req.body.allergies);
    const surgeries = toArray(req.body.surgeries);
    const chronicConditions = toArray(req.body.chronicConditions);
    const medications = toArray(req.body.medications);

    // Find the latest medical history record for this patient
    let medicalHistory = await prisma.medicalHistory.findFirst({
      where: { patientId: userId },
      orderBy: { date: 'desc' }
    });

    if (medicalHistory) {
      // Update the latest record
      medicalHistory = await prisma.medicalHistory.update({
        where: { id: medicalHistory.id },
        data: {
          allergies,
          surgeries,
          chronicConditions,
          medications,
          date: new Date(),
        },
      });
    } else {
      // Create a new record if none exists
      medicalHistory = await prisma.medicalHistory.create({
        data: {
          allergies,
          surgeries,
          chronicConditions,
          medications,
          patientId: userId,
        },
      });
    }
    res.status(200).json({ success: true, medicalHistory });
  } catch (error) {
    console.error('Error updating medical history:', error);
    res.status(500).json({ success: false, message: error.message, full: error });
  }
};