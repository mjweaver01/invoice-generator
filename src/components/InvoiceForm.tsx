import { useState, useEffect } from "react";
import LineItem from "./LineItem";
import { api } from "../api";

export default function InvoiceForm({ invoice, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    invoice_number: "",
    client_name: "",
    client_address: "",
    invoice_date: new Date().toISOString().split("T")[0],
    hourly_rate: 150.0,
    status: "draft",
    line_items: [{ description: "", hours: "" }],
  });

  const [clients, setClients] = useState<
    Array<{ id: number; name: string; address: string | null }>
  >([]);
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClientsAndSettings();
    if (invoice) {
      loadInvoice(invoice.id);
    } else {
      generateInvoiceNumber();
    }
  }, [invoice]);

  const loadClientsAndSettings = async () => {
    try {
      const [clientsData, settingsData] = await Promise.all([
        api.getAllClients(),
        api.getSettings(),
      ]);
      setClients(clientsData);
      setSettings(settingsData);

      // Set defaults from settings for new invoices
      if (!invoice) {
        setFormData((prev) => ({
          ...prev,
          hourly_rate: settingsData.default_hourly_rate,
        }));
      }
    } catch (err) {
      console.error("Failed to load clients/settings:", err);
    }
  };

  const loadInvoice = async (id) => {
    try {
      const data = await api.getInvoice(id);
      setFormData({
        ...data,
        line_items:
          data.line_items && data.line_items.length > 0
            ? data.line_items
            : [{ description: "", hours: "" }],
      });
    } catch (err) {
      setError("Failed to load invoice");
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const invoices = await api.getAllInvoices();
      const maxNumber = invoices.reduce((max, inv) => {
        const match = inv.invoice_number.match(/INV-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const newNumber = `INV-${String(maxNumber + 1).padStart(3, "0")}`;
      setFormData((prev) => ({ ...prev, invoice_number: newNumber }));
    } catch (err) {
      setFormData((prev) => ({ ...prev, invoice_number: "INV-001" }));
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClientSelect = (clientName) => {
    const client = clients.find((c) => c.name === clientName);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        client_name: client.name,
        client_address: client.address || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, client_name: clientName }));
    }
  };

  const handleLineItemChange = (index, item) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index] = item;
    setFormData((prev) => ({ ...prev, line_items: newLineItems }));
  };

  const handleAddLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      line_items: [...prev.line_items, { description: "", hours: "" }],
    }));
  };

  const handleRemoveLineItem = (index) => {
    if (formData.line_items.length > 1) {
      const newLineItems = formData.line_items.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, line_items: newLineItems }));
    }
  };

  const calculateTotal = () => {
    return formData.line_items.reduce((total, item) => {
      return total + (parseFloat(item.hours) || 0) * formData.hourly_rate;
    }, 0);
  };

  const calculateTotalHours = () => {
    return formData.line_items.reduce((total, item) => {
      return total + (parseFloat(item.hours) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const total = calculateTotal();
      const dataToSave = {
        ...formData,
        total,
      };

      if (invoice) {
        await api.updateInvoice(invoice.id, dataToSave);
      } else {
        await api.createInvoice(dataToSave);
      }

      onSave(dataToSave);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {invoice ? "Edit Invoice" : "New Invoice"}
          </h1>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to List
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => handleChange("invoice_date", e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Client Information
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  list="clients-list"
                  value={formData.client_name}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  required
                  placeholder="Select or enter client name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <datalist id="clients-list">
                  {clients.map((client) => (
                    <option key={client.id} value={client.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Address
                </label>
                <input
                  type="text"
                  value={formData.client_address}
                  onChange={(e) =>
                    handleChange("client_address", e.target.value)
                  }
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) =>
                  handleChange("hourly_rate", parseFloat(e.target.value) || 0)
                }
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Line Items
              </h2>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                + Add Line Item
              </button>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-3 text-sm font-medium text-gray-700">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Hours</div>
              <div className="col-span-3 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {formData.line_items.map((item, index) => (
              <LineItem
                key={index}
                item={item}
                index={index}
                hourlyRate={formData.hourly_rate}
                onChange={handleLineItemChange}
                onRemove={handleRemoveLineItem}
              />
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <div className="flex justify-end">
              <div className="w-96">
                <div className="flex justify-between mb-3 text-gray-700">
                  <span>Total Hours:</span>
                  <span className="font-semibold">
                    {calculateTotalHours().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-3 text-gray-700">
                  <span>Hourly Rate:</span>
                  <span className="font-semibold">
                    ${formData.hourly_rate.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-300">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
