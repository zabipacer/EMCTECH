// src/pages/ApprovalPending.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaClock, FaEnvelope, FaSignOutAlt, FaCheckCircle } from "react-icons/fa";

export default function ApprovalPending() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) {
      navigate("/login");
      return;
    }

    // Listen for real-time updates on user approval status
    const userDocRef = doc(db, "Users", userProfile.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        
        // If user gets approved, redirect to user dashboard
        if (data.approved) {
          // Update session storage
          try {
            sessionStorage.setItem("user", JSON.stringify({
              ...userProfile,
              approved: true
            }));
          } catch (error) {
            console.warn("Could not update session storage:", error);
          }
          
          // Redirect to user dashboard
          setTimeout(() => {
            navigate("/user-dashboard", { replace: true });
          }, 2000);
        }
      }
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [userProfile, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      sessionStorage.clear();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your approval status...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FaClock className="text-2xl" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Approval Pending</h1>
          <p className="text-blue-100 opacity-90">
            Your account is awaiting administrator approval
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Welcome, {userProfile?.firstName} {userProfile?.lastName}
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              {userProfile?.email}
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
              <FaClock className="mr-2" />
              Pending Approval
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaEnvelope className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  What happens next?
                </h3>
                <p className="text-blue-700 text-sm">
                  Your account has been submitted for review. You'll receive an email notification once your account is approved. This process typically takes 24-48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Status */}
          {userData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status:</span>
                <span className={`text-sm font-medium ${
                  userData.approved ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {userData.approved ? 'Approved' : 'Pending'}
                </span>
              </div>
              {userData.approved && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center mt-2 text-green-600"
                >
                  <FaCheckCircle className="mr-2" />
                  <span className="text-sm font-medium">Redirecting to dashboard...</span>
                </motion.div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-gray-600 text-sm mb-6">
            <p>
              You can safely close this page and return later. We'll automatically redirect you once approved.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Check Status
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-3 px-4 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200"
            >
              <FaSignOutAlt />
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-center text-gray-500 text-xs">
            Need help? Contact support at support@company.com
          </p>
        </div>
      </motion.div>
    </div>
  );
}