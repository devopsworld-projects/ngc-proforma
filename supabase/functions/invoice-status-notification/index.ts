import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Allowed origins for CORS - restrict to known domains
const allowedOrigins = [
  "https://ngc-proforma.lovable.app",
  "https://id-preview--27d0addb-0e86-4cfe-ba91-58eb00bddc41.lovable.app",
];

// Add localhost for development if needed
if (Deno.env.get("DENO_ENV") !== "production") {
  allowedOrigins.push("http://localhost:5173", "http://localhost:3000");
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  ) ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

interface StatusNotificationRequest {
  invoiceId: string;
  invoiceNo: string;
  newStatus: string;
  recipientEmail: string;
  recipientName: string;
  grandTotal: string;
  companyName: string;
}

// Sanitize text to prevent XSS in email HTML
function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateString(value: string | undefined, maxLength: number, defaultValue: string = ""): string {
  if (!value || typeof value !== "string") return defaultValue;
  return value.trim().slice(0, maxLength);
}

function getStatusConfig(status: string): { color: string; icon: string; message: string; subject: string } {
  switch (status.toLowerCase()) {
    case "sent":
      return {
        color: "#3b82f6",
        icon: "📤",
        message: "Your invoice has been sent and is awaiting payment.",
        subject: "Invoice Sent",
      };
    case "paid":
      return {
        color: "#22c55e",
        icon: "✅",
        message: "Payment has been received. Thank you for your business!",
        subject: "Payment Received",
      };
    case "cancelled":
      return {
        color: "#ef4444",
        icon: "❌",
        message: "This invoice has been cancelled. Please contact us if you have any questions.",
        subject: "Invoice Cancelled",
      };
    default:
      return {
        color: "#64748b",
        icon: "📋",
        message: "The status of your invoice has been updated.",
        subject: "Invoice Updated",
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    
    // Validate inputs
    const invoiceNo = validateString(body.invoiceNo, 50);
    const newStatus = validateString(body.newStatus, 20);
    const recipientEmail = validateString(body.recipientEmail, 255);
    const recipientName = validateString(body.recipientName, 100, "Valued Customer");
    const grandTotal = validateString(body.grandTotal, 50);
    const companyName = validateString(body.companyName, 200, "Invoice System");

    if (!recipientEmail || !invoiceNo || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const statusConfig = getStatusConfig(newStatus);
    
    // Sanitize for HTML
    const safeRecipientName = sanitizeHtml(recipientName);
    const safeCompanyName = sanitizeHtml(companyName);
    const safeInvoiceNo = sanitizeHtml(invoiceNo);
    const safeGrandTotal = sanitizeHtml(grandTotal);
    const safeStatus = sanitizeHtml(newStatus);

    const emailResponse = await resend.emails.send({
      from: `${safeCompanyName} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `${statusConfig.subject} - Invoice #${safeInvoiceNo}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">${safeCompanyName}</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Invoice Status Update</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0;">Dear ${safeRecipientName},</p>
            
            <div style="background: ${statusConfig.color}15; border-left: 4px solid ${statusConfig.color}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 18px;">
                <span style="font-size: 24px; margin-right: 8px;">${statusConfig.icon}</span>
                Invoice #${safeInvoiceNo} is now <strong style="color: ${statusConfig.color};">${safeStatus.toUpperCase()}</strong>
              </p>
            </div>
            
            <p>${statusConfig.message}</p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">#${safeInvoiceNo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: ${statusConfig.color}20; color: ${statusConfig.color}; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; text-transform: uppercase;">${safeStatus}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 18px; color: #1e293b;">${safeGrandTotal}</td>
                </tr>
              </table>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p style="color: #64748b; margin-top: 20px;">Best regards,<br><strong>${safeCompanyName}</strong></p>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; color: #64748b; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from ${safeCompanyName}</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Status notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in invoice-status-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(null) } }
    );
  }
};

serve(handler);
