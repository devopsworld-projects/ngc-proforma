import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: "centered" | "split" | "left-aligned" | "compact";
  settings: {
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
    font_heading: string;
    font_body: string;
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

// --- Layout Thumbnail Components ---
// These render mini structural diagrams showing where logo, text, table, footer sit

function CenteredLayoutThumb({ primary, accent }: { primary: string; accent: string }) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Accent bar */}
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
      {/* Header - centered */}
      <div className="flex-[3] flex flex-col items-center justify-center gap-[2px] px-2" style={{ backgroundColor: primary }}>
        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: accent, opacity: 0.8 }} />
        <div className="w-12 h-[3px] rounded-full bg-white/70" />
        <div className="w-16 h-[2px] rounded-full bg-white/40" />
        <div className="w-10 h-[2px] rounded-full bg-white/30" />
      </div>
      {/* Invoice title */}
      <div className="h-[6px] flex items-center justify-center" style={{ backgroundColor: primary }}>
        <div className="w-10 h-[2px] rounded-full" style={{ backgroundColor: accent }} />
      </div>
      {/* Bill to / Invoice details row */}
      <div className="flex gap-1 px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="flex-1 space-y-[1px]">
          <div className="w-6 h-[2px] rounded-full bg-white/40" />
          <div className="w-10 h-[2px] rounded-full bg-white/60" />
        </div>
        <div className="flex-1 flex flex-col items-end space-y-[1px]">
          <div className="w-6 h-[2px] rounded-full bg-white/40" />
          <div className="w-8 h-[2px] rounded-full bg-white/60" />
        </div>
      </div>
      {/* Table */}
      <div className="flex-[3] bg-white px-1 py-[2px] space-y-[2px]">
        <div className="h-[3px] rounded-sm bg-gray-200" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
      </div>
      {/* Totals */}
      <div className="flex justify-end px-1 py-[2px] bg-white">
        <div className="w-10 h-[4px] rounded-sm" style={{ backgroundColor: primary }} />
      </div>
      {/* Footer */}
      <div className="flex-[1] px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="w-8 h-[2px] rounded-full bg-white/40" />
      </div>
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
    </div>
  );
}

function SplitLayoutThumb({ primary, accent }: { primary: string; accent: string }) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
      {/* Header - split: logo left, info right */}
      <div className="flex-[2] flex items-center justify-between px-2 py-1" style={{ backgroundColor: primary }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: accent, opacity: 0.8 }} />
          <div className="space-y-[1px]">
            <div className="w-8 h-[3px] rounded-full bg-white/70" />
            <div className="w-10 h-[2px] rounded-full bg-white/40" />
          </div>
        </div>
        <div className="space-y-[1px] flex flex-col items-end">
          <div className="w-6 h-[2px] rounded-full bg-white/50" />
          <div className="w-8 h-[2px] rounded-full bg-white/40" />
        </div>
      </div>
      {/* Bill to row */}
      <div className="flex gap-1 px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="flex-1 space-y-[1px]">
          <div className="w-5 h-[2px] rounded-full bg-white/40" />
          <div className="w-8 h-[2px] rounded-full bg-white/60" />
        </div>
        <div className="flex-1 flex flex-col items-end space-y-[1px]">
          <div className="w-5 h-[2px] rounded-full bg-white/40" />
          <div className="w-7 h-[2px] rounded-full bg-white/60" />
        </div>
      </div>
      {/* Table */}
      <div className="flex-[3] bg-white px-1 py-[2px] space-y-[2px]">
        <div className="h-[3px] rounded-sm bg-gray-200" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
      </div>
      <div className="flex justify-end px-1 py-[2px] bg-white">
        <div className="w-10 h-[4px] rounded-sm" style={{ backgroundColor: primary }} />
      </div>
      <div className="flex-[1] px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="w-8 h-[2px] rounded-full bg-white/40" />
      </div>
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
    </div>
  );
}

