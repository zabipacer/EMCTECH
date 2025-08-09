  const CaseTableRow = ({ caseItem }) => {
    const priorityConfig = getPriorityConfig(caseItem.priority);
    const statusConfig = getStatusConfig(caseItem.status);
    const PriorityIcon = priorityConfig.icon;
    const isSelected = selectedCases.includes(caseItem.id);
    
    return (
      <motion.tr
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`hover:bg-slate-50 transition-colors ${
          isSelected ? 'bg-blue-50 border-blue-200' : 'border-slate-200'
        } border-b`}
      >
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleCaseSelection(caseItem.id)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-4">
          <div>
            <div className="font-semibold text-slate-800 truncate max-w-xs">
              {caseItem.caseTitle}
            </div>
            <div className="text-sm text-slate-600 truncate">{caseItem.clientName}</div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className={`px-2 py-1 rounded text-xs font-medium flex items-center w-fit ${priorityConfig.color}`}>
            <PriorityIcon className="w-3 h-3 mr-1" />
            {caseItem.priority?.replace(' Priority', '')}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
            {caseItem.status}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center">
            <div className="w-16 bg-slate-200 rounded-full h-2 mr-3">
              <div
                className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{ width: `${caseItem.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium min-w-[3rem]">{caseItem.progress || 0}%</span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm font-semibold text-green-600">
          {formatCurrency(caseItem.caseValue || 0)}
        </td>
        <td className="px-4 py-4 text-sm text-slate-600">
          {formatDate(caseItem.updatedAt)}
        </td>
        <td className="px-4 py-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedCase(caseItem)}
              className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
              title="View Details"
            >
              <FiEye className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors">
              <FiMoreVertical className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  export default CaseTableRow