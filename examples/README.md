# Code Quality Examples

This directory contains practical, working examples demonstrating the concepts and best practices described in the main documentation. Each subdirectory includes runnable code with clear explanations.

## 📁 Directory Structure

```
/examples
├── /unit-tests          # Unit testing examples in multiple languages
├── /integration-tests   # API, database, and service integration tests
├── /e2e-tests          # End-to-end testing with Selenium, Cypress, Playwright
├── /component-testing   # Component testing for React, Vue, and Angular
├── /contract-testing    # Contract testing with Pact and OpenAPI
├── /manual-testing      # Manual test cases, checklists, and test plans
├── /exploratory-testing # Exploratory testing session charters and reports
├── /visual-testing      # Visual regression testing examples
├── /api-testing         # API testing with REST, GraphQL, and performance
├── /load-testing        # Load, stress, and performance testing examples
├── /version-control     # Version control workflows (TBD, GitHub Flow, GitFlow)
├── /ci-pipelines        # CI/CD pipeline configurations for various platforms
└── /monitoring-configs  # Monitoring, alerting, and observability setups
```

## 🚀 Quick Start

Each example directory contains:
- `README.md` - Explanation and setup instructions
- Working code examples with comments
- Configuration files
- Sample test data where applicable

## 💡 How to Use These Examples

1. **Learning**: Study the examples to understand implementation patterns
2. **Starting Point**: Copy and adapt examples for your projects
3. **Reference**: Use as templates when setting up new projects
4. **Training**: Use in team workshops and onboarding

## 🔧 Prerequisites

Most examples require:
- Git
- Node.js 14+ (for JavaScript examples)
- Java 11+ (for Java examples)
- Python 3.8+ (for Python examples)
- Docker (for containerized examples)

## 📚 Examples by Technology Stack

### JavaScript/TypeScript
- Jest unit tests
- Mocha + Chai integration tests
- Cypress E2E tests
- GitHub Actions CI/CD

### Java
- JUnit 5 unit tests
- Spring Boot integration tests
- Selenium WebDriver E2E tests
- Jenkins pipelines

### Python
- pytest unit tests
- API integration tests
- Robot Framework E2E tests
- GitLab CI/CD

## 🎯 Learning Path

Recommended order for exploring examples:

1. **Start with Unit Tests** - Foundation of testing pyramid
2. **Move to Integration Tests** - Testing component interactions
3. **Explore E2E Tests** - Full workflow validation
4. **Study CI Pipelines** - Automation and integration
5. **Implement Monitoring** - Production observability

## 📖 Related Documentation

- [Testing Strategy](../docs/04-testing-strategy/README.md)
- [CI/CD Pipeline](../docs/08-cicd-pipeline/README.md)
- [Metrics & Monitoring](../docs/09-metrics-monitoring/README.md)

## 🤝 Contributing

To add new examples:
1. Create a descriptive folder name
2. Include a README with setup instructions
3. Provide working, commented code
4. Add any necessary configuration files
5. Update this main README

## ⚡ Quick Example

Here's a simple unit test to get you started:

```javascript
// sum.js
function sum(a, b) {
  return a + b;
}

// sum.test.js
const sum = require('./sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
```

Run with: `npm test`

---

*These examples are meant to be practical and immediately useful. They represent real-world scenarios and production-ready patterns.*