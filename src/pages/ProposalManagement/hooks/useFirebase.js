// src/hooks/useFirebase.js
import { useState, useEffect } from 'react';
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
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

    // Build query: prefer user-specific products, but fall back to all products
    try {
      let q;
      if (user && user.uid) {
        q = query(productsCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      } else {
        q = query(productsCollection, orderBy('createdAt', 'desc'));
      }

      const unsub = onSnapshot(q, (snapshot) => {
        console.log('Firebase products snapshot received, docs:', snapshot.size);

        // If user-scoped query returned no docs, attempt fallback to fetch all products once
        if ((snapshot.size === 0) && user && user.uid) {
          (async () => {
            try {
              console.log('User-scoped product query empty — fetching all products as fallback');
              const allQ = query(productsCollection, orderBy('createdAt', 'desc'));
              const allSnap = await getDocs(allQ);
              // reuse mapping logic below by replacing snapshot variable
              snapshot = allSnap; // eslint-disable-line no-param-reassign
              processSnapshot(snapshot);
            } catch (fallbackErr) {
              console.error('Fallback getDocs failed:', fallbackErr);
              setError(String(fallbackErr));
              setLoading(false);
            }
          })();
          return;
        }

        processSnapshot(snapshot);

        function processSnapshot(snap) {
          const mapped = snap.docs.map((doc) => {
            const data = doc.data() || {};

            // Defensive normalization for fields that vary between imports
            const name =
              (data.name && (data.name.EN || data.name.en || data.name.En)) ||
              data.title ||
              data.name ||
              (data.titleMap && (data.titleMap.EN || data.titleMap.en)) ||
              '';

            const price = data.price ?? (data.pricing?.amount) ?? 0;
            const thumbnail =
              data.thumbnail ||
              data.thumbnailUrl ||
              (Array.isArray(data.images) && data.images[0]) ||
              data.imageUrl ||
              '';

            // createdAt may be string or Timestamp
            let createdAt = data.createdAt;
            if (createdAt && typeof createdAt === 'string') {
              createdAt = new Date(createdAt);
            } else if (createdAt && createdAt.toDate) {
              createdAt = createdAt.toDate();
            } else {
              createdAt = new Date(0);
            }

            return {
              id: doc.id,
              name,
              price,
              description: data.description || data.seo?.description || '',
              category: data.category || '',
              sku: data.sku || '',
              stock: typeof data.stock === 'number' ? data.stock : (data.quantity ?? 0),
              status: data.status || 'published',
              thumbnail,
              imageUrl: thumbnail, // normalize to imageUrl as well
              createdAt,
              raw: data
            };
          });

          // Optionally filter out drafts / unwanted statuses here; for now keep all published + others
          const visible = mapped.filter(p => p && (p.status !== 'archived')); // adjust as needed

          console.log('Processed products data:', visible, 'total:', visible.length);
          setProducts(visible);
          setLoading(false);
        }
      }, (err) => {
        console.error('Products snapshot error:', err);
        setError(err.message || String(err));
        setLoading(false);
      });

      return () => unsub();
    } catch (err) {
      console.error('useProducts error:', err);
      setError(err.message || String(err));
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
          lineTotal: product.lineTotal || 0,
          // FIX: Ensure imageUrl is preserved when saving proposal
          imageUrl: product.imageUrl || product.thumbnail || ''
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

// ---------- useTemplates ----------
export const useTemplates = (user) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        templatesCollection,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const templatesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }));
          setTemplates(templatesData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Error fetching templates:', error);
          setError('Failed to load templates');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up templates listener:', error);
      setLoading(false);
    }
  }, [user]);

  return { templates, loading, error };
};