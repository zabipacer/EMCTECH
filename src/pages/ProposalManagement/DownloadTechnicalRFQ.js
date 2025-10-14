// src/components/DownloadTechnicalRFQ.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function downloadTechnicalRFQPdf(proposal) {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Set default margins
  const margin = 20;
  let currentY = margin;
  
  // Colors for styling
  const primaryColor = [0, 51, 102]; // Dark blue
  const lightGray = [232, 232, 232];
  const veryLightGray = [249, 249, 249];
  const borderGray = [128, 128, 128];
  
  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Set default data for Technical RFQ
  const data = {
    proposalId: proposal.id || proposal.proposalId || `RFQ-${Date.now()}`,
    templateType: proposal.templateType || 'technical-rfq',
    documentNumber: proposal.documentNumber || proposal.proposalNumber || '1/1',
    date: proposal.date || proposal.proposalDate || new Date().toISOString().split('T')[0],
    client: proposal.client || 'Client Name',
    
    companyDetails: {
      name: proposal.companyDetails?.name || proposal.company || 'LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»',
      address: proposal.companyDetails?.address || 'Tashkent city, Mirzo Ulugbek district, Karasu 3-53',
      phone: proposal.companyDetails?.phone || '+998 90 122 55 16',
      email: proposal.companyDetails?.email || 'info@electricalart.uz, info@emc-tech-uz.com',
      bankAccount: proposal.companyDetails?.bankAccount || '2020 8000 0052 8367 7001',
      mfo: proposal.companyDetails?.mfo || '00419',
      taxId: proposal.companyDetails?.taxId || '307 738 207',
      oked: proposal.companyDetails?.oked || '43299'
    },
    
    items: proposal.items || proposal.products || [],
    
    deliveryTerms: {
      paymentTerms: proposal.deliveryTerms?.paymentTerms || proposal.paymentTerms || '50% prepayment',
      deliveryTime: proposal.deliveryTerms?.deliveryTime || proposal.deliveryTime || '6-8 weeks',
      incoterms: proposal.deliveryTerms?.incoterms || proposal.incoterms || 'DDP'
    },
    
    authorizedSignatory: {
      title: proposal.authorizedSignatory?.title || 'General manager',
      name: proposal.authorizedSignatory?.name || 'S.S. Abdushukurov'
    }
  };

  // ========== HEADER SECTION ==========
  
  // Company Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(data.companyDetails.name, margin, currentY);
  currentY += 8;

  // Company Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const companyInfo = [
    data.companyDetails.address,
    `Phone: ${data.companyDetails.phone}`,
    `Email: ${data.companyDetails.email}`,
    `Bank Account: ${data.companyDetails.bankAccount}`,
    `MFO: ${data.companyDetails.mfo}`,
    `Tax ID: ${data.companyDetails.taxId}`,
    `OKED: ${data.companyDetails.oked}`
  ];

  companyInfo.forEach((line, index) => {
    doc.text(line, margin, currentY + (index * 4));
  });
  
  currentY += companyInfo.length * 4 + 10;

  // Document Reference Number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`№${data.documentNumber}`, margin, currentY);
  currentY += 10;

  // Document Title
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('COMMERCIAL OFFER', 105, currentY, { align: 'center' });
  currentY += 15;

  // Date and Recipient
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Date: ${formatDisplayDate(data.date)}`, margin, currentY);
  doc.text(`To: ${data.client}`, margin, currentY + 5);
  currentY += 15;

  // ========== TECHNICAL ITEMS TABLE ==========
  
  if (data.items && data.items.length > 0) {
    // Table headers
    const headers = [
      '№',
      'Technical Description of Requested Item',
      'Material PO Text',
      'Unit',
      'Quantity Requested',
      'Technical Description',
      'Will be Supplied',
      'Will be Supplied',
      'PHOTO'
    ];

    // Prepare table data
    const tableData = data.items.map((item, index) => {
      // Transform product data to RFQ format
      const description = item.description || item.name || '';
      const technicalDescription = item.technicalDescription || item.description || '';
      const manufacturer = item.manufacturer || '';
      const partNumber = item.partNumber || '';
      const unit = item.unit || 'each';
      const quantity = item.quantity || 1;
      const willBeSupplied = item.willBeSupplied || description;
      
      const specificationsText = item.specifications 
        ? item.specifications.map((spec, idx) => `${idx + 1}. ${spec}`).join('\n')
        : (item.specs ? item.specs.map((spec, idx) => `${idx + 1}. ${spec}`).join('\n') : '');

      return [
        (index + 1).toString(),
        description.toUpperCase(),
        `${technicalDescription}${manufacturer ? `; OEM/MAKE: ${manufacturer}` : ''}`,
        unit,
        quantity.toString(),
        willBeSupplied,
        specificationsText,
        willBeSupplied, // Second column, can be different data if needed
        '' // Photo placeholder
      ];
    });

    // Create the table
    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: lightGray,
        textColor: 0,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        lineColor: borderGray,
        lineWidth: 0.1
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 0,
        lineColor: borderGray,
        lineWidth: 0.1,
        valign: 'top'
      },
      styles: {
        cellPadding: 3,
        lineColor: borderGray,
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: veryLightGray
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' }, // №
        1: { cellWidth: 30, fontStyle: 'bold' }, // Technical Description
        2: { cellWidth: 50 }, // Material PO Text
        3: { cellWidth: 12, halign: 'center' }, // Unit
        4: { cellWidth: 15, halign: 'center' }, // Quantity
        5: { cellWidth: 45 }, // Technical Description
        6: { cellWidth: 40, fontSize: 8 }, // Will be Supplied (specs)
        7: { cellWidth: 40 }, // Will be Supplied (alternative)
        8: { cellWidth: 35, halign: 'center' } // PHOTO
      },
      didParseCell: function(data) {
        // Add borders to all cells
        data.cell.styles.lineColor = borderGray;
        data.cell.styles.lineWidth = 0.1;
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // ========== NOTES AND TERMS SECTION ==========
  
  // Notes Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTES:', margin, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  const notes = [
    `1. Terms of payment: ${data.deliveryTerms.paymentTerms}`,
    `2. Estimated delivery time: ${data.deliveryTerms.deliveryTime}`,
    `3. Terms of delivery: ${data.deliveryTerms.incoterms}`
  ];

  notes.forEach((note, index) => {
    doc.text(note, margin, currentY + (index * 7));
  });

  currentY += notes.length * 7 + 20;

  // Signature Block
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.authorizedSignatory.title}`, margin, currentY);
  
  // Signature line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY + 2, margin + 50, currentY + 2);
  
  doc.text(data.authorizedSignatory.name, margin, currentY + 8);

  // ========== DOCUMENT FOOTER ==========
  
  const footerY = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  const generatedDate = new Date();
  const formattedTime = generatedDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const formattedDate = generatedDate.toLocaleDateString('en-GB');
  
  doc.text(
    `Generated on ${formattedDate} at ${formattedTime}`,
    105,
    footerY,
    { align: 'center' }
  );
  
  doc.text(
    `Document ID: ${data.proposalId}`,
    105,
    footerY + 4,
    { align: 'center' }
  );

  // ========== SAVE PDF ==========
  
  const fileName = `RFQ-${data.documentNumber.replace(/[\/\\]/g, '-')}.pdf`;
  doc.save(fileName);
  
  return doc;
}