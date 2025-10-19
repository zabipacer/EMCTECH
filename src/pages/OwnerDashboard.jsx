// src/pages/OwnerDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBox, 
  FaFileInvoice, 
  FaUsers, 
  FaDollarSign,
  FaPlusCircle, 
  FaArrowRight,
  FaChartLine,
  FaSync,
  FaFileExcel,
  FaChartBar,
  FaBuilding,
  FaWarehouse,
  FaFlag,
  FaUserCheck,
  FaBars
} from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { useLayout } from "../components/Layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit as fsLimit,
  where
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * OwnerDashboard (Firestore-connected)
 *
 * - Listens to clients, products, proposals collections in real-time
 * - Computes basic stats: counts, revenue (paid), pending proposals, low-stock alerts
 * - Builds a merged recentActivities list from recent proposals & product updates
 *
 * Notes:
 * - Update collection names or fields if your database uses different naming.
 * - Fields expected (from your schema): products.stock, products.lowStockThreshold,
 *   proposals.grandTotal, proposals.status, proposals.updatedAt, clients.createdAt
 */

const StatCard = ({ title, count, trend, pending, description, icon: Icon, link, color, delay }) => {
  const trendColor = trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-gray-400";
  const trendText = trend > 0 ? `+${trend}%` : `${trend}%`;
  const isRevenue = title.toLowerCase().includes("revenue");

  const CardContent = () => (
    <motion.div
      className={`${color} shadow-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col justify-between text-white relative overflow-hidden group cursor-pointer h-32 sm:h-36 lg:h-48`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <div className="absolute -right-3 -top-3 sm:-right-4 sm:-top-4 lg:-right-6 lg:-top-6 opacity-10 transform rotate-12">
        <Icon className="text-5xl sm:text-6xl lg:text-9xl" />
      </div>
      
      <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
        <div className="flex-1">
          <h2 className="font-semibold text-xs sm:text-sm lg:text-lg mb-1 lg:mb-2">{title}</h2>
          <p className="text-lg sm:text-xl lg:text-3xl font-bold mb-1 lg:mb-2">{count}</p>
          <p className="text-white text-opacity-80 text-xs mb-2 lg:mb-3 line-clamp-2">{description}</p>
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className={`text-xs ${trendColor}`}>
              {trendText} from last month
            </span>
            {pending !== undefined && (
              <span className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                {isRevenue ? pending : `${pending} pending`}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white bg-opacity-20 p-1 sm:p-2 lg:p-3 rounded-full ml-2 lg:ml-4 flex-shrink-0">
          <Icon className="text-sm sm:text-base lg:text-2xl" />
        </div>
      </div>
    </motion.div>
  );

  return link ? (
    <Link to={link}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
};

const ActivityItem = ({ activity }) => {
  const Icon = activity.icon;
  
  return (
    <motion.li 
      className="flex items-center justify-between p-2 sm:p-3 lg:p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group border-b border-gray-100 last:border-b-0"
      whileHover={{ x: 5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
        <div className={`p-1 sm:p-2 lg:p-3 rounded-full bg-gray-100 ${activity.color} flex-shrink-0`}>
          <Icon className="text-xs sm:text-sm lg:text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 font-medium text-xs sm:text-sm lg:text-base truncate">{activity.message}</p>
          <p className="text-gray-500 text-xs lg:text-sm">{activity.timePretty}</p>
        </div>
      </div>
      <FaArrowRight className="text-gray-300 group-hover:text-gray-500 transform group-hover:translate-x-1 transition-all flex-shrink-0 text-xs sm:text-sm lg:text-base" />
    </motion.li>
  );
};

const QuickActionButton = ({ action }) => {
  const Icon = action.icon;
  
  return (
    <Link to={action.path}>
      <motion.div
        className={`${action.color} text-white p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl flex flex-col space-y-1 sm:space-y-2 lg:space-y-3 shadow-lg h-full group min-h-[70px] sm:min-h-[80px]`}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          <Icon className="text-sm sm:text-base lg:text-xl" />
          <span className="font-medium text-xs sm:text-sm lg:text-sm">{action.title}</span>
        </div>
        <p className="text-white text-opacity-80 text-xs line-clamp-2">{action.description}</p>
      </motion.div>
    </Link>
  );
};

const AlertCard = ({ alert }) => {
  const Icon = alert.icon;
  
  return (
    <Link to={alert.path}>
      <motion.div 
        className={`${alert.bgColor} border ${alert.borderColor} rounded-lg p-2 sm:p-3 lg:p-4 hover:shadow-md transition-all cursor-pointer group`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            <div className={`p-1 sm:p-2 rounded-full ${alert.bgColor} flex-shrink-0`}>
              <Icon className={`text-sm sm:text-base lg:text-lg ${alert.color}`} />
            </div>
            <span className={`font-semibold text-xs sm:text-sm lg:text-sm ${alert.color} line-clamp-1`}>{alert.title}</span>
          </div>
          <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-700 flex-shrink-0 ml-1 sm:ml-2">
            {alert.count}
          </span>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm lg:text-sm line-clamp-2">{alert.message}</p>
      </motion.div>
    </Link>
  );
};

const CompanySwitcher = ({ currentCompany, onCompanyChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const companies = [
    { id: 'both', name: 'Both Companies', icon: FaBuilding },
    { id: 'innova', name: 'Innovamechanics', icon: FaBuilding },
    { id: 'emctech', name: 'Emctech', icon: FaBuilding }
  ];

  const currentCompanyObj = companies.find(company => company.id === currentCompany);

  return (
    <div className="relative">
      <div className="block lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 w-full justify-between text-sm"
        >
          <div className="flex items-center space-x-2">
            <FaBuilding className="text-xs" />
            <span className="font-medium truncate">{currentCompanyObj?.name}</span>
          </div>
          <FaBars className="text-xs" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {companies.map((company) => {
              const Icon = company.icon;
              const isActive = currentCompany === company.id;
              
              return (
                <button
                  key={company.id}
                  onClick={() => {
                    onCompanyChange(company.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm w-full text-left ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  } ${company.id !== companies[0].id ? 'border-t border-gray-200' : ''}`}
                >
                  <Icon className="text-xs" />
                  <span>{company.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center space-x-2 bg-white rounded-lg border border-gray-300 p-1">
        {companies.map((company) => {
          const Icon = company.icon;
          const isActive = currentCompany === company.id;
          
          return (
            <button
              key={company.id}
              onClick={() => onCompanyChange(company.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Icon className="text-xs" />
              <span>{company.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function OwnerDashboard() {
  const { setTitle } = useLayout();
  const { userProfile } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [currentCompany, setCurrentCompany] = useState('both');

  useEffect(() => {
    setTitle("Owner Dashboard");
  }, [setTitle]);

  useEffect(() => {
    // Real-time listeners for clients, products, proposals
    const clientsCol = collection(db, "clients");
    const productsCol = collection(db, "products");
    const proposalsCol = collection(db, "proposals");

    // clients count
    const unsubClients = onSnapshot(
      clientsCol,
      (snap) => {
        setStats((prev) => ({ ...prev, clients: { count: snap.size, trend: prev.clients?.trend || 0, pending: prev.clients?.pending || 0, description: "Total active clients" } }));
      },
      (err) => {
        console.error("clients onSnapshot error:", err);
      }
    );

    // products: count and low-stock
    const unsubProducts = onSnapshot(
      productsCol,
      (snap) => {
        const products = [];
        snap.forEach((d) => products.push({ id: d.id, ...d.data() }));
        const lowStock = products.filter((p) => {
          // prefer numeric fields; handle strings that contain numbers
          const stock = typeof p.stock === "number" ? p.stock : Number(p.stock || 0);
          const threshold = typeof p.lowStockThreshold === "number" ? p.lowStockThreshold : Number(p.lowStockThreshold || 0);
          return !isNaN(stock) && !isNaN(threshold) && stock <= threshold;
        });
        setStats((prev) => ({ ...prev, products: { count: products.length, trend: prev.products?.trend || 0, pending: lowStock.length, description: "Active products across both companies" } }));
      },
      (err) => {
        console.error("products onSnapshot error:", err);
      }
    );

    // proposals: count and revenue sums
    const unsubProposals = onSnapshot(
      proposalsCol,
      (snap) => {
        let paidTotal = 0;
        let pendingTotalCount = 0;
        let pendingTotalValue = 0;
        const proposals = [];
        snap.forEach((d) => {
          const data = d.data();
          proposals.push({ id: d.id, ...data });
          const grand = Number(data.grandTotal || 0);
          const status = (data.status || "").toLowerCase();
          if (status === "paid" || status === "completed") {
            if (!isNaN(grand)) paidTotal += grand;
          } else {
            pendingTotalCount += 1;
            if (!isNaN(grand)) pendingTotalValue += grand;
          }
        });
        setStats((prev) => ({ ...prev, proposals: { count: proposals.length, trend: prev.proposals?.trend || 0, pending: pendingTotalCount, description: "Proposals sent to clients" }, revenue: { count: `$${Number(paidTotal).toLocaleString()}`, trend: prev.revenue?.trend || 0, pending: `$${Number(pendingTotalValue).toLocaleString()}`, description: "Revenue (paid proposals)" } }));
      },
      (err) => {
        console.error("proposals onSnapshot error:", err);
      }
    );

    // Build recent activities by merging recent proposals and recent product changes
    // We'll fetch latest 8 proposals and latest 8 products (by updatedAt) and merge them.
    const qProposalsRecent = query(proposalsCol, orderBy("updatedAt", "desc"), fsLimit(8));
    const qProductsRecent = query(productsCol, orderBy("updatedAt", "desc"), fsLimit(8));

    const unsubRecentProposals = onSnapshot(qProposalsRecent, (snap) => {
      const items = [];
      snap.forEach((d) => {
        const data = d.data();
        const ts = data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt || data.createdAt || null;
        items.push({
          id: d.id,
          type: "proposal",
          message: `Proposal ${data.proposalNumber || data.proposalTitle || ""} (${data.clientName || data.clientEmail || "client"}) - ${data.status || ""}`,
          time: ts,
          timePretty: ts ? prettyTime(ts) : "just now",
          icon: FaFileInvoice,
          color: "text-blue-500",
          sortTs: ts instanceof Date ? ts.getTime() : (typeof ts === "number" ? ts : Date.now())
        });
      });
      // merge with current activities from products on next step
      setActivities((prev) => {
        // find previous products entries and merge here to avoid flicker; we'll do merging in both callbacks
        const prevProducts = prev.filter((p) => p.type === "product");
        const merged = [...items, ...prevProducts];
        merged.sort((a, b) => b.sortTs - a.sortTs);
        return merged.slice(0, 10);
      });
    }, (err) => console.error("recent proposals snapshot error:", err));

    const unsubRecentProducts = onSnapshot(qProductsRecent, (snap) => {
      const items = [];
      snap.forEach((d) => {
        const data = d.data();
        const ts = data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt || data.createdAt || null;
        items.push({
          id: d.id,
          type: "product",
          message: `Product "${(data.title || data.name || {}).EN || data.title || (data.name && data.name.EN) || data.name || "Unnamed"}" updated`,
          time: ts,
          timePretty: ts ? prettyTime(ts) : "just now",
          icon: FaBox,
          color: "text-green-500",
          sortTs: ts instanceof Date ? ts.getTime() : (typeof ts === "number" ? ts : Date.now())
        });
      });
      setActivities((prev) => {
        const prevProposals = prev.filter((p) => p.type === "proposal");
        const merged = [...items, ...prevProposals];
        merged.sort((a, b) => b.sortTs - a.sortTs);
        return merged.slice(0, 10);
      });
    }, (err) => console.error("recent products snapshot error:", err));

    // cleanup
    return () => {
      try { unsubClients(); } catch (e) {}
      try { unsubProducts(); } catch (e) {}
      try { unsubProposals(); } catch (e) {}
      try { unsubRecentProposals(); } catch (e) {}
      try { unsubRecentProducts(); } catch (e) {}
    };
  }, []);

  // prettyTime helper
  function prettyTime(ts) {
    const d = ts instanceof Date ? ts : (ts && ts.toDate ? ts.toDate() : new Date(ts));
    const now = new Date();
    const diff = Math.floor((now - d) / 1000); // seconds
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleString();
  }

  // fallback to mock data while loading
  useEffect(() => {
    // If stats empty for a short while, show mock data to avoid blank UI
    const t = setTimeout(() => {
      if (!stats.products && !stats.proposals && !stats.clients) {
        // set minimal mock stats
        setStats({
          products: { count: 0, trend: 0, pending: 0, description: "Active products" },
          proposals: { count: 0, trend: 0, pending: 0, description: "Proposals" },
          revenue: { count: "$0", trend: 0, pending: "$0", description: "Revenue" },
          clients: { count: 0, trend: 0, pending: 0, description: "Clients" }
        });
      }
    }, 700);
    return () => clearTimeout(t);
  }, [stats]);

  const statCards = [
    {
      title: "Total Products",
      count: stats.products?.count || 0,
      trend: stats.products?.trend || 0,
      pending: stats.products?.pending || 0,
      description: stats.products?.description || "",
      icon: FaBox,
      link: "/products",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Active Proposals",
      count: stats.proposals?.count || 0,
      trend: stats.proposals?.trend || 0,
      pending: stats.proposals?.pending || 0,
      description: stats.proposals?.description || "",
      icon: FaFileInvoice,
      link: "/proposals",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      title: "Total Clients",
      count: stats.clients?.count || 0,
      trend: stats.clients?.trend || 0,
      pending: stats.clients?.pending || 0,
      description: stats.clients?.description || "",
      icon: FaUsers,
      link: "/clients",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Monthly Revenue",
      count: stats.revenue?.count || "$0",
      trend: stats.revenue?.trend || 0,
      pending: stats.revenue?.pending || "$0",
      description: stats.revenue?.description || "",
      icon: FaDollarSign,
      link: "/proposals",
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    }
  ];

  // make UI quick actions & alerts (static or derived)
  const quickActions = [
    { id: 1, title: "Add New Product", path: "/products", icon: FaPlusCircle, color: "bg-blue-600 hover:bg-blue-700", description: "Create new product listing" },
    { id: 2, title: "Create Proposal", path: "/proposals/create", icon: FaFileInvoice, color: "bg-green-600 hover:bg-green-700", description: "Create client proposal" },
    { id: 3, title: "Add Client", path: "/clients", icon: FaUsers, color: "bg-purple-600 hover:bg-purple-700", description: "Add new client to CRM" },
    { id: 4, title: "Import Excel", path: "/products", icon: FaFileExcel, color: "bg-orange-600 hover:bg-orange-700", description: "Bulk import products" },
    { id: 5, title: "Sync Websites", path: "/automation", icon: FaSync, color: "bg-indigo-600 hover:bg-indigo-700", description: "Sync to company websites" },
    { id: 6, title: "View Reports", path: "/analytics", icon: FaChartBar, color: "bg-red-600 hover:bg-red-700", description: "View business analytics" },
    { id: 7, title: "Analytics", path: "/analytics", icon: FaFlag, color: "bg-indigo-600 hover:bg-indigo-700", description: "Analytics & KPIs" },
    { id: 8, title: "Settings", path: "/settings", icon: FaGear, color: "bg-indigo-600 hover:bg-indigo-700", description: "App settings" },
    { id: 9, title: "User Approvals", path: "/user-approvals", icon: FaUserCheck, color: "bg-teal-600 hover:bg-teal-700", description: "Approve user requests" }
  ];

  // build alerts from stats (low stock + missing images + pending proposals + overdue invoices)
  const alerts = [
    {
      id: "low_stock",
      type: "low_stock",
      title: "Low Stock Alert",
      message: `${stats.products?.pending || 0} products are running low on stock`,
      count: stats.products?.pending || 0,
      icon: FaWarehouse,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      path: "/products"
    },
    {
      id: "pending_proposals",
      type: "pending_proposals",
      title: "Pending Proposals",
      message: `${stats.proposals?.pending || 0} proposals awaiting client response`,
      count: stats.proposals?.pending || 0,
      icon: FaFileInvoice,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      path: "/proposals"
    },
    {
      id: "overdue_invoices",
      type: "overdue_invoices",
      title: "Overdue Invoices",
      message: `Check proposals for overdue payments`,
      count: 0,
      icon: FaDollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      path: "/proposals"
    },
    {
      id: "missing_images",
      type: "missing_images",
      title: "Missing Images",
      message: `Some products are missing images – review products`,
      count: 0,
      icon: FaBox,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      path: "/products"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.header 
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate">
            Welcome back, {userProfile?.firstName || 'Owner'}!
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Here's what's happening with your business today. Managing {currentCompany === 'both' ? 'both companies' : currentCompany}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 w-full lg:w-auto mt-2 lg:mt-0">
          <CompanySwitcher 
            currentCompany={currentCompany}
            onCompanyChange={setCurrentCompany}
          />
        </div>
      </motion.header>

      {/* Stats Overview Section */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 lg:mb-6 gap-2">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Business Overview</h2>
          <Link 
            to="/analytics" 
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
          >
            <span>View Detailed Analytics</span>
            <FaChartLine className="text-sm" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <AnimatePresence>
            {statCards.map((card, index) => (
              <StatCard key={card.title} {...card} delay={index * 0.1} />
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Quick Actions & Alerts */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Quick Actions Section */}
          <motion.section 
            className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg lg:shadow-xl p-3 sm:p-4 lg:p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 lg:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Quick Actions</h2>
              <span className="text-gray-500 text-xs sm:text-sm">Frequently used actions</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {quickActions.map((action) => (
                <QuickActionButton key={action.id} action={action} />
              ))}
            </div>
          </motion.section>

          {/* Pending Alerts Section */}
          <motion.section 
            className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg lg:shadow-xl p-3 sm:p-4 lg:p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 lg:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Pending Alerts</h2>
              <span className="text-gray-500 text-xs sm:text-sm">Requires your attention</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right Column - Recent Activity */}
        <motion.section 
          className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg lg:shadow-xl p-3 sm:p-4 lg:p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 lg:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Recent Activity</h2>
            <Link to="/activity" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex items-center">
              View All <FaArrowRight className="ml-1 text-xs" />
            </Link>
          </div>
          
          <ul className="space-y-0 max-h-[300px] sm:max-h-[350px] lg:max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {activities.map((activity) => (
                <ActivityItem key={activity.id + "-" + activity.type} activity={activity} />
              ))}
            </AnimatePresence>
          </ul>
          
          {activities.length === 0 && (
            <div className="text-center py-4 sm:py-6 lg:py-8 text-gray-500">
              <FaBox className="text-2xl sm:text-3xl lg:text-4xl mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm sm:text-base">No recent activity</p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
