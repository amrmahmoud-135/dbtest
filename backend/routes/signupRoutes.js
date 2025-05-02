const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const signupController = require('../controllers/signupController');
const { authenticateUser } = require('../utils/authMiddleware');

const prisma = new PrismaClient();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = uniqueSuffix + ext;
    
    // Check if file exists and generate new name if it does
    const filePath = path.join('uploads', filename);
    if (fs.existsSync(filePath)) {
      // If file exists, generate a new name
      const newSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, newSuffix + ext);
    } else {
      cb(null, filename);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

// Signup route with file upload
router.post('/', upload.single('profilePhoto'), signupController.signup);

// Update profile photo route
router.put('/user/update-photo', authenticateUser, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from the authenticated request
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const filename = req.file.filename;

    // Get the old profile photo filename
    const user = await prisma.patient.findUnique({
      where: { id: userId },
      select: { profilePhoto: true }
    });

    // Update user's profile photo in database
    const updatedUser = await prisma.patient.update({
      where: { id: userId },
      data: { profilePhoto: filename }
    });

    // Delete old profile photo if it exists
    if (user?.profilePhoto) {
      const oldPhotoPath = path.join('uploads', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Error deleting old profile photo:', err);
        });
      }
    }

    res.json({ 
      message: 'Profile photo updated successfully',
      profilePhoto: filename
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    // Delete uploaded file if database update fails
    if (req.file) {
      fs.unlink(path.join('uploads', req.file.filename), (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ error: 'Error updating profile photo' });
  }
});

module.exports = router;
