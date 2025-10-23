# Clean Code Principles

## Purpose

Comprehensive guide to clean code principles—writing code that is readable, maintainable, testable, and expressive, following industry best practices and design principles.

## Overview

Clean code is:

- Easy to read and understand
- Simple and focused
- Well-tested
- Minimal and expressive
- Maintainable and extensible

## What is Clean Code?

### Definition

Clean code is code that is easy to understand and easy to change. It reads like well-written prose, clearly expressing intent while minimizing complexity.

### Why Clean Code Matters

```
Benefits of Clean Code:

Readability
├── Faster code reviews
├── Easier onboarding
├── Better collaboration
└── Reduced cognitive load

Maintainability
├── Easier to modify
├── Fewer bugs introduced
├── Faster feature development
└── Lower technical debt

Quality
├── Easier to test
├── Fewer defects
├── Better design
└── More reliable
```

## SOLID Principles

### Single Responsibility Principle (SRP)

**Definition:** A class should have only one reason to change

```javascript
// ❌ Bad: Multiple responsibilities
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  save() {
    // Database logic
    database.save(this);
  }

  sendEmail(message) {
    // Email logic
    emailService.send(this.email, message);
  }

  generateReport() {
    // Reporting logic
    return `User Report: ${this.name}`;
  }
}

// ✅ Good: Single responsibility per class
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}

class UserRepository {
  save(user) {
    database.save(user);
  }

  findById(id) {
    return database.findOne({ id });
  }
}

class EmailService {
  sendToUser(user, message) {
    this.send(user.email, message);
  }
}

class UserReportGenerator {
  generate(user) {
    return `User Report: ${user.name}`;
  }
}
```

### Open/Closed Principle (OCP)

**Definition:** Software entities should be open for extension but closed for modification

```javascript
// ❌ Bad: Must modify class to add new shape
class AreaCalculator {
  calculate(shapes) {
    let totalArea = 0;

    for (const shape of shapes) {
      if (shape.type === 'circle') {
        totalArea += Math.PI * shape.radius ** 2;
      } else if (shape.type === 'rectangle') {
        totalArea += shape.width * shape.height;
      } else if (shape.type === 'triangle') {
        totalArea += (shape.base * shape.height) / 2;
      }
    }

    return totalArea;
  }
}

// ✅ Good: Extend by adding new shape classes
class Shape {
  area() {
    throw new Error('Must implement area()');
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }
}

class AreaCalculator {
  calculate(shapes) {
    return shapes.reduce((total, shape) => total + shape.area(), 0);
  }
}

// Add new shape without modifying AreaCalculator
class Triangle extends Shape {
  constructor(base, height) {
    super();
    this.base = base;
    this.height = height;
  }

  area() {
    return (this.base * this.height) / 2;
  }
}
```

### Liskov Substitution Principle (LSP)

**Definition:** Subtypes must be substitutable for their base types

```javascript
// ❌ Bad: Violates LSP - Square changes Rectangle behavior
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  setWidth(width) {
    this.width = width;
  }

  setHeight(height) {
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(width) {
    this.width = width;
    this.height = width; // Breaks LSP
  }

  setHeight(height) {
    this.width = height; // Breaks LSP
    this.height = height;
  }
}

// Problem:
const rect = new Rectangle(5, 10);
rect.setWidth(6);
console.log(rect.area()); // 60 - Expected

const square = new Square(5, 5);
square.setWidth(6);
console.log(square.area()); // 36 - Unexpected if treated as Rectangle

// ✅ Good: Separate hierarchies
class Shape {
  area() {
    throw new Error('Must implement');
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }
}

class Square extends Shape {
  constructor(side) {
    super();
    this.side = side;
  }

  area() {
    return this.side ** 2;
  }
}
```

### Interface Segregation Principle (ISP)

**Definition:** Clients should not be forced to depend on interfaces they don't use

