# Visual Testing Examples

## Overview

Visual testing (also known as visual regression testing) is a quality assurance technique that verifies the visual appearance of user interfaces by comparing screenshots against baseline images. This directory contains production-ready examples for implementing visual testing using industry-standard tools.

## Why Visual Testing?

Visual testing helps detect:

- **UI Regressions**: Unintended layout changes, CSS bugs, or styling issues
- **Cross-browser Issues**: Rendering differences across browsers
- **Responsive Design Problems**: Layout issues at different viewport sizes
- **Accessibility Violations**: Visual contrast and spacing issues
- **Component Variations**: Ensuring component states render correctly
- **Integration Issues**: CSS conflicts, z-index problems, overlapping elements

## Tools Covered

### 1. Percy.io

Percy is a cloud-based visual testing platform that integrates with CI/CD pipelines.

**Strengths:**

- Automated cross-browser testing
- Intelligent diff algorithms
- Parallel test execution
- Easy CI/CD integration
- Team collaboration features

**Use Cases:**

- Full application visual testing
- Component library testing
- Responsive design validation

### 2. Chromatic (Storybook)

Chromatic is a visual testing service specifically designed for Storybook components.

**Strengths:**

- Deep Storybook integration
- Component-level testing
- Interaction testing with play functions
- UI Review workflow
- Component history tracking

**Use Cases:**

- Design system validation
- Component library testing
- UI component documentation

### 3. BackstopJS

BackstopJS is an open-source visual regression testing framework.

**Strengths:**

- Self-hosted solution
- No cloud dependencies
- Highly configurable
- Scenario-based testing
- Docker support

**Use Cases:**

- Privacy-sensitive projects
- Custom workflow requirements
- Budget-conscious teams

### 4. Playwright Visual Comparison

Playwright's built-in visual testing capabilities using screenshot comparison.

**Strengths:**

- No additional dependencies
- Fast local testing
- Integrated with existing test suite
- Customizable thresholds
- Cross-browser support

**Use Cases:**

- Teams already using Playwright
- Simple visual regression needs
- E2E tests with visual validation

## Setup Instructions

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install
```

### Percy Setup

1. Create a Percy account at https://percy.io
2. Create a new project and obtain your `PERCY_TOKEN`
3. Set environment variable:

```bash
# Linux/Mac
export PERCY_TOKEN=your_percy_token_here

# Windows
set PERCY_TOKEN=your_percy_token_here

# Or add to .env file
echo "PERCY_TOKEN=your_percy_token_here" >> .env
```

4. Run Percy tests:

```bash
npm run test:percy
```

### Chromatic Setup

1. Create a Chromatic account at https://www.chromatic.com
2. Link your repository and obtain your `PROJECT_TOKEN`
3. Set environment variable:

```bash
# Linux/Mac
export CHROMATIC_PROJECT_TOKEN=your_token_here

# Windows
set CHROMATIC_PROJECT_TOKEN=your_token_here
```

4. Run Chromatic tests:

```bash
npm run chromatic
```

### BackstopJS Setup

No external account required. BackstopJS runs completely locally.

1. Initialize BackstopJS:

```bash
npm run backstop:init
```

2. Create reference screenshots:

```bash
npm run backstop:reference
```

3. Run visual tests:

```bash
npm run backstop:test
```

4. Approve changes:

```bash
npm run backstop:approve
```

### Playwright Visual Testing Setup

Playwright visual testing is included with the Playwright installation.

1. Generate baseline screenshots:

```bash
npm run test:visual -- --update-snapshots
```

2. Run visual tests:

```bash
npm run test:visual
```

## Running the Examples

### All Visual Tests

```bash
# Run all visual testing examples
npm run test:visual:all
```

### Individual Tool Tests

```bash
# Percy tests
npm run test:percy

# Chromatic tests
npm run chromatic

# BackstopJS tests
npm run backstop:test

# Playwright visual tests
npm run test:playwright-visual
```

### CI/CD Integration

```bash
# Run in CI mode (fails on differences)
npm run test:visual:ci
```

## Best Practices

### 1. Baseline Management

- **Version Control**: Commit baseline images to version control for team consistency
- **Update Strategy**: Update baselines only when changes are intentional
- **Review Process**: Always review visual diffs before approving changes
- **Branch Strategy**: Consider separate baselines for feature branches

```bash
# Update baselines after intentional UI changes
npm run backstop:approve
npm run test:visual -- --update-snapshots
```

### 2. Handling Dynamic Content

Dynamic content (timestamps, ads, random data) can cause false positives.

**Strategies:**

- Hide dynamic elements using CSS
- Mock APIs to return consistent data
- Use visual-helpers.js utilities
- Configure ignore regions in tool configs

```javascript
// Example: Hiding dynamic content
await hideDynamicContent(page, ['.timestamp', '.advertisement', '.random-banner']);
```

### 3. Viewport Configuration

Test at multiple viewport sizes to catch responsive design issues.

**Recommended Viewports:**

- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1920x1080 (HD Desktop)
- **Large Desktop**: 2560x1440 (QHD)

```javascript
const viewports = [
  { width: 375, height: 667, label: 'mobile' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1920, height: 1080, label: 'desktop' }
];
```

### 4. Dealing with Animations

Animations can cause flickering in visual tests.

**Strategies:**

- Disable animations globally in test mode
- Wait for animations to complete
- Use CSS to disable transitions
- Configure animation wait times

```javascript
// Disable animations in test mode
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
});
```

### 5. Cross-Browser Testing

Different browsers render content slightly differently.

**Best Practices:**

- Test on all target browsers (Chrome, Firefox, Safari, Edge)
- Use cloud services (Percy, BrowserStack) for consistent environments
- Set appropriate pixel diff thresholds
- Maintain separate baselines per browser if needed

### 6. Performance Optimization

Visual tests can be slow. Optimize for speed:

- **Parallel Execution**: Run tests in parallel when possible
- **Selective Testing**: Only test changed components
- **Smart Baselines**: Update baselines incrementally
- **Caching**: Use Docker containers for consistent environments

```bash
# Run tests in parallel (Playwright)
npm run test:visual -- --workers=4
```

### 7. Threshold Configuration

Set appropriate pixel difference thresholds to avoid false positives.

**Guidelines:**

- **Strict (0-0.01%)**: Critical brand pages, legal content
- **Moderate (0.01-0.1%)**: Standard application pages
- **Lenient (0.1-1%)**: Dynamic content areas

```javascript
// Playwright threshold example
await expect(page).toHaveScreenshot({
  maxDiffPixels: 100, // Allow up to 100 pixels difference
  maxDiffPixelRatio: 0.01 // Allow 1% difference
});
```

### 8. Naming Conventions

Use clear, consistent naming for snapshots:

```javascript
// Good naming
await percySnapshot(page, 'HomePage - Desktop - Logged In');
await percySnapshot(page, 'ProductDetail - Mobile - Out of Stock');

