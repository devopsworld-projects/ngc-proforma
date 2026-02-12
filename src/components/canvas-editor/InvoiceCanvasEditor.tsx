import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasPropertiesPanel } from "./CanvasPropertiesPanel";
import { useCanvasEditor } from "./useCanvasEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// A4 proportions at 72 DPI
const CANVAS_WIDTH = 595;
const CANVAS_HEIGHT = 842;

interface InvoiceCanvasEditorProps {
  initialData?: string | null;
  onSave: (data: string) => Promise<void>;
  isSaving?: boolean;
}

export function InvoiceCanvasEditor({ initialData, onSave, isSaving }: InvoiceCanvasEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const {
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
  } = useCanvasEditor({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    initialData,
  });

  // Initialize canvas when element is ready
  useEffect(() => {
    if (canvasElRef.current && !canvasReady) {
      initCanvas(canvasElRef.current);
    }
  }, [initCanvas, canvasReady]);

  // Auto-fit zoom to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 48; // padding
        setContainerWidth(w);
        const fitZoom = Math.min(w / CANVAS_WIDTH, 0.95);
        setZoom(fitZoom);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSave = useCallback(async () => {
    const json = toJSON();
    if (!json) return;
    try {
      await onSave(JSON.stringify(json));
      setHasChanges(false);
      toast.success("Canvas saved successfully");
    } catch (error) {
      console.error("Failed to save canvas:", error);
      toast.error("Failed to save canvas");
    }
  }, [toJSON, onSave, setHasChanges]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <CanvasToolbar
        onAddText={addText}
        onAddRect={addRect}
        onAddCircle={addCircle}
        onAddLine={addLine}
        onAddImage={addImage}
        onAddWatermark={addWatermark}
        onDelete={deleteSelected}
        onUndo={undo}
        onRedo={redo}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onClear={clearCanvas}
        hasSelection={!!selectedObject}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Canvas Area */}
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="h-full flex flex-col">
            {/* Zoom controls & Save */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Badge variant="outline" className="text-[10px] px-1.5">
                  {Math.round(zoom * 100)}%
                </Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                    Unsaved
                  </Badge>
                )}
                <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isSaving || !hasChanges}>
                  {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                  Save Canvas
                </Button>
              </div>
            </div>

            {/* Canvas container */}
            <ScrollArea className="flex-1">
              <div
                ref={containerRef}
                className="flex justify-center items-start p-6 min-h-full bg-muted/50"
              >
                <div
                  className="shadow-lg border border-border"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                  }}
                >
                  <canvas ref={canvasElRef} />
                </div>
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Properties Panel */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full border-l">
            <div className="px-3 py-2 border-b bg-muted/30">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h4>
            </div>
            <CanvasPropertiesPanel
              selectedObject={selectedObject}
              onUpdateProperty={updateSelectedProperty}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
