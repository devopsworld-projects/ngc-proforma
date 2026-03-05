import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Missing invoice ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch invoice with customer data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, customers(*), billing_address:addresses!billing_address_id(*)")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sl_no", { ascending: true });

    if (itemsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch items" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company settings (global, most recent)
    const { data: companySettings } = await supabase
      .from("company_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch PDF template settings (global, most recent)
    const { data: templateSettings } = await supabase
      .from("pdf_template_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        invoice: { ...invoice, items },
        companySettings,
        templateSettings,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
