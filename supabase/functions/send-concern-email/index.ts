import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DEVELOPER_EMAIL = "eswarchinthakayala@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, message, priority, userEmail, userName } = await req.json();

    const priorityEmoji: Record<string, string> = {
      low: "🟢 Low",
      medium: "🟡 Medium",
      high: "🔴 High",
      critical: "🚨 CRITICAL",
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #294172; border-bottom: 2px solid #294172; padding-bottom: 10px;">
          🛎️ New Concern Raised — Global Shopee
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">From:</td><td style="padding: 8px;">${userName} (${userEmail})</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Priority:</td><td style="padding: 8px;">${priorityEmoji[priority] || priority}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Subject:</td><td style="padding: 8px;">${subject}</td></tr>
        </table>
        <div style="background: #f9fafb; border-left: 4px solid #294172; padding: 16px; margin: 16px 0; white-space: pre-wrap;">
          ${message}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          This email was sent automatically from the Global Shopee Proforma Invoice application.
        </p>
      </div>
    `;

    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Global Shopee <onboarding@resend.dev>",
          to: [DEVELOPER_EMAIL],
          subject: `[${priority.toUpperCase()}] Concern: ${subject}`,
          html: emailHtml,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Resend error:", errText);
      }
    } else {
      console.log("RESEND_API_KEY not set. Concern logged but email not sent.");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
