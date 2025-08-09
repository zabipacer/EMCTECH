// RoleBasedRedirect.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebase';
import { toast } from 'react-toastify';

const RoleBasedRedirect = ({ user }) => {
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'Users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role === 'store_owner') {
            setRedirectPath('/owner-dashboard');
          } else {
            setRedirectPath('/user-dashboard');
          }
        } else {
          toast.error("No role found for this user.");
          setRedirectPath('/login');
        }
      } catch (err) {
        console.error('Role fetch error:', err.message);
        toast.error("Error fetching user role.");
        setRedirectPath('/login');
      }
    };

    if (user) {
      fetchRoleAndRedirect();
    }
  }, [user]);

  if (!redirectPath) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-lg">Checking role...</p>
      </div>
    );
  }

  return <Navigate to={redirectPath} />;
};

export default RoleBasedRedirect;
