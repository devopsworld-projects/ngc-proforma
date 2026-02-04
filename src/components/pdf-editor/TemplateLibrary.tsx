import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  preview: string;
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
  };
}

export const templatePresets: TemplatePreset[] = [
  {
    id: "bold_corporate",
    name: "Bold Corporate",
    description: "Deep navy with gold accents - professional and premium",
    preview: "linear-gradient(135deg, #1e2a4a 0%, #d4a02c 100%)",
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
    },
  },
  {
    id: "minimal_modern",
    name: "Minimal Modern",
    description: "Clean black and white with subtle grays",
    preview: "linear-gradient(135deg, #111827 0%, #6b7280 100%)",
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
    },
  },
  {
    id: "ocean_blue",
    name: "Ocean Blue",
    description: "Calm blue tones with teal accents",
    preview: "linear-gradient(135deg, #0369a1 0%, #14b8a6 100%)",
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
    },
  },
  {
    id: "forest_green",
    name: "Forest Green",
    description: "Natural green palette with earthy tones",
    preview: "linear-gradient(135deg, #166534 0%, #84cc16 100%)",
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
    },
  },
  {
    id: "burgundy_classic",
    name: "Burgundy Classic",
    description: "Rich burgundy with cream accents - elegant and timeless",
    preview: "linear-gradient(135deg, #7f1d1d 0%, #d97706 100%)",
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
    },
  },
  {
    id: "purple_royal",
    name: "Purple Royal",
    description: "Regal purple with violet highlights",
    preview: "linear-gradient(135deg, #581c87 0%, #a855f7 100%)",
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
        <h3 className="text-lg font-semibold">Template Library</h3>
        <Badge variant="secondary">{templatePresets.length} templates</Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {templatePresets.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
              selectedTemplate === template.id && "ring-2 ring-primary"
            )}
            onClick={() => onSelectTemplate(template)}
          >
            <div 
              className="h-16 w-full"
              style={{ background: template.preview }}
            />
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{template.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
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
