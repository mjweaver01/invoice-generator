import { useState, useEffect } from "react";
import InvoiceList from "./components/InvoiceList";
import InvoiceForm from "./components/InvoiceForm";
import PrintableInvoice from "./components/PrintableInvoice";
import Settings from "./components/Settings";

export default function App() {
  const [view, setView] = useState("list"); // 'list', 'form', 'print', 'settings'
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    }
  };

  const handleNewInvoice = () => {
    setCurrentInvoice(null);
    setView("form");
  };

  const handleEditInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setView("form");
  };

  const handlePrintInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setView("print");
  };

  const handleShowSettings = () => {
    setView("settings");
  };

  const handleSaveInvoice = async (invoiceData) => {
    await loadInvoices();
    setView("list");
  };

  const handleBackToList = () => {
    setView("list");
    setCurrentInvoice(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {view === "list" && (
        <InvoiceList
          invoices={invoices}
          onNewInvoice={handleNewInvoice}
          onEditInvoice={handleEditInvoice}
          onPrintInvoice={handlePrintInvoice}
          onShowSettings={handleShowSettings}
          onRefresh={loadInvoices}
        />
      )}
      {view === "form" && (
        <InvoiceForm
          invoice={currentInvoice}
          onSave={handleSaveInvoice}
          onCancel={handleBackToList}
        />
      )}
      {view === "print" && (
        <PrintableInvoice invoice={currentInvoice} onBack={handleBackToList} />
      )}
      {view === "settings" && <Settings onBack={handleBackToList} />}
    </div>
  );
}
