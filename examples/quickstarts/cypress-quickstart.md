# Cypress Quick Start

**Time:** 5 minutes
**Prerequisites:** Node.js 18+
**What You'll Learn:** Set up Cypress and write your first E2E test

## 1. Install (1 minute)

```bash
# Create new project
mkdir my-cypress-project && cd my-cypress-project
npm init -y

# Install Cypress
npm install --save-dev cypress

# Open Cypress for first time (creates folder structure)
npx cypress open
```

This creates:

```
cypress/
├── e2e/          # Test files go here
├── fixtures/     # Test data
├── support/      # Custom commands
└── downloads/    # Downloaded files
```

## 2. Configure (1 minute)

Create `cypress.config.js`:

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://example.cypress.io',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:chrome": "cypress run --browser chrome",
    "cy:run:headed": "cypress run --headed"
  }
}
```

## 3. Hello World (2 minutes)

Create `cypress/e2e/first-test.cy.js`:

```javascript
describe('My First Cypress Test', () => {
  beforeEach(() => {
    // Visit page before each test
    cy.visit('/');
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Kitchen Sink');
  });

  it('should have a navigation link', () => {
    cy.get('nav').should('be.visible');
    cy.contains('type').click();
  });

  it('should type into an input field', () => {
    cy.visit('/commands/actions');

    cy.get('[data-test="email-input"]')
      .type('test@example.com')
      .should('have.value', 'test@example.com');
  });

  it('should submit a form', () => {
    cy.visit('/commands/actions');

    cy.get('[data-test="email-input"]').type('user@example.com');
    cy.get('[data-test="action-form"]').submit();

    // Assert form was submitted
    cy.contains('Form submitted').should('be.visible');
  });

  it('should make an assertion', () => {
    cy.get('h1').should('be.visible').and('contain', 'Kitchen Sink');
  });
});
```

## 4. Run Tests (1 minute)

```bash
# Open Cypress Test Runner (interactive)
npm run cy:open
# Click on the test file to run it

# Run headless (CI mode)
npm run cy:run

# Run in specific browser
npm run cy:run:chrome

# Run specific test file
npx cypress run --spec "cypress/e2e/first-test.cy.js"

# Run in headed mode (see browser)
npm run cy:run:headed
```

**Expected Output:**

```
  My First Cypress Test
    ✓ should display the correct title (245ms)
    ✓ should have a navigation link (182ms)
    ✓ should type into an input field (156ms)
    ✓ should submit a form (298ms)
    ✓ should make an assertion (92ms)

  5 passing (1s)
```

## 5. Next Steps

### Custom Commands

Create `cypress/support/commands.js`:

```javascript
// Custom login command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-test="email"]').type(email);
  cy.get('[data-test="password"]').type(password);
  cy.get('[data-test="login-button"]').click();
});

// Custom API request
Cypress.Commands.add('createUser', userData => {
  cy.request({
    method: 'POST',
    url: '/api/users',
    body: userData,
  });
});

// Check local storage
Cypress.Commands.add('getLocalStorage', key => {
  return cy.window().then(window => {
    return window.localStorage.getItem(key);
  });
});
```

Use custom commands:

```javascript
it('should login successfully', () => {
  cy.login('user@example.com', 'password123');
  cy.url().should('include', '/dashboard');
});
```

### Fixtures for Test Data

Create `cypress/fixtures/users.json`:

```json
{
  "validUser": {
    "email": "test@example.com",
    "password": "password123"
  },
  "adminUser": {
    "email": "admin@example.com",
    "password": "admin123"
  }
}
```

Use fixtures:

```javascript
it('should login with fixture data', () => {
  cy.fixture('users').then(users => {
    cy.login(users.validUser.email, users.validUser.password);
  });
});
```

### Intercept Network Requests

```javascript
it('should mock API response', () => {
  // Intercept and mock response
  cy.intercept('GET', '/api/users', {
    statusCode: 200,
    body: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ],
  }).as('getUsers');

  cy.visit('/users');
  cy.wait('@getUsers');

  cy.contains('John Doe').should('be.visible');
});

it('should spy on API calls', () => {
  cy.intercept('POST', '/api/login').as('loginRequest');

  cy.login('user@example.com', 'password');

  cy.wait('@loginRequest').its('request.body').should('deep.equal', {
    email: 'user@example.com',
    password: 'password',
  });
});
```

### Page Object Pattern

Create `cypress/support/pages/LoginPage.js`:

```javascript
class LoginPage {
  visit() {
    cy.visit('/login');
  }

  fillEmail(email) {
    cy.get('[data-test="email"]').type(email);
    return this;
  }

  fillPassword(password) {
    cy.get('[data-test="password"]').type(password);
    return this;
  }

