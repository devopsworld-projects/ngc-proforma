import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as fabric from "fabric";

interface CanvasPropertiesPanelProps {
  selectedObject: fabric.FabricObject | null;
  onUpdateProperty: (key: string, value: any) => void;
}

const fontFamilies = [
  "Inter", "Montserrat", "Roboto Mono", "Arial", "Georgia", 
  "Times New Roman", "Courier New", "Verdana", "Helvetica",
];

export function CanvasPropertiesPanel({ selectedObject, onUpdateProperty }: CanvasPropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <p className="font-medium mb-1">No element selected</p>
        <p className="text-xs">Click an element on the canvas or add a new one from the toolbar.</p>
      </div>
    );
  }

  const isText = selectedObject.type === "textbox" || selectedObject.type === "text" || selectedObject.type === "i-text";
  const isLine = selectedObject.type === "line";
  const obj = selectedObject as any;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4 text-sm">
        {/* Element Type Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {obj.type?.toUpperCase() || "ELEMENT"}
          </span>
          {obj.name && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">{obj.name}</span>
          )}
        </div>

        <Separator />

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">X</Label>
              <Input
                type="number"
                value={Math.round(obj.left || 0)}
                onChange={(e) => onUpdateProperty("left", parseFloat(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={Math.round(obj.top || 0)}
                onChange={(e) => onUpdateProperty("top", parseFloat(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        {!isLine && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  value={Math.round((obj.width || 0) * (obj.scaleX || 1))}
                  onChange={(e) => {
                    const newWidth = parseFloat(e.target.value);
                    onUpdateProperty("scaleX", newWidth / (obj.width || 1));
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  value={Math.round((obj.height || 0) * (obj.scaleY || 1))}
                  onChange={(e) => {
                    const newHeight = parseFloat(e.target.value);
                    onUpdateProperty("scaleY", newHeight / (obj.height || 1));
                  }}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rotation */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rotation</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[obj.angle || 0]}
              min={0}
              max={360}
              step={1}
              onValueChange={([val]) => onUpdateProperty("angle", val)}
              className="flex-1"
            />
            <Input
              type="number"
              value={Math.round(obj.angle || 0)}
              onChange={(e) => onUpdateProperty("angle", parseFloat(e.target.value))}
              className="h-7 text-xs w-16"
            />
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opacity</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[(obj.opacity ?? 1) * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) => onUpdateProperty("opacity", val / 100)}
              className="flex-1"
            />
            <span className="text-xs w-10 text-right">{Math.round((obj.opacity ?? 1) * 100)}%</span>
          </div>
        </div>

        <Separator />

        {/* Fill & Stroke */}
        {!isLine && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fill</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={typeof obj.fill === "string" ? obj.fill : "#000000"}
                onChange={(e) => onUpdateProperty("fill", e.target.value)}
                className="w-8 h-7 rounded border cursor-pointer"
              />
              <Input
                value={typeof obj.fill === "string" ? obj.fill : ""}
                onChange={(e) => onUpdateProperty("fill", e.target.value)}
                className="h-7 text-xs flex-1"
                placeholder="#000000"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stroke</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={obj.stroke || "#000000"}
              onChange={(e) => onUpdateProperty("stroke", e.target.value)}
              className="w-8 h-7 rounded border cursor-pointer"
            />
            <Input
              value={obj.stroke || ""}
              onChange={(e) => onUpdateProperty("stroke", e.target.value)}
              className="h-7 text-xs flex-1"
              placeholder="none"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Stroke Width</Label>
            <Slider
              value={[obj.strokeWidth || 0]}
              min={0}
              max={20}
              step={0.5}
              onValueChange={([val]) => onUpdateProperty("strokeWidth", val)}
            />
          </div>
        </div>

        {/* Text-specific properties */}
        {isText && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typography</Label>
              
              <div>
                <Label className="text-[10px] text-muted-foreground">Font Family</Label>
                <Select
                  value={obj.fontFamily || "Inter"}
                  onValueChange={(val) => onUpdateProperty("fontFamily", val)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">
                        <span style={{ fontFamily: f }}>{f}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Font Size</Label>
                  <Input
                    type="number"
                    value={obj.fontSize || 16}
                    onChange={(e) => onUpdateProperty("fontSize", parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    min={6}
                    max={200}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Weight</Label>
                  <Select
                    value={String(obj.fontWeight || "normal")}
                    onValueChange={(val) => onUpdateProperty("fontWeight", val)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                      <SelectItem value="100" className="text-xs">Thin</SelectItem>
                      <SelectItem value="300" className="text-xs">Light</SelectItem>
                      <SelectItem value="500" className="text-xs">Medium</SelectItem>
                      <SelectItem value="600" className="text-xs">Semi Bold</SelectItem>
                      <SelectItem value="800" className="text-xs">Extra Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Text Align</Label>
                <Select
                  value={obj.textAlign || "left"}
                  onValueChange={(val) => onUpdateProperty("textAlign", val)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left" className="text-xs">Left</SelectItem>
                    <SelectItem value="center" className="text-xs">Center</SelectItem>
                    <SelectItem value="right" className="text-xs">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Line Height</Label>
                <Slider
                  value={[obj.lineHeight || 1.16]}
                  min={0.8}
                  max={3}
                  step={0.05}
                  onValueChange={([val]) => onUpdateProperty("lineHeight", val)}
                />
              </div>
            </div>
          </>
        )}

        {/* Corner Radius (for rect) */}
        {obj.type === "rect" && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Corner Radius</Label>
            <Slider
              value={[obj.rx || 0]}
              min={0}
              max={50}
              step={1}
              onValueChange={([val]) => {
                onUpdateProperty("rx", val);
                onUpdateProperty("ry", val);
              }}
            />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
