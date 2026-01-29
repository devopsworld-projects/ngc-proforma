import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, MoreHorizontal, Trash2, Filter, Pencil, Eye } from "lucide-react";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { ExcelUploadDialog } from "@/components/products/ExcelUploadDialog";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductViewDialog } from "@/components/products/ProductViewDialog";
import { formatCurrency } from "@/lib/invoice-utils";
import { toast } from "sonner";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term);
      
      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "uncategorized" && !product.category) ||
        product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <div className="flex items-center gap-2">
            <ProductFormDialog />
            <ExcelUploadDialog />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Product Inventory</CardTitle>
              <Badge variant="secondary">{products.length} products</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No products found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm ? "Try a different search term" : "Import products from Excel to get started"}
                </p>
                {!searchTerm && <ExcelUploadDialog />}
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Model/Spec</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">GST %</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.model_spec ? (
                            <span className="text-sm">{product.model_spec}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.sku ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {product.sku}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {product.profiles?.full_name || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={product.stock_quantity <= 0 ? "text-destructive font-medium" : product.stock_quantity <= 10 ? "text-amber-600 font-medium" : ""}>
                            {product.stock_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.gst_percent != null ? `${product.gst_percent}%` : "18%"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover z-50">
                              <DropdownMenuItem asChild>
                                <ProductViewDialog
                                  product={product}
                                  trigger={
                                    <button className="flex w-full items-center px-2 py-1.5 text-sm">
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </button>
                                  }
                                />
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <ProductFormDialog
                                  product={product}
                                  trigger={
                                    <button className="flex w-full items-center px-2 py-1.5 text-sm">
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </button>
                                  }
                                />
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(product.id, product.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
