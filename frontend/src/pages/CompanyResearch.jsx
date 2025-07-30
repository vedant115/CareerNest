import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "../components/Navbar";
import { researchCompany, checkAIServicesHealth } from "../utils/aiServicesAPI";

const CompanyResearch = () => {
  const [searchParams] = useSearchParams();
  const prefilledCompany = searchParams.get("company");

  const [companyName, setCompanyName] = useState(prefilledCompany || "");
  const [question, setQuestion] = useState("");
  const [researchResult, setResearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiHealthy, setApiHealthy] = useState(false);

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

  const handleResearch = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setError("Please enter a company name");
      return;
    }

    setError("");
    setLoading(true);
    setResearchResult(null);

    try {
      const result = await researchCompany({
        company: companyName.trim(),
        question:
          question.trim() ||
          "Tell me about this company, its culture, recent news, and interview tips.",
      });

      if (result.success) {
        setResearchResult(result);
      } else {
        setError(result.error || "Failed to research company");
      }
    } catch (error) {
      console.error("Company research error:", error);
      setError(
        error.response?.data?.error ||
          "Failed to research company. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCompanyName("");
    setQuestion("");
    setResearchResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Company Research
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Research companies using AI-powered insights. Get information about
            company culture, recent news, and interview preparation tips.
          </p>
        </div>

        {/* API Health Status */}
        {!apiHealthy && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>
                AI Services are currently unavailable. Please try again later.
              </span>
            </div>
          </div>
        )}

        {/* Research Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleResearch} className="space-y-6">
            {/* Company Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name (e.g., Google, Microsoft, Apple)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Custom Question Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Question (Optional)
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a specific question about the company (e.g., 'What is their work culture like?' or 'What should I know for an interview?')"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank for general company overview, culture, news, and
                interview tips
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !apiHealthy}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? "Researching..." : "Research Company"}
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Research Results */}
        {researchResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Research Results for {researchResult.company}
              </h2>
              {researchResult.question && (
                <p className="text-gray-600 italic">
                  Question: {researchResult.question}
                </p>
              )}
            </div>

            {/* AI-Generated Answer */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Analysis & Insights
              </h3>
              <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {researchResult.answer}
                </ReactMarkdown>
              </div>
            </div>

            {/* Raw Information (Collapsible) */}
            <details className="border-t pt-6">
              <summary className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                View Raw Research Data
              </summary>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {researchResult.raw_info}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Researching {companyName}... This may take a few moments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyResearch;
