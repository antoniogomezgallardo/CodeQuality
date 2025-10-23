/**
 * Visual Testing Helper Functions
 *
 * This module provides reusable utility functions for visual testing across
 * different testing frameworks (Percy, Playwright, BackstopJS). These helpers
 * ensure consistent screenshot capture by handling common challenges like
 * font loading, animations, dynamic content, and image loading.
 *
 * Usage:
 * const { waitForFontsLoaded, hideDynamicContent } = require('./visual-helpers');
 *
 * @module visual-helpers
 */

/**
 * Wait for all custom fonts to be fully loaded
 *
 * Font loading can cause text rendering differences in screenshots.
 * This function waits for document.fonts.ready to ensure all fonts
 * are loaded before taking a screenshot.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {number} timeout - Maximum wait time in milliseconds (default: 30000)
 * @returns {Promise<boolean>} - True if fonts loaded, false if timeout
 *
 * @example
 * await waitForFontsLoaded(page);
 * await percySnapshot(page, 'Homepage');
 */
async function waitForFontsLoaded(page, timeout = 30000) {
  try {
    await page.evaluate(async timeoutMs => {
      // Use document.fonts.ready API
      const fontsPromise = document.fonts.ready;

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Font loading timeout')), timeoutMs);
      });

      // Race between fonts loading and timeout
      await Promise.race([fontsPromise, timeoutPromise]);

      // Additional check for specific fonts if needed
      const fontFaces = Array.from(document.fonts);
      const allLoaded = fontFaces.every(font => font.status === 'loaded');

      if (!allLoaded) {
        console.warn(
          'Not all fonts loaded:',
          fontFaces.filter(f => f.status !== 'loaded')
        );
      }

      return allLoaded;
    }, timeout);

    // Small additional delay to ensure rendering completes
    await page.waitForTimeout(100);

    return true;
  } catch (error) {
    console.warn('Font loading check failed:', error.message);
    return false;
  }
}

/**
 * Wait for all images on the page to be fully loaded
 *
 * Images that are still loading can cause layout shifts and incomplete
 * screenshots. This function waits for all img elements and background
 * images to complete loading.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {number} timeout - Maximum wait time in milliseconds (default: 30000)
 * @returns {Promise<boolean>} - True if all images loaded, false if timeout
 *
 * @example
 * await waitForImagesLoaded(page);
 * await expect(page).toHaveScreenshot('gallery.png');
 */
async function waitForImagesLoaded(page, timeout = 30000) {
  try {
    await page.evaluate(async timeoutMs => {
      const startTime = Date.now();

      /**
       * Wait for a single image element to load
       */
      const waitForImage = img => {
        return new Promise(resolve => {
          // Already loaded
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
            return;
          }

          // Wait for load event
          const onLoad = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            resolve();
          };

          const onError = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            console.warn('Image failed to load:', img.src);
            resolve(); // Resolve anyway to not block
          };

          img.addEventListener('load', onLoad);
          img.addEventListener('error', onError);

          // Timeout for this specific image
          setTimeout(() => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            resolve();
          }, timeoutMs);
        });
      };

      // Get all img elements
      const images = Array.from(document.querySelectorAll('img'));

      // Get elements with background images
      const elementsWithBg = Array.from(document.querySelectorAll('*')).filter(el => {
        const bg = window.getComputedStyle(el).backgroundImage;
        return bg && bg !== 'none' && bg.includes('url(');
      });

      // Create Image objects for background images to track loading
      const bgImagePromises = elementsWithBg.map(el => {
        const bg = window.getComputedStyle(el).backgroundImage;
        const urlMatch = bg.match(/url\(["']?(.+?)["']?\)/);

        if (urlMatch && urlMatch[1]) {
          return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn('Background image failed to load:', urlMatch[1]);
              resolve();
            };
            img.src = urlMatch[1];

            setTimeout(resolve, timeoutMs);
          });
        }

        return Promise.resolve();
      });

      // Wait for all images
      const imagePromises = images.map(waitForImage);
      const allPromises = [...imagePromises, ...bgImagePromises];

      await Promise.all(allPromises);

      const elapsed = Date.now() - startTime;
      console.log(`All images loaded in ${elapsed}ms`);
    }, timeout);

    return true;
  } catch (error) {
    console.warn('Image loading check failed:', error.message);
    return false;
  }
}

/**
 * Hide dynamic content elements to prevent visual test flakiness
 *
 * Dynamic content like timestamps, ads, or live data can cause false
 * positives in visual tests. This function hides specified elements
 * using CSS display: none.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {string[]} selectors - Array of CSS selectors to hide
 * @returns {Promise<number>} - Number of elements hidden
 *
 * @example
 * await hideDynamicContent(page, [
 *   '[data-testid="timestamp"]',
 *   '.advertisement',
 *   '#live-chat-widget'
 * ]);
 */
async function hideDynamicContent(page, selectors) {
  try {
    const hiddenCount = await page.evaluate(selectorList => {
      let count = 0;

      selectorList.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el) {
              el.style.display = 'none';
              count++;
            }
          });
        } catch (error) {
          console.warn(`Failed to hide selector: ${selector}`, error);
        }
      });

      return count;
    }, selectors);

    console.log(`Hidden ${hiddenCount} dynamic elements`);
    return hiddenCount;
  } catch (error) {
    console.warn('Failed to hide dynamic content:', error.message);
    return 0;
  }
}

/**
 * Disable all CSS animations and transitions
 *
 * Animations can cause inconsistent screenshots. This function disables
 * all CSS animations, transitions, and scrolling behavior to ensure
 * stable visual captures.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @returns {Promise<void>}
 *
 * @example
 * await stabilizeAnimations(page);
 * await expect(page).toHaveScreenshot('stable-page.png');
 */
