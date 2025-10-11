
import React, { useEffect, useMemo, useState, useRef, useCallback, useReducer } from "react";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaThLarge,
  FaList,
  FaImage,
  FaTrash,
  FaFileImport,
  FaFileExport,
  FaSave,
  FaCopy,
  FaChevronLeft,
  FaChevronRight,
  FaUpload,
  FaSlidersH,
  FaTag,
  FaCheck,
  FaEdit,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------- Constants & Types ------------------------- */

const STORAGE_KEY = "__mvp_products";

const STATUS_OPTIONS = [
  { value: "published", label: "Published", color: "bg-green-100 text-green-800" },
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "archived", label: "Archived", color: "bg-yellow-100 text-yellow-800" }
];

const LANGUAGES = [
  { code: "EN", name: "English" },
  { code: "RU", name: "Russian" },
  { code: "UZ", name: "Uzbek" }
];

/* ------------------------- Mock / Persistence ------------------------- */

const defaultProducts = [
  {
    id: "p1",
    name: { EN: "Pump X100", RU: "Насос X100", UZ: "Nasos X100" },
    sku: "IP-X100",
    thumbnail: "",
    price: 1200,
    cost: 800,
    stock: 24,
    lowStockThreshold: 5,
    category: "Pumps",
    status: "published",
    company: "Innova",
    seo: { slug: "pump-x100", title: "Pump X100", description: "High-efficiency pump" },
    specs: [{ key: "Power", value: "5HP" }, { key: "Voltage", value: "220V" }],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z"
  },
  {
    id: "p2",
    name: { EN: "Valve V2", RU: "Клапан V2", UZ: "Valf V2" },
    sku: "VLV-V2",
    thumbnail: "",
    price: 320,
    cost: 200,
    stock: 8,
    lowStockThreshold: 10,
    category: "Valves",
    status: "draft",
    company: "Emctech",
    seo: { slug: "valve-v2", title: "Valve V2", description: "Durable industrial valve" },
    specs: [{ key: "Material", value: "Stainless Steel" }],
    createdAt: "2024-01-18T09:15:00Z",
    updatedAt: "2024-01-18T09:15:00Z"
  },
  {
    id: "p3",
    name: { EN: "Compressor 3000", RU: "Компрессор 3000", UZ: "Kompresor 3000" },
    sku: "CMP-3000",
    thumbnail: "",
    price: 4500,
    cost: 3000,
    stock: 2,
    lowStockThreshold: 3,
    category: "Compressors",
    status: "published",
    company: "Innova",
    seo: { slug: "compressor-3000", title: "Compressor 3000", description: "High-capacity compressor" },
    specs: [{ key: "Flow", value: "300 L/min" }],
    createdAt: "2024-01-10T16:20:00Z",
    updatedAt: "2024-01-22T11:10:00Z"
  }
];

function loadProductsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
      return defaultProducts;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse products from localStorage", e);
    return defaultProducts;
  }
}

function saveProductsToStorage(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* --------------------------- Utility Helpers -------------------------- */

const uid = (prefix = "") => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const formatCurrency = (v) => (typeof v === "number" ? `$${v.toLocaleString()}` : v);

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
};

/* -------------------------- Custom Hooks ------------------------ */

