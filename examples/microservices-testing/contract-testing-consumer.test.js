/**
 * Contract Testing - Consumer Side (Pact)
 *
 * This file demonstrates consumer-driven contract testing using Pact.
 * The consumer defines expectations for the provider's API, and Pact
 * generates a contract that the provider must satisfy.
 *
 * Best Practices:
 * - Keep contracts consumer-driven (consumer defines what they need)
 * - Use matchers for flexible validation
 * - Test both happy paths and error scenarios
 * - Version your contracts
 * - Publish contracts to a Pact Broker
 *
 * @see https://docs.pact.io/
 */

const { Pact, Matchers } = require('@pact-foundation/pact');
const { like, eachLike, iso8601DateTimeWithMillis, uuid } = Matchers;
const path = require('path');
const axios = require('axios');

// Service client that we're testing
class OrderServiceClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    try {
      const response = await this.client.post('/orders', orderData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to create order: ${error.response.status} - ${error.response.data.message}`);
      }
      throw error;
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order identifier
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order identifier
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.client.patch(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to update order: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * Get orders by customer ID
   * @param {string} customerId - Customer identifier
   * @returns {Promise<Array>} List of orders
   */
  async getOrdersByCustomer(customerId) {
    try {
      const response = await this.client.get(`/orders`, {
        params: { customerId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

describe('Order Service Consumer Contract Tests', () => {
  // Configure Pact provider
  const provider = new Pact({
    consumer: 'OrderConsumer',
    provider: 'OrderProvider',
    port: 8989,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'warn',
    spec: 2, // Pact specification version
  });

  let client;

  // Setup and teardown
  beforeAll(async () => {
    await provider.setup();
    client = new OrderServiceClient(`http://localhost:${provider.opts.port}`);
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('POST /orders - Create Order', () => {
    describe('when creating a valid order', () => {
      const orderRequest = {
        customerId: 'customer-123',
        items: [
          {
            productId: 'product-456',
            quantity: 2,
            price: 29.99,
          },
          {
            productId: 'product-789',
            quantity: 1,
            price: 49.99,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'US',
        },
      };

      beforeEach(async () => {
        // Define the expected interaction
        await provider.addInteraction({
          state: 'customer exists and products are in stock',
          uponReceiving: 'a request to create an order',
          withRequest: {
            method: 'POST',
            path: '/orders',
            headers: {
              'Content-Type': 'application/json',
            },
            body: orderRequest,
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              orderId: like('order-abc-123'),
              customerId: like('customer-123'),
              status: 'pending',
              items: eachLike({
                productId: like('product-456'),
                quantity: like(2),
                price: like(29.99),
              }),
              totalAmount: like(109.97),
              shippingAddress: like({
                street: '123 Main St',
                city: 'Springfield',
                state: 'IL',
                zipCode: '62701',
                country: 'US',
              }),
              createdAt: iso8601DateTimeWithMillis(),
              updatedAt: iso8601DateTimeWithMillis(),
            },
          },
        });
      });

      it('should return the created order with a 201 status', async () => {
        const order = await client.createOrder(orderRequest);

        // Assertions
        expect(order).toBeDefined();
        expect(order.orderId).toBeDefined();
        expect(order.customerId).toBe('customer-123');
        expect(order.status).toBe('pending');
        expect(order.items).toHaveLength(2);
        expect(order.totalAmount).toBe(109.97);
        expect(order.createdAt).toBeDefined();
        expect(order.updatedAt).toBeDefined();
      });
    });

    describe('when creating an order with invalid data', () => {
      const invalidOrderRequest = {
        customerId: 'customer-123',
        items: [], // Invalid: empty items array
      };

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'customer exists',
          uponReceiving: 'a request to create an order with invalid data',
          withRequest: {
            method: 'POST',
            path: '/orders',
            headers: {
              'Content-Type': 'application/json',
            },
            body: invalidOrderRequest,
          },
          willRespondWith: {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              error: 'Bad Request',
              message: like('Order must contain at least one item'),
              statusCode: 400,
            },
          },
        });
      });

