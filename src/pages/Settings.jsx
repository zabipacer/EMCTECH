import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSave, FiTrash2, FiMail, FiLock, FiUserPlus, FiSettings, FiShield, FiDownload, FiCopy, FiEye, FiEyeOff, FiCheck, FiX, FiEdit, FiSend, FiClock, FiUsers, FiDollarSign, FiGlobe, FiUpload, FiHelpCircle } from 'react-icons/fi';

/*
INTEGRATION HOOKS - REPLACE WITH REAL BACKEND:

1. Company Settings:
   - TODO: replace with updateCompany(details) -> call backend
   - TODO: replace with uploadLogo(file) -> cloud storage

2. Integrations:
   - TODO: replace with saveIntegrationKeys(keys) -> secure backend store
   - TODO: replace with testOpenAIKey(key) -> backend validation
   - TODO: replace with testSMTP(config) -> backend test
   - TODO: replace with testWebhook(url) -> backend test

3. Team Management:
   - TODO: replace with inviteUserApi(email, role) -> backend invite
   - TODO: replace with updateUserRole(userId, role) -> backend update
   - TODO: replace with removeUser(userId) -> backend removal

4. Billing:
   - TODO: replace with updateBilling(details) -> backend update
   - TODO: replace with downloadInvoices() -> backend export

DO NOT STORE REAL SECRETS IN LOCAL STORAGE — use secure backend.
*/

// Default settings
const defaultSettings = {
  company: {
    name: "Innova Mechanics",
    shortName: "Innova",
    slug: "innova-mechanics",
    address: "123 Industrial Ave, Lahore, Pakistan",
    currency: "PKR",
    language: "EN",
    timezone: "Asia/Karachi",
    website: "https://innovamechanics.com",
    logo: ""
  },
  integrations: {
    openaiKey: "",
    openaiStatus: "idle",
    smtp: { 
      host: "", 
      port: 587, 
      user: "", 
      pass: "",
      fromEmail: "",
      lastTested: null
    },
    bufferKey: "",
    metaAppId: "",
    webhook: "",
    webhookLastTested: null
  },
  team: [
    { 
      id: 'u1', 
      name: 'Zuhaib Zulfiqar', 
      email: 'zuhaib@example.com', 
      role: 'Admin', 
      status: 'Active', 
      lastActive: Date.now()-1000*60*60*24,
      avatar: null
    },
    { 
      id: 'u2', 
      name: 'Mubashara', 
      email: 'mubashara@example.com', 
      role: 'User', 
      status: 'Active', 
      lastActive: Date.now()-1000*60*60*48,
      avatar: null
    },
    { 
      id: 'u3', 
      name: 'Pending Invite', 
      email: 'newuser@example.com', 
      role: 'User', 
      status: 'Pending', 
      lastActive: null,
      avatar: null
    }
  ],
  billing: { 
    contactEmail: 'billing@innovamechanics.com', 
    invoicePrefix: 'INV-2025', 
    plan: 'Starter',
    billingAddress: "123 Industrial Ave, Lahore, Pakistan"
  }
};