  submit() {
    cy.get('[data-test="login-button"]').click();
    return this;
  }

  getErrorMessage() {
    return cy.get('[data-test="error-message"]');
  }
}

export default new LoginPage();
```

Use Page Object:

```javascript
import LoginPage from '../support/pages/LoginPage';

it('should show error with invalid credentials', () => {
  LoginPage.visit().fillEmail('invalid@example.com').fillPassword('wrongpassword').submit();

  LoginPage.getErrorMessage().should('be.visible').and('contain', 'Invalid credentials');
});
```

### Environment Variables

Create `cypress.env.json`:

```json
{
  "apiUrl": "http://localhost:3000",
  "adminEmail": "admin@example.com",
  "adminPassword": "secret"
}
```

Use in tests:

```javascript
it('should use environment variables', () => {
  const apiUrl = Cypress.env('apiUrl');
  const adminEmail = Cypress.env('adminEmail');

  cy.request(`${apiUrl}/api/users`);
  cy.login(adminEmail, Cypress.env('adminPassword'));
});
```

### Multiple Configuration

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Switch configs based on environment
      if (config.env.environment === 'staging') {
        config.baseUrl = 'https://staging.example.com';
      }
      if (config.env.environment === 'production') {
        config.baseUrl = 'https://example.com';
      }
      return config;
    },
  },
});
```

Run with specific config:

```bash
npx cypress run --env environment=staging
```

## 6. Troubleshooting

### Issue: "cy.visit() failed"

```javascript
// Increase timeout
cy.visit('/', { timeout: 30000 });

// Or in config
module.exports = defineConfig({
  e2e: {
    pageLoadTimeout: 30000,
  },
});
```

### Issue: Element not found

```javascript
// Wait for element to exist
cy.get('[data-test="button"]', { timeout: 10000 });

// Use should to retry
cy.get('[data-test="button"]').should('exist');

// Wait for specific condition
cy.get('[data-test="list"]').should('have.length.gt', 0);
```

### Issue: Flaky tests due to animations

```javascript
// Disable animations in config
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-smooth-scrolling');
        }
        return launchOptions;
      });
    },
  },
});

// Or inject CSS to disable animations
cy.visit('/', {
  onBeforeLoad(win) {
    const style = win.document.createElement('style');
    style.innerHTML = '* { transition: none !important; animation: none !important; }';
    win.document.head.appendChild(style);
  },
});
```

### Issue: Cross-origin errors

```javascript
// Add to cypress.config.js
module.exports = defineConfig({
  e2e: {
    chromeWebSecurity: false, // Use with caution!
  },
});
```

### Issue: "Cannot read property of undefined"

```javascript
// Add null checks
cy.get('[data-test="item"]').then($el => {
  if ($el.length > 0) {
    // Element exists
  }
});

// Or use conditional testing
cy.get('body').then($body => {
  if ($body.find('[data-test="item"]').length) {
    cy.get('[data-test="item"]').click();
  }
});
```

## 🎓 Common Commands Reference

```javascript
// Navigation
cy.visit('/path');
cy.go('back');
cy.go('forward');
cy.reload();

// Querying
cy.get('[data-test="selector"]');
cy.contains('text');
cy.find('.class');
cy.first();
cy.last();
cy.eq(index);
cy.filter('.class');

// Actions
cy.click();
cy.dblclick();
cy.type('text');
cy.clear();
cy.check();
cy.uncheck();
cy.select('option');
cy.trigger('mouseover');
cy.scrollIntoView();
cy.submit();

// Assertions
.should('be.visible');
.should('exist');
.should('have.text', 'text');
.should('have.value', 'value');
.should('have.attr', 'attr', 'value');
.should('have.class', 'className');
.should('have.length', number);
.should('contain', 'text');

// Waiting
cy.wait(1000);  // milliseconds
cy.wait('@alias');  // wait for intercepted request

// Window
cy.window();
cy.document();
cy.title();
cy.url();
cy.viewport(width, height);

// Network
cy.request('url');
cy.intercept('GET', '/api/*');

// Files
cy.readFile('path/to/file');
cy.writeFile('path/to/file', data);

// Screenshots
cy.screenshot();
cy.screenshot('name');
```

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Examples](https://example.cypress.io/)
- [Full E2E Examples](../e2e-tests/cypress-example.js)

## ⏭️ What's Next?

1. **Add custom commands** - DRY up common operations
2. **Use Page Objects** - Better test organization
3. **Mock API responses** - Faster, more reliable tests
4. **Integrate with CI** - Run tests in GitHub Actions
5. **Visual regression** - Catch UI changes

---

**Time to first test:** ~5 minutes ✅
**Ready for production?** Add Page Objects and CI integration!
