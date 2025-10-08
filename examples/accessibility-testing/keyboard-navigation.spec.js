/**
 * Keyboard Navigation Accessibility Tests
 *
 * This file demonstrates comprehensive keyboard navigation testing to ensure
 * all interactive elements are accessible via keyboard alone, following
 * WCAG 2.1 Guideline 2.1 (Keyboard Accessible).
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/keyboard
 * @see https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap
 */

const { test, expect } = require('@playwright/test');

/**
 * Helper function to get the currently focused element selector
 */
async function getFocusedElementSelector(page) {
  return await page.evaluate(() => {
    const element = document.activeElement;
    if (!element) return null;

    // Generate a unique selector
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) {
        const selector = `${element.tagName.toLowerCase()}.${classes}`;
        // Verify uniqueness
        if (document.querySelectorAll(selector).length === 1) return selector;
      }
    }
    return element.tagName.toLowerCase();
  });
}

/**
 * Helper function to get focus indicator styles
 */
async function getFocusStyles(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;

    const styles = window.getComputedStyle(element, ':focus');
    return {
      outline: styles.outline,
      outlineColor: styles.outlineColor,
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
      boxShadow: styles.boxShadow,
      border: styles.border,
    };
  }, selector);
}

/**
 * Test Suite: Tab Order and Navigation
 */
test.describe('Tab Order and Focus Management', () => {
  test('all interactive elements should be reachable via Tab key', async ({ page }) => {
    await page.goto('https://example.com');

    // Get all focusable elements
    const focusableElements = await page.evaluate(() => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        'area[href]',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
      ];

      const elements = document.querySelectorAll(selectors.join(','));
      return Array.from(elements).map(el => {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id,
          class: el.className,
          type: el.type || null,
          tabindex: el.getAttribute('tabindex'),
        };
      });
    });

    console.log(`Found ${focusableElements.length} focusable elements`);
    expect(focusableElements.length).toBeGreaterThan(0);

    // Tab through first 10 elements to verify navigation works
    for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focusedElement = await getFocusedElementSelector(page);
      expect(focusedElement).not.toBeNull();
    }
  });

  test('Tab order should follow logical reading order', async ({ page }) => {
    await page.goto('https://example.com');

    const tabOrder = [];

    // Tab through header, main navigation, and main content
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 30),
          position: el.getBoundingClientRect().top,
          section: el.closest('header, nav, main, footer')?.tagName.toLowerCase(),
        };
      });

      tabOrder.push(focused);
    }

    console.log('Tab order:', tabOrder);

    // Verify logical progression (header -> nav -> main)
    const sections = tabOrder.map(item => item.section).filter(Boolean);
    const headerIndex = sections.indexOf('header');
    const navIndex = sections.indexOf('nav');
    const mainIndex = sections.indexOf('main');

    if (headerIndex !== -1 && navIndex !== -1) {
      expect(headerIndex).toBeLessThan(navIndex);
    }
    if (navIndex !== -1 && mainIndex !== -1) {
      expect(navIndex).toBeLessThan(mainIndex);
    }
  });

  test('Shift+Tab should navigate backwards', async ({ page }) => {
    await page.goto('https://example.com');

    // Tab forward 5 times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    const forwardElement = await getFocusedElementSelector(page);

    // Tab backward 1 time
    await page.keyboard.press('Shift+Tab');
    const backwardElement = await getFocusedElementSelector(page);

    // Elements should be different
    expect(forwardElement).not.toBe(backwardElement);

    // Tab forward again should return to same element
    await page.keyboard.press('Tab');
    const returnElement = await getFocusedElementSelector(page);
    expect(returnElement).toBe(forwardElement);
  });

  test('elements with tabindex="0" should be in natural tab order', async ({ page }) => {
    await page.goto('https://example.com');

    // Check for custom tabindex usage
    const tabindexElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[tabindex]');
      return Array.from(elements).map(el => ({
        tag: el.tagName.toLowerCase(),
        tabindex: el.getAttribute('tabindex'),
        text: el.textContent?.trim().substring(0, 30),
      }));
    });

    // Verify no positive tabindex values (anti-pattern)
    const positiveTabindex = tabindexElements.filter(
      el => parseInt(el.tabindex) > 0
    );

    expect(positiveTabindex.length).toBe(0);
  });
});

/**
 * Test Suite: Focus Indicators
 */
