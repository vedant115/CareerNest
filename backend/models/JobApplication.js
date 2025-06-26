import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      required: [true, "Please provide a company name"],
      trim: true,
      maxlength: [100, "Company name cannot be more than 100 characters"],
    },
    position: {
      type: String,
      required: [true, "Please provide a position title"],
      trim: true,
      maxlength: [100, "Position title cannot be more than 100 characters"],
    },
    status: {
      type: String,
      enum: [
        "saved",
        "applied",
        "screen",
        "interview",
        "offer",
        "rejected",
        "ghosted",
        "archived",
      ],
      default: "saved",
    },
    applicationDate: {
      type: Date,
      default: null,
    },
    jobUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please provide a valid URL"],
    },
    salary: {
      type: Number,
      min: [0, "Salary cannot be negative"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot be more than 100 characters"],
    },
    jobDescription: {
      type: String,
      maxlength: [5000, "Job description cannot be more than 5000 characters"],
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot be more than 1000 characters"],
    },
    contactPerson: {
      name: {
        type: String,
        trim: true,
        maxlength: [50, "Contact name cannot be more than 50 characters"],
      },
      email: {
        type: String,
        trim: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please provide a valid email",
        ],
      },
      phone: {
        type: String,
        trim: true,
        maxlength: [20, "Phone number cannot be more than 20 characters"],
      },
    },
    followUpDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to handle applicationDate based on status
JobApplicationSchema.pre("save", function (next) {
  // If status is being set to 'applied' and applicationDate is not set
  if (this.status === "applied" && !this.applicationDate) {
    this.applicationDate = new Date();
  }
  // If status is changing from non-applied to applied
  else if (
    this.isModified("status") &&
    this.status === "applied" &&
    !this.applicationDate
  ) {
    this.applicationDate = new Date();
  }
  next();
});

// Middleware for findOneAndUpdate operations
JobApplicationSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  // Check if status is being updated to 'applied'
  if (
    update.status === "applied" ||
    (update.$set && update.$set.status === "applied")
  ) {
    try {
      // Get the current document to check if applicationDate is already set
      const doc = await this.model.findOne(this.getQuery());
      if (doc && !doc.applicationDate) {
        // Set applicationDate to current time if not already set
        if (update.$set) {
          update.$set.applicationDate = new Date();
        } else {
          update.applicationDate = new Date();
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Index for better query performance
JobApplicationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("JobApplication", JobApplicationSchema);
