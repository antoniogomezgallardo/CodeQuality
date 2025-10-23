# Accessibility Testing Quick Start Guide

Get started with accessibility testing in under 5 minutes.

## Installation

```bash
# Install all dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Quick Test (Recommended for First Time)

```bash
# Run axe-core tests on Chromium only
npx playwright test axe-automated-tests.spec.js --project=chromium
```

### All Automated Tests

```bash
# Run all Playwright tests
npm test

# Run specific test suites
npm run test:axe          # axe-core accessibility tests
npm run test:keyboard     # Keyboard navigation tests
npm run test:aria         # ARIA validation tests
```

### Pa11y Tests

```bash
# Run Pa11y CI (multi-page testing)
npm run pa11y

# Generate HTML report
npm run pa11y:report
```

### Lighthouse Tests

```bash
# Run Lighthouse accessibility audits
npm run lighthouse
```

### Color Contrast Tests

```bash
# Check color contrast ratios
npm run contrast
```

### Run Everything

```bash
# Run all automated tests
npm run test:all
```

## Test Configuration

### Update Test URLs

Edit the URLs in each test file:

**axe-automated-tests.spec.js**:

```javascript
await page.goto('https://your-site.com');
```

**pa11y-ci-config.json**:

```json
{
  "urls": ["https://your-site.com", "https://your-site.com/products"]
}
```

**lighthouse-accessibility.js**:

```javascript
const testUrls = [{ url: 'https://your-site.com', name: 'Homepage' }];
```

## Understanding Results

### Test Passes ✅

All tests pass means your site meets WCAG 2.1 Level AA standards for tested criteria.

### Test Failures ❌

Failures indicate accessibility issues that need fixing:

1. **Check the console output** for detailed error messages
2. **Review HTML reports** in `reports/` directory
3. **Prioritize by severity**: Critical > Serious > Moderate > Minor
4. **Fix issues** following WCAG guidelines
5. **Re-run tests** to verify fixes

## Common Issues and Fixes

### Missing Alt Text

```html
<!-- ❌ Bad -->
<img src="logo.png" />

<!-- ✅ Good -->
<img src="logo.png" alt="Company Logo" />

<!-- ✅ Decorative -->
<img src="decoration.png" alt="" />
```

### Missing Form Labels

```html
<!-- ❌ Bad -->
<input type="text" placeholder="Name" />

<!-- ✅ Good -->
<label for="name">Name</label>
<input id="name" type="text" />
```

### Poor Color Contrast

```css
/* ❌ Bad - 2.5:1 ratio */
color: #777;
background: #fff;

/* ✅ Good - 4.7:1 ratio */
color: #595959;
background: #fff;
```

### Missing ARIA Labels

```html
<!-- ❌ Bad -->
<button><i class="icon-close"></i></button>

<!-- ✅ Good -->
<button aria-label="Close dialog">
  <i class="icon-close"></i>
</button>
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:ci
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: accessibility-reports
          path: reports/
```

### GitLab CI

```yaml
accessibility-tests:
  image: mcr.microsoft.com/playwright:latest
  script:
    - npm ci
    - npm run test:ci
  artifacts:
    when: always
    paths:
      - reports/
```

## Manual Testing

Don't forget manual testing! Automated tools catch ~30% of issues.

### Keyboard Navigation (5 minutes)

1. Unplug your mouse
2. Navigate entire site using only Tab, Enter, Space, Arrow keys
3. Verify all interactive elements are reachable
4. Check focus indicators are visible

### Screen Reader Testing (15 minutes)

1. **Windows**: Install [NVDA](https://www.nvaccess.org/download/) (free)
2. **Mac**: Enable VoiceOver (`Cmd + F5`)
3. Navigate key pages listening to announcements
4. Verify content is understandable without seeing the screen

See `screen-reader-tests.md` for detailed scenarios.

## Reports Location

All test reports are saved to `reports/` directory:

```
reports/
├── playwright-report/     # Playwright HTML reports
├── pa11y-report.html      # Pa11y HTML report
├── lighthouse/            # Lighthouse reports
│   ├── homepage-report.html
│   └── summary.json
└── contrast/              # Color contrast reports
    └── example-com-contrast.html
```

## Troubleshooting

### Browsers not installed

```bash
npx playwright install
```

### Pa11y timeout errors

Increase timeout in `pa11y-ci-config.json`:

```json
{
  "defaults": {
    "timeout": 60000
  }
}
```

### Lighthouse errors

Ensure Chrome/Chromium is installed:

```bash
# On Ubuntu/Debian
sudo apt-get install chromium-browser
```

### False positives

Disable specific rules with justification:

```javascript
// In axe-automated-tests.spec.js
await new AxeBuilder({ page })
  .disableRules(['color-contrast']) // Third-party widget
  .analyze();
```

## Next Steps

1. ✅ Run tests on your actual site
2. ✅ Fix critical and serious violations
3. ✅ Integrate into CI/CD pipeline
4. ✅ Add to pre-commit hooks
5. ✅ Schedule manual testing
6. ✅ Train team on accessibility

## Resources

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **axe-core Rules**: https://github.com/dequelabs/axe-core/blob/master/doc/rule-descriptions.md
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/

## Support

For issues or questions:

1. Check `README.md` for detailed documentation
2. Review `screen-reader-tests.md` for manual testing
3. Consult WCAG guidelines for specific criteria
4. Review example code comments for implementation details

---

**Remember**: Accessibility is not a one-time task. Make it part of your development process!
