import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import AppLayout from './components/Layout/AppLayout';
import DashboardRouter from './pages/DashboardRouter';

import ProposalManagement from './pages/ProposalManagement/ProposalManagement.jsx';
import CreateProposal from './Createproposal';
import ClientManagement from './pages/ClientManagemnet';
import Automation from './pages/Automation';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NoAccess from './pages/NoAccess';
import ApprovalPending from './pages/ApprovalPending';
import UserApprovalDashboard from './pages/UserApprovalDashboard';
import Login from './Authenication/Login';
import Register from './Authenication/Signup';
import './index.css';
import ProductManagement from './pages/ProductManagement/ProductManagement';
import { useProducts } from './pages/ProductManagement/hooks.js';
// Public Route - Only for unauthenticated users
const PublicRoute = ({ children }) => {
  const { userProfile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, redirect to appropriate dashboard
  if (userProfile) {
    if (userProfile.role === 'store_owner' || userProfile.role === 'owner') {
      return <Navigate to="/owner-dashboard" replace />;
    } else if (userProfile.approved) {
      return <Navigate to="/user-dashboard" replace />;
    } else {
      return <Navigate to="/approval-pending" replace />;
    }
  }

  return children;
};

// Protected Route - Only for authenticated users
const ProtectedRoute = ({ children }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

// Approval Check Route - For unapproved users
const ApprovalRoute = ({ children }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user is approved or owner, redirect to dashboard
  if (userProfile.approved || userProfile.role === 'store_owner' || userProfile.role === 'owner') {
    if (userProfile.role === 'store_owner' || userProfile.role === 'owner') {
      return <Navigate to="/owner-dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  return children;
};

const AppRoutes = () => {
  const { userProfile } = useAuth();
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/unauthorized" element={<NoAccess />} />
      <Route path="/approval-pending" element={<ApprovalRoute><ApprovalPending /></ApprovalRoute>} />
      
      {/* Protected Routes with AppLayout */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard/*" element={<DashboardRouter />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="proposals" element={<ProposalManagement user={userProfile}/>} />
        <Route path="proposals/create" element={<CreateProposal />} /> {/* Fixed: Use CreateProposal component */}
        <Route path="clients" element={<ClientManagement />} />
        <Route path="automation" element={<Automation />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="user-approvals" element={<UserApprovalDashboard />} />
        <Route path="owner-dashboard" element={<DashboardRouter />} />
        <Route path="user-dashboard" element={<DashboardRouter />} />
        
        {/* Default redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);