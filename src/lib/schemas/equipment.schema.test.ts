/**
 * Unit tests for Equipment Schemas
 *
 * Tests validation logic for equipment-related schemas including:
 * - createEquipmentSchema: validates all required fields for creating equipment
 * - equipmentListParamsSchema: validates query parameters for listing equipment
 * - updateEquipmentSchema: validates partial updates
 */
import { describe, it, expect } from "vitest";
import {
  createEquipmentSchema,
  equipmentListParamsSchema,
  updateEquipmentSchema,
  equipmentCategoryEnum,
} from "./equipment.schema";

describe("Equipment Schema Validation", () => {
  describe("createEquipmentSchema", () => {
    it("should validate correct equipment data with all required fields", () => {
      const validData = {
        name: "Laptop Dell Latitude",
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
      };

      const result = createEquipmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should validate equipment data with optional fields", () => {
      const validData = {
        name: "Laptop Dell Latitude",
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
        description: "Company laptop for development",
        location: "Office Building A, Floor 3",
        purchase_date: "2024-01-15",
      };

      const result = createEquipmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Company laptop for development");
        expect(result.data.location).toBe("Office Building A, Floor 3");
        expect(result.data.purchase_date).toBe("2024-01-15");
      }
    });

    it("should reject equipment data with missing required name field", () => {
      const invalidData = {
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
      };

      const result = createEquipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
        expect(result.error.issues[0].message).toBe("Required");
      }
    });

    it("should reject equipment data with empty name", () => {
      const invalidData = {
        name: "",
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
      };

      const result = createEquipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Name is required");
      }
    });

    it("should reject equipment data with name exceeding 100 characters", () => {
      const invalidData = {
        name: "A".repeat(101),
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
      };

      const result = createEquipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Name must be at most 100 characters");
      }
    });

    it("should reject equipment data with invalid category", () => {
      const invalidData = {
        name: "Laptop Dell Latitude",
        category: "invalid_category",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
      };

      const result = createEquipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("category");
      }
    });

    it("should accept all valid equipment categories", () => {
      const categories = ["computer", "printer", "monitor", "network_device", "phone", "tablet", "peripheral", "other"];

      categories.forEach((category) => {
        const validData = {
          name: "Test Equipment",
          category,
          manufacturer: "Test Manufacturer",
          model: "Test Model",
          serial_number: "SN123",
        };

        const result = createEquipmentSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it("should reject equipment data with invalid purchase_date format", () => {
      const invalidData = {
        name: "Laptop Dell Latitude",
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
        purchase_date: "15-01-2024", // Wrong format, should be YYYY-MM-DD
      };

      const result = createEquipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid date format (expected YYYY-MM-DD)");
      }
    });

    it("should accept null values for optional fields", () => {
      const validData = {
        name: "Laptop Dell Latitude",
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
        description: null,
        location: null,
        purchase_date: null,
      };

      const result = createEquipmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject equipment data with location exceeding 200 characters", () => {
      const invalidData = {
        name: "Laptop Dell Latitude",
        category: "computer",
        manufacturer: "Dell",
        model: "Latitude 5520",
        serial_number: "SN123456789",
        location: "A".repeat(201),
      };

      const result = createEquipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Location must be at most 200 characters");
      }
    });
  });

  describe("equipmentListParamsSchema", () => {
    it("should apply default values for pagination parameters", () => {
      const result = equipmentListParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sort).toBe("created_at");
        expect(result.data.order).toBe("desc");
      }
    });

    it("should coerce string numbers to integers for page and limit", () => {
      const result = equipmentListParamsSchema.safeParse({
        page: "2",
        limit: "25",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
      }
    });

    it("should reject page less than 1", () => {
      const result = equipmentListParamsSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = equipmentListParamsSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it("should accept valid sort fields", () => {
      const sortFields = ["created_at", "name", "equipment_id", "category", "manufacturer"];

      sortFields.forEach((sort) => {
        const result = equipmentListParamsSchema.safeParse({ sort });
        expect(result.success).toBe(true);
      });
    });

    it("should accept valid order values", () => {
      const result1 = equipmentListParamsSchema.safeParse({ order: "asc" });
      const result2 = equipmentListParamsSchema.safeParse({ order: "desc" });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it("should accept optional category filter", () => {
      const result = equipmentListParamsSchema.safeParse({ category: "computer" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe("computer");
      }
    });

    it("should accept optional search parameter", () => {
      const result = equipmentListParamsSchema.safeParse({ search: "EQ-2024-00001" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("EQ-2024-00001");
      }
    });
  });

  describe("updateEquipmentSchema", () => {
    it("should allow partial updates with only changed fields", () => {
      const partialData = {
        name: "Updated Laptop Name",
      };

      const result = updateEquipmentSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Laptop Name");
        expect(result.data.category).toBeUndefined();
      }
    });

    it("should allow updating multiple fields", () => {
      const partialData = {
        name: "Updated Laptop",
        location: "New Office",
      };

      const result = updateEquipmentSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Laptop");
        expect(result.data.location).toBe("New Office");
      }
    });

    it("should validate updated fields according to the same rules as create", () => {
      const invalidData = {
        name: "", // Empty name should be rejected
      };

      const result = updateEquipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should allow empty object for no updates", () => {
      const result = updateEquipmentSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("equipmentCategoryEnum", () => {
    it("should validate all valid equipment categories", () => {
      const validCategories = [
        "computer",
        "printer",
        "monitor",
        "network_device",
        "phone",
        "tablet",
        "peripheral",
        "other",
      ];

      validCategories.forEach((category) => {
        const result = equipmentCategoryEnum.safeParse(category);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid equipment category", () => {
      const result = equipmentCategoryEnum.safeParse("invalid_category");
      expect(result.success).toBe(false);
    });
  });
});
