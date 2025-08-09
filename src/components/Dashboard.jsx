import React, { useState } from 'react';
import { createBrowserRouter, RouterProvider, Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Scale, FileText } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

// Demo case objects
const demoCases = [
  { id: 1, date:   '2025-08-03', title: 'Case A: Contract Review' },
  { id: 2, date: '2025-08-03', title: 'Case B: Client Meeting' },
  { id: 3, date: '2025-08-07', title: 'Case C: Evidence Gathering' },
  { id: 4, date: '2025-08-07', title: 'Case D: Filing Motion' },
  { id: 5, date: '2025-08-12', title: 'Case E: Hearing Prep' },
  { id: 6, date: '2025-08-15', title: 'Case F: Settlement Discussion' },
  { id: 7, date: '2025-08-18', title: 'Case G: Expert Deposition' },
  { id: 8, date: '2025-08-22', title: 'Case H: Discovery' },
  { id: 9, date: '2025-08-25', title: 'Case I: Client Intake' },
  { id: 10, date: '2025-08-28', title: 'Case J: Document Draft' },
  { id: 11, date: '2025-08-30', title: 'Case K: Review Orders' }
];

// Legal Calendar Component
const LegalCalendar = () => {


    const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter demo cases based on selected month & year
  const casesInMonth = demoCases.filter(c => {
    const d = new Date(c.date);
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
  });

  // Count cases per day
  const casesData = casesInMonth.reduce((acc, c) => {
    const day = new Date(c.date).getDate();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

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
        navigate("/login");
      } catch (err) {
        console.error("Logout failed:", err);
      }
    };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const cells = [];

    // empty slots
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-24 border border-gray-100"></div>);

    // days
    for (let d = 1; d <= daysInMonth; d++) {
      const count = casesData[d] || 0;
      const isToday = (
        d === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear()
      );
      cells.push(
        <div
          key={d}
          onClick={() => handleDateClick(d)}
          className={`h-24 p-2 cursor-pointer rounded-lg transition-all duration-200 ease-in-out ${
            isToday 
              ? 'bg-blue-50 border-2 border-blue-400' 
              : 'bg-white border border-gray-100 hover:bg-gray-50'
          }`}
        >
          <div className={`font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{d}</div>
          {count > 0 && (
            <div className="mt-1 inline-flex items-center text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              <Scale className="w-3 h-3 mr-1" />
              {count} case{count !== 1 && 's'}
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  // Build year options +/- 5 years
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);

  return (
    <div className="p-6 max-w-6xl mx-auto">
          <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3 text-blue-600" />
            Legal Calendar
          </h1>
          <p className="text-gray-600 mt-1">Track and manage your legal cases</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-100">
          <div className="text-sm text-gray-600">Cases this month</div>
          <div className="text-2xl font-bold text-blue-700">{casesInMonth.length}</div>
        </div>
      </div>

      {/* Month & Year controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
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
                  className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={currentDate.getFullYear()}
                  onChange={e => setCurrentDate(prev => {
                    const d = new Date(prev);
                    d.setFullYear(+e.target.value);
                    return d;
                  })}
                  className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
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
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map(d => (
            <div key={d} className="text-center font-semibold text-gray-600 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>
      </div>

      <div className="text-sm text-gray-600 mt-4 flex items-center">
        <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
        Today's date highlighted
      </div>
    </div>
  );
};
export default LegalCalendar
// Case List Component
