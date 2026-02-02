const API_BASE = "/api";

const TOKEN_KEY = "auth_token";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async signup(username: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }
    const data = await response.json();
    this.setToken(data.token);
    return data;
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }
    const data = await response.json();
    this.setToken(data.token);
    return data;
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
      }
      throw new Error("Failed to fetch current user");
    }
    return response.json();
  },

  logout() {
    this.clearToken();
  },
};

export const api = {
  async getSettings() {
    const response = await fetch(`${API_BASE}/settings`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },

  async updateSettings(settings) {
    const response = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Failed to update settings");
    return response.json();
  },

  async getAllClients() {
    const response = await fetch(`${API_BASE}/clients`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch clients");
    return response.json();
  },

  async getAllInvoices() {
    const response = await fetch(`${API_BASE}/invoices`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch invoices");
    return response.json();
  },

  async getInvoice(id) {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch invoice");
    return response.json();
  },

  async createInvoice(invoiceData) {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error("Failed to create invoice");
    return response.json();
  },

  async updateInvoice(id, invoiceData) {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error("Failed to update invoice");
    return response.json();
  },

  async deleteInvoice(id) {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete invoice");
    return response.json();
  },

  async updateClient(id, clientData) {
    const response = await fetch(`${API_BASE}/clients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });
    if (!response.ok) throw new Error("Failed to update client");
    return response.json();
  },

  async deleteClient(id) {
    const response = await fetch(`${API_BASE}/clients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete client");
    return response.json();
  },
};
