import { useState, useEffect, useRef, useContext } from 'react'
import { stockAPI } from '../services/api'
import { Plus, Database, AlertTriangle, CheckCircle, Search, Upload, Download } from 'lucide-react'
import { AuthContext } from '../services/AuthContext'

export default function Stock() {
  const { user } = useContext(AuthContext);
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    make: '',
    model_number: '',
    unit_price: 0,
    minimum_stock: 0
  })
  const [updateQuantity, setUpdateQuantity] = useState(0)
  const [search, setSearch] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef(null)

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
        make: '',
        model_number: '',
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

  const handleImportCSV = async (e) => {
    e.preventDefault()
    const file = fileInputRef.current.files[0]
    
    if (!file) {
      alert('Please select a CSV file')
      return
    }
    
    if (!file.name.endsWith('.csv')) {
      alert('Please select a valid CSV file')
      return
    }
    
    setImporting(true)
    try {
      const response = await stockAPI.importCSV(file)
      setImportResults(response.data)
      fetchStock() // Refresh the stock list
    } catch (error) {
      console.error('Error importing CSV:', error)
      alert('Failed to import CSV: ' + (error?.response?.data?.detail || 'Unknown error'))
    } finally {
      setImporting(false)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const response = await stockAPI.exportCSV()
      const { csv_content, filename } = response.data
      
      // Create and download the file
      const blob = new Blob([csv_content], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV: ' + (error?.response?.data?.detail || 'Unknown error'))
    } finally {
      setExporting(false)
    }
  }

  const resetImportModal = () => {
    setShowImportModal(false)
    setImportResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
      (stockItem.item.make && stockItem.item.make.toLowerCase().includes(q)) ||
      (stockItem.item.model_number && stockItem.item.model_number.toLowerCase().includes(q))
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
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600 text-sm lg:text-base">Manage inventory items and stock levels</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center text-sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="btn-secondary flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="flex items-center mb-4 max-w-md">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search by name, code, make, or model..."
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
          <div className="overflow-x-auto">
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredStock.map((stockItem) => {
                const status = getStockStatus(stockItem)
                return (
                  <div key={stockItem.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {stockItem.item.name}
                        </h3>
                        <p className="text-xs text-gray-500">{stockItem.item.code}</p>
                        {stockItem.item.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {stockItem.item.description}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${status.color}`}>
                        <status.icon className="h-3 w-3 mr-1" />
                        {status.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Make/Model</p>
                        <p className="font-medium">
                          {stockItem.item.make && stockItem.item.model_number 
                            ? `${stockItem.item.make} ${stockItem.item.model_number}`
                            : stockItem.item.make || stockItem.item.model_number || 'Not specified'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Current Stock</p>
                        <p className="font-medium">{stockItem.current_quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Min Stock</p>
                        <p className="font-medium">{stockItem.item.minimum_stock}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Unit Price</p>
                        <p className="font-medium">{formatINR(stockItem.item.unit_price)}</p>
                      </div>
                    </div>
                    
                    {user?.role === 'admin' && (
                      <div className="pt-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setSelectedStock(stockItem)
                            setUpdateQuantity(stockItem.current_quantity)
                            setShowUpdateModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          Update Stock
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Make/Model
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {stockItem.item.make && (
                              <div className="text-sm font-medium text-gray-900">
                                {stockItem.item.make}
                              </div>
                            )}
                            {stockItem.item.model_number && (
                              <div className="text-sm text-gray-500">
                                {stockItem.item.model_number}
                              </div>
                            )}
                            {!stockItem.item.make && !stockItem.item.model_number && (
                              <div className="text-sm text-gray-400 italic">
                                Not specified
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
                          {user?.role === 'admin' && (
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
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Item Modal */}
      {user?.role === 'admin' && showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
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
                  <label className="block text-sm font-medium text-gray-700">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., Schneider Electric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Model Number</label>
                  <input
                    type="text"
                    value={formData.model_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, model_number: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., IC60N 32A"
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

                <div className="flex flex-col sm:flex-row gap-3">
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
      {user?.role === 'admin' && showUpdateModal && selectedStock && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
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

                <div className="flex flex-col sm:flex-row gap-3">
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

      {/* CSV Import Modal */}
      {user?.role === 'admin' && showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Items from CSV</h3>
              
              {!importResults ? (
                <div>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Required columns:</strong> name, code</li>
                      <li>• <strong>Optional columns:</strong> description, unit_price, minimum_stock, current_quantity</li>
                      <li>• <strong>Example:</strong> name,code,description,unit_price,minimum_stock,current_quantity</li>
                      <li>• <strong>Note:</strong> Item codes must be unique</li>
                    </ul>
                  </div>
                  
                  <form onSubmit={handleImportCSV} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={importing}
                        className="btn-primary flex-1"
                      >
                        {importing ? 'Importing...' : 'Import CSV'}
                      </button>
                      <button
                        type="button"
                        onClick={resetImportModal}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className={`p-4 rounded-lg mb-4 ${
                    importResults.results.failed === 0 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <h4 className={`font-medium mb-2 ${
                      importResults.results.failed === 0 ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {importResults.message}
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>✅ Successfully imported: {importResults.results.successful}</p>
                      <p>❌ Failed to import: {importResults.results.failed}</p>
                    </div>
                  </div>
                  
                  {importResults.results.errors.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Errors:</h5>
                      <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                        {importResults.results.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-800 mb-1">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={resetImportModal}
                      className="btn-primary flex-1"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        resetImportModal()
                        setShowImportModal(true)
                      }}
                      className="btn-secondary flex-1"
                    >
                      Import Another File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 