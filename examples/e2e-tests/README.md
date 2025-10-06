# End-to-End Testing Examples

This directory contains comprehensive E2E testing examples using popular testing frameworks to demonstrate complete user workflow validation.

## 📋 Examples Included

### Cypress Tests
- User registration and login flows
- Shopping cart functionality
- Form validation
- Mobile responsive testing
- Custom commands and utilities

### Playwright Tests
- Cross-browser testing
- API mocking and interception
- Visual regression testing
- Performance testing
- Parallel execution

### Selenium WebDriver Tests
- Page Object Model pattern
- Multi-browser support
- Grid execution
- Screenshot capturing
- Test data management

## 🎯 E2E Testing Best Practices Demonstrated

1. **Page Object Model**: Maintainable page abstractions
2. **Test Data Management**: Reusable test datasets
3. **Wait Strategies**: Reliable element waiting
4. **Error Handling**: Robust failure management
5. **Reporting**: Comprehensive test reports
6. **Parallel Execution**: Faster test execution

## 📚 Quick Start

### Cypress Example

```bash
cd cypress-tests
npm install
npx cypress open          # Interactive mode
npx cypress run           # Headless mode
npx cypress run --browser chrome
```

### Playwright Example

```bash
cd playwright-tests
npm install
npx playwright install    # Install browsers
npx playwright test       # Run all tests
npx playwright test --headed
npx playwright show-report
```

### Selenium Example

```bash
cd selenium-tests
npm install
npm test                  # Run all tests
npm run test:chrome       # Chrome only
npm run test:firefox      # Firefox only
```

## 🔧 Test Environment

Each framework includes:
- Configuration files
- Test data fixtures
- Page object models
- Custom commands/utilities
- Reporting setup

## 📊 Test Reporting

All examples include:
- HTML test reports
- Screenshot capture
- Video recording (where supported)
- Test metrics and timing
- Failure analysis

---

*E2E tests validate complete user workflows from start to finish. These examples show how to write reliable, maintainable tests that catch real user issues.*