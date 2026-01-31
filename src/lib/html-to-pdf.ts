import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures the exact rendered HTML element and converts it to a PDF.
 * This ensures pixel-perfect matching between web view and PDF output.
 */
export async function downloadInvoiceAsPdf(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Hide no-print elements temporarily
  const noPrintElements = element.querySelectorAll('.no-print');
  noPrintElements.forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  try {
    // Capture with high quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
    });

    // A4 dimensions in mm
    const a4Width = 210;
    const a4Height = 297;
    
    // Create PDF in A4 portrait
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Calculate dimensions to fit A4 width
    const imgWidth = a4Width;
    const imgHeight = (canvas.height * a4Width) / canvas.width;
    
    // Get the full image data
    const imgData = canvas.toDataURL("image/png", 1.0);
    
    if (imgHeight <= a4Height) {
      // Single page - simple case
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      // Multiple pages needed
      // Calculate how many pages we need
      const totalPages = Math.ceil(imgHeight / a4Height);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate the Y position for this page
        // We use negative Y offset to shift the image up for each page
        const yPosition = -(page * a4Height);
        
        // Add the full image with offset
        pdf.addImage(imgData, "PNG", 0, yPosition, imgWidth, imgHeight);
      }
    }

    // Download the PDF
    pdf.save(`${filename}.pdf`);
  } finally {
    // Restore no-print elements
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
  }
}
