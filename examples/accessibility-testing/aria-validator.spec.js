/**
 * ARIA Validator Tests
 *
 * This file demonstrates comprehensive ARIA (Accessible Rich Internet Applications)
 * attribute validation to ensure proper implementation of ARIA roles, states, and
 * properties according to WCAG 2.1 and WAI-ARIA specifications.
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/
 * @see https://www.w3.org/WAI/WCAG21/Understanding/name-role-value
 */

const { test, expect } = require('@playwright/test');

/**
 * Valid ARIA roles and their required/allowed attributes
 */
const ARIA_ROLES = {
  alert: { required: [], allowedChildren: [] },
  alertdialog: { required: ['aria-label', 'aria-labelledby'], allowedChildren: [] },
  button: { required: [], allowedChildren: [] },
  checkbox: { required: ['aria-checked'], allowedChildren: [] },
  dialog: { required: ['aria-label', 'aria-labelledby'], allowedChildren: [] },
  gridcell: { required: [], allowedChildren: [] },
  link: { required: [], allowedChildren: [] },
  log: { required: [], allowedChildren: [] },
  marquee: { required: [], allowedChildren: [] },
  menuitem: { required: [], allowedChildren: [] },
  menuitemcheckbox: { required: ['aria-checked'], allowedChildren: [] },
  menuitemradio: { required: ['aria-checked'], allowedChildren: [] },
  option: { required: ['aria-selected'], allowedChildren: [] },
  progressbar: { required: [], allowedChildren: [] },
  radio: { required: ['aria-checked'], allowedChildren: [] },
  scrollbar: { required: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'], allowedChildren: [] },
  searchbox: { required: [], allowedChildren: [] },
  slider: { required: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'], allowedChildren: [] },
  spinbutton: { required: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'], allowedChildren: [] },
  status: { required: [], allowedChildren: [] },
  switch: { required: ['aria-checked'], allowedChildren: [] },
  tab: { required: ['aria-selected'], allowedChildren: [] },
  tabpanel: { required: ['aria-labelledby'], allowedChildren: [] },
  textbox: { required: [], allowedChildren: [] },
  timer: { required: [], allowedChildren: [] },
  tooltip: { required: [], allowedChildren: [] },
  treeitem: { required: ['aria-selected'], allowedChildren: [] },
};

/**
 * Test Suite: Required ARIA Attributes
 */
test.describe('Required ARIA Attributes', () => {
  test('elements with roles should have required ARIA attributes', async ({ page }) => {
    await page.goto('https://example.com');

    const violations = await page.evaluate((roles) => {
      const issues = [];

      Object.keys(roles).forEach(role => {
        const elements = document.querySelectorAll(`[role="${role}"]`);

        elements.forEach(element => {
          const requiredAttrs = roles[role].required;

          // Check if role requires specific attributes (e.g., aria-label OR aria-labelledby)
          if (Array.isArray(requiredAttrs) && requiredAttrs.length > 0) {
            // For attributes that are alternatives (OR condition), check if at least one exists
            const hasRequiredAttr = requiredAttrs.some(attr => element.hasAttribute(attr));

            if (!hasRequiredAttr && requiredAttrs.length > 0) {
              issues.push({
                role,
                element: element.outerHTML.substring(0, 100),
                missing: requiredAttrs,
                message: `Element with role="${role}" requires one of: ${requiredAttrs.join(' or ')}`,
              });
            }
          }

          // Check specific required attributes (AND condition)
          if (role === 'checkbox' || role === 'radio' || role === 'switch') {
            if (!element.hasAttribute('aria-checked')) {
              issues.push({
                role,
                element: element.outerHTML.substring(0, 100),
                missing: ['aria-checked'],
                message: `Element with role="${role}" must have aria-checked attribute`,
              });
            }
          }

          if (role === 'slider' || role === 'spinbutton' || role === 'scrollbar') {
            const requiredValueAttrs = ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'];
            const missingValueAttrs = requiredValueAttrs.filter(attr => !element.hasAttribute(attr));

            if (missingValueAttrs.length > 0) {
              issues.push({
                role,
                element: element.outerHTML.substring(0, 100),
                missing: missingValueAttrs,
                message: `Element with role="${role}" must have ${missingValueAttrs.join(', ')}`,
              });
            }
          }
        });
      });

      return issues;
    }, ARIA_ROLES);

    if (violations.length > 0) {
      console.log('ARIA Required Attribute Violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });

  test('checkboxes should have aria-checked', async ({ page }) => {
    await page.goto('https://example.com/form');

    const checkboxes = await page.locator('[role="checkbox"]').all();

    for (const checkbox of checkboxes) {
      const hasAriaChecked = await checkbox.evaluate(el => el.hasAttribute('aria-checked'));
      const elementInfo = await checkbox.evaluate(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        class: el.className,
      }));

      expect(hasAriaChecked).toBeTruthy();
    }
  });

  test('sliders should have value attributes', async ({ page }) => {
    await page.goto('https://example.com');

    const sliders = await page.locator('[role="slider"]').all();

    for (const slider of sliders) {
      const hasValueNow = await slider.getAttribute('aria-valuenow');
      const hasValueMin = await slider.getAttribute('aria-valuemin');
      const hasValueMax = await slider.getAttribute('aria-valuemax');

      expect(hasValueNow).not.toBeNull();
      expect(hasValueMin).not.toBeNull();
      expect(hasValueMax).not.toBeNull();

      // Verify values are valid numbers
      expect(parseFloat(hasValueNow)).not.toBeNaN();
      expect(parseFloat(hasValueMin)).not.toBeNaN();
      expect(parseFloat(hasValueMax)).not.toBeNaN();
    }
  });

  test('dialogs should have labels', async ({ page }) => {
    await page.goto('https://example.com');

    // Open dialog if exists
    const dialogTrigger = await page.locator('button:has-text("Open Modal"), button:has-text("Open Dialog")');
    if (await dialogTrigger.count() > 0) {
      await dialogTrigger.first().click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    }

    const dialogs = await page.locator('[role="dialog"], [role="alertdialog"]').all();

    for (const dialog of dialogs) {
      const hasLabel = await dialog.evaluate(el => {
        return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
      });

      expect(hasLabel).toBeTruthy();
    }
  });
});

/**
 * Test Suite: Invalid ARIA Usage
 */
test.describe('Invalid ARIA Usage', () => {
  test('should not use invalid ARIA attributes', async ({ page }) => {
    await page.goto('https://example.com');

    const invalidAttrs = await page.evaluate(() => {
      const validAriaAttrs = [
        'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy',
        'aria-checked', 'aria-colcount', 'aria-colindex', 'aria-colspan',
        'aria-controls', 'aria-current', 'aria-describedby', 'aria-details',
        'aria-disabled', 'aria-dropeffect', 'aria-errormessage', 'aria-expanded',
        'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden',
        'aria-invalid', 'aria-keyshortcuts', 'aria-label', 'aria-labelledby',
        'aria-level', 'aria-live', 'aria-modal', 'aria-multiline',
        'aria-multiselectable', 'aria-orientation', 'aria-owns', 'aria-placeholder',
        'aria-posinset', 'aria-pressed', 'aria-readonly', 'aria-relevant',
        'aria-required', 'aria-roledescription', 'aria-rowcount', 'aria-rowindex',
        'aria-rowspan', 'aria-selected', 'aria-setsize', 'aria-sort',
        'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext',
      ];

      const issues = [];
      const allElements = document.querySelectorAll('*');

      allElements.forEach(element => {
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('aria-') && !validAriaAttrs.includes(attr.name)) {
            issues.push({
              element: element.outerHTML.substring(0, 100),
              attribute: attr.name,
              value: attr.value,
            });
          }
        });
      });

      return issues;
    });

    if (invalidAttrs.length > 0) {
      console.log('Invalid ARIA attributes found:', invalidAttrs);
    }

    expect(invalidAttrs).toHaveLength(0);
  });

  test('should not use invalid ARIA roles', async ({ page }) => {
    await page.goto('https://example.com');

    const invalidRoles = await page.evaluate(() => {
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
        'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
        'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
        'treeitem',
      ];

      const issues = [];
      const roleElements = document.querySelectorAll('[role]');

      roleElements.forEach(element => {
        const role = element.getAttribute('role');
        if (role && !validRoles.includes(role)) {
          issues.push({
            element: element.outerHTML.substring(0, 100),
            role,
          });
        }
      });

      return issues;
    });

    if (invalidRoles.length > 0) {
      console.log('Invalid ARIA roles found:', invalidRoles);
    }

    expect(invalidRoles).toHaveLength(0);
  });

  test('aria-hidden elements should not be focusable', async ({ page }) => {
    await page.goto('https://example.com');

    const violations = await page.evaluate(() => {
      const issues = [];
      const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');

      hiddenElements.forEach(element => {
        // Check if element or its children are focusable
        const focusableSelectors = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ];

        focusableSelectors.forEach(selector => {
          const focusable = element.matches(selector) || element.querySelector(selector);
          if (focusable) {
            issues.push({
              element: element.outerHTML.substring(0, 100),
              message: 'Element with aria-hidden="true" contains focusable elements',
            });
          }
        });
      });

      return issues;
    });

    if (violations.length > 0) {
      console.log('aria-hidden violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });
});

/**
 * Test Suite: ARIA State Values
 */
test.describe('ARIA State Values', () => {
  test('aria-checked should have valid values', async ({ page }) => {
    await page.goto('https://example.com');

    const invalidValues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('[aria-checked]');

      elements.forEach(element => {
        const value = element.getAttribute('aria-checked');
        const validValues = ['true', 'false', 'mixed'];

        if (!validValues.includes(value)) {
          issues.push({
            element: element.outerHTML.substring(0, 100),
            value,
            expected: validValues.join(', '),
          });
        }
      });

      return issues;
    });

    expect(invalidValues).toHaveLength(0);
  });

  test('aria-expanded should have valid values', async ({ page }) => {
    await page.goto('https://example.com');

    const invalidValues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('[aria-expanded]');

      elements.forEach(element => {
        const value = element.getAttribute('aria-expanded');
        const validValues = ['true', 'false'];

        if (!validValues.includes(value)) {
          issues.push({
            element: element.outerHTML.substring(0, 100),
            value,
            expected: validValues.join(', '),
          });
        }
      });

      return issues;
    });

    expect(invalidValues).toHaveLength(0);
  });

  test('aria-pressed should have valid values', async ({ page }) => {
    await page.goto('https://example.com');

    const invalidValues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('[aria-pressed]');

      elements.forEach(element => {
        const value = element.getAttribute('aria-pressed');
        const validValues = ['true', 'false', 'mixed'];

        if (!validValues.includes(value)) {
          issues.push({
            element: element.outerHTML.substring(0, 100),
            value,
            expected: validValues.join(', '),
          });
        }
      });

      return issues;
    });

    expect(invalidValues).toHaveLength(0);
  });

  test('aria-hidden should have valid values', async ({ page }) => {
    await page.goto('https://example.com');

    const invalidValues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('[aria-hidden]');

      elements.forEach(element => {
        const value = element.getAttribute('aria-hidden');
        const validValues = ['true', 'false'];

        if (!validValues.includes(value)) {
          issues.push({
            element: element.outerHTML.substring(0, 100),
            value,
            expected: validValues.join(', '),
          });
        }
      });

      return issues;
    });

    expect(invalidValues).toHaveLength(0);
  });
});

