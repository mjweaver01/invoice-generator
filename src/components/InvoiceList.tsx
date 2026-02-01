import { useState } from "react";
import { formatCurrency } from "../utils";

export default function InvoiceList({
  invoices,
  onNewInvoice,
  onEditInvoice,
  onPrintInvoice,
  onShowSettings,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <div className="flex gap-3">
            <button
              onClick={onShowSettings}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={onNewInvoice}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              + New Invoice
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by client or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No invoices found</p>
            <button
              onClick={onNewInvoice}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {invoice.invoice_number}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-lg mb-1">
                    {invoice.client_name}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Date: {formatDate(invoice.invoice_date)}</span>
                    {invoice.due_date && (
                      <span>Due: {formatDate(invoice.due_date)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    {formatCurrency(invoice.total || 0)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditInvoice(invoice)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onPrintInvoice(invoice)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
