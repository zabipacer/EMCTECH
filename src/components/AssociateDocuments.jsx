// src/pages/Documents.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { FiFileText, FiDownload, FiSearch } from "react-icons/fi";
import { db } from "../firebase/firebase";

const Documents = ({ userId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAssigned, setFilterAssigned] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        // Step 1: Get cases assigned to this associate
        const casesRef = collection(db, "cases");
        const casesQuery = query(
          casesRef,
          where("assignedTo", "array-contains", userId)
        );
        const casesSnapshot = await getDocs(casesQuery);
        const cases = [];
        casesSnapshot.forEach((doc) => {
          cases.push({ id: doc.id, ...doc.data() });
        });

        // Step 2: Aggregate documents from each case
        const allDocs = [];
        cases.forEach((caseItem) => {
          if (caseItem.documents && caseItem.documents.length > 0) {
            caseItem.documents.forEach((doc) => {
              allDocs.push({
                ...doc,
                caseName: caseItem.caseTitle,
                assigned: true,
              });
            });
          }
        });

        setDocuments(allDocs);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userId]);

  const filteredDocs = documents
    .filter((doc) => (filterAssigned ? doc.assigned : true))
    .filter((doc) =>
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Documents
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          View documents for your assigned cases.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FiSearch className="text-gray-400 dark:text-gray-300 text-xl" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded-lg w-full sm:w-64 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={filterAssigned}
            onChange={() => setFilterAssigned(!filterAssigned)}
          />
          Show only assigned documents
        </label>
      </div>

      {/* Loading & Error */}
      {loading && (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      )}
      {error && (
        <p className="text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Documents List */}
      {!loading && filteredDocs.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredDocs.map((doc, idx) => (
            <motion.div
              key={idx}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow hover:shadow-lg transition border border-gray-100 dark:border-gray-700"
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-500 text-2xl">
                  <FiFileText />
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    doc.assigned
                      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                      : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {doc.assigned ? "Assigned" : "Unassigned"}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 text-sm">
                {doc.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                Case: {doc.caseName} | Uploaded: {doc.uploadedAt || "N/A"}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition text-sm"
                  onClick={() => alert("Preview not implemented yet")}
                  disabled={!doc.assigned}
                >
                  Preview
                </button>
                {doc.url && (
                  <a
                    href={doc.url}
                    download
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition text-sm"
                  >
                    <FiDownload /> Download
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && filteredDocs.length === 0 && (
        <p className="mt-6 text-gray-500 dark:text-gray-400 text-center">
          No documents found.
        </p>
      )}
    </div>
  );
};

export default Documents;
