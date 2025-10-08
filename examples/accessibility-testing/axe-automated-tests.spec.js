/**
 * Axe-Core Automated Accessibility Tests
 *
 * This file demonstrates comprehensive accessibility testing using axe-core
 * integrated with Playwright. It covers WCAG 2.1 Level AA compliance testing
 * at both full page and component levels.
 *
 * @see https://github.com/dequelabs/axe-core
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// Custom matcher for axe violations
expect.extend({
  toHaveNoAccessibilityViolations(violations) {
    const pass = violations.length === 0;

    if (pass) {
      return {
        message: () => 'Expected accessibility violations, but found none',
        pass: true,
      };
    }

    // Format violation details for helpful error messages
    const violationDetails = violations.map(violation => {
      const nodes = violation.nodes.map(node => ({
        html: node.html,
        target: node.target.join(', '),
        failureSummary: node.failureSummary,
      }));

      return {
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: nodes,
      };
    });

    return {
      message: () =>
        `Expected no accessibility violations, but found ${violations.length}:\n\n` +
        JSON.stringify(violationDetails, null, 2),
      pass: false,
    };
  },
});

/**
 * Test Suite: Full Page Accessibility Scanning
 * Tests complete pages for WCAG 2.1 AA compliance
 */
test.describe('Full Page Accessibility - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('https://example.com');

    // Run axe scan on the entire page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });

  test('product listing page should be accessible', async ({ page }) => {
    await page.goto('https://example.com/products');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toHaveLength(0);

    // Verify passes (optional - demonstrates what passed)
    expect(accessibilityScanResults.passes.length).toBeGreaterThan(0);
  });

  test('checkout page should meet accessibility standards', async ({ page }) => {
    await page.goto('https://example.com/checkout');

    // Wait for dynamic content to load
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });
});

/**
 * Test Suite: Component-Level Accessibility Testing
 * Tests individual components in isolation for better debugging
 */
