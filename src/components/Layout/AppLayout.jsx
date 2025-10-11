// AppLayout.jsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

// Layout context and hook
const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within an AppLayout');
  }
  return context;
};

export default function AppLayout() {
  const [title, setTitle] = useState('Dashboard');
  const { userProfile, logout } = useAuth();

  // Use role from userProfile (single source of truth)
  const currentRole = userProfile?.role || 'viewer';

  // Context value
  const contextValue = useMemo(
    () => ({ 
      title, 
      setTitle, 
      currentRole 
    }),
    [title, currentRole]
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="min-h-screen flex bg-gray-100">
        {/* Sidebar gets role & signout handler */}
        <Sidebar currentRole={currentRole} onSignOut={logout} />

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* The nested routes will render here */}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}