# Behavior-Driven Development (BDD)

## Purpose

Comprehensive guide to Behavior-Driven Development—a collaborative approach that bridges the gap between technical and non-technical stakeholders through executable specifications written in natural language.

## Overview

Behavior-Driven Development is:

- A collaborative approach to software development
- An extension of Test-Driven Development (TDD)
- Focused on business value and user behavior
- Written in natural language (Given-When-Then)
- A communication tool between stakeholders
- A living documentation system

## What is BDD?

### Definition

BDD is an agile software development methodology that encourages collaboration between developers, QA, and non-technical participants through concrete examples and executable specifications.

### Core Principles

```
BDD Principles:

Collaboration
├── Three Amigos: Dev, QA, BA/PO
├── Shared understanding
├── Early feedback loops
└── Continuous refinement

Ubiquitous Language
├── Business-readable DSL
├── Shared vocabulary
├── Domain-driven terms
└── No technical jargon

Outside-In Development
├── Start with behavior
├── Focus on outcomes
├── User perspective first
└── Technical details second

Living Documentation
├── Executable specifications
├── Always up-to-date
├── Single source of truth
└── Automated validation
```

### BDD vs TDD

```
┌──────────────────┬──────────────────┬──────────────────┐
│    Aspect        │       TDD        │       BDD        │
├──────────────────┼──────────────────┼──────────────────┤
│ Focus            │ How code works   │ What system does │
│ Language         │ Technical        │ Business         │
│ Audience         │ Developers       │ All stakeholders │
│ Granularity      │ Unit level       │ Feature level    │
│ Documentation    │ Code comments    │ Scenarios        │
│ Primary Goal     │ Code quality     │ Business value   │
└──────────────────┴──────────────────┴──────────────────┘
```

## The Three Amigos

### Discovery Workshop

**Participants:**

- Business Analyst / Product Owner
- Developer
- QA / Tester

**Process:**

```
1. Discovery (Example Mapping)
   ├── Identify user story
   ├── Define acceptance criteria
   ├── Create concrete examples
   └── Surface questions and assumptions

2. Formulation (Scenario Writing)
   ├── Write Given-When-Then scenarios
   ├── Define data tables
   ├── Identify edge cases
   └── Agree on expected outcomes

3. Automation (Implementation)
   ├── Implement step definitions
   ├── Write supporting code
   ├── Execute scenarios
   └── Refactor and maintain
```

### Example Mapping Session

**Visual Format:**

```
┌─────────────────────────────────────────────────────┐
│ User Story: Account Withdrawal                      │
└─────────────────────────────────────────────────────┘
  │
  ├─ Rule: Sufficient Funds Required (Green Card)
  │  ├─ Example: Withdraw $50 with $100 balance ✓
  │  ├─ Example: Withdraw $100 with $100 balance ✓
  │  └─ Example: Withdraw $150 with $100 balance ✗
  │
  ├─ Rule: Daily Limit Enforced (Green Card)
  │  ├─ Example: First withdrawal of $500 ✓
  │  └─ Example: Second withdrawal exceeds limit ✗
  │
  └─ Question: What about pending transactions? (Red Card)
```

**Card Colors:**

- Yellow: User Story
- Blue: Rules/Acceptance Criteria
- Green: Examples/Scenarios
- Red: Questions/Assumptions

## Gherkin Syntax

### Given-When-Then Structure

```gherkin
Feature: Account Withdrawal
  As an account holder
  I want to withdraw money from my account
  So that I can access my funds

  Background:
    Given the account is in good standing
    And the ATM has sufficient cash

  Scenario: Successful withdrawal with sufficient funds
    Given the account balance is $100
    And the card is valid
    And the daily withdrawal limit is $500
    When I request to withdraw $50
    Then the withdrawal should be approved
    And the account balance should be $50
    And I should receive $50 cash
    And a receipt should be printed

  Scenario: Withdrawal exceeds balance
    Given the account balance is $30
    When I request to withdraw $50
    Then the withdrawal should be rejected
    And I should see "Insufficient funds"
    And the account balance should remain $30
    And no cash should be dispensed
```

### Scenario Outlines (Data Tables)

```gherkin
Scenario Outline: Withdrawal with various amounts
  Given the account balance is <initial_balance>
  When I request to withdraw <withdrawal_amount>
  Then the withdrawal should be <result>
  And the account balance should be <final_balance>

  Examples:
    | initial_balance | withdrawal_amount | result   | final_balance |
    | 100            | 50                | approved | 50            |
    | 100            | 100               | approved | 0             |
    | 100            | 150               | rejected | 100           |
    | 50             | 25                | approved | 25            |
    | 25             | 50                | rejected | 25            |
```

### Background and Hooks

```gherkin
Feature: Shopping Cart

  Background:
    Given I am logged in as a registered user
    And my shopping cart is empty
    And the following products are available:
      | Product        | Price | Stock |
      | iPhone 15      | 999   | 10    |
      | AirPods Pro    | 249   | 25    |
      | MacBook Pro    | 2499  | 5     |

  Scenario: Add single item to cart
    When I add "iPhone 15" to my cart
    Then my cart should contain 1 item
    And the cart total should be $999

  Scenario: Add multiple items to cart
    When I add "iPhone 15" to my cart
    And I add "AirPods Pro" to my cart
    Then my cart should contain 2 items
    And the cart total should be $1248
```

