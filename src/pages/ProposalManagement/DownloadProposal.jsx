// src/components/DownloadProposal.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Robust image loader: fetch blob -> createObjectURL -> Image -> scaled base64
const loadImage = async (url, maxDim = 800) => {
  if (!url) return null;

  try {
    // If already base64 data URL, return directly
    if (typeof url === 'string' && url.startsWith('data:image')) return url;

    // Try fetch first (better CORS handling if server allows)
    let response = null;
    try {
      response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (fetchErr) {
      // fallback: try using Image approach (some servers block fetch but allow image loads)
      console.warn('Fetch failed, will try Image load fallback for', url, fetchErr);
      return await loadImageViaImage(url, maxDim);
    }

    const blob = await response.blob();
    // create object URL for Image
    const objectUrl = URL.createObjectURL(blob);
    try {
      const base64 = await loadImageViaImage(objectUrl, maxDim);
      return base64;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (err) {
    console.warn('loadImage overall failed for', url, err);
    // final fallback: try the image tag loader directly
    try {
      return await loadImageViaImage(url, maxDim);
    } catch (err2) {
      console.warn('final image fallback failed for', url, err2);
      return null;
    }
  }
};

// Helper: load image using <img> element and scale to maxDim, return dataURL
const loadImageViaImage = (src, maxDim = 800) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    const timeout = setTimeout(() => {
      console.warn('Image load timeout for', src);
      resolve(null);
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        // scale to maxDim preserving aspect
        const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const w = Math.max(1, Math.floor((img.naturalWidth || img.width) * ratio));
        const h = Math.max(1, Math.floor((img.naturalHeight || img.height) * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // Use JPEG for smaller size (quality 0.8)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Error converting image to base64 for', src, err);
        resolve(null);
      }
    };

    img.onerror = (err) => {
      clearTimeout(timeout);
      console.warn('Image load error for', src, err);
      resolve(null);
    };

    img.src = src;
  });
};

// draw company logo helper — draws logo at top-left with proper sizing (mm units)
const drawLogo = (doc, logoBase64) => {
  if (!logoBase64) return;
  try {
    // 30x30 mm box at 20,12 (adjust as needed)
    const x = 20;
    const y = 12;
    const w = 30;
    const h = 20;
    // doc.addImage accepts dataURL; if it's PNG/JPEG, jsPDF handles it
    doc.addImage(logoBase64, 'JPEG', x, y, w, h);
  } catch (err) {
    console.warn('Failed to draw logo in PDF:', err);
  }
};

// Template 1: Simple Commercial Offer (No Images)
export async function downloadSimpleCommercialPdf(proposalData) {
  const doc = new jsPDF();
  
  const proposal = proposalData.proposal || proposalData;
  const products = proposalData.products || proposalData.selectedProducts || [];
  const formatCurrency = proposalData.formatCurrency || ((amount) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  );

  const data = {
    proposalNumber: proposal.proposalNumber || `PROP-${Date.now()}`,
    proposalTitle: proposal.proposalTitle || 'Commercial Offer',
    client: proposal.clientName || proposal.client || 'N/A',
    company: proposal.company || 'Your Company',
    clientEmail: proposal.clientEmail || proposal.email || '',
    clientPhone: proposal.clientPhone || proposal.phone || '',
    proposalDate: proposal.proposalDate || new Date().toISOString().split('T')[0],
    validUntil: proposal.validUntil || '',
    terms: proposal.terms || '',
    notes: proposal.notes || '',
    status: proposal.status || 'draft',
    subtotal: proposalData.subtotal || proposal.subtotal || 0,
    totalDiscount: proposalData.totalDiscount || proposal.totalDiscount || 0,
    taxAmount: proposalData.taxAmount || proposal.taxAmount || 0,
    taxRate: proposal.taxRate || proposal.taxRate || 0,
    grandTotal: proposalData.grandTotal || proposal.grandTotal || 0,
    products: products
  };

  // Colors
  const primaryColor = [41, 128, 185];
  const lightBlue = [235, 245, 251];
  
  // Try to load company logo (non-blocking if fails)
  const logoUrl = proposal.companyDetails?.logoUrl || proposal.logo || proposal.companyLogo || proposal.companyDetails?.logo;
  let logoBase64 = null;
  if (logoUrl) {
    try {
      logoBase64 = await loadImage(logoUrl, 400); // smaller max dim for logo
    } catch (e) {
      console.warn('Logo load failed:', e);
      logoBase64 = null;
    }
  }

  // Clean header layout: left logo, center title, right meta
  let yPosition = 18;
  if (logoBase64) {
    drawLogo(doc, logoBase64);
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 25, 47);
  doc.text(data.company, 60, 20); // company name near top center-left

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  // draw a thin banner line under header for style
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 36, 210, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('COMMERCIAL OFFER', 105, 58, { align: 'center' });

  // small meta lines
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Offer #: ${data.proposalNumber}`, 20, 78);
  doc.text(`Date: ${new Date(data.proposalDate).toLocaleDateString()}`, 150, 78);

  yPosition = 50;

  // Company and Client Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Company info (left)
  const companyInfo = [
    `From: ${data.company}`,
    `Phone: ${data.company.includes('ELECTRO-MECHANICAL') ? '+998 90 122 55 18' : ''}`,
    `Email: ${data.company.includes('ELECTRO-MECHANICAL') ? 'info@emctech.uz' : ''}`
  ];
  
  companyInfo.forEach((line, index) => {
    doc.text(line, 20, yPosition + (index * 5));
  });

  // Client info (right)
  const clientInfo = [
    `To: ${data.client}`,
    ...(data.clientEmail ? [`Email: ${data.clientEmail}`] : []),
    ...(data.clientPhone ? [`Phone: ${data.clientPhone}`] : [])
  ];

  clientInfo.forEach((line, index) => {
    doc.text(line, 120, yPosition + (index * 5));
  });

  yPosition += Math.max(companyInfo.length, clientInfo.length) * 5 + 10;

  // Products Table
  if (data.products && data.products.length > 0) {
    doc.setFillColor(...lightBlue);
    doc.rect(20, yPosition, 170, 8, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PRODUCTS & SERVICES', 20, yPosition + 6);
    yPosition += 15;

    const tableHeaders = [['Description', 'Qty', 'Unit Price', 'Total']];
    
    const tableData = data.products.map(product => [
      product.name || 'Unnamed Item',
      product.quantity?.toString() || '1',
      formatCurrency(product.unitPrice || product.price || 0),
      formatCurrency(product.lineTotal || (product.unitPrice || product.price || 0) * (product.quantity || 1))
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // Summary Section
  doc.setFillColor(...lightBlue);
  doc.rect(120, yPosition, 70, 40, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 125, yPosition + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryLines = [
    `Subtotal: ${formatCurrency(data.subtotal)}`,
    `Discount: -${formatCurrency(data.totalDiscount)}`,
    `Tax (${data.taxRate}%): ${formatCurrency(data.taxAmount)}`,
    `Total: ${formatCurrency(data.grandTotal)}`
  ];
  
  summaryLines.forEach((line, index) => {
    doc.text(line, 125, yPosition + 18 + (index * 6));
  });

  yPosition += 50;

  // Terms & Notes
  if (data.terms) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitTerms = doc.splitTextToSize(data.terms, 170);
    doc.text(splitTerms, 20, yPosition);
    yPosition += splitTerms.length * 4 + 10;
  }

  if (data.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, yPosition);
  }

  // Footer
  const footerY = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, footerY, { align: 'center' });

  const fileName = `${data.proposalNumber}-commercial-offer.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
  doc.save(fileName);
}

// Template 2: Technical RFQ (No Images)
export async function downloadTechnicalRFQPdf(proposalData) {
  const doc = new jsPDF();
  
  const proposal = proposalData.proposal || proposalData;
  const rfqItems = proposalData.rfqItems || proposalData.items || [];
  const formatCurrency = proposalData.formatCurrency || ((amount) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  );

  const data = {
    documentNumber: proposal.documentNumber || proposal.proposalNumber || `RFQ-${Date.now()}`,
    proposalDate: proposal.proposalDate || new Date().toISOString().split('T')[0],
    client: proposal.clientName || proposal.client || 'N/A',
    companyDetails: proposal.companyDetails || {
      name: proposal.company || 'LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»',
      address: 'Tashkent city, Yunusabad district, Bogishamol 21B',
      phone: '+998 90 122 55 18',
      email: 'info@emctech.uz',
      bankAccount: '2020 8000 0052 8367 7001',
      mfo: '00419',
      taxId: '307 738 207',
      oked: '43299'
    },
    deliveryTerms: proposal.deliveryTerms || {
      paymentTerms: '50% prepayment',
      deliveryTime: '6-12 weeks',
      incoterms: 'DDP'
    },
    authorizedSignatory: proposal.authorizedSignatory || {
      title: 'General manager',
      name: 'S.S. Abdushukurov'
    },
    items: rfqItems,
    subtotal: proposalData.subtotal || 0,
    taxAmount: proposalData.taxAmount || 0,
    grandTotal: proposalData.grandTotal || 0
  };

  let yPosition = 20;

  // Company Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyDetails.name, 20, yPosition);
  yPosition += 8;

  // Company Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const companyDetails = [
    data.companyDetails.address,
    `Phone: ${data.companyDetails.phone}`,
    `Email: ${data.companyDetails.email}`,
    `Bank Account: ${data.companyDetails.bankAccount}`,
    `MFO: ${data.companyDetails.mfo} | Tax ID: ${data.companyDetails.taxId} | OKED: ${data.companyDetails.oked}`
  ];

  companyDetails.forEach((line, index) => {
    doc.text(line, 20, yPosition + (index * 4));
  });
  
  yPosition += companyDetails.length * 4 + 15;

  // Document Number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`№${data.documentNumber}`, 20, yPosition);
  yPosition += 10;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMERCIAL OFFER', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Date and Recipient
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(data.proposalDate).toLocaleDateString('en-GB')}`, 20, yPosition);
  doc.text(`To: ${data.client}`, 20, yPosition + 5);
  yPosition += 15;

  // Technical Items Table
  if (data.items && data.items.length > 0) {
    const tableHeaders = [
      ['№', 'Technical Description', 'Unit', 'Qty', 'Unit Price', 'Total Amount']
    ];

    const tableData = data.items.map((item, index) => [
      (index + 1).toString(),
      item.description || 'Technical Item',
      item.unit || 'each',
      item.quantity?.toString() || '1',
      formatCurrency(item.unitPrice || 0),
      formatCurrency(item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1))
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [100, 100, 100],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // Summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 20, yPosition);
  yPosition += 8;

  const summaryData = [
    ['Subtotal:', formatCurrency(data.subtotal)],
    [`Tax:`, formatCurrency(data.taxAmount)],
    ['Grand Total:', formatCurrency(data.grandTotal)]
  ];

  autoTable(doc, {
    startY: yPosition,
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { fontStyle: 'bold', cellWidth: 30, halign: 'right' }
    }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Notes Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTES:', 20, yPosition);
  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const notes = [
    `1. Terms of payment: ${data.deliveryTerms.paymentTerms}`,
    `2. Estimated delivery time: ${data.deliveryTerms.deliveryTime}`,
    `3. Terms of delivery: ${data.deliveryTerms.incoterms}`
  ];

  notes.forEach((note, index) => {
    doc.text(note, 20, yPosition + (index * 5));
  });

  yPosition += notes.length * 5 + 20;

  // Signature
  doc.setFont('helvetica', 'normal');
  doc.text(data.authorizedSignatory.title, 20, yPosition);
  doc.line(20, yPosition + 2, 70, yPosition + 2);
  doc.text(data.authorizedSignatory.name, 20, yPosition + 8);

  // Footer
  const footerY = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, footerY, { align: 'center' });

  const fileName = `${data.documentNumber}-technical-rfq.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
  doc.save(fileName);
}

// Template 3: Commercial Offer with Product Images
export async function downloadCommercialWithImagesPdf(proposalData) {
  const doc = new jsPDF();
  
  const proposal = proposalData.proposal || proposalData;
  const products = proposalData.products || proposalData.selectedProducts || [];
  const formatCurrency = proposalData.formatCurrency || ((amount) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  );

  console.log('Loading product images...', products.length);
  
  // Load product images with progress tracking
  const productsWithImages = [];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`Loading image ${i + 1}/${products.length}:`, product.imageUrl);
    
    const imageBase64 = await loadImage(product.imageUrl);
    productsWithImages.push({ 
      ...product, 
      imageBase64,
      imageLoaded: !!imageBase64 
    });
    
    if (imageBase64) {
      console.log(`✓ Image ${i + 1} loaded successfully`);
    } else {
      console.log(`✗ Image ${i + 1} failed to load`);
    }
  }

  console.log('Image loading completed. Success:', productsWithImages.filter(p => p.imageLoaded).length);

  const data = {
    proposalNumber: proposal.proposalNumber || `PROP-${Date.now()}`,
    proposalTitle: proposal.proposalTitle || 'Commercial Offer with Images',
    client: proposal.clientName || proposal.client || 'N/A',
    company: proposal.company || 'Your Company',
    proposalDate: proposal.proposalDate || new Date().toISOString().split('T')[0],
    subtotal: proposalData.subtotal || 0,
    taxAmount: proposalData.taxAmount || 0,
    grandTotal: proposalData.grandTotal || 0,
    products: productsWithImages
  };

  // Try to load company logo (non-blocking if fails)
  const logoUrl = proposal.companyDetails?.logoUrl || proposal.logo || proposal.companyLogo || proposal.companyDetails?.logo;
  let logoBase64 = null;
  if (logoUrl) {
    try {
      logoBase64 = await loadImage(logoUrl, 400); // smaller max dim for logo
    } catch (e) {
      console.warn('Logo load failed:', e);
      logoBase64 = null;
    }
  }

  // Clean header layout: left logo, center title, right meta
  let yPosition = 18;
  if (logoBase64) {
    drawLogo(doc, logoBase64);
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text(data.company, 105, yPosition, { align: 'center' });
  yPosition += 8;

  doc.setFontSize(14);
  doc.text('COMMERCIAL OFFER WITH PRODUCT IMAGES', 105, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Offer #: ${data.proposalNumber}`, 20, yPosition);
  doc.text(`Date: ${new Date(data.proposalDate).toLocaleDateString()}`, 150, yPosition);
  doc.text(`Client: ${data.client}`, 20, yPosition + 5);
  yPosition += 15;

  // Products with Images
  if (data.products && data.products.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT CATALOG', 20, yPosition);
    yPosition += 10;

    for (let i = 0; i < data.products.length; i++) {
      const product = data.products[i];
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Product Image (left side) - Fixed size and better positioning
      if (product.imageBase64) {
        try {
          // Add image with fixed size and border
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(20, yPosition, 35, 35);
          doc.addImage(product.imageBase64, 'JPEG', 21, yPosition + 1, 33, 33);
        } catch (error) {
          console.warn('Failed to add product image to PDF:', error);
          // Draw placeholder if image fails
          doc.setFillColor(240, 240, 240);
          doc.rect(20, yPosition, 35, 35, 'F');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('No Image', 27, yPosition + 18);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        // Draw placeholder for missing image
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition, 35, 35, 'F');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('No Image', 27, yPosition + 18);
        doc.setTextColor(0, 0, 0);
      }

      // Product Details (right side)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const productName = product.name || 'Unnamed Product';
      const nameLines = doc.splitTextToSize(productName, 100);
      doc.text(nameLines, 60, yPosition + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const details = [
        `Category: ${product.category || 'N/A'}`,
        `Quantity: ${product.quantity || 1}`,
        `Unit Price: ${formatCurrency(product.unitPrice || product.price || 0)}`,
        `Total: ${formatCurrency(product.lineTotal || (product.unitPrice || product.price || 0) * (product.quantity || 1))}`
      ];

      let detailY = yPosition + 15;
      details.forEach((line, index) => {
        doc.text(line, 60, detailY + (index * 4));
      });

      // Product Description
      if (product.description) {
        const descLines = doc.splitTextToSize(product.description, 100);
        doc.text(descLines, 60, detailY + 20);
        yPosition += Math.max(descLines.length * 4, 50);
      } else {
        yPosition += 50;
      }

      // Separator line
      if (i < data.products.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 10;
      }
    }

    yPosition += 10;
  }

  // Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER SUMMARY', 20, yPosition);
  yPosition += 8;

  const summaryLines = [
    `Subtotal: ${formatCurrency(data.subtotal)}`,
    `Tax: ${formatCurrency(data.taxAmount)}`,
    `Grand Total: ${formatCurrency(data.grandTotal)}`
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  summaryLines.forEach((line, index) => {
    doc.text(line, 150, yPosition + (index * 6));
  });

  // Footer
  const footerY = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, footerY, { align: 'center' });

  const fileName = `${data.proposalNumber}-commercial-with-images.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
  doc.save(fileName);
}

// Template 4: Technical Offer with Images
export async function downloadTechnicalWithImagesPdf(proposalData) {
  const doc = new jsPDF();
  
  const proposal = proposalData.proposal || proposalData;
  const rfqItems = proposalData.rfqItems || proposalData.items || [];
  const formatCurrency = proposalData.formatCurrency || ((amount) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  );

  console.log('Loading technical item images...', rfqItems.length);
  
  // Load item images
  const itemsWithImages = [];
  for (let i = 0; i < rfqItems.length; i++) {
    const item = rfqItems[i];
    console.log(`Loading technical image ${i + 1}/${rfqItems.length}:`, item.imageUrl);
    
    const imageBase64 = await loadImage(item.imageUrl);
    itemsWithImages.push({ 
      ...item, 
      imageBase64,
      imageLoaded: !!imageBase64 
    });
    
    if (imageBase64) {
      console.log(`✓ Technical image ${i + 1} loaded successfully`);
    } else {
      console.log(`✗ Technical image ${i + 1} failed to load`);
    }
  }

  const data = {
    documentNumber: proposal.documentNumber || proposal.proposalNumber || `TECH-${Date.now()}`,
    proposalDate: proposal.proposalDate || new Date().toISOString().split('T')[0],
    client: proposal.clientName || proposal.client || 'N/A',
    companyDetails: proposal.companyDetails || {
      name: proposal.company || 'LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»'
    },
    items: itemsWithImages,
    subtotal: proposalData.subtotal || 0,
    grandTotal: proposalData.grandTotal || 0
  };

  // Try to load company logo (non-blocking if fails)
  const logoUrl = proposal.companyDetails?.logoUrl || proposal.logo || proposal.companyLogo || proposal.companyDetails?.logo;
  let logoBase64 = null;
  if (logoUrl) {
    try {
      logoBase64 = await loadImage(logoUrl, 400); // smaller max dim for logo
    } catch (e) {
      console.warn('Logo load failed:', e);
      logoBase64 = null;
    }
  }

  // Clean header layout: left logo, center title, right meta
  let yPosition = 18;
  if (logoBase64) {
    drawLogo(doc, logoBase64);
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text(data.companyDetails.name, 105, yPosition, { align: 'center' });
  yPosition += 8;

  doc.setFontSize(14);
  doc.text('TECHNICAL OFFER WITH IMAGES', 105, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Document #: ${data.documentNumber}`, 20, yPosition);
  doc.text(`Date: ${new Date(data.proposalDate).toLocaleDateString()}`, 150, yPosition);
  doc.text(`Client: ${data.client}`, 20, yPosition + 5);
  yPosition += 15;

  // Technical Items with Images
  if (data.items && data.items.length > 0) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      // Item Header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Item ${i + 1}: ${item.description || 'Technical Item'}`, 20, yPosition);
      yPosition += 7;

      // Create a table with image cell
      const tableHeaders = [['Specification', 'Details']];
      const tableData = [
        ['Part Number', item.partNumber || 'N/A'],
        ['Manufacturer', item.manufacturer || 'N/A'],
        ['Unit', item.unit || 'each'],
        ['Quantity', item.quantity?.toString() || '1'],
        ['Unit Price', formatCurrency(item.unitPrice || 0)],
        ['Total', formatCurrency(item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1))],
        ['Image', item.imageBase64 ? 'IMAGE_PLACEHOLDER' : 'No Image Available']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [70, 130, 180],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 60 }
        },
        didParseCell: function(data) {
          // Mark image cells for special handling
          if (data.row.index === 6 && data.column.index === 1) {
            data.cell.styles.cellWidth = 60;
            data.cell.styles.minCellHeight = 40;
          }
        },
        didDrawCell: function(data) {
          // Handle image cells
          if (data.row.index === 6 && data.column.index === 1 && item.imageBase64) {
            try {
              // Add image to the cell with border
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.5);
              doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2);
              doc.addImage(
                item.imageBase64,
                'JPEG',
                data.cell.x + 2,
                data.cell.y + 2,
                data.cell.width - 4,
                data.cell.height - 4
              );
            } catch (error) {
              console.warn('Failed to add technical item image in table:', error);
              // Draw placeholder
              doc.setFillColor(240, 240, 240);
              doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
              doc.setFontSize(8);
              doc.setTextColor(150, 150, 150);
              doc.text('Image Error', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center' });
            }
          } else if (data.row.index === 6 && data.column.index === 1) {
            // Draw placeholder for missing image
            doc.setFillColor(240, 240, 240);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('No Image', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center' });
          }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Technical Specifications
      if (item.specifications && item.specifications.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Technical Specifications:', 20, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        item.specifications.forEach((spec, index) => {
          if (spec.trim()) {
            const specLines = doc.splitTextToSize(`${index + 1}. ${spec}`, 170);
            doc.text(specLines, 20, yPosition);
            yPosition += specLines.length * 4 + 2;
          }
        });
      }

      // Separator
      if (i < data.items.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 15;
      }
    }
  }

  // Total Summary
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TECHNICAL OFFER SUMMARY', 20, yPosition);
  yPosition += 8;

  const summaryData = [
    ['Total Items:', data.items.length.toString()],
    ['Subtotal:', formatCurrency(data.subtotal)],
    ['Grand Total:', formatCurrency(data.grandTotal)]
  ];

  autoTable(doc, {
    startY: yPosition,
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { fontStyle: 'bold', cellWidth: 40, halign: 'right' }
    }
  });

  // Footer
  const footerY = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, footerY, { align: 'center' });

  const fileName = `${data.documentNumber}-technical-with-images.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
  doc.save(fileName);
}

// Main dispatcher function
export async function downloadProposalPdf(proposalData) {
  const templateType = proposalData.templateType || proposalData.proposal?.templateType || 'simple-commercial';
  
  console.log('Generating PDF with template:', templateType);
  
  try {
    switch (templateType) {
      case 'technical-rfq':
        return await downloadTechnicalRFQPdf(proposalData);
      
      case 'commercial-with-images':
        return await downloadCommercialWithImagesPdf(proposalData);
      
      case 'technical-with-images':
        return await downloadTechnicalWithImagesPdf(proposalData);
      
      case 'simple-commercial':
      default:
        return await downloadSimpleCommercialPdf(proposalData);
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

// Enhanced version with image support
export async function downloadProposalPdfWithImages(proposalData) {
  return await downloadProposalPdf(proposalData);
}

// Utility function to check if image URLs are accessible
export const testImageUrls = async (urls) => {
  const results = [];
  for (const url of urls) {
    if (!url) {
      results.push({ url, accessible: false, error: 'No URL provided' });
      continue;
    }
    
    try {
      const base64 = await loadImage(url);
      results.push({ 
        url, 
        accessible: !!base64,
        error: base64 ? null : 'Failed to load image'
      });
    } catch (error) {
      results.push({ url, accessible: false, error: error.message });
    }
  }
  return results;
}