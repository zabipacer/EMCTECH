import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaBriefcase, 
  FaPlus, 
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { db } from '../../firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';

const ClientView = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientCases, setClientCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState(null);

  // Fetch all clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'clients'));
        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsData);
        setFilteredClients(clientsData);
      } catch (error) {
        console.error("Error fetching clients: ", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredClients(clients);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      (client.contactPerson && client.contactPerson.toLowerCase().includes(term)) ||
      (client.phone && client.phone.includes(term)) ||
      (client.location && client.location.toLowerCase().includes(term))
    );
    
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Fetch cases for a specific client
  const fetchClientCases = async (clientId) => {
    setLoading(true);
    try {
      const casesQuery = query(collection(db, 'cases'), where('clientId', '==', clientId));
      const querySnapshot = await getDocs(casesQuery);
      const casesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientCases(casesData);
    } catch (error) {
      console.error("Error fetching cases: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle client selection
  const handleSelectClient = async (client) => {
    if (expandedClient === client.id) {
      setExpandedClient(null);
    } else {
      setExpandedClient(client.id);
      setSelectedClient(client);
      await fetchClientCases(client.id);
    }
  };

  // Delete a client
  const handleDeleteClient = async (clientId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this client and all associated cases?')) {
      try {
        // Delete client
        await deleteDoc(doc(db, 'clients', clientId));
        
        // Delete associated cases
        const casesQuery = query(collection(db, 'cases'), where('clientId', '==', clientId));
        const querySnapshot = await getDocs(casesQuery);
        querySnapshot.forEach(async (caseDoc) => {
          await deleteDoc(doc(db, 'cases', caseDoc.id));
        });
        
        // Update state
        setClients(clients.filter(c => c.id !== clientId));
        setFilteredClients(filteredClients.filter(c => c.id !== clientId));
        
        if (selectedClient && selectedClient.id === clientId) {
          setSelectedClient(null);
          setClientCases([]);
        }
      } catch (error) {
        console.error("Error deleting client: ", error);
      }
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Client Management</h1>
          <p className="text-gray-600">View and manage all your clients and their cases</p>
        </motion.div>

        {/* Search and Controls */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search clients by name, email, or location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                <FaPlus className="mr-2" /> Add New Client
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center px-5 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                <FaBriefcase className="mr-2" /> Create Case
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-medium">Total Clients</h3>
            <p className="text-3xl font-bold mt-2">{clients.length}</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-medium">Active Cases</h3>
            <p className="text-3xl font-bold mt-2">24</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-medium">Pending Cases</h3>
            <p className="text-3xl font-bold mt-2">8</p>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-medium">Avg. Resolution</h3>
            <p className="text-3xl font-bold mt-2">3.2 days</p>
          </div>
        </motion.div>

        {/* Client List */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-12 px-6 py-4 bg-gray-50 text-gray-500 font-medium text-sm">
              <div className="col-span-5">Client</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2 text-center">Cases</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search or add a new client</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredClients.map((client) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div 
                      className={`grid grid-cols-12 px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                        expandedClient === client.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectClient(client)}
                    >
                      <div className="col-span-5 flex items-center">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">{client.name}</h3>
                          <p className="text-gray-500 text-sm">{client.email}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-3 flex items-center">
                        <div>
                          <p className="text-gray-900">{client.contactPerson || "N/A"}</p>
                          <p className="text-gray-500 text-sm">{client.phone || "No phone"}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <p className="text-gray-600">{client.location || "Location not set"}</p>
                      </div>
                      
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">
                          5 cases
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end">
                        {expandedClient === client.id ? (
                          <FaChevronUp className="text-gray-400" />
                        ) : (
                          <FaChevronDown className="text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Client Details and Cases */}
                    {expandedClient === client.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 px-6 py-4 border-t"
                      >
                        <div className="flex flex-col md:flex-row gap-8">
                          {/* Client Details */}
                          <div className="md:w-1/3">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <FaUser className="mr-2 text-blue-500" /> Client Details
                              </h3>
                              
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-gray-500">Company Name</p>
                                  <p className="font-medium">{client.name}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-500">Contact Person</p>
                                  <p className="font-medium">{client.contactPerson || "Not specified"}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-500">Email</p>
                                  <p className="font-medium flex items-center">
                                    <FaEnvelope className="mr-2 text-gray-400" /> {client.email}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-500">Phone</p>
                                  <p className="font-medium flex items-center">
                                    <FaPhone className="mr-2 text-gray-400" /> {client.phone || "Not specified"}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-500">Location</p>
                                  <p className="font-medium flex items-center">
                                    <FaMapMarkerAlt className="mr-2 text-gray-400" /> {client.location || "Not specified"}
                                  </p>
                                </div>
                                
                                <div className="flex space-x-3 mt-6">
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                  >
                                    <FaEdit className="mr-2" /> Edit Client
                                  </motion.button>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm"
                                    onClick={(e) => handleDeleteClient(client.id, e)}
                                  >
                                    <FaTrash className="mr-2" /> Delete
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Client Cases */}
                          <div className="md:w-2/3">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                  <FaBriefcase className="mr-2 text-blue-500" /> Cases
                                </h3>
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                >
                                  <FaPlus className="mr-2" /> New Case
                                </motion.button>
                              </div>
                              
                              {clientCases.length === 0 ? (
                                <div className="text-center py-12">
                                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                                  <h3 className="text-lg font-medium text-gray-900">No cases found</h3>
                                  <p className="mt-1 text-gray-500">This client doesn't have any cases yet</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {clientCases.map((caseItem) => (
                                    <motion.div
                                      key={caseItem.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium text-gray-900">{caseItem.caseTitle}</h4>
                                          <p className="text-gray-600 text-sm mt-1">Created: {new Date().toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                                          {caseItem.status || "Active"}
                                        </span>
                                      </div>
                                      
                                      <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
                                          <span className="ml-2 text-sm text-gray-600">Assigned to: John Doe</span>
                                        </div>
                                        <span className="text-sm text-gray-500">Priority: <span className="font-medium text-orange-600">High</span></span>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientView;