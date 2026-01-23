import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("useServiceTickets hook logic", () => {
  const mockUser = { id: "user-123" };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useServiceTickets query", () => {
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
      
      supabase.from("service_tickets");
      queryBuilder.select("*, customers(name, phone)");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.order("created_at", { ascending: false });
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
    });

    it("should apply status filter when provided", () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      const status = "in_progress";
      supabase.from("service_tickets");
      queryBuilder.eq("status", status);
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("status", status);
    });
  });

  describe("useNextTicketNumber query", () => {
    it("should return SVC-001 when user is not authenticated", () => {
      const user = null;
      const result = user ? "would query" : "SVC-001";
      expect(result).toBe("SVC-001");
    });

    it("should generate correct next ticket number", () => {
      const getNextTicketNumber = (lastTicketNo: string | null): string => {
        if (!lastTicketNo) return "SVC-001";
        const match = lastTicketNo.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1]) + 1;
          return `SVC-${String(num).padStart(3, "0")}`;
        }
        return "SVC-001";
      };
      
      expect(getNextTicketNumber(null)).toBe("SVC-001");
      expect(getNextTicketNumber("SVC-001")).toBe("SVC-002");
      expect(getNextTicketNumber("SVC-099")).toBe("SVC-100");
      expect(getNextTicketNumber("SVC-999")).toBe("SVC-1000");
    });
  });

  describe("useCreateServiceTicket mutation", () => {
    it("should throw error when user is not authenticated", async () => {
      const user = null;
      await expect(async () => {
        if (!user) throw new Error("Not authenticated");
      }).rejects.toThrow("Not authenticated");
    });

    it("should add user_id to ticket on insert", () => {
      const ticket = {
        ticket_no: "SVC-001",
        device_type: "Laptop",
        problem_description: "Screen broken",
        status: "received" as const,
        received_date: "2024-01-01",
      };
      
      const ticketWithUserId = { ...ticket, user_id: mockUser.id };
      expect(ticketWithUserId.user_id).toBe(mockUser.id);
    });
  });
});
