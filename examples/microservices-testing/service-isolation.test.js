/**
 * Service Isolation Testing
 *
 * This file demonstrates testing microservices in isolation by mocking
 * all external dependencies. This ensures fast, reliable unit tests
 * that verify service logic without network calls or external systems.
 *
 * Best Practices:
 * - Mock all external dependencies (databases, APIs, message queues)
 * - Test business logic thoroughly
 * - Verify error handling and edge cases
 * - Keep tests fast and deterministic
 * - Use dependency injection for easier mocking
 *
 * @see https://martinfowler.com/articles/microservice-testing/
 */

const { jest } = require('@jest/globals');

// Payment Service - Example microservice with external dependencies
class PaymentService {
  constructor(dependencies) {
    this.paymentGateway = dependencies.paymentGateway;
    this.database = dependencies.database;
    this.eventPublisher = dependencies.eventPublisher;
    this.logger = dependencies.logger;
    this.retryConfig = dependencies.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
    };
  }

  /**
   * Process a payment with retry logic and event publishing
   */
  async processPayment(paymentRequest) {
    const { orderId, amount, currency, paymentMethod } = paymentRequest;

    try {
      // Validate input
      this.validatePaymentRequest(paymentRequest);

      // Check for duplicate payments
      const existingPayment = await this.database.findPaymentByOrderId(orderId);
      if (existingPayment && existingPayment.status === 'completed') {
        this.logger.warn(`Duplicate payment attempt for order ${orderId}`);
        return {
          success: false,
          error: 'DUPLICATE_PAYMENT',
          message: 'Payment already processed for this order',
        };
      }

      // Create payment record
      const payment = await this.database.createPayment({
        orderId,
        amount,
        currency,
        paymentMethod,
        status: 'pending',
        createdAt: new Date(),
      });

      // Process payment with retry logic
      let paymentResult;
      let lastError;

      for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          this.logger.info(
            `Processing payment ${payment.id}, attempt ${attempt}/${this.retryConfig.maxRetries}`
          );

          paymentResult = await this.paymentGateway.charge({
            amount,
            currency,
            paymentMethod,
            metadata: {
              orderId,
              paymentId: payment.id,
            },
          });

          // Success - break retry loop
          break;
        } catch (error) {
          lastError = error;
          this.logger.error(`Payment attempt ${attempt} failed: ${error.message}`);

          // Check if error is retryable
          if (!this.isRetryableError(error)) {
            throw error;
          }

          // Wait before retry (except on last attempt)
          if (attempt < this.retryConfig.maxRetries) {
            await this.sleep(this.retryConfig.retryDelay * attempt);
          }
        }
      }

      // If all retries failed
      if (!paymentResult) {
        throw lastError || new Error('Payment failed after all retries');
      }

      // Update payment status
      await this.database.updatePayment(payment.id, {
        status: 'completed',
        transactionId: paymentResult.transactionId,
        completedAt: new Date(),
      });

      // Publish payment completed event
      await this.eventPublisher.publish('payment.completed', {
        paymentId: payment.id,
        orderId,
        amount,
        currency,
        transactionId: paymentResult.transactionId,
        timestamp: new Date(),
      });

      this.logger.info(`Payment ${payment.id} completed successfully`);

      return {
        success: true,
        paymentId: payment.id,
        transactionId: paymentResult.transactionId,
        status: 'completed',
      };
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`);

      // Publish payment failed event
      await this.eventPublisher.publish('payment.failed', {
        orderId,
        amount,
        currency,
        error: error.message,
        timestamp: new Date(),
      });

      // Return error response
      return {
        success: false,
        error: error.code || 'PAYMENT_FAILED',
        message: error.message,
      };
    }
  }

  /**
   * Process refund for a payment
   */
  async processRefund(paymentId, amount, reason) {
    try {
      // Get original payment
      const payment = await this.database.findPaymentById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      if (amount > payment.amount) {
        throw new Error('Refund amount exceeds payment amount');
      }

      // Process refund with payment gateway
      const refundResult = await this.paymentGateway.refund({
        transactionId: payment.transactionId,
        amount,
        reason,
      });

      // Create refund record
      const refund = await this.database.createRefund({
        paymentId,
        amount,
        reason,
        status: 'completed',
        refundTransactionId: refundResult.refundId,
        createdAt: new Date(),
      });

      // Update payment status if fully refunded
      if (amount === payment.amount) {
        await this.database.updatePayment(paymentId, {
          status: 'refunded',
        });
      }

      // Publish refund event
      await this.eventPublisher.publish('payment.refunded', {
        paymentId,
        refundId: refund.id,
        amount,
        reason,
        timestamp: new Date(),
      });

      this.logger.info(`Refund processed for payment ${paymentId}`);

      return {
        success: true,
        refundId: refund.id,
        refundTransactionId: refundResult.refundId,
      };
    } catch (error) {
      this.logger.error(`Refund processing failed: ${error.message}`);
      throw error;
    }
  }

  validatePaymentRequest(request) {
    if (!request.orderId) {
      throw new Error('Order ID is required');
    }
    if (!request.amount || request.amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    if (!request.currency) {
      throw new Error('Currency is required');
    }
    if (!request.paymentMethod) {
      throw new Error('Payment method is required');
    }
  }

  isRetryableError(error) {
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT', 'TEMPORARY_FAILURE'];
    return retryableErrors.includes(error.code);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test Suite
describe('PaymentService - Isolation Tests', () => {
  let paymentService;
  let mockPaymentGateway;
  let mockDatabase;
  let mockEventPublisher;
  let mockLogger;

  beforeEach(() => {
    // Create mocks for all dependencies
    mockPaymentGateway = {
      charge: jest.fn(),
      refund: jest.fn(),
    };

    mockDatabase = {
      findPaymentByOrderId: jest.fn(),
      findPaymentById: jest.fn(),
      createPayment: jest.fn(),
      updatePayment: jest.fn(),
      createRefund: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    // Create service instance with mocked dependencies
    paymentService = new PaymentService({
      paymentGateway: mockPaymentGateway,
      database: mockDatabase,
      eventPublisher: mockEventPublisher,
      logger: mockLogger,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 10, // Short delay for tests
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment - Success Scenarios', () => {
    it('should process a valid payment successfully', async () => {
      // Arrange
      const paymentRequest = {
        orderId: 'order-123',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'card_visa_4242',
      };

      mockDatabase.findPaymentByOrderId.mockResolvedValue(null);
      mockDatabase.createPayment.mockResolvedValue({
        id: 'payment-456',
        ...paymentRequest,
        status: 'pending',
      });

      mockPaymentGateway.charge.mockResolvedValue({
        transactionId: 'txn-789',
        status: 'success',
      });

      mockDatabase.updatePayment.mockResolvedValue(undefined);

      // Act
      const result = await paymentService.processPayment(paymentRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('payment-456');
      expect(result.transactionId).toBe('txn-789');

      // Verify database interactions
      expect(mockDatabase.findPaymentByOrderId).toHaveBeenCalledWith('order-123');
      expect(mockDatabase.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-123',
          amount: 99.99,
          status: 'pending',
        })
      );
      expect(mockDatabase.updatePayment).toHaveBeenCalledWith(
        'payment-456',
        expect.objectContaining({
          status: 'completed',
          transactionId: 'txn-789',
        })
      );

      // Verify event publishing
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'payment.completed',
        expect.objectContaining({
          paymentId: 'payment-456',
          orderId: 'order-123',
          transactionId: 'txn-789',
        })
      );
    });

    it('should detect and reject duplicate payments', async () => {
      // Arrange
      const paymentRequest = {
        orderId: 'order-123',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'card_visa_4242',
      };

      mockDatabase.findPaymentByOrderId.mockResolvedValue({
        id: 'payment-existing',
        orderId: 'order-123',
        status: 'completed',
      });

      // Act
      const result = await paymentService.processPayment(paymentRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('DUPLICATE_PAYMENT');
      expect(mockPaymentGateway.charge).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate payment attempt')
      );
    });
  });

  describe('processPayment - Validation', () => {
    it('should reject payment without order ID', async () => {
      const paymentRequest = {
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'card_visa_4242',
      };

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Order ID is required');
      expect(mockPaymentGateway.charge).not.toHaveBeenCalled();
    });

    it('should reject payment with invalid amount', async () => {
      const paymentRequest = {
        orderId: 'order-123',
        amount: -10,
        currency: 'USD',
        paymentMethod: 'card_visa_4242',
      };

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid payment amount');
    });

    it('should reject payment without currency', async () => {
      const paymentRequest = {
        orderId: 'order-123',
        amount: 99.99,
        paymentMethod: 'card_visa_4242',
      };

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Currency is required');
    });
  });

  describe('processPayment - Retry Logic', () => {
    it('should retry on retryable errors and succeed', async () => {
      const paymentRequest = {
        orderId: 'order-123',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'card_visa_4242',
      };

      mockDatabase.findPaymentByOrderId.mockResolvedValue(null);
      mockDatabase.createPayment.mockResolvedValue({
        id: 'payment-456',
        status: 'pending',
      });

      // First two attempts fail, third succeeds
      const networkError = new Error('Network timeout');
      networkError.code = 'NETWORK_ERROR';

      mockPaymentGateway.charge
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          transactionId: 'txn-789',
          status: 'success',
        });

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(true);
      expect(mockPaymentGateway.charge).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const paymentRequest = {
        orderId: 'order-123',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'card_invalid',
      };

      mockDatabase.findPaymentByOrderId.mockResolvedValue(null);
      mockDatabase.createPayment.mockResolvedValue({
        id: 'payment-456',
        status: 'pending',
      });

      const invalidCardError = new Error('Invalid card');
      invalidCardError.code = 'INVALID_CARD';

      mockPaymentGateway.charge.mockRejectedValue(invalidCardError);

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(mockPaymentGateway.charge).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('payment.failed', expect.any(Object));
    });

    it('should fail after max retries exceeded', async () => {
      const paymentRequest = {
        orderId: 'order-123',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'card_visa_4242',
      };

      mockDatabase.findPaymentByOrderId.mockResolvedValue(null);
      mockDatabase.createPayment.mockResolvedValue({
        id: 'payment-456',
        status: 'pending',
      });

      const networkError = new Error('Network timeout');
      networkError.code = 'NETWORK_ERROR';

      mockPaymentGateway.charge.mockRejectedValue(networkError);

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(mockPaymentGateway.charge).toHaveBeenCalledTimes(3);
      expect(result.message).toContain('Network timeout');
    });
  });

  describe('processRefund', () => {
    it('should process a full refund successfully', async () => {
      // Arrange
      const paymentId = 'payment-456';
      const refundAmount = 99.99;
      const reason = 'Customer requested refund';

      mockDatabase.findPaymentById.mockResolvedValue({
        id: paymentId,
        orderId: 'order-123',
        amount: 99.99,
        status: 'completed',
        transactionId: 'txn-789',
      });

      mockPaymentGateway.refund.mockResolvedValue({
        refundId: 'refund-abc',
        status: 'success',
      });

      mockDatabase.createRefund.mockResolvedValue({
        id: 'refund-record-123',
        paymentId,
        amount: refundAmount,
        status: 'completed',
      });

      // Act
      const result = await paymentService.processRefund(paymentId, refundAmount, reason);

      // Assert
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund-record-123');
      expect(mockPaymentGateway.refund).toHaveBeenCalledWith({
        transactionId: 'txn-789',
        amount: refundAmount,
        reason,
      });
      expect(mockDatabase.updatePayment).toHaveBeenCalledWith(paymentId, {
        status: 'refunded',
      });
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'payment.refunded',
        expect.objectContaining({
          paymentId,
          amount: refundAmount,
          reason,
        })
      );
    });

    it('should reject refund for non-existent payment', async () => {
      mockDatabase.findPaymentById.mockResolvedValue(null);

      await expect(paymentService.processRefund('payment-999', 99.99, 'Refund')).rejects.toThrow(
        'Payment not found'
      );

      expect(mockPaymentGateway.refund).not.toHaveBeenCalled();
    });

    it('should reject refund for non-completed payment', async () => {
      mockDatabase.findPaymentById.mockResolvedValue({
        id: 'payment-456',
        status: 'pending',
      });

      await expect(paymentService.processRefund('payment-456', 99.99, 'Refund')).rejects.toThrow(
        'Can only refund completed payments'
      );
    });

    it('should reject refund exceeding payment amount', async () => {
      mockDatabase.findPaymentById.mockResolvedValue({
        id: 'payment-456',
        amount: 50.0,
        status: 'completed',
      });

      await expect(paymentService.processRefund('payment-456', 100.0, 'Refund')).rejects.toThrow(
        'Refund amount exceeds payment amount'
      );
    });
  });
});

/**
 * ISOLATION TESTING PATTERNS:
 *
 * 1. Dependency Injection:
 *    - Pass dependencies through constructor
 *    - Makes mocking easy and explicit
 *    - Improves testability
 *
 * 2. Mock Everything External:
 *    - Databases
 *    - External APIs
 *    - Message queues
 *    - File systems
 *    - Time/dates
 *
 * 3. Test Categories:
 *    - Happy path scenarios
 *    - Validation and error handling
 *    - Retry and resilience logic
 *    - Edge cases
 *    - Business rules
 *
 * 4. Assertion Best Practices:
 *    - Verify return values
 *    - Check mock call counts
 *    - Validate mock call arguments
 *    - Test event publishing
 *    - Verify logging
 *
 * 5. Mock Strategies:
 *    - Use jest.fn() for simple mocks
 *    - mockResolvedValue for async success
 *    - mockRejectedValue for async failures
 *    - mockReturnValueOnce for sequences
 *    - Clear mocks between tests
 */
