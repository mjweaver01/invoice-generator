import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Invoice } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { StatusPill } from "../components/StatusPill";
import Navigation from "../components/Navigation";
import { api } from "../api";

export default function InvoiceList({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [duplicatingInvoiceId, setDuplicatingInvoiceId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await api.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const uniqueClients = Array.from(
    new Set(invoices.map((inv) => inv.client_name)),
  ).sort();

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    const matchesClient =
      clientFilter === "all" || invoice.client_name === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    setUpdatingStatusId(invoiceId);
    try {
      await api.updateInvoiceStatus(invoiceId, newStatus);
      await loadInvoices(false);
    } catch (error) {
      console.error("Failed to update invoice status:", error);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    try {
      await api.deleteInvoice(invoiceId);
      await loadInvoices(false);
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
    setDeleteConfirmId(null);
  };

  const handleDuplicateInvoice = async (invoiceId: number) => {
    setDuplicatingInvoiceId(invoiceId);
    try {
      const duplicatedInvoice = await api.duplicateInvoice(invoiceId);
      navigate(`/edit/${duplicatedInvoice.id}`);
    } catch (error) {
      console.error("Failed to duplicate invoice:", error);
    } finally {
      setDuplicatingInvoiceId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
        <Navigation title="Invoices" onLogout={onLogout} />

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by client or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
          />
          <div className="flex gap-4">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-lg">Loading invoices...</p>
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">No invoices found</p>
            <button
              onClick={() => navigate("/new")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {invoices?.length === 0
                ? "Create your first invoice"
                : "Create a new invoice"}
            </button>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-3">
                {/* Invoice + Status: row 1 left */}
                <div className="flex items-center gap-3 order-1 sm:col-start-1 sm:row-start-1 sm:items-start">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {invoice.invoice_number}
                  </h3>
                  <StatusPill
                    status={invoice.status}
                    onStatusChange={(newStatus) =>
                      handleStatusChange(invoice.id, newStatus)
                    }
                    loading={updatingStatusId === invoice.id}
                  />
                </div>
                {/* Client + Date: row 2 left on desktop, order 2 on mobile */}
                <div className="flex flex-col items-start text-sm my-2 sm:m-0 sm:text-base order-2 sm:col-start-1 sm:row-start-2">
                  <span className="text-gray-700 font-medium">
                    {invoice.client_name}
                  </span>
                  <span className="text-gray-500">
                    {formatDate(invoice.invoice_date)}
                  </span>
                  {invoice.due_date && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500">
                        Due {formatDate(invoice.due_date)}
                      </span>
                    </>
                  )}
                </div>
                {/* Calc + Price: row 1 right on desktop, order 3 on mobile */}
                <div className="flex flex-col mb-2 sm:m-0 order-3 sm:col-start-2 sm:row-start-1 sm:justify-self-end sm:items-end">
                  <span className="text-sm text-gray-400">
                    {invoice.total_hours != null
                      ? `${invoice.total_hours} hrs × ${formatCurrency(invoice.hourly_rate)}/hr`
                      : `${formatCurrency(invoice.hourly_rate)}/hr`}
                  </span>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(invoice.total || 0)}
                  </div>
                </div>
                {/* Buttons: row 2 right on desktop, order 4 on mobile */}
                <div className="flex gap-2 order-4 sm:col-start-2 sm:row-start-2 sm:justify-self-end">
                  <button
                    onClick={() => handleDuplicateInvoice(invoice.id)}
                    disabled={duplicatingInvoiceId === invoice.id}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {duplicatingInvoiceId === invoice.id ? "Duplicating..." : "Duplicate"}
                  </button>
                  <button
                    onClick={() => navigate(`/edit/${invoice.id}`)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/print/${invoice.id}`)}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Delete Invoice?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
