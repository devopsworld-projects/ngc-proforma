import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Archive, CalendarIcon, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function RevenueManagementCard() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Fetch current baseline date
  const { data: revenueSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["revenueSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Delete all invoices mutation
  const deleteAllInvoices = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_delete_all_invoices");
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deleted_count} invoices`);
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete invoices");
    },
  });

  // Archive all invoices mutation
  const archiveAllInvoices = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_archive_all_invoices");
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Archived ${data.archived_count} invoices`);
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to archive invoices");
    },
  });

  // Set baseline date mutation
  const setBaseline = useMutation({
    mutationFn: async (date: Date) => {
      const { data, error } = await (supabase.rpc as any)("admin_set_revenue_baseline", {
        baseline: date.toISOString(),
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Revenue baseline set successfully");
      queryClient.invalidateQueries({ queryKey: ["revenueSettings"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
      setSelectedDate(undefined);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to set baseline");
    },
  });

  // Clear baseline date mutation  
  const clearBaseline = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_set_revenue_baseline", {
        baseline: null,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Revenue baseline cleared");
      queryClient.invalidateQueries({ queryKey: ["revenueSettings"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to clear baseline");
    },
  });

  const handleSetBaseline = () => {
    if (selectedDate) {
      setBaseline.mutate(selectedDate);
    }
  };

  const currentBaseline = revenueSettings?.baseline_date 
    ? new Date(revenueSettings.baseline_date) 
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Revenue Management
        </CardTitle>
        <CardDescription>
          Reset or manage how revenue is calculated across all users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Baseline Status */}
        {currentBaseline && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Revenue Baseline Active
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Only counting quotations from {format(currentBaseline, "MMMM d, yyyy")} onwards
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => clearBaseline.mutate()}
              disabled={clearBaseline.isPending}
            >
              {clearBaseline.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear
                </>
              )}
            </Button>
          </div>
        )}

        {/* Option 1: Set Baseline Date */}
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm">Set Revenue Baseline</h4>
            <p className="text-xs text-muted-foreground">
              Only count revenue from a specific date onwards (non-destructive)
            </p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleSetBaseline}
              disabled={!selectedDate || setBaseline.isPending}
            >
              {setBaseline.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Set Baseline"
              )}
            </Button>
          </div>
        </div>

        {/* Option 2: Archive All Invoices */}
        <div className="space-y-3 pt-3 border-t">
          <div>
            <h4 className="font-medium text-sm flex items-center gap-2">
              Archive All Quotations
              <Badge variant="secondary">Reversible</Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              Mark all quotations as cancelled - they won't count toward revenue
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                <Archive className="h-4 w-4 mr-2" />
                Archive All Quotations
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive All Quotations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark all quotations across all users as "cancelled". 
                  They will no longer count toward revenue statistics.
                  <br /><br />
                  This action can be manually reversed by changing quotation statuses individually.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => archiveAllInvoices.mutate()}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {archiveAllInvoices.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Archive All"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Option 3: Delete All Invoices */}
        <div className="space-y-3 pt-3 border-t">
          <div>
            <h4 className="font-medium text-sm flex items-center gap-2 text-destructive">
              Delete All Quotations
              <Badge variant="destructive">Permanent</Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              Permanently delete all quotations and their line items - this cannot be undone
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Quotations
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  ⚠️ Delete All Quotations Permanently?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This will <strong>permanently delete</strong> all quotations and their line items across ALL users.</p>
                  <p className="font-semibold text-destructive">This action CANNOT be undone.</p>
                  <p>Consider using "Archive" or "Set Baseline" options instead if you want to preserve the data.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAllInvoices.mutate()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteAllInvoices.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete All Permanently"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
