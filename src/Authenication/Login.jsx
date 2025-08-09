// src/Authenication/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.", {
        position: "bottom-center",
      });
      return;
    }

    try {
      // 1️⃣ sign in with Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // 2️⃣ fetch their Firestore record
      const userSnap = await getDoc(doc(db, "Users", user.uid));
      if (!userSnap.exists()) {
        toast.error("User record not found.", { position: "bottom-center" });
        await signOut(auth);
        return;
      }
      const data = userSnap.data();

      // 3️⃣ only allow if:
      //   • they're an owner (pre-created), or
      //   • their approved flag is true
      if (data.role !== "store_owner" && !data.approved) {
        toast.error("Account not approved yet.", { position: "bottom-center" });
        await signOut(auth);
        return;
      }

      // 4️⃣ success → redirect based on role
      toast.success("Logged in successfully!", { position: "top-center" });
      if (data.role === "store_owner") {
        navigate("/owner-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      const msg = error.message.includes("user-not-found")
        ? "No account with this email."
        : error.message.includes("wrong-password")
        ? "Incorrect password."
        : "Login failed.";
      toast.error(msg, { position: "bottom-center" });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-96">
        <h3 className="text-2xl font-semibold mb-4 text-center">Login</h3>

        <div className="mb-4">
          <label className="block text-gray-700">Email address</label>
          <input
            type="email"
            className="w-full px-4 py-2 mt-1 border rounded focus:ring-2 focus:ring-blue-400"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 mt-1 border rounded focus:ring-2 focus:ring-blue-400"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
        >
          Login
        </button>

        <p className="mt-4 text-center text-gray-600">
          New user?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Register Here
          </a>
        </p>
      </form>
    </div>
  );
}

export default Login;
