import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import { useCreateProduct } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency, calculateGstBreakup, roundToTwo } from "@/lib/invoice-utils";

const UNIT_OPTIONS = [
  { value: "NOS", label: "NOS (Numbers)" },
  { value: "MTR", label: "MTR (Meters)" },
  { value: "KG", label: "KG (Kilograms)" },
  { value: "LTR", label: "LTR (Liters)" },
  { value: "PCS", label: "PCS (Pieces)" },
  { value: "BOX", label: "BOX (Boxes)" },
  { value: "SET", label: "SET (Sets)" },
  { value: "ROLL", label: "ROLL (Rolls)" },
  { value: "PAIR", label: "PAIR (Pairs)" },
  { value: "SQM", label: "SQM (Square Meters)" },
];

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProduct = useCreateProduct();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
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
    size_label: "",
  });

  const inclusiveRate = parseFloat(formData.rate) || 0;
  const qty = parseInt(formData.stock_quantity) || 0;
  const gstPercent = parseFloat(formData.gst_percent) || 0;
  const { basePrice, gstAmount: gstPerUnit } = calculateGstBreakup(inclusiveRate, gstPercent);
  const totalBasePrice = roundToTwo(basePrice * qty);
  const totalGstAmount = roundToTwo(gstPerUnit * qty);
  const totalInclusive = roundToTwo(inclusiveRate * qty);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!formData.category.trim()) {
      toast.error("Category is required");
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
      size_label: formData.size_label.trim() || null,
      is_active: true,
    };

    try {
      await createProduct.mutateAsync(productData);
      toast.success("Product created");
      navigate("/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold">Add New Product</h1>
            <p className="text-muted-foreground">Add a product to your inventory</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
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
                        loading="lazy"
                        decoding="async"
                        width={96}
                        height={96}
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
                  <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter product name" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Product description" rows={2} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="model_spec">Model / Specification</Label>
                  <Input id="model_spec" value={formData.model_spec} onChange={(e) => handleChange("model_spec", e.target.value)} placeholder="e.g., i5-12400, 16GB RAM, 512GB SSD" />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" value={formData.sku} onChange={(e) => handleChange("sku", e.target.value)} placeholder="e.g., PRD-001" />
                </div>
                <div>
                  <Label htmlFor="hsn_code">HSN Code</Label>
                  <Input id="hsn_code" value={formData.hsn_code} onChange={(e) => handleChange("hsn_code", e.target.value)} placeholder="e.g., 8471" />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Quantity (Stock)</Label>
                  <Input id="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={(e) => handleChange("stock_quantity", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rate">Unit Price (₹) <span className="text-xs text-muted-foreground">(GST Inclusive)</span></Label>
                  <Input id="rate" type="number" min="0" step="0.01" value={formData.rate} onChange={(e) => handleChange("rate", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="gst_percent">GST %</Label>
                  <Input id="gst_percent" type="number" min="0" max="100" step="0.01" value={formData.gst_percent} onChange={(e) => handleChange("gst_percent", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input id="category" value={formData.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="e.g., Electronics" />
                </div>
                <div>
                  <Label htmlFor="size_label">Size/Length</Label>
                  <Input id="size_label" value={formData.size_label} onChange={(e) => handleChange("size_label", e.target.value)} placeholder="e.g., 500 MTR, 2.5mm" />
                </div>
              </div>

              {/* Price Breakup */}
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

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProduct.isPending}>
                  Create Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
