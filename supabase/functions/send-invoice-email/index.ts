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
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')
  ) ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  pdfBase64: string;
  invoiceNo: string;
  grandTotal: string;
  companyName: string;
  senderEmail?: string;
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

// Validate and truncate string inputs
function validateString(value: string | undefined, maxLength: number, defaultValue: string = ""): string {
  if (!value || typeof value !== "string") return defaultValue;
  return value.trim().slice(0, maxLength);
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
        JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
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
      console.error("JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    const body = await req.json();
    
    // Validate and sanitize inputs with length limits
    const recipientEmail = validateString(body.recipientEmail, 255);
    const recipientName = validateString(body.recipientName, 100, "Valued Customer");
    const invoiceNo = validateString(body.invoiceNo, 50);
    const grandTotal = validateString(body.grandTotal, 50);
    const companyName = validateString(body.companyName, 200, "Invoice");
    const pdfBase64 = body.pdfBase64;

    // Validate required fields
    if (!recipientEmail || !invoiceNo) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail or invoiceNo" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate PDF base64 (max 10MB)
    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing PDF attachment" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const pdfSizeBytes = (pdfBase64.length * 3) / 4; // Approximate decoded size
    const maxPdfSize = 10 * 1024 * 1024; // 10MB
    if (pdfSizeBytes > maxPdfSize) {
      return new Response(
        JSON.stringify({ error: "PDF file too large (max 10MB)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Convert base64 to Uint8Array for attachment
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));

    // Sanitize values for HTML rendering
    const safeRecipientName = sanitizeHtml(recipientName);
    const safeCompanyName = sanitizeHtml(companyName);
    const safeInvoiceNo = sanitizeHtml(invoiceNo);
    const safeGrandTotal = sanitizeHtml(grandTotal);

    const emailResponse = await resend.emails.send({
      from: `${safeCompanyName} <noreply@proforma-invoice.globalshopee.com>`,
      to: [recipientEmail],
      subject: `Invoice #${safeInvoiceNo} from ${safeCompanyName}`,
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
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Invoice Notification</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0;">Dear ${safeRecipientName},</p>
            
            <p>Please find attached Invoice <strong>#${safeInvoiceNo}</strong> for your records.</p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">#${safeInvoiceNo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Amount Due:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 18px; color: #1e293b;">${safeGrandTotal}</td>
                </tr>
              </table>
            </div>
            
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
            
            <p style="margin-bottom: 0;">Thank you for your business!</p>
            <p style="color: #64748b; margin-top: 5px;">Best regards,<br><strong>${safeCompanyName}</strong></p>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; color: #64748b; font-size: 12px;">
            <p style="margin: 0;">This email was sent by ${safeCompanyName}</p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Invoice-${safeInvoiceNo}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: emailResponse.error.message || "Failed to send email",
          details: emailResponse.error.name === "validation_error" 
            ? "To send emails to recipients other than your own email, please verify a domain at resend.com/domains"
            : undefined
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(null) } }
    );
  }
};

serve(handler);
