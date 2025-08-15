// src/RoleBasedRedirect.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebase';
import { toast } from 'react-toastify';

const RoleBasedRedirect = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'Users', user.uid));

        if (!userDoc.exists()) {
          toast.error("No role found for this user.");
          navigate('/login', { replace: true });
          return;
        }

        const data = userDoc.data();
        const role = data.role || 'user';
        const approved = data.approved === true;

        console.log("Fetched role:", role, "Approved:", approved);

        // Redirect only if user is on public pages
        if (location.pathname === '/login' || location.pathname === '/signup') {
          if (role === 'store_owner') {
            navigate('/owner-dashboard', { replace: true });
          } else {
            if (!approved) {
              toast.info("Your account is pending approval.");
              navigate('/pending-approval', { replace: true });
              return;
            }
            navigate('/user-dashboard', { replace: true });
          }
        }
      } catch (err) {
        console.error('Role fetch error:', err.message);
        toast.error("Error fetching user role.");
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchRoleAndRedirect();
  }, [user, location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-lg">Checking role...</p>
      </div>
    );
  }

  return null; // This no longer directly renders <Navigate>
};

export default RoleBasedRedirect;
