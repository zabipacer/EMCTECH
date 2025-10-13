import React from "react";

export const IconButton = ({ children, title, onClick, danger }) => (
  <button 
    title={title} 
    onClick={onClick} 
    className={`p-2 rounded-md ${
      danger ? "text-red-600 hover:bg-red-50" : "text-gray-600 hover:bg-gray-50"
    } transition-colors`}
  >
    {children}
  </button>
);