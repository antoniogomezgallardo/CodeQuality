/**
 * Playwright Visual Testing Examples
 *
 * This file demonstrates production-ready visual regression testing using
 * Playwright's built-in screenshot comparison capabilities. Playwright provides
 * fast, reliable visual testing without requiring external services.
 *
 * Prerequisites:
 * - Playwright installed and configured
 * - Baseline screenshots generated with --update-snapshots flag
 *
 * Run tests:
 * - Generate baselines: npx playwright test --update-snapshots
 * - Run tests: npx playwright test playwright-visual.spec.js
 * - View report: npx playwright show-report
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

const { test, expect } = require('@playwright/test');
const {
  waitForFontsLoaded,
  hideDynamicContent,
  waitForImagesLoaded,
  stabilizeAnimations,
  scrollToElement
} = require('./visual-helpers');

/**
 * Configuration for visual testing
 */
const VISUAL_CONFIG = {
  // Maximum allowed pixel difference (absolute)
  maxDiffPixels: 100,

  // Maximum allowed difference ratio (0-1, where 1 is 100%)
  maxDiffPixelRatio: 0.01,

  // Threshold for considering pixels as different (0-1)
  threshold: 0.2,

  // Animations: 'disabled' | 'allow'
  animations: 'disabled',

  // CSS media type
  scale: 'css'
};

/**
 * Viewport configurations for responsive testing
 */
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

