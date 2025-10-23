# axe-core Quick Start

**Time:** 3 minutes
**Prerequisites:** Node.js 18+ or Browser
**What You'll Learn:** Set up axe-core and test for accessibility issues

## 1. Install (30 seconds)

### For Automated Testing

```bash
# Jest + Testing Library
npm install --save-dev jest-axe

# Cypress
npm install --save-dev cypress-axe axe-core

# Playwright
npm install --save-dev @axe-core/playwright

# Standalone
npm install --save-dev axe-core
```

### For Browser Extension

Install from:

- [Chrome Web Store](https://chrome.google.com/webstore/detail/axe-devtools-web-accessibility/lhdoppojpmngadmnindnejefpokejbdd)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

## 2. Configure (30 seconds)

### Jest Setup

Create `setupTests.js`:

```javascript
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
```

### Cypress Setup

Add to `cypress/support/e2e.js`:

```javascript
import 'cypress-axe';
```

### Playwright Setup

No special configuration needed!

## 3. Hello World (1 minute)

### Jest + Testing Library

```javascript
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <div>
        <button>Click me</button>
        <img src="pic.jpg" alt="Description" />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should detect missing alt text', async () => {
    const { container } = render(
      <img src="pic.jpg" /> // Missing alt!
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(1);
    expect(results.violations[0].id).toBe('image-alt');
  });
});
```

### Cypress

```javascript
describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('should have no accessibility violations', () => {
    cy.checkA11y();
  });

  it('should check specific element', () => {
    cy.checkA11y('.main-content');
  });

  it('should exclude certain elements', () => {
    cy.checkA11y(null, {
      exclude: [['.third-party-widget']],
    });
  });

  it('should check with custom rules', () => {
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: false },
        'valid-lang': { enabled: true },
      },
    });
  });
});
```

### Playwright

```javascript
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('Accessibility', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should scan specific region', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('#main-content')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should exclude third-party widgets', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.third-party-widget')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

## 4. Run Tests (30 seconds)

```bash
# Jest
npm test

# Cypress
npx cypress run

# Playwright
npx playwright test

# View violations in console
```

**Example Output:**

```
 FAIL  src/App.test.js
  Accessibility
    ✕ should have no accessibility violations (234ms)

  ● Accessibility › should have no accessibility violations

    Expected the HTML found at $('img') to have no violations:

    <img src="pic.jpg">

    Received:

    "Images must have alternate text" (image-alt)

    Fix one of the following:
      Element does not have an alt attribute
      aria-label attribute does not exist or is empty
      aria-labelledby attribute does not exist, references elements that do not exist
```

## 5. Next Steps

### Custom Violation Callback

```javascript
// Cypress
cy.checkA11y(null, null, violations => {
  violations.forEach(violation => {
    cy.task('log', {
      message: `${violation.id}: ${violation.description}`,
      nodes: violation.nodes.length,
    });
  });
});
```

### Test Different Impact Levels

```javascript
// Only check critical and serious issues
const accessibilityScanResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze();

// Check specific rules
const results = await new AxeBuilder({ page }).include(['button', 'a', 'input']).analyze();
```

### Generate Reports

```javascript
// Jest - Custom reporter
import { axe } from 'jest-axe';

test('accessibility', async () => {
  const { container } = render(<App />);
  const results = await axe(container);

  // Save report
  const fs = require('fs');
  fs.writeFileSync('accessibility-report.json', JSON.stringify(results, null, 2));

  expect(results).toHaveNoViolations();
});
```

### Test Specific WCAG Criteria

```javascript
// Test only WCAG 2.0 Level A
await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

// Test WCAG 2.0 Level AA
await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

// Test WCAG 2.1 Level AAA
await new AxeBuilder({ page }).withTags(['wcag21aaa']).analyze();

// Test best practices
await new AxeBuilder({ page }).withTags(['best-practice']).analyze();
```

### Disable Specific Rules

```javascript
// Playwright
await new AxeBuilder({ page })
  .disableRules(['color-contrast']) // Disable color contrast check
  .analyze();

// Cypress
cy.checkA11y(null, {
  rules: {
    'color-contrast': { enabled: false },
  },
});

// Jest
const results = await axe(container, {
  rules: {
    'color-contrast': { enabled: false },
  },
});
```

### Mobile Accessibility

```javascript
// Playwright with mobile viewport
test.use({
  viewport: { width: 375, height: 667 },
  isMobile: true,
  hasTouch: true,
});

test('mobile accessibility', async ({ page }) => {
  await page.goto('https://example.com');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## 6. Troubleshooting

### Issue: "axe is not defined"

```javascript
// Make sure to import/inject
// Jest
import { axe } from 'jest-axe';

// Cypress
cy.injectAxe();

// Playwright
const AxeBuilder = require('@axe-core/playwright').default;
```

### Issue: Too many violations

```javascript
// Start with critical issues only
await new AxeBuilder({ page }).options({ runOnly: ['error'] }).analyze();

// Then add serious
await new AxeBuilder({ page }).options({ runOnly: ['error', 'serious'] }).analyze();
```

### Issue: Third-party widgets failing

```javascript
// Exclude them from scan
cy.checkA11y(null, {
  exclude: [['.recaptcha'], ['.twitter-widget']],
});

// Or
await new AxeBuilder({ page }).exclude('.recaptcha').exclude('.twitter-widget').analyze();
```

### Issue: Color contrast false positives

```javascript
// Disable if using gradients or images
rules: {
  'color-contrast': { enabled: false }
}

// Or manually verify problem areas
```

### Issue: Tests too slow

```javascript
// Scan only changed components
cy.get('.updated-component').then($el => {
  cy.checkA11y($el[0]);
});

// Or scan in stages
test('header accessibility', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).include('header').analyze();
  expect(results.violations).toEqual([]);
});

test('main accessibility', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).include('main').analyze();
  expect(results.violations).toEqual([]);
});
```

## 🎓 Common Rules Reference

```javascript
// WCAG 2.0 Level A
'area-alt'; // Area elements must have alt text
'button-name'; // Buttons must have text
'image-alt'; // Images must have alt text
'input-button-name'; // Input buttons have text
'label'; // Form inputs have labels
'link-name'; // Links have text
'document-title'; // Pages have titles

// WCAG 2.0 Level AA
'color-contrast'; // Text has sufficient contrast
'meta-viewport'; // Zoom is not disabled

// WCAG 2.1 Level AA
'autocomplete-valid'; // Autocomplete attributes valid
'target-size'; // Touch targets large enough

// Best Practices
'landmark-one-main'; // Page has main landmark
'region'; // All content in landmarks
'aria-roles'; // Valid ARIA roles
```

## 📚 Resources

- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Deque University](https://dequeuniversity.com/)
- [Full A11y Examples](../accessibility-testing/)

## ⏭️ What's Next?

1. **Add to CI/CD** - Fail builds on violations
2. **Generate reports** - Track progress over time
3. **Manual testing** - Use browser extension
4. **Screen reader testing** - Test with NVDA/JAWS
5. **Keyboard testing** - Ensure keyboard navigation

---

**Time to first test:** ~3 minutes ✅
**Ready for production?** Add to CI and fix all critical issues!
