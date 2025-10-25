import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUpload, FaFileCsv, FaFileExcel, FaExclamationTriangle, FaPaperPlane, FaCheck, FaSpinner } from 'react-icons/fa';
import Papa from 'papaparse';

const ImportModal = ({ onClose, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [mapping, setMapping] = useState({});

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  // Intelligent field detection
  const detectFields = useCallback((headers) => {
    const fieldWeights = {
      name: ['name', 'product', 'product name', 'product_name', 'title', 'item', 'description', 'product description'],
      sku: ['sku', 'code', 'product code', 'product_code', 'id', 'product id', 'model', 'model number'],
      price: ['price', 'cost', 'unit price', 'unit_price', 'amount', 'retail', 'sale price'],
      cost: ['cost', 'unit cost', 'unit_cost', 'wholesale', 'purchase', 'purchase price'],
      quantity: ['quantity', 'stock', 'qty', 'inventory', 'stock level', 'available'],
      description: ['description', 'desc', 'product description', 'details'],
      category: ['category', 'cat', 'product category', 'type', 'group'],
      vendor: ['vendor', 'supplier', 'brand', 'manufacturer', 'company'],
      imageUrl: ['image', 'imageurl', 'image_url', 'picture', 'photo', 'thumbnail']
    };

    const detectedMapping = {};
    
    headers.forEach(header => {
      const cleanHeader = header.toLowerCase().trim();
      
      // Find the best matching field
      for (const [field, patterns] of Object.entries(fieldWeights)) {
        for (const pattern of patterns) {
          if (cleanHeader.includes(pattern) || pattern.includes(cleanHeader)) {
            if (!detectedMapping[field] || detectedMapping[field].score < pattern.length) {
              detectedMapping[field] = { header, score: pattern.length };
            }
            break;
          }
        }
      }
    });

    return detectedMapping;
  }, []);

  const handleFile = useCallback((file) => {
    setError(null);
    setFile(file);
    setImportResults(null);
    setMapping({});

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      setFile(null);
      return;
    }

    // Preview and detect fields
    if (isCSV) {
      Papa.parse(file, {
        header: true,
        preview: 10,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`);
            setPreview(null);
          } else {
            const headers = results.meta.fields || [];
            const detectedMapping = detectFields(headers);
            setMapping(detectedMapping);
            setPreview({
              headers,
              data: results.data,
              type: 'csv',
              detectedMapping
            });
          }
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
        }
      });
    } else {
      // For Excel files, we'll process after user clicks Import
      setPreview({
        headers: ['Excel file - click Import to process'],
        data: [],
        type: 'excel'
      });
    }
  }, [detectFields]);

  const processFile = useCallback(async () => {
  if (!file) {
    setError('Please select a file first');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const fileName = file.name.toLowerCase();
    let products = [];

    if (fileName.endsWith('.csv')) {
      products = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            } else {
              const nonEmptyRows = results.data.filter(row => 
                Object.values(row).some(value => 
                  value !== undefined && value !== null && value.toString().trim() !== ''
                )
              );
              resolve(nonEmptyRows);
            }
          },
          error: (error) => {
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          }
        });
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Enhanced commercial offer detection and parsing
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              defval: '',
              blankrows: false 
            });
            
            if (jsonData.length < 2) {
              reject(new Error('Excel file is empty or has no data rows'));
              return;
            }
            
            console.log('Raw Excel data:', jsonData);
            
            // Detect if this is a commercial offer document
            const isCommercialOffer = detectCommercialOffer(jsonData);
            
            let productsData = [];
            
            if (isCommercialOffer) {
              productsData = parseCommercialOfferData(jsonData);
            } else {
              // Standard product table parsing
              productsData = parseStandardProductData(jsonData);
            }
            
            if (productsData.length === 0) {
              reject(new Error('No valid product data found in the file'));
              return;
            }
            
            resolve(productsData);
          } catch (error) {
            console.error('Excel parsing error:', error);
            reject(new Error(`Excel parsing failed: ${error.message}`));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsArrayBuffer(file);
      });
      products = data;
    }

    if (products.length === 0) {
      throw new Error('No valid data found in the file');
    }

    // Process the import
    const results = await onImport(products, mapping);
    setImportResults(results);
    
  } catch (err) {
    console.error('Import error:', err);
    setError(err.message || 'Failed to import products');
  } finally {
    setLoading(false);
  }
}, [file, onImport, mapping]);

// Commercial offer detection
const detectCommercialOffer = (data) => {
  // Look for commercial offer indicators
  const offerIndicators = [
    'commercial offer',
    'technical details',
    'price per unit', 
    'unit',
    'quantity',
    'qty',
    'amount'
  ];
  
  let score = 0;
  data.forEach(row => {
    if (Array.isArray(row)) {
      row.forEach(cell => {
        const cellStr = String(cell).toLowerCase();
        offerIndicators.forEach(indicator => {
          if (cellStr.includes(indicator)) score++;
        });
      });
    }
  });
  
  return score >= 3; // If we find at least 3 indicators, treat as commercial offer
};

// Parse commercial offer data
// In the Excel processing section, replace the commercial offer parsing with:
const parseCommercialOfferData = (data) => {
  const products = [];
  let headers = [];
  let dataStartRow = -1;

  console.log('Parsing commercial offer data:', data);

  // Find the header row
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    
    // Look for row that contains product data headers
    const hasProductHeaders = row.some(cell => 
      String(cell).toLowerCase().includes('technical') || 
      String(cell).toLowerCase().includes('description') ||
      String(cell).toLowerCase().includes('unit') ||
      String(cell).toLowerCase().includes('price') ||
      String(cell).toLowerCase().includes('quantity')
    );
    
    if (hasProductHeaders) {
      headers = row.map(cell => String(cell).trim());
      dataStartRow = i + 1;
      console.log('Found headers at row', i, ':', headers);
      break;
    }
  }

  // Extract product data
  if (dataStartRow !== -1) {
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length < 2) continue;
      
      // Skip empty rows
      const isEmpty = row.every(cell => 
        cell === null || cell === undefined || cell === '' || 
        cell === '#VALUE!' || (typeof cell === 'string' && cell.trim() === '')
      );
      
      if (isEmpty) continue;
      
      // Skip summary/header rows
      const firstCell = String(row[0] || '').toLowerCase();
      if (firstCell.includes('total') || firstCell.includes('sum') || 
          firstCell.includes('terms') || firstCell === '') {
        continue;
      }

      // Create product object from row data
      const product = {};
      headers.forEach((header, index) => {
        if (index < row.length && row[index] !== undefined && row[index] !== null) {
          const value = row[index];
          // Skip formula errors
          if (value === '#VALUE!' || value === '#REF!' || value === '#DIV/0!') {
            return;
          }
          product[header] = value;
        }
      });

      // Only add if we have meaningful data
      if (Object.keys(product).length > 0) {
        products.push(product);
      }
    }
  }

  console.log('Parsed products from commercial offer:', products);
  return products;
};

// Standard product table parsing (existing logic)
const parseStandardProductData = (data) => {
  const headers = data[0].map(header => 
    header ? header.toString().trim() : ''
  );
  
  const productsData = data.slice(1).map((row, rowIndex) => {
    const product = {};
    headers.forEach((header, index) => {
      if (header && index < row.length) {
        product[header] = row[index];
      }
    });
    return product;
  }).filter(product => 
    Object.values(product).some(value => 
      value !== undefined && value !== null && value.toString().trim() !== ''
    )
  );
  
  return productsData;
};

  const closeModal = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {importResults ? 'Import Results' : 'Import Products'}
          </h2>
          <button
            onClick={closeModal}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {!importResults ? (
            <>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleChange}
                />
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FaUpload className="text-blue-600 text-xl" />
                    </div>
                  </div>
                  
                  <div>
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Click to upload
                    </label>
                    <span className="text-gray-600"> or drag and drop</span>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    CSV or Excel files only (.csv, .xlsx, .xls)
                  </p>
                  
                  <div className="flex justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FaFileCsv />
                      <span>CSV</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaFileExcel />
                      <span>Excel</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Info */}
              {file && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {file.name.toLowerCase().endsWith('.csv') ? (
                      <FaFileCsv className="text-green-600" />
                    ) : (
                      <FaFileExcel className="text-green-600" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {preview?.data?.length || 'Unknown'} rows detected
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Field Mapping */}
              {preview && Object.keys(mapping).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Detected Fields</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-3">
                      We automatically detected these fields in your file:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(mapping).map(([field, { header }]) => (
                        <div key={field} className="flex items-center gap-2">
                          <FaCheck className="text-green-600 text-xs" />
                          <span className="font-medium text-gray-700">{field}:</span>
                          <span className="text-gray-600">"{header}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {preview && preview.data && preview.data.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Data Preview</h3>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-48">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            {preview.headers.map((header, index) => (
                              <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.data.slice(0, 5).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {preview.headers.map((header, colIndex) => (
                                <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-b">
                                  {row[header] || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {preview.data.length > 5 && (
                      <div className="px-3 py-2 bg-gray-100 text-xs text-gray-500">
                        Showing first 5 rows of {preview.data.length} total
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Smart Field Detection</p>
                    <p className="text-yellow-700 mt-1">
                      We'll automatically detect fields like <strong>name</strong>, <strong>SKU</strong>, <strong>price</strong>, etc.
                      If we can't find name/SKU fields, we'll generate them automatically.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Import Results */
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                importResults.failed === 0 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  {importResults.failed === 0 ? (
                    <FaCheck className="text-green-600 text-xl" />
                  ) : (
                    <FaExclamationTriangle className="text-yellow-600 text-xl" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      Import {importResults.failed === 0 ? 'Completed Successfully' : 'Completed with Issues'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Successfully imported <strong>{importResults.imported}</strong> products
                      {importResults.failed > 0 && (
                        <>, <strong>{importResults.failed}</strong> failed</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {importResults.errors && importResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                  <div className="bg-red-50 rounded-lg border border-red-200 max-h-32 overflow-y-auto">
                    {importResults.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="p-2 border-b border-red-100 last:border-b-0">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    ))}
                    {importResults.errors.length > 10 && (
                      <div className="p-2 text-sm text-red-600">
                        ... and {importResults.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-red-800">
                <FaExclamationTriangle />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {!importResults ? (
            <>
              <button
                onClick={closeModal}
                disabled={loading}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processFile}
                disabled={!file || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Import Products
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={closeModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImportModal;