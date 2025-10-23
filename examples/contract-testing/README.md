# Contract Testing Examples

Contract testing ensures that APIs and service boundaries work correctly between different components or services. It focuses on verifying the contract (interface) between services.

## 🎯 What is Contract Testing?

Contract testing is a methodology for ensuring that two separate services can communicate correctly. It captures the interactions between each service, storing them in a contract, which can then be used to verify that both parties adhere to it.

## 📋 Examples Included

### Provider Testing (Pact)

- API provider contract verification
- Schema validation
- Breaking change detection
- Consumer-driven contracts

### Consumer Testing

- Mock service generation from contracts
- API client testing
- Integration testing isolation
- Service virtualization

### OpenAPI/Swagger Testing

- Schema-based contract testing
- API specification validation
- Request/response validation
- Documentation testing

## 🛠️ Tools Demonstrated

- **Pact**: Consumer-driven contract testing
- **Spring Cloud Contract**: JVM-based contract testing
- **Postman Contract Testing**: API contract validation
- **OpenAPI Validator**: Schema validation

## 🚀 Quick Start

### Pact Consumer Test

```bash
npm install @pact-foundation/pact
npm run test:consumer
```

### Pact Provider Test

```bash
npm install @pact-foundation/pact
npm run test:provider
```

### OpenAPI Validation

```bash
npm install swagger-parser
npm run test:openapi
```

## 📊 Contract Testing Benefits

- **Early Detection**: Find integration issues early
- **Independent Development**: Teams can work independently
- **Reliable Integration**: Ensure services communicate correctly
- **Breaking Change Prevention**: Detect API changes that break consumers
- **Living Documentation**: Contracts serve as documentation

## 🎯 Best Practices

1. **Consumer-Driven**: Let consumers define what they need
2. **Minimal Contracts**: Only test what the consumer actually uses
3. **Version Contracts**: Track contract evolution over time
4. **Automated Verification**: Run contract tests in CI/CD
5. **Broker Usage**: Use Pact Broker for contract sharing

---

_Contract testing is essential for microservices architecture and distributed systems. These examples show how to implement reliable service integration testing._
