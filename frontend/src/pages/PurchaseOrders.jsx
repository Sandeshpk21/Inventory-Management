import { useState, useEffect } from 'react'
import { purchaseOrdersAPI, stockAPI } from '../services/api'
import { Plus, Package, CheckCircle, Clock, Eye } from 'lucide-react'
import { format } from 'date-fns'

// Helper for INR currency
const formatINR = (amount) => amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
// Helper for IST date
const formatIST = (date) => new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: '2-digit' });
const formatISTDateTime = (date) => new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [formData, setFormData] = useState({
    supplier_name: '',
    expected_delivery_date: '',
    items: [{ item_id: '', quantity: 1, unit_price: 0 }]
  })
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [poToReceive, setPoToReceive] = useState(null)
  const [invoices, setInvoices] = useState([{
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 16),
    amount: 0,
    description: ''
  }])

  useEffect(() => {
    fetchPurchaseOrders()
    fetchItems()
  }, [])

  const fetchPurchaseOrders = async () => {
    try {
      const response = await purchaseOrdersAPI.getAll()
      setPurchaseOrders(response.data)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await stockAPI.getItems()
      setItems(response.data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleCreatePO = async (e) => {
    e.preventDefault()
    try {
      await purchaseOrdersAPI.create(formData)
      setShowCreateModal(false)
      setFormData({
        supplier_name: '',
        expected_delivery_date: '',
        items: [{ item_id: '', quantity: 1, unit_price: 0 }]
      })
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Error creating purchase order:', error)
    }
  }

  const handleReceivePO = async (poId) => {
    setPoToReceive(poId)
    setInvoices([{
      invoice_number: '',
      invoice_date: new Date().toISOString().slice(0, 16),
      amount: 0,
      description: ''
    }])
    setShowInvoiceModal(true)
  }

  const confirmReceivePO = async () => {
    try {
      // Filter out empty invoices
      const validInvoices = invoices.filter(inv => inv.invoice_number.trim() !== '')
      await purchaseOrdersAPI.receive(poToReceive, validInvoices)
      setShowInvoiceModal(false)
      setPoToReceive(null)
      setInvoices([{
        invoice_number: '',
        invoice_date: new Date().toISOString().slice(0, 16),
        amount: 0,
        description: ''
      }])
      fetchPurchaseOrders()
    } catch (error) {
      alert('Failed to receive PO: ' + (error?.response?.data?.detail || 'Unknown error'))
    }
  }

  const addInvoice = () => {
    setInvoices(prev => [...prev, {
      invoice_number: '',
      invoice_date: new Date().toISOString().slice(0, 16),
      amount: 0,
      description: ''
    }])
  }

  const removeInvoice = (index) => {
    setInvoices(prev => prev.filter((_, i) => i !== index))
  }

  const updateInvoice = (index, field, value) => {
    setInvoices(prev => prev.map((inv, i) => 
      i === index ? { ...inv, [field]: value } : inv
    ))
  }

  const addItemToForm = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_id: '', quantity: 1, unit_price: 0 }]
    }))
  }

  const removeItemFromForm = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateFormItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage purchase orders and track deliveries</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </button>
      </div>

      {/* Purchase Orders List */}
      <div className="card">
        {purchaseOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No purchase orders found</p>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoices
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedPO(po); setShowDetailsModal(true); }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {po.po_number.startsWith('PO-') ? po.po_number : `PO-${po.po_number}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatIST(po.expected_delivery_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatINR(po.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        po.status === 'Received' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {po.status === 'Received' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.status === 'Received' ? (
                        po.invoices && po.invoices.length > 0 ? (
                          <div className="space-y-1">
                            {po.invoices.map((invoice, idx) => (
                              <div key={idx} className="text-xs">
                                {invoice.invoice_number} ({formatINR(invoice.amount)})
                              </div>
                            ))}
                          </div>
                        ) : '-'
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={e => e.stopPropagation()}>
                      {po.status === 'Pending' && (
                        <button
                          onClick={() => handleReceivePO(po.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {po.status === 'Received' && (
                        <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                          <Package className="h-4 w-4 mr-1" />All Set!
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Purchase Order</h3>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={formData.supplier_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <div className="grid grid-cols-12 gap-2 mb-1">
                    <div className="col-span-5"></div>
                    <div className="col-span-3 text-xs text-gray-500 font-medium">Quantity</div>
                    <div className="col-span-3 text-xs text-gray-500 font-medium">Unit Price</div>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <select
                        required
                        value={item.item_id}
                        onChange={(e) => updateFormItem(index, 'item_id', e.target.value)}
                        className="input-field flex-1"
                      >
                        <option value="">Select Item</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateFormItem(index, 'quantity', parseInt(e.target.value))}
                        className="input-field w-20"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateFormItem(index, 'unit_price', parseFloat(e.target.value))}
                        className="input-field w-24"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemFromForm(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItemToForm}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Create PO
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

      {/* PO Details Modal */}
      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Order Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">PO Number:</span>
                  <p className="text-sm text-gray-900">{selectedPO.po_number.startsWith('PO-') ? selectedPO.po_number : `PO-${selectedPO.po_number}`}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Supplier:</span>
                  <p className="text-sm text-gray-900">{selectedPO.supplier_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Expected Delivery:</span>
                  <p className="text-sm text-gray-900">
                    {formatIST(selectedPO.expected_delivery_date)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <p className="text-sm text-gray-900">{selectedPO.status}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Invoices:</span>
                  {selectedPO.invoices && selectedPO.invoices.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {selectedPO.invoices.map((invoice, idx) => (
                        <div key={idx} className="text-sm text-gray-900">
                          {invoice.invoice_number} - {formatINR(invoice.amount)}
                          {invoice.description && <span className="text-gray-500 ml-2">({invoice.description})</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">-</p>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Items:</span>
                  <div className="mt-2 space-y-1">
                    {selectedPO.items.map((item, index) => (
                      <div key={index} className="text-sm text-gray-900">
                        {item.item.name} - Qty: {item.quantity} @ {formatINR(item.unit_price)}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <p className="text-sm text-gray-900">
                    {formatINR(selectedPO.total_amount)}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex space-x-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                {selectedPO.status === 'Pending' && (
                  <button
                    onClick={() => handleReceivePO(selectedPO.id)}
                    className="btn-primary flex-1"
                  >
                    Mark as Received
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Invoice Details</h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {invoices.map((invoice, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">Invoice {index + 1}</h4>
                      {invoices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInvoice(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                        <input
                          type="text"
                          value={invoice.invoice_number}
                          onChange={e => updateInvoice(index, 'invoice_number', e.target.value)}
                          className="input-field w-full"
                          placeholder="Invoice Number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                        <input
                          type="datetime-local"
                          value={invoice.invoice_date}
                          onChange={e => updateInvoice(index, 'invoice_date', e.target.value)}
                          className="input-field w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={invoice.amount}
                          onChange={e => updateInvoice(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="input-field w-full"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <input
                          type="text"
                          value={invoice.description}
                          onChange={e => updateInvoice(index, 'description', e.target.value)}
                          className="input-field w-full"
                          placeholder="Description"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={addInvoice}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  + Add Another Invoice
                </button>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={confirmReceivePO}
                  className="btn-primary flex-1"
                  disabled={!invoices.some(inv => inv.invoice_number.trim() !== '')}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 