export const STORAGE_KEY = "__mvp_products";

export const STATUS_OPTIONS = [
  { value: "published", label: "Published", color: "bg-green-100 text-green-800" },
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "archived", label: "Archived", color: "bg-yellow-100 text-yellow-800" }
];

export const LANGUAGES = [
  { code: "EN", name: "English" },
  { code: "RU", name: "Russian" },
  { code: "UZ", name: "Uzbek" }
];

export const defaultProducts = [
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

export const COLLECTIONS = {
  PRODUCTS: 'products',
  USERS: 'users'
};

export const STORAGE_PATHS = {
  PRODUCT_IMAGES: 'product-images'
};


export const formatCurrency = (v) => (typeof v === "number" ? `$${v.toLocaleString()}` : v);

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
};



export const toCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

// Unique ID generator
export const uid = (prefix = '') => {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
};