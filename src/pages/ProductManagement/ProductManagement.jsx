import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FaExclamationTriangle, FaImage, FaPlus } from "react-icons/fa";

import { useProducts, useProductFilters } from './hooks';
import { uid, toCSV } from './constants';

import Header from './Header';
import Stats from './Stats';
import Filters from './Filers';
import BulkActions from './BulkActons';
import ProductsGrid from './ProductGrid';
import ProductsTable from './ProductTable';
import Pagination from './Pagination';
import ProductModal from './ProductModal';
import ImportModal from './ImportModal';
import ConfirmDialog from './ConfimDialog';
import Toast from './Toast';
import ErrorComponent from './ErrorComponent';

// Field mapping for flexible CSV import
const FIELD_MAP = {
  nameEN: ["EN", "Product name (EN)", "Name", "Product Name", "ProductName", "Name EN", "Product Name EN"],
  nameRU: ["RU", "Product name (RU)", "Name RU", "Product Name RU"],
  nameUZ: ["UZ", "Product name (UZ)", "Name UZ", "Product Name UZ"],
  sku: ["SKU", "Product SKU", "Sku", "Product Code", "Code"],
  price: ["Price ($)", "Price", "Unit Price", "Amount", "Price USD", "Cost USD"],
  cost: ["Cost ($)", "Cost", "Unit Cost", "Purchase Price"],
  stock: ["Stock Quantity", "Stock", "Quantity", "Qty", "Inventory"],
  lowStockThreshold: ["Low Stock Threshold", "Low Stock", "LowStock", "Min Stock", "Minimum Stock"],
  category: ["Category", "Product category", "Product Category", "Category Name"],
  status: ["Status", "Product Status", "State"],
  company: ["Company/Brand", "Company", "Brand", "Manufacturer", "Supplier"],
  description: ["Description", "Product Description", "Desc", "Product Desc"],
  slug: ["Slug", "URL Slug", "Product URL"],
  metaTitle: ["Meta Title", "MetaTitle", "SEO Title", "Title"],
  metaDescription: ["Meta Description", "MetaDescription", "SEO Description", "SEO Desc"]
};

// Header normalization function
function normalizeHeaders(raw) {
  const normalized = {};
  for (const [key, value] of Object.entries(raw)) {
    let found = false;
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      if (aliases.some(alias => alias.toLowerCase() === key.trim().toLowerCase())) {
        normalized[field] = value;
        found = true;
        break;
      }
    }
    if (!found) {
      normalized[key] = value; // fallback for unmapped fields
    }
  }
  return normalized;
}

