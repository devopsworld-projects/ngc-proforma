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

  // Find ALL elements with backgrounds and store their original values
  const allElements = element.querySelectorAll("*");
  const originalBackgrounds = new Map<HTMLElement, string>();

  // Force white background on root and all children
  (element as HTMLElement).style.backgroundColor = "#ffffff";
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computed = window.getComputedStyle(htmlEl);
    const bgColor = computed.backgroundColor;

    // Store original if it's not transparent/white
    if (bgColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)") {
      originalBackgrounds.set(htmlEl, htmlEl.style.backgroundColor);
      htmlEl.style.backgroundColor = "#ffffff";
    }
  });

  // Hide no-print elements temporarily
  const noPrintElements = element.querySelectorAll(".no-print");
  noPrintElements.forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  try {
    // Small delay to ensure styles are applied
    await new Promise((resolve) => setTimeout(resolve, 100));

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
    // Restore all original backgrounds
    originalBackgrounds.forEach((originalBg, el) => {
      el.style.backgroundColor = originalBg;
    });
    (element as HTMLElement).style.backgroundColor = "";

    // Restore no-print elements
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
  }
}
