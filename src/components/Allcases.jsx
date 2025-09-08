import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFileText, 
  FiDownload,
  FiFilter,
  FiChevronDown,
  FiCheckSquare,
  FiSquare,
  FiPrinter,
  FiX,
  FiCalendar,
  FiUser,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiBook,
  FiInfo
} from 'react-icons/fi';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function AllCasesPage() {
  const [cases, setCases] = useState([]);
  const [courts, setCourts] = useState({}); // Store courts by ID
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCases, setSelectedCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);

  // Function to extract court name from case data
  const getCourtName = (caseData) => {
    // If court is embedded in case data
    if (caseData.court) {
      if (typeof caseData.court === 'string') return caseData.court;
      if (typeof caseData.court === 'object') {
        return caseData.court.name || caseData.court.courtName || caseData.court.title || 'No Court Assigned';
      }
    }
    
    // If court is referenced by ID
    if (caseData.courtId && courts[caseData.courtId]) {
      return courts[caseData.courtId].name || 'No Court Assigned';
    }
    
    return 'No Court Assigned';
  };

  // Function to extract court district from case data
  const getCourtDistrict = (caseData) => {
    // If court is embedded in case data
    if (caseData.court && typeof caseData.court === 'object') {
      return caseData.court.district || caseData.court.city || 'N/A';
    }
    
    // If court is referenced by ID
    if (caseData.courtId && courts[caseData.courtId]) {
      return courts[caseData.courtId].district || 'N/A';
    }
    
    return 'N/A';
  };

  // Fetch cases and courts from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch courts first
        const courtsSnapshot = await getDocs(collection(db, 'courts'));
        const courtsData = {};
        
        courtsSnapshot.forEach((doc) => {
          courtsData[doc.id] = doc.data();
        });
        
        setCourts(courtsData);
        
        // Fetch cases
        const querySnapshot = await getDocs(collection(db, 'cases'));
        const casesData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          casesData.push({
            id: doc.id,
            caseNumber: data.caseNumber || 'N/A',
            caseTitle: data.caseTitle || 'Untitled Case',
            partyName: data.partyName || 'Unknown Party',
            complainantName: data.complainantName || 'Unknown Complainant',
            hearingDate: data.hearingDate || null,
            adjournDate: data.adjournDate || null,
            adjournHistory: data.adjournHistory || [],
            caseStage: data.caseStage || 'Unknown Stage',
            progress: data.progress || 0,
            status: data.status || 'pending',
            underSection: data.underSection || 'N/A',
            location: data.location || 'Unknown Location',
            caseValue: data.caseValue || 'N/A',
            createdAt: data.createdAt || new Date().toISOString(),
            caseDescription: data.caseDescription || 'No description available',
            onBehalfOf: data.onBehalfOf || 'N/A',
            clientId: data.clientId || 'N/A',
            courtId: data.courtId || null,
            court: data.court || null,
            courtName: getCourtName(data),
            courtDistrict: getCourtDistrict(data)
          });
        });
        
        setCases(casesData);
        setFilteredCases(casesData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter cases based on search term and status
  useEffect(() => {
    let results = cases;
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(caseItem => 
        caseItem.caseNumber.toLowerCase().includes(lowerSearchTerm) ||
        caseItem.caseTitle.toLowerCase().includes(lowerSearchTerm) ||
        caseItem.partyName.toLowerCase().includes(lowerSearchTerm) ||
        caseItem.complainantName.toLowerCase().includes(lowerSearchTerm) ||
        caseItem.caseStage.toLowerCase().includes(lowerSearchTerm) ||
        caseItem.courtName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      results = results.filter(caseItem => caseItem.status === selectedStatus);
    }
    
    setFilteredCases(results);
  }, [searchTerm, selectedStatus, cases]);

  // Handle case selection
  const toggleCaseSelection = (caseId) => {
    if (selectedCases.includes(caseId)) {
      setSelectedCases(selectedCases.filter(id => id !== caseId));
    } else {
      setSelectedCases([...selectedCases, caseId]);
    }
  };

  // Select all filtered cases
  const selectAllCases = () => {
    if (selectedCases.length === filteredCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(filteredCases.map(c => c.id));
    }
  };

  // View case details
  const viewCaseDetails = (caseItem) => {
    setSelectedCase(caseItem);
    setShowCaseModal(true);
  };

  // Export selected cases as PDF
  const exportSelectedCases = () => {
    if (selectedCases.length === 0) {
      alert('Please select at least one case to export.');
      return;
    }
    
    const doc = new jsPDF();
    const selectedCasesData = cases.filter(caseItem => selectedCases.includes(caseItem.id));
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Case Report', 105, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    // Add table using autoTable plugin with court information
    autoTable(doc, {
      startY: 30,
      head: [['Case Number', 'Title', 'Court', 'Parties', 'Stage', 'Status', 'Hearing Date']],
      body: selectedCasesData.map(caseItem => [
        caseItem.caseNumber,
        caseItem.caseTitle,
        caseItem.courtName,
        `${caseItem.partyName} vs ${caseItem.complainantName}`,
        caseItem.caseStage,
        caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1),
        caseItem.hearingDate ? new Date(caseItem.hearingDate).toLocaleDateString() : 'Not scheduled'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    // Save the PDF
    doc.save('case-report.pdf');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">All Cases</h1>
          <p className="text-slate-600">Manage and review all legal cases</p>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases by number, title, party, court, or stage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <FiFilter />
                Filters
                <FiChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <button 
                onClick={exportSelectedCases}
                disabled={selectedCases.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCases.length > 0 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <FiDownload />
                Export PDF
              </button>
            </div>
          </div>
          
          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-200"
              >
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Filter by Status</h3>
                <div className="flex flex-wrap gap-3">
                  {['all', 'active', 'closed', 'pending'].map(status => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1 rounded-full text-sm capitalize ${
                        selectedStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Cases Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-left">
                    <div className="flex items-center">
                      <button onClick={selectAllCases} className="mr-2">
                        {selectedCases.length === filteredCases.length && filteredCases.length > 0 ? (
                          <FiCheckSquare className="text-blue-600" />
                        ) : (
                          <FiSquare className="text-slate-400" />
                        )}
                      </button>
                      Case Details
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left">Court</th>
                  <th className="py-4 px-6 text-left">Stage</th>
                  <th className="py-4 px-6 text-left">Hearing Date</th>
                  <th className="py-4 px-6 text-left">Progress</th>
                  <th className="py-4 px-6 text-left">Status</th>
                  <th className="py-4 px-6 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.length > 0 ? (
                  filteredCases.map((caseItem) => (
                    <tr 
                      key={caseItem.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-start">
                          <button 
                            onClick={() => toggleCaseSelection(caseItem.id)}
                            className="mr-3 mt-1"
                          >
                            {selectedCases.includes(caseItem.id) ? (
                              <FiCheckSquare className="text-blue-600" />
                            ) : (
                              <FiSquare className="text-slate-400" />
                            )}
                          </button>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {caseItem.caseNumber} - {caseItem.caseTitle}
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              <span className="font-medium">Party:</span> {caseItem.partyName}
                            </div>
                            <div className="text-sm text-slate-600">
                              <span className="font-medium">Complainant:</span> {caseItem.complainantName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-700 font-medium">{caseItem.courtName}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-700">{caseItem.caseStage}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-700">
                          {formatDate(caseItem.hearingDate)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-600">Progress</span>
                            <span className="text-xs font-medium text-slate-700">{caseItem.progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${caseItem.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClass(caseItem.status)}`}>
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => viewCaseDetails(caseItem)}
                          className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          <FiFileText />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 px-6 text-center">
                      <FiFileText className="mx-auto text-slate-400 text-4xl mb-3" />
                      <p className="text-slate-600">No cases found matching your search criteria.</p>
                      {searchTerm && (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedStatus('all');
                          }}
                          className="mt-3 text-blue-600 hover:underline"
                        >
                          Clear search and filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          {filteredCases.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div className="text-sm text-slate-600">
                {selectedCases.length > 0 ? (
                  <span>{selectedCases.length} of {filteredCases.length} selected</span>
                ) : (
                  <span>Showing {filteredCases.length} cases</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={exportSelectedCases}
                  disabled={selectedCases.length === 0}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                    selectedCases.length > 0 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <FiDownload size={14} />
                  Export Selected
                </button>
                
                <button className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">
                  <FiPrinter size={14} />
                  Print All
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Case Details Modal */}
      <AnimatePresence>
        {showCaseModal && selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Case Details</h2>
                <button 
                  onClick={() => setShowCaseModal(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FiInfo className="text-blue-600" />
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Case Number:</span>
                        <p className="text-slate-800">{selectedCase.caseNumber}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Case Title:</span>
                        <p className="text-slate-800">{selectedCase.caseTitle}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Court:</span>
                        <p className="text-slate-800">{selectedCase.courtName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Court District:</span>
                        <p className="text-slate-800">{selectedCase.courtDistrict}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Case Stage:</span>
                        <p className="text-slate-800">{selectedCase.caseStage}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Under Section:</span>
                        <p className="text-slate-800">{selectedCase.underSection}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FiUser className="text-blue-600" />
                      Parties Involved
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Party Name:</span>
                        <p className="text-slate-800">{selectedCase.partyName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Complainant Name:</span>
                        <p className="text-slate-800">{selectedCase.complainantName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">On Behalf Of:</span>
                        <p className="text-slate-800">{selectedCase.onBehalfOf}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FiCalendar className="text-blue-600" />
                      Dates & Status
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Hearing Date:</span>
                        <p className="text-slate-800">{formatDate(selectedCase.hearingDate)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Adjourn Date:</span>
                        <p className="text-slate-800">{formatDate(selectedCase.adjournDate)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Status:</span>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClass(selectedCase.status)}`}>
                          {selectedCase.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Progress:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${selectedCase.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-slate-700">{selectedCase.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FiMapPin className="text-blue-600" />
                      Additional Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Location:</span>
                        <p className="text-slate-800">{selectedCase.location}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Case Value:</span>
                        <p className="text-slate-800">{selectedCase.caseValue}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Client ID:</span>
                        <p className="text-slate-800">{selectedCase.clientId}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FiBook className="text-blue-600" />
                    Case Description
                  </h3>
                  <p className="text-slate-700">{selectedCase.caseDescription}</p>
                </div>
                
                {selectedCase.adjournHistory && selectedCase.adjournHistory.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FiClock className="text-blue-600" />
                      Adjournment History
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Date</th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Reason</th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Updated At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCase.adjournHistory.map((adjourn, index) => (
                            <tr key={index} className="border-b border-slate-100 last:border-b-0">
                              <td className="py-2 px-3 text-sm text-slate-700">{adjourn.date}</td>
                              <td className="py-2 px-3 text-sm text-slate-700">{adjourn.reason}</td>
                              <td className="py-2 px-3 text-sm text-slate-700">{formatDate(adjourn.updatedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end">
                <button
                  onClick={() => setShowCaseModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}