// Bad naming
await percySnapshot(page, 'test1');
await percySnapshot(page, 'page');
```

### 9. CI/CD Integration Best Practices

**GitHub Actions Example:**

```yaml
name: Visual Testing

on: [pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Percy tests
        run: npm run test:percy
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

      - name: Run Playwright visual tests
        run: npm run test:playwright-visual

      - name: Upload diff artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: visual-diffs
          path: |
            backstop_data/bitmaps_test
            test-results/
```

### 10. Debugging Visual Test Failures

When visual tests fail:

1. **Review the Diff**: Look at the visual diff images
2. **Check Recent Changes**: Review recent CSS/HTML changes
3. **Verify Environment**: Ensure consistent test environment
4. **Check for Flakiness**: Re-run to rule out timing issues
5. **Validate Intentional Changes**: Confirm if change was intentional

```bash
# Open BackstopJS report
npm run backstop:open

# View Playwright trace
npx playwright show-trace trace.zip
```

## File Structure

```
examples/visual-testing/
├── README.md                          # This file
├── package.json                       # Dependencies and scripts
├── .percyrc                          # Percy configuration
├── backstopjs-config.json            # BackstopJS configuration
├── percy-visual-tests.spec.js        # Percy.io examples
├── chromatic-storybook.stories.js    # Chromatic/Storybook examples
├── playwright-visual.spec.js         # Playwright visual testing
├── visual-helpers.js                 # Shared utility functions
├── screenshots/                       # Baseline screenshots (Playwright)
│   ├── percy-visual-tests.spec.js/
│   └── playwright-visual.spec.js/
├── backstop_data/                    # BackstopJS data
│   ├── bitmaps_reference/           # Reference screenshots
│   ├── bitmaps_test/                # Test screenshots
│   └── html_report/                 # BackstopJS reports
└── .storybook/                       # Storybook configuration (if using)
    └── main.js
```

## Common Issues and Solutions

### Issue: Flaky Tests

**Symptoms**: Tests pass/fail inconsistently

**Solutions:**

- Wait for fonts to load before capturing
- Disable animations
- Wait for images to load
- Use fixed timestamps in test data
- Increase wait times for slow-loading content

### Issue: Font Rendering Differences

**Symptoms**: Text appears slightly different across runs

**Solutions:**

- Use web-safe fonts in tests
- Wait for custom fonts to load
- Use font loading utilities
- Consider system font differences in CI

```javascript
// Wait for fonts to load
await waitForFontsLoaded(page);
```

### Issue: Large Diff Files

**Symptoms**: Slow test execution, large repository size

**Solutions:**

- Use cloud services (Percy, Chromatic)
- Compress images
- Use Git LFS for large files
- Only commit necessary baselines

### Issue: Color Profile Differences

**Symptoms**: Colors appear slightly different

**Solutions:**

- Use consistent color profiles in CI
- Disable color profile embedding
- Use sRGB color space
- Adjust pixel difference thresholds

## Resources

### Documentation

- [Percy Documentation](https://docs.percy.io/)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [BackstopJS GitHub](https://github.com/garris/BackstopJS)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)

### Related Standards

- **WCAG 2.1**: Web Content Accessibility Guidelines
- **ISO 25010**: Software Quality Characteristics
- **IEEE 829**: Test Documentation Standard

### Additional Reading

- [Visual Regression Testing Best Practices](https://percy.io/blog/visual-testing-best-practices)
- [Storybook Visual Testing](https://storybook.js.org/docs/react/writing-tests/visual-testing)
- [Cross-Browser Testing Strategies](https://web.dev/cross-browser-testing/)

## Contributing

When adding new visual test examples:

1. Follow existing naming conventions
2. Include comprehensive comments
3. Add error handling
4. Document any external dependencies
5. Update this README with new patterns
6. Ensure examples are production-ready

## Support

For issues or questions:

- Review this README and inline code comments
- Check tool-specific documentation
- Review GitHub issues for known problems
- Consult the Code Quality Documentation main README

---

**Last Updated**: 2025-10-08
**Maintained by**: Code Quality Documentation Project
**Standards**: IEEE 829, ISO 25010, WCAG 2.1
