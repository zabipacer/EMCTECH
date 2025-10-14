import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadTechnicalRFQPdf } from "./DownloadTechnicalRFQ";

export async function downloadProposalPdf(proposal) {
   if (proposal.templateType === 'technical-rfq') {
    return await downloadTechnicalRFQPdf(proposal);
  }


  const doc = new jsPDF();
  
  // Set default values for missing fields
  const proposalData = {
    proposalNumber: proposal.proposalNumber || `PROP-${Date.now()}`,
    proposalTitle: proposal.proposalTitle || 'Proposal',
    client: proposal.client || 'N/A',
    company: proposal.company || 'N/A',
    clientEmail: proposal.clientEmail || proposal.email || '',
    clientPhone: proposal.clientPhone || proposal.phone || '',
    proposalDate: proposal.proposalDate || proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    validUntil: proposal.validUntil || '',
    terms: proposal.terms || '',
    notes: proposal.notes || '',
    status: proposal.status || 'draft',
    subtotal: proposal.subtotal || 0,
    totalDiscount: proposal.totalDiscount || 0,
    taxAmount: proposal.taxAmount || 0,
    taxRate: proposal.taxRate || 0,
    grandTotal: proposal.grandTotal || proposal.total || 0,
    products: proposal.products || []
  };


  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 152, 219]; // Light Blue
  const accentColor = [231, 76, 60]; // Red

  let yPosition = 20;

  // Header Section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proposal #: ${proposalData.proposalNumber}`, 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(proposalData.proposalDate)}`, 105, 32, { align: 'center' });

  yPosition = 50;

  // Proposal Title
  if (proposalData.proposalTitle) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(proposalData.proposalTitle, 20, yPosition);
    yPosition += 10;
  }

  // Client and Company Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const clientInfo = [
    `Client: ${proposalData.client}`,
    `Company: ${proposalData.company}`,
    ...(proposalData.clientEmail ? [`Email: ${proposalData.clientEmail}`] : []),
    ...(proposalData.clientPhone ? [`Phone: ${proposalData.clientPhone}`] : [])
  ];

  clientInfo.forEach((line, index) => {
    doc.text(line, 20, yPosition + (index * 5));
  });

  // Proposal Details (right side)
  const proposalDetails = [
    `Status: ${proposalData.status.toUpperCase()}`,
    ...(proposalData.validUntil ? [`Valid Until: ${formatDate(proposalData.validUntil)}`] : [])
  ];

  proposalDetails.forEach((line, index) => {
    doc.text(line, 150, yPosition + (index * 5));
  });

  yPosition += Math.max(clientInfo.length, proposalDetails.length) * 5 + 10;

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 15;

  // Products/Services Table
  if (proposalData.products && proposalData.products.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPOSAL ITEMS', 20, yPosition);
    yPosition += 10;

    const tableHeaders = [
      ['Description', 'Quantity', 'Unit Price', 'Discount %', 'Tax', 'Line Total']
    ];

    const tableData = proposalData.products.map(product => [
      product.name || 'Unnamed Item',
      product.quantity?.toString() || '1',
      formatCurrency(product.unitPrice || product.price || 0),
      (product.discount || 0) + '%',
      product.taxable ? 'Yes' : 'No',
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
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 60 }, // Description
        1: { cellWidth: 20 }, // Quantity
        2: { cellWidth: 25 }, // Unit Price
        3: { cellWidth: 20 }, // Discount %
        4: { cellWidth: 15 }, // Tax
        5: { cellWidth: 25 }  // Line Total
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Summary Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 20, yPosition);
  yPosition += 15;

  const summaryData = [
    ['Subtotal:', formatCurrency(proposalData.subtotal)],
    ['Discount:', `-${formatCurrency(proposalData.totalDiscount)}`],
    [`Tax (${proposalData.taxRate}%):`, formatCurrency(proposalData.taxAmount)],
    ['Grand Total:', formatCurrency(proposalData.grandTotal)]
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
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.row.index === summaryData.length - 1) {
        doc.setDrawColor(0, 0, 0);
        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Notes Section
  if (proposalData.notes) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(proposalData.notes, 170);
    doc.text(splitNotes, 20, yPosition);
    yPosition += splitNotes.length * 5 + 10;
  }

  // Terms Section
  if (proposalData.terms) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitTerms = doc.splitTextToSize(proposalData.terms, 170);
    doc.text(splitTerms, 20, yPosition);
    yPosition += splitTerms.length * 5 + 10;
  }

  // Footer
  const footerY = 280;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, 190, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 5, { align: 'center' });
  doc.text(`Proposal ID: ${proposalData.proposalNumber} | Status: ${proposalData.status}`, 105, footerY + 10, { align: 'center' });

  // Save the PDF
  const fileName = `${proposalData.proposalNumber}-proposal.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
  doc.save(fileName);
}