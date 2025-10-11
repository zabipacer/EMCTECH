import React from "react";
import { FaFileImport, FaFileExport, FaPlus } from "react-icons/fa";

const Header = ({ onImportOpen, onExportAll, onAddProduct, filteredCount, totalCount }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your product catalog — add, edit, import, export and publish products.
          {filteredCount !== totalCount && (
            <span className="ml-2 text-blue-600">
              (Showing {filteredCount} of {totalCount})
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={onImportOpen} 
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow inline-flex items-center gap-2"
        >
          <FaFileImport /> Import CSV
        </button>

        <button 
          onClick={onExportAll} 
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow inline-flex items-center gap-2"
        >
          <FaFileExport /> Export All
        </button>

        <button 
          onClick={onAddProduct} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <FaPlus /> Add Product
        </button>
      </div>
    </div>
  );
};

export default Header;