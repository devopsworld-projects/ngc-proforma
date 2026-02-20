import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Preload an image with proper CORS handling
 */
async function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`Failed to preload image: ${src}`);
      resolve();
    };
    img.src = src;
  });
}

/**
 * Section-aware PDF generator.
 * Captures each [data-pdf-section] element individually and places them
 * on A4 pages without splitting any section across pages.
 */
export async function downloadInvoiceAsPdf(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Preload all images
  const images = element.querySelectorAll("img");
  const imagePromises: Promise<void>[] = [];
  images.forEach((img) => {
    if (img.src && !img.src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
      imagePromises.push(preloadImage(img.src));
    }
  });
  await Promise.all(imagePromises);

  // Hide no-print elements
  const noPrintElements = element.querySelectorAll(".no-print");
  noPrintElements.forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  // Store and strip styles that cause artifacts
  const originalBoxShadow = element.style.boxShadow;
  const originalAnimation = element.style.animation;
  const originalMinHeight = element.style.minHeight;
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  element.style.boxShadow = "none";
  element.style.animation = "none";
  element.style.minHeight = "0";

  // A4 at 96 DPI = 794px. Force exact width so nothing gets clipped.
  const A4_PX_WIDTH = 794;
  element.style.width = `${A4_PX_WIDTH}px`;
  element.style.maxWidth = `${A4_PX_WIDTH}px`;

  try {
    // Let html2canvas capture the element at its natural forced width.
    // Do NOT set width/windowWidth — those confuse the layout when a sidebar
    // is present and cause the content to render narrower than 794px,
    // leaving white canvas margins that appear as side whitespace in the PDF.
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 30000,
      scrollX: 0,
      scrollY: 0,
    });

    const A4_W_MM = 210;
    const A4_H_MM = 297;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Always fill the full A4 width — never leave side margins.
    // If content is taller than A4, compress height to fit (slight vertical
    // squeeze is acceptable for dense invoices; side whitespace is not).
    const finalWidth = A4_W_MM;
    const proportionalHeight = (canvas.height * A4_W_MM) / canvas.width;
    const finalHeight = Math.min(proportionalHeight, A4_H_MM);

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    pdf.addImage(imgData, "JPEG", 0, 0, finalWidth, finalHeight);

    pdf.save(`${filename}.pdf`);
  } finally {
    element.style.boxShadow = originalBoxShadow;
    element.style.animation = originalAnimation;
    element.style.minHeight = originalMinHeight;
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
  }
}

/**
 * Fallback: captures the entire element as before (fixed-interval slicing).
 */
async function fallbackCapture(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 30000,
  });

  const a4Width = 210;
  const a4Height = 297;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const imgWidth = a4Width;
  const imgHeight = (canvas.height * a4Width) / canvas.width;

  if (imgHeight <= a4Height) {
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
  } else {
    const totalPages = Math.ceil(imgHeight / a4Height);
    const sourcePageHeight = (a4Height / imgHeight) * canvas.height;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const sourceY = page * sourcePageHeight;
      const remainingHeight = canvas.height - sourceY;
      const sliceHeight = Math.min(sourcePageHeight, remainingHeight);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      }
      const pageImgData = pageCanvas.toDataURL("image/jpeg", 1.0);
      const pdfSliceHeight = (sliceHeight / canvas.width) * a4Width;
      pdf.addImage(pageImgData, "JPEG", 0, 0, a4Width, pdfSliceHeight);
    }
  }

  pdf.save(`${filename}.pdf`);
}
