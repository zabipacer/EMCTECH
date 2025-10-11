import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiSettings, FiRefreshCw, FiSearch, FiDownload, FiTrash2, FiEdit, FiCheck, FiClock, FiList } from 'react-icons/fi';

/*
HOW TO INTEGRATE WITH REAL BACKENDS:

1. Firebase/Firestore Integration:
   - Replace mock fetchJobs() with Firestore collection query
   - Replace runJob() with Firebase Cloud Function call
   - Implement real-time listeners for job status updates

2. OpenAI Integration:
   - Replace mock callAIGenerate() with OpenAI API call
   - Use GPT-4 for caption generation and DALL-E for images
   - Add proper error handling and rate limiting

3. Instagram API Integration:
   - Replace queue management with actual Instagram posting API
   - Implement OAuth flow for Instagram permissions
   - Add proper media upload handling

Mock functions are clearly marked with "INTEGRATION POINT" comments.
*/

// Mock data
const initialJobs = [
  {
    id: 'job1',
    name: 'Product Refresh',
    description: 'Syncs product data from CMS to all platforms',
    lastRunAt: Date.now() - 86400000, // 1 day ago
    nextRunAt: Date.now() + 86400000, // 1 day from now
    status: 'idle',
    frequency: 'daily'
  },
  {
    id: 'job2',
    name: 'Image CDN Sync',
    description: 'Uploads and optimizes images across CDN',
    lastRunAt: Date.now() - 3600000, // 1 hour ago
    nextRunAt: Date.now() + 82800000, // 23 hours from now
    status: 'success',
    frequency: 'daily'
  },
  {
    id: 'job3',
    name: 'Inventory Update',
    description: 'Updates stock levels across all channels',
    lastRunAt: Date.now() - 172800000, // 2 days ago
    nextRunAt: Date.now() + 3600000, // 1 hour from now
    status: 'failed',
    frequency: 'weekly'
  }
];

const mockProducts = [
  { id: 'p1', name: 'Pump X100', sku: 'IP-X100' },
  { id: 'p2', name: 'Valve V2', sku: 'VLV-V2' },
  { id: 'p3', name: 'Compressor 3000', sku: 'CMP-3000' },
  { id: 'p4', name: 'Filter A1', sku: 'FLT-A1' }
];

// Helper functions
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const getStatusColor = (status) => {
  const colors = {
    idle: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  return colors[status] || colors.idle;
};

// Toast component
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`p-4 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'success' ? 'bg-green-500 text-white' :
        'bg-blue-500 text-white'
      }`}
    >
      {message}
    </motion.div>
  );
};

