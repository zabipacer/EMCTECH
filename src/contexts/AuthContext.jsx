// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          // Get user profile from Firestore
          const userDocRef = doc(db, "Users", user.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const role = userData.role || 'user';
            const profileData = {
              uid: user.uid,
              email: user.email,
              ...userData
            };
            
            setUserRole(role);
            setUserProfile(profileData);
            
            // Store in session for quick access (single source of truth)
            sessionStorage.setItem("userRole", role);
            sessionStorage.setItem("user", JSON.stringify(profileData));
          } else {
            // User document doesn't exist, sign them out
            await signOut(auth);
            setCurrentUser(null);
            setUserRole(null);
            setUserProfile(null);
            sessionStorage.clear();
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Don't sign out on error, just use basic user info
          setUserRole('user');
          setUserProfile({
            uid: user.uid,
            email: user.email,
            role: 'user',
            approved: false
          });
        }
      } else {
        // User signed out
        setCurrentUser(null);
        setUserRole(null);
        setUserProfile(null);
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    userRole,
    userProfile,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}