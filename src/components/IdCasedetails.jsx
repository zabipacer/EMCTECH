import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Calendar,
  FileText,
  Clock,
  Briefcase,
  DollarSign,
  MapPin,
  ArrowUpRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  User,
  BookOpen,
  Shield,
  Gavel,
  Users,
  CalendarCheck,
  CalendarX,
  Edit,
  Save,
  Trash2,
  Plus
} from 'lucide-react';

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';

const CaseDetails = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [caseLoading, setCaseLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [adjournModal, setAdjournModal] = useState(false);
  const [newAdjournDate, setNewAdjournDate] = useState('');
  const [adjournReason, setAdjournReason] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newTask, setNewTask] = useState('');

  // Track authentication state and fetch user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          try {
            const userDocRef = doc(db, 'Users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUserRole(userData.role || 'user');
            }
          } catch (err) {
            console.error('Error fetching user role:', err);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
      } finally {
        setUserLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch case data
  useEffect(() => {
    if (!caseId) {
      setError('Case ID is missing');
      setCaseLoading(false);
      return;
    }
    
    const fetchCaseData = async () => {
      try {
        setCaseLoading(true);
        const caseDocRef = doc(db, 'cases', caseId);
        const caseDocSnap = await getDoc(caseDocRef);
        
        if (caseDocSnap.exists()) {
          setCaseData({ id: caseDocSnap.id, ...caseDocSnap.data() });
        } else {
          setError('Case not found');
        }
      } catch (err) {
        console.error('Error fetching case:', err);
        setError('Failed to load case details');
      } finally {
        setCaseLoading(false);
      }
    };

    fetchCaseData();
  }, [caseId]);

  // Combined loading state
  const loading = userLoading || caseLoading;

  const hasEditPermission = () => {
    if (!caseData || !currentUser) return false;
    if (userRole === 'admin' || userRole === 'owner') return true;
    
    // Check if user has explicit edit permissions for this case
    const userPermissions = caseData.permissions && caseData.permissions[currentUser.uid];
    return userPermissions && userPermissions.canEdit;
  };

  const hasDeletePermission = () => {
    if (!caseData || !currentUser) return false;
    if (userRole === 'admin' || userRole === 'owner') return true;
    
    // Check if user has explicit delete permissions for this case
    const userPermissions = caseData.permissions && caseData.permissions[currentUser.uid];
    return userPermissions && userPermissions.canDelete;
  };

  const startEditing = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!caseData || !editingField) return;
    
    try {
      const caseRef = doc(db, 'cases', caseId);
      await updateDoc(caseRef, {
        [editingField]: editValue,
        updatedAt: new Date().toISOString()
      });
      
      setCaseData(prev => ({ ...prev, [editingField]: editValue }));
      setEditingField(null);
      setEditValue('');
    } catch (err) {
      console.error('Error updating case:', err);
      alert('Failed to update case');
    }
  };

  const adjournCase = async () => {
    if (!newAdjournDate || !adjournReason) {
      alert('Please provide both date and reason for adjournment');
      return;
    }
    
    try {
      const caseRef = doc(db, 'cases', caseId);
      await updateDoc(caseRef, {
        hearingDate: newAdjournDate,
        adjournHistory: arrayUnion({
          date: newAdjournDate,
          reason: adjournReason,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        }),
        updatedAt: new Date().toISOString()
      });
      
      setCaseData(prev => ({
        ...prev,
        hearingDate: newAdjournDate,
        adjournHistory: [
          ...(prev.adjournHistory || []),
          {
            date: newAdjournDate,
            reason: adjournReason,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.uid
          }
        ]
      }));
      
      setAdjournModal(false);
      setNewAdjournDate('');
      setAdjournReason('');
      alert('Case adjourned successfully!');
    } catch (err) {
      console.error('Error adjourning case:', err);
      alert('Failed to adjourn case');
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      const newTaskObj = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      const caseRef = doc(db, 'cases', caseId);
      await updateDoc(caseRef, {
        tasks: arrayUnion(newTaskObj),
        updatedAt: new Date().toISOString()
      });
      
      setCaseData(prev => ({
        ...prev,
        tasks: [...(prev.tasks || []), newTaskObj],
        totalTasks: (prev.totalTasks || 0) + 1
      }));
      
      setNewTask('');
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Failed to add task');
    }
  };

  const toggleTask = async (taskId) => {
    if (!caseData.tasks) return;
    
    try {
      const updatedTasks = caseData.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      const completedCount = updatedTasks.filter(t => t.completed).length;
      
      const caseRef = doc(db, 'cases', caseId);
      await updateDoc(caseRef, {
        tasks: updatedTasks,
        completedTasks: completedCount,
        updatedAt: new Date().toISOString()
      });
      
      setCaseData(prev => ({
        ...prev,
        tasks: updatedTasks,
        completedTasks: completedCount
      }));
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  const deleteCase = async () => {
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      return;
    }
    
    try {
      const caseRef = doc(db, 'cases', caseId);
      await deleteDoc(caseRef);
      alert('Case deleted successfully');
      navigate('/cases');
    } catch (err) {
      console.error('Error deleting case:', err);
      alert('Failed to delete case');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '—';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-40 bg-gray-200 rounded-xl"></div>
                <div className="h-60 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="space-y-4">
                <div className="h-40 bg-gray-200 rounded-xl"></div>
                <div className="h-60 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-700 font-medium">Error Loading Case</div>
            <div className="text-red-600">{error}</div>
            <button 
              onClick={() => navigate(-1)} 
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-700 font-medium">Case Not Found</div>
            <button 
              onClick={() => navigate(-1)} 
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {caseData.caseTitle || 'Case Details'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {hasEditPermission() && (
              <button 
                onClick={() => navigate(`/edit-case/${caseId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit size={16} /> Edit Case
              </button>
            )}
            
            {hasDeletePermission() && (
              <button 
                onClick={deleteCase}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Case Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="text-blue-600" /> Case Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Case Title</label>
                  {editingField === 'caseTitle' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button onClick={saveEdit} className="p-2 text-green-600">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEditing} className="p-2 text-red-600">
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 font-medium">{caseData.caseTitle || '—'}</p>
                      {hasEditPermission() && (
                        <button 
                          onClick={() => startEditing('caseTitle', caseData.caseTitle)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Case Number</label>
                  {editingField === 'caseNumber' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button onClick={saveEdit} className="p-2 text-green-600">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEditing} className="p-2 text-red-600">
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 font-medium">{caseData.caseNumber || '—'}</p>
                      {hasEditPermission() && (
                        <button 
                          onClick={() => startEditing('caseNumber', caseData.caseNumber)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Case Type</label>
                  {editingField === 'caseType' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button onClick={saveEdit} className="p-2 text-green-600">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEditing} className="p-2 text-red-600">
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 font-medium">{caseData.caseType || '—'}</p>
                      {hasEditPermission() && (
                        <button 
                          onClick={() => startEditing('caseType', caseData.caseType)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Case Value</label>
                  {editingField === 'caseValue' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button onClick={saveEdit} className="p-2 text-green-600">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEditing} className="p-2 text-red-600">
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 font-medium">{caseData.caseValue ? `$${caseData.caseValue}` : '—'}</p>
                      {hasEditPermission() && (
                        <button 
                          onClick={() => startEditing('caseValue', caseData.caseValue)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      caseData.status === 'Litigation' ? 'bg-blue-100 text-blue-800' :
                      caseData.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      caseData.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {caseData.status || '—'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Priority</label>
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      caseData.priority === 'High Priority' ? 'bg-red-100 text-red-800' :
                      caseData.priority === 'Medium Priority' ? 'bg-yellow-100 text-yellow-800' :
                      caseData.priority === 'Low Priority' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {caseData.priority || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Gavel className="text-purple-600" /> Legal Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Hearing Date</label>
                  <p className="text-gray-800 font-medium">
                    {caseData.hearingDate ? formatDate(caseData.hearingDate) : '—'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Hearing Time</label>
                  <p className="text-gray-800 font-medium">{caseData.scheduleTime || '—'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                  {editingField === 'location' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button onClick={saveEdit} className="p-2 text-green-600">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEditing} className="p-2 text-red-600">
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 font-medium">{caseData.location || '—'}</p>
                      {hasEditPermission() && (
                        <button 
                          onClick={() => startEditing('location', caseData.location)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Under Section</label>
                  {editingField === 'underSection' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button onClick={saveEdit} className="p-2 text-green-600">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEditing} className="p-2 text-red-600">
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-gray-800 font-medium">{caseData.underSection || '—'}</p>
                      {hasEditPermission() && (
                        <button 
                          onClick={() => startEditing('underSection', caseData.underSection)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <button 
                  onClick={() => setAdjournModal(true)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                >
                  <CalendarX size={16} /> Adjourn Case
                </button>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="text-blue-600" /> Case Description
              </h2>
              
              {editingField === 'caseDescription' ? (
                <div className="space-y-3">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg h-32"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg">
                      Save
                    </button>
                    <button onClick={cancelEditing} className="px-4 py-2 bg-gray-200 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <p className="text-gray-700">{caseData.caseDescription || 'No description provided.'}</p>
                  {hasEditPermission() && (
                    <button 
                      onClick={() => startEditing('caseDescription', caseData.caseDescription)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Adjournment History Card */}
            {caseData.adjournHistory && caseData.adjournHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CalendarCheck className="text-blue-600" /> Adjournment History
                </h2>
                
                <div className="space-y-4">
                  {caseData.adjournHistory.map((adjournment, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">
                          {adjournment.date ? formatDate(adjournment.date) : 'No date'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {adjournment.updatedAt ? formatDateTime(adjournment.updatedAt) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{adjournment.reason || 'No reason provided'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tasks and Progress */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Scale className="text-purple-600" /> Case Progress
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="text-sm font-medium">{caseData.progress || 0}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${caseData.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-xl font-bold text-blue-700">{caseData.totalTasks || 0}</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-xl font-bold text-green-700">{caseData.completedTasks || 0}</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Billable Hours</p>
                  <p className="text-xl font-bold text-amber-700">{caseData.billableHours || 0} hrs</p>
                </div>
              </div>
            </div>

            {/* Tasks Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" /> Tasks
              </h2>
              
              <div className="space-y-3 mb-4">
                {caseData.tasks && caseData.tasks.length > 0 ? (
                  caseData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed || false}
                        onChange={() => toggleTask(task.id)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                        {task.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No tasks yet</p>
                )}
              </div>
              
              {hasEditPermission() && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button 
                    onClick={addTask}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Metadata Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="text-gray-600" /> Case Metadata
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="text-gray-800">{caseData.createdAt ? formatDateTime(caseData.createdAt) : '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-gray-800">{caseData.updatedAt ? formatDateTime(caseData.updatedAt) : '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Documents</p>
                  <p className="text-gray-800">{caseData.documentsCount || 0} documents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adjourn Modal */}
      {adjournModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Adjourn Case</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Hearing Date</label>
                <input 
                  type="date" 
                  value={newAdjournDate}
                  onChange={(e) => setNewAdjournDate(e.target.value)}
                  className="w-full p-2 border rounded-lg" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Adjournment</label>
                <textarea 
                  value={adjournReason}
                  onChange={(e) => setAdjournReason(e.target.value)}
                  className="w-full p-2 border rounded-lg" 
                  rows="3" 
                  placeholder="Enter reason for adjournment"
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setAdjournModal(false);
                    setNewAdjournDate('');
                    setAdjournReason('');
                  }} 
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={adjournCase}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm Adjournment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetails;