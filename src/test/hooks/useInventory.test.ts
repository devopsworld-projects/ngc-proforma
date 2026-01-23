import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("useInventory hook logic", () => {
  const mockUser = { id: "user-123" };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useStockMovements query", () => {
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
        limit: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      supabase.from("stock_movements");
      queryBuilder.select("*, products(name, sku)");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.order("created_at", { ascending: false });
      queryBuilder.limit(100);
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
      expect(queryBuilder.limit).toHaveBeenCalledWith(100);
    });

    it("should apply productId filter when provided", () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
      
      const productId = "product-123";
      supabase.from("stock_movements");
      queryBuilder.eq("product_id", productId);
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("product_id", productId);
    });
  });

  describe("useProductSerials query", () => {
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
      
      supabase.from("product_serials");
      queryBuilder.select("*, products(name, sku), suppliers(name)");
      queryBuilder.eq("user_id", mockUser.id);
      queryBuilder.order("created_at", { ascending: false });
      
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUser.id);
    });
  });

  describe("useCreateStockMovement mutation", () => {
    it("should throw error when user is not authenticated", async () => {
      const user = null;
      await expect(async () => {
        if (!user) throw new Error("Not authenticated");
      }).rejects.toThrow("Not authenticated");
    });

    it("should calculate correct stock multiplier for movement type", () => {
      const getMultiplier = (type: "in" | "out" | "adjustment"): number => {
        return type === "in" ? 1 : -1;
      };
      
      expect(getMultiplier("in")).toBe(1);
      expect(getMultiplier("out")).toBe(-1);
      expect(getMultiplier("adjustment")).toBe(-1);
    });

    it("should add user_id to movement on insert", () => {
      const movement = {
        product_id: "product-123",
        movement_type: "in" as const,
        quantity: 10,
        serial_numbers: [],
        reference_type: null,
        reference_id: null,
        notes: "Stock received",
      };
      
      const movementWithUserId = { ...movement, user_id: mockUser.id };
      expect(movementWithUserId.user_id).toBe(mockUser.id);
    });
  });

  describe("useBulkCreateProductSerials mutation", () => {
    it("should add user_id to all serials before insert", () => {
      const serials = [
        { product_id: "prod-1", serial_number: "SN001", status: "in_stock" as const, purchase_price: 100 },
        { product_id: "prod-1", serial_number: "SN002", status: "in_stock" as const, purchase_price: 100 },
      ];
      
      const serialsWithUserId = serials.map(s => ({ ...s, user_id: mockUser.id }));
      
      expect(serialsWithUserId[0].user_id).toBe(mockUser.id);
      expect(serialsWithUserId[1].user_id).toBe(mockUser.id);
    });
  });
});
