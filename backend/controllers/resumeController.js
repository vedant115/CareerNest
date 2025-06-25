const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const User = require('../models/User');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Create unique filename with user ID and timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `resumes/${req.user.id}/${uniqueSuffix}-${file.originalname}`);
    }
  }),
  fileFilter: function (req, file, cb) {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @desc    Upload resume to S3 and update user profile
// @route   POST /api/resume/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    // Use multer middleware
    upload.single('resume')(req, res, async function (err) {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading file'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      try {
        // Update user's resume URL in database
        const user = await User.findByIdAndUpdate(
          req.user.id,
          { resumeUrl: req.file.location },
          { new: true, select: '-password' }
        );

        res.status(200).json({
          success: true,
          message: 'Resume uploaded successfully',
          data: {
            resumeUrl: req.file.location,
            user: user
          }
        });
      } catch (dbError) {
        console.error('Database update error:', dbError);
        res.status(500).json({
          success: false,
          message: 'Error updating user profile'
        });
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resume upload'
    });
  }
};

// @desc    Get user's resume URL
// @route   GET /api/resume
// @access  Private
const getResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('resumeUrl');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        resumeUrl: user.resumeUrl
      }
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resume'
    });
  }
};

// @desc    Delete user's resume from S3 and database
// @route   DELETE /api/resume
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume found to delete'
      });
    }

    // Extract S3 key from URL
    const url = new URL(user.resumeUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    // Delete from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
      }).promise();
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // Continue with database update even if S3 deletion fails
    }

    // Update user's resume URL in database
    await User.findByIdAndUpdate(
      req.user.id,
      { resumeUrl: null }
    );

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting resume'
    });
  }
};

module.exports = {
  uploadResume,
  getResume,
  deleteResume
};
