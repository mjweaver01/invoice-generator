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
          title="Print / Save as PDF"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 sm:px-6 sm:py-3 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V5.355c0-1.023-.77-1.864-1.785-1.977a48.111 48.111 0 00-6.93 0c-1.015.113-1.785.954-1.785 1.977v1.824"
            />
          </svg>
          <span className="hidden sm:inline">Print / Save as PDF</span>
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
