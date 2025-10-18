# Playwright Quick Start

**Time:** 5 minutes
**Prerequisites:** Node.js 18+
**What You'll Learn:** Set up Playwright and write your first modern E2E test

## 1. Install (1 minute)

```bash
# Create new project
mkdir my-playwright-project && cd my-playwright-project
npm init -y

# Install Playwright
npm init playwright@latest

# This will prompt you:
# - Choose language: TypeScript or JavaScript (choose JavaScript)
# - Where to put tests: tests (default)
# - Add GitHub Actions workflow: No (for now)
# - Install browsers: Yes

# Or install manually
npm install --save-dev @playwright/test
npx playwright install
```

This creates:
```
tests/
playwright.config.js
package.json
```

## 2. Configure (1 minute)

Create or update `playwright.config.js`:

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'https://playwright.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

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
  ],
});
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "test:report": "playwright show-report"
  }
}
```

## 3. Hello World (2 minutes)

Create `tests/first-test.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My First Playwright Test', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('should navigate to Getting Started', async ({ page }) => {
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page).toHaveURL(/.*intro/);
  });

  test('should search for text', async ({ page }) => {
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByPlaceholder('Search docs').fill('installation');
    await page.getByPlaceholder('Search docs').press('Enter');

    await expect(page.getByText('Installation')).toBeVisible();
  });

  test('should handle multiple elements', async ({ page }) => {
    const links = page.getByRole('link');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);

    // Interact with first link
    await links.first().click();
  });

  test('should wait for element', async ({ page }) => {
    // Playwright auto-waits, but you can be explicit
    await page.waitForSelector('nav', { timeout: 5000 });

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
```

## 4. Run Tests (1 minute)

```bash
# Run all tests
npm test

# Run in headed mode (see browser)
npm run test:headed

# Run in debug mode
npm run test:debug

# Run in UI mode (interactive)
npm run test:ui

# Run specific test file
npx playwright test tests/first-test.spec.js

# Run tests on specific browser
npx playwright test --project=chromium

# Run tests in parallel
npx playwright test --workers=4

# View HTML report
npm run test:report
```

**Expected Output:**
```
Running 5 tests using 3 workers

  ✓  1 [chromium] › first-test.spec.js:5:3 › should have correct title (1.2s)
  ✓  2 [firefox] › first-test.spec.js:5:3 › should have correct title (1.5s)
  ✓  3 [webkit] › first-test.spec.js:5:3 › should have correct title (1.8s)
  ✓  4 [chromium] › first-test.spec.js:9:3 › should navigate (982ms)
  ✓  5 [chromium] › first-test.spec.js:14:3 › should search (1.1s)

  5 passed (6.2s)
```

## 5. Next Steps

### Page Object Model

Create `tests/pages/LoginPage.js`:

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

module.exports = { LoginPage };
```

Use Page Object:

```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Fixtures for Reusable Setup

Create `tests/fixtures.js`:

```javascript
const { test as base } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

// Extend base test with custom fixtures
const test = base.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page }, use) => {
    // Setup: Login before test
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/.*dashboard/);

    await use(page);

    // Teardown: Logout after test
    await page.getByRole('button', { name: 'Logout' }).click();
  },
});

module.exports = { test };
```

Use fixtures:

```javascript
const { test, expect } = require('./fixtures');

test('should access dashboard', async ({ authenticatedPage }) => {
  // Already logged in via fixture
  await expect(authenticatedPage.getByRole('heading', { name: 'Dashboard' }))
    .toBeVisible();
});
```

### API Testing

```javascript
const { test, expect } = require('@playwright/test');

test.describe('API Tests', () => {
  test('should fetch users', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/users');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(users.length).toBeGreaterThan(0);
  });

  test('should create user', async ({ request }) => {
    const response = await request.post('https://jsonplaceholder.typicode.com/users', {
      data: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    });

    expect(response.status()).toBe(201);

    const user = await response.json();
    expect(user.name).toBe('John Doe');
  });
});
```

### Mock API Responses

```javascript
test('should mock API response', async ({ page }) => {
  // Intercept and mock
  await page.route('**/api/users', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ])
    });
  });

  await page.goto('/users');
  await expect(page.getByText('John Doe')).toBeVisible();
});

test('should wait for API call', async ({ page }) => {
  // Wait for specific request
  const responsePromise = page.waitForResponse('**/api/data');

  await page.getByRole('button', { name: 'Load Data' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(200);
});
```

### Mobile Emulation

```javascript
const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 13'],
});

