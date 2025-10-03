import { TEST_CONFIG, generateTestUser, generateTestProduct } from '../../setup';
import axios from 'axios';

describe('InventoryService Unit Tests', () => {
  const apiUrl = `${TEST_CONFIG.API_BASE_URL}/graphql`;
  
  // Test data
  const testUser = generateTestUser();
  const testProduct = generateTestProduct();
  let authToken: string;
  let createdUserId: string;
  let createdProductId: string;

  beforeAll(async () => {
    // Create test user for authentication
    const createUserMutation = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          username
          email
          role
          status
        }
      }
    `;

    try {
      const response = await axios.post(apiUrl, {
        query: createUserMutation,
        variables: {
          input: testUser
        }
      });

      if (response.data.data?.createUser) {
        createdUserId = response.data.data.createUser.id;
      }

      // Login to get token
      const loginMutation = `
        mutation SignIn($input: SignInInput!) {
          signIn(input: $input) {
            success
            message
            token
          }
        }
      `;

      const loginResponse = await axios.post(apiUrl, {
        query: loginMutation,
        variables: {
          input: {
            username: testUser.username,
            password: testUser.password
          }
        }
      });

      authToken = loginResponse.data.data.signIn.token;

      // Create test product
      const createProductMutation = `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            product_name
            product_type
            sale_price
            unit
            stock_quantity
            sku
          }
        }
      `;

      const productResponse = await axios.post(apiUrl, {
        query: createProductMutation,
        variables: {
          input: testProduct
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (productResponse.data.data?.createProduct) {
        createdProductId = productResponse.data.data.createProduct.id;
      }
    } catch (error) {
      console.log('Setup failed:', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (createdProductId) {
      const deleteProductMutation = `
        mutation DeleteProduct($id: String!) {
          deleteProduct(id: $id)
        }
      `;

      try {
        await axios.post(apiUrl, {
          query: deleteProductMutation,
          variables: { id: createdProductId }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (error) {
        console.log('Product cleanup failed:', error);
      }
    }

    if (createdUserId) {
      const deleteUserMutation = `
        mutation DeleteUser($id: String!) {
          deleteUser(id: $id)
        }
      `;

      try {
        await axios.post(apiUrl, {
          query: deleteUserMutation,
          variables: { id: createdUserId }
        });
      } catch (error) {
        console.log('User cleanup failed:', error);
      }
    }
  });

  describe('UT-007: Deduct stock with sufficient quantity', () => {
    it('should deduct stock successfully when quantity is available', async () => {
      const adjustStockMutation = `
        mutation AdjustStock($productId: String!, $quantity: Int!, $note: String) {
          adjustStock(productId: $productId, quantity: $quantity, note: $note) {
            id
            quantity
            quantity_in
            is_outofstock
            note
            created_at
            product {
              id
              product_name
              stock_quantity
            }
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: adjustStockMutation,
        variables: {
          productId: createdProductId,
          quantity: -10, // Negative for deduction
          note: 'Test stock deduction'
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.adjustStock?.id).toBeDefined();
      expect(response.data.data?.adjustStock?.quantity).toBe(-10);
      expect(response.data.data?.adjustStock?.product?.stock_quantity).toBe(90); // 100 - 10
    });
  });

  describe('UT-008: Deduct stock with insufficient quantity', () => {
    it('should reject deduction when quantity exceeds available stock', async () => {
      const adjustStockMutation = `
        mutation AdjustStock($productId: String!, $quantity: Int!, $note: String) {
          adjustStock(productId: $productId, quantity: $quantity, note: $note) {
            id
            quantity
            quantity_in
            is_outofstock
            note
            created_at
            product {
              id
              product_name
              stock_quantity
            }
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: adjustStockMutation,
        variables: {
          productId: createdProductId,
          quantity: -200, // More than available stock
          note: 'Test excessive deduction'
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.errors).toBeDefined();
      expect(response.data.errors[0].message).toContain('จำนวนยาไม่เพียงพอ');
    });
  });

  describe('UT-009: Add stock', () => {
    it('should add stock successfully', async () => {
      const adjustStockMutation = `
        mutation AdjustStock($productId: String!, $quantity: Int!, $note: String) {
          adjustStock(productId: $productId, quantity: $quantity, note: $note) {
            id
            quantity
            quantity_in
            is_outofstock
            note
            created_at
            product {
              id
              product_name
              stock_quantity
            }
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: adjustStockMutation,
        variables: {
          productId: createdProductId,
          quantity: 50, // Positive for addition
          note: 'Test stock addition'
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.adjustStock?.id).toBeDefined();
      expect(response.data.data?.adjustStock?.quantity).toBe(50);
      expect(response.data.data?.adjustStock?.product?.stock_quantity).toBe(140); // 90 + 50
    });
  });

  describe('UT-010: Get low stock products', () => {
    it('should retrieve products with low stock', async () => {
      // First, set a product to low stock
      const adjustStockMutation = `
        mutation AdjustStock($productId: String!, $quantity: Int!, $note: String) {
          adjustStock(productId: $productId, quantity: $quantity, note: $note) {
            id
            product {
              id
              product_name
              stock_quantity
              reorder_point
            }
          }
        }
      `;

      // Deduct stock to make it low
      await axios.post(apiUrl, {
        query: adjustStockMutation,
        variables: {
          productId: createdProductId,
          quantity: -130, // Make stock very low
          note: 'Make stock low for testing'
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const getLowStockQuery = `
        query LowStockProducts {
          lowStockProducts {
            id
            product_name
            stock_quantity
            reorder_point
            unit
            vat_percent
            sale_price
            category {
              name
            }
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: getLowStockQuery
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.lowStockProducts).toBeDefined();
      expect(Array.isArray(response.data.data.lowStockProducts)).toBe(true);
    });
  });

  describe('UT-011: Get stock alerts', () => {
    it('should retrieve stock alerts', async () => {
      const getStockAlertsQuery = `
        query StockAlerts($acknowledged: Boolean, $pagination: PaginationInput) {
          stockAlerts(acknowledged: $acknowledged, pagination: $pagination) {
            id
            alert_type
            alert_message
            created_at
            createdByUserId
            created_by_username
            acknowledged
            acknowledged_at
            product {
              id
              product_name
              stock_quantity
              reorder_point
            }
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: getStockAlertsQuery,
        variables: {
          acknowledged: false,
          pagination: {
            skip: 0,
            take: 10
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.stockAlerts).toBeDefined();
      expect(Array.isArray(response.data.data.stockAlerts)).toBe(true);
    });
  });

  describe('UT-012: Create stock entry', () => {
    it('should create new stock entry', async () => {
      const createStockMutation = `
        mutation CreateStock($input: CreateStockInput!) {
          createStock(input: $input) {
            id
            quantity
            quantity_in
            is_outofstock
            production_date
            expiration_date
            reference_table
            reference_id
            note
            created_at
            createdByUserId
            created_by_username
            product_name
            product_unit
            product {
              id
              product_name
              stock_quantity
            }
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: createStockMutation,
        variables: {
          input: {
            productId: createdProductId,
            quantity: 100,
            quantity_in: 100,
            is_outofstock: false,
            production_date: '2024-01-01',
            expiration_date: '2025-12-31',
            reference_table: 'purchase',
            reference_id: 'purchase_001',
            note: 'Test stock entry'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.createStock?.id).toBeDefined();
      expect(response.data.data?.createStock?.quantity).toBe(100);
      expect(response.data.data?.createStock?.product?.stock_quantity).toBe(240); // 140 + 100
    });
  });

  describe('UT-013: Update stock entry', () => {
    it('should update existing stock entry', async () => {
      // First create a stock entry
      const createStockMutation = `
        mutation CreateStock($input: CreateStockInput!) {
          createStock(input: $input) {
            id
          }
        }
      `;

      const createResponse = await axios.post(apiUrl, {
        query: createStockMutation,
        variables: {
          input: {
            productId: createdProductId,
            quantity: 50,
            note: 'Stock to update'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const stockId = createResponse.data.data.createStock.id;

      const updateStockMutation = `
        mutation UpdateStock($id: String!, $input: UpdateStockInput!) {
          updateStock(id: $id, input: $input) {
            id
            quantity
            note
            updated_at
            product {
              id
              product_name
              stock_quantity
            }
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: updateStockMutation,
        variables: {
          id: stockId,
          input: {
            quantity: 75,
            note: 'Updated stock entry'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.updateStock?.quantity).toBe(75);
      expect(response.data.data?.updateStock?.note).toBe('Updated stock entry');
    });
  });

  describe('UT-014: Delete stock entry', () => {
    it('should delete stock entry successfully', async () => {
      // First create a stock entry
      const createStockMutation = `
        mutation CreateStock($input: CreateStockInput!) {
          createStock(input: $input) {
            id
          }
        }
      `;

      const createResponse = await axios.post(apiUrl, {
        query: createStockMutation,
        variables: {
          input: {
            productId: createdProductId,
            quantity: 25,
            note: 'Stock to delete'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const stockId = createResponse.data.data.createStock.id;

      const deleteStockMutation = `
        mutation DeleteStock($id: String!) {
          deleteStock(id: $id)
        }
      `;

      const response = await axios.post(apiUrl, {
        query: deleteStockMutation,
        variables: { id: stockId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.deleteStock).toBe(true);
    });
  });
});

