const express = require("express");
const userController = require("../controllers/userController");
const { authenticateUser } = require("../utils/authMiddleware");
const upload = require("../utils/uploadMiddleware");
const router = express.Router();

router.get("/user/details", authenticateUser, userController.getUserDetails);

router.put(
  "/user/update",
  authenticateUser,
  upload.single("profilePhoto"),
  userController.updateUserProfile
);

module.exports = router;
