/**
 * Cypress End-to-End Testing Examples
 * Demonstrates complete user workflow testing with Cypress
 */

// ============================================
// 1. USER REGISTRATION AND LOGIN FLOW
// ============================================

describe('User Authentication Flow', () => {
  beforeEach(() => {
    // Visit the application before each test
    cy.visit('/');

    // Clear any existing user data
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should complete full registration flow', () => {
    // Navigate to registration
    cy.get('[data-cy=register-link]').click();
    cy.url().should('include', '/register');

    // Fill registration form
    cy.get('[data-cy=first-name]').type('John');
    cy.get('[data-cy=last-name]').type('Doe');
    cy.get('[data-cy=email]').type('john.doe@example.com');
    cy.get('[data-cy=password]').type('SecurePass123!');
    cy.get('[data-cy=confirm-password]').type('SecurePass123!');

    // Accept terms and conditions
    cy.get('[data-cy=terms-checkbox]').check();

    // Submit form
    cy.get('[data-cy=register-button]').click();

    // Verify successful registration
    cy.get('[data-cy=success-message]')
      .should('be.visible')
      .and('contain', 'Registration successful');

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=welcome-message]')
      .should('contain', 'Welcome, John!');
  });

  it('should validate registration form fields', () => {
    cy.get('[data-cy=register-link]').click();

    // Test empty form submission
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=error-message]')
      .should('contain', 'Please fill in all required fields');

    // Test invalid email
    cy.get('[data-cy=email]').type('invalid-email');
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=email-error]')
      .should('contain', 'Please enter a valid email address');

    // Test password mismatch
    cy.get('[data-cy=email]').clear().type('valid@example.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=confirm-password]').type('different-password');
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=password-error]')
      .should('contain', 'Passwords do not match');
  });

  it('should login with valid credentials', () => {
    // Assume user already exists (created in previous test or seeded)
    cy.get('[data-cy=login-link]').click();

    cy.get('[data-cy=email]').type('john.doe@example.com');
    cy.get('[data-cy=password]').type('SecurePass123!');
    cy.get('[data-cy=login-button]').click();

    // Verify successful login
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=user-menu]').should('be.visible');

    // Verify user is authenticated
    cy.window().its('localStorage.token').should('exist');
  });

  it('should handle login with invalid credentials', () => {
    cy.get('[data-cy=login-link]').click();

    cy.get('[data-cy=email]').type('wrong@example.com');
    cy.get('[data-cy=password]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();

    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');

    // Should remain on login page
    cy.url().should('include', '/login');
  });
});

// ============================================
// 2. SHOPPING CART FUNCTIONALITY
// ============================================

describe('Shopping Cart Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.loginAsUser('john.doe@example.com', 'SecurePass123!');
    cy.visit('/products');
  });

  it('should add products to cart and complete checkout', () => {
    // Add first product to cart
    cy.get('[data-cy=product-card]').first().within(() => {
      cy.get('[data-cy=product-name]').invoke('text').as('firstProductName');
      cy.get('[data-cy=product-price]').invoke('text').as('firstProductPrice');
      cy.get('[data-cy=add-to-cart-btn]').click();
    });

    // Verify cart badge updates
    cy.get('[data-cy=cart-badge]').should('contain', '1');

    // Add second product
    cy.get('[data-cy=product-card]').eq(1).within(() => {
      cy.get('[data-cy=add-to-cart-btn]').click();
    });

    cy.get('[data-cy=cart-badge]').should('contain', '2');

    // View cart
    cy.get('[data-cy=cart-icon]').click();
    cy.get('[data-cy=cart-items]').should('have.length', 2);

    // Update quantity
    cy.get('[data-cy=quantity-input]').first().clear().type('3');
    cy.get('[data-cy=update-quantity-btn]').first().click();

    // Verify total updates
    cy.get('[data-cy=cart-total]').should('not.contain', '$0.00');

    // Proceed to checkout
    cy.get('[data-cy=checkout-btn]').click();
    cy.url().should('include', '/checkout');

    // Fill shipping information
    cy.get('[data-cy=shipping-address]').type('123 Main St');
    cy.get('[data-cy=shipping-city]').type('Anytown');
    cy.get('[data-cy=shipping-zip]').type('12345');

    // Fill payment information
    cy.get('[data-cy=card-number]').type('4111111111111111');
    cy.get('[data-cy=card-expiry]').type('12/25');
    cy.get('[data-cy=card-cvc]').type('123');

    // Complete order
    cy.get('[data-cy=place-order-btn]').click();

    // Verify order success
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-cy=order-success-message]')
      .should('contain', 'Order placed successfully');
    cy.get('[data-cy=order-number]').should('be.visible');
  });

  it('should handle cart item removal', () => {
    // Add product to cart
    cy.get('[data-cy=product-card]').first().within(() => {
      cy.get('[data-cy=add-to-cart-btn]').click();
    });

    // View cart
    cy.get('[data-cy=cart-icon]').click();

    // Remove item
    cy.get('[data-cy=remove-item-btn]').first().click();

    // Confirm removal
    cy.get('[data-cy=confirm-remove-btn]').click();

    // Verify cart is empty
    cy.get('[data-cy=empty-cart-message]')
      .should('be.visible')
      .and('contain', 'Your cart is empty');
    cy.get('[data-cy=cart-badge]').should('not.exist');
  });
});

