/**
 * Playwright End-to-End Testing Examples
 * Demonstrates cross-browser testing, API mocking, and visual regression testing
 */

const { test, expect, devices } = require('@playwright/test');

// ============================================
// 1. BASIC PAGE INTERACTIONS
// ============================================

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete user registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.click('[data-testid=register-link]');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('[data-testid=first-name]', 'John');
    await page.fill('[data-testid=last-name]', 'Doe');
    await page.fill('[data-testid=email]', 'john.doe@example.com');
    await page.fill('[data-testid=password]', 'SecurePass123!');
    await page.fill('[data-testid=confirm-password]', 'SecurePass123!');

    // Accept terms and conditions
    await page.check('[data-testid=terms-checkbox]');

    // Submit form
    await page.click('[data-testid=register-button]');

    // Verify successful registration
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page.locator('[data-testid=success-message]')).toContainText('Registration successful');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid=welcome-message]')).toContainText('Welcome, John!');
  });

  test('should validate form fields', async ({ page }) => {
    await page.click('[data-testid=register-link]');

    // Test empty form submission
    await page.click('[data-testid=register-button]');
    await expect(page.locator('[data-testid=error-message]')).toContainText('Please fill in all required fields');

    // Test invalid email format
    await page.fill('[data-testid=email]', 'invalid-email');
    await page.click('[data-testid=register-button]');
    await expect(page.locator('[data-testid=email-error]')).toContainText('Please enter a valid email address');

    // Test password mismatch
    await page.fill('[data-testid=email]', 'valid@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.fill('[data-testid=confirm-password]', 'different-password');
    await page.click('[data-testid=register-button]');
    await expect(page.locator('[data-testid=password-error]')).toContainText('Passwords do not match');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Assume user already exists
    await page.click('[data-testid=login-link]');

    await page.fill('[data-testid=email]', 'john.doe@example.com');
    await page.fill('[data-testid=password]', 'SecurePass123!');
    await page.click('[data-testid=login-button]');

    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid=user-menu]')).toBeVisible();

    // Verify authentication token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });
});

// ============================================
// 2. API MOCKING AND INTERCEPTION
// ============================================

test.describe('API Integration with Mocking', () => {
  test('should mock API responses for testing', async ({ page }) => {
    // Mock the user profile API
    await page.route('/api/user/profile', async route => {
      const json = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        avatar: 'https://example.com/avatar.jpg'
      };
      await route.fulfill({ json });
    });

    // Mock the products API with test data
    await page.route('/api/products', async route => {
      const json = {
        products: [
          { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
          { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics' },
          { id: 3, name: 'Keyboard', price: 79.99, category: 'Electronics' }
        ],
        total: 3
      };
      await route.fulfill({ json });
    });

    // Navigate to profile page
    await page.goto('/profile');

    // Verify mocked data is displayed
    await expect(page.locator('[data-testid=user-name]')).toContainText('John Doe');
    await expect(page.locator('[data-testid=user-email]')).toContainText('john@example.com');
    await expect(page.locator('[data-testid=user-role]')).toContainText('admin');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/products', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/products');

    // Verify error handling
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Failed to load products');
    await expect(page.locator('[data-testid=retry-button]')).toBeVisible();
  });

  test('should intercept and modify requests', async ({ page }) => {
    // Intercept and log all API requests
    const apiRequests = [];

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    // Mock search API with delay to test loading states
    await page.route('/api/search*', async route => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');

      const json = {
        query,
        results: [
          { id: 1, title: `Result for "${query}"`, description: 'Mock search result' }
        ]
      };
      await route.fulfill({ json });
    });

    await page.goto('/search');

    // Perform search
    await page.fill('[data-testid=search-input]', 'laptop');
    await page.click('[data-testid=search-button]');

    // Verify loading state
    await expect(page.locator('[data-testid=loading-spinner]')).toBeVisible();

    // Wait for results
    await expect(page.locator('[data-testid=search-results]')).toBeVisible();
    await expect(page.locator('[data-testid=search-results]')).toContainText('Result for "laptop"');

    // Verify API calls were made
    expect(apiRequests.length).toBeGreaterThan(0);
    expect(apiRequests.some(req => req.url.includes('/api/search'))).toBeTruthy();
  });
});

// ============================================
// 3. CROSS-BROWSER TESTING
// ============================================

// Test on different browsers
const browsers = ['chromium', 'firefox', 'webkit'];

