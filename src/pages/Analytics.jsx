import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiBarChart2, FiPieChart, FiTrendingUp, FiUsers, FiDollarSign, FiCheckCircle, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

/*
HOW TO INTEGRATE WITH REAL DATA:

1. Firebase/Firestore Integration:
   - Replace mock data with real-time Firestore listeners
   - Connect to your proposals, products, and revenue collections
   - Implement proper data aggregation and filtering

2. Analytics Services:
   - Integrate with Google Analytics API for web traffic
   - Connect to Stripe/Payment APIs for revenue data
   - Use CRM APIs for client and proposal data

3. Export Functionality:
   - Implement server-side CSV/PDF generation
   - Add date range filtering for exports
   - Connect to cloud storage for large exports

Mock data functions are clearly marked with "INTEGRATION POINT" comments.
*/

// Mock data generators
const generateProposalData = (days = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const sent = Math.floor(Math.random() * 20) + 10;
    const accepted = Math.floor(sent * (0.3 + Math.random() * 0.3)); // 30-60% acceptance
    
    data.push({
      date: date.toISOString().split('T')[0],
      sent,
      accepted,
      rate: Math.round((accepted / sent) * 100)
    });
  }
  
  return data;
};

const generateProductData = () => {
  const products = [
    { name: 'Pump X100', value: 42 },
    { name: 'Valve V2', value: 28 },
    { name: 'Compressor 3000', value: 18 },
    { name: 'Filter A1', value: 8 },
    { name: 'Gasket Pro', value: 4 }
  ];
  return products;
};

const generateRevenueData = (months = 6) => {
  const data = [];
  const now = new Date();
  const clients = ['Client X', 'Client Y', 'Client Z', 'Client A', 'Client B'];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    const monthData = {
      month: date.toLocaleString('default', { month: 'short' }),
      total: 0
    };
    
    clients.forEach(client => {
      const revenue = Math.floor(Math.random() * 8000) + 2000;
      monthData[client] = revenue;
      monthData.total += revenue;
    });
    
    data.push(monthData);
  }
  
  return data;
};

const generateKPIStats = () => ({
  totalRevenue: 125430,
  activeClients: 24,
  proposalAcceptance: 68,
  avgResponseTime: 2.4
});

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

// Custom tooltip components
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.dataKey === 'revenue' && ' USD'}
            {entry.dataKey === 'rate' && '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

export default function Analytics() {
  const [proposalData, setProposalData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [kpiStats, setKpiStats] = useState({});
  const [timeRange, setTimeRange] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);

  // INTEGRATION POINT: Replace with real data fetching
  useEffect(() => {
    const loadData = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
      setProposalData(generateProposalData(days));
      setProductData(generateProductData());
      setRevenueData(generateRevenueData());
      setKpiStats(generateKPIStats());
    };

    loadData();
  }, [timeRange]);

  // INTEGRATION POINT: Replace with real export functionality
  const handleExport = async (format) => {
    setIsExporting(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would trigger a download
    alert(`${format.toUpperCase()} export completed!`);
    setIsExporting(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your business performance and metrics</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Revenue"
            value={`$${kpiStats.totalRevenue?.toLocaleString()}`}
            change={12.5}
            icon={FiDollarSign}
            color="green"
          />
          <KPICard
            title="Active Clients"
            value={kpiStats.activeClients}
            change={8.3}
            icon={FiUsers}
            color="blue"
          />
          <KPICard
            title="Proposal Acceptance"
            value={`${kpiStats.proposalAcceptance}%`}
            change={4.2}
            icon={FiCheckCircle}
            color="purple"
          />
          <KPICard
            title="Avg Response Time"
            value={`${kpiStats.avgResponseTime} days`}
            change={-15.2}
            icon={FiClock}
            color="yellow"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proposals Sent vs Accepted */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-lg shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <FiBarChart2 className="w-5 h-5" />
                Proposals Sent vs Accepted
              </h2>
              <div className="flex gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Sent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Accepted</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={proposalData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sent" fill="#4F46E5" radius={[2, 2, 0, 0]} />
                <Bar dataKey="accepted" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Products */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-6">
              <FiPieChart className="w-5 h-5" />
              Top Products by Revenue
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Market Share']} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Trend */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-lg shadow lg:col-span-2"
          >
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-6">
              <FiTrendingUp className="w-5 h-5" />
              Revenue Trend by Client
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Client X" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Client Y" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Client Z" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Client A" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Additional Metrics */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-6">
            <FiBarChart2 className="w-5 h-5" />
            Proposal Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {proposalData.slice(-3).map((day, index) => (
              <div key={index} className="text-center p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{day.date}</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Sent:</span>
                  <span className="font-semibold">{day.sent}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Accepted:</span>
                  <span className="font-semibold text-green-600">{day.accepted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rate:</span>
                  <span className="font-semibold text-blue-600">{day.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}