// Custom hook for products state management
function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 300)); // Simulate API delay
      const list = loadProductsFromStorage();
      setProducts(list);
    } catch (err) {
      setError("Failed to load products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProduct = useCallback(async (product) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const list = loadProductsFromStorage();
      const now = new Date().toISOString();
      const productToSave = {
        ...product,
        updatedAt: now,
        createdAt: product.createdAt || now
      };
      
      const idx = list.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        list[idx] = productToSave;
      } else {
        list.unshift(productToSave);
      }
      saveProductsToStorage(list);
      setProducts(list);
      return productToSave;
    } catch (err) {
      setError("Failed to save product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProducts = useCallback(async (ids) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      let list = loadProductsFromStorage();
      list = list.filter((p) => !ids.includes(p.id));
      saveProductsToStorage(list);
      setProducts(list);
      return list;
    } catch (err) {
      setError("Failed to delete products");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

// Custom hook for product filters and search
function useProductFilters(products) {
  const [filters, setFilters] = useState({
    search: "",
    company: "all",
    category: "all",
    stock: "all",
    status: "all",
    sortBy: "updatedAt-desc"
  });

  const companies = useMemo(() => {
    const setc = new Set(products.map((p) => p.company));
    return ["Innova", "Emctech", ...Array.from(setc).filter(Boolean)];
  }, [products]);

  const categories = useMemo(() => {
    const setc = new Set(products.map((p) => p.category));
    return Array.from(setc).filter(Boolean);
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

    // Sorting
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

/* --------------------------- Components --------------------------- */

const Chip = React.memo(({ children, className = "", onClick }) => (
  <span 
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    onClick={onClick}
  >
    {children}
  </span>
));

const Badge = React.memo(({ children, color = "bg-gray-100 text-gray-800", className = "" }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${color} ${className}`}>
    {children}
  </span>
));

const LoadingSpinner = ({ size = "md" }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizes[size]}`} />
  );
};

/* --------------------------- Main Page --------------------------- */

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

  // Refs
  const fileInputRef = useRef(null);

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

  const handleSaveProduct = useCallback(async (product) => {
    try {
      await saveProduct(product);
      setProductModalOpen(false);
      showToast("Product saved successfully", "success");
    } catch (err) {
      showToast("Failed to save product", "error");
    }
  }, [saveProduct, showToast]);

  const handleDeleteSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return showToast("Select products first", "error");
    
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
          showToast("Failed to delete products", "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  }, [selectedIds, deleteProducts, clearSelection, showToast]);

  const handleBulkStatusChange = useCallback(async (status) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return showToast("Select products first", "error");
    
    try {
      const list = loadProductsFromStorage().map((p) => 
        ids.includes(p.id) ? { ...p, status, updatedAt: new Date().toISOString() } : p
      );
      saveProductsToStorage(list);
      // Refresh the products list
      const updatedList = loadProductsFromStorage();
      // In a real app, you would update the state through your data management
      clearSelection();
      showToast(`Updated status for ${ids.length} product${ids.length > 1 ? 's' : ''}`, "success");
    } catch (err) {
      showToast("Failed to update products", "error");
    }
  }, [selectedIds, clearSelection, showToast]);

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

  const handleDuplicate = useCallback(async (product) => {
    const duplicate = {
      ...product,
      id: uid("p-"),
      sku: `${product.sku}-COPY-${Date.now().toString(36)}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await saveProduct(duplicate);
      showToast("Product duplicated successfully", "success");
    } catch (err) {
      showToast("Failed to duplicate product", "error");
    }
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

  /* ------------------ Render ------------------ */

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your product catalog — add, edit, import, export and publish products.
            {filteredAndSorted.length !== products.length && (
              <span className="ml-2 text-blue-600">
                (Showing {filteredAndSorted.length} of {products.length})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setImportOpen(true)} 
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow inline-flex items-center gap-2"
          >
            <FaFileImport /> Import CSV
          </button>

          <button 
            onClick={() => handleExportCSV(true)} 
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow inline-flex items-center gap-2"
          >
            <FaFileExport /> Export All
          </button>

          <button 
            onClick={() => openProduct(null)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: smallStats.total, color: "bg-blue-50 text-blue-700" },
          { label: "Published", value: smallStats.published, color: "bg-green-50 text-green-700" },
          { label: "Draft", value: smallStats.draft, color: "bg-gray-100 text-gray-700" },
          { label: "Low Stock", value: smallStats.lowStock, color: "bg-yellow-50 text-yellow-700" }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
            <span className={`text-2xl font-bold mt-1 block ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filters & Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search products, SKU, category..." 
                value={filters.search}
                onChange={(e) => {
                  updateFilter("search", e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.company}
                onChange={(e) => {
                  updateFilter("company", e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Companies</option>
                {companies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.category}
                onChange={(e) => {
                  updateFilter("category", e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) => {
                  updateFilter("status", e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.stock}
                onChange={(e) => {
                  updateFilter("stock", e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
                >
                  <FaTimes /> Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
            >
              <option value="updatedAt-desc">Last Updated</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="stock-desc">Stock High-Low</option>
            </select>

            {/* View Toggle */}
            <div className="border border-gray-300 rounded-lg overflow-hidden flex">
              <button 
                className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`} 
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <FaThLarge />
              </button>
              <button 
                className={`px-3 py-2 transition-colors ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`} 
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-blue-800">
              {selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                onClick={() => handleBulkStatusChange("published")}
              >
                Publish
              </button>
              <button 
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                onClick={() => handleBulkStatusChange("draft")}
              >
                Unpublish
              </button>
              <button 
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                onClick={() => handleExportCSV(false)}
              >
                Export Selected
              </button>
              <button 
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 inline-flex items-center gap-1"
                onClick={handleDeleteSelected}
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
          <button 
            className="px-3 py-1 border border-blue-300 text-blue-700 rounded text-sm hover:bg-blue-100 self-start"
            onClick={clearSelection}
          >
            Clear Selection
          </button>
        </motion.div>
      )}

      {/* Products List */}
      <div>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: perPage }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse h-64">
                  <div className="flex gap-3 mb-4">
                    <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
                    <div className="w-24 h-24 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : pageData.length ? (
              pageData.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedIds.has(product.id)}
                  onSelect={() => toggleSelect(product.id)}
                  onEdit={() => openProduct(product)}
                  onDuplicate={() => handleDuplicate(product)}
                  onDelete={() => setConfirm({
                    title: "Delete Product",
                    message: `Are you sure you want to delete "${product.name?.EN || product.sku}"? This action cannot be undone.`,
                    onConfirm: async () => {
                      try {
                        await deleteProducts([product.id]);
                        setConfirm(null);
                        showToast("Product deleted successfully", "success");
                      } catch (err) {
                        showToast("Failed to delete product", "error");
                      }
                    },
                    onCancel: () => setConfirm(null)
                  })}
                />
              ))
            ) : (
              <div className="col-span-full bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                <FaImage className="text-gray-300 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  {hasActiveFilters 
                    ? "Try adjusting your filters or search terms" 
                    : "Get started by adding your first product"
                  }
                </p>
                {hasActiveFilters ? (
                  <button 
                    onClick={resetFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button 
                    onClick={() => openProduct(null)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <FaPlus /> Add Product
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left w-12">
                      <input 
                        type="checkbox" 
                        aria-label="Select all products on this page"
                        checked={selectAllPage} 
                        onChange={(e) => setSelectAllPage(e.target.checked)} 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-900">Product</th>
                    <th className="p-4 text-left font-semibold text-gray-900">SKU</th>
                    <th className="p-4 text-left font-semibold text-gray-900">Price</th>
                    <th className="p-4 text-left font-semibold text-gray-900">Stock</th>
                    <th className="p-4 text-left font-semibold text-gray-900">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-900">Updated</th>
                    <th className="p-4 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    Array.from({ length: perPage }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                        <td className="p-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="p-4"><div className="h-8 bg-gray-200 rounded w-24"></div></td>
                      </tr>
                    ))
                  ) : pageData.length ? (
                    pageData.map((product) => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        selected={selectedIds.has(product.id)}
                        onSelect={() => toggleSelect(product.id)}
                        onEdit={() => openProduct(product)}
                        onDuplicate={() => handleDuplicate(product)}
                        onDelete={() => setConfirm({
                          title: "Delete Product",
                          message: `Are you sure you want to delete "${product.name?.EN || product.sku}"? This action cannot be undone.`,
                          onConfirm: async () => {
                            try {
                              await deleteProducts([product.id]);
                              setConfirm(null);
                              showToast("Product deleted successfully", "success");
                            } catch (err) {
                              showToast("Failed to delete product", "error");
                            }
                          },
                          onCancel: () => setConfirm(null)
                        })}
                      />
                    ))
                  ) : (
                    <tr>
                      <td className="p-8 text-center" colSpan={8}>
                        <div className="text-gray-500 flex flex-col items-center">
                          <FaImage className="text-gray-300 text-3xl mb-2" />
                          <p>No products found</p>
                          {hasActiveFilters && (
                            <button 
                              onClick={resetFilters}
                              className="text-blue-600 hover:text-blue-800 mt-2"
                            >
                              Clear filters to see all products
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredAndSorted.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to{" "}
              <span className="font-medium">{Math.min(page * perPage, filteredAndSorted.length)}</span> of{" "}
              <span className="font-medium">{filteredAndSorted.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <FaChevronLeft className="text-gray-600" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`w-10 h-10 rounded-lg border ${
                        page === pageNum
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2">...</span>
                    <button
                      className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button 
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <FaChevronRight className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {importOpen && (
          <ImportModal
            onClose={() => setImportOpen(false)}
            onImport={async (file) => {
              // Simulate import
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
              // Simulate upload
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

/* ---------------------- Product Card (Grid) ---------------------- */

const ProductCard = React.memo(({ product, selected, onSelect, onEdit, onDuplicate, onDelete }) => {
  const isLowStock = typeof product.lowStockThreshold === "number" && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0;
  const statusConfig = STATUS_OPTIONS.find(s => s.value === product.status) || STATUS_OPTIONS[1];
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      } hover:shadow-md`}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <input 
              type="checkbox" 
              checked={selected} 
              onChange={onSelect}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate" title={product.name?.EN}>
                {product.name?.EN || "Untitled Product"}
              </h3>
              <p className="text-sm text-gray-500 truncate">{product.category || "Uncategorized"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wide">SKU</div>
            <div className="font-mono font-semibold text-sm">{product.sku}</div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {product.thumbnail ? (
            <img 
              src={product.thumbnail} 
              alt={product.name?.EN} 
              className="object-cover w-full h-full" 
            />
          ) : (
            <FaImage className="text-gray-300 text-2xl" />
          )}
        </div>

        {/* Status & Stock */}
        <div className="flex items-center justify-between mb-3">
          <Badge color={statusConfig.color} className="capitalize">
            {statusConfig.label}
          </Badge>
          <div className="flex gap-1">
            {isOutOfStock && (
              <Badge color="bg-red-100 text-red-800">Out of Stock</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge color="bg-yellow-100 text-yellow-800">Low Stock</Badge>
            )}
          </div>
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-gray-500">Price</div>
            <div className="font-bold text-gray-900">{formatCurrency(product.price)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Stock</div>
            <div className={`font-semibold ${
              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
            }`}>
              {product.stock}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 truncate flex-1" title={product.company}>
            {product.company}
          </div>
          <div className="flex items-center gap-1">
            <button 
              title="Edit" 
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              onClick={onEdit}
            >
              <FaEdit size={14} />
            </button>
            <button 
              title="Duplicate" 
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              onClick={onDuplicate}
            >
              <FaCopy size={14} />
            </button>
            <button 
              title="Delete" 
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              onClick={onDelete}
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

/* ---------------------- Product Table Row ---------------------- */

const ProductTableRow = React.memo(({ product, selected, onSelect, onEdit, onDuplicate, onDelete }) => {
  const isLowStock = typeof product.lowStockThreshold === "number" && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0;
  const statusConfig = STATUS_OPTIONS.find(s => s.value === product.status) || STATUS_OPTIONS[1];
  
  return (
    <motion.tr 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-gray-200 hover:bg-gray-50 ${
        selected ? 'bg-blue-50' : ''
      }`}
    >
      <td className="p-4">
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={onSelect}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
            {product.thumbnail ? (
              <img 
                src={product.thumbnail} 
                alt={product.name?.EN} 
                className="object-cover w-full h-full" 
              />
            ) : (
              <FaImage className="text-gray-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate" title={product.name?.EN}>
              {product.name?.EN || "Untitled Product"}
            </div>
            <div className="text-sm text-gray-500 truncate">{product.category}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <code className="text-sm font-mono text-gray-600">{product.sku}</code>
      </td>
      <td className="p-4 font-semibold text-gray-900">{formatCurrency(product.price)}</td>
      <td className="p-4">
        <div className={`font-semibold ${
          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
        }`}>
          {product.stock}
        </div>
      </td>
      <td className="p-4">
        <Badge color={statusConfig.color} className="capitalize">
          {statusConfig.label}
        </Badge>
      </td>
      <td className="p-4 text-sm text-gray-500">
        {formatDate(product.updatedAt)}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button 
            onClick={onDuplicate}
            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors"
            title="Duplicate"
          >
            <FaCopy size={14} />
          </button>
          <button 
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});

/* ---------------------- Product Modal (Create / Edit) ---------------------- */

function ProductModal({ product: initial, onClose, onSave, onUploadImage }) {
  const [product, setProduct] = useState(initial);
  const [activeLang, setActiveLang] = useState("EN");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProduct(initial);
  }, [initial]);

  const setField = useCallback((path, value) => {
    setProduct((p) => {
      const copy = JSON.parse(JSON.stringify(p));
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setImageError("Only PNG, JPG, and WebP images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image must be smaller than 2MB");
      return;
    }
    setImageError("");
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      setProduct((p) => ({ ...p, thumbnail: url }));
    } catch (e) {
      setImageError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddSpec = useCallback(() => {
    setProduct((p) => ({ 
      ...p, 
      specs: [...(p.specs || []), { key: "", value: "" }] 
    }));
  }, []);

  const handleRemoveSpec = useCallback((idx) => {
    setProduct((p) => ({ 
      ...p, 
      specs: p.specs.filter((_, i) => i !== idx) 
    }));
  }, []);

  const handleSpecChange = useCallback((idx, key, val) => {
    setProduct((p) => { 
      const cp = JSON.parse(JSON.stringify(p)); 
      cp.specs[idx][key] = val; 
      return cp; 
    });
  }, []);

  const autoGenerateSku = useCallback(() => {
    const base = (product.name?.EN || "PRD")
      .split(" ")
      .slice(0, 2)
      .map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))
      .join("-");
    const random = Math.floor(Math.random() * 900 + 100);
    setProduct((p) => ({ ...p, sku: `${base}-${random}` }));
  }, [product.name?.EN]);

  const margin = useMemo(() => {
    const price = Number(product.price || 0);
    const cost = Number(product.cost || 0);
    if (!price || price === 0) return 0;
    return Math.round(((price - cost) / price) * 100);
  }, [product.price, product.cost]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(product);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPublish = async () => {
    setSaving(true);
    try {
      await onSave({ ...product, status: "published" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="z-10 w-full max-w-6xl bg-white rounded-xl shadow-2xl flex flex-col max-h-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {initial.id ? "Edit Product" : "Create New Product"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {initial.id ? "Update product details and settings" : "Add a new product to your catalog"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                navigator.clipboard?.writeText(product.seo?.slug || "");
                // In a real app, you would use a toast here
              }} 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Copy Slug
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : <FaSave />}
              Save
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Name & SKU */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setActiveLang(lang.code)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          activeLang === lang.code 
                            ? "bg-blue-600 text-white" 
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {lang.code}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1">
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Product name (${activeLang})`}
                      value={product.name?.[activeLang] || ""}
                      onChange={(e) => setField(`name.${activeLang}`, e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="Product SKU"
                        value={product.sku}
                        onChange={(e) => setField("sku", e.target.value)}
                      />
                      <button
                        onClick={autoGenerateSku}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 whitespace-nowrap"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={product.status}
                      onChange={(e) => setField("status", e.target.value)}
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  placeholder="Product description (shown in product previews and listings)"
                  value={product.description || ""}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>

              {/* Category & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Product category"
                    value={product.category || ""}
                    onChange={(e) => setField("category", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company/Brand</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Company name"
                    value={product.company || ""}
                    onChange={(e) => setField("company", e.target.value)}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={product.price}
                      onChange={(e) => setField("price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={product.cost}
                      onChange={(e) => setField("cost", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                      <div className={`font-medium ${
                        margin > 0 ? 'text-green-600' : margin < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {margin}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Inventory</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={product.stock}
                      onChange={(e) => setField("stock", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={product.lowStockThreshold}
                      onChange={(e) => setField("lowStockThreshold", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Specifications</h4>
                  <button
                    onClick={handleAddSpec}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add Specification
                  </button>
                </div>
                <div className="space-y-3">
                  {(product.specs || []).map((spec, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <input
                        placeholder="Specification name"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        placeholder="Value"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleRemoveSpec(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                  {(product.specs || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <FaSlidersH className="mx-auto text-2xl mb-2" />
                      <p>No specifications added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Media & SEO */}
            <div className="space-y-6">
              {/* Media Upload */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Product Image</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <div className="h-48 flex items-center justify-center bg-white rounded mb-3 overflow-hidden">
                    {product.thumbnail ? (
                      <img 
                        src={product.thumbnail} 
                        alt="Product thumbnail" 
                        className="max-h-full max-w-full object-contain" 
                      />
                    ) : (
                      <FaImage className="text-gray-300 text-4xl" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block">
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2">
                        <FaUpload /> Choose Image
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                      />
                    </label>
                    {uploading && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <LoadingSpinner size="sm" /> Uploading...
                      </div>
                    )}
                    {imageError && (
                      <div className="text-sm text-red-600">{imageError}</div>
                    )}
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP up to 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">SEO Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="product-slug"
                      value={product.seo?.slug || ""}
                      onChange={(e) => setField("seo.slug", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Product meta title"
                      value={product.seo?.title || ""}
                      onChange={(e) => setField("seo.title", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Product meta description"
                      value={product.seo?.description || ""}
                      onChange={(e) => setField("seo.description", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <FaSave />}
                    Save Product
                  </button>
                  <button
                    onClick={handleSaveAndPublish}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <FaCheck />}
                    Save & Publish
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(JSON.stringify(product, null, 2));
                      // In a real app, you would use a toast here
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Copy as JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------- Import Modal ---------------------- */

function ImportModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        alert("Please select a CSV file");
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      await onImport(file);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="z-10 bg-white rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Products</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Upload a CSV file with your product data. The file should include columns for name, SKU, price, and other product details.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
            {file ? (
              <div className="text-green-600">
                <FaCheck className="text-2xl mx-auto mb-2" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <>
                <FaFileImport className="text-3xl text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Choose File
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing && <LoadingSpinner size="sm" />}
              {importing ? "Importing..." : "Import Products"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------- Confirm Dialog ---------------------- */

function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 bg-white rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaExclamationTriangle className="text-red-600 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------- Toast ---------------------- */

function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-600 text-white",
    info: "bg-blue-600 text-white"
  };

  const icons = {
    success: <FaCheck className="text-lg" />,
    error: <FaTimes className="text-lg" />,
    warning: <FaExclamationTriangle className="text-lg" />,
    info: <FaInfo className="text-lg" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${styles[type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-80`}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
      >
        <FaTimes size={14} />
      </button>
    </motion.div>
  );
}

// Helper component for Info icon (since it wasn't imported)
const FaInfo = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 192 512" height="1em" width="1em">
    <path d="M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0-11.046-8.954-20-20-20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z"></path>
  </svg>
);

/* ---------------------- CSV Helper ---------------------- */

function toCSV(rows) {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(",")];
  for (const row of rows) {
    const values = keys.map(key => {
      const value = row[key];
      if (typeof value === "string") {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}