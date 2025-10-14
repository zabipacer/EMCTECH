// src/hooks/useFirebase.js
import { useState, useEffect } from 'react';
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../../../firebase/firebase";

// ---------- collection refs ----------
const proposalsCollection = collection(db, 'proposals');
const clientsCollection = collection(db, 'clients');
const productsCollection = collection(db, 'products');
const templatesCollection = collection(db, 'templates');

// ---------- useProducts ----------
export const useProducts = (user) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('useProducts hook called with user:', user);
    
    try {
      const q = query(
        productsCollection,
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Firebase products snapshot received');
          const productsData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Raw product data for ID', doc.id, ':', data);
            
            // Handle the nested name structure properly
            let productName = 'Unnamed Product';
            if (data.name) {
              if (typeof data.name === 'string') {
                productName = data.name;
              } else if (data.name.EN) {
                productName = data.name.EN;
              } else if (typeof data.name === 'object') {
                productName = data.name.EN || data.name.RU || data.name.UZ || 'Unnamed Product';
              }
            }
            
            const productCategory = data.category || 'Uncategorized';
            const productPrice = data.price || 0;

            return {
              id: doc.id,
              name: productName,
              category: productCategory,
              price: productPrice,
              description: data.seo?.description || data.description || '',
              stock: data.stock || 0,
              thumbnail: data.thumbnail || '',
              cost: data.cost || 0,
              sku: data.sku || '',
              status: data.status || 'published'
            };
          });

          console.log('Processed products data:', productsData);
          setProducts(productsData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Error in products snapshot:', error);
          setError('Failed to load products: ' + error.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up products listener:', error);
      setError('Failed to load products: ' + error.message);
      setLoading(false);
    }
  }, [user]);

  return { products, loading, error };
};

// ---------- useClients ----------
export const useClients = (user) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      console.log('No user found for clients hook');
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        clientsCollection,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const clientsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }));
          console.log('Clients loaded:', clientsData);
          setClients(clientsData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Error fetching clients:', error);
          setError('Failed to load clients');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up clients listener:', error);
      setLoading(false);
    }
  }, [user]);

  const addClient = async (clientData) => {
    try {
      // Check if user exists
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to add a client');
      }

      const clientToSave = {
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        company: clientData.company || '',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (!clientToSave.name) {
        throw new Error('Client name is required');
      }

      console.log('Adding client:', clientToSave);
      const docRef = await addDoc(clientsCollection, clientToSave);
      console.log('Client added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  return { clients, loading, error, addClient };
};

// ---------- useProposals ----------
export const useProposals = (user) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setProposals([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        proposalsCollection,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const proposalsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              expires: data.expires?.toDate?.(),
              products: data.products || []
            };
          });
          setProposals(proposalsData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Error fetching proposals:', error);
          setError('Failed to load proposals');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up proposals listener:', error);
      setLoading(false);
    }
  }, [user]);

  const addProposal = async (proposalData) => {
    try {
      // Validate user exists
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to add a proposal');
      }

      // Validate required fields
      if (!proposalData.clientId || !proposalData.proposalTitle) {
        throw new Error('Client and proposal title are required');
      }

      const proposalToSave = {
        ...proposalData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Ensure products array is properly formatted
        products: proposalData.products?.map(product => ({
          id: product.id || `prod_${Date.now()}`,
          name: product.name || 'Unnamed Product',
          category: product.category || 'Uncategorized',
          quantity: product.quantity || 1,
          unitPrice: product.unitPrice || 0,
          discount: product.discount || 0,
          taxable: product.taxable !== undefined ? product.taxable : true,
          lineTotal: product.lineTotal || 0
        })) || []
      };

      console.log('Saving proposal:', proposalToSave);
      const docRef = await addDoc(proposalsCollection, proposalToSave);
      console.log('Proposal saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding proposal:', error);
      throw error;
    }
  };

 const updateProposal = async (proposalId, updates) => {
  try {
    if (!user || !user.uid) {
      throw new Error('User must be authenticated to update a proposal');
    }

    // Remove undefined fields (especially expires)
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await updateDoc(doc(proposalsCollection, proposalId), {
      ...cleanedUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating proposal:', error);
    throw error;
  }
};

  const deleteProposal = async (proposalId) => {
    try {
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to delete a proposal');
      }

      await deleteDoc(doc(proposalsCollection, proposalId));
    } catch (error) {
      console.error('Error deleting proposal:', error);
      throw error;
    }
  };

  const bulkDeleteProposals = async (proposalIds) => {
    try {
      if (!user || !user.uid) {
        throw new Error('User must be authenticated to delete proposals');
      }

      const batch = writeBatch(db);
      proposalIds.forEach(id => {
        batch.delete(doc(proposalsCollection, id));
      });
      await batch.commit();
    } catch (error) {
      console.error('Error bulk deleting proposals:', error);
      throw error;
    }
  };

  return {
    proposals,
    loading,
    error,
    addProposal,
    updateProposal,
    deleteProposal,
    bulkDeleteProposals
  };
};