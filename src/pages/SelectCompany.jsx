import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const SelectCompany = () => {
  const { userProfile, setCurrentCompany } = useAuth();

  const handleCompanySelect = async (companyId) => {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        setCurrentCompany({ id: companyDoc.id, ...companyDoc.data() });
      }
    } catch (error) {
      console.error('Error selecting company:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Select Company
        </h2>
        
        <div className="space-y-4">
          {Object.entries(userProfile?.roles || {}).map(([companyId, role]) => (
            <motion.button
              key={companyId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCompanySelect(companyId)}
              className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-medium text-gray-900">
                Company ID: {companyId.substring(0, 8)}...
              </div>
              <div className="text-sm text-gray-600 capitalize mt-1">
                Role: {role}
              </div>
            </motion.button>
          ))}
        </div>

        {Object.keys(userProfile?.roles || {}).length === 0 && (
          <div className="text-center text-gray-600 py-4">
            No companies available. Please contact an administrator.
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SelectCompany;