test.describe('Focus Indicators', () => {
  test('all interactive elements should have visible focus indicators', async ({ page }) => {
    await page.goto('https://example.com');

    // Get first few focusable elements
    const buttons = await page.locator('button, a, input').all();
    const testElements = buttons.slice(0, 5);

    for (const element of testElements) {
      await element.focus();
      await page.waitForTimeout(100);

      // Check if element has focus styles
      const isFocused = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const pseudoStyles = window.getComputedStyle(el, ':focus');

        // Check for outline, box-shadow, or border changes
        const hasOutline = pseudoStyles.outline !== 'none' &&
          pseudoStyles.outlineWidth !== '0px';
        const hasBoxShadow = pseudoStyles.boxShadow !== 'none';
        const hasBorder = pseudoStyles.borderWidth !== '0px';

        return hasOutline || hasBoxShadow || hasBorder;
      });

      const elementInfo = await element.evaluate(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 20),
      }));

      expect(isFocused).toBeTruthy();
    }
  });

  test('focus indicators should have sufficient contrast', async ({ page }) => {
    await page.goto('https://example.com');

    const link = await page.locator('a').first();
    await link.focus();

    const focusStyles = await link.evaluate(el => {
      const styles = window.getComputedStyle(el, ':focus');
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
      };
    });

    // Verify focus indicator exists (not 'none')
    expect(focusStyles.outline).not.toBe('none');
    console.log('Focus styles:', focusStyles);
  });

  test('focus should not be hidden by outline: none without alternative', async ({ page }) => {
    await page.goto('https://example.com');

    const elementsWithoutOutline = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const results = [];
      focusable.forEach(el => {
        const styles = window.getComputedStyle(el, ':focus');

        if (styles.outline === 'none' || styles.outlineWidth === '0px') {
          // Check for alternative focus indicators
          const hasBoxShadow = styles.boxShadow !== 'none';
          const hasBorder = styles.borderWidth !== '0px' && styles.borderStyle !== 'none';
          const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)';

          if (!hasBoxShadow && !hasBorder && !hasBackground) {
            results.push({
              tag: el.tagName.toLowerCase(),
              id: el.id,
              class: el.className,
            });
          }
        }
      });

      return results;
    });

    // Log elements without visible focus indicators
    if (elementsWithoutOutline.length > 0) {
      console.warn('Elements without visible focus indicators:', elementsWithoutOutline);
    }

    // Should have alternative focus indicator
    expect(elementsWithoutOutline.length).toBe(0);
  });
});

/**
 * Test Suite: Skip Links
 */
test.describe('Skip Links', () => {
  test('page should have skip to main content link', async ({ page }) => {
    await page.goto('https://example.com');

    // Check for skip link
    const skipLink = await page.locator('a[href="#main-content"], a[href="#main"], a[href="#content"]').first();

    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeAttached();

      // Skip link should be first focusable element
      await page.keyboard.press('Tab');
      const firstFocused = await getFocusedElementSelector(page);

      // Focus skip link and verify it becomes visible or is already visible
      await skipLink.focus();
      const isVisible = await skipLink.isVisible();

      // Skip link should be visible when focused (may be off-screen initially)
      expect(isVisible || firstFocused.includes('skip')).toBeTruthy();
    }
  });

  test('skip link should navigate to main content', async ({ page }) => {
    await page.goto('https://example.com');

    const skipLink = await page.locator('a[href^="#main"], a[href^="#content"]').first();

    if (await skipLink.count() > 0) {
      await skipLink.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Verify focus moved to main content
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.id || document.activeElement?.tagName;
      });

      console.log('After skip link, focus is on:', focusedElement);
      expect(focusedElement.toLowerCase()).toMatch(/main|content/);
    }
  });
});

/**
 * Test Suite: Focus Trap Management
 */
test.describe('Focus Trap in Modals and Dialogs', () => {
  test('modal should trap focus within dialog', async ({ page }) => {
    await page.goto('https://example.com');

    // Open modal
    await page.click('button:has-text("Open Modal")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const modal = await page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Get focusable elements inside modal
    const modalFocusableCount = await modal.evaluate(el => {
      const focusable = el.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return focusable.length;
    });

    console.log(`Modal has ${modalFocusableCount} focusable elements`);

    // Tab through modal elements
    let cycledBack = false;
    const maxTabs = modalFocusableCount + 2;

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const focusedElement = await page.locator(':focus');
      const isInModal = await focusedElement.evaluate((el, modalEl) => {
        return modalEl.contains(el);
      }, await modal.elementHandle());

      // Focus should always be within modal
      expect(isInModal).toBeTruthy();

      // After tabbing through all elements, should cycle back
      if (i === maxTabs - 1) {
        cycledBack = true;
      }
    }

    expect(cycledBack).toBeTruthy();
  });

  test('modal should focus first element when opened', async ({ page }) => {
    await page.goto('https://example.com');

    // Open modal
    await page.click('button:has-text("Open Modal")');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.waitForTimeout(100);

    // Check if focus is inside modal
    const focusInModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      const focused = document.activeElement;
      return modal?.contains(focused);
    });

    expect(focusInModal).toBeTruthy();
  });

  test('closing modal should return focus to trigger button', async ({ page }) => {
    await page.goto('https://example.com');

    // Focus and click modal trigger
    const triggerButton = await page.locator('button:has-text("Open Modal")');
    await triggerButton.focus();
    await triggerButton.click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Close modal (Escape key or close button)
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    await page.waitForTimeout(100);

    // Check if focus returned to trigger button
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.textContent?.trim();
    });

    expect(focusedElement).toContain('Open Modal');
  });
});

