import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                CareerNest
              </span>
            </Link>

            {isAuthenticated && (
              <div className="ml-10 flex space-x-4">
                <Link
                  to="/job-tracker"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-m font-medium"
                >
                  Job Tracker
                </Link>
                <Link
                  to="/resume-analyzer"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-m font-medium"
                >
                  AI Resume Analyzer
                </Link>
                <Link
                  to="/company-research"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-m font-medium"
                >
                  AI Company Research
                </Link>
                <Link
                  to="/ai-prep"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-m font-medium"
                >
                  AI Prep
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Welcome, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
