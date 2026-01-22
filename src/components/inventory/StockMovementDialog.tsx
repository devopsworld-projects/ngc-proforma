import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCreateStockMovement } from "@/hooks/useInventory";
import { toast } from "sonner";

interface StockMovementDialogProps {
  productId?: string;
  trigger?: React.ReactNode;
}

export function StockMovementDialog({ productId, trigger }: StockMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useProducts();
  const createMovement = useCreateStockMovement();
  
  const [formData, setFormData] = useState({
    product_id: productId || "",
    movement_type: "in" as "in" | "out" | "adjustment",
    quantity: "",
    serial_numbers: "",
    reference_type: "manual",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      product_id: productId || "",
      movement_type: "in",
      quantity: "",
      serial_numbers: "",
      reference_type: "manual",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id) {
      toast.error("Please select a product");
      return;
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const serialNumbers = formData.serial_numbers
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      await createMovement.mutateAsync({
        product_id: formData.product_id,
        movement_type: formData.movement_type,
        quantity: parseFloat(formData.quantity),
        serial_numbers: serialNumbers,
        reference_type: formData.reference_type,
        reference_id: null,
        notes: formData.notes || null,
      });
      toast.success(`Stock ${formData.movement_type === "in" ? "added" : "removed"} successfully`);
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to record stock movement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Stock Movement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.movement_type === "in" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData(prev => ({ ...prev, movement_type: "in" }))}
            >
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Stock In
            </Button>
            <Button
              type="button"
              variant={formData.movement_type === "out" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFormData(prev => ({ ...prev, movement_type: "out" }))}
            >
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              Stock Out
            </Button>
          </div>

          {!productId && (
            <div>
              <Label htmlFor="product">Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.sku ? `(${product.sku})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label htmlFor="reference_type">Reference Type</Label>
              <Select
                value={formData.reference_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reference_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="manual">Manual Adjustment</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="return">Customer Return</SelectItem>
                  <SelectItem value="damage">Damaged/Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="serial_numbers">Serial Numbers (comma-separated)</Label>
            <Textarea
              id="serial_numbers"
              value={formData.serial_numbers}
              onChange={(e) => setFormData(prev => ({ ...prev, serial_numbers: e.target.value }))}
              placeholder="SN001, SN002, SN003..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMovement.isPending}>
              {createMovement.isPending ? "Recording..." : "Record Movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
