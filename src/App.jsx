import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { auth } from './firebase/firebase';

import Login from './Authenication/Login';
import Register from './Authenication/Signup';
import OwnerDashboard from './components/OwnerDahshboard';
import Dashboard from './components/Dashboard';
import RoleBasedRedirect from './RolebasedRedirect';
import CaseList from './components/CaseList';
import Profile from './components/Profile';
import CaseForm from './components/Cases/CaseForm';
import AdvancedCasesViewer from './components/Cases/CaseDashboard';
import AddClientForm from './components/Clients/ClientForm';
import ClientView from './components/Clients/ClientView';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} pauseOnHover />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <Login /> : <RoleBasedRedirect user={user} />} />
        <Route path="/register" element={!user ? <Register /> : <RoleBasedRedirect user={user} />} />

        {/* Role-based dashboards */}
        <Route path="/owner-dashboard" element={user ? <OwnerDashboard /> : <Navigate to="/login" />} />
        <Route path="/user-dashboard" element={user ? <Profile /> : <Navigate to="/login" />} />

        {/* Auto redirect based on role */}
        <Route path="/dashboard" element={user ? <RoleBasedRedirect user={user} /> : <Navigate to="/login" />} />
<Route path='insidedashboard' element={<Dashboard/>} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path='/cases/:date' element={<CaseList/>}/>
      <Route path='/casesform' element={<CaseForm/>}/>
            <Route path='/viewcases' element={<AdvancedCasesViewer/>}/>
      <Route path='/addclients' element={<AddClientForm/>}/>
           <Route path='/viewclients' element={<ClientView/>}/>
     
      </Routes>
    </>
  );
};

export default App;