// Main component
const Automation = () => {
  const [activeTab, setActiveTab] = useState('sync-jobs');
  const [jobs, setJobs] = useState([]);
  const [products] = useState(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [queuedPosts, setQueuedPosts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    // INTEGRATION POINT: Replace with real fetchJobs() from Firebase/Firestore
    const fetchJobs = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(initialJobs);
        }, 1000);
      });
    };

    fetchJobs().then((jobsData) => {
      setJobs(jobsData);
      setIsLoading(false);
    });

    // Load queued posts from localStorage
    const savedQueue = localStorage.getItem('instagramQueue');
    if (savedQueue) {
      setQueuedPosts(JSON.parse(savedQueue));
    }
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('instagramQueue', JSON.stringify(queuedPosts));
  }, [queuedPosts]);

  const addToast = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // INTEGRATION POINT: Replace with real runJob API call
  const runJob = async (jobId) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'running' } : job
    ));

    addToast(`Starting ${jobs.find(j => j.id === jobId)?.name}`, 'info');

    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            status: success ? 'success' : 'failed',
            lastRunAt: Date.now(),
            nextRunAt: Date.now() + (job.frequency === 'daily' ? 86400000 : 604800000)
          } : job
        ));

        const jobName = jobs.find(j => j.id === jobId)?.name;
        addToast(
          `${jobName} ${success ? 'completed successfully' : 'failed'}`,
          success ? 'success' : 'error'
        );
        resolve(success);
      }, 2000);
    });
  };

  const runAllJobs = async () => {
    addToast('Running all sync jobs sequentially', 'info');
    
    for (const job of jobs) {
      if (job.status !== 'running') {
        await runJob(job.id);
        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const updateJobFrequency = (jobId, frequency) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { 
        ...job, 
        frequency,
        nextRunAt: Date.now() + (frequency === 'daily' ? 86400000 : 604800000)
      } : job
    ));
    setSelectedJob(null);
    addToast('Job frequency updated', 'success');
  };

  // INTEGRATION POINT: Replace with real AI API call (OpenAI GPT-4 + DALL-E)
  const callAIGenerate = async (product) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const caption = `Check out our amazing ${product.name} (${product.sku})! This premium product offers exceptional quality and performance. Perfect for industrial and commercial use. #${product.name.replace(/\s+/g, '')} #${product.sku} #IndustrialEquipment`;
        
        const svgImage = `
          <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">${product.name}</text>
            <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">${product.sku}</text>
            <text x="50%" y="70%" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">AI Generated Preview</text>
          </svg>
        `;
        const imageDataUrl = `data:image/svg+xml;base64,${btoa(svgImage)}`;
        
        resolve({ caption, imageDataUrl });
      }, 1500);
    });
  };

  const generateAIContent = async () => {
    if (!selectedProduct) return;
    
    setIsGenerating(true);
    addToast('Generating AI content...', 'info');
    
    try {
      const content = await callAIGenerate(selectedProduct);
      setGeneratedContent(content);
      addToast('AI content generated successfully!', 'success');
    } catch (error) {
      addToast('Failed to generate AI content', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const queuePost = () => {
    if (!selectedProduct || !generatedContent) return;
    
    const newPost = {
      id: Date.now().toString(),
      product: selectedProduct,
      caption: generatedContent.caption,
      imageDataUrl: generatedContent.imageDataUrl,
      timestamp: Date.now(),
      status: 'queued'
    };
    
    setQueuedPosts(prev => [...prev, newPost]);
    addToast('Post added to queue', 'success');
  };

  const removeFromQueue = (postId) => {
    setQueuedPosts(prev => prev.filter(post => post.id !== postId));
    addToast('Post removed from queue', 'info');
  };

  const markAsDone = (postId) => {
    setQueuedPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, status: 'done' } : post
    ));
    addToast('Post marked as done', 'success');
  };

  const downloadImage = (imageDataUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Image downloaded', 'success');
  };

  const downloadCaption = (caption, filename) => {
    const blob = new Blob([caption], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Caption downloaded', 'success');
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Automation Dashboard</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'sync-jobs', name: 'Sync Jobs', icon: FiRefreshCw },
              { id: 'instagram', name: 'Instagram Automation', icon: FiList }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Sync Jobs Tab */}
        {activeTab === 'sync-jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Sync Jobs</h2>
              <button
                onClick={runAllJobs}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={jobs.some(job => job.status === 'running')}
              >
                <FiPlay className="w-4 h-4 mr-2" />
                Run All Now
              </button>
            </div>

            <div className="grid gap-4">
              {isLoading ? (
                // Skeleton loading states
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                        <div className="h-3 bg-gray-200 rounded w-36"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                jobs.map(job => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                        <p className="text-gray-600 mt-1">{job.description}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center mb-1">
                          <FiClock className="w-4 h-4 mr-1" />
                          Last run: {formatTime(job.lastRunAt)}
                        </div>
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 mr-1" />
                          Next run: {formatTime(job.nextRunAt)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => runJob(job.id)}
                          disabled={job.status === 'running'}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {job.status === 'running' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <FiPlay className="w-4 h-4 mr-1" />
                          )}
                          Run Now
                        </button>
                        
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="flex items-center p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Settings"
                        >
                          <FiSettings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Instagram Automation Tab */}
        {activeTab === 'instagram' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Selection */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Selector</h3>
                
                <div className="relative mb-4">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Product Details */}
              {selectedProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Product</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500 text-center">Thumbnail</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedProduct.name}</div>
                      <div className="text-sm text-gray-500">{selectedProduct.sku}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={generateAIContent}
                    disabled={isGenerating}
                    className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        Generate Caption & Image (AI)
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Content Generation & Preview */}
            <div className="lg:col-span-2 space-y-6">
              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Content</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image Preview */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Image Preview</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <img 
                          src={generatedContent.imageDataUrl} 
                          alt="Generated preview" 
                          className="w-full h-auto"
                        />
                      </div>
                      <button
                        onClick={() => downloadImage(generatedContent.imageDataUrl, selectedProduct.sku)}
                        className="w-full mt-2 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <FiDownload className="w-4 h-4 mr-2" />
                        Download Image
                      </button>
                    </div>
                    
                    {/* Caption */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Caption</h4>
                      <textarea
                        value={generatedContent.caption}
                        onChange={(e) => setGeneratedContent(prev => ({ ...prev, caption: e.target.value }))}
                        rows="8"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => downloadCaption(generatedContent.caption, selectedProduct.sku)}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <FiDownload className="w-4 h-4 mr-2" />
                          Export Caption
                        </button>
                        <button
                          onClick={queuePost}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <FiList className="w-4 h-4 mr-2" />
                          Queue Post
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Queue Manager */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Manager</h3>
                
                {queuedPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No posts in queue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queuedPosts.map(post => (
                      <motion.div
                        key={post.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <img 
                            src={post.imageDataUrl} 
                            alt="Post preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{post.product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {post.caption.substring(0, 60)}...
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatTime(post.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadCaption(post.caption, post.product.sku)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Export caption"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                          
                          {post.status === 'queued' && (
                            <>
                              <button
                                onClick={() => removeFromQueue(post.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                aria-label="Remove from queue"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => markAsDone(post.id)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                aria-label="Mark as done"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {post.status === 'done' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Done
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Settings Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configure {selectedJob.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <div className="space-y-2">
                    {['daily', 'weekly'].map(freq => (
                      <label key={freq} className="flex items-center">
                        <input
                          type="radio"
                          name="frequency"
                          value={freq}
                          checked={selectedJob.frequency === freq}
                          onChange={(e) => setSelectedJob(prev => ({ ...prev, frequency: e.target.value }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {freq}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateJobFrequency(selectedJob.id, selectedJob.frequency)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
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

export default Automation;