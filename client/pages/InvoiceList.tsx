import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Invoice } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { StatusPill } from "../components/StatusPill";
import { api } from "../api";

export default function InvoiceList({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(
    null,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
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

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) return;

      await api.updateInvoice(invoiceId, { ...invoice, status: newStatus });
      await loadInvoices();
    } catch (error) {
      console.error("Failed to update invoice status:", error);
    }
    setOpenStatusDropdown(null);
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    try {
      await api.deleteInvoice(invoiceId);
      await loadInvoices();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-3 md:px-6 rounded-lg transition-colors flex items-center gap-2"
              title="Logout"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden md:inline">Logout</span>
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-3 py-3 md:px-6 rounded-lg transition-colors flex items-center gap-2"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden md:inline">Settings</span>
            </button>
            <button
              onClick={() => navigate("/clients")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-3 md:px-6 rounded-lg transition-colors flex items-center gap-2"
              title="Clients"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="hidden md:inline">Clients</span>
            </button>
            <button
              onClick={() => navigate("/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-3 md:px-6 rounded-lg transition-colors flex items-center gap-2"
              title="New Invoice"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden md:inline">New Invoice</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {invoice.invoice_number}
                    </h3>
                    <div
                      className="relative"
                      ref={
                        openStatusDropdown === invoice.id ? dropdownRef : null
                      }
                    >
                      <button
                        onClick={() =>
                          setOpenStatusDropdown(
                            openStatusDropdown === invoice.id
                              ? null
                              : invoice.id,
                          )
                        }
                        className="px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
                      >
                        <StatusPill
                          status={invoice.status}
                          onStatusChange={(newStatus) =>
                            handleStatusChange(invoice.id, newStatus)
                          }
                        />
                      </button>
                      {openStatusDropdown === invoice.id && (
                        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                          <StatusPill
                            status={invoice.status}
                            onStatusChange={(newStatus) =>
                              handleStatusChange(invoice.id, newStatus)
                            }
                          />
                        </div>
                      )}
                    </div>
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
