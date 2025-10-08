/**
 * Contract Testing - Provider Side (Pact)
 *
 * This file demonstrates provider verification using Pact.
 * The provider replays interactions from consumer contracts
 * to verify it can satisfy all consumer expectations.
 *
 * Best Practices:
 * - Use provider states to set up test data
 * - Verify against all consumer contracts
 * - Run verification on every deployment
 * - Publish verification results to Pact Broker
 * - Use webhooks for continuous verification
 *
 * @see https://docs.pact.io/
 */

const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const express = require('express');

// Import your actual provider application
// In production, this would be your real service
class OrderService {
  constructor() {
    this.orders = new Map();
    this.customerOrders = new Map();
  }

  createOrder(orderData) {
    const orderId = `order-${Date.now()}`;
    const order = {
      orderId,
      customerId: orderData.customerId,
      status: 'pending',
      items: orderData.items,
      totalAmount: orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      shippingAddress: orderData.shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, order);

    // Track orders by customer
    if (!this.customerOrders.has(orderData.customerId)) {
      this.customerOrders.set(orderData.customerId, []);
    }
    this.customerOrders.get(orderData.customerId).push(orderId);

    return order;
  }

  getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  updateOrderStatus(orderId, status) {
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    // Validate status transitions
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status transition');
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.orders.set(orderId, order);

    return {
      orderId: order.orderId,
      status: order.status,
      updatedAt: order.updatedAt,
    };
  }

  getOrdersByCustomer(customerId) {
    const orderIds = this.customerOrders.get(customerId) || [];
    return orderIds.map((id) => this.orders.get(id)).filter(Boolean);
  }

  reset() {
    this.orders.clear();
    this.customerOrders.clear();
  }
}

// Create Express app for testing
function createApp() {
  const app = express();
  const orderService = new OrderService();

  app.use(express.json());

  // State management endpoint for Pact
  app.post('/_pact/provider-states', (req, res) => {
    const { state, params } = req.body;
    console.log(`Setting up provider state: ${state}`, params);

    // Reset state before each test
    orderService.reset();

    // Set up state based on consumer requirements
    switch (state) {
      case 'customer exists and products are in stock':
        // No specific setup needed - validation would happen in real service
        break;

      case 'customer exists':
        // Customer validation setup
        break;

      case 'order with ID order-abc-123 exists':
        orderService.orders.set('order-abc-123', {
          orderId: 'order-abc-123',
          customerId: 'customer-123',
          status: 'pending',
          items: [
            {
              productId: 'product-456',
              quantity: 2,
              price: 29.99,
            },
          ],
          totalAmount: 59.98,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        });
        break;

      case 'order with ID order-abc-123 exists with status pending':
        orderService.orders.set('order-abc-123', {
          orderId: 'order-abc-123',
          customerId: 'customer-123',
          status: 'pending',
          items: [
            {
              productId: 'product-456',
              quantity: 2,
              price: 29.99,
            },
          ],
          totalAmount: 59.98,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        });
        break;

      case 'order does not exist':
        // No setup needed - order should not exist
        break;

      case 'customer customer-123 has multiple orders':
        // Create multiple orders for customer
        const order1 = {
          orderId: 'order-abc-123',
          customerId: 'customer-123',
          status: 'pending',
          items: [],
          totalAmount: 109.97,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        };
        const order2 = {
          orderId: 'order-def-456',
          customerId: 'customer-123',
          status: 'confirmed',
          items: [],
          totalAmount: 49.99,
          createdAt: '2024-01-16T14:20:00.000Z',
          updatedAt: '2024-01-16T14:20:00.000Z',
        };

        orderService.orders.set(order1.orderId, order1);
        orderService.orders.set(order2.orderId, order2);
        orderService.customerOrders.set('customer-123', [
          order1.orderId,
          order2.orderId,
        ]);
        break;

      case 'customer has no orders':
        orderService.customerOrders.set('customer-no-orders', []);
        break;

      default:
        console.warn(`Unknown provider state: ${state}`);
    }

    res.status(200).json({ result: 'State setup complete' });
  });

  // Order endpoints
  app.post('/orders', (req, res) => {
    try {
      const orderData = req.body;

      // Validation
      if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Order must contain at least one item',
          statusCode: 400,
        });
      }

      const order = orderService.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        statusCode: 500,
      });
    }
  });

  app.get('/orders/:orderId', (req, res) => {
    try {
      const { orderId } = req.params;
      const order = orderService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order not found',
          statusCode: 404,
        });
      }

      res.status(200).json(order);
    } catch (error) {
      console.error('Error getting order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        statusCode: 500,
      });
    }
  });

  app.patch('/orders/:orderId/status', (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const updatedOrder = orderService.updateOrderStatus(orderId, status);

      if (!updatedOrder) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order not found',
          statusCode: 404,
        });
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      if (error.message === 'Invalid status transition') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid status transition',
          statusCode: 400,
        });
      }

      console.error('Error updating order status:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        statusCode: 500,
      });
    }
  });

  app.get('/orders', (req, res) => {
    try {
      const { customerId } = req.query;

      if (!customerId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'customerId query parameter is required',
          statusCode: 400,
        });
      }

      const orders = orderService.getOrdersByCustomer(customerId);
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        statusCode: 500,
      });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  return app;
}

// Provider verification tests
describe('Order Service Provider Verification', () => {
  let server;
  const PORT = 8080;

  beforeAll((done) => {
    const app = createApp();
    server = app.listen(PORT, () => {
      console.log(`Provider service running on port ${PORT}`);
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should validate the expectations of OrderConsumer', async () => {
    const opts = {
      // Provider details
      provider: 'OrderProvider',
      providerBaseUrl: `http://localhost:${PORT}`,

      // Pact URLs - can be local files or Pact Broker URLs
      pactUrls: [
        path.resolve(
          process.cwd(),
          'pacts',
          'orderconsumer-orderprovider.json'
        ),
      ],

      // Pact Broker configuration (optional)
      // Uncomment when using Pact Broker
      /*
      pactBrokerUrl: 'https://your-pact-broker.com',
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      providerVersionTags: ['develop', 'main'],
      */

      // Provider states setup
      stateHandlers: {
        'customer exists and products are in stock': async () => {
          // State is handled via the /_pact/provider-states endpoint
          return Promise.resolve('State setup via endpoint');
        },
        'customer exists': async () => {
          return Promise.resolve('State setup via endpoint');
        },
        'order with ID order-abc-123 exists': async () => {
          return Promise.resolve('State setup via endpoint');
        },
        'order with ID order-abc-123 exists with status pending': async () => {
          return Promise.resolve('State setup via endpoint');
        },
        'order does not exist': async () => {
          return Promise.resolve('State setup via endpoint');
        },
        'customer customer-123 has multiple orders': async () => {
          return Promise.resolve('State setup via endpoint');
        },
        'customer has no orders': async () => {
          return Promise.resolve('State setup via endpoint');
        },
      },

      // Request filters (optional)
      // Use to add authentication headers, etc.
      requestFilter: (req, res, next) => {
        // Example: Add authentication token
        // req.headers['Authorization'] = 'Bearer test-token';
        next();
      },

      // Logging
      logLevel: 'info',
      logDir: path.resolve(process.cwd(), 'logs'),

      // Timeout
      timeout: 30000,
    };

    try {
      const output = await new Verifier(opts).verifyProvider();
      console.log('Pact Verification Complete!');
      console.log(output);
    } catch (error) {
      console.error('Pact Verification Failed:', error);
      throw error;
    }
  });
});

/**
 * PROVIDER VERIFICATION WORKFLOW:
 *
 * 1. Fetch Contracts:
 *    - Download from Pact Broker or use local files
 *    - Supports versioning and tagging
 *
 * 2. Setup Provider States:
 *    - Configure test data based on consumer states
 *    - Reset state between verifications
 *    - Use state handlers or dedicated endpoint
 *
 * 3. Replay Interactions:
 *    - Pact replays each interaction from consumer
 *    - Sends actual HTTP requests to provider
 *    - Validates responses match contract
 *
 * 4. Publish Results:
 *    - Send verification results to Pact Broker
 *    - Track which provider versions satisfy which contracts
 *    - Enable can-i-deploy checks
 *
 * ADVANCED PATTERNS:
 *
 * Provider States:
 * - Use to set up test data
 * - Can be asynchronous
 * - Should be idempotent
 * - Reset between tests
 *
 * Request Filtering:
 * - Add authentication headers
 * - Modify requests before verification
 * - Useful for token-based auth
 *
 * Selective Verification:
 * - Filter by consumer version
 * - Filter by tag (e.g., 'production')
 * - Verify pending contracts
 *
 * CI/CD INTEGRATION:
 *
 * On Provider Changes:
 * 1. Run provider verification tests
 * 2. Verify against all consumer contracts
 * 3. Publish verification results
 * 4. Check can-i-deploy before deployment
 *
 * Example CI Configuration:
 * ```yaml
 * - name: Verify Pact Contracts
 *   run: npm run test:pact:verify
 *
 * - name: Can I Deploy?
 *   run: |
 *     pact-broker can-i-deploy \
 *       --pacticipant OrderProvider \
 *       --version $GIT_COMMIT \
 *       --to-environment production
 * ```
 *
 * TROUBLESHOOTING:
 *
 * Common Issues:
 * - Provider state not set correctly
 * - Response format doesn't match contract
 * - Missing or incorrect status codes
 * - Authentication issues
 * - Timing/race conditions
 *
 * Debugging:
 * - Check logs in logDir
 * - Increase logLevel to 'debug'
 * - Verify provider states manually
 * - Test endpoints independently
 * - Check Pact Broker for contract details
 *
 * VERSIONING STRATEGY:
 *
 * - Use semantic versioning for provider
 * - Tag stable versions (e.g., 'production')
 * - Keep contracts for all active consumer versions
 * - Use webhooks for automatic verification
 * - Implement backward compatibility where possible
 */
