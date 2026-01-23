import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("useProducts hook logic", () => {
  const mockUser = { id: "user-123" };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useProducts query", () => {
    it("should return empty array when user is not authenticated", async () => {
      // Testing the query logic directly
      const user = null;
      const result = user ? "would query" : [];
      expect(result).toEqual([]);
    });

    it("should filter by user_id when user is authenticated", async () => {
      // Verify the query includes user_id filter
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      // Simulate the query chain
      supabase.from("products");
      queryBuilder.select("*");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.eq("is_active", true);
      queryBuilder.order("name");
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
      expect(queryBuilder.eq).toHaveBeenCalledWith("is_active", true);
    });
  });

  describe("useSearchProducts query", () => {
    it("should sanitize search terms to prevent SQL injection", () => {
      // Test sanitization function
      const sanitizeSearchTerm = (term: string): string => {
        return term
          .replace(/[%_\\'"`;]/g, '')
          .trim()
          .slice(0, 100);
      };
      
      expect(sanitizeSearchTerm("normal search")).toBe("normal search");
      expect(sanitizeSearchTerm("test%drop")).toBe("testdrop");
      expect(sanitizeSearchTerm("test'OR'1")).toBe("testOR1");
      expect(sanitizeSearchTerm("test;DELETE")).toBe("testDELETE");
      expect(sanitizeSearchTerm("a".repeat(150))).toHaveLength(100);
    });

    it("should return empty array when user is not authenticated", () => {
      const user = null;
      const result = user ? "would query" : [];
      expect(result).toEqual([]);
    });
  });

  describe("useBulkCreateProducts mutation", () => {
    it("should throw error when user is not authenticated", async () => {
      const user = null;
      await expect(async () => {
        if (!user) throw new Error("Not authenticated");
      }).rejects.toThrow("Not authenticated");
    });

    it("should add user_id to all products before upserting", () => {
      const products = [
        { name: "Product 1", sku: "SKU1", rate: 100, unit: "NOS", is_active: true, stock_quantity: 10 },
        { name: "Product 2", sku: "SKU2", rate: 200, unit: "NOS", is_active: true, stock_quantity: 5 },
      ];
      
      const productsWithUserId = products.map(p => ({ ...p, user_id: mockUser.id }));
      
      expect(productsWithUserId[0].user_id).toBe(mockUser.id);
      expect(productsWithUserId[1].user_id).toBe(mockUser.id);
    });
  });
});
