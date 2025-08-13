import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaUser,
  FaSignOutAlt,
  FaEdit,
  FaEnvelope,
  FaCalendarAlt,
  FaShieldAlt,
  FaCog,
  FaBell,
  FaChartBar,
  FaFileAlt,
  FaUsers,
  FaBriefcase,
  FaBookOpen,
  FaCalendar,
  FaUserTie,
  FaGavel,
  FaClipboardList,
  FaArrowRight
} from 'react-icons/fa';
import { MdDashboard, MdSecurity, MdSettings, MdNotifications } from 'react-icons/md';
import { FiActivity, FiTrendingUp, FiClock, FiStar } from 'react-icons/fi';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  // Mock user data - replace with actual auth data
  const user = {
    name: "Admin User",
    email: "admin@legalcms.com",
    role: "System Administrator",
    joinDate: "January 15, 2024",
    avatar: null,
    stats: {
      totalCases: 245,
      activeCases: 45,
      completedCases: 200,
      clients: 128
    }
  };

  const handleLogout = async () => {
    try {
      // Replace with actual signOut logic
      // await signOut(auth);
      alert("You have been logged out successfully.");
      // Use Link or navigate programmatically
      window.location.href = "/";
    } catch (error) {
      alert("Error logging out. Please try again.");
    }
    setShowLogoutModal(false);
  };

  const quickActions = [
    {
      icon: MdDashboard,
      title: "Go to Dashboard",
      description: "Access your main workspace and manage cases",
      color: "from-blue-500 to-blue-600",
      path: "/insidedashboard",
      isMain: true
    },
     {
      icon: FaCog,
      title: "Add Cases",
      description: "add cases using a form",
      color: "from-gray-500 to-gray-600",
      path: "/casesform"
    },
      {
      icon: FaCog,
      title: "View Cases",
      description: "view all cases",
      color: "from-gray-500 to-gray-600",
      path: "/viewcases"
    },
    {
      icon: FaCog,
      title: "Add Clients",
      description: "Add new clients",
      color: "from-gray-500 to-gray-600",
      path: "/addclients"
    },
    {
      icon: FaCog,
      title: "View Clients",
      description: "View All clients",
      color: "from-gray-500 to-gray-600",
      path: "/viewclients"
    },
       {
      icon: FaCog,
      title: "Edit cases",
      description: "Change any info in cases",
      color: "from-gray-500 to-gray-600",
      path: "/edit-form"
    },
     {
      icon: FaCog,
      title: "Assigned cases",
      description: "View All clients",
      color: "from-gray-500 to-gray-600",
      path: "/assignedcases"
    },
    {
      icon: FaCog,
      title: "System Settings",
      description: "Configure system preferences and defaults",
      color: "from-gray-500 to-gray-600",
      path: "/system-settings"
    },
    {
      icon: FaUsers,
      title: "User Management",
      description: "Manage team members and permissions",
      color: "from-green-500 to-green-600",
      path: "/user-management"
    },
    {
      icon: FaChartBar,
      title: "My Reports",
      description: "View your personal performance analytics",
      color: "from-indigo-500 to-indigo-600",
      path: "/my-reports"
    }
  ];

  const recentActivity = [
    { action: "Created new case: Property Dispute", time: "2 hours ago", type: "case" },
    { action: "Updated client information for Ahmad Ali", time: "4 hours ago", type: "client" },
    { action: "Scheduled hearing for tomorrow", time: "6 hours ago", type: "hearing" },
    { action: "Generated monthly report", time: "1 day ago", type: "report" }
  ];

  const TabButton = ({ id, label, icon: Icon, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  const StatCard = ({ icon: Icon, title, value, trend }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-green-600">
            <FiTrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">+{trend}%</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </motion.div>
  );

  const ActionCard = ({ action, index }) => (
    <Link to={action.path} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group ${
          action.isMain ? 'ring-2 ring-blue-200 bg-gradient-to-br from-blue-50 to-white' : ''
        }`}
      >
        <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
          <action.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className={`text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors ${
          action.isMain ? 'text-blue-700' : 'text-gray-900'
        }`}>
          {action.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4">{action.description}</p>
        <div className="flex items-center text-blue-600 group-hover:text-blue-700">
          <span className="text-sm font-medium">{action.isMain ? 'Go to workspace' : 'Access'}</span>
          <FaArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <FaUser className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-500">Manage your account and preferences</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <FaBell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <FaCog className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <FaUser className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h2>
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center">
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <FaShieldAlt className="w-4 h-4 mr-2" />
                    <span>{user.role}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="w-4 h-4 mr-2" />
                    <span>Since {user.joinDate}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FaEdit className="w-4 h-4" />
                <span>Edit Profile</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={FaBriefcase} title="Total Cases" value={user.stats.totalCases} trend={12} />
          <StatCard icon={FiActivity} title="Active Cases" value={user.stats.activeCases} trend={8} />
          <StatCard icon={FiStar} title="Completed Cases" value={user.stats.completedCases} trend={5} />
          <StatCard icon={FaUsers} title="Total Clients" value={user.stats.clients} trend={15} />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              <TabButton id="overview" label="Overview" icon={MdDashboard} active={activeTab === 'overview'} />
              <TabButton id="activity" label="Recent Activity" icon={FiActivity} active={activeTab === 'activity'} />
              <TabButton id="settings" label="Settings" icon={MdSettings} active={activeTab === 'settings'} />
              <TabButton id="security" label="Security" icon={MdSecurity} active={activeTab === 'security'} />
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Navigation</h3>
                  <p className="text-gray-600 mb-6">Access different areas of the Legal CMS system</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quickActions.map((action, index) => (
                      <ActionCard key={action.title} action={action} index={index} />
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Your Profile!</h4>
                  <p className="text-gray-700 mb-4">
                    This is your personal account management area. Here you can update your profile information, 
                    manage security settings, and access quick navigation to main system areas.
                  </p>
                  <p className="text-gray-600 text-sm">
                    <strong>Note:</strong> For daily case management, client handling, and court scheduling, 
                    use the main Dashboard which provides full functionality for all legal operations.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-2 rounded-full ${
                      activity.type === 'case' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'client' ? 'bg-green-100 text-green-600' :
                      activity.type === 'hearing' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <FiClock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{activity.action}</p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive updates about cases and hearings</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNotifications(!notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">System Settings</h4>
                      <p className="text-sm text-gray-600">Configure system-wide preferences and defaults</p>
                    </div>
                    <Link to="/settings" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Configure
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">User Management</h4>
                      <p className="text-sm text-gray-600">Manage team members and their permissions</p>
                    </div>
                    <Link to="/users" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Manage Users
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Password</h4>
                    <p className="text-sm text-gray-600 mb-4">Last changed 30 days ago</p>
                    <Link to="/change-password" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Change Password
                    </Link>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                    <Link to="/security/2fa" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Enable 2FA
                    </Link>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Login History</h4>
                    <p className="text-sm text-gray-600 mb-4">View recent login activity and sessions</p>
                    <Link to="/security/login-history" className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      View History
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSignOutAlt className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to logout from your account?</p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;