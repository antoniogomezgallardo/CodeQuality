# Integration Testing Examples

This directory contains integration testing examples demonstrating how to test component interactions, external service integrations, and database operations.

## 📋 Examples Included

### API Integration Tests
- REST API endpoint testing
- GraphQL integration tests
- Authentication and authorization
- Error handling scenarios
- Response validation

### Database Integration Tests
- CRUD operations testing
- Transaction testing
- Connection pooling
- Migration testing
- Data integrity checks

### Service Integration Tests
- Microservices communication
- Message queue integration
- Third-party service mocking
- Contract testing
- Service orchestration

## 🎯 Integration Testing Best Practices

1. **Test Environment**: Isolated test database/services
2. **Data Management**: Clean state before each test
3. **Service Isolation**: Mock external dependencies
4. **Real Components**: Test real implementations
5. **Error Scenarios**: Test failure paths
6. **Performance**: Monitor test execution time

## 📚 Quick Start

### API Testing Example

```bash
cd api-tests
npm install
npm run test:integration
```

### Database Testing Example

```bash
cd database-tests
docker-compose up -d  # Start test database
npm install
npm test
docker-compose down
```

### Service Testing Example

```bash
cd service-tests
npm install
npm run test:services
```

## 🔧 Test Environment Setup

Each example includes:
- Docker Compose for dependencies
- Test data seeders
- Environment configuration
- Cleanup scripts

---

*Integration tests verify that different parts of the system work correctly together. These examples show how to test real component interactions while maintaining test isolation and speed.*