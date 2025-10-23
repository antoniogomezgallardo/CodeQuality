/**
 * Percy Visual Testing Examples
 *
 * This file demonstrates production-ready visual testing patterns using Percy.io.
 * Percy provides automated visual testing with cross-browser support, intelligent
 * diffing, and seamless CI/CD integration.
 *
 * Prerequisites:
 * - Percy account and PERCY_TOKEN environment variable set
 * - @percy/cli and @percy/playwright packages installed
 * - Playwright installed and configured
 *
 * Run with: npx percy exec -- npx playwright test percy-visual-tests.spec.js
 *
 * @see https://docs.percy.io/docs/playwright
 */

const { test, expect } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');
const {
  waitForFontsLoaded,
  hideDynamicContent,
  waitForImagesLoaded,
  stabilizeAnimations
} = require('./visual-helpers');

/**
 * Configuration for different viewport sizes
 * Percy will automatically capture snapshots at these widths
 */
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  wide: { width: 2560, height: 1440 }
};

/**
 * Percy configuration options that can be passed to percySnapshot
 */
const PERCY_OPTIONS = {
  // Standard widths to test responsive design
  widths: [375, 768, 1280, 1920],

  // Minimum height for the screenshot
  minHeight: 1024,

  // Enable JavaScript for dynamic content
  enableJavaScript: true,

  // Percy snapshot options
  percyCSS: `
    /* Hide elements that cause visual noise */
    .advertisement,
    .cookie-banner,
    .chat-widget {
      display: none !important;
    }
  `
};

test.describe('Percy Visual Testing - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('https://example.com');

    // Wait for critical resources to load
    await waitForFontsLoaded(page);
    await waitForImagesLoaded(page);
    await stabilizeAnimations(page);
  });

  test('should capture homepage in default state', async ({ page }) => {
    // Take a Percy snapshot with default configuration
    await percySnapshot(page, 'Homepage - Default State', {
      widths: PERCY_OPTIONS.widths
    });
  });

  test('should capture homepage with navigation expanded', async ({ page }) => {
    // Interact with the page before capturing
    await page.click('[data-testid="menu-toggle"]');
    await page.waitForSelector('[data-testid="navigation-menu"]', { state: 'visible' });

    // Take snapshot of the expanded state
    await percySnapshot(page, 'Homepage - Navigation Expanded', {
      widths: PERCY_OPTIONS.widths,
      minHeight: 1200 // Ensure full menu is captured
    });
  });

  test('should capture homepage with dark mode', async ({ page }) => {
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Wait for theme transition

    // Verify dark mode is active
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(isDarkMode).toBe(true);

    // Capture dark mode state
    await percySnapshot(page, 'Homepage - Dark Mode', {
      widths: PERCY_OPTIONS.widths
    });
  });
});

test.describe('Percy Visual Testing - Component States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com/components');
    await waitForFontsLoaded(page);
  });

  test('should capture button component in all states', async ({ page }) => {
    // Navigate to button component showcase
    await page.goto('https://example.com/components/buttons');
    await waitForImagesLoaded(page);

    // Default state
    await percySnapshot(page, 'Buttons - Default States', {
      widths: [1280],
      scope: '[data-testid="button-showcase"]' // Only capture specific component
    });

    // Hover state
    await page.hover('[data-testid="primary-button"]');
    await percySnapshot(page, 'Buttons - Hover State', {
      widths: [1280],
      scope: '[data-testid="primary-button"]'
    });

    // Focus state
    await page.focus('[data-testid="primary-button"]');
    await percySnapshot(page, 'Buttons - Focus State', {
      widths: [1280],
      scope: '[data-testid="primary-button"]'
    });

    // Disabled state
    await page.goto('https://example.com/components/buttons?state=disabled');
    await percySnapshot(page, 'Buttons - Disabled State', {
      widths: [1280],
      scope: '[data-testid="button-showcase"]'
    });
  });

  test('should capture form components with validation states', async ({ page }) => {
    await page.goto('https://example.com/components/forms');

    // Empty form (pristine state)
    await percySnapshot(page, 'Form - Pristine State', {
      widths: [768, 1280]
    });

    // Fill form with invalid data
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', '123'); // Too short
    await page.click('[data-testid="submit-button"]');

    // Wait for validation errors to appear
    await page.waitForSelector('[data-testid="validation-error"]', { state: 'visible' });

    // Capture validation error state
    await percySnapshot(page, 'Form - Validation Errors', {
      widths: [768, 1280]
    });

    // Fill form with valid data
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');

    // Capture valid state
    await percySnapshot(page, 'Form - Valid State', {
      widths: [768, 1280]
    });
  });
});

