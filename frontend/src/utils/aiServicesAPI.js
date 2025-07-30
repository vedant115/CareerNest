import axios from "axios";

const AI_API_BASE_URL =
  import.meta.env.VITE_AI_API_URL || "http://localhost:10001/api";

// Create axios instance for AI services
const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Resume Analyzer API calls
export const analyzeResume = async (
  resumeFile,
  jobDescription,
  analysisType = "general"
) => {
  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("analysisType", analysisType);

    const response = await aiApi.post("/analyze-resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Resume analysis error:", error);
    throw error;
  }
};

// Generate interview questions for AI Prep
export const generateInterviewQuestions = async (prepData) => {
  try {
    const response = await aiApi.post(
      "/generate-interview-questions",
      prepData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Interview questions generation error:", error);
    throw error;
  }
};

// Company research using RAG
export const researchCompany = async (researchData) => {
  try {
    const response = await aiApi.post("/research-company", researchData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Company research error:", error);
    throw error;
  }
};

// Health check for AI Services API
export const checkAIServicesHealth = async () => {
  try {
    const response = await aiApi.get("/health");
    return response.data;
  } catch (error) {
    console.error("AI Services health check failed:", error);
    throw error;
  }
};

export default aiApi;