export default function ProductManagement() {
  const { products, loading, error, saveProduct, deleteProducts } = useProducts();
  const { filters, filteredAndSorted, companies, categories, updateFilter, resetFilters } = useProductFilters(products);
  
  // UI state
  const [viewMode, setViewMode] = useState("grid");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 9;

  // Modal states
  const [editingProduct, setEditingProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Toast & confirm
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  /* ------------------ Pagination ------------------ */

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / perPage));
  const pageData = filteredAndSorted.slice((page - 1) * perPage, page * perPage);

  /* ------------------ Selection helpers ------------------ */

  // Add debug logging
  useEffect(() => {
    console.log('Products state:', products);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
  }, [products, loading, error]);

  useEffect(() => {
    if (selectAllPage) {
      const ids = new Set(selectedIds);
      pageData.forEach((p) => ids.add(p.id));
      setSelectedIds(ids);
    } else {
      const ids = new Set(selectedIds);
      pageData.forEach((p) => ids.delete(p.id));
      setSelectedIds(ids);
    }
  }, [selectAllPage, page]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
  }, []);

  /* ------------------ Actions ------------------ */

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type, id: Date.now() });
  }, []);

  const openProduct = useCallback((product = null) => {
    setEditingProduct(product || createBlankProduct());
    setProductModalOpen(true);
  }, []);

  const createBlankProduct = () => ({
    id: uid("p-"),
    name: { EN: "", RU: "", UZ: "" },
    sku: "",
    thumbnail: "",
    price: 0,
    cost: 0,
    stock: 0,
    lowStockThreshold: 5,
    category: "",
    status: "draft",
    company: "Innova",
    seo: { slug: "", title: "", description: "" },
    specs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Update the handleSaveProduct function
  const handleSaveProduct = useCallback(async (product, imageFile = null) => {
    try {
      await saveProduct(product, imageFile);
      setProductModalOpen(false);
      showToast("Product saved successfully", "success");
    } catch (err) {
      showToast("Failed to save product", "error");
    }
  }, [saveProduct, showToast]);

  // Update the handleDuplicate function
  const handleDuplicate = useCallback(async (product) => {
    const duplicate = {
      ...product,
      id: uid("p-"),
      sku: `${product.sku}-COPY-${Date.now().toString(36)}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Remove the thumbnail to avoid sharing the same image
    delete duplicate.thumbnail;
    
    try {
      await saveProduct(duplicate);
      showToast("Product duplicated successfully", "success");
    } catch (err) {
      showToast("Failed to duplicate product", "error");
    }
  }, [saveProduct, showToast]);

  // Update bulk status change
  const handleBulkStatusChange = useCallback(async (status) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return showToast("Select products first", "error");
    
    try {
      // Update each product individually
      await Promise.all(
        ids.map(async (id) => {
          const product = products.find(p => p.id === id);
          if (product) {
            await saveProduct({
              ...product,
              status,
              updatedAt: new Date().toISOString()
            });
          }
        })
      );
      
      clearSelection();
      showToast(`Updated status for ${ids.length} product${ids.length > 1 ? 's' : ''}`, "success");
    } catch (err) {
      showToast("Failed to update products", "error");
    }
  }, [selectedIds, products, saveProduct, clearSelection, showToast]);

  const handleExportCSV = useCallback((all = false) => {
    const rows = (all ? filteredAndSorted : filteredAndSorted.filter((p) => selectedIds.has(p.id))).map((p) => ({
      id: p.id,
      name: p.name?.EN || "",
      sku: p.sku || "",
      price: p.price || 0,
      cost: p.cost || 0,
      stock: p.stock || 0,
      status: p.status || "",
      category: p.category || "",
      company: p.company || ""
    }));
    
    if (rows.length === 0) return showToast("No products to export", "error");
    
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} products to CSV`, "success");
  }, [filteredAndSorted, selectedIds, showToast]);

 const handleDeleteSelected = useCallback(() => {
  const ids = Array.from(selectedIds);
  if (ids.length === 0) {
    showToast("Select products first", "error");
    return;
  }
  
  setConfirm({
    title: `Delete ${ids.length} product${ids.length > 1 ? 's' : ''}?`,
    message: "This action cannot be undone. The products will be permanently removed.",
    onConfirm: async () => {
      try {
        await deleteProducts(ids);
        clearSelection();
        setConfirm(null);
        showToast(`Deleted ${ids.length} product${ids.length > 1 ? 's' : ''}`, "success");
      } catch (err) {
        console.error('Delete selected error:', err);
        setConfirm(null);
        showToast(`Failed to delete products: ${err.message}`, "error");
      }
    },
    onCancel: () => setConfirm(null)
  });
}, [selectedIds, deleteProducts, clearSelection, showToast]);

  // Add this useEffect to monitor delete operations
  useEffect(() => {
    if (error) {
      console.log('🔄 Current error state:', error);
      console.log('📊 Products count during error:', products.length);
      console.log('⏳ Loading state during error:', loading);
    }
  }, [error, products, loading]);

 // In ProductManagement component - fix handleDeleteProduct
const handleDeleteProduct = useCallback((product) => {
  setConfirm({
    title: "Delete Product",
    message: `Are you sure you want to delete "${product.name?.EN || product.sku}"? This action cannot be undone.`,
    onConfirm: async () => {
      try {
        await deleteProducts([product.id]);
        setConfirm(null);
        showToast("Product deleted successfully", "success");
      } catch (err) {
        console.error('Delete single product error:', err);
        setConfirm(null);
        showToast(`Failed to delete product: ${err.message}`, "error");
      }
    },
    onCancel: () => setConfirm(null)
  });
}, [deleteProducts, showToast]);

// Fix handleDeleteSelected


  // Enhanced import handler with flexible mapping
  const handleImport = useCallback(async (productsFromCsv) => {
    let imported = 0;
    let failed = 0;
    const errors = [];

    for (const raw of productsFromCsv) {
      try {
        // Normalize CSV headers to internal field names
        const norm = normalizeHeaders(raw);
        
        // Create product with normalized fields
        const product = {
          name: { 
            EN: norm.nameEN || norm.name || "", 
            RU: norm.nameRU || "", 
            UZ: norm.nameUZ || "" 
          },
          sku: norm.sku || "",
          price: parseFloat(norm.price) || 0,
          cost: parseFloat(norm.cost) || 0,
          stock: parseInt(norm.stock) || 0,
          lowStockThreshold: parseInt(norm.lowStockThreshold) || 5,
          category: norm.category || "",
          status: (norm.status || "draft").toLowerCase(),
          company: norm.company || "Innova",
          description: norm.description || "",
          seo: {
            slug: norm.slug || "",
            title: norm.metaTitle || "",
            description: norm.metaDescription || ""
          },
          specs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!product.name.EN && !product.sku) {
          throw new Error("Missing required fields: name or SKU");
        }

        await saveProduct(product);
        imported++;
      } catch (e) {
        failed++;
        errors.push(`Row ${imported + failed + 1}: ${e.message}`);
        console.error('Import error for row:', raw, e);
      }
    }

    // Show comprehensive result
    let toastMessage = `Imported ${imported} products`;
    let toastType = "success";
    
    if (failed > 0) {
      toastMessage += `, ${failed} failed`;
      toastType = "error";
      
      // Log detailed errors for debugging
      console.error('Import errors:', errors);
      
      // Show first few errors in toast if needed
      if (errors.length > 0) {
        toastMessage += `. First error: ${errors[0]}`;
      }
    }
    
    showToast(toastMessage, toastType);
    setImportOpen(false);
  }, [saveProduct, showToast]);

  /* ------------------ UI Render Helpers ------------------ */

  const smallStats = useMemo(() => ({
    total: products.length,
    published: products.filter((p) => p.status === "published").length,
    draft: products.filter((p) => p.status === "draft").length,
    lowStock: products.filter((p) => typeof p.lowStockThreshold === "number" && p.stock <= p.lowStockThreshold).length
  }), [products]);

  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.company !== "all" || filters.category !== "all" || 
           filters.stock !== "all" || filters.status !== "all";
  }, [filters]);

  const handleFilterChange = useCallback((key, value) => {
    updateFilter(key, value);
    setPage(1);
  }, [updateFilter]);

  // Add this useEffect to log state changes
  useEffect(() => {
    console.log('🔍 ProductManagement State:', {
      productsCount: products.length,
      loading,
      error,
      selectedIds: Array.from(selectedIds),
      viewMode,
      page,
      productModalOpen,
      importOpen
    });
  }, [products, loading, error, selectedIds, viewMode, page, productModalOpen, importOpen]);



