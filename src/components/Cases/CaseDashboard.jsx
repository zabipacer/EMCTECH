import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiFilter, 
  FiMoreVertical,
  FiUser, 
  FiPhone, 
  FiMail, 
  FiClock,
  FiDollarSign,
  FiFileText,
  FiCalendar,
  FiMapPin,
  FiCheckCircle,
  FiCircle,
  FiTrendingUp,
  FiEye,
  FiEdit,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiAlertCircle,
  FiX,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiStar,
  FiCopy,
  FiDownload,
  FiShare2,
  FiArchive,
  FiBookmark,
  FiChevronsUp,
  FiChevronsDown,
  FiMinus
} from 'react-icons/fi';
import { collection, getDocs, getFirestore, orderBy, query, onSnapshot } from 'firebase/firestore';

import CaseDetailModal from './CaseDetailModal';
import CaseCardAdvanced from './CaseCardAvanced'
import AnalyticsPanel from './AnalyticsPanel';
import { db } from '../../firebase/firebase';

export default function AdvancedCasesViewer() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('cards');
  const [error, setError] = useState('');
  const [selectedCases, setSelectedCases] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  // Analytics calculations
  const analytics = React.useMemo(() => {
    const totalCases = cases.length;
    const totalValue = cases.reduce((sum, c) => {
      const value = parseFloat(c.caseValue?.replace(/[$,]/g, '') || 0);
      return sum + value;
    }, 0);
    const totalHours = cases.reduce((sum, c) => sum + (parseFloat(c.billableHours) || 0), 0);
    const avgProgress = totalCases > 0 ? cases.reduce((sum, c) => sum + (c.progress || 0), 0) / totalCases : 0;
    
    const statusCounts = cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    
    const priorityCounts = cases.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {});
    
    const typeCounts = cases.reduce((acc, c) => {
      acc[c.caseType] = (acc[c.caseType] || 0) + 1;
      return acc;
    }, {});

    return {
      totalCases,
      totalValue,
      totalHours,
      avgProgress: Math.round(avgProgress),
      statusCounts,
      priorityCounts,
      typeCounts,
      highPriorityCases: cases.filter(c => c.priority === 'High Priority' || c.priority === 'Urgent').length,
      completedTasks: cases.reduce((sum, c) => sum + (c.completedTasks || 0), 0),
      totalTasks: cases.reduce((sum, c) => sum + (c.totalTasks || 0), 0)
    };
  }, [cases]);

  useEffect(() => {
    let unsubscribe;
    
    if (realtimeEnabled) {
      unsubscribe = setupRealtimeListener();
    } else {
      fetchCases();
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [realtimeEnabled]);

  const setupRealtimeListener = () => {
    if (!db) {
      setError("Firebase not configured");
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const q = query(collection(db, 'cases'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const casesData = [];
      snapshot.forEach((doc) => {
        casesData.push({ id: doc.id, ...doc.data() });
      });
      
      setCases(casesData);
      setLoading(false);
      setError('');
    }, (error) => {
      console.error("Real-time listener error:", error);
      setError(`Real-time updates failed: ${error.message}`);
      setLoading(false);
    });

    return unsubscribe;
  };

  const fetchCases = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (db) {
        const q = query(collection(db, 'cases'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const casesData = [];
        querySnapshot.forEach((doc) => {
          casesData.push({ id: doc.id, ...doc.data() });
        });
        
        setCases(casesData);
        
        if (casesData.length === 0) {
          setError("No cases found in database. Add some cases first.");
        }
      } else {
        setError("Firebase not configured. Please add your Firebase configuration.");
        setCases([]);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      setError(`Failed to load cases: ${error.message}`);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCases = cases
    .filter(caseItem => {
      const matchesSearch = caseItem.caseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           caseItem.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           caseItem.caseType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           caseItem.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || caseItem.status === filterStatus;
      const matchesPriority = filterPriority === 'All' || caseItem.priority === filterPriority;
      const matchesType = filterType === 'All' || caseItem.caseType === filterType;
      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'caseTitle':
          comparison = (a.caseTitle || '').localeCompare(b.caseTitle || '');
          break;
        case 'clientName':
          comparison = (a.clientName || '').localeCompare(b.clientName || '');
          break;
        case 'priority':
          const priorityOrder = { 'Urgent': 4, 'High Priority': 3, 'Medium Priority': 2, 'Low Priority': 1 };
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        case 'progress':
          comparison = (b.progress || 0) - (a.progress || 0);
          break;
        case 'caseValue':
          const aValue = parseFloat(a.caseValue?.replace(/[$,]/g, '') || 0);
          const bValue = parseFloat(b.caseValue?.replace(/[$,]/g, '') || 0);
          comparison = bValue - aValue;
          break;
        case 'updatedAt':
        default:
          comparison = new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const toggleCaseSelection = (caseId) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Legal Cases Dashboard</h1>
          <p className="text-slate-600">Manage and track your legal cases efficiently</p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases, clients, or keywords..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters and View Toggles */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="relative">
                <select
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Discovery">Discovery</option>
                  <option value="Investigation">Investigation</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Litigation">Litigation</option>
                  <option value="Settlement">Settlement</option>
                  <option value="Closed">Closed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                  <FiFilter />
                </div>
              </div>

              {/* Priority Filter */}
              <div className="relative">
                <select
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High Priority">High Priority</option>
                  <option value="Medium Priority">Medium Priority</option>
                  <option value="Low Priority">Low Priority</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                  <FiFilter />
                </div>
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Criminal Defense">Criminal Defense</option>
                  <option value="Personal Injury">Personal Injury</option>
                  <option value="Family Law">Family Law</option>
                  <option value="Corporate Law">Corporate Law</option>
                  <option value="Intellectual Property">Intellectual Property</option>
                  <option value="Real Estate">Real Estate</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                  <FiFilter />
                </div>
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="updatedAt">Sort by: Recent</option>
                  <option value="caseTitle">Sort by: Case Title</option>
                  <option value="clientName">Sort by: Client Name</option>
                  <option value="priority">Sort by: Priority</option>
                  <option value="progress">Sort by: Progress</option>
                  <option value="caseValue">Sort by: Case Value</option>
                </select>
              </div>

              {/* View Toggles */}
              <div className="flex gap-2">
                <button
                  className={`p-2 rounded-lg ${
                    viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}
                  onClick={() => setViewMode('cards')}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded-lg ${
                    viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}
                  onClick={() => setViewMode('table')}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <FiBarChart />
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>
            
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                realtimeEnabled 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
            >
              <FiRefreshCw className={`${realtimeEnabled ? 'animate-spin' : ''}`} />
              {realtimeEnabled ? 'Realtime: ON' : 'Realtime: OFF'}
            </button>
            
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={fetchCases}
              disabled={realtimeEnabled}
            >
              <FiRefreshCw />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Analytics Panel */}
        <AnimatePresence>
          {showAnalytics && <AnalyticsPanel analytics={analytics} />}
        </AnimatePresence>

        {/* Loading & Error States */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2 text-xl" />
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cases Display */}
        {!loading && !error && (
          <div>
            {/* Summary Bar */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-700">
                Showing <span className="font-bold">{filteredAndSortedCases.length}</span> of{' '}
                <span className="font-bold">{cases.length}</span> cases
              </div>
              {selectedCases.length > 0 && (
                <div className="text-blue-600 font-medium">
                  {selectedCases.length} case{selectedCases.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Cards View */}
            {viewMode === 'cards' && (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {filteredAndSortedCases.map((caseItem) => (
                    <motion.div
                      layout
                      key={caseItem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleCaseSelect(caseItem)}
                      className="cursor-pointer"
                    >
                      <CaseCardAdvanced caseItem={caseItem} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={selectedCases.length === filteredAndSortedCases.length && filteredAndSortedCases.length > 0}
                            onChange={() => {
                              if (selectedCases.length === filteredAndSortedCases.length) {
                                setSelectedCases([]);
                              } else {
                                setSelectedCases(filteredAndSortedCases.map(c => c.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Case Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Updated
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      <AnimatePresence>
                        {filteredAndSortedCases.map((caseItem) => (
                          <motion.tr
                            key={caseItem.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleCaseSelect(caseItem)}
                            className="cursor-pointer hover:bg-slate-50"
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedCases.includes(caseItem.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleCaseSelection(caseItem.id);
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <FiFileText className="text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-slate-900">{caseItem.caseTitle}</div>
                                  <div className="text-sm text-slate-500">{caseItem.clientName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <PriorityBadge priority={caseItem.priority} />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <StatusBadge status={caseItem.status} />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-slate-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${caseItem.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-slate-700">{caseItem.progress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {caseItem.caseValue || 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                              {new Date(caseItem.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <FiEdit />
                              </button>
                              <button className="text-slate-600 hover:text-slate-900">
                                <FiMoreVertical />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredAndSortedCases.length === 0 && !loading && !error && (
              <div className="text-center py-16">
                <FiFileText className="mx-auto text-slate-300 text-5xl mb-4" />
                <h3 className="text-xl font-medium text-slate-700 mb-2">No cases found</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Try adjusting your filters or search terms. There are no cases matching your criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      <AnimatePresence>
        {selectedCase && (
          <CaseDetailModal 
            caseItem={selectedCase} 
            onClose={() => setSelectedCase(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper components for badges
const PriorityBadge = ({ priority }) => {
  let bgColor, textColor;
  
  switch (priority) {
    case 'Urgent':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'High Priority':
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      break;
    case 'Medium Priority':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'Low Priority':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    default:
      bgColor = 'bg-slate-100';
      textColor = 'text-slate-800';
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  let bgColor, textColor;
  
  switch (status) {
    case 'Open':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'Closed':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'Pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'In Review':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    default:
      bgColor = 'bg-slate-100';
      textColor = 'text-slate-800';
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};