```typescript
// ❌ Bad: Fat interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class HumanWorker implements Worker {
  work() {
    /* ... */
  }
  eat() {
    /* ... */
  }
  sleep() {
    /* ... */
  }
}

class RobotWorker implements Worker {
  work() {
    /* ... */
  }
  eat() {
    /* Robots don't eat */
  }
  sleep() {
    /* Robots don't sleep */
  }
}

// ✅ Good: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class HumanWorker implements Workable, Eatable, Sleepable {
  work() {
    /* ... */
  }
  eat() {
    /* ... */
  }
  sleep() {
    /* ... */
  }
}

class RobotWorker implements Workable {
  work() {
    /* ... */
  }
}
```

### Dependency Inversion Principle (DIP)

**Definition:** Depend on abstractions, not concretions

```javascript
// ❌ Bad: High-level module depends on low-level module
class MySQLDatabase {
  save(data) {
    // MySQL-specific save
  }
}

class UserService {
  constructor() {
    this.database = new MySQLDatabase(); // Hard dependency
  }

  createUser(userData) {
    this.database.save(userData);
  }
}

// ✅ Good: Depend on abstraction (interface)
class Database {
  save(data) {
    throw new Error('Must implement');
  }
}

class MySQLDatabase extends Database {
  save(data) {
    // MySQL-specific implementation
  }
}

class MongoDatabase extends Database {
  save(data) {
    // MongoDB-specific implementation
  }
}

class UserService {
  constructor(database) {
    this.database = database; // Injected dependency
  }

  createUser(userData) {
    this.database.save(userData);
  }
}

// Usage
const mySQLService = new UserService(new MySQLDatabase());
const mongoService = new UserService(new MongoDatabase());
```

## Clean Code Rules

### Meaningful Names

```javascript
// ❌ Bad: Unclear names
const d = new Date();
let x = 0;
function proc(arr) {
  let temp = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].s === 1) {
      temp.push(arr[i]);
    }
  }
  return temp;
}

// ✅ Good: Clear, descriptive names
const createdDate = new Date();
let activeUserCount = 0;

function filterActiveUsers(users) {
  const activeUsers = [];
  for (const user of users) {
    if (user.status === 'active') {
      activeUsers.push(user);
    }
  }
  return activeUsers;
}

// ✅ Even better: Modern JavaScript
function filterActiveUsers(users) {
  return users.filter(user => user.status === 'active');
}
```

### Functions Should Be Small

```javascript
// ❌ Bad: Large function doing too much
function processOrder(order) {
  // Validate order
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  for (const item of order.items) {
    if (!item.productId || !item.quantity) {
      throw new Error('Invalid item');
    }
  }

  // Calculate total
  let total = 0;
  for (const item of order.items) {
    const product = database.getProduct(item.productId);
    total += product.price * item.quantity;
  }
  order.total = total;

  // Apply discount
  if (order.couponCode) {
    const coupon = database.getCoupon(order.couponCode);
    if (coupon && coupon.isValid) {
      order.total -= coupon.discount;
    }
  }

  // Process payment
  const paymentResult = paymentGateway.charge(order.total, order.paymentMethod);
  if (!paymentResult.success) {
    throw new Error('Payment failed');
  }

  // Update inventory
  for (const item of order.items) {
    database.updateInventory(item.productId, -item.quantity);
  }

  // Send confirmation
  emailService.send(order.customerEmail, 'Order Confirmation', orderDetails);

  return order;
}

// ✅ Good: Small, focused functions
function processOrder(order) {
  validateOrder(order);
  calculateTotal(order);
  applyDiscount(order);
  processPayment(order);
  updateInventory(order);
  sendConfirmation(order);
  return order;
}

function validateOrder(order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }

  for (const item of order.items) {
    if (!item.productId || !item.quantity) {
      throw new Error('Invalid item');
    }
  }
}

function calculateTotal(order) {
  order.total = order.items.reduce((total, item) => {
    const product = database.getProduct(item.productId);
    return total + product.price * item.quantity;
  }, 0);
}

function applyDiscount(order) {
  if (!order.couponCode) return;

  const coupon = database.getCoupon(order.couponCode);
  if (coupon && coupon.isValid) {
    order.total -= coupon.discount;
  }
}

function processPayment(order) {
  const result = paymentGateway.charge(order.total, order.paymentMethod);
  if (!result.success) {
    throw new Error('Payment failed');
  }
}

function updateInventory(order) {
  for (const item of order.items) {
    database.updateInventory(item.productId, -item.quantity);
  }
}

function sendConfirmation(order) {
  emailService.send(order.customerEmail, 'Order Confirmation', order);
}
```