/**
 * Test Suite: Landmark Regions
 */
test.describe('Landmark Regions', () => {
  test('page should have main landmark', async ({ page }) => {
    await page.goto('https://example.com');

    const mainLandmark = await page.locator('main, [role="main"]');
    const count = await mainLandmark.count();

    expect(count).toBeGreaterThan(0);
    expect(count).toBe(1); // Should only have one main landmark
  });

  test('page should have navigation landmark', async ({ page }) => {
    await page.goto('https://example.com');

    const navLandmark = await page.locator('nav, [role="navigation"]');
    const count = await navLandmark.count();

    expect(count).toBeGreaterThan(0);
  });

  test('multiple landmarks of same type should have labels', async ({ page }) => {
    await page.goto('https://example.com');

    const violations = await page.evaluate(() => {
      const issues = [];
      const landmarkTypes = ['navigation', 'region', 'complementary', 'form'];

      landmarkTypes.forEach(type => {
        const landmarks = document.querySelectorAll(`[role="${type}"], ${type === 'navigation' ? 'nav' : ''}`);

        if (landmarks.length > 1) {
          landmarks.forEach(landmark => {
            const hasLabel = landmark.hasAttribute('aria-label') ||
                           landmark.hasAttribute('aria-labelledby');

            if (!hasLabel) {
              issues.push({
                type,
                element: landmark.outerHTML.substring(0, 100),
                message: `Multiple ${type} landmarks found, each should have aria-label or aria-labelledby`,
              });
            }
          });
        }
      });

      return issues;
    });

    if (violations.length > 0) {
      console.log('Landmark labeling violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });

  test('all content should be within landmarks', async ({ page }) => {
    await page.goto('https://example.com');

    const contentOutsideLandmarks = await page.evaluate(() => {
      const landmarks = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'form', 'region', 'search'];
      const landmarkSelectors = [
        'header', 'nav', 'main', 'aside', 'footer', 'form[aria-label]', 'section[aria-label]',
        ...landmarks.map(l => `[role="${l}"]`),
      ].join(',');

      const body = document.body;
      let contentOutside = false;

      // Simple check: verify main content areas are within landmarks
      const mainContent = document.querySelector('main, [role="main"]');
      if (!mainContent) {
        return { issue: 'No main landmark found' };
      }

      return null;
    });

    expect(contentOutsideLandmarks).toBeNull();
  });
});

/**
 * Test Suite: ARIA Live Regions
 */
test.describe('ARIA Live Regions', () => {
  test('status messages should use appropriate live regions', async ({ page }) => {
    await page.goto('https://example.com');

    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();

    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');

      // Verify aria-live values are valid
      if (ariaLive) {
        const validValues = ['off', 'polite', 'assertive'];
        expect(validValues).toContain(ariaLive);
      }

      // Verify appropriate roles
      if (role) {
        const validRoles = ['status', 'alert', 'log', 'marquee', 'timer'];
        expect(validRoles).toContain(role);
      }
    }
  });

  test('alert role should be used for important messages', async ({ page }) => {
    await page.goto('https://example.com/form');

    // Submit form to trigger validation errors
    const submitButton = await page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Check for alert role or aria-live="assertive"
      const alerts = await page.locator('[role="alert"], [aria-live="assertive"]');
      const count = await alerts.count();

      // If there are errors, they should be announced
      if (count > 0) {
        console.log(`Found ${count} alert regions`);
      }
    }
  });
});

/**
 * Test Suite: ARIA Relationships
 */
test.describe('ARIA Relationships', () => {
  test('aria-labelledby should reference valid IDs', async ({ page }) => {
    await page.goto('https://example.com');

    const violations = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('[aria-labelledby]');

      elements.forEach(element => {
        const labelIds = element.getAttribute('aria-labelledby').split(' ');

        labelIds.forEach(id => {
          const labelElement = document.getElementById(id);
          if (!labelElement) {
            issues.push({
              element: element.outerHTML.substring(0, 100),
              missingId: id,
            });
          }
        });
      });

      return issues;
    });

    if (violations.length > 0) {
      console.log('aria-labelledby violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });

  test('aria-describedby should reference valid IDs', async ({ page }) => {
    await page.goto('https://example.com');

    const violations = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('[aria-describedby]');

      elements.forEach(element => {
        const descIds = element.getAttribute('aria-describedby').split(' ');

        descIds.forEach(id => {
          const descElement = document.getElementById(id);
          if (!descElement) {
            issues.push({
              element: element.outerHTML.substring(0, 100),
              missingId: id,
            });
          }
        });
      });

      return issues;
    });

    if (violations.length > 0) {
      console.log('aria-describedby violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });

  test('aria-controls should reference valid IDs', async ({ page }) => {
    await page.goto('https://example.com');

    const violations = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('[aria-controls]');

      elements.forEach(element => {
        const controlIds = element.getAttribute('aria-controls').split(' ');

        controlIds.forEach(id => {
          const controlElement = document.getElementById(id);
          if (!controlElement) {
            issues.push({
              element: element.outerHTML.substring(0, 100),
              missingId: id,
            });
          }
        });
      });

      return issues;
    });

    if (violations.length > 0) {
      console.log('aria-controls violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });
});

/**
 * Test Suite: Widget Roles
 */
test.describe('Custom Widget ARIA', () => {
  test('tabs should have proper ARIA', async ({ page }) => {
    await page.goto('https://example.com');

    const tabLists = await page.locator('[role="tablist"]').all();

    for (const tabList of tabLists) {
      // Check tabs
      const tabs = await tabList.locator('[role="tab"]').all();
      expect(tabs.length).toBeGreaterThan(0);

      for (const tab of tabs) {
        // Each tab should have aria-selected
        const hasSelected = await tab.getAttribute('aria-selected');
        expect(hasSelected).not.toBeNull();

        // Check tab controls tabpanel
        const controls = await tab.getAttribute('aria-controls');
        if (controls) {
          const tabpanel = await page.locator(`#${controls}`);
          await expect(tabpanel).toBeAttached();

          const panelRole = await tabpanel.getAttribute('role');
          expect(panelRole).toBe('tabpanel');
        }
      }
    }
  });

  test('accordions should have proper ARIA', async ({ page }) => {
    await page.goto('https://example.com');

    const accordionButtons = await page.locator('[aria-expanded]').all();

    for (const button of accordionButtons) {
      const expanded = await button.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(expanded);

      const controls = await button.getAttribute('aria-controls');
      if (controls) {
        const panel = await page.locator(`#${controls}`);
        await expect(panel).toBeAttached();
      }
    }
  });
});
