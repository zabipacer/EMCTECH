// CreateProposal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from './contexts/AuthContext';
import { useProducts } from './pages/ProposalManagement/hooks/useFirebase'; // Your fixed hook
import { useClients } from './pages/ProposalManagement/hooks/useFirebase'; // Your clients hook
import CreateProposalModal from './pages/ProposalManagement/CreateProposalModal'; // Your modal component

const CreateProposal = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading, error: productsError } = useProducts(user);
  const { clients, loading: clientsLoading, error: clientsError } = useClients(user);
  
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Debug logs
  useEffect(() => {
    console.log('=== CREATE PROPOSAL DEBUG ===');
    console.log('User:', user);
    console.log('Products:', products);
    console.log('Products count:', products?.length);
    console.log('Products loading:', productsLoading);
    console.log('Products error:', productsError);
    console.log('Clients:', clients);
    console.log('Clients count:', clients?.length);
    console.log('======================');
  }, [user, products, productsLoading, productsError, clients]);

  const handleSaveProposal = async (proposalData) => {
    try {
      console.log('Saving proposal:', proposalData);
      // Add your save logic here
      // await saveProposalToFirebase(proposalData);
      alert('Proposal saved successfully!');
      setIsModalOpen(false);
      // Navigate back or to proposals list
      window.history.back();
    } catch (error) {
      console.error('Error saving proposal:', error);
      alert('Error saving proposal: ' + error.message);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    window.history.back();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CreateProposalModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProposal}
        clients={clients || []}
        availableProducts={products || []}
        isLoading={productsLoading || clientsLoading}
      />
    </div>
  );
};

export default CreateProposal;