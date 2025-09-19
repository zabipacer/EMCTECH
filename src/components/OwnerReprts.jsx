// Reports.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FiBriefcase,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiFilter,
  FiDownload,
  FiPrinter,
  FiAlertTriangle,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiPieChart
} from "react-icons/fi";
import { useReactToPrint } from "react-to-print";
import { db, auth } from '../firebase/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Helper functions
const container = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function toDateInput(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function sum(arr) {
  return arr.reduce((a, b) => a + (Number(b) || 0), 0);
}
function toJSDate(v) {
  if (!v) return null;
  // Handle Firestore Timestamp
  if (typeof v === 'object' && v.toDate) {
    return v.toDate();
  }
  // Handle string dates (like "2025-08-16T06:14:46.429Z")
  if (typeof v === 'string') {
    return new Date(v);
  }
  return null;
}
function exportCSV(filename = "reports.csv", rows = []) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Court name extraction function - improved to handle various data structures
const getCourtName = (caseData, courtsData) => {
  // First check if we have a direct court name
  if (caseData.courtName) return caseData.courtName;
  
  // Check if we have a court object with a name property
  if (caseData.court && typeof caseData.court === 'object') {
    return caseData.court.name || caseData.court.courtName || 'No Court Assigned';
  }
  
  // Check if we have a court ID to look up
  if (caseData.courtId && courtsData[caseData.courtId]) {
    return courtsData[caseData.courtId].name || 'No Court Assigned';
  }
  
  // Check if we have a simple string court field
  if (typeof caseData.court === 'string') {
    return caseData.court;
  }
  
  return 'No Court Assigned';
};

export default function Reports() {
  const printRef = useRef(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Date filters
  const today = new Date();
  const startDefault = new Date(today);
  startDefault.setMonth(today.getMonth() - 6);
  const [startDate, setStartDate] = useState(toDateInput(startDefault));
  const [endDate, setEndDate] = useState(toDateInput(today));

  // Data states
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [associates, setAssociates] = useState([]);
  const [courts, setCourts] = useState({});
  const [allCases, setAllCases] = useState([]); // Store all cases for filtering

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `LMS-Reports-${new Date().toISOString()}`,
  });

  // Auth and role check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthReady(true);
        setRoleChecked(true);
        setIsOwner(false);
        return;
      }
      setAuthReady(true);
      try {
        let snap = await getDoc(doc(db, "Users", user.uid));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "users", user.uid));
        }
        const profile = snap.exists() ? snap.data() : null;
        const owner = profile?.role === "store_owner";
        setIsOwner(owner);
        setRoleChecked(true);
      } catch (e) {
        console.error("Profile load failed:", e);
        setIsOwner(false);
        setRoleChecked(true);
      }
    });
    return () => unsub();
  }, []);

  // Fetch all data
  useEffect(() => {
    if (!authReady || !roleChecked || !isOwner) return;

    setLoading(true);
    setErr("");

    // Fetch all data first, then filter locally
    const fetchAllData = async () => {
      try {
        // Fetch courts
        const courtsSnapshot = await getDocs(collection(db, 'courts'));
        const courtsData = {};
        courtsSnapshot.forEach((doc) => {
          courtsData[doc.id] = doc.data();
        });
        setCourts(courtsData);
        
        // Fetch cases
        const casesSnapshot = await getDocs(collection(db, "cases"));
        const casesData = casesSnapshot.docs.map((d) => {
          const data = d.data();
          return { 
            id: d.id, 
            ...data,
            courtName: getCourtName(data, courtsData)
          };
        });
        setAllCases(casesData);
        
        // Fetch clients
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        setClients(clientsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        
        // Fetch associates
        const associatesSnapshot = await getDocs(
          query(collection(db, "Users"), where("role", "==", "associate"))
        );
        setAssociates(associatesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErr('Failed to load data: ' + error.message);
        setLoading(false);
      }
    };

    fetchAllData();
  }, [authReady, roleChecked, isOwner]);

  // Filter cases based on date range
  useEffect(() => {
    if (allCases.length === 0) return;
    
    const s = new Date(startDate);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    
    const filteredCases = allCases.filter(c => {
      const caseDate = toJSDate(c.createdAt);
      return caseDate && caseDate >= s && caseDate <= e;
    });
    
    setCases(filteredCases);
  }, [allCases, startDate, endDate]);

  // Derived metrics
  const totalCases = cases.length;
  const closedCases = cases.filter((c) => 
    c.status && (c.status.toLowerCase() === "closed" || c.status.toLowerCase() === "completed")
  ).length;
  const pendingCases = cases.filter((c) => 
    c.status && (c.status.toLowerCase() === "pending" || c.status.toLowerCase() === "new")
  ).length;
  const activeCases = cases.filter((c) => 
    c.status && (c.status.toLowerCase() === "active" || c.status.toLowerCase() === "in progress")
  ).length;
  const urgentCases = cases.filter((c) => 
    c.priority && (c.priority.toLowerCase() === "urgent" || c.priority.toLowerCase() === "high")
  ).length;

  // Financial overview - with better fallbacks for missing data
  const totalFees = sum(cases.map((c) => parseFloat(c.caseValue || c.value || 0) || 0));
  const receivedPayments = sum(cases.map((c) => parseFloat(c.paymentReceived || c.paidAmount || 0) || 0));
  const outstandingBalance = Math.max(0, totalFees - receivedPayments);

  // Case type distribution
  const caseTypeData = useMemo(() => {
    const types = {};
    cases.forEach((c) => {
      const type = c.caseType || c.type || "Unknown";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [cases]);

  // Status distribution
  const statusData = useMemo(() => {
    const statuses = {};
    cases.forEach((c) => {
      const status = c.status || "Unknown";
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [cases]);

  // Monthly case trends
  const monthlyData = useMemo(() => {
    const months = {};
    cases.forEach((c) => {
      const date = toJSDate(c.createdAt);
      if (date) {
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!months[monthYear]) {
          months[monthYear] = {
            month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            cases: 0,
            revenue: 0
          };
        }
        months[monthYear].cases += 1;
        months[monthYear].revenue += parseFloat(c.caseValue || 0) || 0;
      }
    });
    return Object.values(months);
  }, [cases]);

  // Court distribution
  const courtData = useMemo(() => {
    const courts = {};
    cases.forEach((c) => {
      const court = c.courtName || "Unknown Court";
      courts[court] = (courts[court] || 0) + 1;
    });
    return Object.entries(courts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [cases]);

  // Top performing associates
  const associatePerformance = useMemo(() => {
    const performance = {};
    cases.forEach((c) => {
      if (c.assignedTo && Array.isArray(c.assignedTo)) {
        c.assignedTo.forEach(uid => {
          if (!performance[uid]) {
            performance[uid] = { cases: 0, revenue: 0 };
          }
          performance[uid].cases += 1;
          performance[uid].revenue += parseFloat(c.caseValue || 0) || 0;
        });
      }
    });
    
    return Object.entries(performance)
      .map(([uid, data]) => {
        const associate = associates.find(a => a.id === uid) || {};
        return {
          uid,
          name: associate.firstName || associate.name || "Unknown Associate",
          cases: data.cases,
          revenue: data.revenue
        };
      })
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 10);
  }, [cases, associates]);

  // Export functions
  const exportCaseDataCSV = () => {
    const rows = cases.map(c => ({
      'Case Title': c.caseTitle || c.title,
      'Court': c.courtName,
      'Status': c.status,
      'Type': c.caseType || c.type,
      'Value': c.caseValue || c.value,
      'Created': c.createdAt ? toJSDate(c.createdAt).toLocaleDateString() : 'N/A'
    }));
    exportCSV(`cases_${startDate}_to_${endDate}.csv`, rows);
  };

  const exportFinancialCSV = () => {
    exportCSV("financial_overview.csv", [
      { metric: "Total Fees", amount: totalFees },
      { metric: "Received Payments", amount: receivedPayments },
      { metric: "Outstanding Balance", amount: outstandingBalance },
    ]);
  };

  // Route guard
  if (!authReady || !roleChecked) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-200">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          <span>Checking access…</span>
        </div>
      </div>
    );
  }
  if (!isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      {/* Header and Filters */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">Comprehensive legal case analytics and insights</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <FiFilter className="text-gray-400" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-300">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-300">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:scale-[1.01] transition"
            >
              <FiPrinter /> Export PDF
            </button>
            <button
              onClick={exportCaseDataCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:scale-[1.01] transition"
            >
              <FiDownload /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
          <FiAlertTriangle className="mt-0.5" />
          <div className="text-sm">
            {err}
            <span className="block text-xs opacity-80">
              • If Firestore asks for an index, click the link it provides to create it.
            </span>
          </div>
        </div>
      )}

      {/* Data summary */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Showing <strong>{cases.length}</strong> cases from <strong>{startDate}</strong> to <strong>{endDate}</strong>
          {allCases.length > 0 && (
            <span> (out of {allCases.length} total cases)</span>
          )}
        </p>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="space-y-6">
        {/* Overview Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Cases Card */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Total Cases</div>
              <FiBriefcase className="text-blue-500" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {loading ? "…" : totalCases}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200">
                Active: {activeCases}
              </span>
              <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200">
                Pending: {pendingCases}
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                Closed: {closedCases}
              </span>
            </div>
          </motion.div>

          {/* Financial Card */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Financial Overview</div>
              <FiDollarSign className="text-green-500" />
            </div>
            <div className="mt-3 text-sm space-y-1 text-gray-700 dark:text-gray-100">
              <div className="flex justify-between">
                <span>Total Fees</span>
                <strong>₹ {totalFees.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Received</span>
                <strong>₹ {receivedPayments.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Outstanding</span>
                <strong>₹ {outstandingBalance.toLocaleString()}</strong>
              </div>
            </div>
          </motion.div>

          {/* Clients Card */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Total Clients</div>
              <FiUsers className="text-purple-500" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {loading ? "…" : clients.length}
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-300">
              New this period:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {clients.filter(c => {
                  const created = toJSDate(c.createdAt);
                  return created && created >= new Date(startDate) && created <= new Date(endDate);
                }).length}
              </span>
            </div>
          </motion.div>

          {/* Associates Card */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Associates</div>
              <FiUser className="text-indigo-500" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {loading ? "…" : associates.length}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">
                Active: {associates.filter(a => a.active !== false).length}
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                Inactive: {associates.filter(a => a.active === false).length}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Case Trends */}
          <motion.section variants={item} initial="hidden" animate="show" className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Case Trends</h2>
              </div>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [name === 'cases' ? `${value} cases` : `₹ ${value}`, name === 'cases' ? 'Cases' : 'Revenue']} />
                  <Legend />
                  <Bar dataKey="cases" name="Cases" fill="#3B82F6" />
                  <Bar dataKey="revenue" name="Revenue (₹)" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Case Type Distribution */}
          <motion.section variants={item} initial="hidden" animate="show" className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiPieChart className="text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Case Type Distribution</h2>
              </div>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {caseTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} cases`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Status Distribution */}
          <motion.section variants={item} initial="hidden" animate="show" className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiPieChart className="text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Case Status Distribution</h2>
              </div>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} cases`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Court Distribution */}
          <motion.section variants={item} initial="hidden" animate="show" className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiMapPin className="text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Court Distribution (Top 10)</h2>
              </div>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courtData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => [`${value} cases`, 'Count']} />
                  <Legend />
                  <Bar dataKey="value" name="Cases" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
        </div>

        {/* Top Performing Associates */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiUsers className="text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Associates</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                  <th className="py-2">#</th>
                  <th className="py-2">Associate</th>
                  <th className="py-2">Cases</th>
                  <th className="py-2">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {associatePerformance.map((row, idx) => (
                  <tr key={row.uid} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-2">{idx + 1}</td>
                    <td className="py-2">{row.name}</td>
                    <td className="py-2">{row.cases}</td>
                    <td className="py-2">₹ {row.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {associatePerformance.length === 0 && (
                  <tr>
                    <td className="py-3 text-gray-500 dark:text-gray-300" colSpan={4}>
                      No data in selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Footer Notes */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Generated on {new Date().toLocaleString()} • Date range: {startDate} → {endDate}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] grid place-items-center">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-700 dark:text-gray-200">Loading data…</span>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-6">
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}