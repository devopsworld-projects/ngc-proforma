import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanySettings, useUpdateCompanySettings, uploadCompanyLogo, deleteCompanyLogo } from "@/hooks/useCompanySettings";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Save, Upload, X, Loader2, FileText, ChevronRight, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { DataExportCard } from "@/components/settings/DataExportCard";

const settingsSchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  address_line1: z.string().max(200).optional(),
  address_line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  state_code: z.string().max(10).optional(),
  postal_code: z.string().max(20).optional(),
  phone: z.string().max(500).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  website: z.string().max(255).optional(),
  gstin: z.string().max(20).optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const canEdit = isAdmin === true;

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      state_code: "",
      postal_code: "",
      phone: "",
      email: "",
      website: "",
      gstin: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || "",
        address_line1: settings.address_line1 || "",
        address_line2: settings.address_line2 || "",
        city: settings.city || "",
        state: settings.state || "",
        state_code: settings.state_code || "",
        postal_code: settings.postal_code || "",
        phone: settings.phone?.join(", ") || "",
        email: settings.email || "",
        website: settings.website || "",
        gstin: settings.gstin || "",
      });
      setLogoUrl(settings.logo_url);
    }
  }, [settings, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (logoUrl) {
        await deleteCompanyLogo(logoUrl, user.id);
      }
      const url = await uploadCompanyLogo(file, user.id);
      setLogoUrl(url);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!canEdit) return;
    if (!logoUrl || !user) return;
    try {
      await deleteCompanyLogo(logoUrl, user.id);
      setLogoUrl(null);
      toast.success("Logo removed");
    } catch (error) {
      toast.error("Failed to remove logo");
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!canEdit) {
      toast.error("Only admins can modify settings");
      return;
    }
    try {
      const phoneArray = data.phone
        ? data.phone.split(",").map((p) => p.trim()).filter(Boolean)
        : null;

      await updateSettings.mutateAsync({
        id: settings?.id,
        name: data.name,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        state_code: data.state_code || null,
        postal_code: data.postal_code || null,
        phone: phoneArray,
        email: data.email || null,
        website: data.website || null,
        gstin: data.gstin || null,
        logo_url: logoUrl,
      });

      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  if (isLoading || isAdminLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardContent className="py-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold">Company Settings</h2>
              <p className="text-muted-foreground">
                {canEdit 
                  ? "Manage your business details that appear on invoices" 
                  : "View business details (admin access required to edit)"}
              </p>
            </div>
            {canEdit && (
              <Button type="submit" disabled={updateSettings.isPending} className="gap-2">
                {updateSettings.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Settings
              </Button>
            )}
          </div>

          {!canEdit && (
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Settings are read-only. Only administrators can modify company settings.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Logo Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Logo</CardTitle>
                <CardDescription>
                  Upload your logo (max 2MB, PNG/JPG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {logoUrl ? (
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Company logo"
                        className="w-32 h-32 object-contain rounded-lg border bg-white"
                      />
                      {canEdit && (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {canEdit && (
                    <>
                      <Label
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                      </Label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Business Information</CardTitle>
                <CardDescription>
                  Your company details for invoices and documents
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company Name" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input placeholder="22AAAAA0000A1Z5" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@company.com" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Numbers</FormLabel>
                      <FormControl>
                        <Input placeholder="Comma separated: 9876543210, 1234567890" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="www.company.com" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address Section */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Business Address</CardTitle>
                <CardDescription>
                  Your registered business address
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="address_line1"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Building, floor, etc." {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 37" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="518001" {...field} readOnly={!canEdit} className={!canEdit ? "bg-muted" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* PDF Template Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Template
                </CardTitle>
                <CardDescription>
                  Customize invoice PDF appearance, colors, and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/settings/pdf-template">
                    Edit PDF Template
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Data Export Section */}
            <DataExportCard />
          </div>
        </form>
      </Form>
    </AppLayout>
  );
}