// Add this to your ProductManagement component
useEffect(() => {
  if (error) {
    console.log('🔄 Current error state:', error);
    console.log('📊 Products count:', products.length);
    console.log('⏳ Loading state:', loading);
  }
}, [error, products, loading]);

// Add this to monitor delete operations specifically
useEffect(() => {
  console.log('🔍 Delete operation state:', {
    selectedIds: Array.from(selectedIds),
    productsCount: products.length,
    loading
  });
}, [selectedIds, products, loading]);



  /* ------------------ Render ------------------ */

  if (error) {
    console.error('❌ Main component error:', error);
    return <ErrorComponent error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 space-y-6">
      {/* Header */}
      <Header 
        onImportOpen={() => setImportOpen(true)}
        onExportAll={() => handleExportCSV(true)}
        onAddProduct={() => openProduct(null)}
        filteredCount={filteredAndSorted.length}
        totalCount={products.length}
      />

      {/* Stats */}
      <Stats stats={smallStats} />

      {/* Filters & Controls */}
      <Filters 
        filters={filters}
        companies={companies}
        categories={categories}
        viewMode={viewMode}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <BulkActions 
          selectedCount={selectedIds.size}
          onBulkStatusChange={handleBulkStatusChange}
          onExportSelected={() => handleExportCSV(false)}
          onDeleteSelected={handleDeleteSelected}
          onClearSelection={clearSelection}
        />
      )}

      {/* Products List */}
      <div>
        {viewMode === "grid" ? (
          <ProductsGrid 
            products={pageData}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEdit={openProduct}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteProduct}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            onAddProduct={() => openProduct(null)}
          />
        ) : (
          <ProductsTable 
            products={pageData}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEdit={openProduct}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteProduct}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            selectAllPage={selectAllPage}
            onSelectAllPage={setSelectAllPage}
          />
        )}

        {/* Pagination */}
        {!loading && filteredAndSorted.length > 0 && (
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            perPage={perPage}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {importOpen && (
          <ImportModal
            onClose={() => setImportOpen(false)}
            onImport={handleImport}
          />
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {productModalOpen && editingProduct && (
          <ProductModal
            key={editingProduct.id}
            product={editingProduct}
            onClose={() => setProductModalOpen(false)}
            onSave={handleSaveProduct}
            onUploadImage={async (file) => {
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => setTimeout(() => resolve(reader.result), 500);
                reader.readAsDataURL(file);
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      {confirm && (
        <ConfirmDialog 
          title={confirm.title} 
          message={confirm.message} 
          onCancel={confirm.onCancel} 
          onConfirm={confirm.onConfirm} 
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}