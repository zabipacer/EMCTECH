// CreateProposal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from './contexts/AuthContext';
import { useProducts } from './pages/ProposalManagement/hooks/useFirebase'; // Your fixed hook
import { useClients } from './pages/ProposalManagement/hooks/useFirebase'; // Your clients hook
import CreateProposalModal from './pages/ProposalManagement/CreateProposalModal'; // Your modal component

const CreateProposal = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading, error: productsError } = useProducts(user);
  const { clients, loading: clientsLoading, error: clientsError, addClient } = useClients(user);
  const { addProposal } = useProposals(user);
  
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Debug logs
  useEffect(() => {
    console.log('=== CREATE PROPOSAL DEBUG ===');
    console.log('User:', user);
    console.log('User UID:', user?.uid);
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
      console.log('Saving proposal with user:', user);
      
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to save a proposal');
      }

      // Add the proposal using the hook
      const proposalId = await addProposal(proposalData);
      console.log('Proposal saved successfully with ID:', proposalId);
      
      // Show success message
      alert('Proposal saved successfully!');
      setIsModalOpen(false);
      
      // Navigate back or to proposals list
      window.history.back();
    } catch (error) {
      console.error('Error saving proposal:', error);
      alert('Error saving proposal: ' + error.message);
    }
  };

  const handleAddClient = async (clientData) => {
    try {
      console.log('Adding client with user:', user);
      
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to add a client');
      }

      const clientId = await addClient(clientData);
      console.log('Client added successfully with ID:', clientId);
      return clientId;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
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
          <p className="text-gray-600">Loading user authentication...</p>
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
        onAddClient={handleAddClient} // Make sure this is passed
        clients={clients || []}
        availableProducts={products || []}
        isLoading={productsLoading || clientsLoading}
        currentUser={user}
      />
    </div>
  );
};

export default CreateProposal;