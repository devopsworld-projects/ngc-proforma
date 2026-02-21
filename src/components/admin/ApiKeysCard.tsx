import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Key, Plus, Trash2, Copy, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ngc_";
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function ApiKeysCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createKey = useMutation({
    mutationFn: async (label: string) => {
      if (!user) throw new Error("Not authenticated");
      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);
      const keyPrefix = rawKey.slice(0, 8);

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        label: label || "Default",
      });
      if (error) throw error;
      return rawKey;
    },
    onSuccess: (rawKey) => {
      setNewKey(rawKey);
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const baseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/external-api`;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Generate API keys to access products, invoices, and customers from external applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Key label (e.g. 'Website Integration')"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="max-w-xs"
            />
            <Button
              onClick={() => createKey.mutate(label)}
              disabled={createKey.isPending}
            >
              {createKey.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Key
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !apiKeys || apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No API keys created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.label}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {key.key_prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.last_used_at
                        ? format(new Date(key.last_used_at), "MMM d, yyyy HH:mm")
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(key.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this API key. Any applications using it will lose access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeKey.mutate(key.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">API Base URL</p>
            <code className="text-xs bg-background px-2 py-1 rounded block break-all border">
              {baseUrl}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Use the <code className="bg-background px-1 rounded">x-api-key</code> header to authenticate. 
              Endpoints: <code>/products</code>, <code>/invoices</code>, <code>/customers</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy this key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded break-all border">
                {newKey}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Store this key securely. It provides full read & write access to your data.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
