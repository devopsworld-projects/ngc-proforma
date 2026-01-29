import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePricingSettings, useUpsertPricingSettings } from "@/hooks/usePricingSettings";
import { toast } from "sonner";
import { Percent, Save, Loader2 } from "lucide-react";

export function PricingSettingsCard() {
  const { data: settings, isLoading } = usePricingSettings();
  const upsertSettings = useUpsertPricingSettings();
  
  const [customerMarkup, setCustomerMarkup] = useState("0");
  const [dealerMarkup, setDealerMarkup] = useState("0");

  useEffect(() => {
    if (settings) {
      setCustomerMarkup(settings.customer_markup_percent?.toString() || "0");
      setDealerMarkup(settings.dealer_markup_percent?.toString() || "0");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await upsertSettings.mutateAsync({
        customer_markup_percent: parseFloat(customerMarkup) || 0,
        dealer_markup_percent: parseFloat(dealerMarkup) || 0,
      });
      toast.success("Pricing settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Pricing Settings
        </CardTitle>
        <CardDescription>
          Set price markup percentages for different customer types. These markups will be applied to product base prices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerMarkup">Customer Markup (%)</Label>
            <Input
              id="customerMarkup"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={customerMarkup}
              onChange={(e) => setCustomerMarkup(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Applied to regular customers
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dealerMarkup">Dealer Markup (%)</Label>
            <Input
              id="dealerMarkup"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={dealerMarkup}
              onChange={(e) => setDealerMarkup(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Applied to dealer accounts (typically lower)
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={upsertSettings.isPending}>
          {upsertSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
