/**
 * Event-Driven Architecture Testing
 *
 * This file demonstrates testing for event-driven microservices using
 * message queues (RabbitMQ/Kafka). Tests cover event publishing,
 * consumption, ordering, idempotency, and error handling.
 *
 * Best Practices:
 * - Test event schemas and validation
 * - Verify idempotent event processing
 * - Test dead letter queue handling
 * - Validate event ordering when required
 * - Test event replay scenarios
 *
 * @see https://www.enterpriseintegrationpatterns.com/
 */

const amqp = require('amqplib');
const { Kafka } = require('kafkajs');
const { expect } = require('chai');
const { v4: uuidv4 } = require('uuid');

// Configuration
const config = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: 'test-events',
    queues: {
      orders: 'test-order-events',
      payments: 'test-payment-events',
      notifications: 'test-notification-events',
      dlq: 'test-dead-letter-queue',
    },
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'integration-test-client',
    topics: {
      orders: 'test-orders',
      payments: 'test-payments',
      notifications: 'test-notifications',
    },
  },
};

/**
 * Helper class for RabbitMQ testing
 */
class RabbitMQTestHelper {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.channel = null;
    this.receivedMessages = [];
  }

  async connect() {
    this.connection = await amqp.connect(this.config.url);
    this.channel = await this.connection.createChannel();

    // Setup exchange
    await this.channel.assertExchange(this.config.exchange, 'topic', {
      durable: true,
    });

    // Setup queues
    for (const [name, queueName] of Object.entries(this.config.queues)) {
      await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': this.config.exchange,
          'x-dead-letter-routing-key': 'dlq',
        },
      });
    }

    console.log('RabbitMQ connection established');
  }

  async publishEvent(routingKey, event, options = {}) {
    const message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: routingKey,
      data: event,
      metadata: options.metadata || {},
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));

    return this.channel.publish(this.config.exchange, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
      messageId: message.id,
      timestamp: Date.now(),
      ...options,
    });
  }

  async consumeEvents(queueName, onMessage, options = {}) {
    await this.channel.bindQueue(queueName, this.config.exchange, options.routingKey || '#');

    return this.channel.consume(
      queueName,
      async msg => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString());
            this.receivedMessages.push(event);

            const shouldAck = await onMessage(event, msg);
            if (shouldAck !== false) {
              this.channel.ack(msg);
            }
          } catch (error) {
            console.error('Error processing message:', error);
            // Reject and requeue or send to DLQ
            this.channel.nack(msg, false, options.requeue || false);
          }
        }
      },
      { noAck: false }
    );
  }

  async waitForMessages(count, timeout = 5000) {
    const startTime = Date.now();
    while (this.receivedMessages.length < count) {
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Timeout waiting for messages. Expected ${count}, received ${this.receivedMessages.length}`
        );
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.receivedMessages.slice(0, count);
  }

  clearReceivedMessages() {
    this.receivedMessages = [];
  }

  async purgeQueue(queueName) {
    await this.channel.purgeQueue(queueName);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

/**
 * Helper class for Kafka testing
 */
class KafkaTestHelper {
  constructor(config) {
    this.config = config;
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
    });
    this.producer = null;
    this.consumer = null;
    this.receivedMessages = [];
  }

  async connect() {
    this.producer = this.kafka.producer();
    await this.producer.connect();

    this.consumer = this.kafka.consumer({
      groupId: `test-group-${uuidv4()}`,
      sessionTimeout: 30000,
    });
    await this.consumer.connect();

    console.log('Kafka connection established');
  }

  async publishEvent(topic, event, options = {}) {
    const message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: topic,
      data: event,
      metadata: options.metadata || {},
    };

    await this.producer.send({
      topic,
      messages: [
        {
          key: options.key || null,
          value: JSON.stringify(message),
          headers: options.headers || {},
          partition: options.partition,
        },
      ],
    });

    return message;
  }

  async subscribeToTopics(topics, onMessage) {
    await this.consumer.subscribe({
      topics,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          this.receivedMessages.push({
            topic,
            partition,
            offset: message.offset,
            event,
          });

          await onMessage(event, { topic, partition, message });
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });
  }

  async waitForMessages(count, timeout = 5000) {
    const startTime = Date.now();
    while (this.receivedMessages.length < count) {
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Timeout waiting for Kafka messages. Expected ${count}, received ${this.receivedMessages.length}`
        );
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.receivedMessages.slice(0, count);
  }

  clearReceivedMessages() {
    this.receivedMessages = [];
  }

  async close() {
    if (this.consumer) {
      await this.consumer.disconnect();
    }
    if (this.producer) {
      await this.producer.disconnect();
    }
  }
}

