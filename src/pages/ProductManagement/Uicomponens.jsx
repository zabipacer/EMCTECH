import React from "react";

export const Chip = React.memo(({ children, className = "", onClick }) => (
  <span 
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    onClick={onClick}
  >
    {children}
  </span>
));

export const Badge = React.memo(({ children, color = "bg-gray-100 text-gray-800", className = "" }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${color} ${className}`}>
    {children}
  </span>
));

export const LoadingSpinner = ({ size = "md" }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizes[size]}`} />
  );
};

export const FaInfo = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 192 512" height="1em" width="1em">
    <path d="M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0-11.046-8.954-20-20-20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z"></path>
  </svg>
);