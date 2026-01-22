import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatusNotificationParams {
  invoiceId: string;
  invoiceNo: string;
  newStatus: string;
  recipientEmail: string;
  recipientName: string;
  grandTotal: string;
  companyName: string;
}

export function useSendStatusNotification() {
  return useMutation({
    mutationFn: async (params: StatusNotificationParams) => {
      const { data, error } = await supabase.functions.invoke("invoice-status-notification", {
        body: params,
      });

      if (error) throw error;
      return data;
    },
  });
}
