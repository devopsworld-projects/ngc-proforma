import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures the exact rendered HTML element and converts it to a PDF.
 * Uses a wrapper approach to ensure clean white background.
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

  // Store original styles to restore later
  const originalBoxShadow = element.style.boxShadow;
  const originalAnimation = element.style.animation;
  
  // Remove shadow and animation before capture
  element.style.boxShadow = 'none';
  element.style.animation = 'none';

  try {
    // Capture with high quality - use PNG for accurate colors
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

    // Calculate the image dimensions when scaled to A4 width
    const imgWidth = a4Width;
    const imgHeight = (canvas.height * a4Width) / canvas.width;
    
    if (imgHeight <= a4Height) {
      // Single page - simple case
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      // Multiple pages needed - slice the canvas properly
      const totalPages = Math.ceil(imgHeight / a4Height);
      
      // Calculate how much of the source canvas corresponds to one A4 page
      const sourcePageHeight = (a4Height / imgHeight) * canvas.height;
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate source Y position and height for this page
        const sourceY = page * sourcePageHeight;
        const remainingHeight = canvas.height - sourceY;
        const sliceHeight = Math.min(sourcePageHeight, remainingHeight);
        
        // Create a new canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          // Fill with solid white background first
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          // Draw the slice of the original canvas
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sliceHeight,
            0, 0, canvas.width, sliceHeight
          );
        }
        
        // Convert this page slice to image data
        const pageImgData = pageCanvas.toDataURL("image/jpeg", 1.0);
        
        // Calculate the height this slice takes on the PDF page
        const pdfSliceHeight = (sliceHeight / canvas.width) * a4Width;
        
        // Add to PDF
        pdf.addImage(pageImgData, "JPEG", 0, 0, a4Width, pdfSliceHeight);
      }
    }

    // Download the PDF
    pdf.save(`${filename}.pdf`);
  } finally {
    // Restore original styles
    element.style.boxShadow = originalBoxShadow;
    element.style.animation = originalAnimation;
    
    // Restore no-print elements
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
  }
}
