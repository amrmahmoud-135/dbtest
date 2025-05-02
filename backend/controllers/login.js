const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development';

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide both email and password" });
  }
  try {
    let user;
    let role = "";
    if (email.includes("@admin.com")) {
      role = "admin";
    } else if (email.includes("@doctor.com")) {
      role = "doctor";
    } else {
      role = "patient";
    }
    if (role === "admin") {
      user = await prisma.Admin.findUnique({ where: { email } });
    } else if (role === "doctor") {
      user = await prisma.Doctor.findUnique({ where: { email } });
    } else {
      user = await prisma.Patient.findUnique({ where: { email } });
    }

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    console.log('Login successful');
    console.log('Generated token:', token);
    console.log('User role:', role);

    res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token,
      role,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to login",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = { login };
