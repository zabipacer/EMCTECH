import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FaExclamationTriangle, FaImage, FaPlus } from "react-icons/fa";

import { useProducts, useProductFilters } from './hooks';
import {  uid, toCSV } from './constants';

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
        // Don't show toast here - the error state will handle it
        setConfirm(null);
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
        // Don't show toast here - the error state will handle it
        setConfirm(null);
      }
    },
    onCancel: () => setConfirm(null)
  });
}, [deleteProducts, showToast]);/* ------------------ Render ------------------ */

if (error) {
  console.error('❌ Main component error:', error);
  return <ErrorComponent error={error} onRetry={() => window.location.reload()} />;
} // Add this useEffect to log state changes
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

  /* ------------------ Render ------------------ */

  if (error) {
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
            onImport={async (file) => {
              await new Promise(r => setTimeout(r, 1000));
              showToast("Products imported successfully", "success");
              setImportOpen(false);
            }}
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