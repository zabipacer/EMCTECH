import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, FiPhone, FiMail, FiFileText, FiClock, 
  FiDollarSign, FiCalendar, FiMapPin, FiPlus, 
  FiTrash2, FiSave, FiAlertCircle, FiChevronDown,
  FiSearch, FiEdit3, FiX
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';

import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export default function CaseEditForm({ onSave = null, onCancel = null }) {
 const { caseId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [formData, setFormData] = useState({
    caseTitle: '',
    priority: 'Medium Priority',
    caseType: '',
    scheduleTime: '',
    hearingDate: '',
    location: '',
    clientId: '',
    status: 'Discovery',
    progress: 0,
    documentsCount: 0,
    billableHours: 0,
    caseValue: '',
    caseDescription: '',
    tasks: [
      { id: 1, text: '', completed: false },
      { id: 2, text: '', completed: false }
    ]
  });

  const [originalData, setOriginalData] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState(new Set());

  // Fetch clients from Firestore
  const fetchClients = useCallback(async () => {
    try {
      setIsLoadingClients(true);
      const querySnapshot = await getDocs(collection(db, 'clients'));
      const clientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);
      console.log('Clients fetched:', clientsData.length);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setSubmitMessage('Failed to load clients');
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  // Fetch case data from Firebase
  const fetchCaseData = useCallback(async () => {
    if (!caseId) {
      console.log('No caseId provided');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching case data for ID:', caseId);
      
      const caseRef = doc(db, 'cases', caseId);
      const caseSnap = await getDoc(caseRef);
      
      if (caseSnap.exists()) {
        const data = caseSnap.data();
        console.log('Case data fetched:', data);
        
        // Ensure tasks array exists
        const tasks = data.tasks || [
          { id: 1, text: '', completed: false },
          { id: 2, text: '', completed: false }
        ];
        
        const caseData = { ...data, tasks };
        setFormData(caseData);
        setOriginalData(caseData);
        
        console.log('Form data set:', caseData);
      } else {
        console.error('Case not found');
        setSubmitMessage('Case not found');
        navigate('/cases', { replace: true });
      }
    } catch (error) {
      console.error('Error fetching case:', error);
      setSubmitMessage('Failed to load case data');
    } finally {
      setIsLoading(false);
    }
  }, [caseId, navigate]);

  // Set client search when case data is loaded and clients are available
  const updateClientSearch = useCallback(() => {
    if (formData.clientId && clients.length > 0) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client) {
        console.log('Setting client search to:', client.name);
        setClientSearch(client.name);
      }
    }
  }, [formData.clientId, clients]);

  // Initialize data on component mount
  useEffect(() => {
    console.log('Component mounted, caseId:', caseId);
    
    const initializeData = async () => {
      if (!caseId) {
        console.error('No caseId provided, redirecting...');
        navigate('/cases');
        return;
      }

      // Fetch clients first
      await fetchClients();
    };

    initializeData();
  }, [caseId, navigate, fetchClients]);

  // Fetch case data after clients are loaded
  useEffect(() => {
    console.log('Clients loaded:', clients.length, 'Loading state:', isLoadingClients);
    
    if (!isLoadingClients && caseId) {
      fetchCaseData();
    }
  }, [isLoadingClients, caseId, fetchCaseData]);

  // Update client search when both form data and clients are available
  useEffect(() => {
    updateClientSearch();
  }, [updateClientSearch]);

  // Check for changes whenever formData or originalData changes
  useEffect(() => {
    if (!originalData) return;
    
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(hasFormChanges);
    console.log('Has changes:', hasFormChanges);

    // Track which fields have changed
    const changed = new Set();
    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])) {
        changed.add(key);
      }
    });
    setChangedFields(changed);
    console.log('Changed fields:', Array.from(changed));
  }, [formData, originalData]);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskChange = (id, value) => {
    console.log('Task changed:', id, value);
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id ? { ...task, text: value } : task
      )
    }));
  };

  const toggleTaskComplete = (id) => {
    console.log('Task completion toggled:', id);
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const addTask = () => {
    const newId = Math.max(0, ...formData.tasks.map(t => t.id)) + 1;
    console.log('Adding new task with ID:', newId);
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: newId, text: '', completed: false }]
    }));
  };

  const removeTask = (id) => {
    if (formData.tasks.length > 1) {
      console.log('Removing task:', id);
      setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id)
      }));
    }
  };

  const selectClient = (client) => {
    console.log('Client selected:', client);
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setShowClientDropdown(false);
    setClientSearch(client.name);
  };

  const validateForm = () => {
    const required = ['caseTitle', 'caseType', 'clientId', 'caseDescription'];
    const isValid = required.every(field => formData[field]?.toString().trim() !== '');
    console.log('Form validation:', isValid, 'Missing fields:', required.filter(field => !formData[field]?.toString().trim()));
    return isValid;
  };

  const handleSubmit = async () => {
    console.log('Submit triggered');
    
    if (!validateForm()) {
      setSubmitMessage('Please fill in all required fields');
      return;
    }

    if (!hasChanges) {
      setSubmitMessage('No changes detected');
      return;
    }

    setIsSubmitting(true);
    console.log('Starting submission...');
    
    try {
      // Prepare data for update
      const updateData = {
        ...formData,
        billableHours: parseFloat(formData.billableHours) || 0,
        documentsCount: parseInt(formData.documentsCount) || 0,
        progress: parseInt(formData.progress),
        updatedAt: new Date().toISOString(),
        completedTasks: formData.tasks.filter(task => task.completed).length,
        totalTasks: formData.tasks.length
      };
      
      console.log('Update data prepared:', updateData);
      
      // Update actual Firebase document
      if (caseId) {
        const caseRef = doc(db, 'cases', caseId);
        await updateDoc(caseRef, updateData);
        console.log('Case updated successfully');
        setSubmitMessage(`Case updated successfully! ${changedFields.size} field(s) modified.`);
      }
      
      // Update original data to reflect saved changes
      setOriginalData(formData);
      setChangedFields(new Set());
      
      // Call onSave callback if provided
      if (onSave) {
        console.log('Calling onSave callback');
        onSave(updateData);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error updating case:', error);
      setSubmitMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('Cancel triggered');
    if (originalData) {
      setFormData(originalData);
    }
    setSubmitMessage('');
    if (onCancel) {
      console.log('Calling onCancel callback');
      onCancel();
    } else {
      navigate(-1); // Go back if no custom cancel handler
    }
  };

  const resetField = (fieldName) => {
    if (!originalData) return;
    
    console.log('Resetting field:', fieldName);
    setFormData(prev => ({
      ...prev,
      [fieldName]: originalData[fieldName]
    }));
  };

  // Computed values
  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const selectedClient = clients.find(c => c.id === formData.clientId);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Helper function to render field with change indicator
  const renderFieldWithIndicator = (fieldName, children) => (
    <div className="relative">
      {children}
      {changedFields.has(fieldName) && (
        <div className="absolute -right-2 -top-2 flex items-center space-x-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
          >
            !
          </motion.div>
          <button
            type="button"
            onClick={() => resetField(fieldName)}
            className="bg-slate-500 hover:bg-slate-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
            title="Reset to original value"
          >
            <FiX className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  // Debug logging
  console.log('Current state:', {
    isLoading,
    isLoadingClients,
    hasChanges,
    changedFields: Array.from(changedFields),
    clientsCount: clients.length,
    formDataClientId: formData.clientId,
    selectedClient: selectedClient?.name
  });

 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center justify-center">
            <FiEdit3 className="mr-3 text-blue-600" />
            Edit Case
          </h1>
          <p className="text-slate-600">Modify case details and save changes</p>
          
          {hasChanges && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 flex items-center justify-center">
                <FiAlertCircle className="inline mr-2" />
                You have unsaved changes in {changedFields.size} field(s)
              </p>
            </div>
          )}

          {submitMessage && submitMessage.includes('Demo') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <FiAlertCircle className="inline mr-1" />
                {submitMessage}
              </p>
            </div>
          )}
        </motion.div>

        <div className="space-y-8">
          {/* Case Overview Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <FiFileText className="mr-3 text-blue-600" />
              Case Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderFieldWithIndicator('caseTitle', 
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Case Title *
                  </label>
                  <input
                    type="text"
                    name="caseTitle"
                    value={formData.caseTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter case title"
                    required
                  />
                </div>
              )}
              
              {renderFieldWithIndicator('priority',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option>Low Priority</option>
                    <option>Medium Priority</option>
                    <option>High Priority</option>
                    <option>Urgent</option>
                  </select>
                </div>
              )}
              
              {renderFieldWithIndicator('caseType',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Case Type *
                  </label>
                  <select
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select case type</option>
                    <option>Intellectual Property</option>
                    <option>Corporate Law</option>
                    <option>Litigation</option>
                    <option>Contract Law</option>
                    <option>Employment Law</option>
                    <option>Real Estate</option>
                    <option>Family Law</option>
                    <option>Criminal Defense</option>
                  </select>
                </div>
              )}
              
              {renderFieldWithIndicator('scheduleTime',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FiClock className="inline mr-1" />
                    Schedule Time
                  </label>
                  <input
                    type="text"
                    name="scheduleTime"
                    value={formData.scheduleTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., 9:00 AM - 12:00 PM"
                  />
                </div>
              )}
              
              {renderFieldWithIndicator('hearingDate',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FiCalendar className="inline mr-1" />
                    Hearing Date
                  </label>
                  <input
                    type="datetime-local"
                    name="hearingDate"
                    value={formData.hearingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                {renderFieldWithIndicator('location',
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <FiMapPin className="inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Client Office"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Client Selection Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <FiUser className="mr-3 text-green-600" />
              Client Information
            </h2>
            
            <div className="relative">
              {renderFieldWithIndicator('clientId',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Client *
                  </label>
                  
                  <div className="relative">
                    <div className="flex items-center">
                      <FiSearch className="absolute left-3 text-slate-400 z-10" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onFocus={() => setShowClientDropdown(true)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Search clients..."
                      />
                      <FiChevronDown 
                        className="absolute right-3 text-slate-500 cursor-pointer z-10" 
                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                      />
                    </div>
                    
                    {showClientDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {isLoadingClients ? (
                          <div className="p-4 text-center text-slate-500">Loading clients...</div>
                        ) : filteredClients.length === 0 ? (
                          <div className="p-4 text-slate-500">No clients found</div>
                        ) : (
                          filteredClients.map(client => (
                            <div
                              key={client.id}
                              className={`p-3 cursor-pointer hover:bg-slate-50 ${
                                formData.clientId === client.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => selectClient(client)}
                            >
                              <div className="font-medium text-slate-800">{client.name}</div>
                              <div className="text-sm text-slate-600">{client.email || 'No email'}</div>
                              <div className="text-xs text-slate-500 mt-1">ID: {client.id}</div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedClient && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-medium text-slate-800">Selected Client:</div>
                  <div className="flex justify-between mt-2">
                    <div>
                      <div className="font-semibold">{selectedClient.name}</div>
                      <div className="text-sm text-slate-600">{selectedClient.email}</div>
                      {selectedClient.phone && (
                        <div className="text-sm text-slate-600 mt-1">
                          <FiPhone className="inline mr-2" /> {selectedClient.phone}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">ID: {selectedClient.id}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Case Details Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <FiClock className="mr-3 text-purple-600" />
              Case Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderFieldWithIndicator('status',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option>Discovery</option>
                    <option>Investigation</option>
                    <option>Negotiation</option>
                    <option>Litigation</option>
                    <option>Settlement</option>
                    <option>Closed</option>
                  </select>
                </div>
              )}
              
              {renderFieldWithIndicator('progress',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Progress (%)
                  </label>
                  <input
                    type="range"
                    name="progress"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center mt-2 text-sm font-semibold text-slate-600">
                    {formData.progress}%
                  </div>
                </div>
              )}
              
              {renderFieldWithIndicator('documentsCount',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Documents Count
                  </label>
                  <input
                    type="number"
                    name="documentsCount"
                    value={formData.documentsCount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>
              )}
              
              {renderFieldWithIndicator('billableHours',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Billable Hours
                  </label>
                  <input
                    type="number"
                    name="billableHours"
                    value={formData.billableHours}
                    onChange={handleInputChange}
                    min="0"
                    step="0.25"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                {renderFieldWithIndicator('caseValue',
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <FiDollarSign className="inline mr-1" />
                      Case Value
                    </label>
                    <input
                      type="text"
                      name="caseValue"
                      value={formData.caseValue}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., $15,000"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              {renderFieldWithIndicator('caseDescription',
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Case Description *
                  </label>
                  <textarea
                    name="caseDescription"
                    value={formData.caseDescription}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter detailed case description..."
                    required
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Tasks & Milestones Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <FiFileText className="mr-3 text-orange-600" />
                Tasks & Milestones
                {changedFields.has('tasks') && (
                  <span className="ml-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    !
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={addTask}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="mr-2" />
                Add Task
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskComplete(task.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => handleTaskChange(task.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={`Task ${index + 1}`}
                  />
                  {formData.tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col items-center space-y-4 mt-8"
          >
            {submitMessage && !submitMessage.includes('Demo') && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full max-w-md p-4 rounded-lg flex items-center justify-center ${
                  submitMessage.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : submitMessage.includes('Error') || submitMessage.includes('Failed')
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}
              >
                <FiAlertCircle className="mr-3 flex-shrink-0" />
                <span className="text-center">{submitMessage}</span>
              </motion.div>
            )}
            
            <div className="flex justify-center space-x-4 w-full">
              <motion.button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-8 py-3 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}