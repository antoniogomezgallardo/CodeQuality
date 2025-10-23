# End-to-End (E2E) Testing

## Purpose

Comprehensive guide to end-to-end testing—validating complete user workflows from start to finish in a production-like environment to ensure the entire system works correctly.

## Overview

E2E testing:

- Tests complete user journeys
- Validates real-world scenarios
- Uses production-like environment
- Tests all integrated systems
- Provides highest confidence

## What is E2E Testing?

### Definition

E2E testing validates that the complete application flow works as expected from the user's perspective, testing all integrated components including UI, APIs, databases, and external services.

### Characteristics

```
E2E Tests:

Scope
├── Complete user workflows
├── All system components
├── External integrations
└── Real user scenarios

Environment
├── Production-like setup
├── Real browsers
├── Actual databases
└── Live integrations

Speed
├── Slowest tests
├── Minutes per test
├── Run less frequently
└── Highest confidence
```

### Testing Pyramid Position

```
         ╱╲
        ╱E2E╲        ← E2E Tests
       ╱────╲          5% of tests
      ╱      ╲         Highest confidence
     ╱ Integ  ╲        Slowest execution
    ╱  Tests  ╲
   ╱────────────╲
  ╱  Unit Tests ╲
 ╱              ╲
└──────────────────┘
```

## E2E Testing Frameworks

### Playwright

```javascript
// tests/e2e/checkout.spec.js
import { test, expect } from '@playwright/test';

test.describe('E-Commerce Checkout Flow', () => {
  test('should complete purchase successfully', async ({ page }) => {
    // 1. Navigate to site
    await page.goto('https://shop.example.com');

    // 2. Search for product
    await page.fill('[data-testid="search-input"]', 'wireless mouse');
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('h1')).toContainText('Search Results');

    // 3. Select product
    await page.click('text=Logitech MX Master 3');
    await expect(page.locator('h1')).toContainText('Logitech MX Master 3');

    // 4. Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('.cart-count')).toHaveText('1');

    // 5. Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // 6. Proceed to checkout
    await page.click('text=Proceed to Checkout');

    // 7. Fill shipping information
    await page.fill('#email', 'test@example.com');
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    await page.fill('#address', '123 Main St');
    await page.fill('#city', 'New York');
    await page.selectOption('#state', 'NY');
    await page.fill('#zipCode', '10001');
    await page.click('text=Continue to Payment');

    // 8. Enter payment information
    await page.fill('#cardNumber', '4242424242424242');
    await page.fill('#cardExpiry', '12/25');
    await page.fill('#cardCvc', '123');
    await page.fill('#cardName', 'John Doe');

    // 9. Place order
    await page.click('text=Place Order');

    // 10. Verify confirmation
    await expect(page.locator('.order-confirmation')).toBeVisible();
    await expect(page.locator('.order-number')).toContainText('Order #');

    // 11. Verify email sent (check database or email service)
    // This would typically be verified through API or database check
  });

  test('should handle payment failure', async ({ page }) => {
    await page.goto('https://shop.example.com');

    // ... navigate through checkout ...

    // Use declined card number
    await page.fill('#cardNumber', '4000000000000002');
    await page.fill('#cardExpiry', '12/25');
    await page.fill('#cardCvc', '123');
    await page.click('text=Place Order');

    // Verify error message
    await expect(page.locator('.error-message')).toContainText('Your card was declined');

    // Verify order was not created
    await page.goto('https://shop.example.com/orders');
    await expect(page.locator('.no-orders')).toBeVisible();
  });
});
```

### Cypress