## BDD Frameworks and Tools

### Cucumber (JavaScript/TypeScript)

**Installation:**

```bash
npm install --save-dev @cucumber/cucumber
npm install --save-dev @cucumber/cucumber-js
npm install --save-dev chai
```

**Feature File:**

```gherkin
# features/authentication.feature
Feature: User Authentication
  As a user
  I want to log in securely
  So that I can access my account

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter username "john.doe@example.com"
    And I enter password "SecurePass123!"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message "Welcome, John"
```

**Step Definitions:**

```typescript
// features/step_definitions/authentication.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

let loginPage: LoginPage;
let dashboardPage: DashboardPage;

Given('I am on the login page', async function () {
  loginPage = new LoginPage(this.driver);
  await loginPage.navigate();

  // Verify page loaded
  const isLoaded = await loginPage.isDisplayed();
  expect(isLoaded).to.be.true;
});

When('I enter username {string}', async function (username: string) {
  await loginPage.enterUsername(username);

  // Store for later verification if needed
  this.currentUsername = username;
});

When('I enter password {string}', async function (password: string) {
  await loginPage.enterPassword(password);
});

When('I click the login button', async function () {
  await loginPage.clickLoginButton();

  // Wait for navigation
  await this.driver.wait(
    async () => await loginPage.hasNavigatedAway(),
    5000,
    'Login did not complete in time'
  );
});

Then('I should be redirected to the dashboard', async function () {
  dashboardPage = new DashboardPage(this.driver);

  const currentUrl = await this.driver.getCurrentUrl();
  expect(currentUrl).to.include('/dashboard');

  const isDashboardDisplayed = await dashboardPage.isDisplayed();
  expect(isDashboardDisplayed).to.be.true;
});

Then('I should see a welcome message {string}', async function (expectedMessage: string) {
  const actualMessage = await dashboardPage.getWelcomeMessage();
  expect(actualMessage).to.equal(expectedMessage);
});
```

**World (Context) Setup:**

```typescript
// features/support/world.ts
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { WebDriver, Builder } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';

export interface CustomWorld extends World {
  driver: WebDriver;
  currentUsername?: string;
  currentUser?: any;
}

export class CustomWorldImpl extends World implements CustomWorld {
  driver!: WebDriver;
  currentUsername?: string;
  currentUser?: any;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init() {
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');

    this.driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
  }

  async cleanup() {
    if (this.driver) {
      await this.driver.quit();
    }
  }
}

setWorldConstructor(CustomWorldImpl);
```

**Hooks:**

```typescript
// features/support/hooks.ts
import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';

BeforeAll(async function () {
  console.log('Setting up test environment...');
  // Database seeding, service initialization, etc.
});

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld, scenario) {
  // Take screenshot on failure
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.driver.takeScreenshot();
    this.attach(screenshot, 'image/png');
  }

  await this.cleanup();
});

AfterAll(async function () {
  console.log('Tearing down test environment...');
  // Cleanup resources
});
```

**Configuration:**

```typescript
// cucumber.js
module.exports = {
  default: {
    require: ['features/step_definitions/**/*.ts', 'features/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      'junit:reports/cucumber-report.xml',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    publishQuiet: true,
  },
};
```

### SpecFlow (.NET/C#)

**Feature File:**

```gherkin
# Features/OrderProcessing.feature
Feature: Order Processing
  As a customer
  I want to place orders
  So that I can purchase products

  Scenario: Place order with valid payment
    Given I have selected the following products:
      | Product     | Quantity | Price |
      | Laptop      | 1        | 1200  |
      | Mouse       | 2        | 25    |
    And I have a valid credit card
    When I proceed to checkout
    And I complete the payment
    Then the order should be confirmed
    And I should receive an order confirmation email
    And the inventory should be updated
```

**Step Definitions:**

