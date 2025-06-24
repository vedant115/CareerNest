const express = require("express");
const { register, login, logout } = require("../controllers/authController");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post("/logout", logout);

module.exports = router;