test.describe('Percy Visual Testing - Responsive Design', () => {
  test('should capture responsive navigation across breakpoints', async ({ page }) => {
    await page.goto('https://example.com');

    // Hide dynamic content that may cause flakiness
    await hideDynamicContent(page, [
      '[data-testid="current-time"]',
      '[data-testid="advertisement"]',
      '.cookie-notice'
    ]);

    // Capture at all major breakpoints
    await percySnapshot(page, 'Responsive Navigation - All Breakpoints', {
      widths: [375, 414, 768, 1024, 1280, 1920, 2560],
      minHeight: 1024
    });
  });

  test('should capture product grid layouts', async ({ page }) => {
    await page.goto('https://example.com/products');
    await waitForImagesLoaded(page);

    // Capture how product grid adapts to different screen sizes
    await percySnapshot(page, 'Product Grid - Responsive Layout', {
      widths: [375, 768, 1280, 1920],
      minHeight: 2000 // Ensure we capture multiple rows
    });
  });

  test('should capture modal dialogs on different screens', async ({ page }) => {
    await page.goto('https://example.com');

    // Open modal
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[data-testid="modal"]', { state: 'visible' });

    // Wait for modal animation to complete
    await page.waitForTimeout(300);

    // Capture modal on different screen sizes
    await percySnapshot(page, 'Modal Dialog - Responsive', {
      widths: [375, 768, 1280],
      percyCSS: `
        /* Ensure backdrop is consistent */
        [data-testid="modal-backdrop"] {
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
      `
    });
  });
});

test.describe('Percy Visual Testing - Dynamic Content Handling', () => {
  test('should handle dynamic timestamps', async ({ page }) => {
    await page.goto('https://example.com/dashboard');

    // Hide or mock dynamic timestamps
    await page.evaluate(() => {
      // Replace all timestamps with fixed value
      document.querySelectorAll('[data-timestamp]').forEach(el => {
        el.textContent = '2025-10-08 12:00:00';
      });
    });

    await percySnapshot(page, 'Dashboard - Fixed Timestamps', {
      widths: [1280, 1920]
    });
  });

  test('should handle lazy-loaded images', async ({ page }) => {
    await page.goto('https://example.com/gallery');

    // Scroll to trigger lazy loading
    await page.evaluate(async () => {
      const scrollHeight = document.documentElement.scrollHeight;
      window.scrollTo(0, scrollHeight);

      // Wait for images to start loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Scroll back to top
      window.scrollTo(0, 0);
    });

    // Wait for all images to fully load
    await waitForImagesLoaded(page);

    await percySnapshot(page, 'Gallery - All Images Loaded', {
      widths: [1280],
      minHeight: 3000
    });
  });

  test('should handle animations and transitions', async ({ page }) => {
    await page.goto('https://example.com/animated-page');

    // Disable animations for consistent screenshots
    await stabilizeAnimations(page);

    await percySnapshot(page, 'Animated Page - Stabilized', {
      widths: [1280]
    });
  });

  test('should handle third-party widgets', async ({ page }) => {
    await page.goto('https://example.com/contact');

    // Hide third-party widgets that may vary
    await hideDynamicContent(page, ['#google-maps-embed', '.chat-widget', '.social-media-feed']);

    await percySnapshot(page, 'Contact Page - Without Third-party Widgets', {
      widths: [768, 1280]
    });
  });
});

