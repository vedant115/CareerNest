import JobApplication from "../models/JobApplication.js";

// @desc    Create new job application
// @route   POST /api/jobs
// @access  Private
const createJob = async (req, res) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    const jobApplication = await JobApplication.create(req.body);

    res.status(201).json({
      success: true,
      message: "Job application created successfully",
      data: jobApplication,
    });
  } catch (error) {
    console.error("Create job error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating job application",
    });
  }
};

// @desc    Get all job applications for user
// @route   GET /api/jobs
// @access  Private
const getJobs = async (req, res) => {
  try {
    const jobApplications = await JobApplication.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    res.status(200).json({
      success: true,
      count: jobApplications.length,
      data: jobApplications,
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job applications",
    });
  }
};

// @desc    Get single job application
// @route   GET /api/jobs/:id
// @access  Private
const getJob = async (req, res) => {
  try {
    const jobApplication = await JobApplication.findById(
      req.params.id
    ).populate("user", "name email");

    if (!jobApplication) {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    // Make sure user owns job application
    if (jobApplication.user._id.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this job application",
      });
    }

    res.status(200).json({
      success: true,
      data: jobApplication,
    });
  } catch (error) {
    console.error("Get job error:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching job application",
    });
  }
};

// @desc    Update job application
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = async (req, res) => {
  try {
    let jobApplication = await JobApplication.findById(req.params.id);

    if (!jobApplication) {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    // Make sure user owns job application
    if (jobApplication.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this job application",
      });
    }

    jobApplication = await JobApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Job application updated successfully",
      data: jobApplication,
    });
  } catch (error) {
    console.error("Update job error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating job application",
    });
  }
};

// @desc    Delete job application
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = async (req, res) => {
  try {
    const jobApplication = await JobApplication.findById(req.params.id);

    if (!jobApplication) {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    // Make sure user owns job application
    if (jobApplication.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this job application",
      });
    }

    await JobApplication.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Job application deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting job application",
    });
  }
};

export { createJob, getJobs, getJob, updateJob, deleteJob };