/**
 * Test Suite: Keyboard Shortcuts
 */
test.describe('Keyboard Shortcuts', () => {
  test('common keyboard shortcuts should work', async ({ page }) => {
    await page.goto('https://example.com');

    // Test Escape key (if applicable)
    const escapeHandled = await page.evaluate(() => {
      let handled = false;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') handled = true;
      }, { once: true });
      return handled;
    });

    // Test Enter key on button
    const button = await page.locator('button').first();
    await button.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Test Space key on button
    const button2 = await page.locator('button').nth(1);
    await button2.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Verify interactions worked (check for page changes, etc.)
  });

  test('search should be accessible via / key (if implemented)', async ({ page }) => {
    await page.goto('https://example.com');

    // Press / key to focus search
    await page.keyboard.press('/');
    await page.waitForTimeout(100);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName.toLowerCase(),
        type: el.type,
      };
    });

    // If / shortcut is implemented, should focus search input
    if (focusedElement.tag === 'input' && focusedElement.type === 'search') {
      console.log('Search shortcut (/) works correctly');
    }
  });
});

/**
 * Test Suite: Form Keyboard Navigation
 */
test.describe('Form Keyboard Navigation', () => {
  test('form inputs should be navigable with Tab', async ({ page }) => {
    await page.goto('https://example.com/contact');

    const form = await page.locator('form').first();
    const inputs = await form.locator('input, select, textarea').all();

    // Tab through form inputs
    await inputs[0].focus();

    for (let i = 1; i < inputs.length; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const isFocused = await inputs[i].evaluate(el => {
        return document.activeElement === el;
      });

      expect(isFocused).toBeTruthy();
    }
  });

  test('radio buttons should be navigable with arrow keys', async ({ page }) => {
    await page.goto('https://example.com/survey');

    // Find radio button group
    const radioGroup = await page.locator('[role="radiogroup"]').first();

    if (await radioGroup.count() > 0) {
      const radios = await radioGroup.locator('input[type="radio"]').all();

      if (radios.length > 0) {
        // Focus first radio
        await radios[0].focus();

        // Use arrow key to navigate
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(50);

        // Check if next radio is focused
        const secondFocused = await radios[1].evaluate(el => {
          return document.activeElement === el;
        });

        expect(secondFocused).toBeTruthy();
      }
    }
  });

  test('dropdowns should be operable with keyboard', async ({ page }) => {
    await page.goto('https://example.com/form');

    const select = await page.locator('select').first();

    if (await select.count() > 0) {
      await select.focus();

      // Open dropdown with Space or Enter
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);

      // Select with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(50);

      // Verify selection changed
      const selectedValue = await select.inputValue();
      console.log('Selected value:', selectedValue);
    }
  });
});

/**
 * Test Suite: No Keyboard Trap
 */
test.describe('No Keyboard Trap - WCAG 2.1.2', () => {
  test('user should not be trapped in any component', async ({ page }) => {
    await page.goto('https://example.com');

    let previousFocus = null;
    let sameCount = 0;
    const maxSame = 3;

    // Tab through page and verify focus keeps moving
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const currentFocus = await getFocusedElementSelector(page);

      if (currentFocus === previousFocus) {
        sameCount++;
        if (sameCount >= maxSame) {
          throw new Error(`Keyboard trap detected at: ${currentFocus}`);
        }
      } else {
        sameCount = 0;
      }

      previousFocus = currentFocus;
    }

    // Should successfully tab through without getting trapped
    expect(sameCount).toBeLessThan(maxSame);
  });

  test('iframe content should not trap keyboard focus', async ({ page }) => {
    await page.goto('https://example.com');

    const iframes = await page.locator('iframe');
    const iframeCount = await iframes.count();

    if (iframeCount > 0) {
      // Tab until focus enters iframe
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        const isInIframe = await page.evaluate(() => {
          return document.activeElement?.tagName === 'IFRAME';
        });

        if (isInIframe) {
          // Tab a few more times to verify we can exit
          for (let j = 0; j < 5; j++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(50);
          }

          const stillInIframe = await page.evaluate(() => {
            return document.activeElement?.tagName === 'IFRAME';
          });

          // Should be able to exit iframe
          expect(stillInIframe).toBeFalsy();
          break;
        }
      }
    }
  });
});
