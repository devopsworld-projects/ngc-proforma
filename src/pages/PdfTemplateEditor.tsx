import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  LayoutTemplate, 
  Palette, 
  Eye, 
  FileText, 
  Type,
  RotateCcw,
  Rows3,
  SlidersHorizontal,
  PenTool,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useAdmin";
import { usePdfTemplateSettings, useUpdatePdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { TemplateLibrary, TemplatePreset } from "@/components/pdf-editor/TemplateLibrary";
import { ColorSettingsPanel } from "@/components/pdf-editor/ColorSettingsPanel";
import { VisibilitySettingsPanel } from "@/components/pdf-editor/VisibilitySettingsPanel";
import { ContentSettingsPanel } from "@/components/pdf-editor/ContentSettingsPanel";
import { FontSettingsPanel } from "@/components/pdf-editor/FontSettingsPanel";
import { LayoutSettingsPanel } from "@/components/pdf-editor/LayoutSettingsPanel";
import { SpacingSettingsPanel } from "@/components/pdf-editor/SpacingSettingsPanel";
import { InvoicePreviewPane } from "@/components/pdf-editor/InvoicePreviewPane";
import { InvoiceCanvasEditor } from "@/components/canvas-editor/InvoiceCanvasEditor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// Default settings matching the database schema
const defaultSettings = {
  primary_color: "#294172",
  secondary_color: "#3b82f6",
  accent_color: "#d4a02c",
  header_text_color: "#ffffff",
  table_header_bg: "#f3f4f6",
  table_header_text: "#374151",
  table_text_color: "#1f2937",
  grand_total_bg: "#1e2a4a",
  grand_total_text: "#ffffff",
  template_style: "bold_corporate",
  invoice_title: "PROFORMA INVOICE",
  bill_to_label: "Bill To",
  invoice_details_label: "Invoice Details",
  header_layout: "centered",
  font_heading: "Montserrat",
  font_body: "Inter",
  font_mono: "Roboto Mono",
  font_size_scale: "normal",
  show_logo: true,
  show_gstin_header: true,
  show_contact_header: true,
  show_company_state: true,
  show_shipping_address: false,
  show_customer_email: true,
  show_customer_phone: true,
  show_image_column: true,
  show_brand_column: true,
  show_unit_column: true,
  show_serial_numbers: true,
  show_discount_column: true,
  show_terms: true,
  show_signature: true,
  show_amount_words: true,
  terms_line1: "Goods once sold will not be taken back.",
  terms_line2: "Subject to local jurisdiction only.",
  terms_line3: "E&OE - Errors and Omissions Excepted.",
  custom_footer_text: null as string | null,
  bank_name: null as string | null,
  bank_account_no: null as string | null,
  bank_ifsc: null as string | null,
  bank_branch: null as string | null,
  section_order: ["header", "customer_details", "items_table", "totals", "bank_details", "terms", "signature"] as string[],
  // New spacing/sizing settings
  header_padding: "normal",
  header_layout_style: "centered",
  logo_size: "medium",
  section_spacing: "normal",
  table_row_padding: "normal",
  footer_padding: "normal",
  show_invoice_title: true,
  compact_header: false,
  border_style: "subtle",
  table_border_color: "#e5e7eb",
  custom_canvas_data: null as any | null,
};

type SettingsType = typeof defaultSettings & { id?: string };

export default function PdfTemplateEditor() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: existingSettings, isLoading: settingsLoading } = usePdfTemplateSettings();
  const { data: companySettings } = useCompanySettings();
  const updateSettings = useUpdatePdfTemplateSettings();

  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");

  // Load existing settings
  useEffect(() => {
    if (existingSettings) {
      setSettings({
        ...defaultSettings,
        ...existingSettings,
      });
    }
  }, [existingSettings]);

  // Redirect non-admins
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Access denied: Admin only");
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleSettingChange = (key: string, value: string | boolean | string[] | null) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleTemplateSelect = (template: TemplatePreset) => {
    setSettings((prev) => ({
      ...prev,
      ...template.settings,
    }));
    setHasChanges(true);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        ...settings,
        id: existingSettings?.id,
      });
      setHasChanges(false);
      toast.success("Template settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save template settings");
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info("Settings reset to defaults");
  };

  const handleCanvasSave = useCallback(async (canvasData: string) => {
    try {
      await updateSettings.mutateAsync({
        ...settings,
        id: existingSettings?.id,
        custom_canvas_data: JSON.parse(canvasData),
      });
    } catch (error) {
      throw error;
    }
  }, [settings, existingSettings, updateSettings]);

  if (adminLoading || settingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold">PDF Template Editor</h1>
                <Badge variant="secondary">Admin Only</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Customize invoice appearance for all users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Unsaved changes
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateSettings.isPending || !hasChanges}
              size="sm"
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-4 overflow-x-auto">
              <TabsList className="h-12 flex-wrap">
                <TabsTrigger value="canvas" className="gap-1.5 text-xs">
                  <PenTool className="h-3.5 w-3.5" />
                  Canvas Editor
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-1.5 text-xs">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-1.5 text-xs">
                  <Rows3 className="h-3.5 w-3.5" />
                  Order
                </TabsTrigger>
                <TabsTrigger value="spacing" className="gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Spacing
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-1.5 text-xs">
                  <Palette className="h-3.5 w-3.5" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="visibility" className="gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  Visibility
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="typography" className="gap-1.5 text-xs">
                  <Type className="h-3.5 w-3.5" />
                  Fonts
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Canvas Editor - Full Width */}
            <TabsContent value="canvas" className="flex-1 m-0 overflow-hidden">
              <InvoiceCanvasEditor
                initialData={existingSettings?.custom_canvas_data ? JSON.stringify(existingSettings.custom_canvas_data) : null}
                templateSettings={settings}
                companyName={companySettings?.name}
                companyLogo={companySettings?.logo_url}
                onSave={handleCanvasSave}
                isSaving={updateSettings.isPending}
              />
            </TabsContent>

            {/* Settings tabs - with preview panel */}
            {activeTab !== "canvas" && (
              <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                  {/* Settings Panel */}
                  <ResizablePanel defaultSize={55} minSize={40}>
                    <ScrollArea className="h-full p-4">
                      <TabsContent value="templates" className="m-0">
                        <TemplateLibrary
                          selectedTemplate={settings.template_style}
                          onSelectTemplate={handleTemplateSelect}
                        />
                      </TabsContent>

                      <TabsContent value="layout" className="m-0">
                        <LayoutSettingsPanel
                          sectionOrder={settings.section_order}
                          onChange={handleSettingChange}
                        />
                      </TabsContent>

                      <TabsContent value="spacing" className="m-0">
                        <SpacingSettingsPanel
                          settings={{
                            header_padding: settings.header_padding,
                            header_layout_style: settings.header_layout_style,
                            logo_size: settings.logo_size,
                            section_spacing: settings.section_spacing,
                            table_row_padding: settings.table_row_padding,
                            footer_padding: settings.footer_padding,
                            show_invoice_title: settings.show_invoice_title,
                            compact_header: settings.compact_header,
                            border_style: settings.border_style,
                          }}
                          onChange={handleSettingChange}
                        />
                      </TabsContent>

                      <TabsContent value="colors" className="m-0">
                        <ColorSettingsPanel
                          settings={settings}
                          onChange={handleSettingChange}
                        />
                      </TabsContent>

                      <TabsContent value="visibility" className="m-0">
                        <VisibilitySettingsPanel
                          settings={settings}
                          onChange={handleSettingChange}
                        />
                      </TabsContent>

                      <TabsContent value="content" className="m-0">
                        <ContentSettingsPanel
                          settings={settings}
                          onChange={handleSettingChange}
                        />
                      </TabsContent>

                      <TabsContent value="typography" className="m-0">
                        <FontSettingsPanel
                          settings={settings}
                          onChange={handleSettingChange}
                        />
                      </TabsContent>
                    </ScrollArea>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Preview Panel */}
                  <ResizablePanel defaultSize={45} minSize={30}>
                    <ScrollArea className="h-full p-4 bg-muted/30">
                      <InvoicePreviewPane
                        settings={settings}
                        companyName={companySettings?.name}
                        companyLogo={companySettings?.logo_url || undefined}
                        onSectionOrderChange={(newOrder) => handleSettingChange("section_order", newOrder)}
                      />
                    </ScrollArea>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
