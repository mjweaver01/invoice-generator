import { BrowserRouter, Routes, Route } from "react-router-dom";

import InvoiceList from "./pages/InvoiceList";
import InvoiceForm from "./pages/InvoiceForm";
import PrintableInvoice from "./pages/PrintableInvoice";
import Settings from "./pages/Settings";
import Clients from "./pages/Clients";

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
          <Route path="/clients" element={<Clients />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