function LeftAlignedLayoutThumb({ primary, accent }: { primary: string; accent: string }) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
      {/* Header - left-aligned */}
      <div className="flex-[2] flex items-center gap-1 px-2 py-1" style={{ backgroundColor: primary }}>
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: accent, opacity: 0.8 }} />
        <div className="space-y-[1px]">
          <div className="w-10 h-[3px] rounded-full bg-white/70" />
          <div className="w-14 h-[2px] rounded-full bg-white/40" />
          <div className="w-8 h-[2px] rounded-full bg-white/30" />
        </div>
      </div>
      {/* Bill to row */}
      <div className="flex gap-1 px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="flex-1 space-y-[1px]">
          <div className="w-5 h-[2px] rounded-full bg-white/40" />
          <div className="w-9 h-[2px] rounded-full bg-white/60" />
        </div>
        <div className="flex-1 flex flex-col items-end space-y-[1px]">
          <div className="w-5 h-[2px] rounded-full bg-white/40" />
          <div className="w-7 h-[2px] rounded-full bg-white/60" />
        </div>
      </div>
      {/* Table */}
      <div className="flex-[3] bg-white px-1 py-[2px] space-y-[2px]">
        <div className="h-[3px] rounded-sm bg-gray-200" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
      </div>
      <div className="flex justify-end px-1 py-[2px] bg-white">
        <div className="w-10 h-[4px] rounded-sm" style={{ backgroundColor: primary }} />
      </div>
      <div className="flex-[1] px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="w-8 h-[2px] rounded-full bg-white/40" />
      </div>
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
    </div>
  );
}

function CompactLayoutThumb({ primary, accent }: { primary: string; accent: string }) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
      {/* Header - ultra compact, single line */}
      <div className="flex items-center justify-between px-2 py-[3px]" style={{ backgroundColor: primary }}>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent, opacity: 0.8 }} />
          <div className="w-8 h-[3px] rounded-full bg-white/70" />
        </div>
        <div className="w-6 h-[2px] rounded-full bg-white/40" />
      </div>
      {/* Bill to - compact */}
      <div className="flex gap-1 px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="flex-1">
          <div className="w-8 h-[2px] rounded-full bg-white/60" />
        </div>
        <div className="flex-1 flex justify-end">
          <div className="w-7 h-[2px] rounded-full bg-white/60" />
        </div>
      </div>
      {/* Table - takes most space */}
      <div className="flex-[5] bg-white px-1 py-[2px] space-y-[2px]">
        <div className="h-[3px] rounded-sm bg-gray-200" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
        <div className="h-[2px] rounded-sm bg-gray-100" />
      </div>
      <div className="flex justify-end px-1 py-[2px] bg-white">
        <div className="w-10 h-[4px] rounded-sm" style={{ backgroundColor: primary }} />
      </div>
      <div className="px-1 py-[2px]" style={{ backgroundColor: primary }}>
        <div className="w-6 h-[2px] rounded-full bg-white/40" />
      </div>
      <div className="h-[3px]" style={{ backgroundColor: accent }} />
    </div>
  );
}

// --- Category labels ---
const categoryLabels: Record<string, string> = {
  centered: "Centered Header",
  split: "Split Header",
  "left-aligned": "Left-Aligned",
  compact: "Compact / Dense",
};

// --- Thumbnail selector ---
function LayoutThumbnail({ template }: { template: TemplatePreset }) {
  const { primary_color, accent_color } = template.settings;
  switch (template.category) {
    case "split":
      return <SplitLayoutThumb primary={primary_color} accent={accent_color} />;
    case "left-aligned":
      return <LeftAlignedLayoutThumb primary={primary_color} accent={accent_color} />;
    case "compact":
      return <CompactLayoutThumb primary={primary_color} accent={accent_color} />;
    case "centered":
    default:
      return <CenteredLayoutThumb primary={primary_color} accent={accent_color} />;
  }
}

