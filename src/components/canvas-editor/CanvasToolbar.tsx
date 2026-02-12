import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Type,
  Square,
  Circle,
  Minus,
  ImagePlus,
  Droplets,
  Trash2,
  Undo2,
  Redo2,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Eraser,
  RotateCcw,
} from "lucide-react";
import { useRef } from "react";

interface CanvasToolbarProps {
  onAddText: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddLine: () => void;
  onAddImage: (url: string) => void;
  onAddWatermark: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onClear: () => void;
  onRegenerateFromTemplate?: () => void;
  hasSelection: boolean;
}

export function CanvasToolbar({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddLine,
  onAddImage,
  onAddWatermark,
  onDelete,
  onUndo,
  onRedo,
  onBringForward,
  onSendBackward,
  onClear,
  onRegenerateFromTemplate,
  hasSelection,
}: CanvasToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onAddImage(url);
    e.target.value = "";
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 p-2 border-b bg-background flex-wrap">
        {/* Regenerate from Template */}
        {onRegenerateFromTemplate && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={onRegenerateFromTemplate}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Load Template
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Regenerate canvas from current template settings
              </TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-6 mx-1" />
          </>
        )}

        {/* Add Elements */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon={Type} label="Add Text" onClick={onAddText} />
          <ToolbarButton icon={Square} label="Add Rectangle" onClick={onAddRect} />
          <ToolbarButton icon={Circle} label="Add Circle" onClick={onAddCircle} />
          <ToolbarButton icon={Minus} label="Add Line" onClick={onAddLine} />
          <ToolbarButton
            icon={ImagePlus}
            label="Add Image"
            onClick={() => fileInputRef.current?.click()}
          />
          <ToolbarButton icon={Droplets} label="Add Watermark" onClick={onAddWatermark} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* History */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={onUndo} />
          <ToolbarButton icon={Redo2} label="Redo (Ctrl+Shift+Z)" onClick={onRedo} />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Layer & Delete */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={ArrowUpFromLine}
            label="Bring Forward"
            onClick={onBringForward}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={ArrowDownFromLine}
            label="Send Backward"
            onClick={onSendBackward}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={Trash2}
            label="Delete Selected (Del)"
            onClick={onDelete}
            disabled={!hasSelection}
            variant="destructive"
          />
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton icon={Eraser} label="Clear Canvas" onClick={onClear} variant="outline" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "ghost",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "destructive" | "outline";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant === "destructive" ? "ghost" : variant}
          size="icon"
          className={`h-8 w-8 ${variant === "destructive" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}`}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
