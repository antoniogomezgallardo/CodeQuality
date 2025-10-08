# Visual Testing

## Purpose
Comprehensive guide to visual testing—detecting visual regressions and ensuring consistent UI appearance across browsers, devices, and screen sizes through automated screenshot comparison.

## Overview
Visual testing is:
- Automated UI appearance validation
- Screenshot comparison across versions
- Cross-browser visual consistency
- Responsive design verification
- Critical for maintaining brand consistency

## What is Visual Testing?

### Definition
Visual testing validates the visual appearance of user interfaces by capturing screenshots and comparing them against baseline images to detect unintended visual changes.

### Why Visual Testing Matters

```
Traditional Testing vs Visual Testing:

Functional Testing               Visual Testing
├── Button exists ✓             ├── Button looks correct ✓
├── Button is clickable ✓       ├── Colors are accurate ✓
├── Click triggers action ✓     ├── Layout is aligned ✓
└── Text is present ✓           ├── Fonts are correct ✓
                                └── Spacing is proper ✓

What Visual Testing Catches:
├── CSS regression bugs
├── Responsive layout breaks
├── Font rendering issues
├── Color inconsistencies
├── Alignment problems
├── Spacing errors
├── Image loading failures
└── Cross-browser differences
```

### Visual Testing Workflow

```
Visual Testing Process:

1. Baseline Creation
   ├── Capture initial screenshots
   ├── Review and approve
   └── Store as baseline

2. Test Execution
   ├── Capture new screenshots
   ├── Compare with baseline
   └── Generate diff images

3. Review Results
   ├── Analyze differences
   ├── Identify regressions
   └── Update baseline if intentional

4. Integration
   ├── Run in CI/CD pipeline
   ├── Block on failures
   └── Notify team
```

## Visual Testing Tools

### Percy (BrowserStack)

#### Setup and Configuration

```javascript
// percy.config.js
module.exports = {
  version: 2,
  discovery: {
    disableCache: false,
    networkIdleTimeout: 750
  },
  static: {
    // Static site configuration
    cleanUrls: true,
    include: ['**/*.html', '**/*.htm'],
    exclude: []
  },
  snapshot: {
    widths: [375, 768, 1280, 1920],
    minHeight: 1024,
    percyCSS: `
      /* Hide dynamic content */
      .timestamp { display: none; }
      .random-content { visibility: hidden; }
    `
  }
};
```

#### Percy with Playwright

```javascript
// __tests__/visual/homepage.visual.test.js
const { test } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

test.describe('Homepage Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should match homepage layout', async ({ page }) => {
    await percySnapshot(page, 'Homepage');
  });

  test('should match homepage on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await percySnapshot(page, 'Homepage - Mobile', {
      widths: [375]
    });
  });

  test('should match homepage on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await percySnapshot(page, 'Homepage - Tablet', {
      widths: [768]
    });
  });

  test('should match navigation menu', async ({ page }) => {
    await page.click('[data-testid="menu-button"]');
    await page.waitForSelector('[data-testid="menu-dropdown"]', {
      state: 'visible'
    });
    await percySnapshot(page, 'Navigation Menu Open');
  });

  test('should match login modal', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await page.waitForSelector('[data-testid="login-modal"]', {
      state: 'visible'
    });
    await percySnapshot(page, 'Login Modal');
  });

  test('should match dark mode', async ({ page }) => {
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Wait for theme transition
    await percySnapshot(page, 'Homepage - Dark Mode');
  });

  test('should match with user logged in', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await percySnapshot(page, 'Dashboard - Logged In');
  });
});
```

#### Percy with Cypress

```javascript
// cypress/e2e/visual/product-page.visual.cy.js
describe('Product Page Visual Tests', () => {
  beforeEach(() => {
    cy.visit('/products/1');
    cy.wait(1000); // Wait for animations
  });

  it('should match product page layout', () => {
    cy.percySnapshot('Product Page');
  });

  it('should match product gallery', () => {
    cy.get('[data-testid="product-gallery"]').should('be.visible');
    cy.percySnapshot('Product Gallery', {
      widths: [375, 768, 1280]
    });
  });

  it('should match product with reviews expanded', () => {
    cy.get('[data-testid="reviews-toggle"]').click();
    cy.get('[data-testid="reviews-section"]').should('be.visible');
    cy.percySnapshot('Product Reviews Expanded');
  });

  it('should match add to cart success', () => {
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="cart-notification"]').should('be.visible');
    cy.percySnapshot('Add to Cart Success');
  });

  it('should match out of stock state', () => {
    cy.visit('/products/999'); // Out of stock product
    cy.percySnapshot('Product - Out of Stock');
  });

  it('should match size selector', () => {
    cy.get('[data-testid="size-selector"]').should('be.visible');
    cy.percySnapshot('Size Selector', {
      scope: '[data-testid="size-selector"]'
    });
  });
});
```

### Chromatic (Storybook)

#### Storybook Configuration

```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  }
};

// .storybook/preview.js
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  },
  chromatic: {
    // Chromatic configuration
    delay: 300,
    diffThreshold: 0.2,
    viewports: [320, 768, 1280]
  }
};
```

#### Component Stories for Visual Testing

```javascript
// src/components/Button/Button.stories.js
import React from 'react';
import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    chromatic: {
      viewports: [320, 768, 1280]
    }
  }
};

// Primary button
export const Primary = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

// Secondary button
export const Secondary = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};

// Disabled state
export const Disabled = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true
  }
};

// Loading state
export const Loading = {
  args: {
    variant: 'primary',
    children: 'Loading...',
    loading: true
  }
};

// Different sizes
export const Small = {
  args: {
    variant: 'primary',
    size: 'small',
    children: 'Small Button'
  }
};

export const Large = {
  args: {
    variant: 'primary',
    size: 'large',
    children: 'Large Button'
  }
};

// With icon
export const WithIcon = {
  args: {
    variant: 'primary',
    children: 'Button with Icon',
    icon: 'arrow-right'
  }
};

// Long text
export const LongText = {
  args: {
    variant: 'primary',
    children: 'This is a very long button text that might wrap'
  }
};

// Focus state
export const Focused = {
  args: {
    variant: 'primary',
    children: 'Focused Button'
  },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    button.focus();
  }
};

// Hover state (using interaction testing)
export const Hovered = {
  args: {
    variant: 'primary',
    children: 'Hover State'
  },
  parameters: {
    pseudo: { hover: true }
  }
};
```

#### Complex Component Stories

```javascript
// src/components/Card/Card.stories.js
import React from 'react';
import { Card } from './Card';

export default {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    chromatic: {
      viewports: [375, 768, 1280]
    }
  }
};

const Template = (args) => <Card {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Card Title',
  description: 'This is a card description with some text content.',
  image: 'https://via.placeholder.com/300x200',
  footer: 'Card Footer'
};

export const WithoutImage = Template.bind({});
WithoutImage.args = {
  title: 'Card Without Image',
  description: 'This card has no image',
  footer: 'Footer'
};

export const LongContent = Template.bind({});
LongContent.args = {
  title: 'Card with Long Content',
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  footer: 'Long Footer Text Here'
};

export const Grid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
    <Card title="Card 1" description="First card" />
    <Card title="Card 2" description="Second card" />
    <Card title="Card 3" description="Third card" />
  </div>
);
Grid.parameters = {
  chromatic: { viewports: [1280] }
};
```

#### Chromatic CI Integration

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: 'build-storybook'
          autoAcceptChanges: 'main'
          exitZeroOnChanges: true
```

### BackstopJS

#### BackstopJS Configuration

```javascript
// backstop.config.js
module.exports = {
  id: 'visual-regression-tests',
  viewports: [
    {
      label: 'phone',
      width: 375,
      height: 667
    },
    {
      label: 'tablet',
      width: 768,
      height: 1024
    },
    {
      label: 'desktop',
      width: 1280,
      height: 800
    },
    {
      label: 'desktop-xl',
      width: 1920,
      height: 1080
    }
  ],
  scenarios: [
    {
      label: 'Homepage',
      url: 'http://localhost:3000',
      referenceUrl: '',
      readyEvent: '',
      readySelector: '',
      delay: 1000,
      hideSelectors: [
        '.timestamp',
        '.random-ad',
        '[data-testid="live-chat"]'
      ],
      removeSelectors: [
        '#analytics-pixel'
      ],
      hoverSelector: '',
      clickSelector: '',
      postInteractionWait: 0,
      selectors: ['document'],
      selectorExpansion: true,
      expect: 0,
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    },
    {
      label: 'Navigation Menu',
      url: 'http://localhost:3000',
      clickSelector: '[data-testid="menu-button"]',
      postInteractionWait: 500,
      selectors: ['[data-testid="menu-dropdown"]'],
      misMatchThreshold: 0.2
    },
    {
      label: 'Product Page',
      url: 'http://localhost:3000/products/1',
      delay: 2000,
      selectors: [
        '[data-testid="product-details"]',
        '[data-testid="product-gallery"]',
        '[data-testid="product-reviews"]'
      ]
    },
    {
      label: 'Checkout Form',
      url: 'http://localhost:3000/checkout',
      onBeforeScript: 'puppet/onBefore.js',
      onReadyScript: 'puppet/onReady.js',
      selectors: ['document']
    },
    {
      label: 'Button Hover State',
      url: 'http://localhost:3000',
      hoverSelector: '[data-testid="primary-button"]',
      postInteractionWait: 200,
      selectors: ['[data-testid="primary-button"]']
    }
  ],
  paths: {
    bitmaps_reference: 'backstop_data/bitmaps_reference',
    bitmaps_test: 'backstop_data/bitmaps_test',
    engine_scripts: 'backstop_data/engine_scripts',
    html_report: 'backstop_data/html_report',
    ci_report: 'backstop_data/ci_report'
  },
  report: ['browser', 'CI'],
  engine: 'puppeteer',
  engineOptions: {
    args: ['--no-sandbox']
  },
  asyncCaptureLimit: 5,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false
};
```

#### BackstopJS Scripts

```javascript
// backstop_data/engine_scripts/puppet/onBefore.js
module.exports = async (page, scenario, viewport) => {
  console.log('SCENARIO > ' + scenario.label);

  // Set cookies
  await page.setCookie({
    name: 'user_consent',
    value: 'accepted',
    domain: 'localhost'
  });

  // Set localStorage
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('language', 'en');
  });

  // Login for authenticated scenarios
  if (scenario.requiresAuth) {
    await page.goto('http://localhost:3000/login');
    await page.type('[name="email"]', 'test@example.com');
    await page.type('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await page.waitForNavigation();
  }
};

