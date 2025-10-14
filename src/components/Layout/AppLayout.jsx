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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { userProfile, logout } = useAuth();

  // Use role from userProfile (single source of truth)
  const currentRole = userProfile?.role || 'viewer';

  // Context value
  const contextValue = useMemo(
    () => ({ 
      title, 
      setTitle, 
      currentRole,
      mobileSidebarOpen,
      setMobileSidebarOpen
    }),
    [title, currentRole, mobileSidebarOpen]
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="min-h-screen flex bg-gray-100">
        {/* Sidebar gets role & signout handler */}
        <Sidebar 
          currentRole={currentRole} 
          onSignOut={logout} 
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
              {/* The nested routes will render here */}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}