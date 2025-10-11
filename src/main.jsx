import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import './index.css'; // Import Tailwind CSS
import Dashboard from "./pages/Dashbard";
import ProductManagement from "./pages/Productmanagement";
import ProposalManagement from "./pages/ProposalManagement";
import CreateProposal from "./Createproposal";
import ClientManagement from "./pages/ClientManagemnet";

const rootElement = document.getElementById("root");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/proposals" element={<ProposalManagement />} />
          <Route path="/proposals/create" element={<CreateProposal />} />
      <Route path="/clients" element={<ClientManagement />} />
   
        </Routes>
      </div>
    </Router>
  </React.StrictMode>
);
