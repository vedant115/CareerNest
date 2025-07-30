import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { jobsAPI } from "../utils/api";
import Navbar from "../components/Navbar";

const JobApplicationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "true";

  const [isEditing, setIsEditing] = useState(editMode);
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    location: "",
    jobUrl: "",
    salary: "",
    status: "saved",
    jobDescription: "",
    notes: "",
    contactPerson: {
      name: "",
      email: "",
      phone: "",
    },
    followUpDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await jobsAPI.getJob(id);
      const jobData = response.data.data;
      setJob(jobData);

      setFormData({
        company: jobData.company || "",
        position: jobData.position || "",
        location: jobData.location || "",
        jobUrl: jobData.jobUrl || "",
        salary: jobData.salary || "",
        status: jobData.status || "saved",
        jobDescription: jobData.jobDescription || "",
        notes: jobData.notes || "",
        contactPerson: {
          name: jobData.contactPerson?.name || "",
          email: jobData.contactPerson?.email || "",
          phone: jobData.contactPerson?.phone || "",
        },
        followUpDate: jobData.followUpDate
          ? jobData.followUpDate.split("T")[0]
          : "",
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      setError("Failed to load job application");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("contactPerson.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      const submitData = {
        ...formData,
        salary: formData.salary ? Number(formData.salary) : undefined,
        followUpDate: formData.followUpDate || undefined,
      };

      await jobsAPI.updateJob(id, submitData);
      await fetchJob(); // Refresh data
      setIsEditing(false);

      // Update URL to remove edit parameter
      navigate(`/job/${id}`, { replace: true });
    } catch (error) {
      console.error("Error saving job:", error);
      setError(
        error.response?.data?.message || "Failed to save job application"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original job data
    if (job) {
      setFormData({
        company: job.company || "",
        position: job.position || "",
        location: job.location || "",
        jobUrl: job.jobUrl || "",
        salary: job.salary || "",
        status: job.status || "saved",
        jobDescription: job.jobDescription || "",
        notes: job.notes || "",
        contactPerson: {
          name: job.contactPerson?.name || "",
          email: job.contactPerson?.email || "",
          phone: job.contactPerson?.phone || "",
        },
        followUpDate: job.followUpDate ? job.followUpDate.split("T")[0] : "",
      });
    }
    // Update URL to remove edit parameter
    navigate(`/job/${id}`, { replace: true });
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await jobsAPI.deleteJob(id);
        navigate("/job-tracker");
      } catch (error) {
        console.error("Error deleting job:", error);
        setError("Failed to delete job application");
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      saved: "bg-gray-100 text-gray-800",
      applied: "bg-blue-100 text-blue-800",
      screen: "bg-yellow-100 text-yellow-800",
      interview: "bg-purple-100 text-purple-800",
      offer: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      ghosted: "bg-gray-100 text-gray-600",
      archived: "bg-gray-100 text-gray-500",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Job Application Not Found
            </h1>
            <button
              onClick={() => navigate("/job-tracker")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Job Tracker
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/job-tracker")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Job Tracker
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {job.position} at {job.company}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
                {job.location && (
                  <span className="text-gray-600">📍 {job.location}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => {
                    const jobDesc = job.jobDescription || "";
                    navigate(
                      `/resume-analyzer?jobDescription=${encodeURIComponent(
                        jobDesc
                      )}`
                    );
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Analyze Resume
                </button>
                <button
                  onClick={() => {
                    const companyName = job.company || "";
                    navigate(
                      `/company-research?company=${encodeURIComponent(
                        companyName
                      )}`
                    );
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Research Company
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{job.company}</p>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">{job.position}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">
                  {job.location || "Not specified"}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="screen">Screen</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="ghosted">Ghosted</option>
                  <option value="archived">Archived</option>
                </select>
              ) : (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              )}
            </div>

            {/* Job URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job URL
              </label>
              {isEditing ? (
                <input
                  type="url"
                  name="jobUrl"
                  value={formData.jobUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">
                  {job.jobUrl ? (
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {job.jobUrl}
                    </a>
                  ) : (
                    "Not specified"
                  )}
                </p>
              )}
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">
                  {job.salary
                    ? `$${job.salary.toLocaleString()}`
                    : "Not specified"}
                </p>
              )}
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 py-2">
                  {job.followUpDate
                    ? new Date(job.followUpDate).toLocaleDateString()
                    : "Not set"}
                </p>
              )}
            </div>

            {/* Application Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Date
              </label>
              <p className="text-gray-900 py-2">
                {job.applicationDate
                  ? new Date(job.applicationDate).toLocaleDateString()
                  : "Not applied yet"}
              </p>
            </div>

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created Date
              </label>
              <p className="text-gray-900 py-2">
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Job Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              {isEditing ? (
                <textarea
                  name="jobDescription"
                  rows={6}
                  value={formData.jobDescription}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-gray-900 py-2 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                  {job.jobDescription || "No description provided"}
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Contact Person
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactPerson.name"
                      value={formData.contactPerson.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">
                      {job.contactPerson?.name || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="contactPerson.email"
                      value={formData.contactPerson.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">
                      {job.contactPerson?.email ? (
                        <a
                          href={`mailto:${job.contactPerson.email}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {job.contactPerson.email}
                        </a>
                      ) : (
                        "Not specified"
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="contactPerson.phone"
                      value={formData.contactPerson.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">
                      {job.contactPerson?.phone ? (
                        <a
                          href={`tel:${job.contactPerson.phone}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {job.contactPerson.phone}
                        </a>
                      ) : (
                        "Not specified"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              {isEditing ? (
                <textarea
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-gray-900 py-2 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                  {job.notes || "No notes added"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationDetails;