// backstop_data/engine_scripts/puppet/onReady.js
module.exports = async (page, scenario, viewport, isReference, browserContext) => {
  console.log('SCENARIO > ' + scenario.label);

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');

  // Wait for images to load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });

  // Remove animations
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `;
    document.head.appendChild(style);
  });

  // Stabilize dynamic content
  if (scenario.stabilizeContent) {
    await page.evaluate(() => {
      // Fix timestamps
      document.querySelectorAll('[data-timestamp]').forEach(el => {
        el.textContent = '2024-01-01 12:00:00';
      });

      // Fix random numbers
      Math.random = () => 0.5;
    });
  }
};
```

#### Running BackstopJS Tests

```javascript
// package.json scripts
{
  "scripts": {
    "backstop:reference": "backstop reference",
    "backstop:test": "backstop test",
    "backstop:approve": "backstop approve",
    "backstop:report": "backstop openReport"
  }
}
```

## Cross-Browser Visual Testing

### Browser Matrix Testing

```javascript
// __tests__/visual/cross-browser.visual.test.js
const { chromium, firefox, webkit } = require('playwright');
const percySnapshot = require('@percy/playwright');

const browsers = [
  { name: 'chromium', launch: chromium.launch },
  { name: 'firefox', launch: firefox.launch },
  { name: 'webkit', launch: webkit.launch }
];

describe('Cross-Browser Visual Tests', () => {
  browsers.forEach(({ name, launch }) => {
    describe(`Browser: ${name}`, () => {
      let browser;
      let page;

      beforeAll(async () => {
        browser = await launch();
      });

      afterAll(async () => {
        await browser.close();
      });

      beforeEach(async () => {
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
      });

      afterEach(async () => {
        await page.close();
      });

      test('should match homepage', async () => {
        await percySnapshot(page, `Homepage - ${name}`);
      });

      test('should match forms', async () => {
        await page.goto('http://localhost:3000/contact');
        await percySnapshot(page, `Contact Form - ${name}`);
      });

      test('should match tables', async () => {
        await page.goto('http://localhost:3000/data');
        await page.waitForSelector('table');
        await percySnapshot(page, `Data Table - ${name}`);
      });

      test('should match CSS Grid layouts', async () => {
        await page.goto('http://localhost:3000/gallery');
        await page.waitForLoadState('networkidle');
        await percySnapshot(page, `Gallery Grid - ${name}`);
      });

      test('should match Flexbox layouts', async () => {
        await page.goto('http://localhost:3000/dashboard');
        await percySnapshot(page, `Dashboard Flexbox - ${name}`);
      });
    });
  });
});
```

### Device Emulation

```javascript
// __tests__/visual/responsive.visual.test.js
const { test, devices } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

const deviceList = [
  'iPhone 12',
  'iPhone 12 Pro',
  'iPad Pro',
  'Pixel 5',
  'Galaxy S21',
  'Desktop Chrome'
];

test.describe('Responsive Visual Tests', () => {
  deviceList.forEach(deviceName => {
    test.describe(`Device: ${deviceName}`, () => {
      test.use({ ...devices[deviceName] });

      test('should match homepage', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await percySnapshot(page, `Homepage - ${deviceName}`);
      });

      test('should match navigation', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.click('[data-testid="menu-toggle"]');
        await percySnapshot(page, `Navigation - ${deviceName}`);
      });

      test('should match forms', async ({ page }) => {
        await page.goto('http://localhost:3000/signup');
        await percySnapshot(page, `Signup Form - ${deviceName}`);
      });
    });
  });

  test('should match custom breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 320, height: 568, name: 'Small Phone' },
      { width: 375, height: 667, name: 'Phone' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1280, height: 800, name: 'Desktop' },
      { width: 1920, height: 1080, name: 'Full HD' }
    ];

    for (const breakpoint of breakpoints) {
      await page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height
      });
      await page.goto('http://localhost:3000');
      await percySnapshot(page, `Homepage - ${breakpoint.name}`, {
        widths: [breakpoint.width]
      });
    }
  });
});
```

## Handling Dynamic Content

### Hiding Dynamic Elements

```javascript
// __tests__/visual/dynamic-content.visual.test.js
const { test } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

test.describe('Dynamic Content Handling', () => {
  test('should hide timestamps', async ({ page }) => {
    await page.goto('http://localhost:3000/news');

    await percySnapshot(page, 'News Page', {
      percyCSS: `
        .timestamp { visibility: hidden; }
        [data-timestamp] { visibility: hidden; }
        time { visibility: hidden; }
      `
    });
  });

  test('should hide random content', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await percySnapshot(page, 'Homepage', {
      percyCSS: `
        .random-ad { display: none; }
        .live-chat { display: none; }
        [data-random] { display: none; }
      `
    });
  });

  test('should stabilize animations', async ({ page }) => {
    await page.goto('http://localhost:3000/animations');

    // Pause all animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-play-state: paused !important;
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          transition-delay: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });

    await percySnapshot(page, 'Animations Paused');
  });

  test('should mock API data', async ({ page }) => {
    // Intercept API calls and return mock data
    await page.route('**/api/products', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Product 1', price: 100 },
          { id: 2, name: 'Product 2', price: 200 }
        ])
      });
    });

    await page.goto('http://localhost:3000/products');
    await page.waitForSelector('[data-testid="product-list"]');

    await percySnapshot(page, 'Products - Mocked Data');
  });

  test('should freeze time-based content', async ({ page }) => {
    // Set a fixed date
    await page.addInitScript(() => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...args);
          }
        }
        static now() {
          return mockDate.getTime();
        }
      };
    });

    await page.goto('http://localhost:3000/dashboard');
    await percySnapshot(page, 'Dashboard - Fixed Date');
  });
});
```

### Waiting for Stability

```javascript
// __tests__/visual/wait-strategies.visual.test.js
const { test } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

test.describe('Wait Strategies', () => {
  test('should wait for network idle', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Page - Network Idle');
  });

  test('should wait for specific elements', async ({ page }) => {
    await page.goto('http://localhost:3000/lazy-loading');

    // Wait for lazy-loaded images
    await page.waitForSelector('img[data-src]', { state: 'hidden' });
    await page.waitForSelector('img[src]');

    await percySnapshot(page, 'Lazy Loaded Images');
  });

  test('should wait for fonts to load', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for web fonts
    await page.evaluate(() => document.fonts.ready);

    await percySnapshot(page, 'Page - Fonts Loaded');
  });

  test('should wait for animations to complete', async ({ page }) => {
    await page.goto('http://localhost:3000/animated');

    await page.click('[data-testid="trigger-animation"]');

    // Wait for animation to complete (3 seconds)
    await page.waitForTimeout(3000);

    await percySnapshot(page, 'Animation Complete');
  });

  test('should wait for data to load', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Wait for loading spinner to disappear
    await page.waitForSelector('[data-testid="loading"]', {
      state: 'hidden'
    });

    // Wait for data to be displayed
    await page.waitForSelector('[data-testid="data-loaded"]');

    await percySnapshot(page, 'Dashboard - Data Loaded');
  });

  test('should use custom wait function', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for custom condition
    await page.waitForFunction(() => {
      const images = Array.from(document.images);
      return images.every(img => img.complete && img.naturalHeight > 0);
    });

    await percySnapshot(page, 'All Images Loaded');
  });
});
```

## Visual Testing in CI/CD

### GitHub Actions Integration

```yaml
# .github/workflows/visual-tests.yml
name: Visual Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: |
          npm start &
          npx wait-on http://localhost:3000

      - name: Run Percy tests
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
        run: npx percy exec -- npm run test:visual

      - name: Run BackstopJS tests
        run: |
          npm run backstop:reference
          npm run backstop:test

      - name: Upload BackstopJS report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: backstop-report
          path: backstop_data/html_report/

      - name: Comment PR with visual changes
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const percyBuildLink = process.env.PERCY_BUILD_LINK;
            if (percyBuildLink) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `## Visual Changes\n\nView the Percy build: ${percyBuildLink}`
              });
            }
