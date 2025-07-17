import axios from 'axios'

// const API_BASE_URL = 'http://localhost:8000'
const API_BASE_URL = 'http://10.179.21.162:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Purchase Orders
export const purchaseOrdersAPI = {
  getAll: () => api.get('/purchase-orders/'),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders/', data),
  receive: (id, invoices) => api.patch(`/purchase-orders/${id}/receive`, { invoices }),
  getInvoices: (poId) => api.get(`/purchase-orders/${poId}/invoices`),
  addInvoice: (poId, invoice) => api.post(`/purchase-orders/${poId}/invoices`, invoice),
  updateInvoice: (invoiceId, invoice) => api.put(`/purchase-orders/invoices/${invoiceId}`, invoice),
  deleteInvoice: (invoiceId) => api.delete(`/purchase-orders/invoices/${invoiceId}`),
}

// Requirements
export const requirementsAPI = {
  getAll: () => api.get('/requirements/'),
  getById: (id) => api.get(`/requirements/${id}`),
  create: (data) => api.post('/requirements/', data),
  issue: (id) => api.patch(`/requirements/${id}/issue`),
  update: (id, data) => api.patch(`/requirements/${id}`, data),
  issueItem: (requirementId, itemId) => api.patch(`/requirements/${requirementId}/items/${itemId}/issue`),
}

// Stock
export const stockAPI = {
  getAll: () => api.get('/stock/'),
  getById: (id) => api.get(`/stock/${id}`),
  update: (id, data) => api.patch(`/stock/${id}`, data),
  getItems: () => api.get('/stock/items'),
  createItem: (data) => api.post('/stock/items', data),
  updateItem: (id, data) => api.put(`/stock/items/${id}`, data),
}

// Transactions
export const transactionsAPI = {
  getAll: () => api.get('/transactions/'),
  getDashboard: () => api.get('/transactions/dashboard'),
  getToBeOrdered: () => api.get('/transactions/to-be-ordered'),
}

export default api 