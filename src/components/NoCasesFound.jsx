// NoCasesFound.jsx
import React from "react";
import { motion } from "framer-motion";
import { FiFolder } from "react-icons/fi";

export default function NoCasesFound({ cases }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FiFolder className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">No cases found</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        {cases.length === 0 
          ? "No cases are available in the system yet."
          : "No cases match your current filters. Try adjusting your search criteria."
        }
      </p>
    </motion.div>
  );
}