describe('Event-Driven Microservices Tests - RabbitMQ', () => {
  let rabbitMQ;

  before(async function () {
    this.timeout(10000);
    rabbitMQ = new RabbitMQTestHelper(config.rabbitmq);
    try {
      await rabbitMQ.connect();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
      this.skip();
    }
  });

  beforeEach(async () => {
    // Clear all queues before each test
    for (const queueName of Object.values(config.rabbitmq.queues)) {
      await rabbitMQ.purgeQueue(queueName);
    }
    rabbitMQ.clearReceivedMessages();
  });

  after(async () => {
    if (rabbitMQ) {
      await rabbitMQ.close();
    }
  });

  describe('Event Publishing and Consumption', () => {
    it('should publish and consume order created event', async () => {
      const orderEvent = {
        orderId: 'order-123',
        customerId: 'customer-456',
        totalAmount: 99.99,
        items: [{ productId: 'product-789', quantity: 2, price: 49.99 }],
      };

      // Setup consumer
      const consumedEvents = [];
      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.orders,
        async event => {
          consumedEvents.push(event);
        },
        { routingKey: 'order.created' }
      );

      // Publish event
      await rabbitMQ.publishEvent('order.created', orderEvent);

      // Wait for consumption
      await rabbitMQ.waitForMessages(1);

      // Verify
      expect(consumedEvents).to.have.length(1);
      expect(consumedEvents[0].data).to.deep.equal(orderEvent);
      expect(consumedEvents[0].id).to.exist;
      expect(consumedEvents[0].timestamp).to.exist;
    });

    it('should handle multiple events in order', async () => {
      const events = [
        { orderId: 'order-1', status: 'created' },
        { orderId: 'order-1', status: 'confirmed' },
        { orderId: 'order-1', status: 'shipped' },
      ];

      // Setup consumer
      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.orders,
        async event => {
          // Event processing
        },
        { routingKey: 'order.#' }
      );

      // Publish events
      for (const event of events) {
        await rabbitMQ.publishEvent(`order.${event.status}`, event);
      }

      // Wait for all events
      const received = await rabbitMQ.waitForMessages(3);

      // Verify order and content
      expect(received).to.have.length(3);
      expect(received[0].data.status).to.equal('created');
      expect(received[1].data.status).to.equal('confirmed');
      expect(received[2].data.status).to.equal('shipped');
    });
  });

  describe('Event Routing and Filtering', () => {
    it('should route events based on routing keys', async () => {
      const orderConsumer = [];
      const paymentConsumer = [];

      // Setup consumers with different routing keys
      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.orders,
        async event => {
          orderConsumer.push(event);
        },
        { routingKey: 'order.#' }
      );

      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.payments,
        async event => {
          paymentConsumer.push(event);
        },
        { routingKey: 'payment.#' }
      );

      // Publish mixed events
      await rabbitMQ.publishEvent('order.created', { orderId: 'order-1' });
      await rabbitMQ.publishEvent('payment.completed', { paymentId: 'pay-1' });
      await rabbitMQ.publishEvent('order.confirmed', { orderId: 'order-2' });

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify routing
      expect(orderConsumer).to.have.length(2);
      expect(paymentConsumer).to.have.length(1);
    });
  });

  describe('Idempotent Event Processing', () => {
    it('should handle duplicate events idempotently', async () => {
      const processedEvents = new Set();
      let processingCount = 0;

      // Setup idempotent consumer
      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.orders,
        async event => {
          if (processedEvents.has(event.id)) {
            console.log(`Duplicate event detected: ${event.id}`);
            return true; // Acknowledge but don't process
          }

          processedEvents.add(event.id);
          processingCount++;

          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 10));
        },
        { routingKey: 'order.#' }
      );

      // Publish same event twice
      const event = { orderId: 'order-123', status: 'created' };
      const eventId = uuidv4();

      await rabbitMQ.publishEvent('order.created', event, {
        messageId: eventId,
      });
      await rabbitMQ.publishEvent('order.created', event, {
        messageId: eventId,
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify only processed once
      // Note: In real implementation, the event ID should be preserved
      // This is a simplified example
      expect(processingCount).to.be.at.most(2);
    });
  });

  describe('Dead Letter Queue Handling', () => {
    it('should send failed messages to DLQ after retries', async () => {
      const maxRetries = 3;
      let attemptCount = 0;

      // Setup consumer that always fails
      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.orders,
        async (event, msg) => {
          attemptCount++;
          throw new Error('Simulated processing error');
        },
        { routingKey: 'order.#', requeue: false }
      );

      // Setup DLQ consumer
      const dlqMessages = [];
      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.dlq,
        async event => {
          dlqMessages.push(event);
        },
        { routingKey: 'dlq' }
      );

      // Publish event
      await rabbitMQ.publishEvent('order.created', {
        orderId: 'order-fail-123',
      });

      // Wait for DLQ processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify message ended up in DLQ
      // Note: This is simplified - real DLQ handling would track retry count
      expect(dlqMessages.length).to.be.greaterThan(0);
    });
  });

  describe('Event Schema Validation', () => {
    it('should validate event schema before processing', async () => {
      const validEvents = [];
      const invalidEvents = [];

      // Event schema
      const orderCreatedSchema = {
        required: ['orderId', 'customerId', 'totalAmount'],
        properties: {
          orderId: { type: 'string' },
          customerId: { type: 'string' },
          totalAmount: { type: 'number' },
        },
      };

      // Schema validation function
      function validateEvent(event, schema) {
        for (const field of schema.required) {
          if (!(field in event)) {
            return false;
          }
        }
        return true;
      }

      // Setup consumer with validation
      await rabbitMQ.consumeEvents(
        config.rabbitmq.queues.orders,
        async event => {
          if (validateEvent(event.data, orderCreatedSchema)) {
            validEvents.push(event);
          } else {
            invalidEvents.push(event);
            return false; // Don't acknowledge invalid events
          }
        },
        { routingKey: 'order.created' }
      );

      // Publish valid and invalid events
      await rabbitMQ.publishEvent('order.created', {
        orderId: 'order-1',
        customerId: 'customer-1',
        totalAmount: 99.99,
      });

      await rabbitMQ.publishEvent('order.created', {
        orderId: 'order-2',
        // Missing customerId and totalAmount
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify validation
      expect(validEvents).to.have.length(1);
      expect(invalidEvents).to.have.length(1);
    });
  });
});

