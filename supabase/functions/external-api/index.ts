import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return jsonResponse({ error: "Missing x-api-key header" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate API key
    const keyHash = await hashKey(apiKey);
    const { data: userId, error: validateError } = await supabaseAdmin.rpc(
      "validate_api_key",
      { key_hash_input: keyHash }
    );

    if (validateError || !userId) {
      return jsonResponse({ error: "Invalid or expired API key" }, 401);
    }

    // Parse URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Path: /external-api/{resource}/{id?}
    const resource = pathParts[1] || "";
    const resourceId = pathParts[2] || null;

    switch (resource) {
      case "products":
        return await handleProducts(supabaseAdmin, req, resourceId);
      case "invoices":
        return await handleInvoices(supabaseAdmin, req, resourceId);
      case "customers":
        return await handleCustomers(supabaseAdmin, req, resourceId);
      default:
        return jsonResponse({
          message: "NGC Proforma API",
          endpoints: [
            "GET/POST /external-api/products",
            "GET/PUT /external-api/products/:id",
            "GET/POST /external-api/invoices",
            "GET /external-api/invoices/:id",
            "GET/POST /external-api/customers",
            "GET/PUT /external-api/customers/:id",
          ],
        });
    }
  } catch (error) {
    console.error("API error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function handleProducts(supabase: any, req: Request, id: string | null) {
  if (req.method === "GET") {
    if (id) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (error) return jsonResponse({ error: "Product not found" }, 404);
      return jsonResponse(data);
    }
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("name")
      .range(offset, offset + limit - 1);

    if (search) {
      const sanitized = search.replace(/[%_\\'"`;]/g, "").trim().slice(0, 100);
      if (sanitized) {
        query = query.or(
          `name.ilike.%${sanitized}%,sku.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ data, total: count, limit, offset });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { name, rate, unit, sku, hsn_code, category, description, stock_quantity, gst_percent, model_spec, size_label, user_id } = body;
    if (!name) return jsonResponse({ error: "name is required" }, 400);
    if (!user_id) return jsonResponse({ error: "user_id is required" }, 400);

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        rate: rate || 0,
        unit: unit || "NOS",
        sku: sku || null,
        hsn_code: hsn_code || null,
        category: category || null,
        description: description || null,
        stock_quantity: stock_quantity ?? 0,
        gst_percent: gst_percent ?? 18,
        model_spec: model_spec || null,
        size_label: size_label || null,
        user_id,
      })
      .select()
      .single();
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse(data, 201);
  }

  if (req.method === "PUT" && id) {
    const body = await req.json();
    const { data, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse(data);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}

async function handleInvoices(supabase: any, req: Request, id: string | null) {
  if (req.method === "GET") {
    if (id) {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (error) return jsonResponse({ error: "Invoice not found" }, 404);

      // Get customer info
      if (data.customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", data.customer_id)
          .single();
        data.customer = customer;
      }
      return jsonResponse(data);
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("user_id");

    let query = supabase
      .from("invoices")
      .select("id, invoice_no, date, status, grand_total, subtotal, customer_id, user_id, created_at, quote_for", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (userId) query = query.eq("user_id", userId);

    const { data, error, count } = await query;
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ data, total: count, limit, offset });
  }

  return jsonResponse({ error: "Method not allowed. Use the app to create invoices." }, 405);
}

async function handleCustomers(supabase: any, req: Request, id: string | null) {
  if (req.method === "GET") {
    if (id) {
      const { data, error } = await supabase
        .from("customers")
        .select("*, addresses(*)")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (error) return jsonResponse({ error: "Customer not found" }, 404);
      return jsonResponse(data);
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";
    const userId = url.searchParams.get("user_id");

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("name")
      .range(offset, offset + limit - 1);

    if (search) {
      const sanitized = search.replace(/[%_\\'"`;]/g, "").trim().slice(0, 100);
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
      }
    }
    if (userId) query = query.eq("user_id", userId);

    const { data, error, count } = await query;
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ data, total: count, limit, offset });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { name, user_id } = body;
    if (!name) return jsonResponse({ error: "name is required" }, 400);
    if (!user_id) return jsonResponse({ error: "user_id is required" }, 400);

    const { data, error } = await supabase
      .from("customers")
      .insert({
        name,
        email: body.email || null,
        phone: body.phone || null,
        gstin: body.gstin || null,
        state: body.state || null,
        state_code: body.state_code || null,
        customer_type: body.customer_type || "customer",
        tax_type: body.tax_type || "cgst",
        user_id,
      })
      .select()
      .single();
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse(data, 201);
  }

  if (req.method === "PUT" && id) {
    const body = await req.json();
    const { data, error } = await supabase
      .from("customers")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse(data);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}
