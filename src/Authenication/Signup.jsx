import React, { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email || !password || !fname || !lname) {
      toast.error("Please fill in all fields", { position: "bottom-center" });
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters", { position: "bottom-center" });
      return;
    }

    try {
      setLoading(true);

      // Count existing users to determine role
      const usersSnapshot = await getDocs(collection(db, "Users"));
      const userCount = usersSnapshot.size;

      // Create the Auth user
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;

      // Assign role: first 3 users are owners, rest are users
      const assignedRole = userCount < 1 ? "owner" : "user";
      const isApproved = userCount < 1; // Auto-approve owners

      // Write to Firestore
      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          photo: "",
          role: assignedRole,
          approved: isApproved,
          createdAt: new Date().toISOString(),
        });
      }

      // Sign them out immediately after registering (unless they're an owner)
      if (assignedRole !== "owner") {
        await signOut(auth);
      }

      const successMessage = assignedRole === "owner"
        ? "Registration successful! You've been granted owner access."
        : "Registration successful! Waiting for admin approval before you can log in.";

      toast.success(successMessage, { position: "top-center", autoClose: 5000 });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(assignedRole === "owner" ? "/" : "/login");
      }, 2000);

    } catch (error) {
      console.error("Registration Error:", error.message);
      let message = "Registration failed. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Use at least 6 characters.";
      }
      
      toast.error(message, { position: "bottom-center" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full opacity-50"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-500/10 rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-purple-500/10 rounded-full opacity-40"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-300">Join us and start managing your business</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fname" className="text-sm font-medium text-gray-200">
                  First Name
                </label>
                <input
                  id="fname"
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200 placeholder-gray-400 text-white"
                  placeholder="John"
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lname" className="text-sm font-medium text-gray-200">
                  Last Name
                </label>
                <input
                  id="lname"
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200 placeholder-gray-400 text-white"
                  placeholder="Doe"
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-200">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3.5 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200 placeholder-gray-400 text-white"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-200">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  className="w-full px-4 py-3.5 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-200 placeholder-gray-400 text-white"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters long</p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-sm text-gray-300">
                  Your account will need admin approval before you can log in.
                </p>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg className="inline-block w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </>
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
              <a 
                href="/login" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group"
              >
                Sign in instead
                <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </a>
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