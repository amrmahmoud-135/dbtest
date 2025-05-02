const { generateToken } = require('../utils/authUtils');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const saltRounds = 10;

function calcAge(dob) {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) { 
        return null; 
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

const signup = async (req, res) => {
    try {
        console.log('Signup request body:', req.body);
        const { name, email, password, phone, dob, nationalId, address } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phone || !dob || !nationalId || !address) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format');
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format' 
            });
        }

        // Validate password strength
        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters long' 
            });
        }

        const profilePhoto = req.file ? req.file.filename : null;
        const parsedDob = new Date(dob);

        if (isNaN(parsedDob.getTime())) {
            console.log('Invalid date format');
            return res.status(400).json({ 
                success: false,
                message: 'Invalid date format for dob. Please provide a valid date in YYYY-MM-DD format.' 
            });
        }

        const age = calcAge(parsedDob);
        if (age === null) {
            console.log('Invalid date of birth');
            return res.status(400).json({ 
                success: false,
                message: 'Invalid date of birth.' 
            });
        }

        // Check if user already exists
        const existingPatient = await prisma.Patient.findUnique({ where: { email } });
        const existingDoctor = await prisma.Doctor.findUnique({ where: { email } });
        const existingAdmin = await prisma.Admin.findUnique({ where: { email } });

        if (existingPatient || existingDoctor || existingAdmin) {
            console.log('User already exists');
            const existingUser = existingPatient || existingDoctor || existingAdmin;
            return res.status(400).json({ 
                success: false,
                message: `User with email ${email} already exists. Please try logging in instead.`,
                existingUser: {
                    id: existingUser.id,
                    name: existingUser.name,
                    email: existingUser.email,
                    role: existingPatient ? 'patient' : (existingDoctor ? 'doctor' : 'admin')
                }
            });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        let user;
        let role = '';

        try {
            if (email.endsWith('@doctor.com')) {
                user = await prisma.Doctor.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                        phone,
                        dob: parsedDob,
                        nationalId,
                        profilePhoto,
                        specialization: req.body.specialization || 'General',
                        experience: parseInt(req.body.experience) || 0
                    },
                });
                role = 'doctor';
            } else if (email.endsWith('@admin.com')) {
                user = await prisma.Admin.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                    },
                });
                role = 'admin';
            } else {
                user = await prisma.Patient.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                        phone,
                        dob: parsedDob,
                        nationalId,
                        profilePhoto,
                        address,
                    },
                });
                role = 'patient';
            }

            const token = generateToken(user.id, role);
            const { password: _, ...userWithoutPassword } = user;

            console.log('Signup successful');
            console.log('Generated token:', token);
            console.log('User role:', role);
            
            return res.status(201).json({
                success: true,
                message: `${role.charAt(0).toUpperCase() + role.slice(1)} signed up successfully!`,
                token,
                role,
                user: userWithoutPassword
            });
        } catch (dbError) {
            console.error('Database error during signup:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create user in database',
                error: process.env.NODE_ENV === 'development' ? dbError.message : 'Internal server error'
            });
        }

    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to signup',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = { signup };
