import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCreateProduct, useUpdateProduct, Product } from "@/hooks/useProducts";
import { toast } from "sonner";

interface ProductFormDialogProps {
  product?: Product;
  trigger?: React.ReactNode;
}

export function ProductFormDialog({ product, trigger }: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    sku: product?.sku || "",
    unit: product?.unit || "NOS",
    rate: product?.rate?.toString() || "0",
    hsn_code: product?.hsn_code || "",
    category: product?.category || "",
    stock_quantity: product?.stock_quantity?.toString() || "0",
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      unit: "NOS",
      rate: "0",
      hsn_code: "",
      category: "",
      stock_quantity: "0",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      sku: formData.sku.trim() || null,
      unit: formData.unit || "NOS",
      rate: parseFloat(formData.rate) || 0,
      hsn_code: formData.hsn_code.trim() || null,
      category: formData.category.trim() || null,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      is_active: true,
    };

    try {
      if (isEditing) {
        await updateProduct.mutateAsync({ id: product.id, ...productData });
        toast.success("Product updated");
      } else {
        await createProduct.mutateAsync(productData);
        toast.success("Product created");
        resetForm();
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="e.g., PRD-001"
              />
            </div>
            
            <div>
              <Label htmlFor="hsn_code">HSN Code</Label>
              <Input
                id="hsn_code"
                value={formData.hsn_code}
                onChange={(e) => handleChange("hsn_code", e.target.value)}
                placeholder="e.g., 8471"
              />
            </div>
            
            <div>
              <Label htmlFor="rate">Rate (₹)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.rate}
                onChange={(e) => handleChange("rate", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="e.g., NOS, KG, PCS"
              />
            </div>
            
            <div>
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange("stock_quantity", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="e.g., Electronics"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Product description"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
              {isEditing ? "Update" : "Create"} Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
