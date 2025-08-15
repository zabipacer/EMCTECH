// src/RoleBasedRedirect.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebase';
import { toast } from 'react-toastify';

const RoleBasedRedirect = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [redirected, setRedirected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      // If no user, nothing to do here
      if (!user) {
        setLoading(false);
        return;
      }

      // Prevent multiple redirections
      if (redirected) {
        return;
      }

      try {
        console.log("Fetching user role for:", user.uid);
        
        const userDoc = await getDoc(doc(db, 'Users', user.uid));
        if (!userDoc.exists()) {
          toast.error("No role found for this user.");
          navigate('/login', { replace: true });
          setRedirected(true);
          return;
        }

        const data = userDoc.data();
        const role = (data.role || 'user').toString().toLowerCase();
        const approved = data.approved === true;

        console.log("Fetched role:", role, "Approved:", approved);

        // Always redirect when this component is mounted - it's meant to be a redirect component
        if (role === 'store_owner' || role === 'owner') {
          navigate('/owner-dashboard', { replace: true });
          setRedirected(true);
          return;
        }

        // Non-owner flow: check approval
        if (!approved) {
          toast.info("Your account is pending approval.");
          navigate('/pending-approval', { replace: true });
          setRedirected(true);
          return;
        }

        // Approved non-owner -> user dashboard
        navigate('/user-dashboard', { replace: true });
        setRedirected(true);
        
      } catch (err) {
        console.error('Role fetch error:', err?.message || err);
        toast.error("Error fetching user role.");
        navigate('/login', { replace: true });
        setRedirected(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleAndRedirect();
  }, [user, navigate, redirected]);

  // Show loading state while determining role
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Checking your role and redirecting...</p>
        </div>
      </div>
    );
  }

  // If we're still here after loading is done, show a brief "redirecting" message
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;