import jsPDF from "jspdf";

// Load image helper (optimized for PDF)
const loadImage = async (url, maxDim = 150) => {
  if (!url) return null;
  try {
    if (typeof url === 'string' && url.startsWith('data:image')) return url;
    
    let response = null;
    try {
      response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (fetchErr) {
      return await loadImageViaImage(url, maxDim);
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const base64 = await loadImageViaImage(objectUrl, maxDim);
      return base64;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (err) {
    console.warn('loadImage failed for', url, err);
    try {
      return await loadImageViaImage(url, maxDim);
    } catch (err2) {
      console.warn('final fallback failed for', url, err2);
      return null;
    }
  }
};

const loadImageViaImage = (src, maxDim = 150) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    const timeout = setTimeout(() => {
      console.warn('Image load timeout for', src);
      resolve(null);
    }, 15000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const w = Math.max(1, Math.floor((img.naturalWidth || img.width) * ratio));
        const h = Math.max(1, Math.floor((img.naturalHeight || img.height) * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        
        // Fill with white background first
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        
        // Draw the image
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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

// Main PDF Generator - EMC Design (FIXED spacing and totals)
export async function downloadEMCProposalPdf(proposalData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const proposal = proposalData.proposal || proposalData;
  const products = proposalData.products || proposalData.selectedProducts || [];
  
  // Extract data with proper defaults
  const data = {
    proposalNumber: proposal.proposalNumber || proposal.number || 'NoEMC28/0214',
    date: proposal.proposalDate || proposal.date || '15.10.2025',
    company: proposal.company || 'LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»',
    companyShort: proposal.companyShort || 'EMC',
    address: proposal.address || 'Tashkent city, Yunusabad district, Bogishamot 21B',
    phone: proposal.phone || '+998 90 122 55 18',
    bankAccount: proposal.bankAccount || '2020 8000 0052 8367 7001',
    mfo: proposal.mfo || '08419',
    taxId: proposal.taxId || '307 738 207',
    oked: proposal.oked || '43299',
    email: proposal.email || 'info@emctech.uz',
    recipient: proposal.recipient || 'To Directiory of ENERSOK FE LCC',
    paymentTerms: proposal.paymentTerms || '50 % prepayment',
    deliveryTime: proposal.deliveryTime || '6-12 weeks',
    deliveryTerms: proposal.deliveryTerms || 'DDP',
    signatory: proposal.signatory || 'S.S. Abdushakarov',
    products: products
  };

  // Preload all product images FIRST
  console.log('Loading product images...');
  const productsWithImages = await Promise.all(
    products.map(async (product) => {
      let imageData = null;
      if (product.image || product.imageUrl) {
        console.log('Loading image for:', product.name);
        imageData = await loadImage(product.image || product.imageUrl, 120);
      }
      return { 
        ...product, 
        imageData,
        number: product.number || product.id || '1',
        name: product.name || 'Product Name',
        description: product.description || 'Product description will be provided.',
        unit: product.unit || 'SET',
        quantity: product.quantity || 1,
        unitPrice: product.unitPrice || product.price || 0
      };
    })
  );

  console.log('All images loaded, generating PDF...');

  // Calculate totals
  const subtotal = productsWithImages.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
  const taxAmount = subtotal * 0.12;
  const grandTotal = subtotal + taxAmount;

  let yPos = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== HEADER SECTION =====
  // Logo Box (Left) - EMC TECHNOLOGY
  doc.setDrawColor(0, 26, 77);
  doc.setLineWidth(0.8);
  doc.rect(margin, yPos, 25, 18);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 26, 77);
  doc.text(data.companyShort, margin + 12.5, yPos + 7, { align: 'center' });
  
  doc.setTextColor(211, 47, 47);
  doc.setFontSize(7);
  doc.text('TECHNOLOGY', margin + 12.5, yPos + 13, { align: 'center' });

  // Ref number below logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.proposalNumber, margin, yPos + 20);
  doc.text(data.date, margin, yPos + 24);

  // Company Title (Center)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(211, 47, 47);
  const titleX = pageWidth / 2;
  doc.text(data.company, titleX, yPos + 8, { align: 'center' });

  // Company Info (Center)
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const infoLine1 = `${data.address}; Phone: ${data.phone}`;
  const infoLine2 = `Bank account: ${data.bankAccount}  MFO: ${data.mfo} ID: ${data.taxId} OK ED: ${data.oked} E-mail: ${data.email}`;
  
  doc.text(infoLine1, titleX, yPos + 14, { align: 'center' });
  doc.text(infoLine2, titleX, yPos + 18, { align: 'center' });

  // Recipient (Right)
  doc.setFontSize(7);
  doc.text(data.recipient, pageWidth - margin, yPos + 8, { align: 'right' });

  yPos += 40;

  // ===== TITLE =====
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('COMMERCIAL OFFER', titleX, yPos, { align: 'center' });
  yPos += 12;

  // ===== INTRO TEXT =====
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const introText = `We would like to inform you that "${data.company}" LLC will be sending you a commercial offer for the supply of the items listed below!`;
  const introLines = doc.splitTextToSize(introText, pageWidth - (margin * 2));
  doc.text(introLines, margin, yPos);
  yPos += introLines.length * 4 + 10;

  // ===== TABLE =====
  // Adjusted column widths for better spacing
  const colWidths = [10, 35, 55, 35, 12, 15, 20, 18];
  const headers = [
    'No', 
    'Requested Material description', 
    'Technical description Will be supplied', 
    'Will be supplied PHOTO', 
    'Unit', 
    'Quantity', 
    'Unit price(USD)', 
    'Total amount with (USD)'
  ];

  // Table header
  doc.setFillColor(232, 232, 232);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  let xPos = margin;
  headers.forEach((header, idx) => {
    doc.text(header, xPos + (colWidths[idx] / 2), yPos + 5, { align: 'center' });
    xPos += colWidths[idx];
  });

  yPos += 8;

  // Category row - spans all columns
  doc.setFillColor(232, 232, 232);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('1. TESTING AND MEASURING', margin + 2, yPos + 4);
  yPos += 6;

  // Product rows
  for (const product of productsWithImages) {
    // Check page overflow - add new page if needed
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 15;
    }

    const rowHeight = 35;
    
    // Draw row borders
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    xPos = margin;
    colWidths.forEach((width) => {
      doc.rect(xPos, yPos, width, rowHeight);
      xPos += width;
    });

    // Populate cells
    xPos = margin;
    
    // No
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(product.number.toString(), xPos + colWidths[0] / 2, yPos + 5, { align: 'center' });
    xPos += colWidths[0];

    // Material/Name
    doc.text(product.name, xPos + 2, yPos + 5);
    xPos += colWidths[1];

    // Description - with proper line spacing
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const descLines = doc.splitTextToSize(product.description, colWidths[2] - 4);
    // Limit to 8 lines to prevent overflow
    const maxDescLines = Math.min(descLines.length, 8);
    for (let i = 0; i < maxDescLines; i++) {
      doc.text(descLines[i], xPos + 2, yPos + 5 + (i * 3));
    }
    xPos += colWidths[2];

    // Photo cell - with actual image if available
    const photoX = xPos;
    const photoY = yPos;
    const photoWidth = colWidths[3] - 4;
    const photoHeight = rowHeight - 4;

    if (product.imageData) {
      try {
        // Add image to PDF with white background
        doc.setFillColor(255, 255, 255);
        doc.rect(photoX + 2, photoY + 2, photoWidth, photoHeight, 'F');
        doc.addImage(product.imageData, 'JPEG', photoX + 2, photoY + 2, photoWidth, photoHeight);
      } catch (error) {
        console.error('Failed to add image to PDF:', error);
        // Fallback to placeholder
        doc.setFillColor(211, 211, 211);
        doc.rect(photoX + 2, photoY + 2, photoWidth, photoHeight, 'F');
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text('Image Error', photoX + colWidths[3] / 2, photoY + rowHeight / 2, { align: 'center' });
      }
    } else {
      // Photo placeholder
      doc.setFillColor(211, 211, 211);
      doc.rect(photoX + 2, photoY + 2, photoWidth, photoHeight, 'F');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      const placeholderText = product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name;
      doc.text(placeholderText, photoX + colWidths[3] / 2, photoY + rowHeight / 2, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);
    xPos += colWidths[3];

    // Unit
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(product.unit, xPos + colWidths[4] / 2, yPos + 17, { align: 'center' });
    xPos += colWidths[4];

    // Quantity
    doc.text(product.quantity.toString(), xPos + colWidths[5] / 2, yPos + 17, { align: 'center' });
    xPos += colWidths[5];

    // Unit Price
    doc.text(product.unitPrice.toFixed(2), xPos + colWidths[6] - 2, yPos + 17, { align: 'right' });
    xPos += colWidths[6];

    // Total
    const lineTotal = product.unitPrice * product.quantity;
    doc.text(lineTotal.toFixed(2), xPos + colWidths[7] - 2, yPos + 17, { align: 'right' });

    yPos += rowHeight;
  }

  // Add space after products
  yPos += 8;

  // ===== TOTALS SECTION =====
  // Calculate the starting position for totals (should span first 6 columns)
  const totalLabelStart = margin;
  const totalLabelWidth = colWidths.slice(0, 6).reduce((sum, width) => sum + width, 0);
  const totalValueStart = totalLabelStart + totalLabelWidth;
  const totalValueWidth = colWidths.slice(6).reduce((sum, width) => sum + width, 0);

  // Total USD
  doc.setFillColor(245, 245, 245);
  doc.rect(totalLabelStart, yPos, totalLabelWidth, 6, 'F');
  doc.rect(totalValueStart, yPos, totalValueWidth, 6, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Total USD:', totalLabelStart + totalLabelWidth - 5, yPos + 4, { align: 'right' });
  doc.text(subtotal.toFixed(2), totalValueStart + totalValueWidth - 2, yPos + 4, { align: 'right' });
  yPos += 6;

  // VAT 12%
  doc.setFillColor(245, 245, 245);
  doc.rect(totalLabelStart, yPos, totalLabelWidth, 6, 'F');
  doc.rect(totalValueStart, yPos, totalValueWidth, 6, 'F');
  
  doc.text('VAT 12%:', totalLabelStart + totalLabelWidth - 5, yPos + 4, { align: 'right' });
  doc.text(taxAmount.toFixed(2), totalValueStart + totalValueWidth - 2, yPos + 4, { align: 'right' });
  yPos += 6;

  // Grand Total
  doc.setFillColor(204, 229, 255);
  doc.rect(totalLabelStart, yPos, totalLabelWidth, 6, 'F');
  doc.rect(totalValueStart, yPos, totalValueWidth, 6, 'F');
  
  doc.text('Total including VAT 12% in USD:', totalLabelStart + totalLabelWidth - 5, yPos + 4, { align: 'right' });
  doc.text(grandTotal.toFixed(2), totalValueStart + totalValueWidth - 2, yPos + 4, { align: 'right' });
  yPos += 12;

  // ===== NOTES SECTION =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NOTES:', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const notes = [
    `1. Terms of payment: ${data.paymentTerms}`,
    `2. Estimated delivery time: ${data.deliveryTime}`,
    `3. Terms of delivery: ${data.deliveryTerms}`
  ];
  
  notes.forEach(note => {
    // Check if we need a new page for notes
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 15;
    }
    doc.text(note, margin + 5, yPos);
    yPos += 4.5;
  });

  yPos += 8;

  // ===== SIGNATURE SECTION =====
  // Ensure signature section starts at a reasonable position
  if (yPos < pageHeight - 40) {
    yPos = pageHeight - 40;
  }
  
  // Left - General manager
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('General manager', margin, yPos);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos + 3, margin + 35, yPos + 3);

  // Center - Stamp
  doc.setDrawColor(25, 118, 210);
  doc.setLineWidth(0.8);
  const stampX = pageWidth / 2;
  doc.circle(stampX, yPos + 12, 10);
  doc.setFontSize(8);
  doc.setTextColor(25, 118, 210);
  doc.text('Stamp', stampX, yPos + 12, { align: 'center' });

  // Right - Name
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.signatory, pageWidth - margin, yPos, { align: 'right' });

  yPos += 25;

  // ===== LOGOS SECTION =====
  // Draw separator line
  doc.setDrawColor(204, 204, 204);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  const logoNames = [
    { name: 'INOVA', color: '#000000' },
    { name: 'WATERMAN', color: '#000000' },
    { name: 'SWAN', color: '#000000' },
    { name: 'PASS', color: '#000000' },
    { name: 'Honeywell', color: '#d32f2f' },
    { name: 'RO ST', color: '#000000' }
  ];
  
  const logoSpacing = (pageWidth - (margin * 2)) / 6;
  let logoX = margin + logoSpacing / 2;
  
  logoNames.forEach((logo) => {
    // Draw logo placeholder
    doc.setFillColor(240, 240, 240);
    doc.rect(logoX - 10, yPos, 20, 8, 'F');
    doc.setDrawColor(204, 204, 204);
    doc.setLineWidth(0.3);
    doc.rect(logoX - 10, yPos, 20, 8);
    
    // Logo text
    if (logo.color === '#d32f2f') {
      doc.setTextColor(211, 47, 47);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    
    doc.setFontSize(6);
    doc.text(logo.name, logoX, yPos + 12, { align: 'center' });
    
    logoX += logoSpacing;
  });

  // ===== Save PDF =====
  const fileName = `${data.proposalNumber}-proposal.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
  doc.save(fileName);
}

// Main dispatcher (backward compatible)
export async function downloadProposalPdf(proposalData) {
  const templateType = proposalData.templateType || proposalData.proposal?.templateType || 'emc-design';
  
  console.log('Generating PDF with template:', templateType);
  
  try {
    return await downloadEMCProposalPdf(proposalData);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

export async function downloadProposalPdfWithImages(proposalData) {
  return await downloadProposalPdf(proposalData);
}