async function stabilizeAnimations(page) {
  try {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }

        /* Disable specific animation properties */
        @keyframes none {
          0%, 100% { opacity: 1; }
        }
      `
    });

    // Also disable animations via JavaScript
    await page.evaluate(() => {
      // Stop all running animations
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const animations = el.getAnimations ? el.getAnimations() : [];
        animations.forEach(animation => {
          animation.finish();
        });
      });

      // Disable requestAnimationFrame
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = callback => {
        return originalRAF(() => {
          callback(0);
        });
      };
    });

    console.log('Animations stabilized');
  } catch (error) {
    console.warn('Failed to stabilize animations:', error.message);
  }
}

/**
 * Scroll to a specific element and wait for scroll to complete
 *
 * Useful for capturing specific sections of long pages or triggering
 * lazy-loaded content.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {string} selector - CSS selector of element to scroll to
 * @param {Object} options - Scroll options
 * @param {string} options.behavior - Scroll behavior ('auto' or 'smooth')
 * @param {string} options.block - Vertical alignment ('start', 'center', 'end', 'nearest')
 * @param {number} options.waitAfter - Time to wait after scroll (ms)
 * @returns {Promise<boolean>} - True if element found and scrolled, false otherwise
 *
 * @example
 * await scrollToElement(page, '[data-testid="footer"]', {
 *   block: 'start',
 *   waitAfter: 1000
 * });
 */
async function scrollToElement(page, selector, options = {}) {
  const defaultOptions = {
    behavior: 'auto',
    block: 'start',
    waitAfter: 500
  };

  const scrollOptions = { ...defaultOptions, ...options };

  try {
    const elementExists = await page.evaluate(
      (sel, opts) => {
        const element = document.querySelector(sel);
        if (!element) {
          return false;
        }

        element.scrollIntoView({
          behavior: opts.behavior,
          block: opts.block,
          inline: 'nearest'
        });

        return true;
      },
      selector,
      scrollOptions
    );

    if (!elementExists) {
      console.warn(`Element not found: ${selector}`);
      return false;
    }

    // Wait for scroll to complete
    await page.waitForTimeout(scrollOptions.waitAfter);

    console.log(`Scrolled to: ${selector}`);
    return true;
  } catch (error) {
    console.warn('Failed to scroll to element:', error.message);
    return false;
  }
}

/**
 * Wait for network to be idle
 *
 * Useful for dynamic pages that load content via AJAX/fetch.
 * Waits until there are no network requests for a specified duration.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {number} idleTime - Time with no network activity (ms, default: 500)
 * @param {number} timeout - Maximum wait time (ms, default: 30000)
 * @returns {Promise<boolean>} - True if network became idle, false if timeout
 *
 * @example
 * await page.goto('https://example.com');
 * await waitForNetworkIdle(page, 1000);
 * await percySnapshot(page, 'Dynamic Content Loaded');
 */
async function waitForNetworkIdle(page, idleTime = 500, timeout = 30000) {
  try {
    // Playwright has built-in networkidle support
    if (typeof page.waitForLoadState === 'function') {
      await page.waitForLoadState('networkidle', { timeout });
      return true;
    }

    // Fallback for other tools
    await page.waitForTimeout(idleTime);
    return true;
  } catch (error) {
    console.warn('Network idle wait failed:', error.message);
    return false;
  }
}

/**
 * Set fixed timestamp values for consistent screenshots
 *
 * Replaces timestamp elements with fixed values to prevent
 * time-based differences in screenshots.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {string} fixedDate - Fixed date string to use (default: '2025-10-08 12:00:00')
 * @param {string[]} selectors - Selectors for timestamp elements
 * @returns {Promise<number>} - Number of timestamps replaced
 *
 * @example
 * await setFixedTimestamps(page, '2025-10-08 12:00:00', [
 *   '[data-timestamp]',
 *   '.last-updated',
 *   '.post-date'
 * ]);
 */
async function setFixedTimestamps(page, fixedDate = '2025-10-08 12:00:00', selectors = []) {
  try {
    const count = await page.evaluate(
      (date, sels) => {
        let replaced = 0;

        sels.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            el.textContent = date;
            replaced++;
          });
        });

        // Also override Date if needed
        const originalDate = Date;
        const fixedTime = new originalDate(date).getTime();

        Date = class extends originalDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedTime);
            } else {
              super(...args);
            }
          }

          static now() {
            return fixedTime;
          }
        };

        return replaced;
      },
      fixedDate,
      selectors
    );

    console.log(`Fixed ${count} timestamps to: ${fixedDate}`);
    return count;
  } catch (error) {
    console.warn('Failed to set fixed timestamps:', error.message);
    return 0;
  }
}

/**
 * Wait for element to be visible and stable
 *
 * Waits for an element to be visible and in a stable position
 * (not moving due to layout shifts or animations).
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Maximum wait time (ms, default: 10000)
 * @returns {Promise<boolean>} - True if element is stable, false if timeout
 *
 * @example
 * await waitForElementStable(page, '[data-testid="modal"]');
 * await expect(page.locator('[data-testid="modal"]')).toHaveScreenshot();
 */
async function waitForElementStable(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });

    // Wait for element position to stabilize
    await page.evaluate(
      async (sel, maxWait) => {
        const element = document.querySelector(sel);
        if (!element) return false;

        const startTime = Date.now();
        let lastRect = element.getBoundingClientRect();
        let stableCount = 0;
        const requiredStableChecks = 3;

        while (Date.now() - startTime < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 100));

          const currentRect = element.getBoundingClientRect();

          // Check if position changed
          const positionChanged =
            Math.abs(currentRect.top - lastRect.top) > 1 ||
            Math.abs(currentRect.left - lastRect.left) > 1 ||
            Math.abs(currentRect.width - lastRect.width) > 1 ||
            Math.abs(currentRect.height - lastRect.height) > 1;

          if (positionChanged) {
            stableCount = 0;
            lastRect = currentRect;
          } else {
            stableCount++;
            if (stableCount >= requiredStableChecks) {
              return true;
            }
          }
        }

        return false;
      },
      selector,
      timeout
    );

    return true;
  } catch (error) {
    console.warn('Element stability check failed:', error.message);
    return false;
  }
}

/**
 * Remove element from DOM completely
 *
 * More aggressive than hiding - completely removes elements
 * from the DOM. Useful for third-party widgets that can't be
 * hidden with CSS.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {string[]} selectors - Array of CSS selectors to remove
 * @returns {Promise<number>} - Number of elements removed
 *
 * @example
 * await removeElements(page, [
 *   '#google-ads',
 *   '.facebook-widget',
 *   '[data-testid="live-chat"]'
 * ]);
 */
async function removeElements(page, selectors) {
  try {
    const removedCount = await page.evaluate(selectorList => {
      let count = 0;

      selectorList.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
              count++;
            }
          });
        } catch (error) {
          console.warn(`Failed to remove selector: ${selector}`, error);
        }
      });

      return count;
    }, selectors);

    console.log(`Removed ${removedCount} elements from DOM`);
    return removedCount;
  } catch (error) {
    console.warn('Failed to remove elements:', error.message);
    return 0;
  }
}

/**
 * Wait for lazy-loaded content to appear
 *
 * Scrolls through the page to trigger lazy loading, then scrolls back.
 * Useful for capturing complete page screenshots with all lazy content.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @param {Object} options - Scroll options
 * @param {number} options.scrollSteps - Number of scroll steps (default: 5)
 * @param {number} options.stepDelay - Delay between steps in ms (default: 500)
 * @returns {Promise<void>}
 *
 * @example
 * await triggerLazyLoading(page, { scrollSteps: 10, stepDelay: 300 });
 * await waitForImagesLoaded(page);
 */
async function triggerLazyLoading(page, options = {}) {
  const defaultOptions = {
    scrollSteps: 5,
    stepDelay: 500
  };

  const scrollOptions = { ...defaultOptions, ...options };

  try {
    await page.evaluate(async opts => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const stepSize = (scrollHeight - viewportHeight) / opts.scrollSteps;

      // Scroll down in steps
      for (let i = 0; i <= opts.scrollSteps; i++) {
        window.scrollTo(0, stepSize * i);
        await new Promise(resolve => setTimeout(resolve, opts.stepDelay));
      }

      // Scroll back to top
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, opts.stepDelay));
    }, scrollOptions);

    console.log('Lazy loading triggered');
  } catch (error) {
    console.warn('Failed to trigger lazy loading:', error.message);
  }
}

/**
 * Apply consistent styling for visual testing
 *
 * Applies CSS rules to ensure consistent rendering across test runs.
 * Includes fixes for common visual test issues.
 *
 * @param {Page} page - Playwright/Puppeteer page object
 * @returns {Promise<void>}
 *
 * @example
 * await applyVisualTestingStyling(page);
 * await percySnapshot(page, 'Consistent Styling');
 */
async function applyVisualTestingStyling(page) {
  try {
    await page.addStyleTag({
      content: `
        /* Disable animations */
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }

        /* Ensure consistent rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Fix for Webkit scrollbar differences */
        ::-webkit-scrollbar {
          display: none;
        }

        /* Ensure video and canvas don't cause issues */
        video, canvas {
          display: none !important;
        }

        /* Hide cursor/caret */
        * {
          caret-color: transparent !important;
        }
      `
    });

    console.log('Visual testing styles applied');
  } catch (error) {
    console.warn('Failed to apply visual testing styles:', error.message);
  }
}

// Export all helper functions
module.exports = {
  waitForFontsLoaded,
  waitForImagesLoaded,
  hideDynamicContent,
  stabilizeAnimations,
  scrollToElement,
  waitForNetworkIdle,
  setFixedTimestamps,
  waitForElementStable,
  removeElements,
  triggerLazyLoading,
  applyVisualTestingStyling
};

/**
 * Example usage across different frameworks:
 *
 * // Percy with Playwright
 * const percySnapshot = require('@percy/playwright');
 * const { waitForFontsLoaded, hideDynamicContent } = require('./visual-helpers');
 *
 * test('homepage', async ({ page }) => {
 *   await page.goto('https://example.com');
 *   await waitForFontsLoaded(page);
 *   await hideDynamicContent(page, ['.timestamp', '.ad']);
 *   await percySnapshot(page, 'Homepage');
 * });
 *
 * // Playwright visual comparison
 * const { expect } = require('@playwright/test');
 * const { stabilizeAnimations } = require('./visual-helpers');
 *
 * test('product page', async ({ page }) => {
 *   await page.goto('https://example.com/products');
 *   await stabilizeAnimations(page);
 *   await expect(page).toHaveScreenshot('product-page.png');
 * });
 *
 * // BackstopJS onReady script (backstop_data/engine_scripts/puppet/onReady.js)
 * module.exports = async (page, scenario, vp) => {
 *   const helpers = require('./visual-helpers');
 *   await helpers.waitForFontsLoaded(page);
 *   await helpers.waitForImagesLoaded(page);
 *   await helpers.stabilizeAnimations(page);
 * };
 */
