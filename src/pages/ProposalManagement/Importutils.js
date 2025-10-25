

import Papa from 'papaparse';

/**
 * Import products from CSV file
 */
export const importProductsFromCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
};

/**
 * Import products from Excel file (XLSX or XLS)
 */
export const importProductsFromXLSX = async (file) => {
  try {
    // Dynamic import for xlsx to avoid bundle issues
    const XLSX = await import('xlsx');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Excel file is empty or has no data rows'));
            return;
          }
          
          // Extract headers (first row)
          const headers = jsonData[0].map(header => 
            header ? header.toString().trim().toLowerCase() : ''
          );
          
          // Convert rows to objects
          const products = jsonData.slice(1).map((row, index) => {
            const product = {};
            
            headers.forEach((header, colIndex) => {
              if (header && colIndex < row.length) {
                product[header] = row[colIndex];
              }
            });
            
            return product;
          }).filter(product => 
            // Filter out completely empty rows
            Object.keys(product).length > 0 && 
            (product.name || product.sku || product.productname || product.product_name)
          );
          
          resolve(products);
        } catch (error) {
          reject(new Error(`Excel parsing failed: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    throw new Error(`XLSX library not available: ${error.message}`);
  }
};

/**
 * Validate product data
 */
export const validateProduct = (product) => {
  const errors = [];
  
  // Required fields
  if (!product.name && !product.sku) {
    errors.push('Missing required fields: name or SKU');
  }
  
  // Validate numeric fields
  if (product.price && isNaN(parseFloat(product.price))) {
    errors.push('Invalid price format');
  }
  
  if (product.quantity && isNaN(parseInt(product.quantity))) {
    errors.push('Invalid quantity format');
  }
  
  if (product.cost && isNaN(parseFloat(product.cost))) {
    errors.push('Invalid cost format');
  }
  
  return errors;
};

/**
 * Normalize product data for consistent structure
 */
export const normalizeProduct = (rawProduct) => {
  // Map common column names to standard field names
  const fieldMapping = {
    'product name': 'name',
    'product_name': 'name',
    'productname': 'name',
    'product code': 'sku',
    'product_code': 'sku',
    'productcode': 'sku',
    'item number': 'sku',
    'item_number': 'sku',
    'description': 'description',
    'desc': 'description',
    'unit price': 'price',
    'unit_price': 'price',
    'price': 'price',
    'cost price': 'cost',
    'cost_price': 'cost',
    'cost': 'cost',
    'qty': 'quantity',
    'stock': 'quantity',
    'inventory': 'quantity',
    'category': 'category',
    'cat': 'category',
    'taxable': 'taxable',
    'image': 'imageUrl',
    'image_url': 'imageUrl',
    'imageurl': 'imageUrl',
    'thumbnail': 'imageUrl',
    'tags': 'tags',
    'vendor': 'vendor',
    'supplier': 'vendor',
    'weight': 'weight',
    'dimensions': 'dimensions',
    'status': 'status',
    'active': 'status'
  };
  
  const normalized = {};
  
  Object.keys(rawProduct).forEach(key => {
    const normalizedKey = fieldMapping[key.toLowerCase()] || key;
    let value = rawProduct[key];
    
    // Handle boolean values
    if (normalizedKey === 'taxable' || normalizedKey === 'active') {
      if (typeof value === 'string') {
        value = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
      }
    }
    
    normalized[normalizedKey] = value;
  });
  
  return normalized;
};

/**
 * Process imported products with validation and normalization
 */
export const processImportedProducts = (rawProducts) => {
  const validProducts = [];
  const errors = [];

  rawProducts.forEach((rawProduct, index) => {
    try {
      // Normalize field names
      const normalizedProduct = normalizeProduct(rawProduct);
      
      // Validate required fields
      if (!normalizedProduct.name && !normalizedProduct.sku) {
        throw new Error('Missing required fields: name or SKU');
      }

      // Create final product object with defaults
      const finalProduct = {
        name: normalizedProduct.name || `Imported Product ${index + 1}`,
        sku: normalizedProduct.sku || `IMP-${Date.now()}-${index}`,
        description: normalizedProduct.description || '',
        price: parseFloat(normalizedProduct.price) || 0,
        cost: parseFloat(normalizedProduct.cost) || 0,
        quantity: parseInt(normalizedProduct.quantity) || 0,
        category: normalizedProduct.category || 'Uncategorized',
        taxable: Boolean(normalizedProduct.taxable),
        unit: normalizedProduct.unit || 'pcs',
        status: normalizedProduct.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: normalizedProduct.imageUrl || normalizedProduct.image || normalizedProduct.thumbnail || '',
        tags: Array.isArray(normalizedProduct.tags) ? normalizedProduct.tags : 
              typeof normalizedProduct.tags === 'string' ? normalizedProduct.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        specifications: normalizedProduct.specifications || {},
        vendor: normalizedProduct.vendor || '',
        weight: parseFloat(normalizedProduct.weight) || 0,
        dimensions: normalizedProduct.dimensions || ''
      };

      // Additional validation
      if (isNaN(finalProduct.price) || finalProduct.price < 0) {
        throw new Error('Invalid price');
      }
      if (isNaN(finalProduct.quantity) || finalProduct.quantity < 0) {
        throw new Error('Invalid quantity');
      }

      validProducts.push(finalProduct);
    } catch (error) {
      errors.push({
        row: index + 1,
        product: rawProduct,
        error: error.message
      });
    }
  });

  return { validProducts, errors };
};