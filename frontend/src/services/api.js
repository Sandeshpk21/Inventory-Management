import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.179.21.162:8000', // Adjust if your backend runs on a different port
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

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
  importCSV: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/stock/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  exportCSV: () => api.get('/stock/export-csv'),
}

// Transactions
export const transactionsAPI = {
  getAll: () => api.get('/transactions/'),
  getDashboard: () => api.get('/transactions/dashboard'),
  getToBeOrdered: () => api.get('/transactions/to-be-ordered'),
} 