// Helper Components
const Input = ({ label, type = "text", value, onChange, placeholder, helperText, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      {...props}
    />
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 3, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      {...props}
    />
  </div>
);

const Select = ({ label, value, onChange, options, helperText, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

const StatusChip = ({ status }) => {
  const statusConfig = {
    idle: { color: 'bg-gray-100 text-gray-800', label: 'Not Tested' },
    testing: { color: 'bg-blue-100 text-blue-800', label: 'Testing...' },
    success: { color: 'bg-green-100 text-green-800', label: 'Connected' },
    error: { color: 'bg-red-100 text-red-800', label: 'Failed' }
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", variant = "default" }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-gray-600 mb-6">{message}</p>
    <div className="flex justify-end space-x-3">
      <button
        onClick={onClose}
        className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className={`px-4 py-2 text-white rounded-lg transition-colors ${
          variant === 'danger' 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {confirmText}
      </button>
    </div>
  </Modal>
);

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`p-4 rounded-lg shadow-lg ${typeStyles[type]}`}
    >
      {message}
    </motion.div>
  );
};

// Main Component
const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('company');
  const [toasts, setToasts] = useState([]);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showSMTPPass, setShowSMTPPass] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, data: null });
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: '', role: 'User', message: '' });
  const [testEmail, setTestEmail] = useState('');

  // Load saved settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('__mvp_settings_saved');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const handleNestedChange = (section, subfield, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subfield]: {
          ...prev[section][subfield],
          [field]: value
        }
      }
    }));
    setUnsavedChanges(true);
  };

  const saveAllSettings = async () => {
    // TODO: replace with real backend save
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem('__mvp_settings_saved', JSON.stringify(settings));
    setUnsavedChanges(false);
    addToast('All settings saved successfully!', 'success');
  };

  const resetSettings = () => {
    if (unsavedChanges) {
      setConfirmModal({
        open: true,
        data: {
          title: 'Discard Changes?',
          message: 'You have unsaved changes. Are you sure you want to reset?',
          onConfirm: () => {
            setSettings(defaultSettings);
            setUnsavedChanges(false);
            addToast('Settings reset to defaults', 'info');
          }
        }
      });
    } else {
      setSettings(defaultSettings);
      addToast('Settings reset to defaults', 'info');
    }
  };

  const testOpenAIKey = async () => {
    handleSettingChange('integrations', 'openaiStatus', 'testing');
    
    // TODO: replace with testOpenAIKey(settings.integrations.openaiKey)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = Math.random() > 0.3; // 70% success rate
    handleSettingChange('integrations', 'openaiStatus', success ? 'success' : 'error');
    addToast(
      success ? 'OpenAI API key is valid!' : 'Invalid OpenAI API key',
      success ? 'success' : 'error'
    );
  };

  const testSMTPConnection = async () => {
    // TODO: replace with testSMTP(settings.integrations.smtp)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.4; // 60% success rate
    addToast(
      success ? 'SMTP connection successful!' : 'SMTP connection failed',
      success ? 'success' : 'error'
    );
  };

  const testWebhook = async () => {
    // TODO: replace with testWebhook(settings.integrations.webhook)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const success = Math.random() > 0.2; // 80% success rate
    handleSettingChange('integrations', 'webhookLastTested', Date.now());
    addToast(
      success ? 'Webhook test successful!' : 'Webhook test failed',
      success ? 'success' : 'error'
    );
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('File size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setLogoPreview(dataUrl);
      handleSettingChange('company', 'logo', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    handleSettingChange('company', 'logo', '');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  const inviteUser = (email, role) => {
    // TODO: replace with inviteUserApi(email, role)
    const newUser = {
      id: `u${Date.now()}`,
      name: 'Pending Invite',
      email,
      role,
      status: 'Pending',
      lastActive: null,
      avatar: null
    };
    
    setSettings(prev => ({
      ...prev,
      team: [...prev.team, newUser]
    }));
    addToast(`Invitation sent to ${email}`, 'success');
  };

  const updateUserRole = (userId, newRole) => {
    // TODO: replace with updateUserRole(userId, newRole)
    setSettings(prev => ({
      ...prev,
      team: prev.team.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    }));
    addToast('User role updated', 'success');
  };

  const removeUser = (userId) => {
    // TODO: replace with removeUser(userId)
    setSettings(prev => ({
      ...prev,
      team: prev.team.filter(user => user.id !== userId)
    }));
    addToast('User removed', 'info');
  };

  const downloadInvoices = async () => {
    // TODO: replace with downloadInvoices()
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    addToast('Invoice history downloaded as CSV', 'success');
    setIsExporting(false);
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      addToast('Please enter an email address', 'error');
      return;
    }

    // TODO: replace with actual email sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.2; // 80% success rate
    addToast(
      success ? `Test email sent to ${testEmail}` : 'Failed to send test email',
      success ? 'success' : 'error'
    );
    if (success) {
      setTestEmailModal(false);
      setTestEmail('');
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const sections = [
    { id: 'company', name: 'Company Settings', icon: FiSettings },
    { id: 'integrations', name: 'Integrations', icon: FiShield },
    { id: 'team', name: 'Team Management', icon: FiUsers },
    { id: 'billing', name: 'Billing & Plan', icon: FiDollarSign }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'company':
        return (
          <motion.div
            key="company"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiSettings className="w-5 h-5 mr-2" />
                Company Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Company Name"
                  value={settings.company.name}
                  onChange={(e) => handleSettingChange('company', 'name', e.target.value)}
                  placeholder="Enter company name"
                />
                <Input
                  label="Short Name"
                  value={settings.company.shortName}
                  onChange={(e) => handleSettingChange('company', 'shortName', e.target.value)}
                  placeholder="Enter short name"
                />
              </div>

              <Textarea
                label="Address"
                value={settings.company.address}
                onChange={(e) => handleSettingChange('company', 'address', e.target.value)}
                placeholder="Enter company address"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Currency"
                  value={settings.company.currency}
                  onChange={(e) => handleSettingChange('company', 'currency', e.target.value)}
                  options={[
                    { value: 'USD', label: 'USD - US Dollar' },
                    { value: 'PKR', label: 'PKR - Pakistani Rupee' },
                    { value: 'EUR', label: 'EUR - Euro' }
                  ]}
                  helperText="Used for invoices and pricing"
                />
                <Select
                  label="Default Language"
                  value={settings.company.language}
                  onChange={(e) => handleSettingChange('company', 'language', e.target.value)}
                  options={[
                    { value: 'EN', label: 'English' },
                    { value: 'RU', label: 'Russian' },
                    { value: 'UZ', label: 'Uzbek' }
                  ]}
                  helperText="Interface language"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {(settings.company.logo || logoPreview) ? (
                    <div className="flex items-center justify-center space-x-4">
                      <img 
                        src={logoPreview || settings.company.logo} 
                        alt="Company logo" 
                        className="h-16 w-16 object-contain"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm text-gray-600">Logo uploaded</p>
                        <button
                          onClick={removeLogo}
                          className="text-red-600 text-sm hover:text-red-700 mt-1"
                        >
                          Remove logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop your logo here, or{' '}
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Time Zone"
                  value={settings.company.timezone}
                  onChange={(e) => handleSettingChange('company', 'timezone', e.target.value)}
                  options={[
                    { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
                    { value: 'UTC', label: 'UTC' },
                    { value: 'America/New_York', label: 'America/New_York (EST)' }
                  ]}
                />
                <Input
                  label="Website URL"
                  type="url"
                  value={settings.company.website}
                  onChange={(e) => handleSettingChange('company', 'website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              {/* Slug Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Slug</label>
                <div className="flex items-center">
                  <Input
                    value={settings.company.slug}
                    onChange={(e) => handleSettingChange('company', 'slug', e.target.value)}
                    placeholder="company-slug"
                  />
                  <button
                    onClick={() => copyToClipboard(settings.company.slug)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Used in URLs and API endpoints</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  onClick={saveAllSettings}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Company Settings
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'integrations':
        return (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiShield className="w-5 h-5 mr-2" />
                Integrations
              </h2>
            </div>
            <div className="p-6 space-y-8">
              {/* OpenAI Integration */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">OpenAI Integration</h3>
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <div className="relative">
                        <input
                          type={showOpenAIKey ? "text" : "password"}
                          value={settings.integrations.openaiKey}
                          onChange={(e) => handleSettingChange('integrations', 'openaiKey', e.target.value)}
                          placeholder="sk-..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        <button
                          onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showOpenAIKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={testOpenAIKey}
                      disabled={!settings.integrations.openaiKey || settings.integrations.openaiStatus === 'testing'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {settings.integrations.openaiStatus === 'testing' ? 'Testing...' : 'Test Key'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusChip status={settings.integrations.openaiStatus} />
                    <p className="text-xs text-gray-500">Used for caption generation and smart templates</p>
                  </div>
                </div>
              </div>

              {/* SMTP Integration */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Email (SMTP) Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="SMTP Host"
                      value={settings.integrations.smtp.host}
                      onChange={(e) => handleNestedChange('integrations', 'smtp', 'host', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                    <Input
                      label="SMTP Port"
                      type="number"
                      value={settings.integrations.smtp.port}
                      onChange={(e) => handleNestedChange('integrations', 'smtp', 'port', parseInt(e.target.value))}
                      placeholder="587"
                    />
                  </div>
                  <Input
                    label="SMTP Username"
                    value={settings.integrations.smtp.user}
                    onChange={(e) => handleNestedChange('integrations', 'smtp', 'user', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                    <div className="relative">
                      <input
                        type={showSMTPPass ? "text" : "password"}
                        value={settings.integrations.smtp.pass}
                        onChange={(e) => handleNestedChange('integrations', 'smtp', 'pass', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      />
                      <button
                        onClick={() => setShowSMTPPass(!showSMTPPass)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSMTPPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Input
                    label="From Email"
                    type="email"
                    value={settings.integrations.smtp.fromEmail}
                    onChange={(e) => handleNestedChange('integrations', 'smtp', 'fromEmail', e.target.value)}
                    placeholder="noreply@yourcompany.com"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={testSMTPConnection}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FiMail className="w-4 h-4 mr-2" />
                      Test SMTP Connection
                    </button>
                    <button
                      onClick={() => setTestEmailModal(true)}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiSend className="w-4 h-4 mr-2" />
                      Send Test Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook Integration */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Webhook Integration</h3>
                <div className="space-y-4">
                  <Input
                    label="Webhook URL"
                    type="url"
                    value={settings.integrations.webhook}
                    onChange={(e) => handleSettingChange('integrations', 'webhook', e.target.value)}
                    placeholder="https://api.example.com/webhook"
                    helperText="Receive real-time notifications for new posts and analytics"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusChip status={settings.integrations.webhookLastTested ? 'success' : 'idle'} />
                      {settings.integrations.webhookLastTested && (
                        <span className="text-xs text-gray-500">
                          Last tested: {new Date(settings.integrations.webhookLastTested).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={testWebhook}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Test Webhook
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  onClick={saveAllSettings}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Integrations
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'team':
        return (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiUsers className="w-5 h-5 mr-2" />
                  Team Management
                </h2>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiUserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {settings.team.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{user.name}</h3>
                          {user.status === 'Pending' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            Last active: {formatLastActive(user.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        options={[
                          { value: 'User', label: 'User' },
                          { value: 'Admin', label: 'Admin' }
                        ]}
                        className="w-32"
                      />
                      <button
                        onClick={() => setConfirmModal({
                          open: true,
                          data: {
                            title: 'Remove Team Member',
                            message: `Are you sure you want to remove ${user.name} from the team?`,
                            onConfirm: () => removeUser(user.id),
                            variant: 'danger'
                          }
                        })}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'billing':
        return (
          <motion.div
            key="billing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiDollarSign className="w-5 h-5 mr-2" />
                Billing & Plan
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{settings.billing.plan} Plan</h3>
                    <p className="text-blue-100 mt-1">Active until December 31, 2025</p>
                  </div>
                  <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                    Upgrade Plan
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-blue-200 text-sm">Team Members</p>
                    <p className="font-semibold">5/10</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Posts per Month</p>
                    <p className="font-semibold">Unlimited</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Storage</p>
                    <p className="font-semibold">50GB</p>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Billing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Billing Contact Email"
                    type="email"
                    value={settings.billing.contactEmail}
                    onChange={(e) => handleSettingChange('billing', 'contactEmail', e.target.value)}
                    placeholder="billing@company.com"
                  />
                  <Input
                    label="Invoice Prefix"
                    value={settings.billing.invoicePrefix}
                    onChange={(e) => handleSettingChange('billing', 'invoicePrefix', e.target.value)}
                    placeholder="INV-2025"
                    helperText="Prefix for all invoice numbers"
                  />
                </div>
                <Textarea
                  label="Billing Address"
                  value={settings.billing.billingAddress}
                  onChange={(e) => handleSettingChange('billing', 'billingAddress', e.target.value)}
                  placeholder="Enter billing address"
                  rows={3}
                />
              </div>

              {/* Invoice History */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Invoice History</h3>
                <div className="border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Recent Invoices</span>
                    <button
                      onClick={downloadInvoices}
                      disabled={isExporting}
                      className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <FiDownload className="w-4 h-4 mr-1" />
                      {isExporting ? 'Exporting...' : 'Export All'}
                    </button>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[
                      { id: 'INV-2025-001', date: 'Nov 15, 2024', amount: '$49.00', status: 'Paid' },
                      { id: 'INV-2025-002', date: 'Dec 15, 2024', amount: '$49.00', status: 'Paid' },
                      { id: 'INV-2025-003', date: 'Jan 15, 2025', amount: '$49.00', status: 'Pending' }
                    ].map(invoice => (
                      <div key={invoice.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.id}</p>
                          <p className="text-sm text-gray-500">{invoice.date}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">{invoice.amount}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invoice.status === 'Paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                          <button className="text-blue-600 hover:text-blue-700 text-sm">
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  onClick={saveAllSettings}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Billing Settings
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your company configuration and integrations</p>
            </div>
            <div className="flex items-center space-x-3">
              {unsavedChanges && (
                <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={resetSettings}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={saveAllSettings}
                disabled={!unsavedChanges}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSave className="w-4 h-4 mr-2" />
                Save All
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow p-4"
            >
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {renderSection()}
          </div>

          {/* Right Column - Preview & Help */}
          <div className="lg:w-80 space-y-6">
            {/* Live Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {(settings.company.logo || logoPreview) ? (
                    <img 
                      src={logoPreview || settings.company.logo} 
                      alt="Company logo" 
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">Logo</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{settings.company.name}</div>
                    <div className="text-sm text-gray-500">{settings.company.slug}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Currency: {settings.company.currency}</div>
                  <div>Language: {settings.company.language}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded text-xs text-gray-600">
                  <p>Sample email footer:</p>
                  <p className="mt-1">{settings.company.name} • {settings.company.website}</p>
                </div>
              </div>
            </motion.div>

            {/* Help Box */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <FiHelpCircle className="w-5 h-5 mr-2" />
                Help & Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• API keys are used for AI content generation</li>
                <li>• SMTP settings power email notifications</li>
                <li>• Upgrade plan for Buffer integration</li>
                <li>• Webhooks enable real-time updates</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={newInvite.email}
            onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
            placeholder="colleague@example.com"
          />
          <Select
            label="Role"
            value={newInvite.role}
            onChange={(e) => setNewInvite(prev => ({ ...prev, role: e.target.value }))}
            options={[
              { value: 'User', label: 'User' },
              { value: 'Admin', label: 'Admin' }
            ]}
          />
          <Textarea
            label="Optional Message"
            value={newInvite.message}
            onChange={(e) => setNewInvite(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Add a personal message..."
            rows={2}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (newInvite.email && !settings.team.find(user => user.email === newInvite.email)) {
                  inviteUser(newInvite.email, newInvite.role);
                  setNewInvite({ email: '', role: 'User', message: '' });
                  setInviteModalOpen(false);
                } else {
                  addToast('Please enter a valid email address', 'error');
                }
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiSend className="w-4 h-4 mr-2" />
              Send Invite
            </button>
          </div>
        </div>
      </Modal>

      {/* Test Email Modal */}
      <Modal isOpen={testEmailModal} onClose={() => setTestEmailModal(false)} title="Send Test Email">
        <div className="space-y-4">
          <Input
            label="Test Email Address"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            helperText="We'll send a test email to verify your SMTP settings"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setTestEmailModal(false)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={sendTestEmail}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiSend className="w-4 h-4 mr-2" />
              Send Test Email
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, data: null })}
        onConfirm={confirmModal.data?.onConfirm}
        title={confirmModal.data?.title}
        message={confirmModal.data?.message}
        confirmText={confirmModal.data?.confirmText}
        variant={confirmModal.data?.variant}
      />
    </div>
  );
};

export default Settings;