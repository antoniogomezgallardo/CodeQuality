/**
 * Accessibility Testing Helpers
 *
 * This module provides reusable utility functions and custom matchers
 * for accessibility testing across different test frameworks.
 *
 * @module accessibility-helpers
 */

/**
 * Check if an element has a visible focus indicator
 */
async function hasVisibleFocusIndicator(page, selector) {
  return await page.evaluate(sel => {
    const element = document.querySelector(sel);
    if (!element) return false;

    element.focus();
    const styles = window.getComputedStyle(element, ':focus');

    const hasOutline = styles.outline !== 'none' && styles.outlineWidth !== '0px';
    const hasBoxShadow = styles.boxShadow !== 'none';
    const hasBorder = styles.borderWidth !== '0px' && styles.borderStyle !== 'none';

    return hasOutline || hasBoxShadow || hasBorder;
  }, selector);
}

/**
 * Check if text has sufficient color contrast
 */
function hasMinimumContrast(ratio, fontSize, fontWeight, level = 'AA') {
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  // WCAG AA
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Get all focusable elements on the page
 */
async function getFocusableElements(page) {
  return await page.evaluate(() => {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'area[href]',
      '[contenteditable]',
    ];

    const elements = document.querySelectorAll(selectors.join(','));
    return Array.from(elements).map((el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      id: el.id,
      class: el.className,
      text: el.textContent?.trim().substring(0, 30),
      tabindex: el.getAttribute('tabindex'),
    }));
  });
}

/**
 * Check if an element is keyboard accessible
 */
async function isKeyboardAccessible(page, selector) {
  return await page.evaluate(sel => {
    const element = document.querySelector(sel);
    if (!element) return false;

    // Check if element can receive focus
    const tabindex = element.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex) < 0) return false;

    // Check if element is a native focusable element
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (focusableTags.includes(element.tagName)) return true;

    // Check if element has tabindex >= 0
    if (tabindex && parseInt(tabindex) >= 0) return true;

    return false;
  }, selector);
}

/**
 * Verify heading hierarchy is logical
 */
async function checkHeadingHierarchy(page) {
  return await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const issues = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1]);
      const text = heading.textContent?.trim().substring(0, 50);

      // Check for H1
      if (index === 0 && level !== 1) {
        issues.push({
          type: 'missing-h1',
          message: 'Page should start with H1',
          heading: text,
          level,
        });
      }

      // Check for skipped levels
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({
          type: 'skipped-level',
          message: `Heading level skipped from H${previousLevel} to H${level}`,
          heading: text,
          level,
        });
      }

      previousLevel = level;
    });

    return {
      headings: headings.length,
      h1Count: headings.filter(h => h.tagName === 'H1').length,
      issues,
    };
  });
}

/**
 * Check if images have appropriate alt text
 */
async function checkImageAltText(page) {
  return await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const issues = [];

    images.forEach(img => {
      const src = img.src;
      const alt = img.getAttribute('alt');

      // Check for missing alt attribute
      if (alt === null) {
        issues.push({
          type: 'missing-alt',
          src,
          message: 'Image is missing alt attribute',
        });
        return;
      }

      // Check for filename as alt text
      if (alt && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(alt)) {
        issues.push({
          type: 'filename-as-alt',
          src,
          alt,
          message: 'Alt text appears to be a filename',
        });
      }

      // Check for "image of" or "picture of"
      if (alt && /^(image|picture|photo)\s+(of|showing)/i.test(alt)) {
        issues.push({
          type: 'redundant-alt',
          src,
          alt,
          message: 'Alt text contains redundant phrases like "image of"',
        });
      }
    });

    return {
      total: images.length,
      withAlt: images.filter(img => img.getAttribute('alt') !== null).length,
      decorative: images.filter(img => img.getAttribute('alt') === '').length,
      issues,
    };
  });
}

/**
 * Check if form inputs have labels
 */
async function checkFormLabels(page) {
  return await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    const issues = [];

    inputs.forEach(input => {
      const id = input.id;
      const type = input.type;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');

      // Skip hidden inputs
      if (type === 'hidden') return;

      // Check if input has a label
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = ariaLabel || ariaLabelledBy;

      if (!hasLabel && !hasAriaLabel) {
        issues.push({
          type: 'missing-label',
          tag: input.tagName.toLowerCase(),
          inputType: type,
          id,
          message: 'Form control is missing a label',
        });
      }
    });

    return {
      total: inputs.length,
      labeled: inputs.length - issues.length,
      issues,
    };
  });
}

/**
 * Check if links have descriptive text
 */
