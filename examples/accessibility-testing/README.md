# Accessibility Testing Examples

This directory contains comprehensive accessibility testing examples demonstrating WCAG 2.1 AA compliance validation using industry-standard tools and techniques.

## 📋 Examples Included

### Automated Testing
- **axe-core Integration**: Full page and component-level accessibility scanning
- **Pa11y CI**: Multi-page automated accessibility testing
- **Lighthouse**: Programmatic accessibility score validation
- **Color Contrast Checker**: Automated WCAG AA/AAA contrast validation
- **ARIA Validator**: ARIA attribute and role validation

### Manual Testing
- **Keyboard Navigation Tests**: Tab order, focus management, shortcuts
- **Screen Reader Testing Guide**: NVDA, JAWS, VoiceOver test scenarios

### Utilities
- **Accessibility Helpers**: Reusable test patterns and custom matchers

## 🎯 WCAG 2.1 Coverage

These examples test compliance with WCAG 2.1 Level AA, covering:

### Perceivable
- Text alternatives for non-text content
- Captions and audio descriptions
- Adaptable content structure
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Visual presentation and spacing

### Operable
- Keyboard accessibility
- Focus order and visibility
- Navigation mechanisms
- Input modalities

### Understandable
- Readable and predictable content
- Input assistance and error identification
- Consistent navigation

### Robust
- Valid HTML and ARIA
- Name, role, value for UI components
- Status messages

## 📚 Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Automated Tests

```bash
# Run axe-core tests with Playwright
npx playwright test axe-automated-tests.spec.js

# Run Pa11y CI
npx pa11y-ci

# Run Lighthouse accessibility audit
node lighthouse-accessibility.js

# Run keyboard navigation tests
npx playwright test keyboard-navigation.spec.js

# Run ARIA validator tests
npx playwright test aria-validator.spec.js

# Run color contrast checker
node color-contrast-checker.js
```

### Run Tests by WCAG Level

```bash
# WCAG 2.0 Level A only
npx playwright test axe-automated-tests.spec.js --grep "WCAG 2.0 A"

# WCAG 2.1 Level AA
npx playwright test axe-automated-tests.spec.js --grep "WCAG 2.1 AA"
```

## 🔧 Tools Overview

### axe-core
The industry-standard accessibility testing engine that runs rules against web pages and components.

**Strengths:**
- Fast and accurate
- Integrates with popular test frameworks
- Detailed violation reporting
- Customizable rule sets

**Use Cases:**
- Unit/component testing
- Integration testing
- CI/CD pipeline integration

### Pa11y
Command-line accessibility testing tool for automated checks across multiple pages.

**Strengths:**
- Multiple URL testing
- Custom actions (clicks, form fills)
- Various reporters (HTML, JSON, CSV)
- CI/CD friendly

**Use Cases:**
- Site-wide accessibility audits
- Regression testing
- Scheduled accessibility checks

### Lighthouse
Google's automated tool for web page quality, including accessibility.

**Strengths:**
- Comprehensive scoring
- Performance + accessibility
- Best practice recommendations
- Chrome DevTools integration

**Use Cases:**
- Overall site quality assessment
- Accessibility score tracking
- CI/CD quality gates

### Manual Testing Tools
Essential for catching issues automated tools miss:
- **Keyboard navigation**: Real user interaction patterns
- **Screen readers**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- **Browser extensions**: WAVE, axe DevTools, Accessibility Insights

## 🎯 Testing Strategy

### 1. Automated Tests (70%)
Run on every commit/PR:
- axe-core component tests
- Pa11y regression suite
- Color contrast validation
- ARIA attribute checking

### 2. Semi-Automated Tests (20%)
Run weekly or before releases:
- Keyboard navigation flows
- Focus management
- Form validation
- Dynamic content updates

### 3. Manual Tests (10%)
Run before major releases:
- Screen reader compatibility
- Real user scenarios
- Complex interactions
- Edge cases

## 📊 Best Practices Demonstrated

1. **Shift Left**: Test accessibility during component development
2. **Multiple Tools**: Combine tools for comprehensive coverage
3. **Custom Rules**: Configure rules for your specific needs
4. **Continuous Monitoring**: Integrate into CI/CD pipelines
5. **Actionable Reports**: Generate detailed, developer-friendly reports
6. **Real User Testing**: Supplement automation with manual testing
7. **Progressive Enhancement**: Test across browsers and assistive technologies

## 🚀 Integration Examples

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example
- name: Run Accessibility Tests
  run: |
    npm install
    npx playwright test axe-automated-tests.spec.js
    npx pa11y-ci
    node lighthouse-accessibility.js
```

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:a11y"
    }
  }
}
```

### Jest/Vitest Integration

```javascript
// Use axe-core with your existing test framework
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

## 📈 Measuring Success

### Key Metrics
- **Violation Count**: Track violations over time
- **Severity Distribution**: Critical vs. minor issues
- **WCAG Compliance**: Percentage of AA criteria met
- **Lighthouse Score**: Target 90+ accessibility score
- **Time to Fix**: Average time to resolve violations

### Reporting
All examples generate detailed reports:
- HTML reports with screenshots
- JSON for programmatic analysis
- CSV for tracking trends
- Console output for CI/CD logs

## 🔍 Common Issues Detected

These examples help catch:
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Invalid ARIA usage
- Keyboard navigation issues
- Missing heading hierarchy
- Inaccessible modals/dialogs
- Focus management problems
- Missing skip links
- Non-semantic HTML

## 📖 Learning Resources

### WCAG 2.1 Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [How to Meet WCAG](https://www.w3.org/WAI/WCAG21/quickref/)

### Testing Tools Documentation
- [axe-core](https://github.com/dequelabs/axe-core)
- [Pa11y](https://pa11y.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)

### Screen Reader Resources
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [JAWS Commands](https://www.freedomscientific.com/training/jaws/)
- [VoiceOver Guide](https://support.apple.com/guide/voiceover/welcome/mac)

## 🛠️ Troubleshooting

### Common Setup Issues

**Playwright browsers not installed:**
```bash
npx playwright install
```

**Pa11y timeout issues:**
Increase timeout in pa11y-ci-config.json

**Lighthouse failing:**
Ensure Chrome/Chromium is installed

**False positives:**
Add rules to ignore list with proper justification

## 📝 Test Data

All examples use realistic test scenarios:
- E-commerce product pages
- Forms with validation
- Navigation menus
- Modal dialogs
- Data tables
- Interactive widgets

---

*Accessibility testing ensures your application is usable by everyone, including people with disabilities. These examples demonstrate how to automate WCAG 2.1 AA compliance checks and integrate them into your development workflow.*
