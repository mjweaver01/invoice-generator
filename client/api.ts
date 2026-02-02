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

/** Fetch with auth; on 401 clears token and redirects to login */
async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers as HeadersInit) },
  });
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace("/login");
    throw new Error("Unauthorized");
  }
  return response;
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
    const response = await authFetch(`${API_BASE}/auth/me`);
    if (!response.ok) throw new Error("Failed to fetch current user");
    return response.json();
  },

  logout() {
    this.clearToken();
  },
};

export const api = {
  async getSettings() {
    const response = await authFetch(`${API_BASE}/settings`);
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },

  async updateSettings(settings) {
    const response = await authFetch(`${API_BASE}/settings`, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Failed to update settings");
    return response.json();
  },

  async getAllClients() {
    const response = await authFetch(`${API_BASE}/clients`);
    if (!response.ok) throw new Error("Failed to fetch clients");
    return response.json();
  },

  async getAllInvoices() {
    const response = await authFetch(`${API_BASE}/invoices`);
    if (!response.ok) throw new Error("Failed to fetch invoices");
    return response.json();
  },

  async getInvoice(id) {
    const response = await authFetch(`${API_BASE}/invoices/${id}`);
    if (!response.ok) throw new Error("Failed to fetch invoice");
    return response.json();
  },

  async createInvoice(invoiceData) {
    const response = await authFetch(`${API_BASE}/invoices`, {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error("Failed to create invoice");
    return response.json();
  },

  async updateInvoice(id, invoiceData) {
    const response = await authFetch(`${API_BASE}/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) throw new Error("Failed to update invoice");
    return response.json();
  },

  async deleteInvoice(id) {
    const response = await authFetch(`${API_BASE}/invoices/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete invoice");
    return response.json();
  },

  async updateClient(id, clientData) {
    const response = await authFetch(`${API_BASE}/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
    if (!response.ok) throw new Error("Failed to update client");
    return response.json();
  },

  async deleteClient(id) {
    const response = await authFetch(`${API_BASE}/clients/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete client");
    return response.json();
  },
};
