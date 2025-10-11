// pages/AssistantDashboard.jsx
import React from "react";
import { useLayout } from "../components/Layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";

export default function AssistantDashboard() {
  const { setTitle } = useLayout();
  const { userProfile } = useAuth();

  React.useEffect(() => {
    setTitle("Assistant Dashboard");
  }, [setTitle]);

  const assignedTasks = [
    { title: "Client Follow-up", priority: "high", due: "Today" },
    { title: "Project Documentation", priority: "medium", due: "Tomorrow" },
    { title: "Meeting Preparation", priority: "low", due: "In 2 days" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {userProfile?.firstName || 'Assistant'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here are your assigned tasks and updates.
        </p>
      </div>

      {/* Assigned Tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Tasks</h2>
        <div className="space-y-3">
          {assignedTasks.map((task, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority} priority
                  </span>
                  <span className="text-xs text-gray-500">Due: {task.due}</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
                Start
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Client Communications</h3>
          <p className="text-sm text-gray-600 mb-4">Manage client interactions and updates</p>
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
            Open Communications
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Project Files</h3>
          <p className="text-sm text-gray-600 mb-4">Access project documents and resources</p>
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
            View Files
          </button>
        </div>
      </div>
    </div>
  );
}