browsers.forEach(browserName => {
  test.describe(`Cross-browser testing on ${browserName}`, () => {
    test.use({ browserName });

    test(`should work correctly on ${browserName}`, async ({ page }) => {
      await page.goto('/');

      // Test basic functionality across browsers
      await expect(page.locator('[data-testid=logo]')).toBeVisible();
      await expect(page.locator('[data-testid=main-nav]')).toBeVisible();

      // Test JavaScript functionality
      await page.click('[data-testid=menu-toggle]');
      await expect(page.locator('[data-testid=mobile-menu]')).toBeVisible();

      // Test form interactions
      await page.goto('/contact');
      await page.fill('[data-testid=name]', 'Test User');
      await page.fill('[data-testid=email]', 'test@example.com');
      await page.fill('[data-testid=message]', 'This is a test message');

      const nameValue = await page.inputValue('[data-testid=name]');
      expect(nameValue).toBe('Test User');
    });
  });
});

// ============================================
// 4. MOBILE AND RESPONSIVE TESTING
// ============================================

test.describe('Mobile and Responsive Testing', () => {
  // Test on different device viewports
  const devices_list = [
    devices['iPhone 12'],
    devices['iPad'],
    devices['Desktop Chrome']
  ];

  devices_list.forEach(device => {
    test.describe(`Testing on ${device.name || 'Custom Device'}`, () => {
      test.use({ ...device });

      test(`should display correctly on ${device.name || 'Custom Device'}`, async ({ page }) => {
        await page.goto('/');

        // Check if mobile menu is shown on small screens
        const viewport = page.viewportSize();
        if (viewport.width < 768) {
          await expect(page.locator('[data-testid=mobile-menu-button]')).toBeVisible();
          await expect(page.locator('[data-testid=desktop-nav]')).not.toBeVisible();
        } else {
          await expect(page.locator('[data-testid=desktop-nav]')).toBeVisible();
          await expect(page.locator('[data-testid=mobile-menu-button]')).not.toBeVisible();
        }

        // Test touch interactions on mobile
        if (viewport.width < 768) {
          await page.locator('[data-testid=mobile-menu-button]').tap();
          await expect(page.locator('[data-testid=mobile-menu]')).toBeVisible();
        }
      });

      test(`should handle forms correctly on ${device.name || 'Custom Device'}`, async ({ page }) => {
        await page.goto('/contact');

        // Test form interactions
        await page.fill('[data-testid=name]', 'Mobile User');
        await page.fill('[data-testid=email]', 'mobile@example.com');

        // Test form submission
        await page.click('[data-testid=submit-button]');

        // Should work regardless of device
        await expect(page.locator('[data-testid=success-message]')).toBeVisible();
      });
    });
  });
});

// ============================================
// 5. VISUAL REGRESSION TESTING
// ============================================

test.describe('Visual Regression Testing', () => {
  test('should match homepage screenshot', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should match product grid layout', async ({ page }) => {
    await page.goto('/products');

    // Wait for products to load
    await expect(page.locator('[data-testid=product-grid]')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Screenshot specific element
    await expect(page.locator('[data-testid=product-grid]')).toHaveScreenshot('product-grid.png');
  });

  test('should match modal dialog appearance', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.click('[data-testid=open-modal-button]');
    await expect(page.locator('[data-testid=modal]')).toBeVisible();

    // Screenshot modal
    await expect(page.locator('[data-testid=modal]')).toHaveScreenshot('modal-dialog.png');
  });

  test('should detect visual changes in buttons', async ({ page }) => {
    await page.goto('/components');

    // Screenshot all button states
    await expect(page.locator('[data-testid=button-primary]')).toHaveScreenshot('button-primary.png');
    await expect(page.locator('[data-testid=button-secondary]')).toHaveScreenshot('button-secondary.png');

    // Test hover state
    await page.hover('[data-testid=button-primary]');
    await expect(page.locator('[data-testid=button-primary]')).toHaveScreenshot('button-primary-hover.png');
  });
});

// ============================================
// 6. PERFORMANCE TESTING
// ============================================

test.describe('Performance Testing', () => {
  test('should load pages within acceptable time', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Assert load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check Core Web Vitals using browser API
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};

          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              vitals.loadTime = entry.loadEventEnd - entry.loadEventStart;
            }
          });

          resolve(vitals);
        }).observe({ entryTypes: ['navigation'] });
      });
    });

    console.log('Performance vitals:', vitals);
  });

  test('should handle concurrent users simulation', async ({ browser }) => {
    // Simulate multiple users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    // All users navigate simultaneously
    await Promise.all(
      pages.map(page => page.goto('/products'))
    );

    // All users perform search simultaneously
    await Promise.all(
      pages.map((page, index) =>
        page.fill('[data-testid=search-input]', `search${index}`)
      )
    );

    await Promise.all(
      pages.map(page => page.click('[data-testid=search-button]'))
    );

    // Verify all searches completed
    await Promise.all(
      pages.map(page =>
        expect(page.locator('[data-testid=search-results]')).toBeVisible()
      )
    );

    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });
});

// ============================================
// 7. ACCESSIBILITY TESTING
// ============================================

