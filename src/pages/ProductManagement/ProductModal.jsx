import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { FaSave, FaCopy, FaTimes, FaUpload, FaSlidersH, FaTrash, FaCheck, FaImage } from "react-icons/fa";
import { LANGUAGES, STATUS_OPTIONS } from './constants';
import { LoadingSpinner } from './Uicomponens';

function ProductModal({ product: initial, onClose, onSave, onUploadImage }) {
  const [product, setProduct] = useState(initial);
  const [activeLang, setActiveLang] = useState("EN");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setProduct(initial);
    setImageFile(null);
    setActiveLang("EN");
    setImageError("");
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
      // Store the file for upload when saving
      setImageFile(file);
      
      // Create local preview URL
      const localUrl = URL.createObjectURL(file);
      setProduct((p) => ({ ...p, thumbnail: localUrl }));
    } catch (e) {
      setImageError("Failed to process image");
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

  // Update save handlers to pass the image file
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(product, imageFile);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPublish = async () => {
    setSaving(true);
    try {
      await onSave({ ...product, status: "published" }, imageFile);
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

              {/* Category, Company & Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select
                    value={product.unit || "each"}
                    onChange={(e) => setField("unit", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="each">each</option>
                    <option value="piece">piece</option>
                    <option value="set">set</option>
                    <option value="meter">meter</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="unit">unit</option>
                    <option value="pair">pair</option>
                    <option value="box">box</option>
                  </select>
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

export default ProductModal;