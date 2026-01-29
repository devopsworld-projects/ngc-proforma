import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { formatCurrency } from "@/lib/invoice-utils";
import { ReactNode } from "react";

interface ProductViewDialogProps {
  product: Product;
  trigger?: ReactNode;
}

export function ProductViewDialog({ product, trigger }: ProductViewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Image */}
          <div className="flex justify-center">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="h-32 w-32 object-cover rounded-lg border"
              />
            ) : (
              <div className="h-32 w-32 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {product.sku && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">SKU</p>
                  <Badge variant="outline" className="font-mono mt-1">{product.sku}</Badge>
                </div>
              )}
              {product.category && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                  <Badge variant="secondary" className="mt-1">{product.category}</Badge>
                </div>
              )}
              {product.model_spec && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Model/Spec</p>
                  <p className="text-sm font-medium mt-1">{product.model_spec}</p>
                </div>
              )}
              {product.hsn_code && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">HSN Code</p>
                  <p className="text-sm font-medium mt-1">{product.hsn_code}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rate</span>
              <span className="text-lg font-bold">{formatCurrency(product.rate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">GST</span>
              <span className="font-medium">{product.gst_percent ?? 18}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Stock</span>
              <span className={`font-medium ${product.stock_quantity <= 0 ? "text-destructive" : product.stock_quantity <= 10 ? "text-amber-600" : "text-green-600"}`}>
                {product.stock_quantity} {product.unit}
              </span>
            </div>
          </div>

          {/* Added By */}
          {product.profiles?.full_name && (
            <div className="text-sm text-muted-foreground text-center">
              Added by: <span className="font-medium">{product.profiles.full_name}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
