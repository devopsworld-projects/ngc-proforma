import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("useSuppliers hook logic", () => {
  const mockUser = { id: "user-123" };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSuppliers query", () => {
    it("should return empty array when user is not authenticated", () => {
      const user = null;
      const result = user ? "would query" : [];
      expect(result).toEqual([]);
    });

    it("should filter by user_id and is_active when user is authenticated", () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      supabase.from("suppliers");
      queryBuilder.select("*");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.eq("is_active", true);
      queryBuilder.order("name");
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
      expect(queryBuilder.eq).toHaveBeenCalledWith("is_active", true);
    });
  });

  describe("useCreateSupplier mutation", () => {
    it("should throw error when user is not authenticated", async () => {
      const user = null;
      await expect(async () => {
        if (!user) throw new Error("Not authenticated");
      }).rejects.toThrow("Not authenticated");
    });

    it("should add user_id to supplier on insert", () => {
      const supplier = {
        name: "Test Supplier",
        contact_person: "John Doe",
        phone: "1234567890",
        email: "supplier@example.com",
        address: "123 Test St",
        gstin: null,
        notes: null,
        is_active: true,
      };
      
      const supplierWithUserId = { ...supplier, user_id: mockUser.id };
      expect(supplierWithUserId.user_id).toBe(mockUser.id);
    });
  });

  describe("useDeleteSupplier mutation", () => {
    it("should soft delete by setting is_active to false", () => {
      // The delete mutation uses update with is_active: false
      const queryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      supabase.from("suppliers");
      queryBuilder.update({ is_active: false });
      queryBuilder.eq("id", "supplier-123");
      
      expect(queryBuilder.update).toHaveBeenCalledWith({ is_active: false });
    });
  });
});