```

### GitLab CI Integration

```yaml
# .gitlab-ci.yml
visual-tests:
  stage: test
  image: mcr.microsoft.com/playwright:latest
  services:
    - docker:dind
  before_script:
    - npm ci
    - npm run build
  script:
    - npm start &
    - npx wait-on http://localhost:3000
    - PERCY_TOKEN=$PERCY_TOKEN npx percy exec -- npm run test:visual
  artifacts:
    when: on_failure
    paths:
      - backstop_data/html_report/
    expire_in: 1 week
  only:
    - main
    - develop
    - merge_requests
```

## Visual Testing Best Practices

### 1. Baseline Management

```javascript
// scripts/update-baselines.js
const { execSync } = require('child_process');
const readline = require('readline');

async function updateBaselines() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Are you sure you want to update all baselines? (yes/no): ', (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'yes') {
        console.log('Updating baselines...');
        execSync('npm run backstop:approve', { stdio: 'inherit' });
        console.log('Baselines updated successfully!');
      } else {
        console.log('Baseline update cancelled.');
      }

      resolve();
    });
  });
}

updateBaselines();
```

### 2. Selective Visual Testing

```javascript
// __tests__/visual/selective.visual.test.js
const { test } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

// Only run visual tests on specific components
const VISUAL_TEST_COMPONENTS = process.env.VISUAL_TEST_COMPONENTS?.split(',') || [];

