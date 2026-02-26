import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Search, X, Filter, ArrowUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SortConfig } from "@/components/ui/sortable-table-head";
import { InvoiceSortKey } from "@/hooks/useInvoiceFilters";

export interface InvoiceFiltersState {
  search: string;
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  amountMin: string;
  amountMax: string;
  userId: string;
}

export interface UserOption {
  id: string;
  name: string;
}

interface InvoiceFiltersProps {
  filters: InvoiceFiltersState;
  onFiltersChange: (filters: InvoiceFiltersState) => void;
  onClearFilters: () => void;
  sortConfig?: SortConfig<InvoiceSortKey>;
  onSort?: (key: InvoiceSortKey) => void;
  userOptions?: UserOption[];
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions: { value: InvoiceSortKey; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "invoice_no", label: "Proforma #" },
  { value: "grand_total", label: "Amount" },
  { value: "status", label: "Status" },
];

export function InvoiceFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  sortConfig,
  onSort,
  userOptions,
}: InvoiceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [
    filters.status !== "all",
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
    filters.userId !== "all",
  ].filter(Boolean).length;

  const updateFilter = <K extends keyof InvoiceFiltersState>(
    key: K,
    value: InvoiceFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by proforma number or customer..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* User Filter (admin only) */}
        {userOptions && userOptions.length > 0 && (
          <Select
            value={filters.userId}
            onValueChange={(value) => updateFilter("userId", value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Users</SelectItem>
              {userOptions.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort By */}
        {sortConfig && onSort && (
          <Select
            value={sortConfig.key ? `${sortConfig.key}-${sortConfig.direction}` : "date-desc"}
            onValueChange={(value) => {
              const [key] = value.split("-") as [InvoiceSortKey];
              onSort(key);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {sortOptions.map((option) => (
                <SelectItem key={`${option.value}-asc`} value={`${option.value}-asc`}>
                  {option.label} ↑
                </SelectItem>
              ))}
              {sortOptions.map((option) => (
                <SelectItem key={`${option.value}-desc`} value={`${option.value}-desc`}>
                  {option.label} ↓
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {(filters.search || activeFilterCount > 0) && (
          <Button variant="ghost" onClick={onClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? (
                      format(filters.dateFrom, "dd MMM yyyy")
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilter("dateFrom", date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? (
                      format(filters.dateTo, "dd MMM yyyy")
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilter("dateTo", date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount Min */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Amount (₹)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.amountMin}
                onChange={(e) => updateFilter("amountMin", e.target.value)}
              />
            </div>

            {/* Amount Max */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Amount (₹)</label>
              <Input
                type="number"
                placeholder="No limit"
                value={filters.amountMax}
                onChange={(e) => updateFilter("amountMax", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
