# Code Quality Examples

This directory contains practical, working examples demonstrating the concepts and best practices described in the main documentation. Each subdirectory includes runnable code with clear explanations.

## 📁 Directory Structure

```
/examples
├── /quickstarts         # 5-minute setup guides for all major tools ⚡ NEW
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
├── /monitoring-configs  # Monitoring, alerting, and observability setups
├── /ai-assisted-qa      # AI-powered testing, RAG systems, code review automation ⭐
└── /agentic-qa          # Autonomous AI agents for QA workflows ⭐
```

## ⚡ Quick Start Guides - NEW!

**Get any tool running in 5 minutes or less!**

Never used Jest? New to Cypress? Want to try k6? Our quick start guides get you from zero to running tests in under 5 minutes:

👉 **[Browse All Quick Start Guides](quickstarts/)** 👈

**Featured Quick Starts:**
- [Jest](quickstarts/jest-quickstart.md) - JavaScript unit testing (3 min)
- [pytest](quickstarts/pytest-quickstart.md) - Python unit testing (3 min)
- [JUnit 5](quickstarts/junit-quickstart.md) - Java unit testing (4 min)
- [Cypress](quickstarts/cypress-quickstart.md) - E2E testing (5 min)
- [Playwright](quickstarts/playwright-quickstart.md) - Modern E2E (5 min)
- [k6](quickstarts/k6-quickstart.md) - Load testing (4 min)
- [GitHub Actions](quickstarts/github-actions-quickstart.md) - CI/CD (5 min)
- [Snyk](quickstarts/snyk-quickstart.md) - Security scanning (3 min)
- [axe-core](quickstarts/axe-quickstart.md) - Accessibility testing (3 min)

Each guide includes:
- Minimal setup (< 1 minute)
- Hello World example
- Common troubleshooting
- Next steps for deep dive

---

## 📚 Full Examples

Each example directory contains:
- `README.md` - Explanation and setup instructions
- Working code examples with comments
- Configuration files
- Sample test data where applicable

## 💡 How to Use These Examples

1. **Quick Start**: Use [quickstart guides](quickstarts/) to get running in 5 minutes
2. **Learning**: Study full examples to understand implementation patterns
3. **Starting Point**: Copy and adapt examples for your projects
4. **Reference**: Use as templates when setting up new projects
5. **Training**: Use in team workshops and onboarding

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

## 🤖 NEW: AI-Assisted Quality Assurance

Explore cutting-edge AI tools for QA automation:

- **[RAG Implementation](ai-assisted-qa/rag-implementation/)** - Build a QA knowledge base assistant
  - Answer questions about testing practices, CI/CD, SDLC
  - FastAPI REST API with Docker deployment
  - Cost: ~$0.024 per query, saves hours of searching

- **[Test Generation](ai-assisted-qa/test-generation/)** - Auto-generate comprehensive test suites
  - Generate unit, integration, and E2E tests from code
  - 146-line pytest suite from 30-line function (see examples!)
  - Cost: ~$0.053 per test suite, saves 30-60 minutes

- **[Code Review Automation](ai-assisted-qa/code-review-automation/)** - AI-powered PR reviews
  - Detect bugs, security vulnerabilities, performance issues
  - GitHub Actions integration included
  - Cost: ~$0.075 per PR, saves 15-30 minutes

**ROI:** ~$25,000/month value for $74/month cost (50-person team)

[→ View Full AI Examples Documentation](ai-assisted-qa/README.md)

## 📖 Related Documentation

- [Testing Strategy](../docs/04-testing-strategy/README.md)
- [CI/CD Pipeline](../docs/08-cicd-pipeline/README.md)
- [Metrics & Monitoring](../docs/09-metrics-monitoring/README.md)
- [AI in Quality Assurance](../docs/15-ai-in-quality-assurance/15-README.md) ⭐ NEW

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