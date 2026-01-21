import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";

export interface LineItem {
  id: string;
  slNo: number;
  description: string;
  serialNumbers: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  amount: number;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      slNo: items.length + 1,
      description: "",
      serialNumbers: "",
      quantity: 1,
      unit: "NOS",
      rate: 0,
      discountPercent: 0,
      amount: 0,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      // Recalculate amount when quantity, rate, or discount changes
      if (field === "quantity" || field === "rate" || field === "discountPercent") {
        const qty = field === "quantity" ? Number(value) : updatedItem.quantity;
        const rate = field === "rate" ? Number(value) : updatedItem.rate;
        const discount = field === "discountPercent" ? Number(value) : updatedItem.discountPercent;
        const grossAmount = qty * rate;
        const discountAmount = (grossAmount * discount) / 100;
        updatedItem.amount = grossAmount - discountAmount;
      }

      return updatedItem;
    });
    onChange(updated);
  };

  const removeItem = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    // Renumber items
    const renumbered = filtered.map((item, index) => ({
      ...item,
      slNo: index + 1,
    }));
    onChange(renumbered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Line Items</Label>
        <Button type="button" size="sm" onClick={addItem} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">No items added yet</p>
            <Button type="button" variant="outline" onClick={addItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{item.slNo}</span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                      <Label className="text-xs text-muted-foreground">Description *</Label>
                      <Input
                        placeholder="Product/Service description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Quantity *</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                          className="w-20"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Rate (₹) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Rate"
                        value={item.rate || ""}
                        onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <Label className="text-xs text-muted-foreground">Serial Numbers (comma separated)</Label>
                      <Input
                        placeholder="SN001, SN002, SN003..."
                        value={item.serialNumbers}
                        onChange={(e) => updateItem(item.id, "serialNumbers", e.target.value)}
                        className="mt-1 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Discount %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                        value={item.discountPercent || ""}
                        onChange={(e) => updateItem(item.id, "discountPercent", parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <div className="mt-1 h-10 px-3 flex items-center bg-muted rounded-md">
                        <span className="font-semibold">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end">
          <Badge variant="secondary" className="text-sm py-1.5 px-3">
            {items.length} item{items.length > 1 ? "s" : ""} • Subtotal: {formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}
          </Badge>
        </div>
      )}
    </div>
  );
}
