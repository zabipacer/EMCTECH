import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiFileText, 
  FiCalendar,
  FiMapPin,
  FiSave,
  FiAlertCircle,
  FiChevronDown,
  FiSearch,
  FiDollarSign,
  FiChevronLeft,
  FiX,
  FiGitlab
} from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditCaseForm() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [formData, setFormData] = useState({
    caseNumber: '',
    caseTitle: '',
    partyName: '',
    complainantName: '',
    location: '',
    adjournDate: '',
    hearingDate: '',
    underSection: '',
    caseDescription: '',
    onBehalfOf: '',
    caseStage: '',
    clientId: '',
    progress: 0,
    caseValue: '',
    caseType: '',
    court: ''   // Changed from courtId to court (string)
  });

  const [clients, setClients] = useState([]);
  const [courts, setCourts] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [courtSearch, setCourtSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const onBehalfOfOptions = [
    'plaintiff','complainant','respondent','opponent','applicant','appellant',
    'intervener','official witness','defendant','petitioner','judgment debtor',
    'decree holder','other'
  ];

  const caseStageOptions = [
    'notice','adv to be heard','appearance of defendant','repeat notice','publication',
    'written statement','hearing','objection','evidence','framing of charge','arguments',
    'statement of accused','trail','order','judgement','other'
  ];

  const caseTypeOptions = [
    'FC suit','Banking suit','criminal case','criminal bail application','Revision application',
    'civil appeal','criminal appeal','family suit','guardian case','summary suit','session case',
    'direct complain','petition','banking execution','other'
  ];

  // Fetch case, clients and courts
  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        if (db && caseId) {
          const caseDoc = await getDoc(doc(db, 'cases', caseId));
          if (caseDoc.exists()) {
            const caseData = caseDoc.data();
            setFormData(prev => ({
              ...prev,
              ...caseData
            }));

            // prefill client name
            if (caseData.clientId) {
              const clientDoc = await getDoc(doc(db, 'clients', caseData.clientId));
              if (clientDoc.exists()) {
                setClientSearch(clientDoc.data().name);
              }
            }

            // prefill court name
            if (caseData.court) {
              setCourtSearch(caseData.court);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching case:', error);
        setSubmitMessage('Failed to load case data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clients'));
        const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setSubmitMessage('Failed to load clients');
      } finally {
        setIsLoadingClients(false);
      }
    };

    const fetchCourts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'courts'));
        const courtsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourts(courtsData);
      } catch (error) {
        console.error('Error fetching courts:', error);
        setSubmitMessage('Failed to load courts');
      } finally {
        setIsLoadingCourts(false);
      }
    };

    fetchCaseData();
    fetchClients();
    fetchCourts();
  }, [caseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectClient = (client) => {
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const handleCourtInput = (e) => {
    const value = e.target.value;
    setCourtSearch(value);
    setFormData(prev => ({ ...prev, court: value }));
    setShowCourtDropdown(value.length > 0);
  };

  const selectCourt = (court) => {
    setFormData(prev => ({ ...prev, court: court.name }));
    setCourtSearch(court.name);
    setShowCourtDropdown(false);
  };

  const clearCourt = () => {
    setFormData(prev => ({ ...prev, court: '' }));
    setCourtSearch('');
    setShowCourtDropdown(false);
  };

  const validateForm = () => {
    const required = [
      'caseNumber','caseTitle','partyName','complainantName',
      'adjournDate','hearingDate','underSection','caseDescription',
      'onBehalfOf','caseStage','clientId','caseType','court' // Changed from courtId to court
    ];
    return required.every(field => {
      const value = formData[field];
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitMessage('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const caseData = {
        ...formData,
        progress: parseInt(formData.progress) || 0,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'cases', caseId), caseData);
      setSubmitMessage('Case updated successfully!');
      setTimeout(() => navigate('/cases'), 2000);
    } catch (error) {
      console.error('Error updating case:', error);
      setSubmitMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const filteredCourts = courts.filter(court => 
    (court.name || '').toLowerCase().includes(courtSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === formData.clientId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-6">Edit Case</h1>

        {/* COURT SELECTION - Updated to match CaseForm */}
        <div className="relative mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FiGitlab /> Court *
          </label>
          <div className="relative">
            <input
              type="text"
              value={courtSearch}
              onChange={handleCourtInput}
              onFocus={() => setShowCourtDropdown(true)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
              placeholder="Search courts..."
              required
            />
            {courtSearch && (
              <button
                type="button"
                onClick={clearCourt}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX />
              </button>
            )}
          </div>

          {showCourtDropdown && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {isLoadingCourts ? (
                <div className="p-4 text-center text-slate-500">Loading courts...</div>
              ) : filteredCourts.length === 0 ? (
                <div className="p-4 text-slate-500">No courts found</div>
              ) : (
                filteredCourts.map(court => (
                  <div
                    key={court.id}
                    className={`p-3 cursor-pointer hover:bg-slate-50 ${
                      formData.court === court.name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => selectCourt(court)}
                  >
                    <div className="font-medium text-slate-800">{court.name}</div>
                    {court.district && (
                      <div className="text-sm text-slate-600">{court.district}</div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>

        {/* Rest of the form fields */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <FiFileText className="mr-3 text-blue-600" />
            Case Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Party Name *
              </label>
              <input
                type="text"
                name="partyName"
                value={formData.partyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter party name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Complainant Name
              </label>
              <input
                type="text"
                name="complainantName"
                value={formData.complainantName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter complainant name"
              />
            </div>
            
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
                <option value="">Select an option</option>
                {onBehalfOfOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Case Stage *
              </label>
              <select
                name="caseStage"
                value={formData.caseStage}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Select an option</option>
                {caseStageOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
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
                <option value="">Select an option</option>
                {caseTypeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
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
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <FiCalendar className="inline mr-1" />
                Adjourn Date *
              </label>
              <input
                type="date"
                name="adjournDate"
                value={formData.adjournDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Under Section / Nature of Suit *
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
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Case Value
              </label>
              <input
                type="text"
                name="caseValue"
                value={formData.caseValue}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter case value"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Case Progress (%)
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
          </div>
        </div>

        {/* Client Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <FiUser className="mr-3 text-green-600" />
            Select Client (optional)
          </h2>
          
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Client
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
                  </div>
                  <div className="text-xs text-slate-500">ID: {selectedClient.id}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Case Description */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <FiFileText className="mr-3 text-purple-600" />
            Case Description
          </h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Case Description
            </label>
            <textarea
              name="caseDescription"
              value={formData.caseDescription}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter detailed case description..."
            />
          </div>
        </div>

        <div className="text-center">
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
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center mx-auto ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Updating Case...
              </>
            ) : (
              <>
                <FiSave className="mr-3" />
                Update Case
              </>
            )}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-8 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-all duration-200 flex items-center justify-center mx-auto cursor-pointer"
          >
            <FiChevronLeft className="mr-1" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}