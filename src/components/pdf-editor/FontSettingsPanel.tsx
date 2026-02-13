import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type } from "lucide-react";

interface FontSettingsPanelProps {
  settings: {
    font_heading: string;
    font_body: string;
    font_mono: string;
    font_size_scale: string;
    header_layout: string;
  };
  onChange: (key: string, value: string) => void;
}

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
];

const monoFontOptions = [
  { value: "Roboto Mono", label: "Roboto Mono" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Source Code Pro", label: "Source Code Pro" },
];

const fontSizeScales = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Large" },
];

const headerLayouts = [
  { value: "centered", label: "Centered" },
  { value: "left-aligned", label: "Left Aligned" },
  { value: "split", label: "Split (Logo Left, Details Right)" },
];

export function FontSettingsPanel({ settings, onChange }: FontSettingsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Type className="w-4 h-4" />
          Typography & Layout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Heading Font</Label>
            <Select value={settings.font_heading} onValueChange={(v) => onChange("font_heading", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body Font</Label>
            <Select value={settings.font_body} onValueChange={(v) => onChange("font_body", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monospace Font (Numbers)</Label>
            <Select value={settings.font_mono} onValueChange={(v) => onChange("font_mono", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {monoFontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Font Size Scale</Label>
            <Select value={settings.font_size_scale} onValueChange={(v) => onChange("font_size_scale", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select scale" />
              </SelectTrigger>
              <SelectContent>
                {fontSizeScales.map((scale) => (
                  <SelectItem key={scale.value} value={scale.value}>
                    {scale.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="space-y-1.5">
            <Label className="text-xs">Header Layout</Label>
            <Select value={settings.header_layout} onValueChange={(v) => onChange("header_layout", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                {headerLayouts.map((layout) => (
                  <SelectItem key={layout.value} value={layout.value}>
                    {layout.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