test.describe('Playwright Visual Testing - Full Page Screenshots', () => {

  test('should capture homepage full page screenshot', async ({ page }) => {
    await page.goto('https://example.com');

    // Wait for page to be fully ready
    await waitForFontsLoaded(page);
    await waitForImagesLoaded(page);
    await stabilizeAnimations(page);

    // Hide dynamic content to avoid false positives
    await hideDynamicContent(page, [
      '[data-testid="timestamp"]',
      '.advertisement',
      '.cookie-notice'
    ]);

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full-page.png', {
      fullPage: true,
      maxDiffPixels: VISUAL_CONFIG.maxDiffPixels,
      animations: VISUAL_CONFIG.animations
    });
  });

  test('should capture about page', async ({ page }) => {
    await page.goto('https://example.com/about');
    await waitForFontsLoaded(page);
    await waitForImagesLoaded(page);

    await expect(page).toHaveScreenshot('about-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture contact page with form', async ({ page }) => {
    await page.goto('https://example.com/contact');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('contact-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Element Screenshots', () => {

  test('should capture navigation header only', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    const header = page.locator('[data-testid="main-header"]');

    // Screenshot specific element
    await expect(header).toHaveScreenshot('navigation-header.png', {
      animations: 'disabled'
    });
  });

  test('should capture footer component', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    const footer = page.locator('[data-testid="main-footer"]');

    await expect(footer).toHaveScreenshot('footer-component.png', {
      animations: 'disabled'
    });
  });

  test('should capture product card component', async ({ page }) => {
    await page.goto('https://example.com/products');
    await waitForImagesLoaded(page);

    // Hide dynamic price that may change
    await hideDynamicContent(page, ['[data-testid="live-price"]']);

    const productCard = page.locator('[data-testid="product-card-1"]');

    await expect(productCard).toHaveScreenshot('product-card.png', {
      animations: 'disabled',
      maxDiffPixels: 50
    });
  });

  test('should capture button component in different states', async ({ page }) => {
    await page.goto('https://example.com/components/buttons');
    await waitForFontsLoaded(page);

    const buttonShowcase = page.locator('[data-testid="button-showcase"]');

    // Default state
    await expect(buttonShowcase).toHaveScreenshot('buttons-default.png', {
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Responsive Layouts', () => {

  test('should capture homepage at mobile viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);
    await waitForImagesLoaded(page);

    await hideDynamicContent(page, [
      '[data-testid="timestamp"]',
      '.advertisement'
    ]);

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture homepage at tablet viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);
    await waitForImagesLoaded(page);

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture homepage at desktop viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);
    await waitForImagesLoaded(page);

    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture responsive grid layout across viewports', async ({ page }) => {
    const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];

    for (const [name, viewport] of Object.entries({ mobile: VIEWPORTS.mobile, tablet: VIEWPORTS.tablet, desktop: VIEWPORTS.desktop })) {
      await page.setViewportSize(viewport);
      await page.goto('https://example.com/products');
      await waitForImagesLoaded(page);

      await expect(page).toHaveScreenshot(`product-grid-${name}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });
});

test.describe('Playwright Visual Testing - Interactive States', () => {

  test('should capture button hover state', async ({ page }) => {
    await page.goto('https://example.com/components/buttons');
    await waitForFontsLoaded(page);

    const button = page.locator('[data-testid="primary-button"]');

    // Hover over button
    await button.hover();

    // Wait for hover transition
    await page.waitForTimeout(300);

    await expect(button).toHaveScreenshot('button-hover-state.png', {
      animations: 'allow' // Allow hover animation
    });
  });

  test('should capture button focus state', async ({ page }) => {
    await page.goto('https://example.com/components/buttons');
    await waitForFontsLoaded(page);

    const button = page.locator('[data-testid="primary-button"]');

    // Focus on button
    await button.focus();

    await expect(button).toHaveScreenshot('button-focus-state.png', {
      animations: 'disabled'
    });
  });

  test('should capture form with validation errors', async ({ page }) => {
    await page.goto('https://example.com/contact');
    await waitForFontsLoaded(page);

    // Submit empty form to trigger validation
    await page.click('[data-testid="submit-button"]');

    // Wait for validation errors to appear
    await page.waitForSelector('[data-testid="validation-error"]', { state: 'visible' });

    const form = page.locator('[data-testid="contact-form"]');

    await expect(form).toHaveScreenshot('form-validation-errors.png', {
      animations: 'disabled'
    });
  });

  test('should capture modal dialog open state', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Open modal
    await page.click('[data-testid="open-modal"]');

    // Wait for modal to be visible
    await page.waitForSelector('[data-testid="modal"]', { state: 'visible' });

    // Wait for modal animation to complete
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('modal-dialog-open.png', {
      animations: 'disabled'
    });
  });

  test('should capture dropdown menu expanded', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Hover to open dropdown
    await page.hover('[data-testid="dropdown-trigger"]');

    // Wait for dropdown to appear
    await page.waitForSelector('[data-testid="dropdown-menu"]', { state: 'visible' });
    await page.waitForTimeout(200);

    const dropdown = page.locator('[data-testid="dropdown-container"]');

    await expect(dropdown).toHaveScreenshot('dropdown-expanded.png', {
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Theme Variations', () => {

  test('should capture light theme', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Ensure light theme is active
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    await expect(page).toHaveScreenshot('homepage-light-theme.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture dark theme', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Enable dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Wait for theme transition
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture high contrast mode', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Emulate high contrast mode
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Scrolling and Lazy Loading', () => {

  test('should capture page after scrolling to specific section', async ({ page }) => {
    await page.goto('https://example.com/long-page');
    await waitForFontsLoaded(page);

    // Scroll to specific section
    const section = page.locator('[data-testid="features-section"]');
    await scrollToElement(page, '[data-testid="features-section"]');

    // Wait for any lazy-loaded content
    await page.waitForTimeout(1000);
    await waitForImagesLoaded(page);

    await expect(section).toHaveScreenshot('features-section.png', {
      animations: 'disabled'
    });
  });

  test('should capture lazy-loaded image gallery', async ({ page }) => {
    await page.goto('https://example.com/gallery');

    // Scroll to trigger lazy loading
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.scrollTo(0, 0);
    });

    // Wait for all images to load
    await waitForImagesLoaded(page);

    await expect(page).toHaveScreenshot('gallery-all-images-loaded.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Error and Empty States', () => {

  test('should capture 404 error page', async ({ page }) => {
    await page.goto('https://example.com/non-existent-page');

    // Wait for 404 page to load
    await page.waitForSelector('[data-testid="404-page"]', { state: 'visible' });

    await expect(page).toHaveScreenshot('404-error-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture empty cart state', async ({ page }) => {
    await page.goto('https://example.com/cart?empty=true');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('cart-empty-state.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture loading skeleton state', async ({ page }) => {
    // Intercept API to delay response
    await page.route('**/api/products', async route => {
      // Don't fulfill immediately to capture loading state
      setTimeout(() => route.continue(), 5000);
    });

    await page.goto('https://example.com/products');

    // Capture loading state quickly before data loads
    await page.waitForSelector('[data-testid="loading-skeleton"]', { state: 'visible' });

    await expect(page).toHaveScreenshot('products-loading-state.png', {
      animations: 'disabled'
    });
  });

  test('should capture network error state', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort('failed'));

    await page.goto('https://example.com/dashboard');

    // Wait for error message
    await page.waitForSelector('[data-testid="network-error"]', { state: 'visible' });

    await expect(page).toHaveScreenshot('network-error-state.png', {
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Cross-Browser', () => {

  test('should capture in chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-specific test');

    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('homepage-chromium.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture in firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');

    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('homepage-firefox.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture in webkit', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit-specific test');

    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('homepage-webkit.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Advanced Techniques', () => {

  test('should mask dynamic content regions', async ({ page }) => {
    await page.goto('https://example.com/dashboard');
    await waitForFontsLoaded(page);
    await waitForImagesLoaded(page);

    // Use mask option to hide dynamic regions
    await expect(page).toHaveScreenshot('dashboard-masked.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="current-time"]'),
        page.locator('[data-testid="live-stats"]'),
        page.locator('.real-time-chart')
      ]
    });
  });

  test('should use clip to capture specific region', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Capture only a specific rectangular region
    await expect(page).toHaveScreenshot('homepage-hero-section.png', {
      animations: 'disabled',
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 600
      }
    });
  });

  test('should capture with custom threshold', async ({ page }) => {
    await page.goto('https://example.com/animated-page');
    await waitForFontsLoaded(page);

    // Higher threshold for pages with subtle animations
    await expect(page).toHaveScreenshot('animated-page.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3, // More lenient comparison
      maxDiffPixels: 200
    });
  });

  test('should capture after specific network idle', async ({ page }) => {
    await page.goto('https://example.com/dynamic-content');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Additional wait for client-side rendering
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('dynamic-content-loaded.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture component in isolation using frame', async ({ page }) => {
    await page.goto('https://example.com/components/isolated');

    // If component is in an iframe
    const frame = page.frameLocator('[data-testid="component-frame"]');
    const component = frame.locator('[data-testid="isolated-component"]');

    await expect(component).toHaveScreenshot('isolated-component.png', {
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - User Flows', () => {

  test('should capture multi-step checkout flow', async ({ page }) => {
    // Step 1: Cart
    await page.goto('https://example.com/cart');
    await waitForFontsLoaded(page);
    await hideDynamicContent(page, ['[data-testid="live-price"]']);

    await expect(page).toHaveScreenshot('checkout-step-1-cart.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Step 2: Shipping
    await page.click('[data-testid="proceed-to-checkout"]');
    await page.waitForURL('**/checkout/shipping');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('checkout-step-2-shipping.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Step 3: Payment
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'Portland');
    await page.click('[data-testid="continue-to-payment"]');
    await page.waitForURL('**/checkout/payment');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('checkout-step-3-payment.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should capture form fill progression', async ({ page }) => {
    await page.goto('https://example.com/signup');
    await waitForFontsLoaded(page);

    // Empty form
    await expect(page).toHaveScreenshot('signup-empty.png', {
      animations: 'disabled'
    });

    // Partially filled
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="name"]', 'John Doe');

    await expect(page).toHaveScreenshot('signup-partial.png', {
      animations: 'disabled'
    });

    // Fully filled
    await page.fill('[data-testid="password"]', 'SecurePassword123!');
    await page.check('[data-testid="terms-checkbox"]');

    await expect(page).toHaveScreenshot('signup-complete.png', {
      animations: 'disabled'
    });
  });
});

test.describe('Playwright Visual Testing - Accessibility States', () => {

  test('should capture focus indicators', async ({ page }) => {
    await page.goto('https://example.com/form');
    await waitForFontsLoaded(page);

    // Tab through form to show focus indicators
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('form-focus-indicators.png', {
      animations: 'disabled'
    });
  });

  test('should capture skip navigation link', async ({ page }) => {
    await page.goto('https://example.com');
    await waitForFontsLoaded(page);

    // Tab to reveal skip link
    await page.keyboard.press('Tab');

    await expect(page).toHaveScreenshot('skip-navigation-visible.png', {
      animations: 'disabled'
    });
  });

  test('should capture reduced motion preference', async ({ page }) => {
    await page.goto('https://example.com');

    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('homepage-reduced-motion.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

/**
 * Test configuration examples for playwright.config.js
 *
 * export default {
 *   use: {
 *     // Global screenshot settings
 *     screenshot: 'only-on-failure',
 *   },
 *   expect: {
 *     toHaveScreenshot: {
 *       // Global visual comparison settings
 *       maxDiffPixels: 100,
 *       threshold: 0.2,
 *       animations: 'disabled',
 *     }
 *   }
 * }
 */

/**
 * Best Practices Summary:
 *
 * 1. Always wait for fonts and images to load before capturing
 * 2. Disable or stabilize animations for consistent results
 * 3. Hide dynamic content (timestamps, ads, etc.)
 * 4. Use appropriate thresholds based on content type
 * 5. Test at multiple viewports for responsive designs
 * 6. Capture component states (hover, focus, error, etc.)
 * 7. Use masks for unavoidable dynamic regions
 * 8. Name screenshots descriptively
 * 9. Update baselines intentionally with --update-snapshots
 * 10. Review diffs carefully in HTML report
 */
