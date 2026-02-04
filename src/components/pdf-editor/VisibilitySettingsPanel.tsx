import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

interface VisibilitySettingsPanelProps {
  settings: {
    show_logo: boolean;
    show_gstin_header: boolean;
    show_contact_header: boolean;
    show_company_state: boolean;
    show_shipping_address: boolean;
    show_customer_email: boolean;
    show_customer_phone: boolean;
    show_image_column: boolean;
    show_brand_column: boolean;
    show_unit_column: boolean;
    show_serial_numbers: boolean;
    show_discount_column: boolean;
    show_terms: boolean;
    show_signature: boolean;
    show_amount_words: boolean;
  };
  onChange: (key: string, value: boolean) => void;
}

interface ToggleItemProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleItem({ label, description, checked, onCheckedChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function VisibilitySettingsPanel({ settings, onChange }: VisibilitySettingsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="w-4 h-4" />
          Section Visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="space-y-1 pb-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Header</p>
          <ToggleItem
            label="Company Logo"
            checked={settings.show_logo}
            onCheckedChange={(v) => onChange("show_logo", v)}
          />
          <ToggleItem
            label="GSTIN in Header"
            checked={settings.show_gstin_header}
            onCheckedChange={(v) => onChange("show_gstin_header", v)}
          />
          <ToggleItem
            label="Contact Info"
            description="Phone, email, website"
            checked={settings.show_contact_header}
            onCheckedChange={(v) => onChange("show_contact_header", v)}
          />
          <ToggleItem
            label="Company State"
            checked={settings.show_company_state}
            onCheckedChange={(v) => onChange("show_company_state", v)}
          />
        </div>

        <div className="space-y-1 py-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
          <ToggleItem
            label="Shipping Address"
            checked={settings.show_shipping_address}
            onCheckedChange={(v) => onChange("show_shipping_address", v)}
          />
          <ToggleItem
            label="Customer Email"
            checked={settings.show_customer_email}
            onCheckedChange={(v) => onChange("show_customer_email", v)}
          />
          <ToggleItem
            label="Customer Phone"
            checked={settings.show_customer_phone}
            onCheckedChange={(v) => onChange("show_customer_phone", v)}
          />
        </div>

        <div className="space-y-1 py-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Table Columns</p>
          <ToggleItem
            label="Product Images"
            checked={settings.show_image_column}
            onCheckedChange={(v) => onChange("show_image_column", v)}
          />
          <ToggleItem
            label="Brand Column"
            checked={settings.show_brand_column}
            onCheckedChange={(v) => onChange("show_brand_column", v)}
          />
          <ToggleItem
            label="Unit Column"
            checked={settings.show_unit_column}
            onCheckedChange={(v) => onChange("show_unit_column", v)}
          />
          <ToggleItem
            label="Serial Numbers"
            checked={settings.show_serial_numbers}
            onCheckedChange={(v) => onChange("show_serial_numbers", v)}
          />
          <ToggleItem
            label="Discount Column"
            checked={settings.show_discount_column}
            onCheckedChange={(v) => onChange("show_discount_column", v)}
          />
        </div>

        <div className="space-y-1 pt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Footer</p>
          <ToggleItem
            label="Terms & Conditions"
            checked={settings.show_terms}
            onCheckedChange={(v) => onChange("show_terms", v)}
          />
          <ToggleItem
            label="Signature Section"
            checked={settings.show_signature}
            onCheckedChange={(v) => onChange("show_signature", v)}
          />
          <ToggleItem
            label="Amount in Words"
            checked={settings.show_amount_words}
            onCheckedChange={(v) => onChange("show_amount_words", v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