```csharp
// StepDefinitions/OrderProcessingSteps.cs
using TechTalk.SpecFlow;
using TechTalk.SpecFlow.Assist;
using FluentAssertions;
using System.Collections.Generic;
using System.Linq;

[Binding]
public class OrderProcessingSteps
{
    private readonly ScenarioContext _scenarioContext;
    private readonly OrderService _orderService;
    private readonly PaymentService _paymentService;
    private List<OrderItem> _selectedProducts;
    private Order _currentOrder;
    private PaymentResult _paymentResult;

    public OrderProcessingSteps(ScenarioContext scenarioContext)
    {
        _scenarioContext = scenarioContext;
        _orderService = new OrderService();
        _paymentService = new PaymentService();
        _selectedProducts = new List<OrderItem>();
    }

    [Given(@"I have selected the following products:")]
    public void GivenIHaveSelectedTheFollowingProducts(Table table)
    {
        _selectedProducts = table.CreateSet<OrderItem>().ToList();

        // Validate products exist
        foreach (var item in _selectedProducts)
        {
            var product = _orderService.GetProduct(item.Product);
            product.Should().NotBeNull($"Product {item.Product} should exist");

            var available = _orderService.CheckInventory(item.Product, item.Quantity);
            available.Should().BeTrue($"Sufficient inventory should exist for {item.Product}");
        }

        _scenarioContext["SelectedProducts"] = _selectedProducts;
    }

    [Given(@"I have a valid credit card")]
    public void GivenIHaveAValidCreditCard()
    {
        var creditCard = new CreditCard
        {
            Number = "4532015112830366",
            CVV = "123",
            ExpiryMonth = 12,
            ExpiryYear = 2025,
            HolderName = "John Doe"
        };

        var isValid = _paymentService.ValidateCard(creditCard);
        isValid.Should().BeTrue("Credit card should be valid");

        _scenarioContext["CreditCard"] = creditCard;
    }

    [When(@"I proceed to checkout")]
    public void WhenIProceedToCheckout()
    {
        _currentOrder = _orderService.CreateOrder(_selectedProducts);
        _currentOrder.Should().NotBeNull("Order should be created");
        _currentOrder.OrderId.Should().NotBeEmpty("Order should have an ID");

        _scenarioContext["CurrentOrder"] = _currentOrder;
    }

    [When(@"I complete the payment")]
    public void WhenICompleteThePayment()
    {
        var creditCard = _scenarioContext.Get<CreditCard>("CreditCard");
        var order = _scenarioContext.Get<Order>("CurrentOrder");

        _paymentResult = _paymentService.ProcessPayment(
            order.TotalAmount,
            creditCard
        );

        _scenarioContext["PaymentResult"] = _paymentResult;
    }

    [Then(@"the order should be confirmed")]
    public void ThenTheOrderShouldBeConfirmed()
    {
        var paymentResult = _scenarioContext.Get<PaymentResult>("PaymentResult");
        paymentResult.Success.Should().BeTrue("Payment should be successful");

        var order = _scenarioContext.Get<Order>("CurrentOrder");
        var confirmedOrder = _orderService.GetOrder(order.OrderId);

        confirmedOrder.Status.Should().Be(OrderStatus.Confirmed);
        confirmedOrder.PaymentId.Should().Be(paymentResult.TransactionId);
    }

    [Then(@"I should receive an order confirmation email")]
    public void ThenIShouldReceiveAnOrderConfirmationEmail()
    {
        var order = _scenarioContext.Get<Order>("CurrentOrder");

        // In real scenario, you might check email service or queue
        var emailSent = _orderService.GetSentEmails()
            .Any(e => e.Type == EmailType.OrderConfirmation
                   && e.OrderId == order.OrderId);

        emailSent.Should().BeTrue("Order confirmation email should be sent");
    }

    [Then(@"the inventory should be updated")]
    public void ThenTheInventoryShouldBeUpdated()
    {
        var selectedProducts = _scenarioContext.Get<List<OrderItem>>("SelectedProducts");

        foreach (var item in selectedProducts)
        {
            var remainingStock = _orderService.GetInventoryCount(item.Product);
            // Verify inventory was decremented
            // In real scenario, you'd compare with initial stock
            remainingStock.Should().BeGreaterThanOrEqualTo(0);
        }
    }
}

public class OrderItem
{
    public string Product { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
```

### Behave (Python)

**Feature File:**

```gherkin
# features/user_registration.feature
Feature: User Registration
  As a new user
  I want to create an account
  So that I can access the platform

  Scenario: Successful registration with valid details
    Given I am on the registration page
    When I fill in the registration form with:
      | Field            | Value                   |
      | Email            | john.doe@example.com    |
      | Password         | SecurePass123!          |
      | Confirm Password | SecurePass123!          |
      | First Name       | John                    |
      | Last Name        | Doe                     |
    And I accept the terms and conditions
    And I submit the registration form
    Then I should see a success message
    And a verification email should be sent to "john.doe@example.com"
    And the user account should be created in the database
```

**Step Definitions:**

```python
# features/steps/user_registration_steps.py
from behave import given, when, then
from hamcrest import assert_that, equal_to, is_, not_none, contains_string
from pages.registration_page import RegistrationPage
from services.user_service import UserService
from services.email_service import EmailService

@given('I am on the registration page')
def step_impl(context):
    context.registration_page = RegistrationPage(context.browser)
    context.registration_page.navigate()

    # Verify page loaded correctly
    assert_that(
        context.registration_page.is_displayed(),
        is_(True),
        "Registration page should be displayed"
    )

@when('I fill in the registration form with')
def step_impl(context):
    """
    :param context.table: Table with Field and Value columns
    """
    context.form_data = {}

    for row in context.table:
        field = row['Field']
        value = row['Value']
        context.form_data[field] = value

        # Fill in the field
        context.registration_page.fill_field(field, value)

    # Verify all fields were filled
    for field, value in context.form_data.items():
        actual_value = context.registration_page.get_field_value(field)
        assert_that(
            actual_value,
            equal_to(value),
            f"{field} should contain the entered value"
        )

@when('I accept the terms and conditions')
def step_impl(context):
    context.registration_page.accept_terms()

    assert_that(
        context.registration_page.are_terms_accepted(),
        is_(True),
        "Terms and conditions should be accepted"
    )

@when('I submit the registration form')
def step_impl(context):
    context.registration_page.submit_form()

    # Wait for form submission to complete
    context.registration_page.wait_for_submission()

@then('I should see a success message')
def step_impl(context):
    success_message = context.registration_page.get_success_message()

    assert_that(
        success_message,
        not_none(),
        "Success message should be displayed"
    )

    assert_that(
        success_message,
        contains_string("successfully registered"),
        "Success message should mention successful registration"
    )

@then('a verification email should be sent to "{email}"')
def step_impl(context, email):
    email_service = EmailService()

    # Check if verification email was sent
    sent_emails = email_service.get_sent_emails(
        recipient=email,
        email_type='verification'
    )

    assert_that(
        len(sent_emails),
        equal_to(1),
        f"Exactly one verification email should be sent to {email}"
    )

    verification_email = sent_emails[0]
    assert_that(
        verification_email['subject'],
        contains_string("Verify your email"),
        "Email should have verification subject"
    )

    # Store verification token for later use if needed
    context.verification_token = verification_email.get('token')

@then('the user account should be created in the database')
def step_impl(context):
    user_service = UserService()
    email = context.form_data['Email']

    # Verify user exists in database
    user = user_service.get_user_by_email(email)

    assert_that(user, not_none(), "User should exist in database")
    assert_that(user['email'], equal_to(email))
    assert_that(user['first_name'], equal_to(context.form_data['First Name']))
    assert_that(user['last_name'], equal_to(context.form_data['Last Name']))
    assert_that(user['is_verified'], is_(False), "User should not be verified yet")
    assert_that(user['is_active'], is_(True), "User account should be active")

    # Store user for cleanup
    context.created_user_id = user['id']
```

