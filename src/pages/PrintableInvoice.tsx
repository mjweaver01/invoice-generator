import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { api } from "../api";
import { formatCurrency, formatDate } from "../utils";

export default function PrintableInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fullInvoice, setFullInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadFullInvoice();
    }
  }, [id]);

  const loadFullInvoice = async () => {
    try {
      const data = await api.getInvoice(id!);
      setFullInvoice(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load invoice:", err);
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: fullInvoice?.invoice_number || "Invoice",
  });

  if (loading || !fullInvoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const lineItems = fullInvoice.line_items || [];
  const settings = fullInvoice.settings || {};
  const subtotal = lineItems.reduce((total, item) => {
    return total + item.hours * fullInvoice.hourly_rate;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Print Actions - Hidden when printing */}
      <div className="no-print mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back to Invoices
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Printable Invoice */}
      <div
        ref={invoiceRef}
        className="printable-invoice bg-white rounded-xl shadow-sm p-12"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <p className="text-xl text-gray-600">{fullInvoice.invoice_number}</p>
        </div>

        {/* From/To Section */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              From
            </h3>
            <div className="text-gray-900">
              {settings.your_name && (
                <p className="font-bold text-lg mb-1">{settings.your_name}</p>
              )}
              {settings.business_name && (
                <p className="font-semibold text-base mb-1">
                  {settings.business_name}
                </p>
              )}
              {settings.business_address && (
                <p className="text-gray-600 whitespace-pre-line">
                  {settings.business_address}
                </p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Bill To
            </h3>
            <div className="text-gray-900">
              <p className="font-semibold text-lg mb-1">
                {fullInvoice.client_name}
              </p>
              {fullInvoice.client_address && (
                <p className="text-gray-600 whitespace-pre-line">
                  {fullInvoice.client_address}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12 pb-12 border-b border-gray-200">
          {/* Invoice Details */}
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Invoice Date
            </p>
            <p className="text-gray-900">
              {formatDate(fullInvoice.invoice_date)}
            </p>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Payment Methods
            </p>
            {settings.ach_account && settings.ach_routing && (
              <p>
                <strong>ACH:</strong> {settings.ach_account} (
                {settings.ach_routing})
              </p>
            )}
            {settings.zelle_contact && (
              <p>
                <strong>Zelle:</strong> {settings.zelle_contact}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 text-sm font-semibold text-gray-700 uppercase">
                Description
              </th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                Hours
              </th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                Rate
              </th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-4 text-gray-900">{item.description}</td>
                <td className="py-4 text-right text-gray-900">{item.hours}</td>
                <td className="py-4 text-right text-gray-900">
                  {formatCurrency(fullInvoice.hourly_rate)}
                </td>
                <td className="py-4 text-right text-gray-900 font-medium">
                  {formatCurrency(item.hours * fullInvoice.hourly_rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-80">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-700">Subtotal</span>
              <span className="text-gray-900 font-medium">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between py-4 border-t-2 border-gray-300">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
