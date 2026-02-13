import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

interface ColorSettingsPanelProps {
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
  };
  onChange: (key: string, value: string) => void;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border shadow-sm flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 p-0 border-0 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono uppercase"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function ColorSettingsPanel({ settings, onChange }: ColorSettingsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="w-4 h-4" />
          Colors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorInput
            label="Primary Color"
            value={settings.primary_color}
            onChange={(v) => onChange("primary_color", v)}
          />
          <ColorInput
            label="Secondary Color"
            value={settings.secondary_color}
            onChange={(v) => onChange("secondary_color", v)}
          />
          <ColorInput
            label="Accent Color"
            value={settings.accent_color}
            onChange={(v) => onChange("accent_color", v)}
          />
          <ColorInput
            label="Header Text"
            value={settings.header_text_color}
            onChange={(v) => onChange("header_text_color", v)}
          />
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-3">Table Colors</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorInput
              label="Table Header Background"
              value={settings.table_header_bg}
              onChange={(v) => onChange("table_header_bg", v)}
            />
            <ColorInput
              label="Table Header Text"
              value={settings.table_header_text}
              onChange={(v) => onChange("table_header_text", v)}
            />
            <ColorInput
              label="Table Body Text"
              value={settings.table_text_color}
              onChange={(v) => onChange("table_text_color", v)}
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-3">Grand Total</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorInput
              label="Background"
              value={settings.grand_total_bg}
              onChange={(v) => onChange("grand_total_bg", v)}
            />
            <ColorInput
              label="Text"
              value={settings.grand_total_text}
              onChange={(v) => onChange("grand_total_text", v)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