### Function Arguments

```javascript
// ❌ Bad: Too many arguments
function createUser(name, email, age, address, city, state, zip, country, phone) {
  // ...
}

// ✅ Good: Use object parameter
function createUser({ name, email, age, address, city, state, zip, country, phone }) {
  // ...
}

// ✅ Better: Use builder pattern or separate value objects
class UserBuilder {
  constructor() {
    this.user = {};
  }

  withPersonalInfo(name, email, age) {
    this.user.name = name;
    this.user.email = email;
    this.user.age = age;
    return this;
  }

  withAddress(address) {
    this.user.address = address;
    return this;
  }

  withContact(phone) {
    this.user.phone = phone;
    return this;
  }

  build() {
    return this.user;
  }
}

const user = new UserBuilder()
  .withPersonalInfo('John', 'john@example.com', 30)
  .withAddress({ street: '123 Main', city: 'NYC', state: 'NY', zip: '10001' })
  .withContact('555-1234')
  .build();
```

### Don't Repeat Yourself (DRY)

```javascript
// ❌ Bad: Duplication
function calculateOrderTotalForRegularCustomer(order) {
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  total += total * 0.08; // Tax
  return total;
}

function calculateOrderTotalForPremiumCustomer(order) {
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  total -= total * 0.1; // 10% discount
  total += total * 0.08; // Tax
  return total;
}

// ✅ Good: Extract common logic
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyTax(amount) {
  return amount * 1.08;
}

function calculateOrderTotal(order, discount = 0) {
  let total = calculateSubtotal(order.items);
  total -= total * discount;
  return applyTax(total);
}

// Usage
const regularTotal = calculateOrderTotal(order);
const premiumTotal = calculateOrderTotal(order, 0.1);
```

### Comments

```javascript
// ❌ Bad: Obvious comments
// Increment i
i++;

// Check if user is active
if (user.status === 'active') {
  // ...
}

// ❌ Bad: Commented-out code
// function oldFunction() {
//   // ...
// }

// ❌ Bad: Misleading comments
// Returns the total price
function calculate(items) {
  return items.length; // Actually returns count!
}

// ✅ Good: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API
// when it's experiencing issues
function retryWithBackoff(fn, maxRetries = 3) {
  // ...
}

// ✅ Good: Explain complex business logic
// Calculate prorated amount based on days remaining in billing cycle
// Formula: (daysRemaining / totalDaysInCycle) * monthlyPrice
function calculateProratedAmount(startDate, endDate, monthlyPrice) {
  const daysRemaining = calculateDays(startDate, endDate);
  const totalDays = getDaysInMonth(startDate);
  return (daysRemaining / totalDays) * monthlyPrice;
}

// ✅ Best: Self-documenting code
function isEligibleForDiscount(user) {
  return user.isPremiumMember || user.orderCount > 10;
}
```

### Error Handling

```javascript
// ❌ Bad: Ignoring errors
function fetchUserData(userId) {
  try {
    return api.get(`/users/${userId}`);
  } catch (error) {
    // Silent failure
  }
}

// ❌ Bad: Generic error messages
function createOrder(orderData) {
  if (!orderData.items) {
    throw new Error('Error');
  }
}

// ✅ Good: Specific error handling
function fetchUserData(userId) {
  try {
    return api.get(`/users/${userId}`);
  } catch (error) {
    if (error.status === 404) {
      throw new UserNotFoundError(`User ${userId} not found`);
    }
    if (error.status === 403) {
      throw new UnauthorizedError('Access denied to user data');
    }
    throw new ApiError('Failed to fetch user data', error);
  }
}

// ✅ Good: Validation with clear messages
function createOrder(orderData) {
  if (!orderData.items || orderData.items.length === 0) {
    throw new ValidationError('Order must contain at least one item');
  }

  if (!orderData.customerId) {
    throw new ValidationError('Customer ID is required');
  }

  if (!orderData.paymentMethod) {
    throw new ValidationError('Payment method is required');
  }

  // Process order...
}

// ✅ Good: Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}
```

## Code Smells

