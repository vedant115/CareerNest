import dotenv from "dotenv";
dotenv.config();

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import User from "../models/User.js";

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    // Only allow PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// @desc    Upload resume to S3 and update user profile
// @route   POST /api/resume/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    // Use multer middleware
    upload.single("resume")(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      try {
        // Create unique filename with user ID and timestamp
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const key = `resumes/${req.user.id}/${uniqueSuffix}-${req.file.originalname}`;

        // Upload to S3 using AWS SDK v3
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          Metadata: {
            userId: req.user.id,
            originalName: req.file.originalname,
          },
        };

        const parallelUploads3 = new Upload({
          client: s3Client,
          params: uploadParams,
        });

        const result = await parallelUploads3.done();

        // Store the S3 key instead of the full URL for better security
        // Update user's resume key in database
        const user = await User.findByIdAndUpdate(
          req.user.id,
          { resumeUrl: key }, // Store the S3 key
          { new: true, select: "-password" }
        );

        // Generate a signed URL for immediate access
        const getObjectCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
        });
        const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600,
        }); // 1 hour

        res.status(200).json({
          success: true,
          message: "Resume uploaded successfully",
          data: {
            resumeUrl: signedUrl,
            user: user,
          },
        });
      } catch (uploadError) {
        console.error("S3 upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Error uploading file to storage",
        });
      }
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during resume upload",
    });
  }
};

// @desc    Get user's resume URL
// @route   GET /api/resume
// @access  Private
const getResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("resumeUrl");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If user has a resume, generate a signed URL
    let signedUrl = null;
    if (user.resumeUrl) {
      try {
        const getObjectCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: user.resumeUrl, // This is now the S3 key
        });
        signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600,
        }); // 1 hour
      } catch (signError) {
        console.error("Error generating signed URL:", signError);
        // Continue without signed URL
      }
    }

    res.status(200).json({
      success: true,
      data: {
        resumeUrl: signedUrl,
      },
    });
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching resume",
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
        message: "No resume found to delete",
      });
    }

    // user.resumeUrl now contains the S3 key directly
    const key = user.resumeUrl;

    // Delete from S3
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(deleteCommand);
    } catch (s3Error) {
      console.error("S3 deletion error:", s3Error);
      // Continue with database update even if S3 deletion fails
    }

    // Update user's resume URL in database
    await User.findByIdAndUpdate(req.user.id, { resumeUrl: null });

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete resume error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting resume",
    });
  }
};

export { uploadResume, getResume, deleteResume };
