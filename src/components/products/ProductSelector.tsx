import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, Plus } from "lucide-react";
import { useSearchProducts, Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface ProductSelectorProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
}

export function ProductSelector({ onSelect, placeholder = "Search products...", className }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: products = [], isLoading } = useSearchProducts(searchTerm);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [products]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
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
          handleSelect(products[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearchTerm("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          <ScrollArea className="max-h-[280px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "No products found" : "No products in inventory"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Import products using Excel upload
                </p>
              </div>
            ) : (
              <div className="py-1">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className={cn(
                      "w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-accent transition-colors",
                      index === highlightedIndex && "bg-accent"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{product.name}</span>
                        {product.category && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {product.sku && (
                          <Badge variant="outline" className="text-[10px] h-4 font-mono">
                            {product.sku}
                          </Badge>
                        )}
                        <span>{product.unit}</span>
                        {product.hsn_code && <span>HSN: {product.hsn_code}</span>}
                        <span className={product.stock_quantity <= 0 ? "text-destructive" : "text-green-600"}>
                          Stock: {product.stock_quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold">₹{product.rate.toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
