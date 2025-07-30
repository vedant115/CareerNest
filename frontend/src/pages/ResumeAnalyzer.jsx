import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "../components/Navbar";
import { resumeAPI } from "../utils/api";
import { analyzeResume, checkAIServicesHealth } from "../utils/aiServicesAPI";

const ResumeAnalyzer = () => {
  const [searchParams] = useSearchParams();
  const prefilledJobDescription = searchParams.get("jobDescription");

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [jobDescription, setJobDescription] = useState(
    prefilledJobDescription || ""
  );
  const [analysisType, setAnalysisType] = useState("general");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [apiHealthy, setApiHealthy] = useState(false);

  useEffect(() => {
    fetchUserResume();
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    try {
      await checkAIServicesHealth();
      setApiHealthy(true);
    } catch (error) {
      setApiHealthy(false);
      console.error("AI Services API is not available:", error);
    }
  };

  const fetchUserResume = async () => {
    try {
      const response = await resumeAPI.getResume();
      if (response.data.data.resumeUrl) {
        setResumeUrl(response.data.data.resumeUrl);
      }
    } catch (error) {
      console.error("Error fetching resume:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await resumeAPI.uploadResume(formData);
      setResumeUrl(response.data.data.resumeUrl);
      setResumeFile(file);
      setError("");
    } catch (error) {
      console.error("Error uploading resume:", error);
      setError(error.response?.data?.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile && !resumeUrl) {
      setError("Please upload a resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    if (!apiHealthy) {
      setError("AI Services API is not available.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      let fileToAnalyze = resumeFile;

      // If no file is selected but URL exists, we need to fetch the file
      if (!fileToAnalyze && resumeUrl) {
        console.log("Fetching resume from URL:", resumeUrl);
        const response = await fetch(resumeUrl);
        const blob = await response.blob();
        fileToAnalyze = new File([blob], "resume.pdf", {
          type: "application/pdf",
        });
      }

      const result = await analyzeResume(
        fileToAnalyze,
        jobDescription,
        analysisType
      );
      setAnalysis(result.analysis);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      setError(error.response?.data?.error || "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (window.confirm("Are you sure you want to delete your resume?")) {
      try {
        await resumeAPI.deleteResume();
        setResumeUrl(null);
        setResumeFile(null);
        setAnalysis("");
      } catch (error) {
        console.error("Error deleting resume:", error);
        setError("Failed to delete resume");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Resume Analyzer
          </h1>
          <p className="mt-2 text-gray-600">
            Upload your resume and analyze it against job descriptions using AI
          </p>
          {!apiHealthy && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
              ⚠️ AI Services API is not available. Please make sure it's running
              on localhost:3000
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Resume Upload */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Resume
              </h2>

              {resumeUrl ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Resume uploaded
                        </p>
                        <p className="text-xs text-green-600">
                          PDF file ready for analysis
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </a>
                        <button
                          onClick={handleDeleteResume}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload New Resume
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">
                        Upload your resume to get started
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500">
                    PDF files only, max 10MB
                  </p>
                </div>
              )}

              {uploading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Job Description and Analysis */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Job Description & Analysis
              </h2>

              <div className="space-y-6">
                {/* Job Description Input */}
                <div>
                  <label
                    htmlFor="jobDescription"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Job Description
                  </label>
                  <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Analysis Type */}
                <div>
                  <label
                    htmlFor="analysisType"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Analysis Type
                  </label>
                  <select
                    id="analysisType"
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">General Analysis</option>
                    <option value="skills">Skills Assessment</option>
                    <option value="keywords">Keywords Analysis</option>
                    <option value="percentage">Match Percentage</option>
                  </select>
                </div>

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !apiHealthy}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </div>
                  ) : (
                    "Analyze Resume"
                  )}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Analysis Results
                    </h3>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Custom styling for markdown elements
                            h1: ({ children }) => (
                              <h1 className="text-xl font-bold text-gray-900 mb-3">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-md font-medium text-gray-800 mb-2">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2 text-gray-700">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-2 text-gray-700">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-2 text-gray-700">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-gray-900">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-gray-800">
                                {children}
                              </em>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm font-mono">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {analysis}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
