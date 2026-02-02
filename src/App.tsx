import { BrowserRouter, Routes, Route } from "react-router-dom";
import InvoiceList from "./components/InvoiceList";
import InvoiceForm from "./components/InvoiceForm";
import PrintableInvoice from "./components/PrintableInvoice";
import Settings from "./components/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<InvoiceList />} />
          <Route path="/new" element={<InvoiceForm />} />
          <Route path="/edit/:id" element={<InvoiceForm />} />
          <Route path="/print/:id" element={<PrintableInvoice />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