**Environment Setup:**

```python
# features/environment.py
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from services.database_service import DatabaseService
from services.test_data_service import TestDataService

def before_all(context):
    """Run before all tests"""
    # Setup test database connection
    context.db = DatabaseService(environment='test')
    context.test_data = TestDataService()

def before_scenario(context, scenario):
    """Run before each scenario"""
    # Setup browser
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    context.browser = webdriver.Chrome(options=chrome_options)
    context.browser.implicitly_wait(10)

    # Clean test data
    context.test_data.cleanup()

def after_scenario(context, scenario):
    """Run after each scenario"""
    # Take screenshot on failure
    if scenario.status == 'failed':
        screenshot_name = f"{scenario.name.replace(' ', '_')}.png"
        context.browser.save_screenshot(f"reports/screenshots/{screenshot_name}")

    # Cleanup created data
    if hasattr(context, 'created_user_id'):
        context.db.delete_user(context.created_user_id)

    # Close browser
    if context.browser:
        context.browser.quit()

def after_all(context):
    """Run after all tests"""
    # Close database connection
    if hasattr(context, 'db'):
        context.db.close()
```

### JBehave (Java)

**Story File:**

```gherkin
// stories/product_search.story
Narrative:
As a customer
I want to search for products
So that I can find items I want to purchase

Scenario: Search for products by keyword
Given I am on the home page
And the following products exist in the catalog:
| name              | category    | price | inStock |
| iPhone 15 Pro     | Electronics | 999   | true    |
| MacBook Pro       | Electronics | 2499  | true    |
| AirPods Pro       | Electronics | 249   | false   |
| Samsung Galaxy    | Electronics | 899   | true    |
When I search for "iPhone"
Then I should see 1 product in the results
And the results should contain "iPhone 15 Pro"
And the results should be sorted by relevance
```

**Step Definitions:**

```java
// steps/ProductSearchSteps.java
import org.jbehave.core.annotations.*;
import org.jbehave.core.model.ExamplesTable;
import static org.junit.Assert.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

public class ProductSearchSteps {

    private HomePage homePage;
    private SearchResultsPage searchResultsPage;
    private ProductService productService;
    private List<Product> products;

    @BeforeScenario
    public void setup() {
        homePage = new HomePage();
        productService = new ProductService();
        products = new ArrayList<>();
    }

    @Given("I am on the home page")
    public void navigateToHomePage() {
        homePage.navigate();
        assertTrue("Home page should be displayed", homePage.isDisplayed());
    }

    @Given("the following products exist in the catalog: $productsTable")
    public void createProductsInCatalog(ExamplesTable productsTable) {
        for (Map<String, String> row : productsTable.getRows()) {
            Product product = Product.builder()
                .name(row.get("name"))
                .category(row.get("category"))
                .price(new BigDecimal(row.get("price")))
                .inStock(Boolean.parseBoolean(row.get("inStock")))
                .build();

            productService.createProduct(product);
            products.add(product);
        }

        assertThat("Products should be created",
                   products.size(),
                   equalTo(productsTable.getRowCount()));
    }

    @When("I search for \"$searchTerm\"")
    public void searchForProducts(String searchTerm) {
        homePage.enterSearchTerm(searchTerm);
        searchResultsPage = homePage.submitSearch();

        assertTrue("Search results page should be displayed",
                   searchResultsPage.isDisplayed());
    }

    @Then("I should see $count product in the results")
    public void verifyProductCount(int expectedCount) {
        int actualCount = searchResultsPage.getProductCount();
        assertThat("Product count should match",
                   actualCount,
                   equalTo(expectedCount));
    }

    @Then("the results should contain \"$productName\"")
    public void verifyProductInResults(String productName) {
        List<String> productNames = searchResultsPage.getProductNames();
        assertThat("Results should contain product",
                   productNames,
                   hasItem(containsString(productName)));
    }

    @Then("the results should be sorted by relevance")
    public void verifySortedByRelevance() {
        List<SearchResult> results = searchResultsPage.getSearchResults();

        // Verify results are sorted by relevance score (descending)
        for (int i = 0; i < results.size() - 1; i++) {
            assertThat("Results should be sorted by relevance",
                       results.get(i).getRelevanceScore(),
                       greaterThanOrEqualTo(results.get(i + 1).getRelevanceScore()));
        }
    }

    @AfterScenario
    public void cleanup() {
        // Clean up test data
        for (Product product : products) {
            productService.deleteProduct(product.getId());
        }
        products.clear();
    }
}
```

