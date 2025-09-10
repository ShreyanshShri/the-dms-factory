import React from 'react'
import { Users, Target, BarChart3, Download, Upload, Settings, Zap, Shield, Clock } from 'lucide-react'

const Tools: React.FC = () => {
  const tools = [
    {
      id: '1',
      name: 'Audience Builder',
      description: 'Build and segment your target audience for campaigns',
      icon: Users,
      status: 'active',
      lastUsed: '2 hours ago'
    },
    {
      id: '2',
      name: 'Message Templates',
      description: 'Create and manage personalized message templates',
      icon: Target,
      status: 'active',
      lastUsed: '1 day ago'
    },
    {
      id: '3',
      name: 'Analytics Dashboard',
      description: 'Advanced analytics and reporting tools',
      icon: BarChart3,
      status: 'active',
      lastUsed: '3 hours ago'
    },
    {
      id: '4',
      name: 'Data Import/Export',
      description: 'Import and export campaign data in various formats',
      icon: Download,
      status: 'active',
      lastUsed: '1 week ago'
    },
    {
      id: '5',
      name: 'Automation Rules',
      description: 'Set up automated responses and workflows',
      icon: Zap,
      status: 'beta',
      lastUsed: 'Never'
    },
    {
      id: '6',
      name: 'Account Health Monitor',
      description: 'Monitor account health and prevent suspensions',
      icon: Shield,
      status: 'active',
      lastUsed: '5 hours ago'
    },
    {
      id: '7',
      name: 'Scheduling Tool',
      description: 'Schedule campaigns and messages for optimal timing',
      icon: Clock,
      status: 'active',
      lastUsed: '2 days ago'
    },
    {
      id: '8',
      name: 'Advanced Settings',
      description: 'Configure advanced platform settings and preferences',
      icon: Settings,
      status: 'active',
      lastUsed: '1 week ago'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tools & Utilities
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access powerful tools to enhance your Buildfluence outreach campaigns
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <div key={tool.id} className="card p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                  <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tool.status === 'active' 
                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
                    : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300'
                }`}>
                  {tool.status === 'active' ? 'Active' : 'Beta'}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{tool.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{tool.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Last used: {tool.lastUsed}</span>
                <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                  Open Tool
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <span className="text-gray-900 dark:text-white">Create New Template</span>
              <Target className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <span className="text-gray-900 dark:text-white">Import Contact List</span>
              <Upload className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <span className="text-gray-900 dark:text-white">Generate Report</span>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">API Status</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-success-600 dark:text-success-400 text-sm">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Database</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-success-600 dark:text-success-400 text-sm">Healthy</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Queue System</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-success-600 dark:text-success-400 text-sm">Normal</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Rate Limits</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-warning-600 dark:text-warning-400 text-sm">75% Used</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tools
