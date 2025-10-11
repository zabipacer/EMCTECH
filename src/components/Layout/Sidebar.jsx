// SidebarAndLayout.jsx
// Single-file React component that exports a Sidebar and AppLayout
// Usage: place this file in src/components/SidebarAndLayout.jsx
// Import AppLayout in your routes wrapper: <Route path="/" element={<AppLayout currentRole="viewer"/>}> ...

import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaCube,
  FaFileAlt,
  FaUsers,
  FaCog,
  FaChartBar,
  FaPlay,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaSignOutAlt,
} from 'react-icons/fa';

// ----------------------
// Small helper: role hierarchy
// ----------------------
const ROLE_PRIORITY = {
  viewer: 1,
  editor: 2,
  owner: 3,
  admin: 4,
};

function canAccess(requiredRole, currentRole) {
  if (!requiredRole) return true;
  return (ROLE_PRIORITY[currentRole] || 0) >= (ROLE_PRIORITY[requiredRole] || 0);
}

// ----------------------
// Navigation list
// ----------------------
const NAV_ITEMS = [
  { name: 'Dashboard', to: '/', icon: FaHome, requiredRole: 'viewer' },
  { name: 'Products', to: '/products', icon: FaCube, requiredRole: 'viewer' },
  { name: 'Proposals', to: '/proposals', icon: FaFileAlt, requiredRole: 'viewer' },
  { name: 'Clients', to: '/clients', icon: FaUsers, requiredRole: 'viewer' },
  { name: 'Automation', to: '/automation', icon: FaPlay, requiredRole: 'editor' },
  { name: 'Analytics', to: '/analytics', icon: FaChartBar, requiredRole: 'viewer' },
  { name: 'Settings', to: '/settings', icon: FaCog, requiredRole: 'admin' },
];

// ----------------------
// Sidebar component
// ----------------------
export const Sidebar = ({ currentRole = 'viewer', onSignOut }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // animation variants
  const containerVariants = {
    open: { width: 256, transition: { type: 'spring', stiffness: 240, damping: 22 } },
    collapsed: { width: 64, transition: { type: 'spring', stiffness: 240, damping: 22 } },
  };

  const linkBase =
    'group flex items-center gap-3 p-2 rounded-md transition-colors text-sm hover:bg-gray-700 hover:text-white';

  return (
    <>
      {/* Mobile top bar: hamburger */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 text-white p-2">
        <div className="flex items-center gap-2">
          <button
            aria-label="Open menu"
            className="p-2 rounded hover:bg-gray-700"
            onClick={() => setMobileOpen(true)}
          >
            <FaBars />
          </button>
          <div className="font-semibold">My App</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSignOut}
            className="p-2 rounded hover:bg-gray-700"
            title="Sign out"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {/* Sidebar container */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'open'}
        variants={containerVariants}
        className="bg-gray-800 text-white hidden md:flex md:flex-col h-screen"
        style={{ minWidth: isCollapsed ? 64 : 256 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-semibold">A</div>
                <div>
                  <div className="text-lg font-semibold">AppName</div>
                  <div className="text-xs text-gray-400">Admin panel</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setIsCollapsed((s) => !s)}
            className="p-2 rounded hover:bg-gray-700"
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-auto p-3 space-y-1">
          {NAV_ITEMS.filter((n) => canAccess(n.requiredRole, currentRole)).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                to={item.to}
                key={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-gray-700' : 'text-gray-200'} ${
                    isCollapsed ? 'justify-center' : ''
                  }`
                }
              >
                <div className="flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / User info */}
        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">Z</div>
            <div className={`flex-1 min-w-0 ${isCollapsed ? 'hidden' : ''}`}>
              <div className="text-sm font-medium truncate">Zuhaib Zulfiqar</div>
              <div className="text-xs text-gray-400 truncate">{currentRole}</div>
            </div>
            {!isCollapsed && (
              <button
                onClick={onSignOut}
                className="p-2 rounded hover:bg-gray-700"
                title="Sign out"
              >
                <FaSignOutAlt />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile drawer (overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="relative w-72 h-full bg-gray-800 text-white p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">AppName</div>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded hover:bg-gray-700">
                  <FaChevronLeft />
                </button>
              </div>

              <div className="space-y-2">
                {NAV_ITEMS.filter((n) => canAccess(n.requiredRole, currentRole)).map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      to={item.to}
                      key={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `${linkBase} ${isActive ? 'bg-gray-700' : 'text-gray-200'}`
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <button
                  onClick={onSignOut}
                  className="w-full py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
