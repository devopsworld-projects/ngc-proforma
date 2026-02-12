import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { usePdfTemplate } from "@/contexts/PdfTemplateContext";

const CANVAS_WIDTH = 595;
const CANVAS_HEIGHT = 842;

/**
 * Renders the custom_canvas_data from PDF template settings as a transparent
 * overlay on top of the invoice. This overlay is captured by html2canvas
 * during PDF download, so custom elements appear in the generated PDF.
 */
export function CanvasOverlay() {
  const { settings } = usePdfTemplate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.StaticCanvas | null>(null);

  const canvasData = settings.custom_canvas_data;

  useEffect(() => {
    if (!canvasData || !canvasRef.current) {
      // Clear canvas if no data
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      return;
    }

    const initOverlay = async () => {
      // Dispose previous instance
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }

      const staticCanvas = new fabric.StaticCanvas(canvasRef.current!, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: "transparent",
      });

      fabricRef.current = staticCanvas;

      try {
        const parsed = typeof canvasData === "string" ? JSON.parse(canvasData) : canvasData;
        // Override background to transparent so only custom elements show
        const dataToLoad = { ...parsed, background: "transparent" };
        await staticCanvas.loadFromJSON(dataToLoad);
        staticCanvas.requestRenderAll();
      } catch (e) {
        console.error("Failed to render canvas overlay:", e);
      }
    };

    initOverlay();

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [canvasData]);

  if (!canvasData) return null;

  return (
    <canvas
      ref={canvasRef}
      className="canvas-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
    />
  );
}