test.describe('Selective Visual Tests', () => {
  const components = [
    { name: 'button', url: '/storybook?path=/story/button' },
    { name: 'card', url: '/storybook?path=/story/card' },
    { name: 'modal', url: '/storybook?path=/story/modal' },
    { name: 'form', url: '/storybook?path=/story/form' }
  ];

  components.forEach(component => {
    const shouldRun = VISUAL_TEST_COMPONENTS.length === 0 ||
                      VISUAL_TEST_COMPONENTS.includes(component.name);

    (shouldRun ? test : test.skip)(`should match ${component.name}`, async ({ page }) => {
      await page.goto(`http://localhost:6006${component.url}`);
      await percySnapshot(page, component.name);
    });
  });
});
```

### 3. Performance Optimization

```javascript
// backstop.config.js with performance optimizations
module.exports = {
  // ... other config
  asyncCaptureLimit: 10, // Parallel screenshot capture
  asyncCompareLimit: 100, // Parallel comparison

  engineOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  },

  // Reduce scenarios during development
  scenarios: process.env.CI ?
    require('./scenarios/all.json') :
    require('./scenarios/critical.json')
};
```

### 4. Diff Threshold Configuration

```javascript
// Different thresholds for different scenarios
const scenarios = [
  {
    label: 'Logo',
    url: 'http://localhost:3000',
    selectors: ['[data-testid="logo"]'],
    misMatchThreshold: 0.01 // Very strict - 0.01%
  },
  {
    label: 'User Generated Content',
    url: 'http://localhost:3000/ugc',
    selectors: ['[data-testid="comments"]'],
    misMatchThreshold: 5 // More lenient - 5%
  },
  {
    label: 'Charts and Graphs',
    url: 'http://localhost:3000/analytics',
    selectors: ['[data-testid="chart"]'],
    misMatchThreshold: 2 // Moderate - 2%
  }
];
```

## Debugging Visual Tests

### Debug Mode

```javascript
// __tests__/visual/debug.visual.test.js
const { test } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

test.describe('Debug Visual Tests', () => {
  test('debug homepage with screenshots', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Take screenshot before interaction
    await page.screenshot({ path: 'debug-before.png' });

    await page.click('[data-testid="menu-button"]');

    // Take screenshot after interaction
    await page.screenshot({ path: 'debug-after.png' });

    // Take full page screenshot
    await page.screenshot({
      path: 'debug-fullpage.png',
      fullPage: true
    });

    await percySnapshot(page, 'Homepage Debug');
  });

  test('debug with video recording', async ({ page }) => {
    const context = await page.context();

    // Video is automatically recorded in Playwright
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="complex-interaction"]');

    await percySnapshot(page, 'Complex Interaction');

    // Video will be saved on test completion
  });

  test('debug with trace', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Start tracing
    await page.context().tracing.start({
      screenshots: true,
      snapshots: true
    });

    await page.click('[data-testid="button"]');

    // Stop tracing and save
    await page.context().tracing.stop({
      path: 'trace.zip'
    });

    await percySnapshot(page, 'With Trace');
  });
});
```

### Visual Diff Analysis

```javascript
// scripts/analyze-diffs.js
const fs = require('fs').promises;
const path = require('path');

