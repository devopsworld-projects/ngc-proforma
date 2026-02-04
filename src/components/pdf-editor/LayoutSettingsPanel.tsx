import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Building2, User, Table, Calculator, Landmark, FileText, PenLine } from "lucide-react";

interface LayoutSettingsPanelProps {
  sectionOrder: string[];
  onChange: (key: string, value: string[]) => void;
}

const SECTION_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  header: { label: "Company Header", icon: Building2, description: "Logo, company name, address, contact info" },
  customer_details: { label: "Customer & Invoice Details", icon: User, description: "Bill to, invoice number, date" },
  items_table: { label: "Items Table", icon: Table, description: "Product list with prices and quantities" },
  totals: { label: "Totals Section", icon: Calculator, description: "Subtotal, taxes, grand total" },
  bank_details: { label: "Bank Details", icon: Landmark, description: "Bank account information" },
  terms: { label: "Terms & Conditions", icon: FileText, description: "Payment terms and conditions" },
  signature: { label: "Signature", icon: PenLine, description: "Authorised signatory block" },
};

interface SortableItemProps {
  id: string;
}

function SortableItem({ id }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = SECTION_CONFIG[id];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-background border rounded-lg transition-all ${
        isDragging ? "shadow-lg ring-2 ring-primary/30 opacity-90" : "hover:bg-muted/50"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        aria-label={`Drag to reorder ${config.label}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{config.label}</p>
          <p className="text-xs text-muted-foreground truncate">{config.description}</p>
        </div>
      </div>
    </div>
  );
}

export function LayoutSettingsPanel({ sectionOrder, onChange }: LayoutSettingsPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure all sections are in the order array
  const validSectionOrder = useMemo(() => {
    const allSections = Object.keys(SECTION_CONFIG);
    const existingValid = sectionOrder.filter(s => allSections.includes(s));
    const missing = allSections.filter(s => !existingValid.includes(s));
    return [...existingValid, ...missing];
  }, [sectionOrder]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = validSectionOrder.indexOf(active.id as string);
      const newIndex = validSectionOrder.indexOf(over.id as string);
      const newOrder = arrayMove(validSectionOrder, oldIndex, newIndex);
      onChange("section_order", newOrder);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Section Order</CardTitle>
          <CardDescription>
            Drag and drop to reorder invoice sections. Changes apply to all generated PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={validSectionOrder}
              strategy={verticalListSortingStrategy}
            >
              {validSectionOrder.map((sectionId) => (
                <SortableItem key={sectionId} id={sectionId} />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> The order you set here will be applied to all invoice PDFs generated across the application. 
            Some sections may be hidden based on your visibility settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
