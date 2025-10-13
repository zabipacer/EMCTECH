import React from 'react';

const DebugInfo = ({ proposals, clients, products, errors }) => {
  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-md z-50 border border-gray-600">
      <h3 className="font-bold mb-2 text-yellow-400">Debug Info:</h3>
      <div className="space-y-1">
        <div>📄 Proposals: {proposals.length} items</div>
        <div>👥 Clients: {clients.length} items</div>
        <div>📦 Products: {products.length} items</div>
        
        {errors.proposals && <div className="text-red-400">❌ Proposals Error: {errors.proposals}</div>}
        {errors.clients && <div className="text-red-400">❌ Clients Error: {errors.clients}</div>}
        {errors.products && <div className="text-red-400">❌ Products Error: {errors.products}</div>}
        
        {products.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="font-semibold text-yellow-400">Sample Product:</div>
            <div>Name: {products[0].name}</div>
            <div>Price: ${products[0].price}</div>
            <div>Category: {products[0].category}</div>
            <div>SKU: {products[0].sku}</div>
            <div>Status: {products[0].status}</div>
          </div>
        )}
        
        {clients.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="font-semibold text-yellow-400">Sample Client:</div>
            <div>Name: {clients[0].name}</div>
            <div>Email: {clients[0].email}</div>
            <div>Company: {clients[0].company}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugInfo;