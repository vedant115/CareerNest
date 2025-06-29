import axios from "axios";

const AI_SERVICES_BASE_URL = "http://localhost:3000/api";

// Create axios instance for AI Services API
const aiServicesAPI = axios.create({
  baseURL: AI_SERVICES_BASE_URL,
  timeout: 30000, // 30 seconds timeout for analysis
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

    const response = await aiServicesAPI.post("/analyze-resume", formData, {
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
    const response = await aiServicesAPI.post(
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

// Health check for AI Services API
export const checkAIServicesHealth = async () => {
  try {
    const response = await aiServicesAPI.get("/health");
    return response.data;
  } catch (error) {
    console.error("AI Services health check failed:", error);
    throw error;
  }
};

export default aiServicesAPI;
