// CareerNest Chrome Extension - Popup Script
const API_BASE_URL = "http://localhost:5000/api";

// DOM Elements
const elements = {
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  success: document.getElementById("success"),
  errorMessage: document.getElementById("error-message"),
  successMessage: document.getElementById("success-message"),
  loginForm: document.getElementById("login-form"),
  jobForm: document.getElementById("job-form"),
  userName: document.getElementById("user-name"),
  logoutBtn: document.getElementById("logout-btn"),
  autoFillBtn: document.getElementById("auto-fill-btn"),
  clearFormBtn: document.getElementById("clear-form"),
};

// State management
let currentUser = null;
let authToken = null;

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuthStatus();
  setupEventListeners();
});

// Check authentication status
async function checkAuthStatus() {
  showLoading(true);

  try {
    // Get stored auth data
    const result = await chrome.storage.local.get(["authToken", "user"]);

    if (result.authToken && result.user) {
      authToken = result.authToken;
      currentUser = result.user;

      // Verify token is still valid
      const isValid = await verifyToken();
      if (isValid) {
        showJobForm();
      } else {
        await clearAuth();
        showLoginForm();
      }
    } else {
      showLoginForm();
    }
  } catch (error) {
    console.error("Auth check error:", error);
    showLoginForm();
  }

  showLoading(false);
}

// Verify token with backend
async function verifyToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Login form
  document.getElementById("login").addEventListener("submit", handleLogin);

  // Job application form
  document
    .getElementById("job-application")
    .addEventListener("submit", handleJobSubmit);

  // Logout button
  elements.logoutBtn.addEventListener("click", handleLogout);

  // Auto-fill button
  elements.autoFillBtn.addEventListener("click", handleAutoFill);

  // Clear form button
  elements.clearFormBtn.addEventListener("click", clearJobForm);
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  showLoading(true);
  hideMessages();

  const formData = new FormData(e.target);
  const credentials = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  try {
    // First check if backend is reachable
    const healthCheck = await fetch(`${API_BASE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error("Backend server is not running");
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      currentUser = data.user;

      // Store auth data
      await chrome.storage.local.set({
        authToken: authToken,
        user: currentUser,
      });

      showJobForm();
      showSuccess("Login successful!");
    } else {
      showError(data.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("ERR_CONNECTION_REFUSED")
    ) {
      showError(
        "Cannot connect to CareerNest backend. Please ensure:\n1. Backend server is running on http://localhost:5000\n2. Run: cd backend && npm start"
      );
    } else {
      showError(error.message || "Network error occurred");
    }
  }

  showLoading(false);
}

// Handle logout
async function handleLogout() {
  showLoading(true);

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  await clearAuth();
  showLoginForm();
  showLoading(false);
}

// Clear authentication data
async function clearAuth() {
  authToken = null;
  currentUser = null;
  await chrome.storage.local.remove(["authToken", "user"]);
}

// Handle auto-fill
async function handleAutoFill() {
  showLoading(true);

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Send message to content script to extract job data
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "extractJobData",
    });

    if (response && response.success) {
      const jobData = response.data;

      // Fill form fields
      if (jobData.company)
        document.getElementById("company").value = jobData.company;
      if (jobData.position)
        document.getElementById("position").value = jobData.position;
      if (jobData.location)
        document.getElementById("location").value = jobData.location;
      if (jobData.salary)
        document.getElementById("salary").value = jobData.salary;
      if (jobData.jobDescription)
        document.getElementById("jobDescription").value =
          jobData.jobDescription;

      // Set job URL to current page
      document.getElementById("jobUrl").value = tab.url;

      showSuccess("Job details auto-filled successfully!");
    } else {
      showError(
        "Could not extract job details from this page. Please fill manually."
      );
    }
  } catch (error) {
    console.error("Auto-fill error:", error);
    showError("Auto-fill failed. Please fill the form manually.");
  }

  showLoading(false);
}

// Handle job application submission
async function handleJobSubmit(e) {
  e.preventDefault();
  showLoading(true);
  hideMessages();

  const formData = new FormData(e.target);
  const jobData = {
    company: formData.get("company"),
    position: formData.get("position"),
    location: formData.get("location") || undefined,
    salary: formData.get("salary")
      ? parseInt(formData.get("salary"))
      : undefined,
    jobUrl: formData.get("jobUrl") || undefined,
    status: formData.get("status"),
    jobDescription: formData.get("jobDescription") || undefined,
    notes: formData.get("notes") || undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jobData),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("Job application added successfully!");
      clearJobForm();
    } else {
      showError(data.message || "Failed to add job application");
    }
  } catch (error) {
    console.error("Job submission error:", error);
    showError("Network error. Please check if CareerNest backend is running.");
  }

  showLoading(false);
}

// UI Helper functions
function showLoading(show) {
  elements.loading.classList.toggle("hidden", !show);
}

function showLoginForm() {
  elements.loginForm.classList.remove("hidden");
  elements.jobForm.classList.add("hidden");
}

function showJobForm() {
  elements.loginForm.classList.add("hidden");
  elements.jobForm.classList.remove("hidden");
  elements.userName.textContent = currentUser?.name || "User";
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.error.classList.remove("hidden");
  setTimeout(() => elements.error.classList.add("hidden"), 5000);
}

function showSuccess(message) {
  elements.successMessage.textContent = message;
  elements.success.classList.remove("hidden");
  setTimeout(() => elements.success.classList.add("hidden"), 3000);
}

function hideMessages() {
  elements.error.classList.add("hidden");
  elements.success.classList.add("hidden");
}

function clearJobForm() {
  document.getElementById("job-application").reset();
}
