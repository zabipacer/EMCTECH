import React, { useState, useEffect } from "react";

export default function AssignAssociatesModal({
  open,
  onClose,
  selectedCase,
  users,
  onSave
}) {
  const [associatePermissions, setAssociatePermissions] = useState({});

  useEffect(() => {
    if (selectedCase?.associates) {
      const initial = {};
      selectedCase.associates.forEach((a) => {
        initial[a.id] = a.permission || "view";
      });
      setAssociatePermissions(initial);
    }
  }, [selectedCase]);

  const updatePermission = (userId, permission) => {
    setAssociatePermissions((prev) => ({
      ...prev,
      [userId]: permission
    }));
  };

  const handleSave = () => {
    const assignedList = Object.keys(associatePermissions).map((id) => ({
      id,
      permission: associatePermissions[id]
    }));
    onSave(selectedCase?.id, assignedList);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold">Assign Associates</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Associates List */}
        <div className="mt-4 max-h-72 overflow-y-auto space-y-3">
          {users?.map((user) => {
            const currentPermission = associatePermissions[user.id] || "none";
            return (
              <div
                key={user.id}
                className="flex items-center justify-between border p-2 rounded-md"
              >
                <span className="font-medium">{user.name}</span>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 rounded ${
                      currentPermission === "none"
                        ? "bg-gray-400 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => updatePermission(user.id, "none")}
                  >
                    None
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${
                      currentPermission === "view"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => updatePermission(user.id, "view")}
                  >
                    Assign
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${
                      currentPermission === "edit"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => updatePermission(user.id, "edit")}
                  >
                    Assign + Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
