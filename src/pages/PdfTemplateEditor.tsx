import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, LayoutGrid, FileText, Building2, RotateCcw, ShieldAlert, Palette, Type, Columns } from "lucide-react";
import { toast } from "sonner";
import { usePdfTemplateSettings, useUpdatePdfTemplateSettings, defaultPdfTemplateSettings, PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
import { PdfPreviewMini } from "@/components/pdf/PdfPreviewMini";
import { useIsAdmin } from "@/hooks/useAdmin";

const FONT_OPTIONS = [
  { value: "Montserrat", label: "Montserrat" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Poppins", label: "Poppins" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
];

const MONO_FONT_OPTIONS = [
  { value: "Roboto Mono", label: "Roboto Mono" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Source Code Pro", label: "Source Code Pro" },
];

export default function PdfTemplateEditor() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: savedSettings, isLoading } = usePdfTemplateSettings();
  const updateSettings = useUpdatePdfTemplateSettings();
  
  const canEdit = isAdmin === true;
  
  const [settings, setSettings] = useState<Partial<PdfTemplateSettings>>({
    ...defaultPdfTemplateSettings,
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("Only admins can modify template settings");
      return;
    }
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
    if (!canEdit) return;
    setSettings({ ...defaultPdfTemplateSettings, id: savedSettings?.id });
    toast.info("Settings reset to defaults (not saved yet)");
  };

  const updateField = <K extends keyof PdfTemplateSettings>(
    field: K,
    value: PdfTemplateSettings[K]
  ) => {
    if (!canEdit) return;
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading || isAdminLoading) {
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
              {canEdit 
                ? "Customize the appearance and content of your invoice PDFs" 
                : "View PDF template settings (admin access required to edit)"}
            </p>
          </div>
          {canEdit && (
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
          )}
        </div>

        {!canEdit && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Template settings are read-only. Only administrators can modify PDF templates.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="colors" className="text-xs">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="fonts" className="text-xs">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-xs">
                  <Columns className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="sections" className="text-xs">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="content" className="text-xs">
                  <FileText className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              {/* Colors Tab */}
              <TabsContent value="colors" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Brand Colors</CardTitle>
                    <CardDescription>
                      Define your invoice color scheme
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Primary Color</Label>
                        <p className="text-xs text-muted-foreground mb-1">Header background</p>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.primary_color || "#294172"}
                            onChange={(e) => updateField("primary_color", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.primary_color || "#294172"}
                            onChange={(e) => updateField("primary_color", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Accent Color</Label>
                        <p className="text-xs text-muted-foreground mb-1">Highlights & borders</p>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.accent_color || "#d4a02c"}
                            onChange={(e) => updateField("accent_color", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.accent_color || "#d4a02c"}
                            onChange={(e) => updateField("accent_color", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Header Text</Label>
                        <p className="text-xs text-muted-foreground mb-1">Text on header</p>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.header_text_color || "#ffffff"}
                            onChange={(e) => updateField("header_text_color", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.header_text_color || "#ffffff"}
                            onChange={(e) => updateField("header_text_color", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Table Text</Label>
                        <p className="text-xs text-muted-foreground mb-1">Item text color</p>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.table_text_color || "#1f2937"}
                            onChange={(e) => updateField("table_text_color", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.table_text_color || "#1f2937"}
                            onChange={(e) => updateField("table_text_color", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Table Colors</CardTitle>
                    <CardDescription>
                      Customize table header and total styling
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Table Header BG</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.table_header_bg || "#f3f4f6"}
                            onChange={(e) => updateField("table_header_bg", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.table_header_bg || "#f3f4f6"}
                            onChange={(e) => updateField("table_header_bg", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Table Header Text</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.table_header_text || "#374151"}
                            onChange={(e) => updateField("table_header_text", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.table_header_text || "#374151"}
                            onChange={(e) => updateField("table_header_text", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Grand Total BG</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.grand_total_bg || "#1e2a4a"}
                            onChange={(e) => updateField("grand_total_bg", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.grand_total_bg || "#1e2a4a"}
                            onChange={(e) => updateField("grand_total_bg", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Grand Total Text</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={settings.grand_total_text || "#ffffff"}
                            onChange={(e) => updateField("grand_total_text", e.target.value)}
                            disabled={!canEdit}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={settings.grand_total_text || "#ffffff"}
                            onChange={(e) => updateField("grand_total_text", e.target.value)}
                            className={`flex-1 ${!canEdit ? "bg-muted" : ""}`}
                            readOnly={!canEdit}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fonts Tab */}
              <TabsContent value="fonts" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Typography</CardTitle>
                    <CardDescription>
                      Choose fonts for different text elements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Heading Font</Label>
                      <p className="text-xs text-muted-foreground mb-1">Company name, titles</p>
                      <Select
                        value={settings.font_heading || "Montserrat"}
                        onValueChange={(v) => updateField("font_heading", v)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className={!canEdit ? "bg-muted" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              <span style={{ fontFamily: font.value }}>{font.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Body Font</Label>
                      <p className="text-xs text-muted-foreground mb-1">General text, descriptions</p>
                      <Select
                        value={settings.font_body || "Inter"}
                        onValueChange={(v) => updateField("font_body", v)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className={!canEdit ? "bg-muted" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              <span style={{ fontFamily: font.value }}>{font.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Mono Font</Label>
                      <p className="text-xs text-muted-foreground mb-1">Amounts, quantities</p>
                      <Select
                        value={settings.font_mono || "Roboto Mono"}
                        onValueChange={(v) => updateField("font_mono", v)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className={!canEdit ? "bg-muted" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONO_FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              <span style={{ fontFamily: font.value }}>{font.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Font Size Scale</Label>
                      <p className="text-xs text-muted-foreground mb-1">Overall text size</p>
                      <Select
                        value={settings.font_size_scale || "normal"}
                        onValueChange={(v) => updateField("font_size_scale", v as any)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className={!canEdit ? "bg-muted" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Layout Options</CardTitle>
                    <CardDescription>
                      Configure header alignment and custom labels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Header Layout</Label>
                      <Select
                        value={settings.header_layout || "centered"}
                        onValueChange={(v) => updateField("header_layout", v as any)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className={!canEdit ? "bg-muted" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="centered">Centered</SelectItem>
                          <SelectItem value="left_aligned">Left Aligned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Invoice Title</Label>
                      <Input
                        value={settings.invoice_title || "PROFORMA INVOICE"}
                        onChange={(e) => updateField("invoice_title", e.target.value)}
                        placeholder="PROFORMA INVOICE"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>

                    <div>
                      <Label>Bill To Label</Label>
                      <Input
                        value={settings.bill_to_label || "Bill To"}
                        onChange={(e) => updateField("bill_to_label", e.target.value)}
                        placeholder="Bill To"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>

                    <div>
                      <Label>Invoice Details Label</Label>
                      <Input
                        value={settings.invoice_details_label || "Invoice Details"}
                        onChange={(e) => updateField("invoice_details_label", e.target.value)}
                        placeholder="Invoice Details"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sections Tab */}
              <TabsContent value="sections" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section Visibility</CardTitle>
                    <CardDescription>
                      Toggle which sections appear in your PDF
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      {[
                        { key: "show_logo", label: "Company Logo", desc: "Show logo in header" },
                        { key: "show_gstin_header", label: "GSTIN in Header", desc: "Display company GSTIN" },
                        { key: "show_contact_header", label: "Contact Details", desc: "Phone, email, website" },
                        { key: "show_company_state", label: "Company State", desc: "State and code" },
                        { key: "show_customer_email", label: "Customer Email", desc: "In bill to section" },
                        { key: "show_customer_phone", label: "Customer Phone", desc: "In bill to section" },
                        { key: "show_brand_column", label: "Brand Column", desc: "Show in items table" },
                        { key: "show_unit_column", label: "Unit Column", desc: "Show in items table" },
                        { key: "show_image_column", label: "Image Column", desc: "Product images" },
                        { key: "show_serial_numbers", label: "Serial Numbers", desc: "Show in item descriptions" },
                        { key: "show_discount_column", label: "Discount Column", desc: "Show discount in table" },
                        { key: "show_amount_words", label: "Amount in Words", desc: "Show total in words" },
                        { key: "show_terms", label: "Terms & Conditions", desc: "Show at bottom" },
                        { key: "show_signature", label: "Signature Section", desc: "Authorized signatory line" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-1">
                          <div>
                            <Label className="text-sm">{item.label}</Label>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch
                            checked={(settings as any)[item.key] ?? true}
                            onCheckedChange={(v) => updateField(item.key as any, v)}
                            disabled={!canEdit}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                    <CardDescription>
                      Customize the terms shown at the bottom
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Term 1</Label>
                      <Input
                        value={settings.terms_line1 || ""}
                        onChange={(e) => updateField("terms_line1", e.target.value)}
                        placeholder="Goods once sold will not be taken back."
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                    <div>
                      <Label>Term 2</Label>
                      <Input
                        value={settings.terms_line2 || ""}
                        onChange={(e) => updateField("terms_line2", e.target.value)}
                        placeholder="Subject to local jurisdiction only."
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                    <div>
                      <Label>Term 3</Label>
                      <Input
                        value={settings.terms_line3 || ""}
                        onChange={(e) => updateField("terms_line3", e.target.value)}
                        placeholder="E&OE - Errors and Omissions Excepted."
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                    <div>
                      <Label>Custom Footer Text</Label>
                      <Input
                        value={settings.custom_footer_text || ""}
                        onChange={(e) => updateField("custom_footer_text", e.target.value || null)}
                        placeholder="e.g., Thank you for your business!"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bank Details</CardTitle>
                    <CardDescription>
                      Add payment information to your invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={settings.bank_name || ""}
                        onChange={(e) => updateField("bank_name", e.target.value || null)}
                        placeholder="e.g., State Bank of India"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        value={settings.bank_account_no || ""}
                        onChange={(e) => updateField("bank_account_no", e.target.value || null)}
                        placeholder="e.g., 1234567890"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                    <div>
                      <Label>IFSC Code</Label>
                      <Input
                        value={settings.bank_ifsc || ""}
                        onChange={(e) => updateField("bank_ifsc", e.target.value || null)}
                        placeholder="e.g., SBIN0001234"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
                      />
                    </div>
                    <div>
                      <Label>Branch</Label>
                      <Input
                        value={settings.bank_branch || ""}
                        onChange={(e) => updateField("bank_branch", e.target.value || null)}
                        placeholder="e.g., Main Branch, Mumbai"
                        className={`mt-1 ${!canEdit ? "bg-muted" : ""}`}
                        readOnly={!canEdit}
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
