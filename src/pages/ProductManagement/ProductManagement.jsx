import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FaFileImport, FaFileExport, FaPlus } from "react-icons/fa";

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

// Enhanced field mapping for flexible CSV import
const FIELD_MAP = {
  name: ["name", "product name", "product_name", "productname", "title", "product", "item"],
  sku: ["sku", "product sku", "product_sku", "productsku", "code", "product code", "product_code", "item number", "item_number"],
  price: ["price", "price ($)", "unit price", "unit_price", "amount", "price usd", "cost usd", "retail price"],
  cost: ["cost", "cost ($)", "unit cost", "unit_cost", "purchase price", "purchase_price", "wholesale price"],
  quantity: ["quantity", "stock", "stock quantity", "stock_quantity", "qty", "inventory", "stock level"],
  description: ["description", "product description", "product_description", "desc", "product desc"],
  category: ["category", "product category", "product_category", "cat", "category name"],
  status: ["status", "product status", "product_status", "state", "active"],
  vendor: ["vendor", "company", "company/brand", "brand", "manufacturer", "supplier"],
  imageUrl: ["imageurl", "image_url", "image", "thumbnail", "picture", "photo"],
  tags: ["tags", "tag", "keywords", "product tags"],
  taxable: ["taxable", "tax", "tax required", "tax_required"],
  weight: ["weight", "product weight", "weight (kg)", "shipping weight"],
  dimensions: ["dimensions", "size", "measurements", "product dimensions"]
};

// Enhanced header normalization function
function normalizeHeaders(raw) {
  const normalized = {};
  
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null || value === '') continue;
    
    const cleanKey = key.toString().trim().toLowerCase();
    let found = false;
    
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      if (aliases.some(alias => alias.toLowerCase() === cleanKey)) {
        normalized[field] = value;
        found = true;
        break;
      }
    }
    
    if (!found) {
      normalized[cleanKey] = value;
    }
  }
  
  return normalized;
}