async function checkLinkText(page) {
  return await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const issues = [];

    const genericText = [
      'click here',
      'read more',
      'more',
      'link',
      'here',
      'learn more',
      'click',
      'this',
    ];

    links.forEach(link => {
      const text = link.textContent?.trim().toLowerCase();
      const href = link.getAttribute('href');
      const ariaLabel = link.getAttribute('aria-label');

      // Check for empty links
      if (!text && !ariaLabel) {
        issues.push({
          type: 'empty-link',
          href,
          message: 'Link has no text or aria-label',
        });
        return;
      }

      // Check for generic link text
      if (text && genericText.includes(text)) {
        issues.push({
          type: 'generic-link-text',
          text,
          href,
          message: 'Link text is not descriptive',
        });
      }

      // Check for URL as link text
      if (text && text.startsWith('http')) {
        issues.push({
          type: 'url-as-text',
          text,
          href,
          message: 'Link text is a URL',
        });
      }
    });

    return {
      total: links.length,
      issues,
    };
  });
}

/**
 * Check if page has proper landmarks
 */
async function checkLandmarks(page) {
  return await page.evaluate(() => {
    const landmarks = {
      banner: document.querySelectorAll('header, [role="banner"]').length,
      navigation: document.querySelectorAll('nav, [role="navigation"]').length,
      main: document.querySelectorAll('main, [role="main"]').length,
      complementary: document.querySelectorAll('aside, [role="complementary"]').length,
      contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length,
    };

    const issues = [];

    if (landmarks.main === 0) {
      issues.push({ type: 'missing-main', message: 'Page is missing main landmark' });
    }

    if (landmarks.main > 1) {
      issues.push({ type: 'multiple-main', message: 'Page has multiple main landmarks' });
    }

    if (landmarks.navigation === 0) {
      issues.push({ type: 'missing-nav', message: 'Page is missing navigation landmark' });
    }

    return { landmarks, issues };
  });
}

/**
 * Check if ARIA attributes are valid
 */
async function checkARIAAttributes(page) {
  return await page.evaluate(() => {
    const validAriaAttrs = [
      'aria-activedescendant',
      'aria-atomic',
      'aria-autocomplete',
      'aria-busy',
      'aria-checked',
      'aria-colcount',
      'aria-colindex',
      'aria-colspan',
      'aria-controls',
      'aria-current',
      'aria-describedby',
      'aria-details',
      'aria-disabled',
      'aria-dropeffect',
      'aria-errormessage',
      'aria-expanded',
      'aria-flowto',
      'aria-grabbed',
      'aria-haspopup',
      'aria-hidden',
      'aria-invalid',
      'aria-keyshortcuts',
      'aria-label',
      'aria-labelledby',
      'aria-level',
      'aria-live',
      'aria-modal',
      'aria-multiline',
      'aria-multiselectable',
      'aria-orientation',
      'aria-owns',
      'aria-placeholder',
      'aria-posinset',
      'aria-pressed',
      'aria-readonly',
      'aria-relevant',
      'aria-required',
      'aria-roledescription',
      'aria-rowcount',
      'aria-rowindex',
      'aria-rowspan',
      'aria-selected',
      'aria-setsize',
      'aria-sort',
      'aria-valuemax',
      'aria-valuemin',
      'aria-valuenow',
      'aria-valuetext',
    ];

    const issues = [];
    const allElements = document.querySelectorAll('*');

    allElements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('aria-') && !validAriaAttrs.includes(attr.name)) {
          issues.push({
            type: 'invalid-aria-attribute',
            attribute: attr.name,
            element: element.tagName.toLowerCase(),
            message: `Invalid ARIA attribute: ${attr.name}`,
          });
        }
      });
    });

    return { issues };
  });
}

/**
 * Test keyboard navigation through interactive elements
 */
async function testKeyboardNavigation(page, maxElements = 10) {
  const results = [];

  for (let i = 0; i < maxElements; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id,
        class: el.className,
        text: el.textContent?.trim().substring(0, 30),
        tabindex: el.getAttribute('tabindex'),
      };
    });

    results.push(focused);
  }

  return results;
}

/**
 * Check if modal traps focus
 */
async function testModalFocusTrap(page, modalSelector) {
  await page.waitForSelector(modalSelector, { state: 'visible' });

  const modal = await page.locator(modalSelector);
  const focusableCount = await modal.evaluate(el => {
    const focusable = el.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return focusable.length;
  });

  // Tab through modal and verify focus stays inside
  const results = [];
  for (let i = 0; i < focusableCount + 2; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);

    const isInModal = await page.evaluate(sel => {
      const modal = document.querySelector(sel);
      const focused = document.activeElement;
      return modal.contains(focused);
    }, modalSelector);

    results.push({ iteration: i, focusInModal: isInModal });
  }

  return {
    focusableElements: focusableCount,
    allIterationsInModal: results.every(r => r.focusInModal),
    results,
  };
}

