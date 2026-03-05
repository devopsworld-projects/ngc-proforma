import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, BellRing, Package, Users, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PopupSetting {
  id: string;
  popup_key: string;
  is_enabled: boolean;
  title: string;
  message: string;
}

const POPUP_ICONS: Record<string, React.ReactNode> = {
  uncategorized_products: <Package className="h-5 w-5 text-muted-foreground" />,
  incomplete_customers: <Users className="h-5 w-5 text-muted-foreground" />,
  draft_proformas: <FileText className="h-5 w-5 text-muted-foreground" />,
};

const POPUP_LABELS: Record<string, string> = {
  uncategorized_products: "Uncategorized Products",
  incomplete_customers: "Incomplete Customers",
  draft_proformas: "Draft Proformas",
};

export function PopupManagerCard() {
  const [settings, setSettings] = useState<PopupSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("popup_settings")
      .select("*")
      .order("popup_key");

    if (error) {
      toast.error("Failed to load popup settings");
    } else {
      setSettings((data as PopupSetting[]) || []);
    }
    setLoading(false);
  };

  const handleToggle = async (setting: PopupSetting) => {
    const newEnabled = !setting.is_enabled;
    setSettings((prev) =>
      prev.map((s) => (s.id === setting.id ? { ...s, is_enabled: newEnabled } : s))
    );

    const { error } = await supabase
      .from("popup_settings")
      .update({ is_enabled: newEnabled, updated_at: new Date().toISOString() })
      .eq("id", setting.id);

    if (error) {
      toast.error("Failed to update toggle");
      setSettings((prev) =>
        prev.map((s) => (s.id === setting.id ? { ...s, is_enabled: !newEnabled } : s))
      );
    } else {
      toast.success(`${POPUP_LABELS[setting.popup_key] || setting.popup_key} popup ${newEnabled ? "enabled" : "disabled"}`);
    }
  };

  const handleFieldChange = (id: string, field: "title" | "message", value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async (setting: PopupSetting) => {
    setSaving(setting.id);
    const { error } = await supabase
      .from("popup_settings")
      .update({
        title: setting.title,
        message: setting.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", setting.id);

    if (error) {
      toast.error("Failed to save popup settings");
    } else {
      toast.success(`${POPUP_LABELS[setting.popup_key] || setting.popup_key} popup updated`);
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Popup Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Popup Manager
        </CardTitle>
        <CardDescription>
          Enable or disable popup notifications and customize their content for all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="rounded-lg border p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {POPUP_ICONS[setting.popup_key] || <BellRing className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="font-medium">{POPUP_LABELS[setting.popup_key] || setting.popup_key}</p>
                  <p className="text-xs text-muted-foreground">
                    {setting.is_enabled ? "Active — shown to all users" : "Disabled — not shown"}
                  </p>
                </div>
              </div>
              <Switch
                checked={setting.is_enabled}
                onCheckedChange={() => handleToggle(setting)}
              />
            </div>

            <div className="space-y-3 pl-8">
              <div>
                <Label htmlFor={`title-${setting.id}`} className="text-xs">Popup Title</Label>
                <Input
                  id={`title-${setting.id}`}
                  value={setting.title}
                  onChange={(e) => handleFieldChange(setting.id, "title", e.target.value)}
                  placeholder="Enter popup title"
                />
              </div>
              <div>
                <Label htmlFor={`message-${setting.id}`} className="text-xs">Popup Message</Label>
                <Textarea
                  id={`message-${setting.id}`}
                  value={setting.message}
                  onChange={(e) => handleFieldChange(setting.id, "message", e.target.value)}
                  placeholder="Enter popup message shown to users"
                  rows={2}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleSave(setting)}
                  disabled={saving === setting.id}
                >
                  {saving === setting.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
