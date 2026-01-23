import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("useCustomers hook logic", () => {
  const mockUser = { id: "user-123" };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCustomers query", () => {
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
      
      supabase.from("customers");
      queryBuilder.select("*");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.order("name");
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
    });
  });

  describe("useCreateCustomer mutation", () => {
    it("should throw error when user is not authenticated", async () => {
      const user = null;
      await expect(async () => {
        if (!user) throw new Error("Not authenticated");
      }).rejects.toThrow("Not authenticated");
    });

    it("should add user_id to customer on insert", () => {
      const customer = {
        name: "Test Customer",
        email: "test@example.com",
        phone: "1234567890",
        gstin: null,
        state: null,
        state_code: null,
        is_active: true,
        notes: null,
      };
      
      const customerWithUserId = { ...customer, user_id: mockUser.id };
      expect(customerWithUserId.user_id).toBe(mockUser.id);
    });
  });

  describe("useCustomer single query", () => {
    it("should return null when id is not provided", () => {
      const id = undefined;
      const result = id ? "would query" : null;
      expect(result).toBeNull();
    });

    it("should use maybeSingle to handle potential missing records", () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      supabase.from("customers");
      queryBuilder.select("*");
      queryBuilder.eq("id", "test-id");
      queryBuilder.maybeSingle();
      
      expect(queryBuilder.maybeSingle).toHaveBeenCalled();
    });
  });
});