test.describe('Accessibility Testing', () => {
  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid=logo-link]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid=nav-products]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid=nav-about]')).toBeFocused();

    // Test Enter key activation
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*about/);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    // Check main navigation
    const nav = page.locator('[data-testid=main-nav]');
    await expect(nav).toHaveAttribute('role', 'navigation');
    await expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    // Check search input
    const searchInput = page.locator('[data-testid=search-input]');
    await expect(searchInput).toHaveAttribute('aria-label', 'Search products');

    // Check buttons
    const searchButton = page.locator('[data-testid=search-button]');
    await expect(searchButton).toHaveAttribute('aria-label', 'Search');
  });

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto('/');

    // Simulate screen reader by checking for proper semantic structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);

    // Check for skip links
    await expect(page.locator('[data-testid=skip-to-content]')).toBeVisible();

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
  });
});

// ============================================
// 8. FILE UPLOAD AND DOWNLOAD TESTING
// ============================================

test.describe('File Operations', () => {
  test('should handle file uploads', async ({ page }) => {
    await page.goto('/upload');

    // Create a test file
    const fileContent = 'This is a test file content';
    const fileName = 'test-file.txt';

    // Upload file
    const fileInput = page.locator('[data-testid=file-input]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });

    await page.click('[data-testid=upload-button]');

    // Verify upload success
    await expect(page.locator('[data-testid=upload-success]')).toBeVisible();
    await expect(page.locator('[data-testid=uploaded-filename]')).toContainText(fileName);
  });

  test('should handle file downloads', async ({ page }) => {
    await page.goto('/downloads');

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid=download-button]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toBe('report.pdf');

    // Save download for verification
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

// ============================================
// 9. GEOLOCATION AND PERMISSIONS
// ============================================

test.describe('Browser Features', () => {
  test('should handle geolocation', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);

    // Set geolocation
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });

    await page.goto('/location');

    await page.click('[data-testid=get-location-button]');

    // Verify location was retrieved
    await expect(page.locator('[data-testid=location-display]')).toContainText('San Francisco');
  });

  test('should handle notifications', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);

    await page.goto('/notifications');

    // Mock notification API
    await page.addInitScript(() => {
      window.notificationSent = false;
      window.Notification = class {
        constructor(title, options) {
          window.notificationSent = true;
          window.notificationTitle = title;
          window.notificationOptions = options;
        }
      };
      window.Notification.permission = 'granted';
    });

    await page.click('[data-testid=send-notification-button]');

    // Verify notification was sent
    const notificationSent = await page.evaluate(() => window.notificationSent);
    expect(notificationSent).toBe(true);
  });
});

// ============================================
// 10. DATA-DRIVEN TESTING
// ============================================

const testUsers = [
  { name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { name: 'Bob Johnson', email: 'bob@example.com', role: 'moderator' }
];

testUsers.forEach(user => {
  test(`should handle user ${user.name} with role ${user.role}`, async ({ page }) => {
    // Mock user login
    await page.goto('/login');
    await page.fill('[data-testid=email]', user.email);
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    // Verify role-specific access
    await page.goto('/dashboard');

    if (user.role === 'admin') {
      await expect(page.locator('[data-testid=admin-panel]')).toBeVisible();
    } else {
      await expect(page.locator('[data-testid=admin-panel]')).not.toBeVisible();
    }

    await expect(page.locator('[data-testid=user-name]')).toContainText(user.name);
  });
});

// ============================================
// GLOBAL SETUP AND UTILITIES
// ============================================

// Global setup function (would go in playwright.config.js)
/*
module.exports = {
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
};
*/

// Custom test fixtures for reusable functionality
const { test: base } = require('@playwright/test');

const test_with_auth = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('**/dashboard');

    await use(page);
  }
});

// Example using the authenticated fixture
test_with_auth('should access protected route', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/admin');
  await expect(authenticatedPage.locator('[data-testid=admin-content]')).toBeVisible();
});

// ============================================
// CUSTOM COMMANDS AND HELPERS
// ============================================

// Helper function for waiting for API calls
async function waitForAPICall(page, urlPattern) {
  return page.waitForResponse(response =>
    response.url().includes(urlPattern) && response.status() === 200
  );
}

// Helper function for taking element screenshots
async function takeElementScreenshot(page, selector, filename) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await element.screenshot({ path: filename });
}

// Helper function for form filling
async function fillForm(page, formData) {
  for (const [field, value] of Object.entries(formData)) {
    await page.fill(`[data-testid=${field}]`, value);
  }
}

// Usage example:
test('should use helper functions', async ({ page }) => {
  await page.goto('/contact');

  // Use form helper
  await fillForm(page, {
    'name': 'John Doe',
    'email': 'john@example.com',
    'message': 'Test message'
  });

  // Wait for API call
  const responsePromise = waitForAPICall(page, '/api/contact');
  await page.click('[data-testid=submit-button]');
  await responsePromise;

  // Take screenshot
  await takeElementScreenshot(page, '[data-testid=success-message]', 'success.png');
});