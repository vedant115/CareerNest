const express = require('express');
const {
  uploadResume,
  getResume,
  deleteResume
} = require('../controllers/resumeController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   POST /api/resume/upload
// @desc    Upload resume to S3
// @access  Private
router.post('/upload', uploadResume);

// @route   GET /api/resume
// @desc    Get user's resume URL
// @access  Private
router.get('/', getResume);

// @route   DELETE /api/resume
// @desc    Delete user's resume
// @access  Private
router.delete('/', deleteResume);

module.exports = router;
