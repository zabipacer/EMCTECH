import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Scale, FileText, User, Clock, Briefcase, DollarSign, MapPin, ArrowUpRight, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

// Enhanced demo cases with more details
const demoCases = [
  {
    id: 1, 
    date: '2025-08-03', 
    title: 'Contract Review',
    client: {
      name: 'ABC Corporation',
      contact: 'Sarah Johnson',
      email: 's.johnson@abccorp.com',
      phone: '(555) 123-4567'
    },
    progress: 75,
    status: 'In Review',
    priority: 'High',
    description: 'Review and finalize merger agreement terms with ABC Corporation legal team.',
    tasks: [
      { id: 1, name: 'Initial contract review', completed: true },
      { id: 2, name: 'Identify potential issues', completed: true },
      { id: 3, name: 'Client meeting', completed: true },
      { id: 4, name: 'Finalize amendments', completed: false },
      { id: 5, name: 'Client sign-off', completed: false }
    ],
    documents: 5,
    billableHours: 12.5,
    value: 8500,
    location: 'Conference Room B',
    time: '10:00 AM - 11:30 AM',
    category: 'Corporate Law'
  },
  {
    id: 2, 
    date: '2025-08-03', 
    title: 'Client Meeting',
    client: {
      name: 'Johnson Family Trust',
      contact: 'Michael Johnson',
      email: 'michael@johnsontrust.org',
      phone: '(555) 987-6543'
    },
    progress: 30,
    status: 'Preparation',
    priority: 'Medium',
    description: 'Initial consultation regarding estate planning and trust management.',
    tasks: [
      { id: 1, name: 'Gather financial documents', completed: true },
      { id: 2, name: 'Research tax implications', completed: false },
      { id: 3, name: 'Prepare draft proposal', completed: false }
    ],
    documents: 3,
    billableHours: 4.5,
    value: 2200,
    location: 'Main Office',
    time: '2:00 PM - 3:00 PM',
    category: 'Estate Planning'
  },
  {
    id: 3, 
    date: '2025-08-07', 
    title: 'Evidence Gathering',
    client: {
      name: 'Tech Innovations Inc.',
      contact: 'Robert Chen',
      email: 'r.chen@techinnovations.io',
      phone: '(555) 456-7890'
    },
    progress: 60,
    status: 'Discovery',
    priority: 'High',
    description: 'Collect and organize evidence for patent infringement case against competitor.',
    tasks: [
      { id: 1, name: 'Identify key evidence sources', completed: true },
      { id: 2, name: 'Request documentation from client', completed: true },
      { id: 3, name: 'Schedule expert depositions', completed: false },
      { id: 4, name: 'Prepare evidence log', completed: false }
    ],
    documents: 18,
    billableHours: 22.0,
    value: 15000,
    location: 'Client Office',
    time: '9:00 AM - 12:00 PM',
    category: 'Intellectual Property'
  },
];

const CaseList = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [expandedCase, setExpandedCase] = useState(null);
  
  const cases = demoCases.filter(c => c.date === date);
  
  const toggleExpand = (caseId) => {
    setExpandedCase(expandedCase === caseId ? null : caseId);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'In Review': return 'bg-blue-100 text-blue-800';
      case 'Preparation': return 'bg-amber-100 text-amber-800';
      case 'Discovery': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Back button and header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Calendar
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 ml-4">
          Case Schedule for {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h1>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Total Cases</h3>
              <p className="text-3xl font-bold text-blue-900 mt-2">{cases.length}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-purple-800">Billable Hours</h3>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {cases.reduce((sum, c) => sum + c.billableHours, 0).toFixed(1)}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-amber-800">Total Value</h3>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                ${cases.reduce((sum, c) => sum + c.value, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-amber-200 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber-700" />
            </div>
          </div>
        </div>
      </div>
      
      {cases.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
          <div className="text-gray-400 mb-4">
            <CalendarIcon className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No cases scheduled</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            You have no cases scheduled for this date. Select another date or add new cases to your calendar.
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {cases.map(c => (
            <div 
              key={c.id} 
              className={`bg-white rounded-2xl shadow-md overflow-hidden border transition-all duration-300 ${
                expandedCase === c.id 
                  ? 'border-blue-300 shadow-lg' 
                  : 'border-gray-100 hover:border-blue-200'
              }`}
            >
              {/* Case summary header */}
              <div 
                className="p-5 cursor-pointer"
                onClick={() => toggleExpand(c.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          {c.title}
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(c.priority)}`}>
                            {c.priority} Priority
                          </span>
                        </h3>
                        <p className="text-gray-600 mt-1 flex items-center">
                          <Briefcase className="w-4 h-4 mr-2" />
                          {c.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-gray-50 px-3 py-2 rounded-lg flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="font-medium">{c.time}</span>
                    </div>
                    <div className="bg-gray-50 px-3 py-2 rounded-lg flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                      <span>{c.location}</span>
                    </div>
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      {expandedCase === c.id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded details */}
              {expandedCase === c.id && (
                <div className="border-t border-gray-100 px-5 py-6 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Client info and case details */}
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          Client Information
                        </h4>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Client Name</p>
                            <p className="font-medium">{c.client.name}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Contact Person</p>
                            <p className="font-medium">{c.client.contact}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Contact Information</p>
                            <p className="font-medium">{c.client.email}</p>
                            <p className="font-medium">{c.client.phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-4">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                          <Scale className="w-5 h-5 mr-2 text-purple-600" />
                          Case Details
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className={`px-2 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(c.status)}`}>
                              {c.status}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Progress</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${c.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm font-medium mt-1">{c.progress}%</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Documents</p>
                            <p className="font-medium">{c.documents}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Billable Hours</p>
                            <p className="font-medium">{c.billableHours} hrs</p>
                          </div>
                          
                          <div className="col-span-2">
                            <p className="text-sm text-gray-500">Case Value</p>
                            <p className="text-xl font-bold text-green-700">${c.value.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle column - Description and tasks */}
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 h-full">
                        <h4 className="font-bold text-gray-800 mb-4">Case Description</h4>
                        <p className="text-gray-700 mb-6">{c.description}</p>
                        
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-800">Tasks & Milestones</h4>
                            <span className="text-sm text-gray-500">
                              {c.tasks.filter(t => t.completed).length} of {c.tasks.length} completed
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {c.tasks.map(task => (
                              <div 
                                key={task.id} 
                                className="flex items-start p-3 rounded-lg border border-gray-200"
                              >
                                {task.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 mt-0.5 flex-shrink-0"></div>
                                )}
                                <div className="flex-1">
                                  <p className={`${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                    {task.name}
                                  </p>
                                </div>
                                <button className="ml-2 text-gray-400 hover:text-gray-600">
                                  <ArrowUpRight className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Add Document
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            View Full Case File
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Log Time
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseList;