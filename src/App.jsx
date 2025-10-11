import React from "react";
import { Link } from "react-router-dom";

const App = ({ children }) => {
  return (
    <div className="flex">
      <div className="w-1/4 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <ul className="space-y-4 mt-6">
          <li>
            <Link to="/" className="text-blue-300 hover:text-white">Dashboard</Link>
          </li>
          <li>
            <Link to="/products" className="text-blue-300 hover:text-white">Product Management</Link>
          </li>
          <li>
            <Link to="/proposals" className="text-blue-300 hover:text-white">Proposal Management</Link>
          </li>
        </ul>
      </div>
      <div className="flex-1 p-6 bg-gray-100">
        {children} {/* The pages will render here */}
      </div>
    </div>
  );
};

export default App;
