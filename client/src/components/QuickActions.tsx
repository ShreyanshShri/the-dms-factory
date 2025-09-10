import React from 'react'
import { Download, Plus, RefreshCw } from 'lucide-react'

const QuickActions: React.FC = () => {
  const handleExport = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    console.log(`Exporting data as ${format}`)
    // In a real app, this would trigger the actual export
  }

  return (
    <div className="flex items-center space-x-3">
      <button className="btn-secondary flex items-center space-x-2">
        <RefreshCw className="h-4 w-4" />
        <span>Refresh</span>
      </button>
      
      <div className="relative group">
        <button className="btn-secondary flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
        
        {/* Dropdown */}
        <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
          <button
            onClick={() => handleExport('csv')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
          >
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
          >
            Export as PDF
          </button>
        </div>
      </div>
      
      <button className="btn-primary flex items-center space-x-2">
        <Plus className="h-4 w-4" />
        <span>New Campaign</span>
      </button>
    </div>
  )
}

export default QuickActions
