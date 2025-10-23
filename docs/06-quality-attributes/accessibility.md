# Accessibility (a11y)

## Overview

Accessibility ensures that applications are usable by people with disabilities, including visual, auditory, motor, and cognitive impairments. It's both a legal requirement (ADA, Section 508) and a moral imperative to make software inclusive for all users.

## Purpose

- **Inclusivity**: Enable all users to access content
- **Legal compliance**: Meet ADA, Section 508, WCAG standards
- **Business value**: Reach 15%+ of population with disabilities
- **Better UX**: Accessibility improvements benefit all users
- **SEO benefits**: Semantic HTML improves search rankings

## WCAG 2.1 Principles (POUR)

### 1. Perceivable

Information must be presentable to users in ways they can perceive.

```html
<!-- ✅ GOOD: Alt text for images -->
<img src="logo.png" alt="Company Logo" />

<!-- ❌ BAD: Missing alt text -->
<img src="logo.png" />

<!-- ✅ GOOD: Text alternatives for non-text content -->
<button aria-label="Close dialog">
  <svg>...</svg>
</button>

<!-- ✅ GOOD: Captions for videos -->
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" label="English" />
</video>
```

### 2. Operable

User interface components must be operable.

```html
<!-- ✅ GOOD: Keyboard accessible -->
<button onclick="handleClick()">Submit</button>

<!-- ❌ BAD: Not keyboard accessible -->
<div onclick="handleClick()">Submit</div>

<!-- ✅ GOOD: Skip to main content -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<main id="main-content">
  <!-- Page content -->
</main>

<!-- ✅ GOOD: Sufficient time to read -->
<div role="alert" aria-live="polite">Session will expire in 5 minutes</div>
```

### 3. Understandable

Information and operation must be understandable.

```html
<!-- ✅ GOOD: Clear labels and instructions -->
<label for="email">
  Email Address *
  <span class="hint">We'll never share your email</span>
</label>
<input type="email" id="email" required aria-describedby="email-hint" aria-invalid="false" />
<span id="email-hint" class="sr-only"> Format: user@example.com </span>

<!-- ✅ GOOD: Error identification -->
<input type="email" id="email" aria-invalid="true" aria-describedby="email-error" />
<span id="email-error" role="alert"> Please enter a valid email address </span>

<!-- ✅ GOOD: Consistent navigation -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

### 4. Robust

Content must be robust enough to work with assistive technologies.

```html
<!-- ✅ GOOD: Semantic HTML -->
<header>
  <nav aria-label="Main">...</nav>
</header>
<main>
  <article>
    <h1>Page Title</h1>
    <section>
      <h2>Section Title</h2>
      <p>Content...</p>
    </section>
  </article>
</main>
<footer>...</footer>

<!-- ✅ GOOD: ARIA when HTML isn't enough -->
<div role="tablist" aria-label="Product tabs">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">Description</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2">Reviews</button>
</div>
```

## WCAG Conformance Levels

```markdown
**Level A (Minimum):**

- Basic web accessibility
- Required for legal compliance
- Examples: Alt text, keyboard access, labels

**Level AA (Mid-range):**

- Most common target for compliance
- Required by most regulations (ADA, Section 508)
- Examples: 4.5:1 color contrast, resize text 200%, consistent navigation

**Level AAA (Highest):**

- Enhanced accessibility
- Not required for general compliance
- Examples: 7:1 color contrast, sign language, extended audio descriptions
```

## Accessibility Testing

### 1. Automated Testing

```javascript
// axe-core - Automated accessibility testing
import { axe } from 'jest-axe';

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// React Testing Library
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Login form is accessible', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

```javascript
// Playwright - E2E accessibility testing
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should be accessible', async ({ page }) => {
  await page.goto('https://example.com');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

// Test specific WCAG rules
test('check color contrast', async ({ page }) => {
  await page.goto('https://example.com');

  const results = await new AxeBuilder({ page })
    .include('.main-content')
    .withRules(['color-contrast'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### 2. Manual Testing

```markdown
**Keyboard Navigation:**

- [ ] Tab through all interactive elements
- [ ] Shift+Tab navigates backwards
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes dialogs and menus
- [ ] Arrow keys work in custom widgets
- [ ] Focus visible at all times

**Screen Reader Testing:**