test('should work on mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
});

// Or test multiple devices
for (const deviceName of ['iPhone 13', 'Pixel 5', 'iPad Pro']) {
  test.describe(deviceName, () => {
    test.use({ ...devices[deviceName] });

    test('should display correctly', async ({ page }) => {
      await page.goto('/');
      await page.screenshot({ path: `screenshots/${deviceName}.png` });
    });
  });
}
```

### Visual Regression Testing

```javascript
const { test, expect } = require('@playwright/test');

test('should match screenshot', async ({ page }) => {
  await page.goto('/');

  // Take screenshot and compare
  await expect(page).toHaveScreenshot('homepage.png');
});

test('should match element screenshot', async ({ page }) => {
  await page.goto('/');

  const header = page.getByRole('banner');
  await expect(header).toHaveScreenshot('header.png');
});

// Update snapshots with:
// npx playwright test --update-snapshots
```

### Test Annotations

```javascript
test('slow test', async ({ page }) => {
  test.slow(); // 3x timeout
  await page.goto('/slow-page');
});

test('skip on mobile', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Feature not available on mobile');
  await page.goto('/desktop-only');
});

test.fixme('known bug', async ({ page }) => {
  // Test will be skipped
  await page.goto('/buggy-page');
});

test('conditional test', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Not supported on Safari');
  await page.goto('/chrome-feature');
});
```

## 6. Troubleshooting

### Issue: Browsers not installed
```bash
# Install all browsers
npx playwright install

# Install specific browser
npx playwright install chromium

# Install with dependencies
npx playwright install --with-deps
```

### Issue: Test timeout
```javascript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  await page.goto('/slow-page');
});

// Or in config
module.exports = defineConfig({
  timeout: 30000, // 30 seconds per test
});
```

### Issue: Element not found
```javascript
// Playwright auto-waits, but you can be explicit
await page.waitForSelector('[data-testid="element"]');

// Or use soft assertions (doesn't stop test)
await expect.soft(page.getByText('optional')).toBeVisible();
```

### Issue: Flaky tests
```javascript
// Add retries in config
module.exports = defineConfig({
  retries: 2, // Retry failed tests 2 times
});

// Or per test
test('flaky test', async ({ page }) => {
  test.retries(2);
  await page.goto('/unreliable');
});
```

### Issue: Debugging
```bash
# Run in debug mode
npx playwright test --debug

# Run in UI mode (best for debugging)
npx playwright test --ui

# Add breakpoint in test
await page.pause();

# Enable verbose logging
DEBUG=pw:api npx playwright test
```

### Issue: Screenshots not saving
```javascript
// Ensure directory exists and check config
module.exports = defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});

// Or take screenshot manually
await page.screenshot({ path: 'screenshot.png' });
```

## 🎓 Common Locators Reference

```javascript
// By role (preferred)
page.getByRole('button', { name: 'Submit' });
page.getByRole('link', { name: 'About' });
page.getByRole('textbox', { name: 'Email' });

// By label
page.getByLabel('Email');
page.getByLabel('Password');

// By placeholder
page.getByPlaceholder('Enter email');

// By text
page.getByText('Welcome');
page.getByText(/welcome/i);

// By test ID
page.getByTestId('submit-button');

// By title
page.getByTitle('Close');

// CSS selector
page.locator('.classname');
page.locator('#id');
page.locator('[data-test="value"]');

// XPath
page.locator('xpath=//button');

// Filtering
page.getByRole('button').filter({ hasText: 'Submit' });
page.locator('li').filter({ has: page.getByText('Item') });

// Chaining
page.locator('article').locator('button');
page.getByRole('navigation').getByRole('link');

// Multiple elements
page.locator('li').count();
page.locator('li').first();
page.locator('li').last();
page.locator('li').nth(2);
page.locator('li').all();
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Full E2E Examples](../e2e-tests/playwright-example.js)

## ⏭️ What's Next?

1. **Use Page Objects** - Better test organization
2. **Add fixtures** - Reusable test setup
3. **Test APIs** - Built-in API testing
4. **Visual regression** - Screenshot comparison
5. **CI Integration** - Run in GitHub Actions

---

**Time to first test:** ~5 minutes ✅
**Ready for production?** Add Page Objects and visual regression!
