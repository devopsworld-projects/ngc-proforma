import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Building2 } from "lucide-react";

interface ContentSettingsPanelProps {
  settings: {
    invoice_title: string;
    bill_to_label: string;
    invoice_details_label: string;
    terms_line1: string | null;
    terms_line2: string | null;
    terms_line3: string | null;
    terms_line4: string | null;
    terms_line5: string | null;
    terms_line6: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_no: string | null;
    bank_ifsc: string | null;
    bank_branch: string | null;
  };
  onChange: (key: string, value: string | null) => void;
}

export function ContentSettingsPanel({ settings, onChange }: ContentSettingsPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Labels & Titles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Invoice Title</Label>
              <Input
                value={settings.invoice_title}
                onChange={(e) => onChange("invoice_title", e.target.value)}
                placeholder="PROFORMA INVOICE"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bill To Label</Label>
              <Input
                value={settings.bill_to_label}
                onChange={(e) => onChange("bill_to_label", e.target.value)}
                placeholder="Bill To"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Invoice Details Label</Label>
              <Input
                value={settings.invoice_details_label}
                onChange={(e) => onChange("invoice_details_label", e.target.value)}
                placeholder="Invoice Details"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Term Line 1</Label>
            <Input
              value={settings.terms_line1 || ""}
              onChange={(e) => onChange("terms_line1", e.target.value || null)}
              placeholder="Goods once sold will not be taken back."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Term Line 2</Label>
            <Input
              value={settings.terms_line2 || ""}
              onChange={(e) => onChange("terms_line2", e.target.value || null)}
              placeholder="Subject to local jurisdiction only."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Term Line 3</Label>
            <Input
              value={settings.terms_line3 || ""}
              onChange={(e) => onChange("terms_line3", e.target.value || null)}
              placeholder="E&OE - Errors and Omissions Excepted."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Term Line 4</Label>
            <Input
              value={settings.terms_line4 || ""}
              onChange={(e) => onChange("terms_line4", e.target.value || null)}
              placeholder="Additional term..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Term Line 5</Label>
            <Input
              value={settings.terms_line5 || ""}
              onChange={(e) => onChange("terms_line5", e.target.value || null)}
              placeholder="Additional term..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Term Line 6</Label>
            <Input
              value={settings.terms_line6 || ""}
              onChange={(e) => onChange("terms_line6", e.target.value || null)}
              placeholder="Additional term..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4" />
            Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name</Label>
              <Input
                value={settings.bank_name || ""}
                onChange={(e) => onChange("bank_name", e.target.value || null)}
                placeholder="Bank name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Holder Name</Label>
              <Input
                value={settings.bank_account_name || ""}
                onChange={(e) => onChange("bank_account_name", e.target.value || null)}
                placeholder="Account holder name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number</Label>
              <Input
                value={settings.bank_account_no || ""}
                onChange={(e) => onChange("bank_account_no", e.target.value || null)}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">IFSC Code</Label>
              <Input
                value={settings.bank_ifsc || ""}
                onChange={(e) => onChange("bank_ifsc", e.target.value || null)}
                placeholder="IFSC code"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Branch Name</Label>
              <Input
                value={settings.bank_branch || ""}
                onChange={(e) => onChange("bank_branch", e.target.value || null)}
                placeholder="Branch name"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
