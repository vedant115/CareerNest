import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  generateInterviewQuestions,
  checkAIServicesHealth,
} from "../utils/aiServicesAPI";

const AIPrep = () => {
  const [formData, setFormData] = useState({
    targetRole: "",
    yearsExperience: "",
    topics: "",
    description: "",
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiHealthy, setApiHealthy] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setQuestions([]);
    setError("");
  };

  const handleClear = () => {
    setFormData({
      targetRole: "",
      yearsExperience: "",
      topics: "",
      description: "",
    });
    setQuestions([]);
    setError("");
    setIsEditing(true);
  };

  const handleGenerate = async () => {
    if (!formData.targetRole.trim()) {
      setError("Please enter a target role.");
      return;
    }

    if (!formData.yearsExperience.trim()) {
      setError("Please enter years of experience.");
      return;
    }

    if (!apiHealthy) {
      setError(
        "AI Services API is not available. Please make sure it's running on localhost:3000"
      );
      return;
    }

    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      const result = await generateInterviewQuestions(formData);
      setQuestions(result.questions);
      setIsEditing(false);
    } catch (error) {
      console.error("Error generating questions:", error);
      setError(
        error.response?.data?.error || "Failed to generate interview questions"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Interview Prep AI
          </h1>
          <p className="mt-2 text-gray-600">
            Generate personalized interview questions and preparation tips using
            AI
          </p>
          {!apiHealthy && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
              ⚠️ AI Services API is not available. Please make sure it's running
              on localhost:3000
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Preparation Details
            </h2>
            <div className="space-x-2">
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleClear}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Role *
              </label>
              <input
                type="text"
                name="targetRole"
                value={formData.targetRole}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="e.g., DevOps Engineer, Software Developer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience *
              </label>
              <input
                type="text"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="e.g., 5 Years, Entry Level, 2-3 Years"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topics to Focus On
              </label>
              <input
                type="text"
                name="topics"
                value={formData.topics}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="e.g., CI/CD, Docker, Kubernetes, AWS"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                placeholder="Additional context about the role or specific areas you want to focus on..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !apiHealthy}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Generating..." : "Generate Questions"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Interview Q&A Section */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Interview Q & A
            </h2>
            <div className="space-y-4">
              {questions.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">
                      Q{index + 1}: {item.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${
                        expandedQuestion === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedQuestion === index && (
                    <div className="px-4 py-3 bg-white border-t border-gray-200">
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {item.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPrep;
