import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, X, Image as ImageIcon } from "lucide-react";
import { useCreateProduct, useUpdateProduct, Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency, calculateGstBreakup, roundToTwo } from "@/lib/invoice-utils";

interface ProductFormDialogProps {
  product?: Product;
  trigger?: React.ReactNode;
}

export function ProductFormDialog({ product, trigger }: ProductFormDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    sku: product?.sku || "",
    unit: product?.unit || "NOS",
    rate: product?.rate?.toString() || "0",
    hsn_code: product?.hsn_code || "",
    category: product?.category || "",
    stock_quantity: product?.stock_quantity?.toString() || "0",
    model_spec: product?.model_spec || "",
    gst_percent: product?.gst_percent?.toString() || "18",
    image_url: product?.image_url || "",
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;

  // Reverse-calculate GST from inclusive price
  // The entered rate IS the GST-inclusive price
  const inclusiveRate = parseFloat(formData.rate) || 0;
  const qty = parseInt(formData.stock_quantity) || 0;
  const gstPercent = parseFloat(formData.gst_percent) || 0;
  
  // Calculate base price and GST from inclusive price
  const { basePrice, gstAmount: gstPerUnit } = calculateGstBreakup(inclusiveRate, gstPercent);
  const totalBasePrice = roundToTwo(basePrice * qty);
  const totalGstAmount = roundToTwo(gstPerUnit * qty);
  const totalInclusive = roundToTwo(inclusiveRate * qty);

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
      model_spec: "",
      gst_percent: "18",
      image_url: "",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
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
      model_spec: formData.model_spec.trim() || null,
      gst_percent: parseFloat(formData.gst_percent) || 18,
      image_url: formData.image_url || null,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label>Product Image</Label>
            <div className="mt-2">
              {formData.image_url ? (
                <div className="relative inline-block">
                  <img
                    src={formData.image_url}
                    alt="Product"
                    className="h-24 w-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="h-24 w-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Upload</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

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
            
            <div className="col-span-2">
              <Label htmlFor="model_spec">Model / Specification</Label>
              <Input
                id="model_spec"
                value={formData.model_spec}
                onChange={(e) => handleChange("model_spec", e.target.value)}
                placeholder="e.g., i5-12400, 16GB RAM, 512GB SSD"
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
              <Label htmlFor="stock_quantity">Quantity (Stock)</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange("stock_quantity", e.target.value)}
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
              <Label htmlFor="rate">Unit Price (₹) <span className="text-xs text-muted-foreground">(GST Inclusive)</span></Label>
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
              <Label htmlFor="gst_percent">GST %</Label>
              <Input
                id="gst_percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.gst_percent}
                onChange={(e) => handleChange("gst_percent", e.target.value)}
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
          </div>

          {/* Calculated Fields - Reverse GST Breakup */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Price Breakup (per unit × {qty} units)</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Price (Taxable):</span>
              <span className="font-medium">{formatCurrency(totalBasePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST @ {gstPercent}%:</span>
              <span className="font-medium">{formatCurrency(totalGstAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="text-muted-foreground">Total (Inclusive):</span>
              <span className="font-bold">{formatCurrency(totalInclusive)}</span>
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