```javascript
// cypress/e2e/checkout.cy.js
describe('E-Commerce Checkout Flow', () => {
  beforeEach(() => {
    cy.visit('https://shop.example.com');
  });

  it('should complete purchase successfully', () => {
    // Search for product
    cy.get('[data-testid="search-input"]').type('wireless mouse');
    cy.get('[data-testid="search-button"]').click();
    cy.contains('h1', 'Search Results').should('be.visible');

    // Select product
    cy.contains('Logitech MX Master 3').click();
    cy.contains('h1', 'Logitech MX Master 3').should('be.visible');

    // Add to cart
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('.cart-count').should('have.text', '1');

    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('.cart-item').should('have.length', 1);

    // Checkout
    cy.contains('Proceed to Checkout').click();

    // Fill shipping info
    cy.get('#email').type('test@example.com');
    cy.get('#firstName').type('John');
    cy.get('#lastName').type('Doe');
    cy.get('#address').type('123 Main St');
    cy.get('#city').type('New York');
    cy.get('#state').select('NY');
    cy.get('#zipCode').type('10001');
    cy.contains('Continue to Payment').click();

    // Payment info
    cy.get('#cardNumber').type('4242424242424242');
    cy.get('#cardExpiry').type('12/25');
    cy.get('#cardCvc').type('123');
    cy.get('#cardName').type('John Doe');

    // Place order
    cy.contains('Place Order').click();

    // Verify
    cy.get('.order-confirmation').should('be.visible');
    cy.get('.order-number').should('contain', 'Order #');
  });

  it('should validate required fields', () => {
    // Add product to cart
    cy.get('[data-testid="search-input"]').type('wireless mouse');
    cy.get('[data-testid="search-button"]').click();
    cy.contains('Logitech MX Master 3').click();
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="cart-icon"]').click();
    cy.contains('Proceed to Checkout').click();

    // Try to submit without filling fields
    cy.contains('Continue to Payment').click();

    // Verify validation messages
    cy.get('#email-error').should('contain', 'Email is required');
    cy.get('#firstName-error').should('contain', 'First name is required');
    cy.get('#address-error').should('contain', 'Address is required');
  });
});
```

### Selenium WebDriver

```javascript
// selenium/tests/checkout.test.js
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

describe('E-Commerce Checkout', function () {
  this.timeout(30000);
  let driver;

  beforeEach(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('should complete purchase', async () => {
    // Navigate
    await driver.get('https://shop.example.com');

    // Search
    const searchInput = await driver.findElement(By.css('[data-testid="search-input"]'));
    await searchInput.sendKeys('wireless mouse');
    await driver.findElement(By.css('[data-testid="search-button"]')).click();

    // Wait for results
    await driver.wait(until.elementLocated(By.css('.search-results')), 5000);

    // Select product
    await driver.findElement(By.linkText('Logitech MX Master 3')).click();

    // Add to cart
    await driver.wait(until.elementLocated(By.css('[data-testid="add-to-cart"]')), 5000);
    await driver.findElement(By.css('[data-testid="add-to-cart"]')).click();

    // Go to cart
    await driver.findElement(By.css('[data-testid="cart-icon"]')).click();

    // Checkout
    await driver.findElement(By.linkText('Proceed to Checkout')).click();

    // Fill form
    await driver.findElement(By.id('email')).sendKeys('test@example.com');
    await driver.findElement(By.id('firstName')).sendKeys('John');
    await driver.findElement(By.id('lastName')).sendKeys('Doe');
    await driver.findElement(By.id('address')).sendKeys('123 Main St');
    await driver.findElement(By.id('city')).sendKeys('New York');
    await driver.findElement(By.id('zipCode')).sendKeys('10001');

    // Continue
    await driver.findElement(By.linkText('Continue to Payment')).click();

    // Payment
    await driver.findElement(By.id('cardNumber')).sendKeys('4242424242424242');
    await driver.findElement(By.id('cardExpiry')).sendKeys('12/25');
    await driver.findElement(By.id('cardCvc')).sendKeys('123');

    // Place order
    await driver.findElement(By.linkText('Place Order')).click();

    // Verify
    await driver.wait(until.elementLocated(By.css('.order-confirmation')), 10000);
    const confirmationText = await driver.findElement(By.css('.order-number')).getText();
    assert(confirmationText.includes('Order #'));
  });
});
```

## Page Object Model (POM)

### Page Objects

