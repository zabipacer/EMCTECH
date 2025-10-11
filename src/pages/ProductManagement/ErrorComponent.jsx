import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const ErrorComponent = ({ error, onRetry }) => {
  return (
    <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
        <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={onRetry} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default ErrorComponent;