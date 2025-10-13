import React, { useEffect } from "react";
import { motion } from "framer-motion";

export const Toast = ({ message, type = "info", onClose }) => {
  const color = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800";
  
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className={`text-white ${color} px-4 py-2 rounded shadow`}
    >
      {message}
    </motion.div>
  );
};