```javascript
// pages/HomePage.js
export class HomePage {
  constructor(page) {
    this.page = page;
    this.searchInput = '[data-testid="search-input"]';
    this.searchButton = '[data-testid="search-button"]';
  }

  async navigate() {
    await this.page.goto('https://shop.example.com');
  }

  async search(query) {
    await this.page.fill(this.searchInput, query);
    await this.page.click(this.searchButton);
  }
}

// pages/ProductPage.js
export class ProductPage {
  constructor(page) {
    this.page = page;
    this.addToCartButton = '[data-testid="add-to-cart"]';
    this.productTitle = 'h1';
    this.cartIcon = '[data-testid="cart-icon"]';
  }

  async addToCart() {
    await this.page.click(this.addToCartButton);
  }

  async getProductTitle() {
    return await this.page.locator(this.productTitle).textContent();
  }

  async goToCart() {
    await this.page.click(this.cartIcon);
  }
}

// pages/CheckoutPage.js
export class CheckoutPage {
  constructor(page) {
    this.page = page;
  }

  async fillShippingInfo(info) {
    await this.page.fill('#email', info.email);
    await this.page.fill('#firstName', info.firstName);
    await this.page.fill('#lastName', info.lastName);
    await this.page.fill('#address', info.address);
    await this.page.fill('#city', info.city);
    await this.page.selectOption('#state', info.state);
    await this.page.fill('#zipCode', info.zipCode);
  }

  async fillPaymentInfo(payment) {
    await this.page.fill('#cardNumber', payment.cardNumber);
    await this.page.fill('#cardExpiry', payment.expiry);
    await this.page.fill('#cardCvc', payment.cvc);
    await this.page.fill('#cardName', payment.name);
  }

  async continueToPayment() {
    await this.page.click('text=Continue to Payment');
  }

  async placeOrder() {
    await this.page.click('text=Place Order');
  }
}

// Using Page Objects in tests
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test('checkout with page objects', async ({ page }) => {
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.navigate();
  await homePage.search('wireless mouse');

  await page.click('text=Logitech MX Master 3');
  await productPage.addToCart();
  await productPage.goToCart();

  await page.click('text=Proceed to Checkout');

  await checkoutPage.fillShippingInfo({
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  });

  await checkoutPage.continueToPayment();

  await checkoutPage.fillPaymentInfo({
    cardNumber: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    name: 'John Doe',
  });

  await checkoutPage.placeOrder();

  await expect(page.locator('.order-confirmation')).toBeVisible();
});
```

## Test Data Management

### Test Data Factory

```javascript
// fixtures/testData.js
export const TestData = {
  users: {
    valid: {
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'John',
      lastName: 'Doe',
    },
    admin: {
      email: 'admin@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
    },
  },

  addresses: {
    shipping: {
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    billing: {
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
    },
  },

  payments: {
    validCard: {
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvc: '123',
      name: 'John Doe',
    },
    declinedCard: {
      cardNumber: '4000000000000002',
      expiry: '12/25',
      cvc: '123',
      name: 'John Doe',
    },
  },
};
```

### Database Seeding

```javascript
// helpers/databaseHelper.js
export class DatabaseHelper {
  async seedTestData() {
    await this.clearDatabase();
    await this.createProducts();
    await this.createUsers();
  }

  async clearDatabase() {
    await db.query('TRUNCATE TABLE orders, users, products CASCADE');
  }

  async createProducts() {
    const products = [
      { name: 'Logitech MX Master 3', price: 99.99, stock: 50 },
      { name: 'Apple Magic Mouse', price: 79.99, stock: 30 },
      { name: 'Microsoft Surface Mouse', price: 49.99, stock: 100 },
    ];

    for (const product of products) {
      await db.query('INSERT INTO products (name, price, stock) VALUES ($1, $2, $3)', [
        product.name,
        product.price,
        product.stock,
      ]);
    }
  }

  async createUsers() {
    // Create test users
  }
}

// In test setup
import { DatabaseHelper } from './helpers/databaseHelper';

test.beforeEach(async () => {
  const dbHelper = new DatabaseHelper();
  await dbHelper.seedTestData();
});
```

## Cross-Browser Testing

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

## Visual Testing

