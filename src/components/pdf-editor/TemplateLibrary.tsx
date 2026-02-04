import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  preview: string;
  tags?: string[];
  settings: {
    // Colors
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    header_text_color: string;
    table_header_bg: string;
    table_header_text: string;
    table_text_color: string;
    grand_total_bg: string;
    grand_total_text: string;
    template_style: string;
    // Typography
    font_heading: string;
    font_body: string;
    // Spacing & Layout
    header_padding: string;
    header_layout_style: string;
    logo_size: string;
    section_spacing: string;
    table_row_padding: string;
    footer_padding: string;
    show_invoice_title: boolean;
    compact_header: boolean;
    border_style: string;
    table_border_color: string;
  };
}

export const templatePresets: TemplatePreset[] = [
  {
    id: "bold_corporate",
    name: "Bold Corporate",
    description: "Deep navy with gold accents - professional and premium look",
    preview: "linear-gradient(135deg, #1e2a4a 0%, #d4a02c 100%)",
    tags: ["Premium", "Professional"],
    settings: {
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
      font_heading: "Montserrat",
      font_body: "Inter",
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
    },
  },
  {
    id: "compact_professional",
    name: "Compact Professional",
    description: "Space-efficient design - maximizes content area with split header",
    preview: "linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)",
    tags: ["Compact", "Efficient"],
    settings: {
      primary_color: "#1e3a5f",
      secondary_color: "#0284c7",
      accent_color: "#0ea5e9",
      header_text_color: "#ffffff",
      table_header_bg: "#f0f9ff",
      table_header_text: "#1e3a5f",
      table_text_color: "#1e3a5f",
      grand_total_bg: "#1e3a5f",
      grand_total_text: "#ffffff",
      template_style: "compact_professional",
      font_heading: "Inter",
      font_body: "Inter",
      header_padding: "compact",
      header_layout_style: "split",
      logo_size: "small",
      section_spacing: "compact",
      table_row_padding: "compact",
      footer_padding: "compact",
      show_invoice_title: true,
      compact_header: true,
      border_style: "subtle",
      table_border_color: "#e0f2fe",
    },
  },
  {
    id: "minimal_modern",
    name: "Minimal Modern",
    description: "Clean black and white with subtle grays - ultra clean aesthetic",
    preview: "linear-gradient(135deg, #111827 0%, #6b7280 100%)",
    tags: ["Minimal", "Clean"],
    settings: {
      primary_color: "#111827",
      secondary_color: "#4b5563",
      accent_color: "#374151",
      header_text_color: "#ffffff",
      table_header_bg: "#f9fafb",
      table_header_text: "#111827",
      table_text_color: "#374151",
      grand_total_bg: "#111827",
      grand_total_text: "#ffffff",
      template_style: "minimal_modern",
      font_heading: "Inter",
      font_body: "Inter",
      header_padding: "compact",
      header_layout_style: "left-aligned",
      logo_size: "medium",
      section_spacing: "normal",
      table_row_padding: "compact",
      footer_padding: "compact",
      show_invoice_title: true,
      compact_header: true,
      border_style: "none",
      table_border_color: "#e5e7eb",
    },
  },
  {
    id: "ocean_blue",
    name: "Ocean Blue",
    description: "Calm blue tones with teal accents - fresh and modern",
    preview: "linear-gradient(135deg, #0369a1 0%, #14b8a6 100%)",
    tags: ["Fresh", "Modern"],
    settings: {
      primary_color: "#0369a1",
      secondary_color: "#0ea5e9",
      accent_color: "#14b8a6",
      header_text_color: "#ffffff",
      table_header_bg: "#f0f9ff",
      table_header_text: "#0369a1",
      table_text_color: "#1e3a5f",
      grand_total_bg: "#0369a1",
      grand_total_text: "#ffffff",
      template_style: "ocean_blue",
      font_heading: "Montserrat",
      font_body: "Inter",
      header_padding: "normal",
      header_layout_style: "centered",
      logo_size: "large",
      section_spacing: "normal",
      table_row_padding: "normal",
      footer_padding: "normal",
      show_invoice_title: true,
      compact_header: false,
      border_style: "subtle",
      table_border_color: "#bae6fd",
    },
  },
  {
    id: "forest_green",
    name: "Forest Green",
    description: "Natural green palette with earthy tones - eco-friendly feel",
    preview: "linear-gradient(135deg, #166534 0%, #84cc16 100%)",
    tags: ["Natural", "Eco"],
    settings: {
      primary_color: "#166534",
      secondary_color: "#22c55e",
      accent_color: "#84cc16",
      header_text_color: "#ffffff",
      table_header_bg: "#f0fdf4",
      table_header_text: "#166534",
      table_text_color: "#1a3a1a",
      grand_total_bg: "#166534",
      grand_total_text: "#ffffff",
      template_style: "forest_green",
      font_heading: "Montserrat",
      font_body: "Inter",
      header_padding: "normal",
      header_layout_style: "split",
      logo_size: "medium",
      section_spacing: "normal",
      table_row_padding: "normal",
      footer_padding: "normal",
      show_invoice_title: true,
      compact_header: false,
      border_style: "subtle",
      table_border_color: "#bbf7d0",
    },
  },
  {
    id: "burgundy_classic",
    name: "Burgundy Classic",
    description: "Rich burgundy with cream accents - elegant and timeless",
    preview: "linear-gradient(135deg, #7f1d1d 0%, #d97706 100%)",
    tags: ["Elegant", "Classic"],
    settings: {
      primary_color: "#7f1d1d",
      secondary_color: "#b91c1c",
      accent_color: "#d97706",
      header_text_color: "#ffffff",
      table_header_bg: "#fef3c7",
      table_header_text: "#7f1d1d",
      table_text_color: "#44403c",
      grand_total_bg: "#7f1d1d",
      grand_total_text: "#ffffff",
      template_style: "burgundy_classic",
      font_heading: "Montserrat",
      font_body: "Inter",
      header_padding: "relaxed",
      header_layout_style: "centered",
      logo_size: "large",
      section_spacing: "relaxed",
      table_row_padding: "relaxed",
      footer_padding: "relaxed",
      show_invoice_title: true,
      compact_header: false,
      border_style: "medium",
      table_border_color: "#fde68a",
    },
  },
  {
    id: "purple_royal",
    name: "Purple Royal",
    description: "Regal purple with violet highlights - luxurious feel",
    preview: "linear-gradient(135deg, #581c87 0%, #a855f7 100%)",
    tags: ["Luxury", "Regal"],
    settings: {
      primary_color: "#581c87",
      secondary_color: "#7c3aed",
      accent_color: "#a855f7",
      header_text_color: "#ffffff",
      table_header_bg: "#faf5ff",
      table_header_text: "#581c87",
      table_text_color: "#3b0764",
      grand_total_bg: "#581c87",
      grand_total_text: "#ffffff",
      template_style: "purple_royal",
      font_heading: "Montserrat",
      font_body: "Inter",
      header_padding: "normal",
      header_layout_style: "centered",
      logo_size: "large",
      section_spacing: "normal",
      table_row_padding: "normal",
      footer_padding: "normal",
      show_invoice_title: true,
      compact_header: false,
      border_style: "subtle",
      table_border_color: "#e9d5ff",
    },
  },
  {
    id: "ultra_compact",
    name: "Ultra Compact",
    description: "Maximum content space - smallest possible header footprint",
    preview: "linear-gradient(135deg, #334155 0%, #64748b 100%)",
    tags: ["Ultra Compact", "Dense"],
    settings: {
      primary_color: "#334155",
      secondary_color: "#475569",
      accent_color: "#64748b",
      header_text_color: "#ffffff",
      table_header_bg: "#f1f5f9",
      table_header_text: "#334155",
      table_text_color: "#334155",
      grand_total_bg: "#334155",
      grand_total_text: "#ffffff",
      template_style: "ultra_compact",
      font_heading: "Inter",
      font_body: "Inter",
      header_padding: "compact",
      header_layout_style: "split",
      logo_size: "small",
      section_spacing: "compact",
      table_row_padding: "compact",
      footer_padding: "compact",
      show_invoice_title: false,
      compact_header: true,
      border_style: "none",
      table_border_color: "#cbd5e1",
    },
  },
  {
    id: "executive_gold",
    name: "Executive Gold",
    description: "Premium black with gold accents - executive presentation",
    preview: "linear-gradient(135deg, #0f172a 0%, #eab308 100%)",
    tags: ["Executive", "Premium"],
    settings: {
      primary_color: "#0f172a",
      secondary_color: "#1e293b",
      accent_color: "#eab308",
      header_text_color: "#ffffff",
      table_header_bg: "#fefce8",
      table_header_text: "#0f172a",
      table_text_color: "#1e293b",
      grand_total_bg: "#0f172a",
      grand_total_text: "#eab308",
      template_style: "executive_gold",
      font_heading: "Montserrat",
      font_body: "Inter",
      header_padding: "relaxed",
      header_layout_style: "centered",
      logo_size: "xlarge",
      section_spacing: "relaxed",
      table_row_padding: "relaxed",
      footer_padding: "relaxed",
      show_invoice_title: true,
      compact_header: false,
      border_style: "bold",
      table_border_color: "#fde047",
    },
  },
];

interface TemplateLibraryProps {
  selectedTemplate: string;
  onSelectTemplate: (template: TemplatePreset) => void;
}

export function TemplateLibrary({ selectedTemplate, onSelectTemplate }: TemplateLibraryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Template Library</h3>
        </div>
        <Badge variant="secondary">{templatePresets.length} templates</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Each template includes colors, typography, spacing, and layout settings. Click to apply a complete look instantly.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {templatePresets.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md relative overflow-hidden group",
              selectedTemplate === template.id && "ring-2 ring-primary"
            )}
            onClick={() => onSelectTemplate(template)}
          >
            <div 
              className="h-14 w-full relative"
              style={{ background: template.preview }}
            >
              {/* Compact indicator */}
              {template.settings.compact_header && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white font-medium">
                  Compact
                </div>
              )}
            </div>
            <CardContent className="p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{template.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                    {template.description}
                  </p>
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {template.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="px-1.5 py-0.5 bg-muted text-[10px] font-medium rounded text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {selectedTemplate === template.id && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
