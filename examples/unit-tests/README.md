# Unit Testing Examples

This directory contains unit testing examples in multiple programming languages, demonstrating best practices, patterns, and techniques.

## 📋 Examples Included

### JavaScript/TypeScript
- Basic assertions and matchers
- Mocking and stubbing
- Async testing
- Test-Driven Development (TDD) example
- Code coverage configuration

### Java
- JUnit 5 features
- Mockito integration
- Parameterized tests
- Test fixtures
- AssertJ assertions

### Python
- pytest basics and fixtures
- Mock and patch usage
- Property-based testing
- Test organization
- Coverage reporting

## 🎯 Unit Testing Best Practices Demonstrated

1. **Test Structure**: Arrange-Act-Assert pattern
2. **Naming**: Descriptive test names
3. **Isolation**: Each test independent
4. **Mocking**: External dependencies mocked
5. **Coverage**: Aiming for 80%+ coverage
6. **Speed**: Tests run in milliseconds

## 📚 Quick Start

### JavaScript Example

```bash
cd javascript
npm install
npm test
npm run test:coverage
```

### Java Example

```bash
cd java
mvn test
mvn test jacoco:report
```

### Python Example

```bash
cd python
pip install -r requirements.txt
pytest
pytest --cov=src --cov-report=html
```

---

*Unit tests are the foundation of the testing pyramid. These examples show how to write fast, reliable, and maintainable unit tests.*