/**
 * Generate accessibility report
 */
async function generateAccessibilityReport(page) {
  console.log('Generating comprehensive accessibility report...\n');

  const [headings, images, forms, links, landmarks, aria] = await Promise.all([
    checkHeadingHierarchy(page),
    checkImageAltText(page),
    checkFormLabels(page),
    checkLinkText(page),
    checkLandmarks(page),
    checkARIAAttributes(page),
  ]);

  const report = {
    timestamp: new Date().toISOString(),
    url: page.url(),
    results: {
      headings,
      images,
      forms,
      links,
      landmarks,
      aria,
    },
    summary: {
      totalIssues: [
        headings.issues,
        images.issues,
        forms.issues,
        links.issues,
        landmarks.issues,
        aria.issues,
      ].reduce((sum, issues) => sum + issues.length, 0),
    },
  };

  return report;
}

/**
 * Custom Jest/Playwright matchers
 */
const customMatchers = {
  toBeKeyboardAccessible: async (page, selector) => {
    const accessible = await isKeyboardAccessible(page, selector);
    return {
      pass: accessible,
      message: () => `Expected element "${selector}" to be keyboard accessible`,
    };
  },

  toHaveValidHeadingHierarchy: async page => {
    const result = await checkHeadingHierarchy(page);
    return {
      pass: result.issues.length === 0,
      message: () =>
        `Expected valid heading hierarchy, found issues: ${JSON.stringify(result.issues)}`,
    };
  },

  toHaveProperAltText: async page => {
    const result = await checkImageAltText(page);
    return {
      pass: result.issues.length === 0,
      message: () =>
        `Expected all images to have proper alt text, found ${result.issues.length} issues`,
    };
  },

  toHaveFormLabels: async page => {
    const result = await checkFormLabels(page);
    return {
      pass: result.issues.length === 0,
      message: () =>
        `Expected all form inputs to have labels, found ${result.issues.length} issues`,
    };
  },

  toHaveDescriptiveLinks: async page => {
    const result = await checkLinkText(page);
    return {
      pass: result.issues.length === 0,
      message: () =>
        `Expected all links to have descriptive text, found ${result.issues.length} issues`,
    };
  },

  toHaveProperLandmarks: async page => {
    const result = await checkLandmarks(page);
    return {
      pass: result.issues.length === 0,
      message: () => `Expected proper landmarks, found issues: ${JSON.stringify(result.issues)}`,
    };
  },
};

/**
 * Print accessibility report to console
 */
function printAccessibilityReport(report) {
  console.log('='.repeat(70));
  console.log('📊 Accessibility Report');
  console.log('='.repeat(70));
  console.log(`URL: ${report.url}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\nTotal Issues: ${report.summary.totalIssues}`);

  console.log('\n📑 Headings:');
  console.log(`  Total: ${report.results.headings.headings}`);
  console.log(`  H1 Count: ${report.results.headings.h1Count}`);
  console.log(`  Issues: ${report.results.headings.issues.length}`);

  console.log('\n🖼️  Images:');
  console.log(`  Total: ${report.results.images.total}`);
  console.log(`  With Alt: ${report.results.images.withAlt}`);
  console.log(`  Issues: ${report.results.images.issues.length}`);

  console.log('\n📝 Forms:');
  console.log(`  Total Inputs: ${report.results.forms.total}`);
  console.log(`  Labeled: ${report.results.forms.labeled}`);
  console.log(`  Issues: ${report.results.forms.issues.length}`);

  console.log('\n🔗 Links:');
  console.log(`  Total: ${report.results.links.total}`);
  console.log(`  Issues: ${report.results.links.issues.length}`);

  console.log('\n🗺️  Landmarks:');
  console.log(`  Main: ${report.results.landmarks.landmarks.main}`);
  console.log(`  Navigation: ${report.results.landmarks.landmarks.navigation}`);
  console.log(`  Issues: ${report.results.landmarks.issues.length}`);

  console.log('\n' + '='.repeat(70) + '\n');
}

// Export all helpers
module.exports = {
  hasVisibleFocusIndicator,
  hasMinimumContrast,
  getFocusableElements,
  isKeyboardAccessible,
  checkHeadingHierarchy,
  checkImageAltText,
  checkFormLabels,
  checkLinkText,
  checkLandmarks,
  checkARIAAttributes,
  testKeyboardNavigation,
  testModalFocusTrap,
  generateAccessibilityReport,
  printAccessibilityReport,
  customMatchers,
};
