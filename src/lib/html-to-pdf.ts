import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures the exact rendered HTML element and converts it to a PDF.
 * This ensures pixel-perfect matching between web view and PDF output.
 * Uses canvas slicing for proper multi-page support without overlays.
 */
export async function downloadInvoiceAsPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Hide no-print elements temporarily
  const noPrintElements = element.querySelectorAll(".no-print");
  noPrintElements.forEach((el) => {
    (el as HTMLElement).style.display = "none";
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
      removeContainer: true,
    });

    // Process canvas to replace gray backgrounds with white
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Replace gray colors with white
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is gray (RGB values are similar)
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        const isGray = maxDiff < 30; // If color channels are within 30 of each other, it's gray

        // Brightness calculation
        const brightness = (r + g + b) / 3;

        // Replace gray pixels that are not too dark (preserve black text)
        // Keep pixels that are very dark (< 100) as they're likely text
        // Replace everything else that's gray and not colored
        if (isGray && brightness > 100) {
          data[i] = 255; // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          // Keep alpha channel (data[i + 3]) unchanged
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

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
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          // Draw the slice of the original canvas directly
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sliceHeight, // Source rectangle
            0,
            0,
            canvas.width,
            sliceHeight, // Destination rectangle
          );
        }

        // Convert this page slice to image data
        const pageImgData = pageCanvas.toDataURL("image/jpeg", 1.0);

        // Calculate the height this slice takes on the PDF page
        const pdfSliceHeight = (sliceHeight / canvas.width) * a4Width;

        // Add to PDF - each page gets only its slice, no overlapping
        pdf.addImage(pageImgData, "JPEG", 0, 0, a4Width, pdfSliceHeight);
      }
    }

    // Download the PDF
    pdf.save(`${filename}.pdf`);
  } finally {
    // Restore no-print elements
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
  }
}
