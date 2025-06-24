const express = require('express');
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob
} = require('../controllers/jobsController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   POST /api/jobs
// @desc    Create a new job application
// @access  Private
router.post('/', createJob);

// @route   GET /api/jobs
// @desc    Get all job applications for authenticated user
// @access  Private
router.get('/', getJobs);

// @route   GET /api/jobs/:id
// @desc    Get single job application by ID
// @access  Private
router.get('/:id', getJob);

// @route   PUT /api/jobs/:id
// @desc    Update job application
// @access  Private
router.put('/:id', updateJob);

// @route   DELETE /api/jobs/:id
// @desc    Delete job application
// @access  Private
router.delete('/:id', deleteJob);

module.exports = router;