// ============================================
// 3. FORM VALIDATION AND INTERACTION
// ============================================

describe('Contact Form', () => {
  it('should submit contact form with valid data', () => {
    cy.visit('/contact');

    // Fill form
    cy.get('[data-cy=contact-name]').type('Jane Smith');
    cy.get('[data-cy=contact-email]').type('jane@example.com');
    cy.get('[data-cy=contact-subject]').select('General Inquiry');
    cy.get('[data-cy=contact-message]')
      .type('This is a test message for the contact form.');

    // Submit form
    cy.get('[data-cy=submit-contact-btn]').click();

    // Verify success
    cy.get('[data-cy=success-alert]')
      .should('be.visible')
      .and('contain', 'Message sent successfully');

    // Form should be reset
    cy.get('[data-cy=contact-name]').should('have.value', '');
  });

  it('should validate required fields', () => {
    cy.visit('/contact');

    // Try to submit empty form
    cy.get('[data-cy=submit-contact-btn]').click();

    // Check for validation errors
    cy.get('[data-cy=name-error]').should('contain', 'Name is required');
    cy.get('[data-cy=email-error]').should('contain', 'Email is required');
    cy.get('[data-cy=message-error]').should('contain', 'Message is required');

    // Fill name, leave others empty
    cy.get('[data-cy=contact-name]').type('John');
    cy.get('[data-cy=submit-contact-btn]').click();

    // Name error should disappear, others remain
    cy.get('[data-cy=name-error]').should('not.exist');
    cy.get('[data-cy=email-error]').should('be.visible');
    cy.get('[data-cy=message-error]').should('be.visible');
  });
});

// ============================================
// 4. SEARCH AND FILTERING
// ============================================

describe('Product Search and Filtering', () => {
  beforeEach(() => {
    cy.visit('/products');
  });

  it('should search for products', () => {
    const searchTerm = 'laptop';

    cy.get('[data-cy=search-input]').type(searchTerm);
    cy.get('[data-cy=search-btn]').click();

    // Verify search results
    cy.get('[data-cy=search-results]').should('be.visible');
    cy.get('[data-cy=product-card]').each(($card) => {
      cy.wrap($card)
        .find('[data-cy=product-name]')
        .invoke('text')
        .should('match', new RegExp(searchTerm, 'i'));
    });

    // Verify search term is preserved in URL
    cy.url().should('include', `search=${searchTerm}`);
  });

  it('should filter products by category', () => {
    // Apply category filter
    cy.get('[data-cy=category-filter]').select('Electronics');

    // Verify URL updates
    cy.url().should('include', 'category=electronics');

    // Verify filtered results
    cy.get('[data-cy=product-card]').should('have.length.at.least', 1);
    cy.get('[data-cy=no-results]').should('not.exist');

    // Apply price filter
    cy.get('[data-cy=min-price]').type('100');
    cy.get('[data-cy=max-price]').type('500');
    cy.get('[data-cy=apply-filters-btn]').click();

    // Verify products are within price range
    cy.get('[data-cy=product-card]').each(($card) => {
      cy.wrap($card)
        .find('[data-cy=product-price]')
        .invoke('text')
        .then((priceText) => {
          const price = parseFloat(priceText.replace('$', ''));
          expect(price).to.be.within(100, 500);
        });
    });
  });

  it('should handle no search results', () => {
    cy.get('[data-cy=search-input]').type('nonexistentproduct123');
    cy.get('[data-cy=search-btn]').click();

    cy.get('[data-cy=no-results]')
      .should('be.visible')
      .and('contain', 'No products found');
    cy.get('[data-cy=product-card]').should('not.exist');
  });
});

// ============================================
// 5. RESPONSIVE DESIGN TESTING
// ============================================

