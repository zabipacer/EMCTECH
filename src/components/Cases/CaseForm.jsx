import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiFileText, 
  FiClock, 
  FiDollarSign,
  FiCalendar,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiSave,
  FiAlertCircle,
  FiChevronDown,
  FiSearch
} from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { addDoc, collection, getDocs } from 'firebase/firestore';

export default function CaseForm() {
  const [formData, setFormData] = useState({
    caseTitle: '',
    priority: 'Medium Priority',
    caseType: 'Criminal', // Set to Criminal as requested
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
    ],
    // New fields added here
    caseNumber: '01/2025',
    onBehalfOf: 'Accused',
    partyName: 'Zohaib',
    complainantName: 'State',
    adjournDate: '17/08/2025',
    underSection: '489 F'
  });

  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Fetch clients from Firestore
  useEffect(() => {
    const fetchClients = async () => {
      try {
        if (db) {
          const querySnapshot = await getDocs(collection(db, 'clients'));
          const clientsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setClients(clientsData);
        } else {
          // Mock data for demo
          setClients([
            { id: 'client_ABC123', name: 'Acme Corp', email: 'contact@acme.com' },
            { id: 'client_DEF456', name: 'Globex Inc', email: 'info@globex.com' },
            { id: 'client_XYZ789', name: 'Wayne Enterprises', email: 'support@wayne.com' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setSubmitMessage('Failed to load clients');
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id ? { ...task, text: value } : task
      )
    }));
  };

  const toggleTaskComplete = (id) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const addTask = () => {
    const newId = Math.max(0, ...formData.tasks.map(t => t.id)) + 1;
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: newId, text: '', completed: false }]
    }));
  };

  const removeTask = (id) => {
    if (formData.tasks.length > 1) {
      setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id)
      }));
    }
  };

  const selectClient = (client) => {
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setShowClientDropdown(false);
    setClientSearch(client.name);
  };

  const validateForm = () => {
    const required = ['caseTitle', 'caseType', 'clientId', 'caseDescription'];
    return required.every(field => formData[field].trim() !== '');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitMessage('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for Firebase
      const caseData = {
        caseTitle: formData.caseTitle,
        caseDescription: formData.caseDescription,
        caseType: formData.caseType,
        caseValue: formData.caseValue,
        billableHours: parseFloat(formData.billableHours) || 0,
        documentsCount: parseInt(formData.documentsCount) || 0,
        location: formData.location,
        priority: formData.priority,
        progress: parseInt(formData.progress),
        scheduleTime: formData.scheduleTime,
        hearingDate: formData.hearingDate,
        status: formData.status,
        tasks: formData.tasks,
        clientId: formData.clientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedTasks: formData.tasks.filter(task => task.completed).length,
        totalTasks: formData.tasks.length,
        // Add new fields to Firestore document
        caseNumber: formData.caseNumber,
        onBehalfOf: formData.onBehalfOf,
        partyName: formData.partyName,
        complainantName: formData.complainantName,
        adjournDate: formData.adjournDate,
        underSection: formData.underSection
      };
      
      if (db) {
        const docRef = await addDoc(collection(db, 'cases'), caseData);
        setSubmitMessage(`Case created successfully! Case ID: ${docRef.id}`);
      } else {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSubmitMessage('Case created successfully! (Demo mode)');
      }
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          caseTitle: '',
          priority: 'Medium Priority',
          caseType: 'Criminal',
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
          ],
          // Reset new fields with default values
          caseNumber: '01/2025',
          onBehalfOf: 'Accused',
          partyName: 'Zohaib',
          complainantName: 'State',
          adjournDate: '17/08/2025',
          underSection: '489 F'
        });
        setClientSearch('');
        setSubmitMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error creating case:', error);
      setSubmitMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter clients based on search
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(clientSearch.toLowerCase()))
  );

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

  // Find selected client for display
  const selectedClient = clients.find(c => c.id === formData.clientId);

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
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Add New Case</h1>
          <p className="text-slate-600">Enter case details to create a new legal matter</p>
          {!db && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <FiAlertCircle className="inline mr-1" />
                Demo mode: Replace Firebase config to enable real database saving
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
              {/* New Case Number Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Case Number *
                </label>
                <input
                  type="text"
                  name="caseNumber"
                  value={formData.caseNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., 01/2025"
                  required
                />
              </div>
              
              {/* Case Type is now set to Criminal by default */}
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
                  <option value="Criminal">Criminal</option>
                  <option>Intellectual Property</option>
                  <option>Corporate Law</option>
                  <option>Litigation</option>
                  <option>Contract Law</option>
                  <option>Employment Law</option>
                  <option>Real Estate</option>
                  <option>Family Law</option>
                </select>
              </div>
              
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
              
              {/* New On Behalf Of Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  On Behalf Of *
                </label>
                <select
                  name="onBehalfOf"
                  value={formData.onBehalfOf}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="Accused">Accused</option>
                  <option value="Plaintiff">Plaintiff</option>
                  <option value="Defendant">Defendant</option>
                  <option value="Petitioner">Petitioner</option>
                </select>
              </div>
              
              {/* New Party Name Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Party Name *
                </label>
                <input
                  type="text"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Zohaib"
                  required
                />
              </div>
              
              {/* New Complainant Name Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Complainant Name *
                </label>
                <input
                  type="text"
                  name="complainantName"
                  value={formData.complainantName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., State"
                  required
                />
              </div>
              
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
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <FiCalendar className="inline mr-1" />
                  Hearing Date *
                </label>
                <input
                  type="datetime-local"
                  name="hearingDate"
                  value={formData.hearingDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              {/* New Adjourn Date Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <FiCalendar className="inline mr-1" />
                  Adjourn Date *
                </label>
                <input
                  type="text"
                  name="adjournDate"
                  value={formData.adjournDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., 17/08/2025"
                  required
                />
              </div>
              
              {/* New U/Sec Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  U/Sec or Nature of Suit *
                </label>
                <input
                  type="text"
                  name="underSection"
                  value={formData.underSection}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., 489 F"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
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
            </div>
          </motion.div>

          {/* Client Selection Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <FiUser className="mr-3 text-green-600" />
              Select Client
            </h2>
            
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Client *
              </label>
              
              <div className="relative">
                <div className="flex items-center">
                  <FiSearch className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    onFocus={() => setShowClientDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Search clients..."
                  />
                  <FiChevronDown 
                    className="absolute right-3 text-slate-500 cursor-pointer" 
                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                  />
                </div>
                
                {showClientDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
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
              
              <div className="md:col-span-2">
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
            </div>
            
            <div className="mt-6">
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
          </motion.div>

          {/* Tasks & Milestones Section */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <FiFileText className="mr-3 text-orange-600" />
                Tasks & Milestones
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

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="text-center">
            {submitMessage && (
              <div className={`mb-4 p-4 rounded-lg flex items-center justify-center ${
                submitMessage.includes('successfully') 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <FiAlertCircle className="mr-2" />
                {submitMessage}
              </div>
            )}
            
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center mx-auto ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Case...
                </>
              ) : (
                <>
                  <FiSave className="mr-3" />
                  Create Case
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}