import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaFileImport, FaTimes, FaCheck } from "react-icons/fa";
import { LoadingSpinner } from './Uicomponens';
import Papa from "papaparse";

function ImportModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        alert("Please select a CSV file");
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      // 1. Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const products = results.data;
          // 2. Call onImport with parsed products
          await onImport(products);
          setImporting(false);
        },
        error: (err) => {
          alert("Failed to parse CSV: " + err.message);
          setImporting(false);
        }
      });
    } catch (error) {
      console.error("Import failed:", error);
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="z-10 bg-white rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Products</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Upload a CSV file with your product data. The file should include columns for name, SKU, price, and other product details.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
            {file ? (
              <div className="text-green-600">
                <FaCheck className="text-2xl mx-auto mb-2" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <>
                <FaFileImport className="text-3xl text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Choose File
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing && <LoadingSpinner size="sm" />}
              {importing ? "Importing..." : "Import Products"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ImportModal;