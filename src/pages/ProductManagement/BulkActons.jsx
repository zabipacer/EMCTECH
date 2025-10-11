import React from "react";
import { motion } from "framer-motion";
import { FaTrash } from "react-icons/fa";

const BulkActions = ({ selectedCount, onBulkStatusChange, onExportSelected, onDeleteSelected, onClearSelection }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <span className="font-medium text-blue-800">
          {selectedCount} product{selectedCount > 1 ? 's' : ''} selected
        </span>
        <div className="flex flex-wrap gap-2">
          <button 
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            onClick={() => onBulkStatusChange("published")}
          >
            Publish
          </button>
          <button 
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            onClick={() => onBulkStatusChange("draft")}
          >
            Unpublish
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            onClick={onExportSelected}
          >
            Export Selected
          </button>
          <button 
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 inline-flex items-center gap-1"
            onClick={onDeleteSelected}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
      <button 
        className="px-3 py-1 border border-blue-300 text-blue-700 rounded text-sm hover:bg-blue-100 self-start"
        onClick={onClearSelection}
      >
        Clear Selection
      </button>
    </motion.div>
  );
};

export default BulkActions;