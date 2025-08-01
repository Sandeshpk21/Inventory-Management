import { useState, useEffect } from 'react'
import { purchaseOrdersAPI, stockAPI } from '../services/api'
import { Plus, Package, CheckCircle, Clock, Eye, Download, Upload } from 'lucide-react'
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
  const [showPartialReceiveModal, setShowPartialReceiveModal] = useState(false)
  const [poToReceive, setPoToReceive] = useState(null)
  const [invoices, setInvoices] = useState([{
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 16),
    amount: 0,
    description: ''
  }])
  const [partialReceiveItems, setPartialReceiveItems] = useState([])

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

  const handlePartialReceivePO = async (poId) => {
    setPoToReceive(poId)
    setInvoices([{
      invoice_number: '',
      invoice_date: new Date().toISOString().slice(0, 16),
      amount: 0,
      description: ''
    }])
    
    // Initialize partial receive items with the PO items
    const po = purchaseOrders.find(po => po.id === poId)
    if (po) {
      const items = po.items.map(item => ({
        item_id: item.item_id,
        item_name: item.item.name,
        ordered_quantity: item.quantity,
        received_quantity: item.received_quantity || 0,
        remaining_quantity: item.quantity - (item.received_quantity || 0),
        quantity: 0, // This will be the quantity to receive
        error: null // Initialize with no error
      }))
      setPartialReceiveItems(items)
    }
    
    setShowPartialReceiveModal(true)
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

  const confirmPartialReceivePO = async () => {
    try {
      // Check for validation errors
      const itemsWithErrors = partialReceiveItems.filter(item => item.error)
      if (itemsWithErrors.length > 0) {
        alert('Please fix the validation errors before proceeding.')
        return
      }
      
      // Filter out empty invoices
      const validInvoices = invoices.filter(inv => inv.invoice_number.trim() !== '')
      // Filter out items with zero quantity
      const validItems = partialReceiveItems.filter(item => item.quantity > 0)
      
      if (validItems.length === 0) {
        alert('Please enter quantities to receive for at least one item.')
        return
      }
      
      await purchaseOrdersAPI.receivePartial(poToReceive, {
        items: validItems,
        invoices: validInvoices
      })
      
      setShowPartialReceiveModal(false)
      setPoToReceive(null)
      setPartialReceiveItems([])
      setInvoices([{
        invoice_number: '',
        invoice_date: new Date().toISOString().slice(0, 16),
        amount: 0,
        description: ''
      }])
      fetchPurchaseOrders()
    } catch (error) {
      alert('Failed to receive partial PO: ' + (error?.response?.data?.detail || 'Unknown error'))
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

  const updatePartialReceiveItem = (index, quantity) => {
    const newItems = [...partialReceiveItems]
    const parsedQuantity = parseInt(quantity) || 0
    const maxQuantity = newItems[index].remaining_quantity
    
    // Ensure quantity doesn't exceed remaining quantity
    const validQuantity = Math.min(parsedQuantity, maxQuantity)
    
    newItems[index] = { 
      ...newItems[index], 
      quantity: validQuantity,
      error: parsedQuantity > maxQuantity ? `Cannot receive more than ${maxQuantity} items` : null
    }
    setPartialReceiveItems(newItems)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 text-sm lg:text-base">Manage purchase orders and track deliveries</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center text-sm"
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
          <div className="overflow-x-auto">
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {po.po_number.startsWith('PO-') ? po.po_number : `PO-${po.po_number}`}
                      </h3>
                      <p className="text-xs text-gray-500">{po.supplier_name}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                      po.status === 'Received' 
                        ? 'bg-green-100 text-green-800'
                        : po.status === 'Partially Received'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {po.status === 'Received' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : po.status === 'Partially Received' ? (
                        <Package className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {po.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Expected Delivery</p>
                      <p className="font-medium">{formatIST(po.expected_delivery_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total Amount</p>
                      <p className="font-medium">{formatINR(po.total_amount)}</p>
                    </div>
                  </div>
                  
                  {po.status === 'Received' && po.invoices && po.invoices.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Invoices:</p>
                      <div className="space-y-1">
                        {po.invoices.map((invoice, idx) => (
                          <div key={idx} className="text-xs text-gray-900">
                            {invoice.invoice_number} ({formatINR(invoice.amount)})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setSelectedPO(po); setShowDetailsModal(true); }}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <div className="flex gap-2">
                      {po.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleReceivePO(po.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-xs font-medium"
                            title="Receive Full PO"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Receive All
                          </button>
                          <button
                            onClick={() => handlePartialReceivePO(po.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium"
                            title="Receive Partial PO"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Receive Partial
                          </button>
                        </>
                      )}
                      {po.status === 'Partially Received' && (
                        <>
                          <button
                            onClick={() => handleReceivePO(po.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-xs font-medium"
                            title="Receive Remaining"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Receive Remaining
                          </button>
                          <button
                            onClick={() => handlePartialReceivePO(po.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium"
                            title="Receive More"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Receive More
                          </button>
                        </>
                      )}
                      {po.status === 'Received' && (
                        <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold text-xs">
                          <Package className="h-3 w-3 mr-1" />All Set!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
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
                          : po.status === 'Partially Received'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {po.status === 'Received' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : po.status === 'Partially Received' ? (
                          <Package className="h-3 w-3 mr-1" />
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
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleReceivePO(po.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-xs font-medium"
                              title="Receive Full PO"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Receive All
                            </button>
                            <button
                              onClick={() => handlePartialReceivePO(po.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium"
                              title="Receive Partial PO"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Receive Partial
                            </button>
                          </div>
                        )}
                        {po.status === 'Partially Received' && (
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleReceivePO(po.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-xs font-medium"
                              title="Receive Remaining"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Receive Remaining
                            </button>
                            <button
                              onClick={() => handlePartialReceivePO(po.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium"
                              title="Receive More"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Receive More
                            </button>
                          </div>
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
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                          <select
                            required
                            value={item.item_id}
                            onChange={(e) => updateFormItem(index, 'item_id', e.target.value)}
                            className="input-field w-full"
                          >
                            <option value="">Select Item</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              placeholder="Qty"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateFormItem(index, 'quantity', parseInt(e.target.value))}
                              className="input-field w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                            <input
                              type="number"
                              placeholder="Price"
                              required
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateFormItem(index, 'unit_price', parseFloat(e.target.value))}
                              className="input-field w-full"
                            />
                          </div>
                        </div>
                        
                        {formData.items.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeItemFromForm(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded"
                            >
                              Remove Item
                            </button>
                          </div>
                        )}
                      </div>
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

                <div className="flex flex-col sm:flex-row gap-3">
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
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
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
                        {item.received_quantity > 0 && (
                          <span className="text-blue-600 ml-2">
                            (Received: {item.received_quantity})
                          </span>
                        )}
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
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                {(selectedPO.status === 'Pending' || selectedPO.status === 'Partially Received') && (
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <button
                      onClick={() => handleReceivePO(selectedPO.id)}
                      className="btn-primary flex-1"
                    >
                      {selectedPO.status === 'Pending' ? 'Mark as Received' : 'Receive Remaining'}
                    </button>
                    <button
                      onClick={() => handlePartialReceivePO(selectedPO.id)}
                      className="btn-secondary flex-1"
                    >
                      Receive Partial
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
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

      {/* Partial Receive Modal */}
      {showPartialReceiveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Receive Partial Purchase Order</h3>
              
              <div className="space-y-6">
                {/* Items Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Items to Receive</h4>
                  <div className="space-y-3">
                    {partialReceiveItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                          <h5 className="font-medium text-gray-900">{item.item_name}</h5>
                          <span className="text-sm text-gray-500">
                            Ordered: {item.ordered_quantity} | Received: {item.received_quantity} | Remaining: {item.remaining_quantity}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Quantity to Receive:</label>
                            <input
                              type="number"
                              min="0"
                              max={item.remaining_quantity}
                              value={item.quantity}
                              onChange={(e) => updatePartialReceiveItem(index, e.target.value)}
                              className={`input-field w-24 ${item.error ? 'border-red-500' : ''}`}
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-500">/ {item.remaining_quantity}</span>
                          </div>
                          {item.error && (
                            <div className="text-red-600 text-sm flex items-center">
                              <span className="mr-1">⚠</span>
                              {item.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoices Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Invoice Details (Optional)</h4>
                  <div className="space-y-4">
                    {invoices.map((invoice, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium text-gray-900">Invoice {index + 1}</h5>
                          {invoices.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInvoice(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                            <input
                              type="text"
                              value={invoice.invoice_number}
                              onChange={e => updateInvoice(index, 'invoice_number', e.target.value)}
                              className="input-field w-full"
                              placeholder="Invoice Number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                            <input
                              type="datetime-local"
                              value={invoice.invoice_date}
                              onChange={e => updateInvoice(index, 'invoice_date', e.target.value)}
                              className="input-field w-full"
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
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={confirmPartialReceivePO}
                  className="btn-primary flex-1"
                  disabled={!partialReceiveItems.some(item => item.quantity > 0) || partialReceiveItems.some(item => item.error)}
                >
                  Confirm Partial Receipt
                </button>
                <button
                  onClick={() => setShowPartialReceiveModal(false)}
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