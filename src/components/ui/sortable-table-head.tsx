import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T extends string> {
  key: T | null;
  direction: SortDirection;
}

interface SortableTableHeadProps<T extends string> {
  children: React.ReactNode;
  sortKey: T;
  currentSort: SortConfig<T>;
  onSort: (key: T) => void;
  className?: string;
}

export function SortableTableHead<T extends string>({
  children,
  sortKey,
  currentSort,
  onSort,
  className,
}: SortableTableHeadProps<T>) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        <span className="text-muted-foreground">
          {direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
          )}
        </span>
      </div>
    </TableHead>
  );
}

export function useSorting<T extends string>(
  initialKey: T | null = null,
  initialDirection: SortDirection = null
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialKey,
    direction: initialDirection,
  });

  const handleSort = (key: T) => {
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

  return { sortConfig, handleSort };
}

// Need to import useState for the hook
import { useState } from "react";
