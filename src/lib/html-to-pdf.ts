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

  // Store original styles to restore later
  const originalTransform = element.style.transform;
  const originalWidth = element.style.width;
  
  try {
    // Reset any transforms that might affect rendering
    element.style.transform = "none";
    
    // A4 dimensions in mm: 210 x 297
    // At 96 DPI, A4 is approximately 794 x 1123 pixels
    const a4WidthPx = 794;
    const a4HeightPx = 1123;
    
    // Capture the element with high quality settings
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow cross-origin images
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Calculate dimensions for A4 PDF
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF with appropriate page size
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? "portrait" : "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = imgHeight;
    let position = 0;
    let page = 1;

    // Add image to first page
    pdf.addImage(
      canvas.toDataURL("image/png", 1.0),
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST"
    );
    heightLeft -= pageHeight;

    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pageHeight;
      page++;
    }

    // Download the PDF
    pdf.save(`${filename}.pdf`);
  } finally {
    // Restore original styles
    element.style.transform = originalTransform;
    element.style.width = originalWidth;
  }
}
