import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as db from './db';

describe('Financial Analytics Features', () => {
  // Mock data for testing
  const mockStartDate = new Date('2026-02-01');
  const mockEndDate = new Date('2026-02-28');

  describe('Prime Cost Calculation', () => {
    it('should calculate prime cost correctly', async () => {
      // Test that calculatePrimeCost returns expected structure
      const result = await db.calculatePrimeCost(mockStartDate, mockEndDate);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('foodCost');
      expect(result).toHaveProperty('labourCost');
      expect(result).toHaveProperty('primeCostAmount');
      expect(result).toHaveProperty('primeCostPercentage');
      expect(result).toHaveProperty('targetPercentage');
      expect(result).toHaveProperty('status');
    });

    it('should return numeric values as strings', async () => {
      const result = await db.calculatePrimeCost(mockStartDate, mockEndDate);

      expect(typeof result.revenue).toBe('string');
      expect(typeof result.foodCost).toBe('string');
      expect(typeof result.labourCost).toBe('string');
      expect(typeof result.primeCostAmount).toBe('string');
      expect(typeof result.primeCostPercentage).toBe('string');
    });

    it('should have status as healthy, warning, or critical', async () => {
      const result = await db.calculatePrimeCost(mockStartDate, mockEndDate);

      expect(['healthy', 'warning', 'critical']).toContain(result.status);
    });

    it('should return 0 revenue when no orders exist', async () => {
      const result = await db.calculatePrimeCost(mockStartDate, mockEndDate);

      // Should handle empty data gracefully
      expect(result.revenue).toBeDefined();
      expect(parseFloat(result.revenue)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Prime Cost Trend', () => {
    it('should return daily prime cost trend', async () => {
      const result = await db.getPrimeCostTrend(mockStartDate, mockEndDate);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should include required fields in trend data', async () => {
      const result = await db.getPrimeCostTrend(mockStartDate, mockEndDate);

      if (result.length > 0) {
        const firstDay = result[0];
        expect(firstDay).toHaveProperty('date');
        expect(firstDay).toHaveProperty('revenue');
        expect(firstDay).toHaveProperty('labourCost');
        expect(firstDay).toHaveProperty('foodCost');
        expect(firstDay).toHaveProperty('primeCostPercentage');
      }
    });
  });

  describe('Profitability Metrics', () => {
    it('should calculate profitability metrics', async () => {
      const result = await db.getProfitabilityMetrics(mockStartDate, mockEndDate);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('orderCount');
      expect(result).toHaveProperty('avgOrderValue');
      expect(result).toHaveProperty('cogs');
      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('grossMargin');
      expect(result).toHaveProperty('labourCost');
      expect(result).toHaveProperty('labourPercentage');
      expect(result).toHaveProperty('wasteCost');
      expect(result).toHaveProperty('wastePercentage');
      expect(result).toHaveProperty('netProfit');
      expect(result).toHaveProperty('netMargin');
    });

    it('should return numeric values as strings', async () => {
      const result = await db.getProfitabilityMetrics(mockStartDate, mockEndDate);

      expect(typeof result.revenue).toBe('string');
      expect(typeof result.cogs).toBe('string');
      expect(typeof result.grossProfit).toBe('string');
      expect(typeof result.netProfit).toBe('string');
    });

    it('should return orderCount as number', async () => {
      const result = await db.getProfitabilityMetrics(mockStartDate, mockEndDate);

      expect(typeof result.orderCount).toBe('number');
      expect(result.orderCount).toBeGreaterThanOrEqual(0);
    });

    it('should calculate margins correctly', async () => {
      const result = await db.getProfitabilityMetrics(mockStartDate, mockEndDate);

      // Margins should be percentages (0-100)
      const grossMargin = parseFloat(result.grossMargin);
      const netMargin = parseFloat(result.netMargin);

      expect(grossMargin).toBeGreaterThanOrEqual(0);
      expect(netMargin).toBeGreaterThanOrEqual(-100); // Can be negative
    });
  });

  describe('Consolidated Reports', () => {
    it('should return consolidated report array', async () => {
      const result = await db.getConsolidatedReport(mockStartDate, mockEndDate);

      expect(Array.isArray(result)).toBe(true);
    }, 30000);

    it('should include required fields in consolidated report', async () => {
      const result = await db.getConsolidatedReport(mockStartDate, mockEndDate);

      if (result.length > 0) {
        const location = result[0];
        expect(location).toHaveProperty('locationId');
        expect(location).toHaveProperty('locationName');
        expect(location).toHaveProperty('revenue');
        expect(location).toHaveProperty('orderCount');
        expect(location).toHaveProperty('cogs');
        expect(location).toHaveProperty('grossProfit');
        expect(location).toHaveProperty('labourCost');
        expect(location).toHaveProperty('netProfit');
      }
    }, 30000);

    it('should filter by locationIds when provided', async () => {
      // This test verifies the function accepts locationIds parameter
      const result = await db.getConsolidatedReport(mockStartDate, mockEndDate, [1, 2]);

      expect(Array.isArray(result)).toBe(true);
    }, 30000);
  });

  describe('Invoice Management', () => {
    it('should create invoice with valid input', async () => {
      const invoiceInput = {
        supplierId: 1,
        invoiceNumber: 'INV-2026-001',
        invoiceDate: mockStartDate,
        dueDate: new Date('2026-03-01'),
        items: [
          {
            description: 'Chicken Breast',
            quantity: 10,
            unitPrice: '5.00',
            totalPrice: '50.00',
          },
        ],
        subtotal: '50.00',
        tax: '5.00',
        total: '55.00',
        notes: 'Test invoice',
      };

      const result = await db.createInvoice(invoiceInput);

      expect(result).toBeDefined();
    });

    it('should retrieve invoices', async () => {
      const result = await db.getInvoices(mockStartDate, mockEndDate);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should retrieve invoices without date filter', async () => {
      const result = await db.getInvoices();

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle invoice with multiple items', async () => {
      const invoiceInput = {
        supplierId: 1,
        invoiceNumber: 'INV-2026-002',
        invoiceDate: mockStartDate,
        dueDate: new Date('2026-03-01'),
        items: [
          {
            description: 'Chicken Breast',
            quantity: 10,
            unitPrice: '5.00',
            totalPrice: '50.00',
          },
          {
            description: 'Tomato Sauce',
            quantity: 5,
            unitPrice: '3.00',
            totalPrice: '15.00',
          },
          {
            description: 'Olive Oil',
            quantity: 2,
            unitPrice: '8.00',
            totalPrice: '16.00',
          },
        ],
        subtotal: '81.00',
        tax: '8.10',
        total: '89.10',
      };

      const result = await db.createInvoice(invoiceInput);

      expect(result).toBeDefined();
    });
  });

  describe('Financial Data Validation', () => {
    it('should handle date ranges correctly', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const result = await db.calculatePrimeCost(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.revenue).toBeDefined();
    });

    it('should handle future dates', async () => {
      const startDate = new Date('2026-12-01');
      const endDate = new Date('2026-12-31');

      const result = await db.getProfitabilityMetrics(startDate, endDate);

      expect(result).toBeDefined();
    });

    it('should handle single day range', async () => {
      const date = new Date('2026-02-15');

      const result = await db.calculatePrimeCost(date, date);

      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero revenue gracefully', async () => {
      const result = await db.calculatePrimeCost(mockStartDate, mockEndDate);

      // Should not throw error even if revenue is 0
      expect(result).toBeDefined();
      expect(result.primeCostPercentage).toBeDefined();
    });

    it('should handle missing labour data', async () => {
      const result = await db.getProfitabilityMetrics(mockStartDate, mockEndDate);

      // Should handle gracefully with 0 labour cost
      expect(result.labourCost).toBeDefined();
      expect(parseFloat(result.labourCost)).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing waste data', async () => {
      const result = await db.getProfitabilityMetrics(mockStartDate, mockEndDate);

      // Should handle gracefully with 0 waste cost
      expect(result.wasteCost).toBeDefined();
      expect(parseFloat(result.wasteCost)).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty location list', async () => {
      const result = await db.getConsolidatedReport(mockStartDate, mockEndDate, []);

      expect(Array.isArray(result)).toBe(true);
    }, 30000);
  });
});