### Long Method

```javascript
// ❌ Code Smell: Method too long (>20 lines)
function processUserRegistration(userData) {
  // 100+ lines of code
}

// ✅ Solution: Extract smaller methods
function processUserRegistration(userData) {
  validateUserData(userData);
  const user = createUser(userData);
  sendWelcomeEmail(user);
  logRegistration(user);
  return user;
}
```

### Large Class

```javascript
// ❌ Code Smell: Class does too much
class User {
  // Authentication
  login() {}
  logout() {}

  // Profile management
  updateProfile() {}
  uploadAvatar() {}

  // Orders
  createOrder() {}
  cancelOrder() {}

  // Payments
  addPaymentMethod() {}
  charge() {}

  // Notifications
  sendEmail() {}
  sendSMS() {}
}

// ✅ Solution: Split into focused classes
class AuthenticationService {
  login(user) {}
  logout(user) {}
}

class UserProfileService {
  updateProfile(user, data) {}
  uploadAvatar(user, file) {}
}

class OrderService {
  createOrder(user, orderData) {}
  cancelOrder(orderId) {}
}
```

### Primitive Obsession

```javascript
// ❌ Code Smell: Using primitives everywhere
function calculateShipping(amount, country, state, zip) {
  // ...
}

// ✅ Solution: Create value objects
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }

  add(other) {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}

class Address {
  constructor(country, state, zip, street) {
    this.country = country;
    this.state = state;
    this.zip = zip;
    this.street = street;
  }

  isInternational() {
    return this.country !== 'US';
  }
}

function calculateShipping(amount, address) {
  if (address.isInternational()) {
    return amount.add(new Money(15, 'USD'));
  }
  return amount.add(new Money(5, 'USD'));
}
```

### Feature Envy

```javascript
// ❌ Code Smell: Method uses another object's data more than its own
class ShoppingCart {
  calculateTotal() {
    let total = 0;
    for (const item of this.items) {
      total += item.product.price * item.quantity;
      if (item.product.discount) {
        total -= item.product.discount * item.quantity;
      }
    }
    return total;
  }
}

// ✅ Solution: Move behavior to the envied class
class CartItem {
  constructor(product, quantity) {
    this.product = product;
    this.quantity = quantity;
  }

  getTotal() {
    const basePrice = this.product.price * this.quantity;
    const discount = (this.product.discount || 0) * this.quantity;
    return basePrice - discount;
  }
}

class ShoppingCart {
  calculateTotal() {
    return this.items.reduce((total, item) => total + item.getTotal(), 0);
  }
}
```

## Clean Code Checklist

### Function/Method Checklist

- [ ] Does one thing and does it well
- [ ] Has a clear, descriptive name
- [ ] ≤ 20 lines of code
- [ ] ≤ 3 parameters (use objects if more needed)
- [ ] No side effects (unless explicitly expected)
- [ ] Returns consistent types
- [ ] Handles errors appropriately

### Class Checklist

- [ ] Single responsibility
- [ ] ≤ 200 lines of code
- [ ] Clear, focused purpose
- [ ] Cohesive methods
- [ ] Minimal dependencies
- [ ] Well-encapsulated

### Code Organization Checklist

- [ ] No duplication (DRY)
- [ ] Consistent naming conventions
- [ ] Logical file structure
- [ ] Related code grouped together
- [ ] Clear separation of concerns
- [ ] Appropriate abstraction levels

### Testing Checklist

- [ ] Code is testable
- [ ] Dependencies are injectable
- [ ] No hidden dependencies
- [ ] Tests are easy to write
- [ ] Tests are easy to understand

## References

### Books

- "Clean Code" - Robert C. Martin
- "Refactoring" - Martin Fowler
- "Code Complete" - Steve McConnell
- "The Pragmatic Programmer" - Hunt & Thomas

### Articles

- [Clean Code Principles](https://www.freecodecamp.org/news/clean-coding-for-beginners/)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

## Related Topics

- [Test-Driven Development](tdd.md)
- [Refactoring](refactoring.md)
- [Code Review](../03-version-control/README.md#code-review-process)
- [Design Patterns](design-patterns.md)

---

_Part of: [Development Practices](README.md)_
