import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signOut, 
  fetchSignInMethodsForEmail 
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { setDoc, doc, collection, getDocs, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

// Constants for better maintainability
const CONSTANTS = {
  ROLES: {
    OWNER: "owner",
    USER: "user"
  },
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 6,
    MAX_OWNER_ACCOUNTS: 3
  },
  ROUTES: {
    HOME: "/",
    LOGIN: "/login"
  }
};

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if email already exists using Firebase Auth (NO Firestore permissions needed)
  const checkEmailExists = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email.toLowerCase());
      return methods && methods.length > 0;
    } catch (error) {
      console.error("Error checking email via Auth:", error);
      // If we can't check, assume it doesn't exist and let createUserWithEmailAndPassword handle it
      return false;
    }
  };

  // Determine user role based on existing user count
  const determineUserRole = (userCount) => {
    const isOwner = userCount < CONSTANTS.VALIDATION.MAX_OWNER_ACCOUNTS;
    return {
      role: isOwner ? CONSTANTS.ROLES.OWNER : CONSTANTS.ROLES.USER,
      approved: isOwner
    };
  };

  // Create user document in Firestore
  const createUserDocument = async (user, userCount) => {
    const { role, approved } = determineUserRole(userCount);
    
    const userData = {
      uid: user.uid,
      email: user.email.toLowerCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      photo: "",
      role,
      approved,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, "Users", user.uid), userData);
    return { role, approved };
  };

  // Handle registration process
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form", { position: "bottom-center" });
      return;
    }

    try {
      setLoading(true);

      // Check if email already exists using Auth (NO Firestore query)
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast.error("This email is already registered", { position: "bottom-center" });
        return;
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      if (!user?.uid) {
        throw new Error("User creation succeeded but user object is invalid");
      }

      // Count existing users - use defensive approach for Firestore permissions
      let userCount = 0;
      try {
        const usersSnapshot = await getDocs(collection(db, "Users"));
        userCount = usersSnapshot.size;
      } catch (error) {
        console.warn("Could not count users (Firestore permission issue), defaulting to user role:", error);
        // If we can't count, assume it's not one of the first 3 users
        userCount = CONSTANTS.VALIDATION.MAX_OWNER_ACCOUNTS; // Force user role
      }

      // Create user document with determined role
      const { role } = await createUserDocument(user, userCount);

      // Handle post-registration flow
      if (role !== CONSTANTS.ROLES.OWNER) {
        await signOut(auth);
      }

      // Success message and navigation
      const successMessage = role === CONSTANTS.ROLES.OWNER
        ? "Registration successful! You've been granted owner access."
        : "Registration successful! Waiting for admin approval before you can log in.";

      toast.success(successMessage, { 
        position: "top-center", 
        autoClose: 4000 
      });

      setTimeout(() => {
        navigate(role === CONSTANTS.ROLES.OWNER ? CONSTANTS.ROUTES.HOME : CONSTANTS.ROUTES.LOGIN);
      }, 1200);

    } catch (error) {
      console.error("Registration Error:", error);
      handleRegistrationError(error);
    } finally {
      setLoading(false);
    }
  };

  // Error handling
  const handleRegistrationError = (error) => {
    const errorMap = {
      "auth/email-already-in-use": "This email is already registered",
      "auth/invalid-email": "Invalid email address",
      "auth/weak-password": "Password is too weak. Use at least 6 characters",
      "auth/operation-not-allowed": "Email/password accounts are not enabled",
      "auth/network-request-failed": "Network error. Please check your connection",
      "permission-denied": "Database permission denied. Please contact support"
    };

    const message = errorMap[error?.code] || 
                   error?.message || 
                   "Registration failed. Please try again.";

    toast.error(message, { position: "bottom-center", autoClose: 5000 });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-gray-700/[0.04] bg-[size:60px_60px]"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-300">Join us and start managing your business</p>
        </div>

        {/* Registration Form */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 p-8 transform hover:shadow-2xl transition-all duration-300">
          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-200">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 transition-colors ${
                    errors.firstName ? "border-red-500" : "border-gray-600 focus:border-blue-500"
                  }`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-200">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 transition-colors ${
                    errors.lastName ? "border-red-500" : "border-gray-600 focus:border-blue-500"
                  }`}
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-200">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`w-full px-4 py-3.5 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 transition-colors ${
                  errors.email ? "border-red-500" : "border-gray-600 focus:border-blue-500"
                }`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-200">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`w-full px-4 py-3.5 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 transition-colors ${
                  errors.password ? "border-red-500" : "border-gray-600 focus:border-blue-500"
                }`}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.password ? (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters long</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-sm text-gray-300">
                  Your account will need admin approval before you can log in. 
                  The first {CONSTANTS.VALIDATION.MAX_OWNER_ACCOUNTS} accounts receive owner privileges automatically.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-transform duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800 text-gray-400">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
              >
                Sign in instead
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">Secure registration powered by Firebase</p>
        </div>
      </div>
    </div>
  );
}

export default Register;