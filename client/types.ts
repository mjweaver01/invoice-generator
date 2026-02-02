export interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_address?: string;
  invoice_date: string;
  due_date?: string;
  hourly_rate: number;
  status: "draft" | "sent" | "paid";
  total: number;
  created_at?: string;
  updated_at?: string;
  line_items?: LineItem[];
  settings?: Settings;
}

export interface LineItem {
  id?: number;
  invoice_id?: number;
  description: string;
  hours: number;
  order_index?: number;
}

export interface Client {
  id: number;
  name: string;
  address?: string;
  created_at?: string;
}

export interface Settings {
  id?: number;
  your_name: string;
  business_name: string;
  business_address: string;
  default_hourly_rate: number;
  ach_account: string;
  ach_routing: string;
  zelle_contact: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
