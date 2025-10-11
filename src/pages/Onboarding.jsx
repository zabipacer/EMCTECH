import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { currentUser, updateUserProfile, setCurrentCompany } = useAuth();
  const navigate = useNavigate();

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!companyName.trim()) {
      setErrorMsg('Please enter a company name.');
      return;
    }

    setLoading(true);
    console.log('[onboarding] start create company', { uid: currentUser?.uid, companyName });

    try {
      // safety checks
      if (!currentUser || !currentUser.uid) {
        throw new Error('No authenticated user found (currentUser is null).');
      }

      // 1) create company doc with server timestamp
      const companyPayload = {
        name: companyName.trim(),
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultLanguage: 'en'
      };

      console.log('[onboarding] adding company doc to Firestore...', companyPayload);
      const companiesCol = collection(db, 'companies');
      const companyRef = await addDoc(companiesCol, companyPayload);
      console.log('[onboarding] company created', companyRef.id);

      // 2) verify company was written (optional)
      const companySnap = await getDoc(doc(db, 'companies', companyRef.id));
      if (!companySnap.exists()) {
        throw new Error('Created company doc not found after write.');
      }
      const createdData = companySnap.data();
      console.log('[onboarding] verified company doc:', { id: companyRef.id, data: createdData });

      // 3) Update users/{uid} roles map safely using updateDoc and field path
      const userRef = doc(db, 'users', currentUser.uid);
      const rolePatch = { [`roles.${companyRef.id}`]: 'admin', preferredCompanyId: companyRef.id };
      console.log('[onboarding] updating user roles:', rolePatch);
      await updateDoc(userRef, rolePatch);
      console.log('[onboarding] user roles updated on users/{uid}');

      // 4) Optionally call any context helper to refresh local user profile
      if (typeof updateUserProfile === 'function') {
        try {
          await updateUserProfile(); // implement refresh in AuthContext to re-fetch userDoc
          console.log('[onboarding] updateUserProfile() called');
        } catch (err) {
          console.warn('[onboarding] updateUserProfile() failed (non-fatal):', err);
        }
      }

      // 5) Set current company in client context and navigate
      if (typeof setCurrentCompany === 'function') {
        setCurrentCompany({ id: companyRef.id, ...companyPayload });
      }
      console.log('[onboarding] setCurrentCompany called, navigating to /');
      navigate('/', { replace: true });

    } catch (err) {
      console.error('[onboarding] Error creating company:', err);
      setErrorMsg(err.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Welcome! 👋</h2>
        <p className="text-gray-600 text-center mb-6">Let's create your first company to get started.</p>

        {errorMsg && <div className="mb-3 text-sm text-red-600">{errorMsg}</div>}

        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !companyName.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Company...' : 'Get Started'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
