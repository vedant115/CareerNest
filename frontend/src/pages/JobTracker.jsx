import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jobsAPI } from "../utils/api";
import Navbar from "../components/Navbar";

const JobTracker = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    // Filter jobs based on search term
    if (searchTerm.trim() === "") {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(
        (job) =>
          job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (job.location &&
            job.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredJobs(filtered);
    }
  }, [jobs, searchTerm]);

  const fetchJobs = async () => {
    try {
      const response = await jobsAPI.getJobs();
      setJobs(response.data.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      await jobsAPI.updateJob(jobId, { status: newStatus });
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const handleDelete = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await jobsAPI.deleteJob(jobId);
        fetchJobs(); // Refresh the list
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  const getJobsByStatus = (status) => {
    return filteredJobs.filter((job) => job.status === status);
  };

  const copyJobUrl = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      // You could add a toast notification here
    }
  };

  const JobCard = ({ job }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* First Part: Company and Role */}
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/job/${job._id}`)}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 hover:text-blue-600 text-sm">
              {job.position}
            </h3>
            <p className="text-xs text-gray-600">{job.company}</p>
          </div>
        </div>

        {/* Second Part: Location, Applied Date, and Job URL */}
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/job/${job._id}`)}
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            {job.location && (
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {job.location}
              </div>
            )}

            {job.applicationDate && (
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Applied: {new Date(job.applicationDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Third Part: Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Status Dropdown */}
          <select
            value={job.status}
            onChange={(e) => handleStatusUpdate(job._id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
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

          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            {/* Link Icon */}
            {job.jobUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyJobUrl(job.jobUrl);
                }}
                className="text-gray-500 hover:text-blue-600 p-1"
                title="Copy job URL"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </button>
            )}

            {/* Edit Icon */}
            <Link
              to={`/job/${job._id}?edit=true`}
              className="text-gray-500 hover:text-blue-600 p-1"
              onClick={(e) => e.stopPropagation()}
              title="Edit application"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Link>

            {/* Delete Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(job._id);
              }}
              className="text-gray-500 hover:text-red-600 p-1"
              title="Delete application"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const StatusColumn = ({ title, status, count, jobs }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 uppercase text-sm">
          {title} ({count})
        </h3>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job._id} job={job} />
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No applications in this status</p>
          </div>
        )}
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Job Tracker
            </h1>
            <p className="text-gray-600 mt-1">
              {searchTerm
                ? `${filteredJobs.length} of ${jobs.length}`
                : `${jobs.length} TOTAL`}{" "}
              JOBS
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search for roles or companies"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Link
              to="/add-application"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              + Add Application
            </Link>
          </div>
        </div>

        {/* Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatusColumn
            title="SAVED"
            status="saved"
            count={getJobsByStatus("saved").length}
            jobs={getJobsByStatus("saved")}
          />

          <StatusColumn
            title="APPLIED"
            status="applied"
            count={getJobsByStatus("applied").length}
            jobs={getJobsByStatus("applied")}
          />

          <StatusColumn
            title="SCREEN"
            status="screen"
            count={getJobsByStatus("screen").length}
            jobs={getJobsByStatus("screen")}
          />

          <StatusColumn
            title="INTERVIEWING"
            status="interview"
            count={getJobsByStatus("interview").length}
            jobs={getJobsByStatus("interview")}
          />

          <StatusColumn
            title="OFFER"
            status="offer"
            count={getJobsByStatus("offer").length}
            jobs={getJobsByStatus("offer")}
          />
        </div>
      </div>
    </div>
  );
};

export default JobTracker;
