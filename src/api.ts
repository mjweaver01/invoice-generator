const API_BASE = '/api';

export const api = {
  async getAllInvoices() {
    const response = await fetch(`${API_BASE}/invoices`);
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  },

  async getInvoice(id) {
    const response = await fetch(`${API_BASE}/invoices/${id}`);
    if (!response.ok) throw new Error('Failed to fetch invoice');
    return response.json();
  },

  async createInvoice(invoiceData) {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error('Failed to create invoice');
    return response.json();
  },

  async updateInvoice(id, invoiceData) {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error('Failed to update invoice');
    return response.json();
  },

  async deleteInvoice(id) {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete invoice');
    return response.json();
  },
};
