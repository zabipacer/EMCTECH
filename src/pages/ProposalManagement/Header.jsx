import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaPlus } from "react-icons/fa";

export const Header = ({ onQuickAddClient, onCreateProposal }) => {
  const navigate = useNavigate();

  const handleCreateProposal = () => {
    if (onCreateProposal) {
      onCreateProposal();
    } else {
      // Fallback: navigate to create page if no handler provided
      navigate("/proposals/create");
    }
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Proposal Management</h1>
          <p className="text-gray-600 mt-2">Create, manage, and track your business proposals.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onQuickAddClient}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
          >
            <FaUsers /> Quick Add Client
          </button>

          <button
            onClick={handleCreateProposal}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow"
          >
            <FaPlus />
            <span>Create New Proposal</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
};