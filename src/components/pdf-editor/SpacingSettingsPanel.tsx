import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Maximize2, 
  Minimize2, 
  Square, 
  AlignCenter, 
  AlignLeft, 
  Columns,
  Image,
  Rows3,
  TableIcon
} from "lucide-react";

interface SpacingSettingsPanelProps {
  settings: {
    header_padding: string;
    header_layout_style: string;
    logo_size: string;
    section_spacing: string;
    table_row_padding: string;
    footer_padding: string;
    show_invoice_title: boolean;
    compact_header: boolean;
    border_style: string;
  };
  onChange: (key: string, value: string | boolean) => void;
}

const SPACING_OPTIONS = [
  { value: "compact", label: "Compact", icon: Minimize2 },
  { value: "normal", label: "Normal", icon: Square },
  { value: "relaxed", label: "Relaxed", icon: Maximize2 },
];

const LOGO_SIZES = [
  { value: "small", label: "Small", size: "32px" },
  { value: "medium", label: "Medium", size: "48px" },
  { value: "large", label: "Large", size: "64px" },
  { value: "xlarge", label: "X-Large", size: "80px" },
];

const HEADER_LAYOUTS = [
  { value: "centered", label: "Centered", icon: AlignCenter, description: "Logo and details centered" },
  { value: "left-aligned", label: "Left Aligned", icon: AlignLeft, description: "Logo and name on left" },
  { value: "split", label: "Split", icon: Columns, description: "Logo left, details right" },
];

const BORDER_STYLES = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "medium", label: "Medium" },
  { value: "bold", label: "Bold" },
];

interface SpacingRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: typeof SPACING_OPTIONS;
}

function SpacingRadioGroup({ value, onChange, options }: SpacingRadioGroupProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex gap-2"
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <div key={option.value} className="flex-1">
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={option.value}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{option.label}</span>
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}

export function SpacingSettingsPanel({ settings, onChange }: SpacingSettingsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Header Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rows3 className="w-4 h-4" />
            Header Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compact Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Compact Header</Label>
              <p className="text-xs text-muted-foreground">
                Reduce header height for more content space
              </p>
            </div>
            <Switch
              checked={settings.compact_header}
              onCheckedChange={(v) => onChange("compact_header", v)}
            />
          </div>

          <Separator />

          {/* Header Layout Style */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Header Layout</Label>
            <RadioGroup
              value={settings.header_layout_style}
              onValueChange={(v) => onChange("header_layout_style", v)}
              className="grid grid-cols-3 gap-2"
            >
              {HEADER_LAYOUTS.map((layout) => {
                const Icon = layout.icon;
                return (
                  <div key={layout.value}>
                    <RadioGroupItem
                      value={layout.value}
                      id={`layout-${layout.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`layout-${layout.value}`}
                      className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{layout.label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <Separator />

          {/* Header Padding */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Header Padding</Label>
            <SpacingRadioGroup
              value={settings.header_padding}
              onChange={(v) => onChange("header_padding", v)}
              options={SPACING_OPTIONS}
            />
          </div>

          <Separator />

          {/* Logo Size */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Image className="h-3 w-3" />
              Logo Size
            </Label>
            <RadioGroup
              value={settings.logo_size}
              onValueChange={(v) => onChange("logo_size", v)}
              className="grid grid-cols-4 gap-2"
            >
              {LOGO_SIZES.map((size) => (
                <div key={size.value}>
                  <RadioGroupItem
                    value={size.value}
                    id={`logo-${size.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`logo-${size.value}`}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <span className="text-xs font-medium">{size.label}</span>
                    <span className="text-[10px] text-muted-foreground">{size.size}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Show Invoice Title */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show Invoice Title</Label>
              <p className="text-xs text-muted-foreground">
                Display "PROFORMA INVOICE" in header
              </p>
            </div>
            <Switch
              checked={settings.show_invoice_title}
              onCheckedChange={(v) => onChange("show_invoice_title", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table & Content Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TableIcon className="w-4 h-4" />
            Table & Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section Spacing */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Section Spacing</Label>
            <SpacingRadioGroup
              value={settings.section_spacing}
              onChange={(v) => onChange("section_spacing", v)}
              options={SPACING_OPTIONS}
            />
          </div>

          <Separator />

          {/* Table Row Padding */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Table Row Height</Label>
            <SpacingRadioGroup
              value={settings.table_row_padding}
              onChange={(v) => onChange("table_row_padding", v)}
              options={SPACING_OPTIONS}
            />
          </div>

          <Separator />

          {/* Border Style */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Table Border Style</Label>
            <RadioGroup
              value={settings.border_style}
              onValueChange={(v) => onChange("border_style", v)}
              className="grid grid-cols-4 gap-2"
            >
              {BORDER_STYLES.map((style) => (
                <div key={style.value}>
                  <RadioGroupItem
                    value={style.value}
                    id={`border-${style.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`border-${style.value}`}
                    className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <span className="text-xs font-medium">{style.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Footer Padding */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Footer Padding</Label>
            <SpacingRadioGroup
              value={settings.footer_padding}
              onChange={(v) => onChange("footer_padding", v)}
              options={SPACING_OPTIONS}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