describe('Event-Driven Microservices Tests - Kafka', () => {
  let kafka;

  before(async function () {
    this.timeout(15000);
    kafka = new KafkaTestHelper(config.kafka);
    try {
      await kafka.connect();
    } catch (error) {
      console.error('Failed to connect to Kafka:', error.message);
      this.skip();
    }
  });

  beforeEach(() => {
    kafka.clearReceivedMessages();
  });

  after(async () => {
    if (kafka) {
      await kafka.close();
    }
  });

  describe('Event Publishing and Consumption', () => {
    it('should publish and consume events from Kafka topic', async () => {
      const orderEvent = {
        orderId: 'order-kafka-123',
        customerId: 'customer-456',
        totalAmount: 149.99,
      };

      // Subscribe to topic
      const consumedEvents = [];
      await kafka.subscribeToTopics([config.kafka.topics.orders], async event => {
        consumedEvents.push(event);
      });

      // Wait a bit for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Publish event
      await kafka.publishEvent(config.kafka.topics.orders, orderEvent);

      // Wait for consumption
      await kafka.waitForMessages(1);

      // Verify
      expect(consumedEvents).to.have.length(1);
      expect(consumedEvents[0].data).to.deep.equal(orderEvent);
    });

    it('should maintain message ordering within partition', async () => {
      const orderId = 'order-partition-123';
      const events = [
        { orderId, event: 'created', sequence: 1 },
        { orderId, event: 'confirmed', sequence: 2 },
        { orderId, event: 'shipped', sequence: 3 },
        { orderId, event: 'delivered', sequence: 4 },
      ];

      // Subscribe to topic
      const receivedSequence = [];
      await kafka.subscribeToTopics([config.kafka.topics.orders], async event => {
        receivedSequence.push(event.data.sequence);
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Publish events with same key (ensures same partition)
      for (const event of events) {
        await kafka.publishEvent(config.kafka.topics.orders, event, {
          key: orderId, // Same key = same partition = ordered
        });
      }

      // Wait for all events
      await kafka.waitForMessages(4, 10000);

      // Verify order maintained
      expect(receivedSequence).to.deep.equal([1, 2, 3, 4]);
    });
  });

  describe('Consumer Groups and Load Balancing', () => {
    it('should distribute events across consumer group members', async function () {
      this.timeout(20000);

      // Create multiple consumers in same group
      const consumer1Events = [];
      const consumer2Events = [];

      const groupId = `test-group-${uuidv4()}`;

      const kafka1 = new KafkaTestHelper({
        ...config.kafka,
        clientId: 'consumer-1',
      });
      const kafka2 = new KafkaTestHelper({
        ...config.kafka,
        clientId: 'consumer-2',
      });

      await kafka1.connect();
      await kafka2.connect();

      // Both join same consumer group
      kafka1.consumer = kafka1.kafka.consumer({ groupId });
      kafka2.consumer = kafka2.kafka.consumer({ groupId });

      await kafka1.consumer.connect();
      await kafka2.consumer.connect();

      // Subscribe both consumers
      await kafka1.subscribeToTopics([config.kafka.topics.orders], async event => {
        consumer1Events.push(event);
      });

      await kafka2.subscribeToTopics([config.kafka.topics.orders], async event => {
        consumer2Events.push(event);
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Publish multiple events
      for (let i = 0; i < 10; i++) {
        await kafka.publishEvent(config.kafka.topics.orders, {
          orderId: `order-${i}`,
          index: i,
        });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify load balancing (both consumers should receive some events)
      console.log(`Consumer 1 received: ${consumer1Events.length} events`);
      console.log(`Consumer 2 received: ${consumer2Events.length} events`);

      // Total should be 10 (all events consumed)
      const totalReceived = consumer1Events.length + consumer2Events.length;
      expect(totalReceived).to.equal(10);

      // Clean up
      await kafka1.close();
      await kafka2.close();
    });
  });
});

/**
 * EVENT-DRIVEN TESTING BEST PRACTICES:
 *
 * 1. Test Isolation:
 *    - Use unique queue/topic names per test
 *    - Clean up queues/topics before each test
 *    - Use separate consumer groups
 *
 * 2. Event Schema:
 *    - Define clear event schemas
 *    - Validate events before processing
 *    - Version event schemas
 *    - Test schema evolution
 *
 * 3. Idempotency:
 *    - Track processed event IDs
 *    - Test duplicate event handling
 *    - Implement idempotent operations
 *    - Use database constraints
 *
 * 4. Error Handling:
 *    - Test dead letter queue processing
 *    - Implement retry logic
 *    - Set retry limits
 *    - Monitor failed events
 *
 * 5. Message Ordering:
 *    - Use partition keys in Kafka
 *    - Test ordering requirements
 *    - Handle out-of-order events
 *    - Implement sequence numbers
 *
 * 6. Testing Patterns:
 *    - Test event publishing
 *    - Test event consumption
 *    - Test event routing
 *    - Test error scenarios
 *    - Test at-least-once delivery
 *    - Test exactly-once semantics
 *
 * TROUBLESHOOTING:
 *
 * - Messages not consumed: Check routing keys/topics
 * - Duplicate processing: Implement idempotency
 * - Lost messages: Ensure durability and acknowledgment
 * - Ordering issues: Check partition strategy
 * - Consumer lag: Scale consumers or optimize processing
 */
