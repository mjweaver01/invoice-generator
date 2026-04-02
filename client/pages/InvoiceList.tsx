import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Invoice } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { StatusPill } from "../components/StatusPill";
import Navigation from "../components/Navigation";
import { api } from "../api";
import { Input, Select, Button, Card, Spinner, Modal } from "../components/ui";

export default function InvoiceList({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [duplicatingInvoiceId, setDuplicatingInvoiceId] = useState<
    number | null
  >(null);
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
      <Card padding="lg" className="mb-6">
        <Navigation title="Invoices" onLogout={onLogout} />

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by client or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            wrapperClassName="flex-1"
          />
          <div className="flex gap-4">
            <Select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center">
            <Spinner label="Loading invoices..." />
          </Card>
        ) : filteredInvoices.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">No invoices found</p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/new")}
            >
              {invoices?.length === 0
                ? "Create your first invoice"
                : "Create a new invoice"}
            </Button>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              padding="sm"
              hoverable
              className="sm:p-6"
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
                  {invoice.notes?.trim() && (
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                      {invoice.notes.trim()}
                    </p>
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
                <div className="flex gap-2 order-4 sm:col-start-2 sm:row-start-2 sm:justify-self-end sm:self-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDuplicateInvoice(invoice.id)}
                    disabled={duplicatingInvoiceId === invoice.id}
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-0"
                  >
                    {duplicatingInvoiceId === invoice.id
                      ? "Duplicating..."
                      : "Duplicate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/edit/${invoice.id}`)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/print/${invoice.id}`)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
                  >
                    Print
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          title="Delete Invoice?"
          message="Are you sure you want to delete this invoice? This action cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDeleteInvoice(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
