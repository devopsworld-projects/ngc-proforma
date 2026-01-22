import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      invoiceId,
      recipientEmail,
      recipientName,
      pdfBase64,
      invoiceNo,
      grandTotal,
      companyName,
      senderEmail,
    }: SendInvoiceRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !pdfBase64 || !invoiceNo) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail, pdfBase64, or invoiceNo" }),
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

    // Convert base64 to Uint8Array for attachment
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));

    const emailResponse = await resend.emails.send({
      from: senderEmail || `${companyName || 'Invoice'} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject: `Invoice #${invoiceNo} from ${companyName || 'Our Company'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">${companyName || 'Invoice'}</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Invoice Notification</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0;">Dear ${recipientName || 'Valued Customer'},</p>
            
            <p>Please find attached Invoice <strong>#${invoiceNo}</strong> for your records.</p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">#${invoiceNo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Amount Due:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 18px; color: #1e293b;">${grandTotal}</td>
                </tr>
              </table>
            </div>
            
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
            
            <p style="margin-bottom: 0;">Thank you for your business!</p>
            <p style="color: #64748b; margin-top: 5px;">Best regards,<br><strong>${companyName || 'The Team'}</strong></p>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; color: #64748b; font-size: 12px;">
            <p style="margin: 0;">This email was sent by ${companyName || 'Invoice System'}</p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Invoice-${invoiceNo}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
