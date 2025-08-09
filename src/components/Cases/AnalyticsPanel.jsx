 const AnalyticsPanel = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 mb-8 overflow-hidden"
    >
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <FiBarChart className="mr-3 text-blue-600" />
        Analytics Overview
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <FiFileText className="text-blue-600 text-3xl mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-800">{analytics.totalCases}</div>
          <div className="text-sm text-blue-600">Total Cases</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <FiDollarSign className="text-green-600 text-3xl mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-800">{formatCurrency(analytics.totalValue)}</div>
          <div className="text-sm text-green-600">Total Value</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-xl">
          <FiClock className="text-purple-600 text-3xl mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-800">{analytics.totalHours}h</div>
          <div className="text-sm text-purple-600">Billable Hours</div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <FiActivity className="text-orange-600 text-3xl mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-800">{analytics.avgProgress}%</div>
          <div className="text-sm text-orange-600">Avg Progress</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Status Distribution</h4>
          <div className="space-y-2">
            {Object.entries(analytics.statusCounts).map(([status, count]) => {
              const statusConfig = getStatusConfig(status);
              return (
                <div key={status} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${statusConfig.dot} mr-2`}></div>
                    <span className="text-sm text-slate-700">{status}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Priority Distribution</h4>
          <div className="space-y-2">
            {Object.entries(analytics.priorityCounts).map(([priority, count]) => {
              const priorityConfig = getPriorityConfig(priority);
              const IconComponent = priorityConfig.icon;
              return (
                <div key={priority} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <IconComponent className="w-3 h-3 text-slate-600 mr-2" />
                    <span className="text-sm text-slate-700">{priority.replace(' Priority', '')}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Progress */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Task Progress</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-700">Completed Tasks</span>
              <span className="font-semibold text-green-600">{analytics.completedTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-700">Total Tasks</span>
              <span className="font-semibold text-slate-800">{analytics.totalTasks}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="h-2 bg-green-500 rounded-full" 
                style={{ 
                  width: `${analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="text-center text-sm text-slate-600">
              {analytics.totalTasks > 0 ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0}% Complete
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
export default AnalyticsPanel