      it('should return a 400 error for invalid order data', async () => {
        await expect(client.createOrder(invalidOrderRequest)).rejects.toThrow(
          'Failed to create order: 400'
        );
      });
    });
  });

  describe('GET /orders/:orderId - Get Order by ID', () => {
    describe('when the order exists', () => {
      const orderId = 'order-abc-123';

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'order with ID order-abc-123 exists',
          uponReceiving: 'a request to get an order by ID',
          withRequest: {
            method: 'GET',
            path: `/orders/${orderId}`,
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              orderId: like(orderId),
              customerId: like('customer-123'),
              status: like('pending'),
              items: eachLike({
                productId: like('product-456'),
                quantity: like(2),
                price: like(29.99),
              }),
              totalAmount: like(59.98),
              createdAt: iso8601DateTimeWithMillis(),
              updatedAt: iso8601DateTimeWithMillis(),
            },
          },
        });
      });

      it('should return the order details', async () => {
        const order = await client.getOrder(orderId);

        expect(order).toBeDefined();
        expect(order.orderId).toBe(orderId);
        expect(order.customerId).toBeDefined();
        expect(order.status).toBeDefined();
        expect(order.items).toBeDefined();
        expect(Array.isArray(order.items)).toBe(true);
      });
    });

    describe('when the order does not exist', () => {
      const nonExistentOrderId = 'order-does-not-exist';

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'order does not exist',
          uponReceiving: 'a request to get a non-existent order',
          withRequest: {
            method: 'GET',
            path: `/orders/${nonExistentOrderId}`,
          },
          willRespondWith: {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              error: 'Not Found',
              message: like('Order not found'),
              statusCode: 404,
            },
          },
        });
      });

      it('should return null for non-existent orders', async () => {
        const order = await client.getOrder(nonExistentOrderId);
        expect(order).toBeNull();
      });
    });
  });

  describe('PATCH /orders/:orderId/status - Update Order Status', () => {
    describe('when updating to a valid status', () => {
      const orderId = 'order-abc-123';
      const newStatus = 'confirmed';

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'order with ID order-abc-123 exists with status pending',
          uponReceiving: 'a request to update order status',
          withRequest: {
            method: 'PATCH',
            path: `/orders/${orderId}/status`,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              status: newStatus,
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              orderId: like(orderId),
              status: like(newStatus),
              updatedAt: iso8601DateTimeWithMillis(),
            },
          },
        });
      });

      it('should update the order status successfully', async () => {
        const updatedOrder = await client.updateOrderStatus(orderId, newStatus);

        expect(updatedOrder).toBeDefined();
        expect(updatedOrder.orderId).toBe(orderId);
        expect(updatedOrder.status).toBe(newStatus);
        expect(updatedOrder.updatedAt).toBeDefined();
      });
    });

    describe('when updating to an invalid status', () => {
      const orderId = 'order-abc-123';
      const invalidStatus = 'invalid-status';

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'order with ID order-abc-123 exists',
          uponReceiving: 'a request to update order with invalid status',
          withRequest: {
            method: 'PATCH',
            path: `/orders/${orderId}/status`,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              status: invalidStatus,
            },
          },
          willRespondWith: {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              error: 'Bad Request',
              message: like('Invalid status transition'),
              statusCode: 400,
            },
          },
        });
      });

      it('should return a 400 error for invalid status', async () => {
        await expect(
          client.updateOrderStatus(orderId, invalidStatus)
        ).rejects.toThrow('Failed to update order: 400');
      });
    });
  });

  describe('GET /orders - Get Orders by Customer', () => {
    describe('when customer has orders', () => {
      const customerId = 'customer-123';

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'customer customer-123 has multiple orders',
          uponReceiving: 'a request to get orders by customer ID',
          withRequest: {
            method: 'GET',
            path: '/orders',
            query: {
              customerId: customerId,
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: eachLike({
              orderId: like('order-abc-123'),
              customerId: like(customerId),
              status: like('pending'),
              totalAmount: like(109.97),
              createdAt: iso8601DateTimeWithMillis(),
            }),
          },
        });
      });

      it('should return a list of orders for the customer', async () => {
        const orders = await client.getOrdersByCustomer(customerId);

        expect(orders).toBeDefined();
        expect(Array.isArray(orders)).toBe(true);
        expect(orders.length).toBeGreaterThan(0);
        orders.forEach((order) => {
          expect(order.orderId).toBeDefined();
          expect(order.customerId).toBe(customerId);
          expect(order.status).toBeDefined();
        });
      });
    });

    describe('when customer has no orders', () => {
      const customerId = 'customer-no-orders';

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'customer has no orders',
          uponReceiving: 'a request to get orders for customer with no orders',
          withRequest: {
            method: 'GET',
            path: '/orders',
            query: {
              customerId: customerId,
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: [],
          },
        });
      });

      it('should return an empty array', async () => {
        const orders = await client.getOrdersByCustomer(customerId);

        expect(orders).toBeDefined();
        expect(Array.isArray(orders)).toBe(true);
        expect(orders.length).toBe(0);
      });
    });
  });
});

/**
 * NOTES ON PACT WORKFLOW:
 *
 * 1. Consumer Tests (this file):
 *    - Define expected interactions with the provider
 *    - Generate contract files (JSON) in the 'pacts' directory
 *    - Run independently without actual provider
 *
 * 2. Publish Contracts:
 *    - Upload contracts to Pact Broker
 *    - Make contracts available to provider team
 *    - Enable versioning and tagging
 *
 * 3. Provider Verification:
 *    - Provider runs verification tests
 *    - Replays interactions from consumer contracts
 *    - Confirms provider can satisfy all consumer expectations
 *
 * 4. CI/CD Integration:
 *    - Consumer: Run tests → Generate contracts → Publish to broker
 *    - Provider: Fetch contracts → Run verification → Publish results
 *    - Use can-i-deploy to check deployment safety
 *
 * COMMON PATTERNS:
 *
 * - Use 'like()' matcher for flexible type matching
 * - Use 'eachLike()' for array responses
 * - Use 'iso8601DateTimeWithMillis()' for timestamps
 * - Define provider states for different scenarios
 * - Test both success and error cases
 *
 * TROUBLESHOOTING:
 *
 * - Check pact.log for detailed interaction logs
 * - Verify provider states match exactly
 * - Ensure matchers are used correctly
 * - Validate JSON structure matches expectations
 */
