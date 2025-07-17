import { useState, useEffect } from 'react'
import { transactionsAPI } from '../services/api'
import { Activity, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await transactionsAPI.getAll()
      setTransactions(response.data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'Purchase':
        return <TrendingUp className="h-4 w-4" />
      case 'Issue':
        return <TrendingDown className="h-4 w-4" />
      case 'Return':
        return <RotateCcw className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'Purchase':
        return 'bg-green-100 text-green-800'
      case 'Issue':
        return 'bg-red-100 text-red-800'
      case 'Return':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600">View all inventory movement history</p>
      </div>

      <div className="card">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.item?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.item?.code || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(transaction.action)}`}>
                        {getActionIcon(transaction.action)}
                        <span className="ml-1">{transaction.action}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.purchase_order_id && (
                        <span className="text-blue-600">PO #{transaction.purchase_order_id}</span>
                      )}
                      {transaction.requirement_id && (
                        <span className="text-green-600">Project #{transaction.requirement_id}</span>
                      )}
                      {!transaction.purchase_order_id && !transaction.requirement_id && (
                        <span className="text-gray-500">Manual</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 