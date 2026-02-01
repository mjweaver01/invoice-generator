import { useEffect, useState } from 'react';
import { api } from '../api';

export default function PrintableInvoice({ invoice, onBack }) {
  const [fullInvoice, setFullInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFullInvoice();
  }, [invoice]);

  const loadFullInvoice = async () => {
    try {
      const data = await api.getInvoice(invoice.id);
      setFullInvoice(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
  const subtotal = lineItems.reduce((total, item) => {
    return total + (item.hours * fullInvoice.hourly_rate);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Print Actions - Hidden when printing */}
      <div className="no-print mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back to List
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Printable Invoice */}
      <div className="printable-invoice bg-white rounded-xl shadow-sm p-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <p className="text-xl text-gray-600">{fullInvoice.invoice_number}</p>
        </div>

        {/* From/To Section */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">From</h3>
            <div className="text-gray-900">
              {fullInvoice.your_business_name && (
                <p className="font-semibold text-lg mb-1">{fullInvoice.your_business_name}</p>
              )}
              {fullInvoice.your_business_address && (
                <p className="text-gray-600">{fullInvoice.your_business_address}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
            <div className="text-gray-900">
              <p className="font-semibold text-lg mb-1">{fullInvoice.client_name}</p>
              {fullInvoice.client_address && (
                <p className="text-gray-600">{fullInvoice.client_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-3 gap-6 mb-12 pb-8 border-b border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Invoice Date</p>
            <p className="text-gray-900">{formatDate(fullInvoice.invoice_date)}</p>
          </div>
          {fullInvoice.due_date && (
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Due Date</p>
              <p className="text-gray-900">{formatDate(fullInvoice.due_date)}</p>
            </div>
          )}
          {fullInvoice.payment_terms && (
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Payment Terms</p>
              <p className="text-gray-900">{fullInvoice.payment_terms}</p>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 text-sm font-semibold text-gray-700 uppercase">Description</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">Hours</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">Rate</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-4 text-gray-900">{item.description}</td>
                <td className="py-4 text-right text-gray-900">{item.hours}</td>
                <td className="py-4 text-right text-gray-900">${fullInvoice.hourly_rate.toFixed(2)}</td>
                <td className="py-4 text-right text-gray-900 font-medium">
                  ${(item.hours * fullInvoice.hourly_rate).toFixed(2)}
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
              <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-4 border-t-2 border-gray-300">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
