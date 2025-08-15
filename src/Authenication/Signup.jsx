// src/Authenication/Signup.js
import React, { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { setDoc, doc } from "firebase/firestore";
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

    try {
      setLoading(true);

      // create the Auth user
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;

      // write to Firestore: role=user, approved=false
      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          photo: "",
          role: "user",
          approved: false,
        });
      }

      // Sign them out immediately after registering
      await signOut(auth);

      toast.success(
        "Registered! Waiting for owner approval before you can log in.",
        { position: "top-center" }
      );

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Registration Error:", error.message);
      const message = error.message.includes("email-already-in-use")
        ? "Email already in use."
        : error.message;
      toast.error(message, { position: "bottom-center" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg mt-12"
    >
      <h3 className="text-2xl font-semibold text-center mb-6">Sign Up</h3>

      <div className="mb-4">
        <label htmlFor="fname" className="block text-sm font-medium text-gray-700">
          First Name
        </label>
        <input
          id="fname"
          type="text"
          className="w-full px-4 py-2 mt-2 border rounded focus:ring-2 focus:ring-blue-400"
          placeholder="First name"
          onChange={(e) => setFname(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="lname" className="block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <input
          id="lname"
          type="text"
          className="w-full px-4 py-2 mt-2 border rounded focus:ring-2 focus:ring-blue-400"
          placeholder="Last name"
          onChange={(e) => setLname(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          className="w-full px-4 py-2 mt-2 border rounded focus:ring-2 focus:ring-blue-400"
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="w-full px-4 py-2 mt-2 border rounded focus:ring-2 focus:ring-blue-400"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full px-4 py-2 text-white font-semibold rounded-lg ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        Already registered?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login
        </a>
      </p>
    </form>
  );
}

export default Register;
