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
    // Get the actual rendered dimensions
    const rect = element.getBoundingClientRect();
    
    // Capture with high quality - use scale 2 for crisp output
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Ensure cloned element has proper styling
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.transform = 'none';
          clonedElement.style.width = `${rect.width}px`;
        }
      }
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

    // Calculate the aspect ratio of the captured content
    const canvasAspectRatio = canvas.width / canvas.height;
    const a4AspectRatio = a4Width / a4Height;
    
    let imgWidth: number;
    let imgHeight: number;
    
    // Fit to A4 width while maintaining aspect ratio
    imgWidth = a4Width;
    imgHeight = imgWidth / canvasAspectRatio;
    
    // If content is taller than one page, we need to handle pagination
    const imgData = canvas.toDataURL("image/png", 1.0);
    
    if (imgHeight <= a4Height) {
      // Content fits on one page
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      // Content spans multiple pages
      let yOffset = 0;
      let remainingHeight = imgHeight;
      let pageNum = 0;
      
      while (remainingHeight > 0) {
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        // Calculate source and destination coordinates
        const sourceY = (yOffset / imgHeight) * canvas.height;
        const sourceHeight = Math.min((a4Height / imgHeight) * canvas.height, canvas.height - sourceY);
        const destHeight = Math.min(a4Height, remainingHeight);
        
        // Create a temporary canvas for this page section
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
          const pageImgHeight = (sourceHeight / canvas.width) * a4Width;
          
          pdf.addImage(pageImgData, "PNG", 0, 0, a4Width, pageImgHeight);
        }
        
        yOffset += a4Height;
        remainingHeight -= a4Height;
        pageNum++;
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