## BDD for Different Application Types

### Web Applications

```gherkin
Feature: Responsive Navigation Menu

  Scenario: Mobile menu displays correctly
    Given I am viewing the site on a mobile device
    And the viewport width is 375 pixels
    When I tap the hamburger menu icon
    Then the navigation menu should slide in from the left
    And the menu should overlay the content
    And the menu should contain all navigation links

  Scenario: Desktop menu is always visible
    Given I am viewing the site on a desktop
    And the viewport width is 1920 pixels
    Then the navigation menu should be visible in the header
    And all menu items should be displayed horizontally
    And no hamburger icon should be visible
```

### REST APIs

```gherkin
Feature: User API

  Scenario: Get user by ID
    Given a user exists with ID "123" and the following details:
      | firstName | lastName | email              | status |
      | John      | Doe      | john@example.com   | active |
    When I send a GET request to "/api/users/123"
    Then the response status code should be 200
    And the response should have the following JSON structure:
      """
      {
        "id": "123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "status": "active",
        "createdAt": "<timestamp>",
        "updatedAt": "<timestamp>"
      }
      """
    And the response time should be less than 200 milliseconds
```

**Step Definitions:**

```typescript
// step_definitions/api.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios, { AxiosResponse } from 'axios';

interface ApiWorld {
  response?: AxiosResponse;
  responseTime?: number;
  testUser?: any;
}

Given(
  'a user exists with ID {string} and the following details:',
  async function (this: ApiWorld, userId: string, dataTable) {
    const userData = dataTable.rowsHash();

    // Create test user
    this.testUser = await axios.post('http://api.example.com/api/users', {
      id: userId,
      ...userData,
    });

    expect(this.testUser.status).to.equal(201);
  }
);

When('I send a GET request to {string}', async function (this: ApiWorld, endpoint: string) {
  const startTime = Date.now();

  try {
    this.response = await axios.get(`http://api.example.com${endpoint}`);
  } catch (error: any) {
    // Store error response for negative scenarios
    this.response = error.response;
  }

  this.responseTime = Date.now() - startTime;
});

Then('the response status code should be {int}', function (this: ApiWorld, expectedStatus: number) {
  expect(this.response?.status).to.equal(expectedStatus);
});

Then(
  'the response should have the following JSON structure:',
  function (this: ApiWorld, expectedJson: string) {
    const expected = JSON.parse(expectedJson);
    const actual = this.response?.data;

    // Compare structure, allowing <timestamp> placeholders
    for (const [key, value] of Object.entries(expected)) {
      if (value === '<timestamp>') {
        expect(actual[key]).to.match(/^\d{4}-\d{2}-\d{2}T/);
      } else {
        expect(actual[key]).to.deep.equal(value);
      }
    }
  }
);

Then(
  'the response time should be less than {int} milliseconds',
  function (this: ApiWorld, maxTime: number) {
    expect(this.responseTime).to.be.lessThan(maxTime);
  }
);
```

### Microservices

```gherkin
Feature: Order Processing Workflow

  Scenario: Successful order placement triggers inventory update
    Given the inventory service has 100 units of product "SKU-123"
    And the payment service is available
    When I place an order for 5 units of product "SKU-123"
    Then the order should be created successfully
    And a "OrderCreated" event should be published to the message queue
    And the inventory service should receive the "OrderCreated" event
    And the inventory for product "SKU-123" should be reduced to 95 units
    And the order status should be "CONFIRMED"

  Scenario: Order fails when payment service is unavailable
    Given the payment service is unavailable
    When I attempt to place an order for product "SKU-123"
    Then the order should not be created
    And an error message should be returned
    And no inventory should be reserved
    And the circuit breaker should record the failure
```

### Mobile Applications

```gherkin
Feature: Mobile App Authentication

  Scenario: Biometric login on iOS
    Given I am on the login screen
    And biometric authentication is enabled on the device
    And I have previously logged in with valid credentials
    When I tap "Login with Face ID"
    Then the Face ID prompt should appear
    When Face ID authentication succeeds
    Then I should be logged in
    And I should see the home screen
    And my session should be persisted
```

## Best Practices

### Writing Effective Scenarios

**DO:**

```gherkin
✓ Scenario: Add item to empty cart
  Given I am logged in as "customer@example.com"
  And my shopping cart is empty
  When I add "iPhone 15" to my cart
  Then my cart should contain 1 item
  And the cart total should be $999
