import { useRef, useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";

export interface CanvasElement {
  id: string;
  type: string;
  [key: string]: any;
}

interface UseCanvasEditorOptions {
  width: number;
  height: number;
  initialData?: string | null;
}

export function useCanvasEditor({ width, height, initialData }: UseCanvasEditorOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);

  // Initialize canvas
  const initCanvas = useCallback((canvasEl: HTMLCanvasElement) => {
    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasEl, {
      width,
      height,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    // Draw A4 border guide
    const border = new fabric.Rect({
      left: 0,
      top: 0,
      width: width - 1,
      height: height - 1,
      fill: "transparent",
      stroke: "#e5e7eb",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    canvas.add(border);
    canvas.sendObjectToBack(border);

    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });
    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });
    canvas.on("object:modified", () => {
      setHasChanges(true);
      saveToHistory();
    });
    canvas.on("object:added", () => {
      if (!isUndoRedoRef.current) {
        setHasChanges(true);
        saveToHistory();
      }
    });
    canvas.on("object:removed", () => {
      if (!isUndoRedoRef.current) {
        setHasChanges(true);
        saveToHistory();
      }
    });

    fabricRef.current = canvas;
    canvasRef.current = canvasEl;
    setCanvasReady(true);

    // Load initial data if available
    if (initialData) {
      try {
        const parsed = typeof initialData === "string" ? JSON.parse(initialData) : initialData;
        canvas.loadFromJSON(parsed).then(() => {
          canvas.requestRenderAll();
          saveToHistory();
        });
      } catch (e) {
        console.error("Failed to load canvas data:", e);
        saveToHistory();
      }
    } else {
      saveToHistory();
    }

    return canvas;
  }, [width, height, initialData]);

  // History management
  const saveToHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = JSON.stringify((canvas as any).toJSON(["id", "name", "selectable", "evented", "excludeFromExport"]));
    const history = historyRef.current;
    const idx = historyIndexRef.current;
    
    // Remove future states if we're not at the end
    if (idx < history.length - 1) {
      history.splice(idx + 1);
    }
    history.push(json);
    if (history.length > 50) history.shift();
    historyIndexRef.current = history.length - 1;
  }, []);

  const undo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current--;
    const json = JSON.parse(historyRef.current[historyIndexRef.current]);
    canvas.loadFromJSON(json).then(() => {
      canvas.requestRenderAll();
      isUndoRedoRef.current = false;
      setHasChanges(true);
    });
  }, []);

  const redo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current++;
    const json = JSON.parse(historyRef.current[historyIndexRef.current]);
    canvas.loadFromJSON(json).then(() => {
      canvas.requestRenderAll();
      isUndoRedoRef.current = false;
      setHasChanges(true);
    });
  }, []);

  // Element operations
  const addText = useCallback((text = "Double-click to edit") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const textbox = new fabric.Textbox(text, {
      left: width / 2 - 80,
      top: height / 2 - 15,
      width: 160,
      fontSize: 16,
      fontFamily: "Inter",
      fill: "#1f2937",
      id: `text_${Date.now()}`,
    } as any);
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
  }, [width, height]);

  const addRect = useCallback((options?: Partial<fabric.RectProps>) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: width / 2 - 60,
      top: height / 2 - 30,
      width: 120,
      height: 60,
      fill: "#3b82f6",
      stroke: "#2563eb",
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      id: `rect_${Date.now()}`,
      ...options,
    } as any);
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  }, [width, height]);

  const addCircle = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: width / 2 - 30,
      top: height / 2 - 30,
      radius: 30,
      fill: "#8b5cf6",
      stroke: "#7c3aed",
      strokeWidth: 1,
      id: `circle_${Date.now()}`,
    } as any);
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
  }, [width, height]);

  const addLine = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const line = new fabric.Line([width / 2 - 80, height / 2, width / 2 + 80, height / 2], {
      stroke: "#1f2937",
      strokeWidth: 2,
      id: `line_${Date.now()}`,
    } as any);
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.requestRenderAll();
  }, [width, height]);

  const addImage = useCallback(async (url: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      const scale = Math.min(150 / (img.width || 150), 150 / (img.height || 150));
      img.set({
        left: width / 2 - 75,
        top: height / 2 - 75,
        scaleX: scale,
        scaleY: scale,
        id: `img_${Date.now()}`,
      } as any);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    } catch (e) {
      console.error("Failed to load image:", e);
    }
  }, [width, height]);

  const addWatermark = useCallback((text = "DRAFT") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const watermark = new fabric.Textbox(text, {
      left: width / 2 - 100,
      top: height / 2 - 40,
      width: 200,
      fontSize: 48,
      fontFamily: "Montserrat",
      fill: "rgba(0,0,0,0.08)",
      textAlign: "center",
      angle: -30,
      selectable: true,
      id: `watermark_${Date.now()}`,
      name: "watermark",
    } as any);
    canvas.add(watermark);
    canvas.setActiveObject(watermark);
    canvas.requestRenderAll();
  }, [width, height]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length > 0) {
      active.forEach((obj) => {
        if ((obj as any).excludeFromExport) return;
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  }, []);

  const bringForward = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || !selectedObject) return;
    canvas.bringObjectForward(selectedObject);
    canvas.requestRenderAll();
    setHasChanges(true);
  }, [selectedObject]);

  const sendBackward = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || !selectedObject) return;
    canvas.sendObjectBackwards(selectedObject);
    canvas.requestRenderAll();
    setHasChanges(true);
  }, [selectedObject]);

  const updateSelectedProperty = useCallback((key: string, value: any) => {
    const canvas = fabricRef.current;
    if (!canvas || !selectedObject) return;
    selectedObject.set(key as keyof fabric.FabricObject, value);
    canvas.requestRenderAll();
    setHasChanges(true);
    // Force re-render of properties panel
    setSelectedObject({ ...selectedObject } as any);
  }, [selectedObject]);

  const toJSON = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return null;
    return (canvas as any).toJSON(["id", "name"]);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects().filter((obj) => !(obj as any).excludeFromExport);
    objects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setHasChanges(true);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricRef.current) return;
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      // Also don't intercept if editing text on canvas
      const activeObj = fabricRef.current.getActiveObject();
      if (activeObj && (activeObj as any).isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === "y" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected, undo, redo]);

  return {
    canvasRef,
    fabricRef,
    initCanvas,
    canvasReady,
    selectedObject,
    hasChanges,
    setHasChanges,
    addText,
    addRect,
    addCircle,
    addLine,
    addImage,
    addWatermark,
    deleteSelected,
    bringForward,
    sendBackward,
    updateSelectedProperty,
    undo,
    redo,
    toJSON,
    clearCanvas,
  };
}
