import { useState, useEffect } from 'react'
import { requirementsAPI, stockAPI } from '../services/api'
import { Plus, ClipboardList, CheckCircle, Clock, Eye, Package } from 'lucide-react'
import { format } from 'date-fns'

export default function Requirements() {
  const [requirements, setRequirements] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState(null)
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    items: [{ item_id: '', quantity_needed: 1 }]
  })
  const [issuingId, setIssuingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueRequirement, setIssueRequirement] = useState(null)

  useEffect(() => {
    fetchRequirements()
    fetchItems()
  }, [])

  const fetchRequirements = async () => {
    try {
      const response = await requirementsAPI.getAll()
      setRequirements(response.data)
      console.log('Requirements:', response.data) // Debug log
    } catch (error) {
      console.error('Error fetching requirements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await stockAPI.getItems()
      setItems(response.data)
      console.log('Stock items:', response.data) // Debug log
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleCreateRequirement = async (e) => {
    e.preventDefault()
    try {
      await requirementsAPI.create(formData)
      setShowCreateModal(false)
      setFormData({
        project_name: '',
        description: '',
        items: [{ item_id: '', quantity_needed: 1 }]
      })
      fetchRequirements()
      fetchItems() // Ensure stock is refreshed after creating a requirement
    } catch (error) {
      console.error('Error creating requirement:', error)
    }
  }

  const handleIssueItems = async (requirementId) => {
    setIssuingId(requirementId)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      await requirementsAPI.issue(requirementId)
      setSuccessMsg('Requirement fulfilled successfully!')
      fetchRequirements()
      fetchItems() // Ensure stock is refreshed after issuing
    } catch (error) {
      setErrorMsg('Failed to fulfill requirement. Not enough stock or already completed.')
    } finally {
      setIssuingId(null)
    }
  }

  const addItemToForm = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_id: '', quantity_needed: 1 }]
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

  // Robust stock lookup
  const getStockStatus = (requirement) => {
    // Build a map of item_id to current_quantity
    const stockMap = {};
    items.forEach(i => {
      stockMap[i.id] = i.stock ? i.stock.current_quantity : 0;
    });

    const stockData = requirement.items.map(item => {
      const currentStock = stockMap[item.item_id] || 0;
      const needed = item.quantity_needed - item.quantity_issued;
      return {
        ...item,
        currentStock,
        needed,
        available: currentStock >= needed
      }
    });

    const allAvailable = stockData.every(item => item.available);
    const someAvailable = stockData.some(item => item.available);

    if (allAvailable) return { status: 'Available', color: 'bg-green-100 text-green-800', allAvailable: true }
    if (someAvailable) return { status: 'Partial', color: 'bg-yellow-100 text-yellow-800', allAvailable: false }
    return { status: 'To Order', color: 'bg-red-100 text-red-800', allAvailable: false }
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
          <h1 className="text-2xl font-bold text-gray-900">Requirements</h1>
          <p className="text-gray-600">Manage project requirements and issue items</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Requirement
        </button>
      </div>

      {successMsg && <div className="text-green-600 font-medium">{successMsg}</div>}
      {errorMsg && <div className="text-red-600 font-medium">{errorMsg}</div>}

      {/* Requirements List */}
      <div className="card">
        {requirements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No requirements found</p>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requirements.map((requirement) => {
                  const stockStatus = getStockStatus(requirement)
                  return (
                    <tr key={requirement.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedRequirement(requirement); setShowDetailsModal(true); }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {requirement.project_name}
                          </div>
                          {requirement.description && (
                            <div className="text-sm text-gray-500">
                              {requirement.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          requirement.status === 'Completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {requirement.status === 'Completed' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {requirement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          <Package className="h-3 w-3 mr-1" />
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(requirement.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={e => e.stopPropagation()}>
                        {requirement.status === 'Active' && stockStatus.allAvailable && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Fetch latest requirement details and open issue modal
                              const updated = await requirementsAPI.getById(requirement.id)
                              setIssueRequirement(updated.data)
                              setShowIssueModal(true)
                            }}
                            className="btn-primary px-3 py-1 text-xs"
                          >
                            Issue Items
                          </button>
                        )}
                        {requirement.status === 'Completed' && (
                          <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                            <Package className="h-4 w-4 mr-1" />All Set!
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Requirement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Requirement</h3>
              <form onSubmit={handleCreateRequirement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.project_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
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
                  <label className="block text-sm font-medium text-gray-700">Items Needed</label>
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
                        value={item.quantity_needed}
                        onChange={(e) => updateFormItem(index, 'quantity_needed', parseInt(e.target.value))}
                        className="input-field w-20"
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
                    Create Requirement
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

      {/* Issue Items Modal */}
      {showIssueModal && issueRequirement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Items</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Project:</span>
                  <p className="text-sm text-gray-900">{issueRequirement.project_name}</p>
                </div>
                {issueRequirement.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-900">{issueRequirement.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <p className="text-sm text-gray-900">{issueRequirement.status}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Items:</span>
                  <div className="mt-2 space-y-1">
                    {issueRequirement.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm text-gray-900">
                        <span>{item.item.name} - Needed: {item.quantity_needed}, Issued: {item.quantity_issued}</span>
                        {item.quantity_issued < item.quantity_needed && ((item.ordered && item.item.stock && item.item.stock.current_quantity >= (item.quantity_needed - item.quantity_issued)) || !item.ordered) && (
                          <button
                            className="btn-primary px-2 py-1 text-xs ml-2"
                            onClick={async () => {
                              try {
                                await requirementsAPI.issueItem(issueRequirement.id, item.item.id)
                                // Refresh requirement details
                                const updated = await requirementsAPI.getById(issueRequirement.id)
                                setIssueRequirement(updated.data)
                                fetchRequirements()
                                fetchItems()
                              } catch (error) {
                                alert('Failed to issue item: ' + (error?.response?.data?.detail || 'Unknown error'))
                              }
                            }}
                          >
                            Issue
                          </button>
                        )}
                        {item.quantity_issued >= item.quantity_needed && (
                          <span className="text-green-600 ml-2">Issued</span>
                        )}
                        {item.ordered && item.quantity_issued < item.quantity_needed && !(item.item.stock && item.item.stock.current_quantity >= (item.quantity_needed - item.quantity_issued)) && (
                          <span className="text-yellow-600 ml-2">Ordered</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirement Details Modal */}
      {showDetailsModal && selectedRequirement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requirement Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Project:</span>
                  <p className="text-sm text-gray-900">{selectedRequirement.project_name}</p>
                </div>
                {selectedRequirement.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-900">{selectedRequirement.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <p className="text-sm text-gray-900">{selectedRequirement.status}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Items:</span>
                  <div className="mt-2 space-y-1">
                    {selectedRequirement.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm text-gray-900">
                        <span>{item.item.name} - Needed: {item.quantity_needed}, Issued: {item.quantity_issued}</span>
                        {item.quantity_issued < item.quantity_needed && !item.ordered && (
                          <button
                            className="btn-primary px-2 py-1 text-xs ml-2"
                            onClick={async () => {
                              try {
                                await requirementsAPI.issueItem(selectedRequirement.id, item.item.id)
                                // Refresh requirement details
                                const updated = await requirementsAPI.getById(selectedRequirement.id)
                                setSelectedRequirement(updated.data)
                                fetchRequirements()
                                fetchItems()
                              } catch (error) {
                                alert('Failed to issue item: ' + (error?.response?.data?.detail || 'Unknown error'))
                              }
                            }}
                          >
                            Issue
                          </button>
                        )}
                        {item.quantity_issued >= item.quantity_needed && (
                          <span className="text-green-600 ml-2">Issued</span>
                        )}
                        {item.ordered && item.quantity_issued < item.quantity_needed && (
                          <span className="text-yellow-600 ml-2">Ordered</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 