// Enhanced product validation
const validateProduct = (product) => {
  const errors = [];
  
  if (!product.name || product.name.toString().trim() === '') {
    errors.push('Product name is required');
  }
  
  if (!product.sku || product.sku.toString().trim() === '') {
    errors.push('SKU is required');
  }
  
  if (product.price && isNaN(parseFloat(product.price))) {
    errors.push('Invalid price format');
  }
  
  if (product.quantity && isNaN(parseInt(product.quantity))) {
    errors.push('Invalid quantity format');
  }
  
  return errors;
};

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

  const handleSaveProduct = useCallback(async (product, imageFile = null) => {
    try {
      await saveProduct(product, imageFile);
      setProductModalOpen(false);
      showToast("Product saved successfully", "success");
    } catch (err) {
      showToast("Failed to save product", "error");
    }
  }, [saveProduct, showToast]);

  const handleDuplicate = useCallback(async (product) => {
    const duplicate = {
      ...product,
      id: uid("p-"),
      sku: `${product.sku}-COPY-${Date.now().toString(36)}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    delete duplicate.thumbnail;
    
    try {
      await saveProduct(duplicate);
      showToast("Product duplicated successfully", "success");
    } catch (err) {
      showToast("Failed to duplicate product", "error");
    }
  }, [saveProduct, showToast]);

  const handleBulkStatusChange = useCallback(async (status) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return showToast("Select products first", "error");
    
    try {
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

  // Enhanced export function with XLS support
  const handleExport = useCallback(async (all = false, format = 'csv') => {
    const rows = (all ? filteredAndSorted : filteredAndSorted.filter((p) => selectedIds.has(p.id)));
    
    if (rows.length === 0) return showToast("No products to export", "error");
    
    const exportData = rows.map((p) => ({
      'Product Name (EN)': p.name?.EN || "",
      'Product Name (RU)': p.name?.RU || "",
      'Product Name (UZ)': p.name?.UZ || "",
      'SKU': p.sku || "",
      'Price ($)': p.price || 0,
      'Cost ($)': p.cost || 0,
      'Stock Quantity': p.stock || 0,
      'Low Stock Threshold': p.lowStockThreshold || 5,
      'Category': p.category || "",
      'Status': p.status || "",
      'Company/Brand': p.company || "",
      'Description': p.description || "",
      'Slug': p.seo?.slug || "",
      'Meta Title': p.seo?.title || "",
      'Meta Description': p.seo?.description || ""
    }));
    
    if (format === 'csv') {
      const csv = toCSV(exportData);
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
    } else if (format === 'xlsx') {
      try {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
        XLSX.writeFile(workbook, `products-export-${Date.now()}.xlsx`);
        showToast(`Exported ${rows.length} products to XLSX`, "success");
      } catch (err) {
        console.error('XLSX export error:', err);
        showToast("Failed to export XLSX file", "error");
      }
    }
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

 // Enhanced import handler with intelligent field detection and auto-generation
// Enhanced import handler for commercial offers and standard products
const handleImport = useCallback(async (productsFromFile, detectedMapping = {}) => {
  let imported = 0;
  let failed = 0;
  const errors = [];

  // Helper function to extract meaningful product name
  const extractProductName = (rawData) => {
    if (rawData.name) return rawData.name;
    if (rawData.description) return rawData.description;
    if (rawData.product) return rawData.product;
    if (rawData.item) return rawData.item;
    
    // Try to find any string field that could be a name
    for (const [key, value] of Object.entries(rawData)) {
      if (typeof value === 'string' && value.length > 5 && value.length < 100) {
        const lowerKey = key.toLowerCase();
        if (!lowerKey.includes('price') && !lowerKey.includes('quantity') && 
            !lowerKey.includes('sku') && !lowerKey.includes('code')) {
          return value;
        }
      }
    }
    
    return null;
  };

  // Helper function to extract numeric values
  const extractNumericValue = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    
    const str = String(value).replace(/[^\d.,]/g, '');
    const num = parseFloat(str.replace(',', ''));
    return isNaN(num) ? 0 : num;
  };

  for (const [index, raw] of productsFromFile.entries()) {
    try {
      // Skip empty rows
      const isEmptyRow = Object.values(raw).every(value => 
        value === undefined || value === null || value === '' || 
        (typeof value === 'string' && value.trim() === '')
      );
      
      if (isEmptyRow) {
        console.log(`Skipping empty row ${index + 1}`);
        continue;
      }

      console.log(`Processing row ${index + 1}:`, raw);

      // Extract product information with flexible field detection
      const productName = extractProductName(raw);
      let productSku = raw.sku || raw.code || raw.id || raw.product-code;
      
      // Auto-generate name and SKU if not found
      const finalName = productName || `Commercial Item ${index + 1}`;
      
      if (!productSku) {
        const cleanName = finalName.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
        productSku = `IMP-${cleanName}-${index + 1}`;
      }

      // Extract pricing and quantity information
      let price = 0;
      let cost = 0;
      let quantity = 1;

      // Try different field names for price
      const priceFields = ['price', 'unit price', 'price per unit', 'cost', 'amount', 'rate'];
      for (const field of priceFields) {
        if (raw[field] !== undefined && raw[field] !== null && raw[field] !== '') {
          price = extractNumericValue(raw[field]);
          if (price > 0) break;
        }
      }

      // Try different field names for quantity
      const quantityFields = ['quantity', 'qty', 'number of units', 'no. of unit', 'count', 'units'];
      for (const field of quantityFields) {
        if (raw[field] !== undefined && raw[field] !== null && raw[field] !== '') {
          quantity = extractNumericValue(raw[field]);
          if (quantity > 0) break;
        }
      }

      // Try different field names for cost
      const costFields = ['cost', 'unit cost', 'purchase price', 'wholesale'];
      for (const field of costFields) {
        if (raw[field] !== undefined && raw[field] !== null && raw[field] !== '') {
          cost = extractNumericValue(raw[field]);
          if (cost > 0) break;
        }
      }

      // If cost not found but price exists, set cost as 80% of price (typical margin)
      if (cost === 0 && price > 0) {
        cost = price * 0.8;
      }

      // Extract description
      let description = raw.description || raw.details || raw.technical || raw.notes || finalName;

      // Extract category from description or use default
      let category = raw.category || 'Commercial Products';
      if (description.toLowerCase().includes('lock')) category = 'Safety Locks';
      if (description.toLowerCase().includes('chain')) category = 'Safety Chains';
      if (description.toLowerCase().includes('box')) category = 'Storage Solutions';
      if (description.toLowerCase().includes('cabinet')) category = 'Storage Solutions';

      // Create the final product object
      const product = {
        id: uid("p-"),
        name: { 
          EN: finalName, 
          RU: "", 
          UZ: "" 
        },
        sku: productSku.toString().trim(),
        price: price,
        cost: cost,
        stock: quantity,
        lowStockThreshold: 5,
        category: category,
        status: "draft",
        company: "Teknik Group",
        description: description,
        thumbnail: "",
        seo: {
          slug: "",
          title: "",
          description: ""
        },
        specs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Final validation
      if (!product.name.EN || product.name.EN.trim() === '') {
        throw new Error("Could not determine product name");
      }

      if (product.price < 0) {
        product.price = 0;
      }

      if (product.stock < 0) {
        product.stock = 0;
      }

      console.log('Saving product:', product);
      await saveProduct(product);
      imported++;
      
    } catch (e) {
      failed++;
      const errorMsg = `Row ${index + 1}: ${e.message}`;
      errors.push(errorMsg);
      console.error('Import error for row:', raw, e);
    }
  }

  // Return results object
  const results = {
    imported,
    failed,
    total: imported + failed,
    errors: errors.length > 0 ? errors : null
  };

  // Show toast notification
  let toastMessage = `Imported ${imported} products`;
  let toastType = "success";
  
  if (failed > 0) {
    toastMessage += `, ${failed} failed`;
    toastType = "warning";
  }
  
  if (imported === 0 && failed === 0) {
    toastMessage = "No valid products found to import";
    toastType = "warning";
  }
  
  showToast(toastMessage, toastType);

  return results;
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

  // Debug logging
  useEffect(() => {
    console.log('🔍 ProductManagement State:', {
      productsCount: products.length,
      loading,
      error,
      selectedIds: Array.from(selectedIds),
      viewMode,
      page
    });
  }, [products, loading, error, selectedIds, viewMode, page]);

  if (error) {
    console.error('❌ Main component error:', error);
    return <ErrorComponent error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 space-y-6">
      {/* Header */}
      <Header 
        onImportOpen={() => setImportOpen(true)}
        onExportCSV={() => handleExport(true, 'csv')}
        onExportXLS={() => handleExport(true, 'xlsx')}
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
          onExportSelected={() => handleExport(false, 'csv')}
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