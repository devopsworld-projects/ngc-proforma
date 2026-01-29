import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Palette, LayoutGrid, FileText, Building2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { usePdfTemplateSettings, useUpdatePdfTemplateSettings, defaultPdfTemplateSettings, PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
import { PdfPreviewMini } from "@/components/pdf/PdfPreviewMini";

export default function PdfTemplateEditor() {
  const { data: savedSettings, isLoading } = usePdfTemplateSettings();
  const updateSettings = useUpdatePdfTemplateSettings();
  
  const [settings, setSettings] = useState<Partial<PdfTemplateSettings>>({
    ...defaultPdfTemplateSettings,
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        ...settings,
        id: savedSettings?.id,
      });
      toast.success("Template settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  const handleReset = () => {
    setSettings({ ...defaultPdfTemplateSettings, id: savedSettings?.id });
    toast.info("Settings reset to defaults (not saved yet)");
  };

  const updateField = <K extends keyof PdfTemplateSettings>(
    field: K,
    value: PdfTemplateSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-[600px]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">PDF Template Editor</h1>
            <p className="text-muted-foreground">
              Customize the appearance and content of your invoice PDFs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateSettings.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors" className="text-xs sm:text-sm">
                  <Palette className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Colors</span>
                </TabsTrigger>
                <TabsTrigger value="sections" className="text-xs sm:text-sm">
                  <LayoutGrid className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sections</span>
                </TabsTrigger>
                <TabsTrigger value="terms" className="text-xs sm:text-sm">
                  <FileText className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Terms</span>
                </TabsTrigger>
                <TabsTrigger value="bank" className="text-xs sm:text-sm">
                  <Building2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Bank</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Color Settings</CardTitle>
                    <CardDescription>
                      Customize the colors of your PDF template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center gap-4">
                        <Label className="w-40">Primary Color</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="color"
                            value={settings.primary_color || "#294172"}
                            onChange={(e) => updateField("primary_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={settings.primary_color || "#294172"}
                            onChange={(e) => updateField("primary_color", e.target.value)}
                            className="flex-1"
                            placeholder="#294172"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Label className="w-40">Secondary Color</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="color"
                            value={settings.secondary_color || "#3b82f6"}
                            onChange={(e) => updateField("secondary_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={settings.secondary_color || "#3b82f6"}
                            onChange={(e) => updateField("secondary_color", e.target.value)}
                            className="flex-1"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Label className="w-40">Header Text Color</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="color"
                            value={settings.header_text_color || "#ffffff"}
                            onChange={(e) => updateField("header_text_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={settings.header_text_color || "#ffffff"}
                            onChange={(e) => updateField("header_text_color", e.target.value)}
                            className="flex-1"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Label className="w-40">Table Text Color</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="color"
                            value={settings.table_text_color || "#1f2937"}
                            onChange={(e) => updateField("table_text_color", e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={settings.table_text_color || "#1f2937"}
                            onChange={(e) => updateField("table_text_color", e.target.value)}
                            className="flex-1"
                            placeholder="#1f2937"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color preview */}
                    <div className="mt-6 p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-3">Preview</p>
                      <div
                        className="h-10 rounded flex items-center px-4"
                        style={{ backgroundColor: settings.primary_color || "#294172" }}
                      >
                        <span style={{ color: settings.header_text_color || "#ffffff" }} className="font-bold">
                          Header Preview
                        </span>
                      </div>
                      <div
                        className="h-8 rounded mt-2 flex items-center px-4"
                        style={{ backgroundColor: settings.secondary_color || "#3b82f6" }}
                      >
                        <span className="text-white text-sm font-medium">Accent Bar</span>
                      </div>
                      <div className="h-8 rounded mt-2 flex items-center px-4 bg-muted/30 border">
                        <span style={{ color: settings.table_text_color || "#1f2937" }} className="text-sm">
                          Table Item Text
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sections" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section Visibility</CardTitle>
                    <CardDescription>
                      Toggle which sections appear in your PDF
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Company Logo</Label>
                          <p className="text-sm text-muted-foreground">Show logo in header</p>
                        </div>
                        <Switch
                          checked={settings.show_logo ?? true}
                          onCheckedChange={(v) => updateField("show_logo", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>GSTIN in Header</Label>
                          <p className="text-sm text-muted-foreground">Display company GSTIN</p>
                        </div>
                        <Switch
                          checked={settings.show_gstin_header ?? true}
                          onCheckedChange={(v) => updateField("show_gstin_header", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Contact Details</Label>
                          <p className="text-sm text-muted-foreground">Phone, email, website</p>
                        </div>
                        <Switch
                          checked={settings.show_contact_header ?? true}
                          onCheckedChange={(v) => updateField("show_contact_header", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Shipping Address</Label>
                          <p className="text-sm text-muted-foreground">Show if different from billing</p>
                        </div>
                        <Switch
                          checked={settings.show_shipping_address ?? false}
                          onCheckedChange={(v) => updateField("show_shipping_address", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Serial Numbers</Label>
                          <p className="text-sm text-muted-foreground">Show in item descriptions</p>
                        </div>
                        <Switch
                          checked={settings.show_serial_numbers ?? true}
                          onCheckedChange={(v) => updateField("show_serial_numbers", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Discount Column</Label>
                          <p className="text-sm text-muted-foreground">Show discount in table</p>
                        </div>
                        <Switch
                          checked={settings.show_discount_column ?? true}
                          onCheckedChange={(v) => updateField("show_discount_column", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Terms & Conditions</Label>
                          <p className="text-sm text-muted-foreground">Show at bottom</p>
                        </div>
                        <Switch
                          checked={settings.show_terms ?? true}
                          onCheckedChange={(v) => updateField("show_terms", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Signature Section</Label>
                          <p className="text-sm text-muted-foreground">Authorized signatory line</p>
                        </div>
                        <Switch
                          checked={settings.show_signature ?? true}
                          onCheckedChange={(v) => updateField("show_signature", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Amount in Words</Label>
                          <p className="text-sm text-muted-foreground">Show total in words</p>
                        </div>
                        <Switch
                          checked={settings.show_amount_words ?? true}
                          onCheckedChange={(v) => updateField("show_amount_words", v)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                    <CardDescription>
                      Customize the terms shown at the bottom of invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Term 1</Label>
                      <Input
                        value={settings.terms_line1 || ""}
                        onChange={(e) => updateField("terms_line1", e.target.value)}
                        placeholder="Goods once sold will not be taken back."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Term 2</Label>
                      <Input
                        value={settings.terms_line2 || ""}
                        onChange={(e) => updateField("terms_line2", e.target.value)}
                        placeholder="Subject to local jurisdiction only."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Term 3</Label>
                      <Input
                        value={settings.terms_line3 || ""}
                        onChange={(e) => updateField("terms_line3", e.target.value)}
                        placeholder="E&OE - Errors and Omissions Excepted."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Custom Footer Text</Label>
                      <Input
                        value={settings.custom_footer_text || ""}
                        onChange={(e) => updateField("custom_footer_text", e.target.value || null)}
                        placeholder="e.g., Thank you for your business!"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bank" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bank Details</CardTitle>
                    <CardDescription>
                      Add payment information to your invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={settings.bank_name || ""}
                        onChange={(e) => updateField("bank_name", e.target.value || null)}
                        placeholder="e.g., State Bank of India"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        value={settings.bank_account_no || ""}
                        onChange={(e) => updateField("bank_account_no", e.target.value || null)}
                        placeholder="e.g., 1234567890"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>IFSC Code</Label>
                      <Input
                        value={settings.bank_ifsc || ""}
                        onChange={(e) => updateField("bank_ifsc", e.target.value || null)}
                        placeholder="e.g., SBIN0001234"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Branch</Label>
                      <Input
                        value={settings.bank_branch || ""}
                        onChange={(e) => updateField("bank_branch", e.target.value || null)}
                        placeholder="e.g., Main Branch, Mumbai"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
                <CardDescription>
                  See how your invoice will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PdfPreviewMini settings={settings as PdfTemplateSettings} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