```

**DON'T:**

```gherkin
✗ Scenario: Cart functionality
  Given I navigate to "https://example.com/login"
  And I enter "customer@example.com" in the textbox with id "email"
  And I enter "password123" in the textbox with id "password"
  And I click the button with class "submit-btn"
  Then I should see "Welcome" on the page
  And I click the link with text "Products"
  And I click the first product image
  And I click the button with id "add-to-cart-btn"
  Then the cart icon should show "1"
```

### Guidelines

```
BDD Scenario Guidelines:

Declarative (What) not Imperative (How)
✓ When I add an item to my cart
✗ When I click the "Add to Cart" button

Business Language not Technical Jargon
✓ When I complete the checkout process
✗ When I POST to /api/orders with valid JSON

Focus on Behavior not Implementation
✓ Then I should receive an order confirmation
✗ Then the Orders table should have 1 new row

One Scenario = One Behavior
✓ Scenario focuses on successful login
✗ Scenario tests login, navigation, search, and checkout

Use Background for Common Setup
✓ Background: Given I am logged in
✗ Repeat "Given I am logged in" in every scenario

Keep Scenarios Independent
✓ Each scenario can run in isolation
✗ Scenario depends on data from previous scenario

Use Meaningful Data
✓ Given the account balance is $100
✗ Given the account balance is $1234.56789

Avoid UI-Specific Details
✓ When I search for "iPhone"
✗ When I enter "iPhone" in the search box and click Search
```

### Scenario Organization

```
Feature File Structure:

feature-name.feature
├── Feature Description
│   ├── Short title
│   ├── As a [role]
│   ├── I want [capability]
│   └── So that [benefit]
│
├── Background (optional)
│   └── Common setup steps
│
├── Scenario 1: Happy Path
│   ├── Given (setup/context)
│   ├── When (action)
│   └── Then (assertions)
│
├── Scenario 2: Alternative Path
│
├── Scenario 3: Error Case
│
└── Scenario Outline: Multiple Variations
    └── Examples table
```

### Data Management

**Use Scenario Context:**

```typescript
// Store data in context for use across steps
Given('I create a new user account', async function () {
  this.user = await createUser({
    email: 'test@example.com',
    password: 'SecurePass123!',
  });

  // Store for later steps
  this.userId = this.user.id;
});

Then('the user profile should be accessible', async function () {
  const profile = await getProfile(this.userId);
  expect(profile).to.exist;
});
```

**External Data Files:**

```gherkin
Scenario: Import users from CSV
  Given I have a CSV file "test-data/users.csv" with:
    | email              | firstName | lastName | role  |
    | john@example.com   | John      | Doe      | admin |
    | jane@example.com   | Jane      | Smith    | user  |
  When I import the users
  Then 2 users should be created
  And all users should be active
```

### Tags and Organization

```gherkin
@smoke @authentication @critical
Feature: User Authentication

  @happy-path @fast
  Scenario: Successful login
    Given I have valid credentials
    When I log in
    Then I should be authenticated

  @error-handling @security
  Scenario: Failed login attempt
    Given I have invalid credentials
    When I attempt to log in
    Then I should see an error message
    And my account should not be locked

  @slow @integration
  Scenario: SSO login
    Given I have an active SSO session
    When I access the application
    Then I should be automatically logged in
```

**Run specific tags:**

```bash
# Run only smoke tests
npm run test:bdd -- --tags "@smoke"

# Run all except slow tests
npm run test:bdd -- --tags "not @slow"

# Run critical authentication tests
npm run test:bdd -- --tags "@critical and @authentication"
```

## Living Documentation

### Generating Reports

**Cucumber HTML Reporter:**

```javascript
// cucumber-report.js
const reporter = require('cucumber-html-reporter');

const options = {
  theme: 'bootstrap',
  jsonFile: 'reports/cucumber-report.json',
  output: 'reports/cucumber-report.html',
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  metadata: {
    'App Version': '1.2.3',
    'Test Environment': 'STAGING',
    Browser: 'Chrome 120.0',
    Platform: 'macOS',
    Executed: new Date().toISOString(),
  },
};

reporter.generate(options);
```

**Allure Reports:**

```typescript
// cucumber.js with Allure
module.exports = {
  default: {
    format: ['json:reports/cucumber-report.json', 'allure-cucumberjs/reporter'],
    formatOptions: {
      resultsDir: 'allure-results',
    },
  },
};
```

```bash
# Generate and open Allure report
npm run test:bdd
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### Documentation as Code

```
BDD = Living Documentation

Traditional Documentation          Living Documentation (BDD)
├── Written once                   ├── Executable specifications
├── Quickly outdated               ├── Always up-to-date
├── Separate from code             ├── Part of codebase
├── Manual verification needed     ├── Automatically validated
└── Hard to maintain               └── Evolves with system

Benefits:
- Single source of truth
- Automatically validated
- Always reflects current behavior
- Shared understanding across team
- Reduces documentation debt
```

## Common Patterns and Anti-Patterns

### Patterns

**Page Object Pattern:**

