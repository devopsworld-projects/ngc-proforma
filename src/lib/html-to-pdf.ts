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
  element.style.boxShadow = "none";
  element.style.animation = "none";
  element.style.minHeight = "0";

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 30000,
    });

    const A4_W_MM = 210;
    const A4_H_MM = 297;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Scale to fit width, then check if height exceeds A4
    const imgWidthMM = A4_W_MM;
    const imgHeightMM = (canvas.height * A4_W_MM) / canvas.width;

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    if (imgHeightMM <= A4_H_MM) {
      // Fits on one page at full width
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidthMM, imgHeightMM);
    } else {
      // Scale down to fit everything on one page
      const scaleFactor = A4_H_MM / imgHeightMM;
      const scaledWidth = imgWidthMM * scaleFactor;
      const scaledHeight = A4_H_MM;
      const xOffset = (A4_W_MM - scaledWidth) / 2; // Center horizontally
      pdf.addImage(imgData, "JPEG", xOffset, 0, scaledWidth, scaledHeight);
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    element.style.boxShadow = originalBoxShadow;
    element.style.animation = originalAnimation;
    element.style.minHeight = originalMinHeight;
    noPrintElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
  }
}

