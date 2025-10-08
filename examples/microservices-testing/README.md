# Microservices Testing Examples

## Overview

This directory contains comprehensive, production-ready examples for testing microservices architectures. The examples demonstrate industry best practices for contract testing, service isolation, integration testing, event-driven systems, and chaos engineering.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Setup Instructions](#setup-instructions)
3. [Examples Overview](#examples-overview)
4. [Running the Tests](#running-the-tests)
5. [Best Practices](#best-practices)
6. [Common Pitfalls](#common-pitfalls)

## Testing Strategy

### Testing Pyramid for Microservices

```
        /\
       /  \       E2E Tests (Few)
      /____\
     /      \     Integration Tests (Some)
    /________\
   /          \   Contract Tests (More)
  /____________\
 /              \ Unit Tests (Many)
/______________\
```

### Key Testing Approaches

1. **Contract Testing** - Verify API contracts between consumers and providers
2. **Service Isolation** - Test individual services with mocked dependencies
3. **Integration Testing** - Test service-to-service communication
4. **Event-Driven Testing** - Verify message queue and event stream behavior
5. **Chaos Engineering** - Test system resilience and failure scenarios

## Setup Instructions

### Prerequisites

- Node.js 18+ or 20+
- Docker and Docker Compose
- RabbitMQ or Kafka (for event-driven tests)

### Installation

```bash
# Install dependencies
npm install

# Start test environment
docker-compose -f docker-compose-test.yml up -d

# Run all tests
npm test

# Run specific test suites
npm run test:contract
npm run test:integration
npm run test:events
npm run test:chaos
```

## Examples Overview

### 1. Contract Testing (Pact)

**Files**: `contract-testing-consumer.test.js`, `contract-testing-provider.test.js`

Contract testing ensures that the contract between service consumers and providers is maintained. Using Pact, we define expected interactions and verify them independently.

**Key Benefits**:
- Catch breaking API changes early
- Enable independent service deployment
- Reduce need for end-to-end tests
- Provide living documentation of API contracts

**When to Use**:
- Testing HTTP API interactions between services
- Verifying message format in async communication
- Before deploying services independently

### 2. Service Isolation Testing

**File**: `service-isolation.test.js`

Tests individual microservices with all external dependencies mocked or stubbed. This ensures services work correctly in isolation.

**Key Benefits**:
- Fast test execution
- No external dependencies
- Easy to reproduce failures
- High test reliability

**When to Use**:
- Unit testing service logic
- Testing error handling
- Verifying business rules
- CI/CD pipeline execution

### 3. Integration Testing

**File**: `integration-tests.spec.js`

Tests the actual communication between services, including HTTP calls, database interactions, and third-party integrations.

**Key Benefits**:
- Verify real service interactions
- Catch integration issues early
- Test network failures and timeouts
- Validate data serialization

**When to Use**:
- After contract tests pass
- Testing complex workflows
- Verifying cross-service transactions
- Pre-production validation

### 4. Event-Driven Testing

**File**: `event-driven-tests.spec.js`

Tests message queue systems (RabbitMQ, Kafka) including event publishing, consumption, dead letter queues, and message ordering.

**Key Benefits**:
- Verify async communication
- Test message idempotency
- Validate event ordering
- Check error handling in event processing

**When to Use**:
- Testing event-driven architectures
- Verifying saga patterns
- Testing event sourcing systems
- Validating CQRS implementations

### 5. Chaos Engineering

**File**: `chaos-engineering.js`

Introduces controlled failures to test system resilience: network delays, service failures, resource exhaustion, and cascading failures.

**Key Benefits**:
- Identify system weaknesses
- Verify circuit breakers
- Test fallback mechanisms
- Validate retry logic

**When to Use**:
- Production-like environments
- Load testing scenarios
- Disaster recovery planning
- Continuous resilience validation

## Running the Tests

### Run All Tests

```bash
npm test
```

### Run Contract Tests Only

```bash
# Consumer tests
npm run test:contract:consumer

# Provider tests
npm run test:contract:provider

# Publish pacts
npm run pact:publish
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run Event-Driven Tests

```bash
# Ensure message broker is running
docker-compose -f docker-compose-test.yml up -d rabbitmq

npm run test:events
```

### Run Chaos Tests

```bash
# WARNING: Only run in test environments
npm run test:chaos
```

## Best Practices

### 1. Test Data Management

- Use unique test data per test execution
- Clean up test data after each test
- Use test data builders for complex objects
- Implement data factories for consistency

### 2. Test Environment Isolation

- Use Docker Compose for consistent environments
- Isolate tests from each other
- Reset state between test runs
- Use separate databases for testing

### 3. Contract Testing

- Keep contracts consumer-driven
- Version your contracts
- Use a Pact Broker for contract sharing
- Run provider verification on every deployment

### 4. Integration Testing

- Test happy paths and error scenarios
- Include timeout and retry logic tests
- Verify idempotency
- Test partial failures

### 5. Event-Driven Testing

- Test event ordering where required
- Verify idempotent event processing
- Test dead letter queue handling
- Validate event schema evolution

### 6. Chaos Engineering

- Start with low blast radius
- Run in non-production first
- Monitor system behavior continuously
- Document findings and improvements
- Automate chaos experiments

## Common Pitfalls

### 1. Over-Reliance on E2E Tests

**Problem**: Too many end-to-end tests lead to slow, flaky test suites.

**Solution**: Follow the testing pyramid. Use contract tests and integration tests for most scenarios.

### 2. Shared Test Databases

**Problem**: Tests interfere with each other, causing flakiness.

**Solution**: Use isolated test databases or transactions that roll back.

### 3. Ignoring Network Failures

**Problem**: Tests don't account for network issues in production.

**Solution**: Include timeout, retry, and circuit breaker tests.

### 4. Missing Contract Versioning

**Problem**: Breaking changes deployed without warning.

**Solution**: Version contracts and maintain backward compatibility.

### 5. Testing Against Mocks Only

**Problem**: Tests pass but production fails.

**Solution**: Balance mocked tests with real integration tests.

### 6. No Chaos Testing

**Problem**: Production failures reveal unknown weaknesses.

**Solution**: Regularly run chaos experiments in production-like environments.

## Architecture Example

### Sample Microservices Architecture

```
┌─────────────┐
│   API       │
│   Gateway   │
└──────┬──────┘
       │
       ├─────────┬─────────┬─────────┐
       │         │         │         │
┌──────▼──────┐ │  ┌──────▼──────┐  │
│   Order     │ │  │   Payment   │  │
│   Service   │ │  │   Service   │  │
└──────┬──────┘ │  └──────┬──────┘  │
       │        │         │         │
       ▼        │         ▼         │
┌─────────────┐ │  ┌─────────────┐  │
│   Order DB  │ │  │  Payment DB │  │
└─────────────┘ │  └─────────────┘  │
                │                   │
         ┌──────▼──────┐    ┌──────▼──────┐
         │ Notification│    │  Inventory  │
         │   Service   │    │   Service   │
         └──────┬──────┘    └──────┬──────┘
                │                  │
         ┌──────▼──────────────────▼──────┐
         │       Message Queue            │
         │       (RabbitMQ/Kafka)         │
         └────────────────────────────────┘
```

## Testing Scenarios by Service

### Order Service Tests

1. Create order (contract + integration)
2. Update order status (isolation)
3. Query order history (integration)
4. Handle payment failures (chaos)
5. Process order events (event-driven)

### Payment Service Tests

1. Process payment (contract + integration)
2. Handle retries (isolation + chaos)
3. Refund processing (integration)
4. Payment gateway timeout (chaos)
5. Payment events publishing (event-driven)

### Notification Service Tests

1. Send notifications (isolation)
2. Handle email provider failures (chaos)
3. Process notification queue (event-driven)
4. Retry logic (isolation + chaos)
5. Multiple notification channels (integration)

### Inventory Service Tests

1. Check stock availability (contract)
2. Reserve inventory (integration)
3. Release reserved items (event-driven)
4. Handle concurrent updates (chaos)
5. Inventory sync events (event-driven)

## Monitoring and Observability

### Key Metrics to Track

1. **Test Execution Time** - Monitor for slow tests
2. **Test Flakiness** - Track intermittent failures
3. **Contract Test Coverage** - Ensure all interactions covered
4. **Integration Test Success Rate** - Monitor service stability
5. **Chaos Experiment Results** - Track resilience improvements

### Recommended Tools

- **Pact Broker** - Contract management and verification
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Jaeger/Zipkin** - Distributed tracing
- **ELK Stack** - Log aggregation

## Resources

### Standards and Guidelines

- **ISTQB Microservices Testing** - Certification guidelines
- **Martin Fowler's Microservices** - Architecture patterns
- **Testing Microservices by Toby Clemson** - Comprehensive guide
- **Building Microservices by Sam Newman** - Architecture guide

### Tools and Frameworks

- **Pact** - Contract testing framework
- **Testcontainers** - Docker-based test dependencies
- **Chaos Toolkit** - Chaos engineering experiments
- **WireMock** - HTTP service mocking
- **Docker Compose** - Multi-container orchestration

## Contributing

When adding new examples:

1. Follow existing code structure and naming conventions
2. Include comprehensive comments
3. Add error handling and edge cases
4. Update this README with new examples
5. Ensure all tests are production-ready
6. Include setup and teardown logic
7. Add to the appropriate test suite in package.json

## License

These examples are provided as educational material for the Code Quality Documentation Project.
