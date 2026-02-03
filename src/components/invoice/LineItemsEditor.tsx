import { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  Package, 
  Search, 
  GripVertical, 
  ChevronDown, 
  ChevronUp,
  Barcode,
  Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";
import { ExcelLineItemsUpload } from "@/components/invoice/ExcelLineItemsUpload";
import { useSearchProducts, Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

export interface LineItem {
  id: string;
  slNo: number;
  brand: string;
  description: string;
  serialNumbers: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstPercent: number;
  gstAmount: number;
  amount: number;
  productId?: string;
  productImage?: string;
}

interface PricingMarkup {
  customerMarkupPercent: number;
  dealerMarkupPercent: number;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  customerType?: string | null;
  pricingSettings?: PricingMarkup | null;
}

interface SortableLineItemProps {
  item: LineItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: keyof LineItem, value: string | number) => void;
  onRemove: () => void;
  isDragging?: boolean;
}

function SortableLineItem({ 
  item, 
  isExpanded, 
  onToggleExpand, 
  onUpdate, 
  onRemove,
  isDragging 
}: SortableLineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group",
        isSortableDragging && "opacity-50"
      )}
    >
      {/* Compact Row */}
      <div 
        className={cn(
          "grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors",
          isExpanded && "bg-muted/40",
          !isSortableDragging && "hover:bg-muted/30"
        )}
      >
        {/* Drag Handle & Serial Number */}
        <div className="col-span-1 flex items-center gap-1">
          <button
            type="button"
            className="touch-none p-1 -ml-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-muted-foreground w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
            {item.slNo}
          </span>
        </div>
        
        {/* Product (Name + Description) */}
        <div 
          className="col-span-4 md:col-span-4 min-w-0 cursor-pointer"
          onClick={onToggleExpand}
        >
          <p className="font-semibold truncate text-sm">{item.brand || "Unnamed Product"}</p>
          {item.description && item.description !== item.brand && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
          {item.serialNumbers && (
            <div className="flex items-center gap-1 mt-0.5">
              <Barcode className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono truncate">
                {item.serialNumbers}
              </span>
            </div>
          )}
        </div>
        
        {/* Quantity × Rate */}
        <div className="col-span-2 text-center text-sm" onClick={onToggleExpand}>
          <span className="font-medium">{item.quantity}</span>
          <span className="text-muted-foreground mx-1">×</span>
          <span>{formatCurrency(item.rate)}</span>
        </div>
        
        {/* GST Amt */}
        <div className="col-span-2 text-center" onClick={onToggleExpand}>
          <span className="font-medium text-sm">{formatCurrency(item.gstAmount || 0)}</span>
        </div>
        
        {/* Amount (incl. GST) */}
        <div className="col-span-2 text-right" onClick={onToggleExpand}>
          <span className="font-semibold text-sm">{formatCurrency(item.amount + (item.gstAmount || 0))}</span>
        </div>
        
        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Expanded Edit Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-muted/20 border-t border-dashed animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Label className="text-xs font-medium mb-1.5 block">Description</Label>
              <Textarea
                placeholder="Product/Service description"
                value={item.description}
                onChange={(e) => onUpdate("description", e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Quantity</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="Qty"
                  value={item.quantity || ""}
                  onChange={(e) => onUpdate("quantity", parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <Input
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => onUpdate("unit", e.target.value)}
                  className="w-16"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Rate (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Rate"
                value={item.rate || ""}
                onChange={(e) => onUpdate("rate", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="lg:col-span-2">
              <Label className="text-xs font-medium mb-1.5 block">
                Serial Numbers
                <span className="text-muted-foreground font-normal ml-1">(comma separated)</span>
              </Label>
              <Input
                placeholder="SN001, SN002, SN003..."
                value={item.serialNumbers}
                onChange={(e) => onUpdate("serialNumbers", e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Discount %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                value={item.discountPercent || ""}
                onChange={(e) => onUpdate("discountPercent", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label className="text-xs font-medium mb-1.5 block">GST %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="18"
                value={item.gstPercent || ""}
                onChange={(e) => onUpdate("gstPercent", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Amount</Label>
              <div className="h-10 px-3 flex items-center bg-background border rounded-md">
                <span className="font-semibold">{formatCurrency(item.amount)}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium mb-1.5 block">GST Amount</Label>
              <div className="h-10 px-3 flex items-center bg-background border rounded-md">
                <span className="font-semibold">{formatCurrency(item.gstAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Drag overlay component for smooth dragging visual
function DragOverlayItem({ item }: { item: LineItem }) {
  return (
    <div className="bg-background border rounded-lg shadow-lg px-4 py-3 opacity-95">
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
          {item.slNo}
        </span>
        <span className="font-medium truncate flex-1">{item.description || "—"}</span>
        <span className="font-semibold">{formatCurrency(item.amount)}</span>
      </div>
    </div>
  );
}

export function LineItemsEditor({ items, onChange, customerType, pricingSettings }: LineItemsEditorProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useSearchProducts(searchTerm);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setExpandedItem(null); // Collapse any expanded item when dragging starts
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);
      // Renumber items after reorder
      const renumbered = reordered.map((item, index) => ({
        ...item,
        slNo: index + 1,
      }));
      onChange(renumbered);
    }
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      slNo: items.length + 1,
      brand: "",
      description: "",
      serialNumbers: "",
      quantity: 1,
      unit: "NOS",
      rate: 0,
      discountPercent: 0,
      gstPercent: 18,
      gstAmount: 0,
      amount: 0,
      productImage: "",
    };
    onChange([...items, newItem]);
    setExpandedItem(newItem.id);
  };

  const addProductAsItem = (product: Product) => {
    const qty = 1;
    
    // Apply markup based on customer type
    let finalRate = product.rate;
    if (pricingSettings) {
      const markupPercent = customerType === "dealer" 
        ? pricingSettings.dealerMarkupPercent 
        : pricingSettings.customerMarkupPercent;
      
      if (markupPercent > 0) {
        finalRate = product.rate * (1 + markupPercent / 100);
      }
    }
    
    const itemRate = Math.round(finalRate * 100) / 100;
    const baseAmount = qty * itemRate;
    const gstPercent = product.gst_percent || 18;
    const gstAmount = (baseAmount * gstPercent) / 100;
    
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      slNo: items.length + 1,
      brand: product.name, // Use product name as brand
      description: product.description || product.model_spec || "", // Use description or model spec
      serialNumbers: "",
      quantity: qty,
      unit: product.unit,
      rate: itemRate,
      discountPercent: 0,
      gstPercent: gstPercent,
      gstAmount: gstAmount,
      amount: baseAmount,
      productId: product.id,
      productImage: product.image_url || "", // Store product image
    };
    onChange([...items, newItem]);
    setSearchTerm("");
    setIsSearchOpen(false);
    searchInputRef.current?.focus();
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      if (field === "quantity" || field === "rate" || field === "discountPercent" || field === "gstPercent") {
        const qty = field === "quantity" ? Number(value) : updatedItem.quantity;
        const rate = field === "rate" ? Number(value) : updatedItem.rate;
        const discount = field === "discountPercent" ? Number(value) : updatedItem.discountPercent;
        const gstPercent = field === "gstPercent" ? Number(value) : (updatedItem.gstPercent || 18);
        const grossAmount = qty * rate;
        const discountAmount = (grossAmount * discount) / 100;
        updatedItem.amount = grossAmount - discountAmount;
        updatedItem.gstPercent = gstPercent;
        updatedItem.gstAmount = (updatedItem.amount * gstPercent) / 100;
      }

      return updatedItem;
    });
    onChange(updated);
  };

  const removeItem = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    const renumbered = filtered.map((item, index) => ({
      ...item,
      slNo: index + 1,
    }));
    onChange(renumbered);
    if (expandedItem === id) setExpandedItem(null);
  };

  const handleExcelImport = (importedItems: LineItem[]) => {
    const startNo = items.length + 1;
    const renumberedItems = importedItems.map((item, index) => ({
      ...item,
      slNo: startNo + index,
    }));
    onChange([...items, ...renumberedItems]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen && products.length > 0) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsSearchOpen(true);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, products.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (products[highlightedIndex]) {
          addProductAsItem(products[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsSearchOpen(false);
        break;
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-base font-semibold">Line Items</Label>
          {items.length > 0 && (
            <Badge variant="secondary" className="font-mono">
              {items.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExcelLineItemsUpload onImport={handleExcelImport} />
        </div>
      </div>

      {/* Quick Add Section */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>Quick Add Products</span>
        </div>
        
        <div ref={containerRef} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Type to search products by name, SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => searchTerm && setIsSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 pr-4"
              />
              
              {/* Search Results Dropdown */}
              {isSearchOpen && searchTerm && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
                  <ScrollArea className="max-h-[300px]">
                    {isLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : products.length === 0 ? (
                      <div className="p-4 text-center">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No products found</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {products.map((product, index) => {
                          // Calculate marked up price
                          let displayRate = product.rate;
                          let hasMarkup = false;
                          if (pricingSettings) {
                            const markupPercent = customerType === "dealer" 
                              ? pricingSettings.dealerMarkupPercent 
                              : pricingSettings.customerMarkupPercent;
                            if (markupPercent > 0) {
                              displayRate = product.rate * (1 + markupPercent / 100);
                              hasMarkup = true;
                            }
                          }
                          
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => addProductAsItem(product)}
                              className={cn(
                                "w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-accent transition-colors",
                                index === highlightedIndex && "bg-accent"
                              )}
                            >
                              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Plus className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{product.name}</span>
                                  {product.stock_quantity <= 0 && (
                                    <Badge variant="destructive" className="text-[10px] h-4">
                                      Out of stock
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                  {product.sku && (
                                    <span className="font-mono bg-muted px-1 rounded">{product.sku}</span>
                                  )}
                                  <span>{product.unit}</span>
                                  <span className={product.stock_quantity <= 0 ? "text-destructive" : "text-green-600"}>
                                    {product.stock_quantity} in stock
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-semibold text-primary">{formatCurrency(Math.round(displayRate * 100) / 100)}</div>
                                {hasMarkup && (
                                  <div className="text-xs text-muted-foreground line-through">
                                    {formatCurrency(product.rate)}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Custom</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add custom item</TooltipContent>
            </Tooltip>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Search products to add, or click "Custom" for manual entry. Drag items to reorder.
          </p>
        </div>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium mb-1">No items added yet</p>
          <p className="text-sm text-muted-foreground">
            Use the search above to add products from inventory
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Product</div>
              <div className="col-span-2 text-center">Qty × Rate</div>
              <div className="col-span-2 text-center">GST Amt (18%)</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>
            
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y">
                {items.map((item) => (
                  <SortableLineItem
                    key={item.id}
                    item={item}
                    isExpanded={expandedItem === item.id}
                    onToggleExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    onUpdate={(field, value) => updateItem(item.id, field, value)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
            
            {/* Footer with Subtotal */}
            <div className="px-4 py-3 bg-muted/50 border-t">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  className="gap-2 text-muted-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add another item
                </Button>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground mr-3">Subtotal:</span>
                  <span className="font-semibold text-lg">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeItem ? <DragOverlayItem item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}