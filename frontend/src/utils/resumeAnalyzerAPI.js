import axios from 'axios';

const RESUME_ANALYZER_BASE_URL = 'http://localhost:5000/api';

// Create axios instance for Resume Analyzer API
const resumeAnalyzerAPI = axios.create({
  baseURL: RESUME_ANALYZER_BASE_URL,
  timeout: 30000, // 30 seconds timeout for analysis
});

// Resume Analyzer API calls
export const analyzeResume = async (resumeFile, jobDescription, analysisType = 'general') => {
  try {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);
    formData.append('analysisType', analysisType);

    const response = await resumeAnalyzerAPI.post('/analyze-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw error;
  }
};

// Health check for Resume Analyzer API
export const checkResumeAnalyzerHealth = async () => {
  try {
    const response = await resumeAnalyzerAPI.get('/health');
    return response.data;
  } catch (error) {
    console.error('Resume Analyzer health check failed:', error);
    throw error;
  }
};

export default resumeAnalyzerAPI;