test.describe('Percy Visual Testing - Cross-Browser Scenarios', () => {
  test('should capture browser-specific rendering', async ({ page, browserName }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Percy will automatically test across browsers when configured
    await percySnapshot(page, `Homepage - ${browserName}`, {
      widths: [1280]
      // Percy handles cross-browser testing automatically
      // Just ensure consistent state before snapshot
    });
  });

  test('should capture CSS Grid layout differences', async ({ page }) => {
    await page.goto('https://example.com/grid-layout');
    await waitForImagesLoaded(page);

    await percySnapshot(page, 'CSS Grid Layout - Cross Browser', {
      widths: [1280],
      minHeight: 1200
    });
  });
});

test.describe('Percy Visual Testing - User Flows', () => {
  test('should capture checkout flow screens', async ({ page }) => {
    // Step 1: Shopping cart
    await page.goto('https://example.com/cart');
    await waitForImagesLoaded(page);

    await percySnapshot(page, 'Checkout Flow - 1. Shopping Cart', {
      widths: [768, 1280]
    });

    // Step 2: Shipping information
    await page.click('[data-testid="proceed-to-checkout"]');
    await page.waitForURL('**/checkout/shipping');

    await percySnapshot(page, 'Checkout Flow - 2. Shipping Info', {
      widths: [768, 1280]
    });

    // Step 3: Payment
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'Portland');
    await page.click('[data-testid="continue-to-payment"]');
    await page.waitForURL('**/checkout/payment');

    await percySnapshot(page, 'Checkout Flow - 3. Payment', {
      widths: [768, 1280]
    });
  });

  test('should capture user onboarding screens', async ({ page }) => {
    await page.goto('https://example.com/onboarding');

    // Screen 1
    await percySnapshot(page, 'Onboarding - Welcome Screen', {
      widths: [375, 768]
    });

    // Screen 2
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(300); // Wait for transition

    await percySnapshot(page, 'Onboarding - Features Screen', {
      widths: [375, 768]
    });

    // Screen 3
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(300);

    await percySnapshot(page, 'Onboarding - Permissions Screen', {
      widths: [375, 768]
    });
  });
});

test.describe('Percy Visual Testing - Accessibility States', () => {
  test('should capture high contrast mode', async ({ page }) => {
    await page.goto('https://example.com');

    // Enable high contrast mode
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForTimeout(500);

    await percySnapshot(page, 'Homepage - High Contrast Mode', {
      widths: [1280]
    });
  });

  test('should capture focus indicators', async ({ page }) => {
    await page.goto('https://example.com/form');

    // Focus on first input
    await page.focus('[data-testid="first-name"]');

    await percySnapshot(page, 'Form - Focus Indicators Visible', {
      widths: [1280]
    });
  });

  test('should capture skip navigation links', async ({ page }) => {
    await page.goto('https://example.com');

    // Tab to activate skip link
    await page.keyboard.press('Tab');

    await percySnapshot(page, 'Homepage - Skip Navigation Visible', {
      widths: [1280]
    });
  });
});

test.describe('Percy Visual Testing - Error States', () => {
  test('should capture 404 page', async ({ page }) => {
    await page.goto('https://example.com/non-existent-page');

    // Wait for 404 page to load
    await page.waitForSelector('[data-testid="404-page"]', { state: 'visible' });

    await percySnapshot(page, '404 Error Page', {
      widths: [375, 768, 1280]
    });
  });

  test('should capture network error state', async ({ page }) => {
    // Simulate offline mode
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    await page.goto('https://example.com/dashboard');

    // Wait for error message
    await page.waitForSelector('[data-testid="network-error"]', { state: 'visible' });

    await percySnapshot(page, 'Dashboard - Network Error State', {
      widths: [1280]
    });
  });

  test('should capture loading states', async ({ page }) => {
    // Intercept API and delay response
    await page.route('**/api/products', async route => {
      await page.waitForTimeout(2000);
      await route.continue();
    });

    await page.goto('https://example.com/products');

    // Capture loading skeleton/spinner
    await percySnapshot(page, 'Products - Loading State', {
      widths: [1280]
    });
  });

  test('should capture empty states', async ({ page }) => {
    await page.goto('https://example.com/cart?empty=true');

    await percySnapshot(page, 'Shopping Cart - Empty State', {
      widths: [768, 1280]
    });
  });
});