```javascript
// Visual regression testing
import { test, expect } from '@playwright/test';

test('visual regression - home page', async ({ page }) => {
  await page.goto('https://shop.example.com');

  // Take screenshot
  await expect(page).toHaveScreenshot('home-page.png');
});

test('visual regression - product page', async ({ page }) => {
  await page.goto('https://shop.example.com/products/1');

  // Screenshot specific element
  const productCard = page.locator('.product-card');
  await expect(productCard).toHaveScreenshot('product-card.png');
});
```

## Best Practices

### 1. Keep Tests Independent

```javascript
// ✅ Each test is self-contained
test('test 1', async ({ page }) => {
  await page.goto('/');
  await loginAs('user1');
  // Test logic
});

test('test 2', async ({ page }) => {
  await page.goto('/');
  await loginAs('user2');
  // Test logic
});

// ❌ Tests depend on each other
test('test 1', async ({ page }) => {
  await page.goto('/');
  await loginAs('user1');
  // Leaves user logged in
});

test('test 2', async ({ page }) => {
  // Assumes user from test 1 is logged in
  await page.goto('/profile');
});
```

### 2. Use Explicit Waits

```javascript
// ✅ Wait for specific condition
await page.waitForSelector('.product-list');
await page.click('.add-to-cart');

// ✅ Wait for navigation
await Promise.all([page.waitForNavigation(), page.click('.checkout-button')]);

// ❌ Arbitrary sleeps
await page.click('.add-to-cart');
await page.waitForTimeout(3000); // Flaky!
```

### 3. Handle Flakiness

```javascript
// Retry failed tests
test.describe.configure({ retries: 2 });

// Use proper timeouts
test('test with timeout', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds

  await page.goto('/');
  // Long-running test
});

// Wait for stable state
await page.waitForLoadState('networkidle');
await page.waitForSelector('.content', { state: 'visible' });
```

### 4. Run Tests in Parallel

```javascript
// playwright.config.js
export default defineConfig({
  workers: 4, // Run 4 tests in parallel
  fullyParallel: true,
});
```

## Common Pitfalls

```javascript
// ❌ Testing implementation details
await page.click('#button-id-12345');

// ✅ Test user-visible elements
await page.click('text=Add to Cart');
await page.click('[aria-label="Add to Cart"]');

// ❌ Hard-coded waits
await page.waitForTimeout(5000);

// ✅ Wait for specific conditions
await page.waitForSelector('.loaded');
await page.waitForResponse(res => res.url().includes('/api/products'));

// ❌ Not cleaning up test data
test('create order', async () => {
  // Creates order but never cleans up
});

// ✅ Clean up after tests
test.afterEach(async () => {
  await cleanupTestData();
});
```

## Checklist

### E2E Test Quality Checklist

**Test Design:**

- [ ] Tests real user workflows
- [ ] Independent tests
- [ ] Proper waits (no arbitrary sleeps)
- [ ] Clear test names
- [ ] Page Object Model used

**Coverage:**

- [ ] Happy paths tested
- [ ] Error scenarios covered
- [ ] Edge cases included
- [ ] Cross-browser tested
- [ ] Mobile tested

**Maintenance:**

- [ ] Tests are reliable
- [ ] Minimal flakiness
- [ ] Easy to debug
- [ ] Test data managed
- [ ] Regular cleanup

**Performance:**

- [ ] Run in parallel
- [ ] Reasonable execution time
- [ ] Proper CI/CD integration

## References

### Documentation

- [Playwright](https://playwright.dev/)
- [Cypress](https://www.cypress.io/)
- [Selenium WebDriver](https://www.selenium.dev/)
- [WebdriverIO](https://webdriver.io/)

### Tools

- **Playwright**: Modern, fast, reliable
- **Cypress**: Developer-friendly, great DX
- **Selenium**: Industry standard, multi-language
- **TestCafe**: No WebDriver, easy setup

## Related Topics

- [Component Testing](component-testing.md)
- [System Testing](system-testing.md)
- [Visual Testing](visual-testing.md)
- [CI/CD Pipeline](../08-cicd-pipeline/README.md)

---

_Part of: [Test Levels](README.md)_
