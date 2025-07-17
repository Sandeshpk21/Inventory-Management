import { useState, useEffect } from 'react'
import { transactionsAPI } from '../services/api'
import { 
  Package, 
  AlertTriangle, 
  ClipboardList, 
  Activity,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await transactionsAPI.getDashboard()
        setDashboardData(response.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-500">Please refresh the page or try again later.</p>
        </div>
      </div>
    )
  }

  const summaryCards = [
    {
      title: 'Total Stock Items',
      value: dashboardData.total_stock_items,
      icon: Package,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: 'Items in inventory'
    },
    {
      title: 'Items To Be Ordered',
      value: dashboardData.items_to_be_ordered,
      icon: AlertTriangle,
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      description: 'Need attention'
    },
    {
      title: 'Active Requirements',
      value: dashboardData.active_projects,
      icon: ClipboardList,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      description: 'Ongoing work'
    },
    {
      title: 'Total Purchase Orders',
      value: dashboardData.total_purchase_orders,
      icon: FileText,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'All time orders'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Overview of your inventory management system</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-2">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {summaryCards.map((card, index) => (
            <div 
              key={card.title} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
                <div className={`flex-shrink-0 p-3 rounded-xl ${card.color} shadow-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                <Activity className="h-5 w-5 text-blue-100" />
              </div>
            </div>
            
            <div className="p-6">
              {dashboardData.recent_transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No recent transactions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recent_transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.action === 'Purchase' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          {transaction.action === 'Purchase' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.item?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {transaction.quantity} units
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.action === 'Purchase' 
                            ? 'bg-green-100 text-green-800'
                            : transaction.action === 'Issue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Purchase Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Purchase Orders</h2>
                <FileText className="h-5 w-5 text-purple-100" />
              </div>
            </div>
            
            <div className="p-6">
              {dashboardData.recent_purchase_orders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No recent purchase orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recent_purchase_orders.map((po) => (
                    <div key={po.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{po.po_number}</p>
                            <p className="text-xs text-gray-500">{po.supplier_name}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          po.status === 'Received' 
                            ? 'bg-green-100 text-green-800'
                            : po.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {po.status === 'Received' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {po.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                          {po.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {format(new Date(po.created_at), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{po.total_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 