describe('Responsive Design', () => {
  const viewports = [
    { device: 'iPhone 6', width: 375, height: 667 },
    { device: 'iPad', width: 768, height: 1024 },
    { device: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ device, width, height }) => {
    it(`should display correctly on ${device}`, () => {
      cy.viewport(width, height);
      cy.visit('/');

      // Check header navigation
      if (width < 768) {
        // Mobile: hamburger menu should be visible
        cy.get('[data-cy=mobile-menu-btn]').should('be.visible');
        cy.get('[data-cy=desktop-nav]').should('not.be.visible');
      } else {
        // Desktop/Tablet: full navigation should be visible
        cy.get('[data-cy=desktop-nav]').should('be.visible');
        cy.get('[data-cy=mobile-menu-btn]').should('not.be.visible');
      }

      // Check product grid layout
      cy.visit('/products');
      if (width < 768) {
        // Mobile: single column
        cy.get('[data-cy=product-grid]')
          .should('have.class', 'grid-cols-1');
      } else if (width < 1024) {
        // Tablet: two columns
        cy.get('[data-cy=product-grid]')
          .should('have.class', 'grid-cols-2');
      } else {
        // Desktop: three or more columns
        cy.get('[data-cy=product-grid]')
          .should('satisfy', ($el) => {
            return $el.hasClass('grid-cols-3') || $el.hasClass('grid-cols-4');
          });
      }
    });
  });

  it('should have accessible mobile navigation', () => {
    cy.viewport('iphone-6');
    cy.visit('/');

    // Open mobile menu
    cy.get('[data-cy=mobile-menu-btn]').click();
    cy.get('[data-cy=mobile-menu]').should('be.visible');

    // Navigate using mobile menu
    cy.get('[data-cy=mobile-nav-products]').click();
    cy.url().should('include', '/products');

    // Menu should close after navigation
    cy.get('[data-cy=mobile-menu]').should('not.be.visible');
  });
});

// ============================================
// 6. ACCESSIBILITY TESTING
// ============================================

describe('Accessibility', () => {
  it('should have proper keyboard navigation', () => {
    cy.visit('/');

    // Tab through main navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-cy', 'logo-link');

    cy.tab();
    cy.focused().should('have.attr', 'data-cy', 'nav-products');

    cy.tab();
    cy.focused().should('have.attr', 'data-cy', 'nav-about');

    // Test form navigation
    cy.visit('/contact');
    cy.get('[data-cy=contact-name]').focus().tab();
    cy.focused().should('have.attr', 'data-cy', 'contact-email');
  });

  it('should have proper ARIA labels and roles', () => {
    cy.visit('/');

    // Check main navigation
    cy.get('[data-cy=main-nav]')
      .should('have.attr', 'role', 'navigation')
      .and('have.attr', 'aria-label', 'Main navigation');

    // Check search form
    cy.get('[data-cy=search-input]')
      .should('have.attr', 'aria-label', 'Search products');

    // Check buttons
    cy.get('[data-cy=search-btn]')
      .should('have.attr', 'aria-label', 'Search');
  });

  it('should have sufficient color contrast', () => {
    cy.visit('/');

    // This would typically use cypress-axe for automated accessibility testing
    cy.injectAxe();
    cy.checkA11y();
  });
});

// ============================================
// 7. PERFORMANCE TESTING
// ============================================

describe('Performance', () => {
  it('should load pages within acceptable time', () => {
    // Measure page load time
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('pageLoad', 'start', 'end');
      }
    });

    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('pageLoad')[0];
      expect(measure.duration).to.be.lessThan(3000); // 3 seconds
    });
  });

  it('should lazy load images', () => {
    cy.visit('/products');

    // Check that images below the fold have loading="lazy"
    cy.get('[data-cy=product-image]').each(($img, index) => {
      if (index > 6) { // Images below the fold
        cy.wrap($img).should('have.attr', 'loading', 'lazy');
      }
    });
  });
});

// ============================================
// CUSTOM COMMANDS (in cypress/support/commands.js)
// ============================================

Cypress.Commands.add('loginAsUser', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-cy=email]').type(email);
    cy.get('[data-cy=password]').type(password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('include', '/dashboard');
  });
});

Cypress.Commands.add('addProductToCart', (productName) => {
  cy.visit('/products');
  cy.get('[data-cy=product-card]').contains(productName).within(() => {
    cy.get('[data-cy=add-to-cart-btn]').click();
  });
});

Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', {
    key: 'Tab',
    code: 'Tab',
    keyCode: 9,
  });
});

// ============================================
// CONFIGURATION EXAMPLE (cypress.config.js)
// ============================================

/*
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      apiUrl: 'http://localhost:3001/api',
    },
    retries: {
      runMode: 2,
      openMode: 0
    }
  }
};
*/