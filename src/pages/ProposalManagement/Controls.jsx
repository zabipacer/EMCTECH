import React from "react";
import { motion } from "framer-motion";
import { FaSearch, FaFilePdf, FaPaperPlane, FaTrash, FaSpinner } from "react-icons/fa";

export const Controls = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onBulkExport,
  onBulkSend,
  onBulkDelete,
  bulkProcessing
}) => {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow p-5" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full lg:w-1/3">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              aria-label="Search proposals"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search proposals, client, company or number..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select 
            value={statusFilter} 
            onChange={(e) => onStatusFilterChange(e.target.value)} 
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value)} 
            className="px-3 py-2 border rounded-lg"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount: High → Low</option>
            <option value="amount-low">Amount: Low → High</option>
          </select>

          <div className="flex items-center border rounded-lg overflow-hidden">
            <button 
              className={`px-4 py-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white"}`} 
              onClick={() => onViewModeChange("grid")}
            >
              Grid
            </button>
            <button 
              className={`px-4 py-2 ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white"}`} 
              onClick={() => onViewModeChange("table")}
            >
              Table
            </button>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkExport(false)}
              className="px-3 py-2 bg-white border rounded hover:shadow-sm flex items-center gap-2"
              title="Export selected to CSV"
            >
              <FaFilePdf /> Export CSV
            </button>
          
            <button
              onClick={onBulkDelete}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              title="Delete selected"
            >
              <FaTrash /> Delete Selected
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};