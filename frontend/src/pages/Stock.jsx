import { useState, useEffect } from 'react'
import { stockAPI } from '../services/api'
import { Plus, Database, AlertTriangle, CheckCircle, Search } from 'lucide-react'

export default function Stock() {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    unit_price: 0,
    minimum_stock: 0
  })
  const [updateQuantity, setUpdateQuantity] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    try {
      const response = await stockAPI.getAll()
      setStock(response.data)
    } catch (error) {
      console.error('Error fetching stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async (e) => {
    e.preventDefault()
    try {
      await stockAPI.createItem(formData)
      setShowCreateModal(false)
      setFormData({
        name: '',
        code: '',
        description: '',
        unit_price: 0,
        minimum_stock: 0
      })
      fetchStock()
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleUpdateStock = async (e) => {
    e.preventDefault()
    try {
      await stockAPI.update(selectedStock.item_id, { current_quantity: updateQuantity })
      setShowUpdateModal(false)
      setUpdateQuantity(0)
      setSelectedStock(null)
      fetchStock()
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const getStockStatus = (stockItem) => {
    if (stockItem.current_quantity <= 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    if (stockItem.current_quantity <= stockItem.item.minimum_stock) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  }

  // Helper for INR currency
  const formatINR = (amount) => amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  // Helper for IST date
  const formatIST = (date) => new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: '2-digit' });

  // Filtered stock based on search
  const filteredStock = stock.filter((stockItem) => {
    const q = search.toLowerCase()
    return (
      stockItem.item.name.toLowerCase().includes(q) ||
      stockItem.item.code.toLowerCase().includes(q) ||
      (stockItem.item.description && stockItem.item.description.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Manage inventory items and stock levels</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center mb-4 max-w-md">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search by name, code, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Stock List */}
      <div className="card">
        {filteredStock.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No stock items found</p>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Minimum Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStock.map((stockItem) => {
                  const status = getStockStatus(stockItem)
                  return (
                    <tr key={stockItem.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {stockItem.item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stockItem.item.code}
                          </div>
                          {stockItem.item.description && (
                            <div className="text-sm text-gray-500">
                              {stockItem.item.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stockItem.current_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stockItem.item.minimum_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatINR(stockItem.item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {status.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedStock(stockItem)
                            setUpdateQuantity(stockItem.current_quantity)
                            setShowUpdateModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Item</h3>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: parseInt(e.target.value) }))}
                    className="input-field"
                  />
                </div>

                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showUpdateModal && selectedStock && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Stock Level</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Item: <span className="font-medium">{selectedStock.item.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Current Stock: <span className="font-medium">{selectedStock.current_quantity}</span>
                </p>
              </div>
              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={updateQuantity}
                    onChange={(e) => setUpdateQuantity(parseInt(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Update Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 