- [ ] Test with NVDA (Windows, free)
- [ ] Test with JAWS (Windows, paid)
- [ ] Test with VoiceOver (macOS/iOS, built-in)
- [ ] Test with TalkBack (Android, built-in)
- [ ] All content is announced
- [ ] Landmarks are properly identified
- [ ] Forms are properly labeled
- [ ] Dynamic updates announced

**Visual Testing:**

- [ ] Zoom to 200% - content readable
- [ ] Test with Windows High Contrast mode
- [ ] Test with browser dark mode
- [ ] Color contrast meets 4.5:1 (AA)
- [ ] Text spacing can be adjusted
```

### 3. Accessibility Checklist

```markdown
**Content:**

- [ ] All images have alt text (or alt="" if decorative)
- [ ] Videos have captions and transcripts
- [ ] Audio has transcripts
- [ ] Content makes sense without CSS
- [ ] Headings in logical order (h1 → h2 → h3)

**Keyboard:**

- [ ] All functionality accessible via keyboard
- [ ] Focus order is logical
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Skip links provided

**Forms:**

- [ ] All inputs have labels
- [ ] Required fields indicated
- [ ] Error messages clear and helpful
- [ ] Errors associated with inputs (aria-describedby)
- [ ] Form instructions before form

**Color:**

- [ ] Text contrast ≥ 4.5:1 (normal text)
- [ ] Text contrast ≥ 3:1 (large text, 18pt+)
- [ ] Color not sole indicator of information
- [ ] UI components contrast ≥ 3:1

**Dynamic Content:**

- [ ] Loading states announced
- [ ] Updates announced (aria-live)
- [ ] Errors announced to screen readers
- [ ] Success messages announced

**ARIA:**

- [ ] Semantic HTML used first
- [ ] ARIA roles appropriate
- [ ] aria-label used when needed
- [ ] aria-hidden used appropriately
- [ ] aria-expanded for collapsibles
```

## Common Accessibility Patterns

### Accessible Modal Dialog

```jsx
// React accessible modal
import { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';

function AccessibleModal({ isOpen, onClose, title, children }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-overlay"
        onClick={onClose}
      >
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close dialog"
              className="close-button"
            >
              ×
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </FocusTrap>
  );
}
```

### Accessible Form

```jsx
// React accessible form
function AccessibleForm() {
  const [errors, setErrors] = useState({});

  const handleSubmit = e => {
    e.preventDefault();
    // Validation logic
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="email">
          Email Address *<span className="hint">We'll never share your email</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          aria-required="true"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" className="error">
            {errors.email}
          </span>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Accessible Data Table

```jsx
// React accessible table
function AccessibleTable({ data }) {
  return (
    <table>
      <caption>User List</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(user => (
          <tr key={user.id}>
            <th scope="row">{user.name}</th>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
              <button aria-label={`Edit ${user.name}`} onClick={() => handleEdit(user.id)}>
                Edit
              </button>
              <button aria-label={`Delete ${user.name}`} onClick={() => handleDelete(user.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Accessibility in CI/CD

```yaml
# GitHub Actions - Accessibility testing
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Run axe accessibility tests
        run: npm run test:a11y

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm start &

      - name: Run Pa11y
        run: |
          npx pa11y-ci \
            --threshold 0 \
            --standard WCAG2AA \
            https://localhost:3000

      - name: Lighthouse accessibility audit
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://localhost:3000
          configPath: './lighthouserc.json'
```

## Tools

```markdown
**Automated Testing:**

- axe-core: Browser extension and testing library
- Pa11y: Command-line accessibility testing
- Lighthouse: Chrome DevTools audit
- WAVE: Browser extension
- AccessLint: GitHub PR comments

**Manual Testing:**

- NVDA: Free Windows screen reader
- JAWS: Commercial Windows screen reader
- VoiceOver: Built-in macOS/iOS screen reader
- TalkBack: Built-in Android screen reader
- ChromeVox: Chrome extension screen reader

**Development:**

- eslint-plugin-jsx-a11y: React accessibility linting
- axe DevTools: Browser extension for debugging
- Stark: Figma plugin for design accessibility
```

## Related Resources

- [Component Testing](../05-test-levels/component-testing.md)
- [E2E Testing](../05-test-levels/e2e-testing.md)
- [Testing Strategy](../04-testing-strategy/README.md)

## References

- WCAG 2.1 Guidelines
- Section 508 Standards
- WAI-ARIA Authoring Practices
- MDN Web Accessibility
- A11y Project Checklist

---

_Part of: [Quality Attributes](README.md)_
