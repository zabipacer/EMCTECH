// LegalCalendar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Scale, Filter, Clock } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';

const LegalCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsData, setEventsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaseType, setSelectedCaseType] = useState('All');
  const [availableCaseTypes, setAvailableCaseTypes] = useState(['All']);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Helper function to parse hearingDate
  const parseHearingDate = (docData) => {
    const dates = [];
    
    if (docData.hearingDate) {
      const date = new Date(docData.hearingDate);
      if (!isNaN(date.getTime())) {
        dates.push({date, type: 'hearing', caseData: docData});
      }
    }
    
    if (docData.caseDate) {
      if (typeof docData.caseDate === 'object' && typeof docData.caseDate.toDate === 'function') {
        dates.push({date: docData.caseDate.toDate(), type: 'hearing', caseData: docData});
      } else {
        const date = new Date(docData.caseDate);
        if (!isNaN(date.getTime())) {
          dates.push({date, type: 'hearing', caseData: docData});
        }
      }
    }
    
    if (Array.isArray(docData.hearingDates)) {
      docData.hearingDates.forEach(dateStr => {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          dates.push({date, type: 'hearing', caseData: docData});
        }
      });
    }
    
    return dates;
  };

  // Helper function to parse adjournment history
  const parseAdjournmentDates = (docData) => {
    const dates = [];
    
    if (Array.isArray(docData.adjournHistory)) {
      docData.adjournHistory.forEach(adjourn => {
        if (adjourn.date) {
          const date = new Date(adjourn.date);
          if (!isNaN(date.getTime())) {
            dates.push({
              date, 
              type: 'adjournment', 
              caseData: docData,
              reason: adjourn.reason
            });
          }
        }
      });
    }
    
    return dates;
  };

  // Filter events by type
  const filterEventsByType = (events) => {
    if (selectedCaseType === 'All') return events;
    return events.filter(event => event.caseData.caseType === selectedCaseType);
  };

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);
      
      try {
        const userDocRef = doc(db, 'Users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().role || 'user');
        } else {
          setUserRole('user');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setUserRole('user');
      }
    };

    fetchUserRole();
  }, []);

  // Fetch cases based on user role
  useEffect(() => {
    if (!userRole || !currentUser) return;
    
    setLoading(true);
    setError(null);

    const fetchAndFilterCases = async () => {
      try {
        const casesCol = collection(db, 'cases');
        let q = query(casesCol, orderBy('createdAt', 'desc'), limit(2000));
        
        // Add assignment filter for regular users
        if (userRole === 'user') {
          q = query(q, where('assignedTo', 'array-contains', currentUser.uid));
        }

        const snapshot = await getDocs(q);
        const allCases = [];
        const caseTypes = new Set(['All']);
        
        snapshot.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          
          // Skip cases not assigned to user (if user role)
          if (userRole === 'user' && 
              (!data.assignedTo || !data.assignedTo.includes(currentUser.uid))) {
            return;
          }
          
          allCases.push(data);
          if (data.caseType) caseTypes.add(data.caseType);
        });

        setAvailableCaseTypes(Array.from(caseTypes));
        const dayEvents = {};

        allCases.forEach(caseDoc => {
          // Parse hearing dates
          const hearingDates = parseHearingDate(caseDoc);
          
          // Parse adjournment dates
          const adjournmentDates = parseAdjournmentDates(caseDoc);
          
          // Combine all events
          const allEvents = [...hearingDates, ...adjournmentDates];
          
          allEvents.forEach(event => {
            if (!event.date) return;
            
            if (event.date.getFullYear() === currentDate.getFullYear() && 
                event.date.getMonth() === currentDate.getMonth()) {
              
              const day = event.date.getDate();
              
              if (!dayEvents[day]) dayEvents[day] = [];
              dayEvents[day].push(event);
            }
          });
        });

        setEventsData(dayEvents);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError('Failed to load cases');
        setLoading(false);
      }
    };

    fetchAndFilterCases();
  }, [currentDate, userRole, currentUser]);

  // Calendar helper functions
  const getDaysInMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigateMonth = dir => setCurrentDate(prev => {
    const d = new Date(prev);
    d.setMonth(prev.getMonth() + dir);
    return d;
  });

  const handleDateClick = day => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${currentDate.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
    navigate(`/cases/${dateStr}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-20 md:h-24 border border-gray-100 bg-gray-50/30"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = eventsData[day] || [];
      const filteredEvents = filterEventsByType(dayEvents);
      
      const hearings = filteredEvents.filter(e => e.type === 'hearing');
      const adjournments = filteredEvents.filter(e => e.type === 'adjournment');
      const totalEvents = filteredEvents.length;
      
      const isToday = (
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear()
      );

      cells.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-20 md:h-24 p-1 md:p-2 cursor-pointer rounded-lg transition-all duration-200 ease-in-out flex flex-col ${
            isToday 
              ? 'bg-blue-50 border-2 border-blue-400 shadow-sm' 
              : 'bg-white border border-gray-100 hover:bg-gray-50'
          }`}
        >
          <div className={`font-medium text-sm md:text-base mb-1 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>
            {day}
          </div>
          
          {totalEvents > 0 && (
            <div className="flex-1 overflow-hidden space-y-1">
              {hearings.length > 0 && (
                <div className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                  <Scale className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                  {hearings.length} Hearing{hearings.length !== 1 ? 's' : ''}
                </div>
              )}
              
              {adjournments.length > 0 && (
                <div className="inline-flex items-center text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                  <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                  {adjournments.length} Adjournment{adjournments.length !== 1 ? 's' : ''}
                </div>
              )}
              
              <div className="text-xs text-gray-600 leading-tight hidden md:block">
                {filteredEvents.slice(0, 2).map(event => event.caseData.caseType).join(', ')}
                {filteredEvents.length > 2 && '...'}
              </div>
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  const getFilteredEventsCount = () => {
    let total = 0;
    for (let day in eventsData) {
      total += filterEventsByType(eventsData[day]).length;
    }
    return total;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-md border border-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-30 bg-gray-800 bg-opacity-50 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
           onClick={() => setIsSidebarOpen(false)}>
      </div>
      
      <div className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Legal Calendar</h2>
          <p className="text-sm text-gray-600 mt-1">
            {userRole === 'user' ? 'Your assigned cases' : 'Track and manage legal cases'}
          </p>
        </div>
        <div className="p-6">
          <button 
            onClick={handleLogout} 
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <header className="bg-white shadow rounded-xl mb-6 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {userRole === 'user' ? 'My Cases' : 'Owner Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Legal Case Management System</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="hidden lg:inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 text-blue-600" />
              Legal Calendar
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              {userRole === 'user' 
                ? 'Your assigned cases' 
                : 'Track and manage legal cases'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-100 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCaseType}
                  onChange={(e) => setSelectedCaseType(e.target.value)}
                  className="text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer w-full"
                >
                  {availableCaseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-100 w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-gray-600">
                {selectedCaseType === 'All' ? 'Events this month' : `${selectedCaseType} events`}
              </div>
              <div className="text-xl md:text-2xl font-bold text-blue-700">
                {loading ? '...' : getFilteredEventsCount()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 w-full justify-between md:justify-start">
              <button 
                onClick={() => navigateMonth(-1)} 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div className="flex space-x-2">
                <div className="relative">
                  <select 
                    value={currentDate.getMonth()} 
                    onChange={e => setCurrentDate(prev => {
                      const d = new Date(prev);
                      d.setMonth(+e.target.value);
                      return d;
                    })} 
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  >
                    {months.map((month, idx) => (
                      <option key={month} value={idx}>{month}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <select 
                    value={currentDate.getFullYear()} 
                    onChange={e => setCurrentDate(prev => {
                      const d = new Date(prev);
                      d.setFullYear(+e.target.value);
                      return d;
                    })} 
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  >
                    {Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => navigateMonth(1)} 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 w-full md:w-auto mt-2 md:mt-0"
            >
              Today
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 min-w-[500px]">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm md:text-base">
                {day.substring(0, window.innerWidth < 768 ? 1 : 3)}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[500px]">
            {loading ? (
              Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="h-20 md:h-24 border border-gray-100 bg-gray-50 animate-pulse rounded-lg"></div>
              ))
            ) : (
              renderCalendarDays()
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 gap-3">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div className="flex items-center text-xs md:text-sm text-gray-600">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
              Today's date
            </div>
            <div className="flex items-center text-xs md:text-sm text-gray-600">
              <Scale className="w-3 h-3 mr-2 text-blue-600" />
              Hearings
            </div>
            <div className="flex items-center text-xs md:text-sm text-gray-600">
              <Clock className="w-3 h-3 mr-2 text-amber-600" />
              Adjournments
            </div>
          </div>
          
          {selectedCaseType !== 'All' && (
            <div className="text-xs md:text-sm text-gray-600">
              Filtered by: <span className="font-medium text-blue-600">{selectedCaseType}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 font-medium">Error</div>
            <div className="text-red-600">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalCalendar;