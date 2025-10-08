/**
 * Service-to-Service Integration Tests
 *
 * This file demonstrates integration testing between microservices,
 * including HTTP communication, error handling, timeouts, and
 * cross-service workflows.
 *
 * Best Practices:
 * - Use real network calls but test environment
 * - Test complete workflows across services
 * - Verify error propagation
 * - Test timeout and retry scenarios
 * - Clean up test data after each test
 *
 * @see https://martinfowler.com/articles/microservice-testing/
 */

const axios = require('axios');
const { expect } = require('chai');

// Test configuration
const config = {
  orderService: {
    baseUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    timeout: 5000,
  },
  paymentService: {
    baseUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
    timeout: 5000,
  },
  inventoryService: {
    baseUrl: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003',
    timeout: 5000,
  },
  notificationService: {
    baseUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    timeout: 5000,
  },
};

// Helper function to create HTTP clients
function createClient(serviceConfig) {
  return axios.create({
    baseURL: serviceConfig.baseUrl,
    timeout: serviceConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': generateRequestId(),
    },
  });
}

function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to wait for async operations
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Microservices Integration Tests', () => {
  let orderClient;
  let paymentClient;
  let inventoryClient;
  let notificationClient;
  let testData = [];

  before(async () => {
    // Initialize HTTP clients
    orderClient = createClient(config.orderService);
    paymentClient = createClient(config.paymentService);
    inventoryClient = createClient(config.inventoryService);
    notificationClient = createClient(config.notificationService);

    // Verify all services are healthy
    await verifyServicesHealth();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  async function verifyServicesHealth() {
    const services = [
      { name: 'Order Service', client: orderClient },
      { name: 'Payment Service', client: paymentClient },
      { name: 'Inventory Service', client: inventoryClient },
      { name: 'Notification Service', client: notificationClient },
    ];

    for (const service of services) {
      try {
        const response = await service.client.get('/health');
        if (response.status !== 200) {
          throw new Error(`${service.name} is not healthy`);
        }
        console.log(`✓ ${service.name} is healthy`);
      } catch (error) {
        console.error(`✗ ${service.name} health check failed:`, error.message);
        throw new Error(
          `Integration tests require all services to be running. ${service.name} is unavailable.`
        );
      }
    }
  }

  async function cleanupTestData() {
    // Clean up any test data created during tests
    for (const item of testData) {
      try {
        if (item.type === 'order') {
          await orderClient.delete(`/orders/${item.id}`);
        } else if (item.type === 'inventory') {
          await inventoryClient.delete(`/inventory/${item.id}`);
        }
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Cleanup warning: ${error.message}`);
      }
    }
    testData = [];
  }

  describe('Complete Order Flow', () => {
    it('should successfully process an order from creation to completion', async () => {
      // Step 1: Check inventory availability
      const checkInventoryResponse = await inventoryClient.post(
        '/inventory/check',
        {
          items: [
            { productId: 'product-123', quantity: 2 },
            { productId: 'product-456', quantity: 1 },
          ],
        }
      );

      expect(checkInventoryResponse.status).to.equal(200);
      expect(checkInventoryResponse.data.available).to.be.true;

      // Step 2: Reserve inventory
      const reserveResponse = await inventoryClient.post('/inventory/reserve', {
        items: [
          { productId: 'product-123', quantity: 2 },
          { productId: 'product-456', quantity: 1 },
        ],
        reservationId: `reservation-${Date.now()}`,
      });

      expect(reserveResponse.status).to.equal(201);
      const reservationId = reserveResponse.data.reservationId;
      testData.push({ type: 'inventory', id: reservationId });

      // Step 3: Create order
      const orderResponse = await orderClient.post('/orders', {
        customerId: 'customer-integration-test',
        items: [
          { productId: 'product-123', quantity: 2, price: 29.99 },
          { productId: 'product-456', quantity: 1, price: 49.99 },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
        reservationId,
      });

      expect(orderResponse.status).to.equal(201);
      expect(orderResponse.data.orderId).to.exist;
      expect(orderResponse.data.status).to.equal('pending');

      const orderId = orderResponse.data.orderId;
      testData.push({ type: 'order', id: orderId });

      // Step 4: Process payment
      const paymentResponse = await paymentClient.post('/payments', {
        orderId,
        amount: 109.97,
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
        },
      });

      expect(paymentResponse.status).to.equal(201);
      expect(paymentResponse.data.status).to.equal('completed');
      expect(paymentResponse.data.transactionId).to.exist;

      // Step 5: Verify order status updated
      // Wait for async event processing
      await sleep(1000);

      const updatedOrderResponse = await orderClient.get(`/orders/${orderId}`);
      expect(updatedOrderResponse.data.status).to.equal('confirmed');
      expect(updatedOrderResponse.data.paymentStatus).to.equal('paid');

      // Step 6: Verify inventory was committed
      const inventoryResponse = await inventoryClient.get(
        `/inventory/reservation/${reservationId}`
      );
      expect(inventoryResponse.data.status).to.equal('committed');

      // Step 7: Verify notification was sent
      await sleep(500);
      const notificationsResponse = await notificationClient.get(
        `/notifications/order/${orderId}`
      );
      expect(notificationsResponse.data).to.be.an('array');
      expect(notificationsResponse.data.length).to.be.greaterThan(0);
      expect(notificationsResponse.data[0].type).to.equal('order_confirmation');
    });

    it('should handle payment failure and rollback inventory', async () => {
      // Step 1: Reserve inventory
      const reserveResponse = await inventoryClient.post('/inventory/reserve', {
        items: [{ productId: 'product-123', quantity: 1 }],
        reservationId: `reservation-${Date.now()}`,
      });

      const reservationId = reserveResponse.data.reservationId;
      testData.push({ type: 'inventory', id: reservationId });

      // Step 2: Create order
      const orderResponse = await orderClient.post('/orders', {
        customerId: 'customer-integration-test',
        items: [{ productId: 'product-123', quantity: 1, price: 29.99 }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
        reservationId,
      });

      const orderId = orderResponse.data.orderId;
      testData.push({ type: 'order', id: orderId });

      // Step 3: Attempt payment with invalid card (should fail)
      try {
        await paymentClient.post('/payments', {
          orderId,
          amount: 29.99,
          currency: 'USD',
          paymentMethod: {
            type: 'card',
            cardNumber: '4000000000000002', // Test card that always fails
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '123',
          },
        });
        // Should not reach here
        throw new Error('Payment should have failed');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.error).to.exist;
      }

      // Step 4: Verify order status is failed
      await sleep(1000);
      const failedOrderResponse = await orderClient.get(`/orders/${orderId}`);
      expect(failedOrderResponse.data.status).to.equal('payment_failed');

      // Step 5: Verify inventory was released
      const inventoryResponse = await inventoryClient.get(
        `/inventory/reservation/${reservationId}`
      );
      expect(inventoryResponse.data.status).to.equal('released');

      // Step 6: Verify failure notification was sent
      const notificationsResponse = await notificationClient.get(
        `/notifications/order/${orderId}`
      );
      const failureNotification = notificationsResponse.data.find(
        (n) => n.type === 'order_failed'
      );
      expect(failureNotification).to.exist;
    });
  });

  describe('Service Communication Patterns', () => {
    it('should handle service timeouts gracefully', async () => {
      // Create order that will cause slow processing
      const slowClient = createClient({
        ...config.orderService,
        timeout: 1000, // Very short timeout
      });

      try {
        await slowClient.post('/orders/slow', {
          customerId: 'customer-test',
          items: [{ productId: 'product-123', quantity: 1, price: 29.99 }],
          simulateDelay: 5000, // Simulate slow processing
        });
        throw new Error('Should have timed out');
      } catch (error) {
        expect(error.code).to.equal('ECONNABORTED');
        expect(error.message).to.include('timeout');
      }
    });

    it('should propagate correlation IDs across services', async () => {
      const correlationId = `corr-${Date.now()}`;

      // Create order with correlation ID
      const orderResponse = await orderClient.post(
        '/orders',
        {
          customerId: 'customer-test',
          items: [{ productId: 'product-123', quantity: 1, price: 29.99 }],
        },
        {
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );

      const orderId = orderResponse.data.orderId;
      testData.push({ type: 'order', id: orderId });

      // Verify correlation ID is returned
      expect(orderResponse.headers['x-correlation-id']).to.equal(correlationId);

      // Process payment with same correlation ID
      const paymentResponse = await paymentClient.post(
        '/payments',
        {
          orderId,
          amount: 29.99,
          currency: 'USD',
          paymentMethod: { type: 'card', cardNumber: '4242424242424242' },
        },
        {
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );

      // Verify correlation ID propagated
      expect(paymentResponse.headers['x-correlation-id']).to.equal(
        correlationId
      );

      // Check logs contain correlation ID
      await sleep(500);
      const logsResponse = await orderClient.get(
        `/logs?correlationId=${correlationId}`
      );
      expect(logsResponse.data.entries.length).to.be.greaterThan(0);
    });

    it('should handle concurrent requests correctly', async () => {
      // Create multiple orders concurrently
      const orderPromises = Array.from({ length: 5 }, (_, i) =>
        orderClient.post('/orders', {
          customerId: `customer-concurrent-${i}`,
          items: [{ productId: 'product-123', quantity: 1, price: 29.99 }],
        })
      );

      const responses = await Promise.all(orderPromises);

      // Verify all orders created successfully
      expect(responses).to.have.length(5);
      responses.forEach((response, index) => {
        expect(response.status).to.equal(201);
        expect(response.data.orderId).to.exist;
        testData.push({ type: 'order', id: response.data.orderId });
      });

      // Verify order IDs are unique
      const orderIds = responses.map((r) => r.data.orderId);
      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).to.equal(5);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should retry on transient failures', async () => {
      // Configure client with retry logic
      const retryClient = axios.create({
        baseURL: config.orderService.baseUrl,
        timeout: 5000,
      });

      // Add retry interceptor
      let attemptCount = 0;
      retryClient.interceptors.response.use(
        (response) => response,
        async (error) => {
          const config = error.config;
          if (!config || !config.retry) {
            config.retry = { count: 0, maxRetries: 3 };
          }

          attemptCount++;
          config.retry.count++;

          // Retry on 5xx errors or network errors
          const shouldRetry =
            (error.response && error.response.status >= 500) ||
            error.code === 'ECONNABORTED' ||
            error.code === 'ENOTFOUND';

          if (shouldRetry && config.retry.count < config.retry.maxRetries) {
            await sleep(100 * config.retry.count); // Exponential backoff
            return retryClient(config);
          }

          return Promise.reject(error);
        }
      );

      // Trigger endpoint that fails first 2 times then succeeds
      const response = await retryClient.post('/orders/flaky', {
        customerId: 'customer-test',
        items: [{ productId: 'product-123', quantity: 1, price: 29.99 }],
        failureCount: 2, // Fail first 2 attempts
      });

      expect(response.status).to.equal(201);
      expect(attemptCount).to.be.greaterThan(1);
      testData.push({ type: 'order', id: response.data.orderId });
    });

    it('should implement circuit breaker pattern', async () => {
      // Simulate circuit breaker by tracking failures
      let failureCount = 0;
      let circuitOpen = false;
      const failureThreshold = 3;

      async function callWithCircuitBreaker(fn) {
        if (circuitOpen) {
          throw new Error('Circuit breaker is OPEN');
        }

        try {
          const result = await fn();
          failureCount = 0; // Reset on success
          return result;
        } catch (error) {
          failureCount++;
          if (failureCount >= failureThreshold) {
            circuitOpen = true;
            setTimeout(() => {
              circuitOpen = false;
              failureCount = 0;
            }, 5000); // Reset after 5 seconds
          }
          throw error;
        }
      }

      // Trigger failures to open circuit
      for (let i = 0; i < failureThreshold; i++) {
        try {
          await callWithCircuitBreaker(() =>
            inventoryClient.get('/inventory/invalid-endpoint')
          );
        } catch (error) {
          // Expected failure
        }
      }

      expect(circuitOpen).to.be.true;

      // Next call should fail immediately due to open circuit
      try {
        await callWithCircuitBreaker(() =>
          inventoryClient.get('/inventory/check')
        );
        throw new Error('Should have failed with circuit open');
      } catch (error) {
        expect(error.message).to.include('Circuit breaker is OPEN');
      }
    });
  });

  describe('Data Consistency', () => {
    it('should maintain eventual consistency across services', async () => {
      // Create order
      const orderResponse = await orderClient.post('/orders', {
        customerId: 'customer-consistency-test',
        items: [{ productId: 'product-123', quantity: 2, price: 29.99 }],
      });

      const orderId = orderResponse.data.orderId;
      testData.push({ type: 'order', id: orderId });

      // Process payment
      await paymentClient.post('/payments', {
        orderId,
        amount: 59.98,
        currency: 'USD',
        paymentMethod: { type: 'card', cardNumber: '4242424242424242' },
      });

      // Poll for consistency with timeout
      const maxWait = 5000;
      const pollInterval = 200;
      let elapsed = 0;
      let consistent = false;

      while (elapsed < maxWait) {
        const orderData = await orderClient.get(`/orders/${orderId}`);
        const inventoryData = await inventoryClient.get(
          `/inventory/order/${orderId}`
        );
        const paymentData = await paymentClient.get(`/payments/order/${orderId}`);

        if (
          orderData.data.status === 'confirmed' &&
          inventoryData.data.status === 'committed' &&
          paymentData.data.status === 'completed'
        ) {
          consistent = true;
          break;
        }

        await sleep(pollInterval);
        elapsed += pollInterval;
      }

      expect(consistent).to.be.true;
    });
  });
});

/**
 * INTEGRATION TESTING BEST PRACTICES:
 *
 * 1. Environment Setup:
 *    - Use Docker Compose for consistent environments
 *    - Separate test environment from development
 *    - Use environment variables for configuration
 *    - Ensure services are healthy before testing
 *
 * 2. Test Data Management:
 *    - Create test data at test start
 *    - Clean up after each test
 *    - Use unique identifiers for isolation
 *    - Avoid shared test data
 *
 * 3. Testing Strategies:
 *    - Test complete workflows end-to-end
 *    - Verify both success and failure scenarios
 *    - Test timeout and retry logic
 *    - Validate error propagation
 *    - Check eventual consistency
 *
 * 4. Observability:
 *    - Use correlation IDs for tracing
 *    - Verify logging across services
 *    - Check metrics are recorded
 *    - Validate distributed tracing
 *
 * 5. Performance:
 *    - Keep tests focused and fast
 *    - Run in parallel where possible
 *    - Use timeouts appropriately
 *    - Monitor test execution time
 *
 * TROUBLESHOOTING:
 *
 * - Service not available: Check Docker containers
 * - Test timeout: Increase timeout or check service performance
 * - Flaky tests: Add proper waits for async operations
 * - Data conflicts: Ensure test data cleanup
 * - Network errors: Check service connectivity
 */
