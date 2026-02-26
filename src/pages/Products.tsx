import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, MoreHorizontal, Trash2, Filter, Pencil, Eye, User } from "lucide-react";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useIsAdmin } from "@/hooks/useAdmin";
import { ExcelUploadDialog } from "@/components/products/ExcelUploadDialog";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductViewDialog } from "@/components/products/ProductViewDialog";
import { formatCurrency } from "@/lib/invoice-utils";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SortableTableHead, SortConfig } from "@/components/ui/sortable-table-head";

const ITEMS_PER_PAGE = 15;

type ProductSortKey = "name" | "model_spec" | "sku" | "stock_quantity" | "rate" | "gst_percent";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig<ProductSortKey>>({
    key: null,
    direction: null,
  });
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const { data: isAdmin } = useIsAdmin();
  const handleSort = (key: ProductSortKey) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [products]);

  // Derive unique user options for admin filter
  const userOptions = useMemo(() => {
    if (!isAdmin || !products) return [];
    const userMap = new Map<string, string>();
    products.forEach((p) => {
      if (p.user_id && p.profiles?.full_name) {
        userMap.set(p.user_id, p.profiles.full_name);
      }
    });
    return Array.from(userMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [isAdmin, products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((product) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term);
      
      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "uncategorized" && !product.category) ||
        product.category === categoryFilter;

      const matchesUser =
        userFilter === "all" ||
        product.user_id === userFilter;

      return matchesSearch && matchesCategory && matchesUser;
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        let comparison = 0;
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        } else {
          comparison = (aVal as number) - (bVal as number);
        }
        
        return sortConfig.direction === "desc" ? -comparison : comparison;
      });
    }

    return result;
  }, [products, searchTerm, categoryFilter, userFilter, sortConfig]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, userFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
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
              <Badge variant="secondary">{filteredAndSortedProducts.length} products</Badge>
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
              {isAdmin && userOptions.length > 0 && (
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Users</SelectItem>
                    {userOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading products...</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No products found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm ? "Try a different search term" : "Import products from Excel to get started"}
                </p>
                {!searchTerm && <ExcelUploadDialog />}
              </div>
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Image</TableHead>
                        <SortableTableHead<ProductSortKey>
                          sortKey="name"
                          currentSort={sortConfig}
                          onSort={handleSort}
                        >
                          Name
                        </SortableTableHead>
                        <SortableTableHead<ProductSortKey>
                          sortKey="model_spec"
                          currentSort={sortConfig}
                          onSort={handleSort}
                        >
                          Model/Spec
                        </SortableTableHead>
                        <SortableTableHead<ProductSortKey>
                          sortKey="sku"
                          currentSort={sortConfig}
                          onSort={handleSort}
                        >
                          SKU
                        </SortableTableHead>
                        <TableHead>Added By</TableHead>
                        <SortableTableHead<ProductSortKey>
                          sortKey="stock_quantity"
                          currentSort={sortConfig}
                          onSort={handleSort}
                          className="text-right"
                        >
                          Stock
                        </SortableTableHead>
                        <SortableTableHead<ProductSortKey>
                          sortKey="rate"
                          currentSort={sortConfig}
                          onSort={handleSort}
                          className="text-right"
                        >
                          Rate
                        </SortableTableHead>
                        <SortableTableHead<ProductSortKey>
                          sortKey="gst_percent"
                          currentSort={sortConfig}
                          onSort={handleSort}
                          className="text-right"
                        >
                          GST %
                        </SortableTableHead>
                        <TableHead>Size/Length</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.map((product) => (
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
                            {product.size_label ? (
                              <Badge variant="secondary" className="text-xs">
                                {product.size_label}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
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

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProducts.length)} of{" "}
                      {filteredAndSortedProducts.length} products
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {getPageNumbers().map((page, idx) =>
                          page === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${idx}`}>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}