const API_BASE = "/api";

export const api = {
  async getSettings() {
    const response = await fetch(`${API_BASE}/settings`);
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },

  async updateSettings(settings) {
    const response = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Failed to update settings");
    return response.json();
  },

  async getAllClients() {
    const response = await fetch(`${API_BASE}/clients`);
    if (!response.ok) throw new Error("Failed to fetch clients");
    return response.json();
  },

  async getAllInvoices() {
    const response = await fetch(`${API_BASE}/invoices`);
    if (!response.ok) throw new Error("Failed to fetch invoices");
    return response.json();
  },

  async getInvoice(id) {
    const response = await fetch(`${API_BASE}/invoices/${id}`);
    if (!response.ok) throw new Error("Failed to fetch invoice");
    return response.json();
  },

  async createInvoice(invoiceData) {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error("Failed to create invoice");
    return response.json();
  },

  async updateInvoice(id, invoiceData) {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error("Failed to update invoice");
    return response.json();
  },

  async deleteInvoice(id) {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete invoice");
    return response.json();
  },

  async updateClient(id, clientData) {
    const response = await fetch(`${API_BASE}/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });
    if (!response.ok) throw new Error("Failed to update client");
    return response.json();
  },

  async deleteClient(id) {
    const response = await fetch(`${API_BASE}/clients/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete client");
    return response.json();
  },
};