```typescript
// pages/LoginPage.ts
export class LoginPage {
  private driver: WebDriver;

  private selectors = {
    emailInput: By.id('email'),
    passwordInput: By.id('password'),
    loginButton: By.css('[data-testid="login-button"]'),
    errorMessage: By.css('.error-message'),
  };

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async navigate(): Promise<void> {
    await this.driver.get('https://example.com/login');
  }

  async enterEmail(email: string): Promise<void> {
    const input = await this.driver.findElement(this.selectors.emailInput);
    await input.clear();
    await input.sendKeys(email);
  }

  async enterPassword(password: string): Promise<void> {
    const input = await this.driver.findElement(this.selectors.passwordInput);
    await input.clear();
    await input.sendKeys(password);
  }

  async clickLogin(): Promise<void> {
    const button = await this.driver.findElement(this.selectors.loginButton);
    await button.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  async getErrorMessage(): Promise<string> {
    const element = await this.driver.findElement(this.selectors.errorMessage);
    return await element.getText();
  }
}
```

**Service Layer Pattern:**

```typescript
// services/UserService.ts
export class UserService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient(process.env.API_BASE_URL);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.apiClient.post('/users', userData);

    if (response.status !== 201) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    return response.data;
  }

  async getUserById(userId: string): Promise<User> {
    const response = await this.apiClient.get(`/users/${userId}`);

    if (response.status !== 200) {
      throw new Error(`User not found: ${userId}`);
    }

    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.apiClient.delete(`/users/${userId}`);
  }
}
```

### Anti-Patterns

**❌ UI-Driven Scenarios:**

```gherkin
# BAD: Too much UI detail
Scenario: Login
  Given I open the browser
  And I navigate to "https://example.com/login"
  When I type "user@example.com" in the input field with id "email"
  And I type "password123" in the input field with id "password"
  And I click the button with class "btn-primary"
  Then I should see the text "Welcome" on the page
```

**✓ Behavior-Driven Scenarios:**

```gherkin
# GOOD: Focus on behavior
Scenario: Login
  Given I am on the login page
  When I log in with valid credentials
  Then I should see the dashboard
```

**❌ Overly Generic Steps:**

```gherkin
# BAD: Too generic, hard to understand
Scenario: Process thing
  Given the system is ready
  When I do the thing
  Then it should work
```

**✓ Specific, Clear Steps:**

```gherkin
# GOOD: Clear and specific
Scenario: Place order
  Given I have items in my shopping cart
  When I complete the checkout process
  Then my order should be confirmed
```

**❌ Testing Implementation Details:**

```gherkin
# BAD: Implementation details
Scenario: Save user
  When I call UserRepository.save() with user data
  Then the users table should have 1 new row
  And the user_audit table should be updated
```

**✓ Testing Business Behavior:**

```gherkin
# GOOD: Business behavior
Scenario: Create user account
  When I register a new user account
  Then the account should be created
  And I should receive a confirmation email
```

