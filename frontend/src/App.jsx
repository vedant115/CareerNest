import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import JobTracker from "./pages/JobTracker";
import AddApplication from "./pages/AddApplication";
import JobApplicationDetails from "./pages/JobApplicationDetails";
import StatusPage from "./pages/StatusPage";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import AIPrep from "./pages/AIPrep";
import CompanyResearch from "./pages/CompanyResearch";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage />
          )
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-tracker"
        element={
          <ProtectedRoute>
            <JobTracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-analyzer"
        element={
          <ProtectedRoute>
            <ResumeAnalyzer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-prep"
        element={
          <ProtectedRoute>
            <AIPrep />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company-research"
        element={
          <ProtectedRoute>
            <CompanyResearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-application"
        element={
          <ProtectedRoute>
            <AddApplication />
          </ProtectedRoute>
        }
      />

      <Route
        path="/job/:id"
        element={
          <ProtectedRoute>
            <JobApplicationDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/status/:status"
        element={
          <ProtectedRoute>
            <StatusPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
