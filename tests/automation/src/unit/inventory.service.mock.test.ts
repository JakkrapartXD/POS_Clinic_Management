import { MockInventoryService } from '../mocks/services';

describe('InventoryService Unit Tests (Mocked)', () => {
  let inventoryService: MockInventoryService;

  beforeEach(() => {
    inventoryService = new MockInventoryService();
  });

  describe('UT-007: InventoryService.deduct - Insufficient stock', () => {
    it('should reject stock deduction and show error message when quantity exceeds stock', async () => {
      // Arrange
      const productId = 'test-product-1';
      const requestedQuantity = 100; // More than available stock (50)

      // Act
      const result = await inventoryService.deduct(productId, requestedQuantity);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('จำนวนยาไม่เพียงพอ');
    });
  });

  describe('UT-008: InventoryService.deduct - Sufficient stock', () => {
    it('should successfully deduct stock when quantity is available', async () => {
      // Arrange
      const productId = 'test-product-1';
      const requestedQuantity = 30; // Less than available stock (50)

      // Act
      const result = await inventoryService.deduct(productId, requestedQuantity);

      // Assert
      expect(result.success).toBe(true);
      expect(result.remainingStock).toBe(20); // 50 - 30
    });
  });

  describe('UT-009: InventoryService.deduct - Exact stock amount', () => {
    it('should successfully deduct when requesting exact available stock', async () => {
      // Arrange
      const productId = 'test-product-1';
      const requestedQuantity = 50; // Exact available stock

      // Act
      const result = await inventoryService.deduct(productId, requestedQuantity);

      // Assert
      expect(result.success).toBe(true);
      expect(result.remainingStock).toBe(0);
    });
  });

  describe('UT-010: InventoryService.deduct - Zero quantity', () => {
    it('should handle zero quantity request', async () => {
      // Arrange
      const productId = 'test-product-1';
      const requestedQuantity = 0;

      // Act
      const result = await inventoryService.deduct(productId, requestedQuantity);

      // Assert
      expect(result.success).toBe(true);
      expect(result.remainingStock).toBe(50); // No change
    });
  });
});
