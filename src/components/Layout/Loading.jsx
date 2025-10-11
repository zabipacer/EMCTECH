// src/components/UI/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      
      {/* Optional text */}
      <p className="text-gray-600 font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