// --- Template presets ---
export const templatePresets: TemplatePreset[] = [
  // ---- CLEAN B&W CENTERED ----
  {
    id: "clean_bw",
    name: "Clean B&W",
    description: "Simple black & white centered — professional clarity, compact fit",
    category: "centered",
    settings: {
      primary_color: "#000000",
      secondary_color: "#333333",
      accent_color: "#666666",
      header_text_color: "#ffffff",
      table_header_bg: "#f5f5f5",
      table_header_text: "#000000",
      table_text_color: "#1a1a1a",
      grand_total_bg: "#000000",
      grand_total_text: "#ffffff",
      template_style: "clean_bw",
      font_heading: "Inter",
      font_body: "Inter",
      header_padding: "compact",
      header_layout_style: "centered",
      logo_size: "small",
      section_spacing: "compact",
      table_row_padding: "compact",
      footer_padding: "compact",
      show_invoice_title: true,
      compact_header: true,
      border_style: "subtle",
      table_border_color: "#d4d4d4",
    },
  },

  // ---- CLEAN B&W SPLIT ----
  {
    id: "clean_bw_split",
    name: "Clean B&W Split",
    description: "Black & white split header — logo left, contact right, zero color",
    category: "split",
    settings: {
      primary_color: "#000000",
      secondary_color: "#333333",
      accent_color: "#666666",
      header_text_color: "#ffffff",
      table_header_bg: "#f5f5f5",
      table_header_text: "#000000",
      table_text_color: "#1a1a1a",
      grand_total_bg: "#000000",
      grand_total_text: "#ffffff",
      template_style: "clean_bw_split",
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
      table_border_color: "#d4d4d4",
    },
  },

  // ---- CLEAN B&W LEFT ----
  {
    id: "clean_bw_left",
    name: "Clean B&W Left",
    description: "Black & white left-aligned — minimal and modern",
    category: "left-aligned",
    settings: {
      primary_color: "#000000",
      secondary_color: "#333333",
      accent_color: "#666666",
      header_text_color: "#ffffff",
      table_header_bg: "#f5f5f5",
      table_header_text: "#000000",
      table_text_color: "#1a1a1a",
      grand_total_bg: "#000000",
      grand_total_text: "#ffffff",
      template_style: "clean_bw_left",
      font_heading: "Inter",
      font_body: "Inter",
      header_padding: "compact",
      header_layout_style: "left-aligned",
      logo_size: "small",
      section_spacing: "compact",
      table_row_padding: "compact",
      footer_padding: "compact",
      show_invoice_title: true,
      compact_header: true,
      border_style: "none",
      table_border_color: "#d4d4d4",
    },
  },

  // ---- COMPACT B&W ----
  {
    id: "clean_bw_compact",
    name: "B&W Ultra Compact",
    description: "Maximum content space — no title, dense table, smallest header",
    category: "compact",
    settings: {
      primary_color: "#000000",
      secondary_color: "#333333",
      accent_color: "#555555",
      header_text_color: "#ffffff",
      table_header_bg: "#f5f5f5",
      table_header_text: "#000000",
      table_text_color: "#1a1a1a",
      grand_total_bg: "#000000",
      grand_total_text: "#ffffff",
      template_style: "clean_bw_compact",
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
      table_border_color: "#d4d4d4",
    },
  },
];

// --- Group templates by category ---
const categories = ["centered", "split", "left-aligned", "compact"] as const;

interface TemplateLibraryProps {
  selectedTemplate: string;
  onSelectTemplate: (template: TemplatePreset) => void;
}

export function TemplateLibrary({ selectedTemplate, onSelectTemplate }: TemplateLibraryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Template Layouts</h3>
        </div>
        <Badge variant="secondary">{templatePresets.length} layouts</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Each template defines a unique layout structure, spacing, and color scheme. Click to apply instantly.
      </p>

      {categories.map((cat) => {
        const templates = templatePresets.filter((t) => t.category === cat);
        if (templates.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryLabels[cat]}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md relative overflow-hidden group",
                    selectedTemplate === template.id && "ring-2 ring-primary"
                  )}
                  onClick={() => onSelectTemplate(template)}
                >
                  {/* Layout thumbnail */}
                  <div className="h-28 w-full relative border-b bg-white">
                    <LayoutThumbnail template={template} />
                    {selectedTemplate === template.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2.5">
                    <p className="font-medium text-sm truncate">{template.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
