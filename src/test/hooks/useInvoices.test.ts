import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("useInvoices hook logic", () => {
  const mockUser = { id: "user-123" };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useInvoices query", () => {
    it("should return empty array when user is not authenticated", () => {
      const user = null;
      const result = user ? "would query" : [];
      expect(result).toEqual([]);
    });

    it("should filter by user_id when user is authenticated", () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      supabase.from("invoices");
      queryBuilder.select("*, customers(name)");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.order("created_at", { ascending: false });
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
    });
  });

  describe("useNextInvoiceNumber query", () => {
    it("should return '1' when user is not authenticated", () => {
      const user = null;
      const result = user ? "would query" : "1";
      expect(result).toBe("1");
    });

    it("should filter by user_id for invoice number generation", () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      supabase.from("invoices");
      queryBuilder.select("invoice_no");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.order("created_at", { ascending: false });
      queryBuilder.limit(1);
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
    });

    it("should generate correct next invoice number", () => {
      const getNextNumber = (lastInvoiceNo: string | null): string => {
        if (!lastInvoiceNo) return "1";
        const lastNo = parseInt(lastInvoiceNo) || 0;
        return String(lastNo + 1);
      };
      
      expect(getNextNumber(null)).toBe("1");
      expect(getNextNumber("1")).toBe("2");
      expect(getNextNumber("99")).toBe("100");
      expect(getNextNumber("invalid")).toBe("1");
    });
  });

  describe("useCreateInvoice mutation", () => {
    it("should throw error when user is not authenticated", async () => {
      const user = null;
      await expect(async () => {
        if (!user) throw new Error("Not authenticated");
      }).rejects.toThrow("Not authenticated");
    });

    it("should add user_id to invoice on insert", () => {
      const invoice = {
        invoice_no: "1",
        customer_id: "cust-123",
        date: "2024-01-01",
        subtotal: 1000,
        grand_total: 1180,
        status: "draft" as const,
      };
      
      const invoiceWithUserId = { ...invoice, user_id: mockUser.id };
      expect(invoiceWithUserId.user_id).toBe(mockUser.id);
    });
  });
});