## BDD in CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/bdd-tests.yml
name: BDD Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  bdd-tests:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run BDD tests
        run: npm run test:bdd
        env:
          API_BASE_URL: ${{ secrets.TEST_API_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Generate Cucumber report
        if: always()
        run: npm run report:cucumber

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: bdd-test-results
          path: |
            reports/cucumber-report.html
            reports/cucumber-report.json
            reports/screenshots/

      - name: Publish test results
        if: always()
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: reports/cucumber-report.xml

      - name: Comment PR with results
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('reports/cucumber-report.json'));

            let passed = 0, failed = 0, skipped = 0;
            report.forEach(feature => {
              feature.elements.forEach(scenario => {
                const scenarioStatus = scenario.steps.every(s => s.result.status === 'passed');
                if (scenarioStatus) passed++;
                else if (scenario.steps.some(s => s.result.status === 'failed')) failed++;
                else skipped++;
              });
            });

            const body = `## BDD Test Results

            - ✅ Passed: ${passed}
            - ❌ Failed: ${failed}
            - ⏭️ Skipped: ${skipped}

            [View detailed report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

### Running Specific Scenarios

```bash
# Run all scenarios
npm run test:bdd

# Run scenarios with specific tag
npm run test:bdd -- --tags "@smoke"

# Run specific feature file
npm run test:bdd -- features/authentication.feature

# Run with specific profile
npm run test:bdd -- --profile ci

# Parallel execution
npm run test:bdd -- --parallel 4
```

## Metrics and KPIs

### BDD Adoption Metrics

```
Scenario Coverage
= (Number of scenarios / Number of user stories) × 100%

Goal: > 80%

Scenario Pass Rate
= (Passed scenarios / Total scenarios) × 100%

Goal: > 95%

Automation Rate
= (Automated scenarios / Total scenarios) × 100%

Goal: > 90%

Living Documentation Coverage
= (Features with scenarios / Total features) × 100%

Goal: 100%

Three Amigos Session Attendance
= Sessions with all three roles present / Total sessions

Goal: 100%

Defect Prevention Rate
= Defects found in BDD / Total defects

Goal: > 60%
```

### Scenario Quality Metrics

```
Average Scenario Length
= Total steps / Number of scenarios

Optimal: 3-7 steps

Scenario Independence
= Scenarios runnable in isolation / Total scenarios

Goal: 100%

Step Reusability
= Reused step definitions / Total step definitions

Goal: > 70%

Failed Scenario Resolution Time
= Time from failure to fix

Goal: < 1 day
```

## Integration with Other Practices

### BDD + TDD

```
Outside-In Development:

1. BDD (Outside)
   └── Write acceptance scenario
       └── Red (Failing scenario)

2. TDD (Inside)
   └── Write unit test
       └── Red (Failing test)
       └── Green (Make it pass)
       └── Refactor

3. BDD (Outside)
   └── Run acceptance scenario
       └── Green (Scenario passes)
       └── Refactor
```

### BDD + DDD (Domain-Driven Design)

```gherkin
# Use ubiquitous language from domain model
Feature: Aggregate Order Processing

  Scenario: Place order within credit limit
    Given a customer with credit limit of $5000
    And available credit of $3000
    When the customer places an order totaling $2000
    Then the order should be approved
    And the available credit should be $1000
    And an OrderPlaced domain event should be published
```

### BDD + DevOps

```
BDD in DevOps:

Development → BDD Scenarios → CI Pipeline → Deployment
    ↑              ↓              ↓              ↓
Feedback ← Living Docs ← Monitoring ← Production

Benefits:
- Shift-left testing
- Continuous feedback
- Living documentation
- Automated acceptance
- Fast failure detection
```

## Troubleshooting Common Issues

### Flaky Scenarios

**Problem:** Scenarios pass sometimes, fail other times

**Solutions:**

```typescript
// 1. Proper waits
await driver.wait(until.elementLocated(By.id('result')), 10000);

// 2. Retry logic
async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

// 3. Stable selectors
// Bad: By.xpath('//div[3]/span[2]')
// Good: By.css('[data-testid="user-name"]')

// 4. Test data isolation
beforeEach(async () => {
  await database.cleanTestData();
  await database.seedTestData();
});
```

### Slow Execution

**Solutions:**

```javascript
// 1. Parallel execution
// cucumber.js
module.exports = {
  default: {
    parallel: 4
  }
};

// 2. Tag-based execution
// Run only fast tests in PR builds
npm run test:bdd -- --tags "@fast"

// 3. Headless browsers
const chromeOptions = new ChromeOptions();
chromeOptions.addArguments('--headless');

// 4. API-level setup
// Use API to setup data instead of UI
Given('a user exists', async function() {
  // Fast: API call
  this.user = await api.createUser(userData);

  // Slow: UI interaction
  // await loginPage.navigate();
  // await loginPage.register(userData);
});
```

### Maintenance Burden

**Solutions:**

```
1. Step Definition Reusability
   - Create generic, reusable steps
   - Use parameters and data tables
   - Avoid scenario-specific steps

2. Page Object Pattern
   - Centralize UI interactions
   - Single point of maintenance
   - Reduces duplication

3. Regular Refactoring
   - Remove unused steps
   - Consolidate similar steps
   - Improve step clarity

4. Clear Ownership
   - Assign feature owners
   - Regular reviews
   - Documentation updates
```

## Tools and Resources

### BDD Frameworks

| Language      | Framework    | Website                            |
| ------------- | ------------ | ---------------------------------- |
| JavaScript/TS | Cucumber.js  | cucumber.io                        |
| Java          | Cucumber-JVM | cucumber.io/docs/installation/java |
| Java          | JBehave      | jbehave.org                        |
| .NET/C#       | SpecFlow     | specflow.org                       |
| Python        | Behave       | behave.readthedocs.io              |
| Ruby          | Cucumber     | cucumber.io/docs/installation/ruby |
| PHP           | Behat        | behat.org                          |

### Supporting Tools

```
IDE Plugins:
- Cucumber for VS Code
- Gherkin Syntax Highlighter
- Cucumber.js Step Definition Generator

Reporting:
- Cucumber HTML Reporter
- Allure Framework
- Serenity BDD

CI/CD Integration:
- Jenkins Cucumber Plugin
- GitLab BDD Reports
- Azure DevOps Cucumber

Collaboration:
- Cucumber Studio (formerly Hiptest)
- Jira + Cucumber Integration
- Confluence + Living Documentation
```

### Learning Resources

**Books:**

- "BDD in Action" by John Ferguson Smart
- "The Cucumber Book" by Matt Wynne and Aslak Hellesøy
- "Specification by Example" by Gojko Adzic

**Online Courses:**

- Cucumber School (cucumber.io/school)
- Test Automation University - BDD courses
- Pluralsight - BDD courses

**Communities:**

- Cucumber Community Slack
- BDD discussions on Reddit r/softwaretesting
- Stack Overflow [bdd] tag

## Related Resources

- [Test-Driven Development (TDD)](../04-testing-strategy/tdd.md)
- [Acceptance Testing](../05-test-levels/acceptance-testing.md)
- [Test Design Techniques](../04-testing-strategy/test-design.md)
- [Continuous Integration](../08-cicd-pipeline/continuous-integration.md)
- [Living Documentation](../09-metrics-monitoring/documentation.md)

## References

- **ISTQB**: Foundation Level Syllabus - Test Design Techniques
- **Cucumber Documentation**: cucumber.io/docs
- **SpecFlow Documentation**: docs.specflow.org
- **"BDD in Action"**: John Ferguson Smart, Manning Publications
- **"The Cucumber Book"**: Matt Wynne, Aslak Hellesøy, Pragmatic Bookshelf
- **ISO/IEC/IEEE 29119**: Software Testing Standards
- **Gojko Adzic**: "Specification by Example"

---

**Part of**: [Development Practices](README.md)