async function analyzeDiffs() {
  const reportPath = 'backstop_data/html_report/config.js';
  const report = require(path.resolve(reportPath));

  const failures = report.tests.filter(test => test.status === 'fail');

  console.log(`\nVisual Regression Summary:`);
  console.log(`Total Tests: ${report.tests.length}`);
  console.log(`Passed: ${report.tests.filter(t => t.status === 'pass').length}`);
  console.log(`Failed: ${failures.length}\n`);

  if (failures.length > 0) {
    console.log('Failed Tests:');
    failures.forEach(test => {
      console.log(`\n  ${test.pair.label}`);
      console.log(`    Mismatch: ${test.pair.diff.misMatchPercentage}%`);
      console.log(`    Threshold: ${test.pair.diff.misMatchThreshold}%`);
      console.log(`    Dimensions: ${test.pair.diff.isSameDimensions ? 'Same' : 'Different'}`);
    });
  }
}

analyzeDiffs();
```

## Visual Testing Metrics

### Key Performance Indicators

```
Visual Testing KPIs:

Coverage Metrics:
├── Component Coverage: > 90%
├── Viewport Coverage: 100% (key breakpoints)
├── Browser Coverage: 100% (supported browsers)
└── State Coverage: > 80% (states per component)

Quality Metrics:
├── False Positive Rate: < 5%
├── Detection Accuracy: > 95%
├── Baseline Freshness: < 30 days
└── Test Execution Time: < 10 minutes

Change Detection:
├── Visual Changes Detected: Tracked
├── Breaking Changes: 0 tolerance
├── Intentional Changes: Documented
└── Regression Rate: < 1%
```

## Checklist

### Visual Testing Implementation Checklist

**Setup:**
- [ ] Choose visual testing tool
- [ ] Configure viewports and devices
- [ ] Set up baseline images
- [ ] Configure CI/CD integration
- [ ] Define diff thresholds
- [ ] Set up reporting

**Test Coverage:**
- [ ] Test all major pages
- [ ] Test responsive layouts
- [ ] Test interactive states
- [ ] Test cross-browser compatibility
- [ ] Test different themes
- [ ] Test loading states
- [ ] Test error states

**Dynamic Content:**
- [ ] Hide timestamps
- [ ] Stabilize animations
- [ ] Mock API responses
- [ ] Handle random content
- [ ] Wait for content loading
- [ ] Freeze time-based data

**Maintenance:**
- [ ] Regular baseline updates
- [ ] Review and approve changes
- [ ] Document visual changes
- [ ] Monitor false positives
- [ ] Optimize test execution
- [ ] Clean up old baselines

**Best Practices:**
- [ ] Use semantic selectors
- [ ] Implement wait strategies
- [ ] Configure appropriate thresholds
- [ ] Document expected changes
- [ ] Version control baselines
- [ ] Review changes in team

## References

### Standards and Guidelines
- **WCAG 2.1** - Web Content Accessibility Guidelines
- **ISO 9241** - Ergonomics of human-system interaction
- **Material Design** - Design system guidelines
- **Apple HIG** - Human Interface Guidelines

### Tools and Frameworks
- **Percy** - Visual testing platform
- **Chromatic** - Visual testing for Storybook
- **BackstopJS** - Visual regression testing
- **Playwright** - Browser automation
- **Cypress** - E2E testing framework

### Books and Resources
- "Visual Testing Handbook" - BrowserStack
- "Component-Driven Development" - Tom Coleman
- "Design Systems" - Alla Kholmatova

## Related Topics

- [Visual Regression Testing](visual-regression-testing.md) - Detailed regression strategies
- [E2E Testing](e2e-testing.md) - End-to-end testing
- [Component Testing](component-testing.md) - Component-level testing
- [Accessibility Testing](../06-quality-attributes/accessibility.md) - Accessibility validation

---

*Part of: [Test Levels](05-README.md)*
