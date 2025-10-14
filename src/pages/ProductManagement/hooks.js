import { useState, useEffect, useMemo, useCallback } from "react";
import { productService, fileService } from './firebaseService';
import { uid } from './Storageutils.js';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching products from Firebase...');
      const list = await productService.getAllProducts();
      console.log('Products loaded from Firebase:', list);
      setProducts(list);
    } catch (err) {
      console.error('Error loading products:', err);
      setError("Failed to load products: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);
// In your useProducts hook - fix the deleteProducts function
const deleteProducts = useCallback(async (ids) => {
  setLoading(true);
  setError(null);
  try {
    console.log('🗑️ Deleting products from Firebase:', ids);
    
    if (!ids || ids.length === 0) {
      throw new Error('No product IDs provided for deletion');
    }
    
    // Delete products from Firestore
    await productService.deleteMultipleProducts(ids);
    
    console.log('✅ Products deleted successfully from Firebase');
    
    // Update local state immediately for better UX
    setProducts(prevProducts => prevProducts.filter(p => !ids.includes(p.id)));
    
    return ids;
  } catch (err) {
    console.error('❌ Error in deleteProducts:', err);
    const errorMessage = err.message || 'Failed to delete products';
    setError(errorMessage);
    
    // Re-throw the error so the calling code can handle it
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
}, []); // Remove refreshProducts dependency since we update locally





 const saveProduct = useCallback(async (product, imageFile = null) => {
  setLoading(true);
  try {
    console.log('🚀 Saving product:', { id: product.id, imageFile: !!imageFile });
    
    let productToSave = { ...product };
    
    // Handle image upload if provided
    if (imageFile) {
      console.log('📤 Uploading image file...');
      const imageUrl = await fileService.uploadProductImage(
        imageFile, 
        product.id || uid('p-')
      );
      productToSave.thumbnail = imageUrl;
      console.log('🖼️ Image uploaded, URL:', imageUrl);
    }
    
    let savedProduct;
    
    // FIXED: Check if this is a new product (has temporary ID) or existing product
    const isNewProduct = !product.id || product.id.startsWith('p-');
    
    if (isNewProduct) {
      // CREATE new product - remove the temporary ID and let Firestore generate one
      console.log('🆕 Creating new product...');
      const { id: tempId, ...productWithoutId } = productToSave;
      savedProduct = await productService.createProduct(productWithoutId);
    } else {
      // UPDATE existing product
      console.log('✏️ Updating existing product...');
      savedProduct = await productService.updateProduct(product.id, productToSave);
    }
    
    console.log('✅ Product saved successfully:', savedProduct);
    
    // Refresh the list to get the latest data
    await refreshProducts();
    return savedProduct;
  } catch (err) {
    console.error('❌ Error saving product:', err);
    setError("Failed to save product: " + err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, [refreshProducts]);
 

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  return {
    products,
    loading,
    error,
    refreshProducts,
    saveProduct,
    deleteProducts
  };
}

export function useProductFilters(products) {
  const [filters, setFilters] = useState({
    search: "",
    company: "all",
    category: "all",
    stock: "all",
    status: "all",
    sortBy: "updatedAt-desc"
  });

  const companies = useMemo(() => {
    const setc = new Set(products.map((p) => p.company).filter(Boolean));
    return Array.from(setc);
  }, [products]);

  const categories = useMemo(() => {
    const setc = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(setc);
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchesSearch =
        !filters.search ||
        (p.name?.EN || "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCompany = filters.company === "all" || p.company === filters.company;
      const matchesCategory = filters.category === "all" || p.category === filters.category;
      const matchesStatus = filters.status === "all" || p.status === filters.status;
      
      const matchesStock =
        filters.stock === "all" ||
        (filters.stock === "low" && typeof p.lowStockThreshold === "number" && p.stock <= p.lowStockThreshold) ||
        (filters.stock === "out" && p.stock <= 0);
      
      return matchesSearch && matchesCompany && matchesCategory && matchesStock && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "name-asc":
          return (a.name?.EN || "").localeCompare(b.name?.EN || "");
        case "name-desc":
          return (b.name?.EN || "").localeCompare(a.name?.EN || "");
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "stock-asc":
          return (a.stock || 0) - (b.stock || 0);
        case "stock-desc":
          return (b.stock || 0) - (a.stock || 0);
        case "updatedAt-desc":
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        case "updatedAt-asc":
          return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      company: "all",
      category: "all",
      stock: "all",
      status: "all",
      sortBy: "updatedAt-desc"
    });
  }, []);

  return {
    filters,
    filteredAndSorted,
    companies,
    categories,
    updateFilter,
    resetFilters
  };
}