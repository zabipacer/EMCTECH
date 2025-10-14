import React from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const PreviewModal = ({ proposal, onClose }) => {
  if (!proposal) return null;

  const handleDownload = async () => {
    try {
      // Create a temporary container for PDF rendering
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "fixed";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "794px"; // A4 width in pixels at 96dpi
      tempDiv.style.padding = "40px";
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.fontFamily = "Arial, Helvetica, sans-serif";
      
      // Set the content for PDF
      tempDiv.innerHTML = `
        <div id="proposal-pdf-content">
          <h1 style="color: #333; margin-bottom: 20px;">Proposal ${proposal.number || proposal.client}</h1>
          <div style="margin-bottom: 15px;">
            <strong>Client:</strong> ${proposal.client || "N/A"}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Company:</strong> ${proposal.company || "N/A"}
          </div>
          <div style="margin-bottom: 20px;">
            <strong>Total:</strong> $${(proposal.total ?? 0).toLocaleString()}
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;"/>
          <div>
            <strong>Items:</strong> ${proposal.items || "No items specified"}
          </div>
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleDateString()}
          </div>
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Wait for the content to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = tempDiv.querySelector("#proposal-pdf-content");
      
      if (!element) {
        throw new Error("PDF content element not found");
      }

      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      // Convert canvas to image data
      const imgData = canvas.toDataURL("image/png");
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit the page
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`${proposal.number || proposal.client || "proposal"}-proposal.pdf`);

      // Clean up
      document.body.removeChild(tempDiv);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // HTML content for modal preview (separate from PDF content)
  const modalHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
      <h1>Proposal ${proposal.number || proposal.client}</h1>
      <p><strong>Client:</strong> ${proposal.client}</p>
      <p><strong>Company:</strong> ${proposal.company}</p>
      <p><strong>Total:</strong> $${(proposal.total ?? 0).toLocaleString()}</p>
      <hr/>
      <p>Items: ${proposal.items}</p>
    </div>
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="z-10 w-[90%] md:w-3/4 lg:w-2/3 bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Proposal Preview</h3>
            <p className="text-sm text-gray-500">{proposal.client} • {proposal.number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download PDF
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div 
            className="bg-white p-6 border rounded-lg"
            dangerouslySetInnerHTML={{ __html: modalHtml }} 
          />
        </div>
      </motion.div>
    </div>
  );
};