test.describe('Percy Visual Testing - Advanced Techniques', () => {
  test('should use Percy CSS to hide elements', async ({ page }) => {
    await page.goto('https://example.com');

    await percySnapshot(page, 'Homepage - Clean Snapshot', {
      widths: [1280],
      percyCSS: `
        /* Hide dynamic elements */
        [data-testid="live-chat"],
        [data-testid="promotional-banner"],
        .cookie-consent {
          display: none !important;
        }

        /* Fix position of sticky elements */
        .sticky-header {
          position: relative !important;
        }
      `
    });
  });

  test('should capture specific component with scope', async ({ page }) => {
    await page.goto('https://example.com/components');

    // Only capture the specific component, not entire page
    await percySnapshot(page, 'Card Component - Isolated', {
      widths: [400, 768],
      scope: '[data-testid="card-component"]'
    });
  });

  test('should handle scroll-dependent layouts', async ({ page }) => {
    await page.goto('https://example.com/long-page');

    // Scroll to specific section
    await page.locator('[data-testid="features-section"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for scroll animations

    await percySnapshot(page, 'Long Page - Features Section', {
      widths: [1280]
    });
  });

  test('should test with different locales', async ({ page }) => {
    // Test English version
    await page.goto('https://example.com/?lang=en');
    await percySnapshot(page, 'Homepage - English', {
      widths: [1280]
    });

    // Test Spanish version
    await page.goto('https://example.com/?lang=es');
    await percySnapshot(page, 'Homepage - Spanish', {
      widths: [1280]
    });

    // Test with RTL language (Arabic)
    await page.goto('https://example.com/?lang=ar');
    await percySnapshot(page, 'Homepage - Arabic (RTL)', {
      widths: [1280]
    });
  });
});

/**
 * Example of snapshot naming conventions
 *
 * Good naming patterns:
 * - "PageName - State - Viewport"
 * - "ComponentName - Variant - Interaction State"
 * - "FlowName - Step N - Description"
 *
 * Examples:
 * - "Homepage - Logged Out - Desktop"
 * - "Button - Primary - Hover State"
 * - "Checkout - Step 2 - Shipping Form"
 */

/**
 * Environment-specific snapshot handling
 */
test.describe('Percy Visual Testing - Environment Configuration', () => {
  test('should handle staging vs production differences', async ({ page }) => {
    const environment = process.env.TEST_ENV || 'staging';
    const baseUrl =
      environment === 'production' ? 'https://example.com' : 'https://staging.example.com';

    await page.goto(`${baseUrl}/`);
    await waitForFontsLoaded(page);

    // Use environment in snapshot name for different baselines
    await percySnapshot(page, `Homepage - ${environment}`, {
      widths: [1280]
    });
  });
});

/**
 * Performance considerations for visual tests
 */
test.describe('Percy Visual Testing - Performance Optimization', () => {
  test('should batch related snapshots efficiently', async ({ page }) => {
    await page.goto('https://example.com/components');
    await waitForFontsLoaded(page);

    // Take multiple snapshots in a single test for efficiency
    const components = ['button', 'input', 'select', 'checkbox'];

    for (const component of components) {
      await page.click(`[data-testid="nav-${component}"]`);
      await page.waitForSelector(`[data-testid="${component}-showcase"]`, { state: 'visible' });

      await percySnapshot(page, `Component - ${component}`, {
        widths: [1280],
        scope: `[data-testid="${component}-showcase"]`
      });
    }
  });
});
