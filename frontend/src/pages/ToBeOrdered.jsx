import { useState, useEffect } from 'react'
import { transactionsAPI, purchaseOrdersAPI } from '../services/api'
import { AlertTriangle, Package, ClipboardList, Plus } from 'lucide-react'

// Helper for INR currency
const formatINR = (amount) => amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export default function ToBeOrdered() {
  const [toBeOrdered, setToBeOrdered] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [poForm, setPoForm] = useState({
    supplier_name: '',
    expected_delivery_date: '',
    items: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchToBeOrdered()
  }, [])

  const fetchToBeOrdered = async () => {
    try {
      const response = await transactionsAPI.getToBeOrdered()
      setToBeOrdered(response.data)
    } catch (error) {
      console.error('Error fetching to-be-ordered items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (itemId) => {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(toBeOrdered.map((item) => item.item.id))
    } else {
      setSelectedIds([])
    }
  }

  const openCreatePOModal = () => {
    // Pre-fill PO items with selected items
    const items = toBeOrdered
      .filter((item) => selectedIds.includes(item.item.id))
      .map((item) => ({
        item_id: item.item.id,
        quantity: item.shortage,
        unit_price: item.item.unit_price || 0,
        name: item.item.name,
        code: item.item.code
      }))
    setPoForm({
      supplier_name: '',
      expected_delivery_date: '',
      items
    })
    setShowCreateModal(true)
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handlePOItemChange = (idx, field, value) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleCreatePO = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const payload = {
        supplier_name: poForm.supplier_name,
        expected_delivery_date: poForm.expected_delivery_date,
        items: poForm.items.map(({ item_id, quantity, unit_price }) => ({ item_id, quantity, unit_price }))
      }
      await purchaseOrdersAPI.create(payload)
      setShowCreateModal(false)
      setSelectedIds([])
      setSuccessMsg('Purchase Order created successfully!')
      fetchToBeOrdered()
    } catch (error) {
      setErrorMsg('Failed to create Purchase Order.')
    } finally {
      setSubmitting(false)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To-Be-Ordered</h1>
          <p className="text-gray-600">Items that need to be ordered for active projects</p>
        </div>
        <button
          className="btn-primary flex items-center disabled:opacity-50"
          disabled={selectedIds.length === 0}
          onClick={openCreatePOModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </button>
      </div>

      {successMsg && <div className="text-green-600 font-medium">{successMsg}</div>}
      {errorMsg && <div className="text-red-600 font-medium">{errorMsg}</div>}

      <div className="card">
        {toBeOrdered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items to order</h3>
            <p className="mt-1 text-sm text-gray-500">All required items are in stock.</p>
          </div>
        ) : (
          <form>
            <div className="mb-2 flex items-center">
              <input
                type="checkbox"
                checked={selectedIds.length === toBeOrdered.length && toBeOrdered.length > 0}
                onChange={handleSelectAll}
                className="mr-2"
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm text-gray-700 font-medium">Select All</label>
            </div>
            <div className="space-y-6">
              {toBeOrdered.map((item) => (
                <div key={item.item.id} className={`border border-gray-200 rounded-lg p-4 flex items-start ${selectedIds.includes(item.item.id) ? 'bg-blue-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.item.id)}
                    onChange={() => handleSelect(item.item.id)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-medium text-gray-900">{item.item.name}</h3>
                      <span className="text-sm text-gray-500">({item.item.code})</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Total Required:</span>
                        <span className="ml-2 text-gray-900">{item.total_required}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Current Stock:</span>
                        <span className="ml-2 text-gray-900">{item.current_stock}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Shortage:</span>
                        <span className="ml-2 text-red-600 font-medium">{item.shortage}</span>
                      </div>
                    </div>
                  </div>
                  {item.requirements.length > 0 && (
                    <div className="ml-6 mt-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Required by Projects:</h4>
                      <div className="space-y-1">
                        {item.requirements.map((req) => (
                          <div key={req.id} className="flex items-center space-x-2 text-xs">
                            <ClipboardList className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{req.project_name}</span>
                            {req.description && (
                              <span className="text-gray-500">- {req.description}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>
        )}
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Purchase Order</h3>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={poForm.supplier_name}
                    onChange={(e) => setPoForm((prev) => ({ ...prev, supplier_name: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={poForm.expected_delivery_date}
                    onChange={(e) => setPoForm((prev) => ({ ...prev, expected_delivery_date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <div className="space-y-2">
                    {poForm.items.map((item, idx) => (
                      <div key={item.item_id} className="flex items-center space-x-2">
                        <span className="text-xs text-gray-700 w-32">{item.name} ({item.code})</span>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handlePOItemChange(idx, 'quantity', parseInt(e.target.value))}
                          className="input-field w-20"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unit_price}
                          onChange={(e) => handlePOItemChange(idx, 'unit_price', parseFloat(e.target.value))}
                          className="input-field w-24"
                        />
                        <span className="text-xs text-gray-500 ml-2">{formatINR(item.unit_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create PO'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
                {errorMsg && <div className="text-red-600 text-sm mt-2">{errorMsg}</div>}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 