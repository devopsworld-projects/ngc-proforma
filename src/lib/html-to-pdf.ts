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
 * Single-page PDF generator.
 * Captures the entire invoice element and scales it to fit on one A4 page.
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
  const originalMargin = element.style.margin;
  element.style.boxShadow = "none";
  element.style.animation = "none";
  element.style.minHeight = "0";

  // Force a fixed pixel width for consistent A4-proportioned capture.
  // This ensures the captured image always fills the full A4 width
  // without any horizontal offset or misalignment.
  const CAPTURE_WIDTH_PX = 794; // A4 at 96 DPI
  element.style.width = `${CAPTURE_WIDTH_PX}px`;
  element.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;
  element.style.margin = "0";

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 30000,
      width: CAPTURE_WIDTH_PX,
    });

    const A4_W_MM = 210;
    const A4_H_MM = 297;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Always fill full A4 width; scale height proportionally
    const imgHeightMM = (canvas.height * A4_W_MM) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    if (imgHeightMM <= A4_H_MM) {
      // Fits on one page at full width
      pdf.addImage(imgData, "JPEG", 0, 0, A4_W_MM, imgHeightMM);
    } else {
      // Scale down uniformly to fit on one page, always full width
      const scaleFactor = A4_H_MM / imgHeightMM;
      const scaledWidth = A4_W_MM * scaleFactor;
      const scaledHeight = A4_H_MM;
      const xOffset = (A4_W_MM - scaledWidth) / 2;
      pdf.addImage(imgData, "JPEG", xOffset, 0, scaledWidth, scaledHeight);
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    element.style.boxShadow = originalBoxShadow;
    element.style.animation = originalAnimation;
    element.style.minHeight = originalMinHeight;
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.margin = originalMargin;
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
  }
}

