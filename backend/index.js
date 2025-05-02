const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cors = require("cors");
const config = require("./config");

const adminRoutes = require("./routes/adminRoutes");
const loginRoutes = require("./routes/loginRoute");
const signupRoutes = require("./routes/signupRoutes");
const userRoutes = require("./routes/userRoutes");
const patientNoteRoutes = require("./routes/patientNoteRoutes");

if (!config.DATABASE_URL) {
  console.error("DATABASE_URL is missing in .env file");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use("/api/admin", adminRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/signup", signupRoutes);
app.use("/api", userRoutes);
app.use("/api/patients", patientNoteRoutes);

app.listen(process.env.PORT || 5000, async () => {
  try {
    await prisma.$connect();
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message || "Internal Server Error",
  });
});
