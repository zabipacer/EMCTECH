import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ currentPage, totalPages, totalItems, perPage, onPageChange }) => {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisiblePages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages.map((pageNum) => (
      <button
        key={pageNum}
        className={`w-10 h-10 rounded-lg border ${
          currentPage === pageNum
            ? "bg-blue-600 text-white border-blue-600"
            : "border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => onPageChange(pageNum)}
      >
        {pageNum}
      </button>
    ));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button 
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaChevronLeft className="text-gray-600" />
        </button>
        <div className="flex items-center gap-1">
          {renderPageNumbers()}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="px-2">...</span>
              <button
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        <button 
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FaChevronRight className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;