test.describe('Component-Level Accessibility', () => {
  test('navigation menu should be keyboard accessible', async ({ page }) => {
    await page.goto('https://example.com');

    // Test only the navigation component
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('nav')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();

    // Verify specific navigation accessibility requirements
    const navigation = await page.locator('nav');
    await expect(navigation).toBeVisible();

    // Check for skip link
    const skipLink = await page.locator('a[href="#main-content"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toHaveAttribute('class', /skip-link/);
    }
  });

  test('search form should have proper labels and ARIA', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form[role="search"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();

    // Additional form accessibility checks
    const searchInput = await page.locator('input[type="search"]');
    await expect(searchInput).toHaveAttribute('aria-label');
  });

  test('modal dialog should be accessible', async ({ page }) => {
    await page.goto('https://example.com');

    // Trigger modal
    await page.click('button:has-text("Open Modal")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();

    // Verify modal accessibility attributes
    const modal = await page.locator('[role="dialog"]');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby');
  });

  test('data table should have proper structure', async ({ page }) => {
    await page.goto('https://example.com/data-table');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('table')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();

    // Verify table structure
    const table = await page.locator('table');
    await expect(table).toBeVisible();

    // Check for proper headers
    const thElements = await table.locator('th');
    const thCount = await thElements.count();
    expect(thCount).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Tag-Based Testing
 * Test specific WCAG criteria using tags
 */
test.describe('WCAG Tag-Based Testing', () => {
  test('test WCAG 2.0 Level A only', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });

  test('test WCAG 2.1 Level AA only', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });

  test('test best practices', async ({ page }) => {
    await page.goto('https://example.com');

    // Test additional best practices beyond WCAG
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    // Best practices may have violations - log them but don't fail
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Best practice suggestions:',
        accessibilityScanResults.violations.map(v => ({
          id: v.id,
          description: v.description,
          impact: v.impact,
        }))
      );
    }
  });
});

/**
 * Test Suite: Severity-Based Testing
 * Filter violations by impact level
 */
test.describe('Severity-Based Accessibility Testing', () => {
  test('critical and serious violations only', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Filter for critical and serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('generate accessibility report by severity', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Group violations by severity
    const bySeverity = {
      critical: [],
      serious: [],
      moderate: [],
      minor: [],
    };

    accessibilityScanResults.violations.forEach(violation => {
      bySeverity[violation.impact]?.push(violation);
    });

    // Log summary
    console.log('Accessibility Report:');
    console.log(`Critical: ${bySeverity.critical.length}`);
    console.log(`Serious: ${bySeverity.serious.length}`);
    console.log(`Moderate: ${bySeverity.moderate.length}`);
    console.log(`Minor: ${bySeverity.minor.length}`);

    // Fail if critical or serious issues found
    expect(bySeverity.critical.length + bySeverity.serious.length).toBe(0);
  });
});

/**
 * Test Suite: Custom Rule Configuration
 * Demonstrates how to customize axe rules
 */
test.describe('Custom Rule Configuration', () => {
  test('disable specific rules with justification', async ({ page }) => {
    await page.goto('https://example.com');

    // Disable color-contrast for third-party widgets
    // JUSTIFICATION: Third-party widgets outside our control
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });

  test('exclude specific elements from testing', async ({ page }) => {
    await page.goto('https://example.com');

    // Exclude third-party iframe
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('iframe[src*="thirdparty.com"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });

  test('include only specific sections', async ({ page }) => {
    await page.goto('https://example.com');

    // Test only main content area
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('main')
      .include('header')
      .include('footer')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });
});

/**
 * Test Suite: Multiple Viewport Testing
 * Test accessibility across different screen sizes
 */
test.describe('Responsive Accessibility Testing', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  viewports.forEach(viewport => {
    test(`${viewport.name} viewport accessibility`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('https://example.com');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();

      console.log(`${viewport.name}: ${accessibilityScanResults.passes.length} checks passed`);
    });
  });
});

/**
 * Test Suite: Dynamic Content Accessibility
 * Test accessibility of dynamically loaded content
 */
test.describe('Dynamic Content Accessibility', () => {
  test('infinite scroll content should be accessible', async ({ page }) => {
    await page.goto('https://example.com/infinite-scroll');

    // Scroll to load more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000); // Wait for content to load

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });

  test('AJAX-loaded content should maintain accessibility', async ({ page }) => {
    await page.goto('https://example.com');

    // Trigger AJAX content load
    await page.click('button:has-text("Load More")');
    await page.waitForSelector('.ajax-content', { state: 'visible' });

    // Test newly loaded content
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.ajax-content')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });

  test('single page application route changes', async ({ page }) => {
    await page.goto('https://example.com');

    // Navigate to different route
    await page.click('a[href="/about"]');
    await page.waitForURL('**/about');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();
  });
});

/**
 * Test Suite: Form Accessibility
 * Comprehensive form accessibility testing
 */
test.describe('Form Accessibility', () => {
  test('registration form should be fully accessible', async ({ page }) => {
    await page.goto('https://example.com/register');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();

    // Verify specific form accessibility requirements
    const form = await page.locator('form');

    // All inputs should have labels
    const inputs = await form.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input must have one of: associated label, aria-label, or aria-labelledby
      const hasLabel = id && await page.locator(`label[for="${id}"]`).count() > 0;
      expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('form validation errors should be accessible', async ({ page }) => {
    await page.goto('https://example.com/register');

    // Submit form without filling required fields
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="alert"], .error-message');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveNoAccessibilityViolations();

    // Verify error messages are announced
    const errorMessages = await page.locator('[role="alert"], .error-message');
    const count = await errorMessages.count();
    expect(count).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Image Accessibility
 * Test image alt text and decorative images
 */
test.describe('Image Accessibility', () => {
  test('all content images should have alt text', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    // Check specifically for image-alt rule
    const imageAltViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'image-alt'
    );

    expect(imageAltViolations).toHaveLength(0);
  });

  test('decorative images should have empty alt', async ({ page }) => {
    await page.goto('https://example.com');

    // Check decorative images
    const decorativeImages = await page.locator('img[role="presentation"], img[alt=""]');
    const count = await decorativeImages.count();

    // Verify they don't have non-empty alt text
    for (let i = 0; i < count; i++) {
      const img = decorativeImages.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt === '' || alt === null).toBeTruthy();
    }
  });
});

/**
 * Utility function to save detailed accessibility report
 */
async function saveAccessibilityReport(results, filename) {
  const fs = require('fs');
  const path = require('path');

  const report = {
    timestamp: new Date().toISOString(),
    url: results.url,
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags,
      nodes: v.nodes.length,
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    summary: {
      critical: results.violations.filter(v => v.impact === 'critical').length,
      serious: results.violations.filter(v => v.impact === 'serious').length,
      moderate: results.violations.filter(v => v.impact === 'moderate').length,
      minor: results.violations.filter(v => v.impact === 'minor').length,
    },
  };

  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportDir, filename),
    JSON.stringify(report, null, 2)
  );
}
