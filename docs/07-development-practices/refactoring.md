# Refactoring

## Purpose
Comprehensive guide to refactoring—the disciplined technique for restructuring existing code while preserving its external behavior, improving code quality, maintainability, and reducing technical debt.

## Overview
Refactoring is:
- Restructuring code without changing external behavior
- A continuous improvement practice
- Essential for maintaining code quality
- Supported by comprehensive test coverage
- A skill requiring practice and discipline
- Preventive maintenance for software

## What is Refactoring?

### Definition
Refactoring is the process of changing a software system in such a way that it does not alter the external behavior of the code yet improves its internal structure.

**Key Characteristics:**
- Behavior-preserving transformations
- Small, incremental changes
- Backed by automated tests
- Improves code quality metrics
- Reduces technical debt
- Makes code easier to understand and modify

### Refactoring vs Rewriting

```
┌────────────────────┬──────────────────┬──────────────────┐
│     Aspect         │   Refactoring    │    Rewriting     │
├────────────────────┼──────────────────┼──────────────────┤
│ Behavior           │ Preserved        │ May change       │
│ Scope              │ Incremental      │ Complete         │
│ Risk               │ Low              │ High             │
│ Time to Value      │ Immediate        │ Long-term        │
│ Business Impact    │ Minimal          │ Significant      │
│ Tests              │ Continue passing │ Need rewriting   │
│ Deployment         │ Continuous       │ Big bang         │
│ Learning           │ Preserved        │ Lost             │
└────────────────────┴──────────────────┴──────────────────┘
```

### The Red-Green-Refactor Cycle

```
TDD with Refactoring:

1. RED
   └── Write failing test
       └── Defines desired behavior

2. GREEN
   └── Make test pass
       └── Simplest code that works
       └── May contain duplication

3. REFACTOR
   └── Improve code structure
       └── Remove duplication
       └── Improve design
       └── Tests still pass

4. REPEAT
```

## When to Refactor

### The Rule of Three

```
1st Time: Just do it
   └── Implement the feature

2nd Time: Duplicate with discomfort
   └── Notice duplication but continue

3rd Time: Refactor
   └── Extract commonality
   └── Remove duplication
   └── Improve abstraction
```

### Refactoring Opportunities

**During Development:**
```
Before adding new feature
├── Refactor to make change easy
├── Make the change
└── Refactor again if needed

Code Review
├── Identify improvement opportunities
├── Small refactorings immediately
└── Larger ones as separate tasks

Understanding Code
├── Refactor while reading
├── Clarify intent
└── Document through code
```

**Continuous Refactoring:**
- Boy Scout Rule: Leave code better than you found it
- Opportunistic Refactoring: Small improvements during feature work
- Preparatory Refactoring: Make the change easy, then make the easy change
- Comprehension Refactoring: Understanding through restructuring

### Code Smells

#### Bloaters

**Long Method:**
```typescript
// BEFORE: Long method doing too much
function processOrder(order: Order): OrderResult {
  // Validate order (20 lines)
  if (!order.customerId) {
    throw new Error('Customer ID required');
  }
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  for (const item of order.items) {
    if (item.quantity <= 0) {
      throw new Error('Invalid quantity');
    }
    if (item.price < 0) {
      throw new Error('Invalid price');
    }
  }

  // Calculate totals (15 lines)
  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.price * item.quantity;
  }
  const taxRate = getTaxRateForRegion(order.shippingAddress.region);
  const tax = subtotal * taxRate;
  const shipping = calculateShippingCost(order);
  const total = subtotal + tax + shipping;

  // Process payment (20 lines)
  const paymentResult = paymentService.charge(
    order.paymentMethod,
    total
  );
  if (!paymentResult.success) {
    throw new Error('Payment failed');
  }

  // Update inventory (15 lines)
  for (const item of order.items) {
    const product = inventory.getProduct(item.productId);
    if (product.stock < item.quantity) {
      // Rollback payment
      paymentService.refund(paymentResult.transactionId);
      throw new Error('Insufficient stock');
    }
    inventory.decrementStock(item.productId, item.quantity);
  }

  // Create order record (10 lines)
  const orderRecord = database.orders.create({
    ...order,
    total,
    tax,
    shipping,
    status: 'CONFIRMED',
    paymentId: paymentResult.transactionId
  });

  // Send confirmation (5 lines)
  emailService.sendOrderConfirmation(order.customerId, orderRecord);

  return {
    success: true,
    orderId: orderRecord.id,
    total
  };
}

// AFTER: Extracted methods
function processOrder(order: Order): OrderResult {
  validateOrder(order);

  const pricing = calculateOrderPricing(order);
  const payment = processPayment(order, pricing.total);

  try {
    reserveInventory(order.items);
  } catch (error) {
    refundPayment(payment.transactionId);
    throw error;
  }

  const orderRecord = saveOrder(order, pricing, payment);
  notifyCustomer(orderRecord);

  return {
    success: true,
    orderId: orderRecord.id,
    total: pricing.total
  };
}

function validateOrder(order: Order): void {
  if (!order.customerId) {
    throw new Error('Customer ID required');
  }

  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }

  for (const item of order.items) {
    validateOrderItem(item);
  }
}

function validateOrderItem(item: OrderItem): void {
  if (item.quantity <= 0) {
    throw new Error('Invalid quantity');
  }

  if (item.price < 0) {
    throw new Error('Invalid price');
  }
}

function calculateOrderPricing(order: Order): OrderPricing {
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal, order.shippingAddress);
  const shipping = calculateShippingCost(order);

  return {
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping
  };
}

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

function calculateTax(
  subtotal: number,
  address: Address
): number {
  const taxRate = getTaxRateForRegion(address.region);
  return subtotal * taxRate;
}
```

**Large Class:**
```typescript
// BEFORE: God class doing everything
class UserManager {
  // User CRUD
  createUser(data: UserData) { }
  updateUser(id: string, data: Partial<UserData>) { }
  deleteUser(id: string) { }
  getUser(id: string) { }

  // Authentication
  login(email: string, password: string) { }
  logout(userId: string) { }
  resetPassword(email: string) { }
  changePassword(userId: string, newPassword: string) { }

  // Authorization
  hasPermission(userId: string, resource: string) { }
  grantPermission(userId: string, permission: string) { }
  revokePermission(userId: string, permission: string) { }

  // Profile management
  updateProfile(userId: string, profile: Profile) { }
  uploadAvatar(userId: string, image: File) { }
  getUserPreferences(userId: string) { }
  saveUserPreferences(userId: string, prefs: Preferences) { }

  // Email notifications
  sendWelcomeEmail(userId: string) { }
  sendPasswordResetEmail(userId: string) { }
  sendNotification(userId: string, message: string) { }

  // Analytics
  trackUserActivity(userId: string, activity: string) { }
  getUserStatistics(userId: string) { }
  generateUserReport(userId: string) { }

  // ... 50 more methods
}

// AFTER: Separated concerns
class UserRepository {
  create(data: UserData): User { }
  update(id: string, data: Partial<UserData>): User { }
  delete(id: string): void { }
  findById(id: string): User | null { }
  findByEmail(email: string): User | null { }
}

class AuthenticationService {
  constructor(
    private userRepo: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService
  ) {}

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await this.passwordHasher.verify(
      password,
      user.passwordHash
    );

    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = this.tokenService.generate(user.id);

    return { user, token };
  }

  async logout(userId: string): Promise<void> {
    await this.tokenService.revoke(userId);
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    const resetToken = this.tokenService.generateResetToken(user.id);
    await this.emailService.sendPasswordReset(user.email, resetToken);
  }
}

class AuthorizationService {
  constructor(private permissionRepo: PermissionRepository) {}

  async hasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const permissions = await this.permissionRepo.getUserPermissions(userId);
    return permissions.some(
      p => p.resource === resource && p.action === action
    );
  }

  async grantPermission(
    userId: string,
    permission: Permission
  ): Promise<void> {
    await this.permissionRepo.grant(userId, permission);
  }
}

class UserProfileService {
  constructor(
    private userRepo: UserRepository,
    private storageService: StorageService
  ) {}

  async updateProfile(userId: string, profile: Profile): Promise<void> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepo.update(userId, { profile });
  }

  async uploadAvatar(userId: string, image: File): Promise<string> {
    const imageUrl = await this.storageService.upload(
      `avatars/${userId}`,
      image
    );

    await this.userRepo.update(userId, { avatarUrl: imageUrl });

    return imageUrl;
  }
}

class UserNotificationService {
  constructor(private emailService: EmailService) {}

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.emailService.send({
      to: user.email,
      subject: 'Welcome!',
      template: 'welcome',
      data: { userName: user.firstName }
    });
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    await this.emailService.send({
      to: user.email,
      subject: 'Password Reset',
      template: 'password-reset',
      data: { resetUrl: `https://app.com/reset?token=${token}` }
    });
  }
}
```

**Long Parameter List:**
```typescript
// BEFORE: Too many parameters
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phoneNumber: string,
  address: string,
  city: string,
  state: string,
  zipCode: string,
  country: string,
  dateOfBirth: Date,
  gender: string,
  newsletter: boolean,
  termsAccepted: boolean
): User {
  // Implementation
}

// AFTER: Parameter object
interface CreateUserRequest {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
  };
  contact: {
    email: string;
    phoneNumber: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  credentials: {
    password: string;
  };
  preferences: {
    newsletter: boolean;
    termsAccepted: boolean;
  };
}

function createUser(request: CreateUserRequest): User {
  validateUserRequest(request);

  const user = new User({
    ...request.personalInfo,
    ...request.contact,
    address: new Address(request.address),
    passwordHash: hashPassword(request.credentials.password),
    preferences: request.preferences
  });

  return userRepository.save(user);
}
```

**Primitive Obsession:**
```typescript
// BEFORE: Primitive types everywhere
function calculateShipping(
  weight: number, // kg
  distance: number, // km
  serviceLevel: string // "standard" | "express" | "overnight"
): number {
  // Implementation with raw numbers and strings
}

// AFTER: Value objects
class Weight {
  constructor(private readonly kilograms: number) {
    if (kilograms < 0) {
      throw new Error('Weight cannot be negative');
    }
  }

  get kg(): number {
    return this.kilograms;
  }

  get pounds(): number {
    return this.kilograms * 2.20462;
  }

  add(other: Weight): Weight {
    return new Weight(this.kilograms + other.kg);
  }
}

class Distance {
  constructor(private readonly kilometers: number) {
    if (kilometers < 0) {
      throw new Error('Distance cannot be negative');
    }
  }

  get km(): number {
    return this.kilometers;
  }

  get miles(): number {
    return this.kilometers * 0.621371;
  }
}

enum ServiceLevel {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight'
}

class ShippingCalculator {
  calculateShipping(
    weight: Weight,
    distance: Distance,
    serviceLevel: ServiceLevel
  ): Money {
    const baseRate = this.getBaseRate(serviceLevel);
    const weightFactor = weight.kg * 0.5;
    const distanceFactor = distance.km * 0.1;

    const amount = baseRate + weightFactor + distanceFactor;

    return new Money(amount, Currency.USD);
  }

  private getBaseRate(serviceLevel: ServiceLevel): number {
    switch (serviceLevel) {
      case ServiceLevel.STANDARD:
        return 5.0;
      case ServiceLevel.EXPRESS:
        return 15.0;
      case ServiceLevel.OVERNIGHT:
        return 30.0;
    }
  }
}
```

#### Object-Orientation Abusers

**Switch Statements:**
```typescript
// BEFORE: Switch statement that changes frequently
function calculateEmployeePayment(employee: Employee): number {
  switch (employee.type) {
    case 'FULL_TIME':
      return employee.salary / 12;

    case 'PART_TIME':
      return employee.hourlyRate * employee.hoursWorked;

    case 'CONTRACT':
      return employee.contractRate;

    case 'INTERN':
      return employee.stipend;

    default:
      throw new Error('Unknown employee type');
  }
}

// AFTER: Polymorphism
abstract class Employee {
  abstract calculateMonthlyPayment(): Money;
}

class FullTimeEmployee extends Employee {
  constructor(private readonly annualSalary: Money) {
    super();
  }

  calculateMonthlyPayment(): Money {
    return this.annualSalary.divide(12);
  }
}

class PartTimeEmployee extends Employee {
  constructor(
    private readonly hourlyRate: Money,
    private readonly hoursWorked: number
  ) {
    super();
  }

  calculateMonthlyPayment(): Money {
    return this.hourlyRate.multiply(this.hoursWorked);
  }
}

class ContractEmployee extends Employee {
  constructor(private readonly monthlyRate: Money) {
    super();
  }

  calculateMonthlyPayment(): Money {
    return this.monthlyRate;
  }
}

class InternEmployee extends Employee {
  constructor(private readonly monthlyStipend: Money) {
    super();
  }

  calculateMonthlyPayment(): Money {
    return this.monthlyStipend;
  }
}

// Usage
const payment = employee.calculateMonthlyPayment();
```

**Temporary Field:**
```typescript
// BEFORE: Fields only used in certain circumstances
class Order {
  items: OrderItem[];
  customerId: string;

  // Only used during calculation
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;

  calculateTotal(): number {
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    this.taxAmount = this.subtotal * 0.08;
    this.shippingCost = this.calculateShipping();

    return this.subtotal + this.taxAmount + this.shippingCost;
  }
}

// AFTER: Separate calculation object
class OrderPricingCalculator {
  calculate(order: Order): OrderPricing {
    const subtotal = this.calculateSubtotal(order.items);
    const tax = this.calculateTax(subtotal);
    const shipping = this.calculateShipping(order);

    return new OrderPricing(subtotal, tax, shipping);
  }

  private calculateSubtotal(items: OrderItem[]): Money {
    return items.reduce(
      (sum, item) => sum.add(item.price.multiply(item.quantity)),
      Money.zero()
    );
  }

  private calculateTax(subtotal: Money): Money {
    return subtotal.multiply(0.08);
  }

  private calculateShipping(order: Order): Money {
    // Shipping calculation logic
    return new Money(10, Currency.USD);
  }
}

class OrderPricing {
  constructor(
    public readonly subtotal: Money,
    public readonly tax: Money,
    public readonly shipping: Money
  ) {}

  get total(): Money {
    return this.subtotal.add(this.tax).add(this.shipping);
  }
}

class Order {
  constructor(
    public readonly items: OrderItem[],
    public readonly customerId: string
  ) {}

  calculatePricing(): OrderPricing {
    const calculator = new OrderPricingCalculator();
    return calculator.calculate(this);
  }
}
```

#### Change Preventers

**Divergent Change:**
```typescript
// BEFORE: Class changes for multiple reasons
class User {
  // Database operations
  save() {
    // SQL queries
  }

  load(id: string) {
    // SQL queries
  }

  // Business logic
  upgradeToPermium() {
    // Business rules
  }

  // Notification
  sendWelcomeEmail() {
    // Email logic
  }

  // Validation
  validateEmail() {
    // Validation logic
  }
}

// Changes needed for:
// - Database schema changes
// - Business rule changes
// - Email template changes
// - Validation rule changes

// AFTER: Separated concerns (Single Responsibility)
class User {
  constructor(
    public readonly id: string,
    public email: string,
    public accountType: AccountType
  ) {}

  upgradeToPermium(): void {
    if (this.accountType === AccountType.PREMIUM) {
      throw new Error('Already premium');
    }
    this.accountType = AccountType.PREMIUM;
  }
}

class UserRepository {
  async save(user: User): Promise<void> {
    await db.users.upsert({
      id: user.id,
      email: user.email,
      accountType: user.accountType
    });
  }

  async findById(id: string): Promise<User | null> {
    const record = await db.users.findUnique({ where: { id } });

    if (!record) {
      return null;
    }

    return new User(record.id, record.email, record.accountType);
  }
}

class UserNotificationService {
  constructor(private emailService: EmailService) {}

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.emailService.send({
      to: user.email,
      template: 'welcome',
      data: { email: user.email }
    });
  }
}

class EmailValidator {
  validate(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

**Shotgun Surgery:**
```typescript
// BEFORE: Adding a new payment method requires changes in many places

// PaymentProcessor.ts
class PaymentProcessor {
  process(payment: Payment) {
    if (payment.type === 'CREDIT_CARD') {
      // ...
    } else if (payment.type === 'PAYPAL') {
      // ...
    } else if (payment.type === 'BANK_TRANSFER') {
      // ...
    }
    // Need to add new else-if for each payment method
  }
}

// PaymentValidator.ts
class PaymentValidator {
  validate(payment: Payment) {
    if (payment.type === 'CREDIT_CARD') {
      // ...
    } else if (payment.type === 'PAYPAL') {
      // ...
    } else if (payment.type === 'BANK_TRANSFER') {
      // ...
    }
    // Need to add new else-if
  }
}

// PaymentUI.tsx
function PaymentForm() {
  if (paymentType === 'CREDIT_CARD') {
    return <CreditCardForm />;
  } else if (paymentType === 'PAYPAL') {
    return <PayPalForm />;
  } else if (paymentType === 'BANK_TRANSFER') {
    return <BankTransferForm />;
  }
  // Need to add new else-if
}

// AFTER: Strategy pattern - one place to add new payment method

interface PaymentMethod {
  process(amount: Money): Promise<PaymentResult>;
  validate(): ValidationResult;
  renderForm(): React.ReactElement;
}

class CreditCardPayment implements PaymentMethod {
  constructor(private cardDetails: CreditCardDetails) {}

  async process(amount: Money): Promise<PaymentResult> {
    return await creditCardProcessor.charge(this.cardDetails, amount);
  }

  validate(): ValidationResult {
    return validateCreditCard(this.cardDetails);
  }

  renderForm(): React.ReactElement {
    return <CreditCardForm />;
  }
}

class PayPalPayment implements PaymentMethod {
  constructor(private paypalAccount: string) {}

  async process(amount: Money): Promise<PaymentResult> {
    return await paypalProcessor.charge(this.paypalAccount, amount);
  }

  validate(): ValidationResult {
    return validatePayPalAccount(this.paypalAccount);
  }

  renderForm(): React.ReactElement {
    return <PayPalForm />;
  }
}

// Register payment methods
class PaymentMethodRegistry {
  private methods = new Map<string, () => PaymentMethod>();

  register(type: string, factory: () => PaymentMethod): void {
    this.methods.set(type, factory);
  }

  create(type: string): PaymentMethod {
    const factory = this.methods.get(type);

    if (!factory) {
      throw new Error(`Unknown payment method: ${type}`);
    }

    return factory();
  }
}

// Usage - adding new payment method only requires:
// 1. Create new class implementing PaymentMethod
// 2. Register in registry

registry.register('CREDIT_CARD', () => new CreditCardPayment(details));
registry.register('PAYPAL', () => new PayPalPayment(account));
registry.register('BANK_TRANSFER', () => new BankTransferPayment(bankInfo));

// Adding new payment method: just create and register
registry.register('CRYPTO', () => new CryptoPayment(walletAddress));
```

#### Dispensables

**Duplicate Code:**
```typescript
// BEFORE: Duplication
function calculateFullTimeBonus(employee: FullTimeEmployee): number {
  const baseBonus = employee.salary * 0.1;
  const tenureBonus = employee.yearsOfService * 1000;
  const performanceBonus = employee.performanceRating * 5000;

  return baseBonus + tenureBonus + performanceBonus;
}

function calculatePartTimeBonus(employee: PartTimeEmployee): number {
  const baseBonus = employee.annualIncome * 0.1;
  const tenureBonus = employee.yearsOfService * 1000;
  const performanceBonus = employee.performanceRating * 5000;

  return baseBonus + tenureBonus + performanceBonus;
}

// AFTER: Extract common logic
function calculateBonus(
  baseAmount: number,
  yearsOfService: number,
  performanceRating: number
): number {
  const baseBonus = baseAmount * 0.1;
  const tenureBonus = yearsOfService * 1000;
  const performanceBonus = performanceRating * 5000;

  return baseBonus + tenureBonus + performanceBonus;
}

class FullTimeEmployee {
  calculateBonus(): number {
    return calculateBonus(
      this.salary,
      this.yearsOfService,
      this.performanceRating
    );
  }
}

class PartTimeEmployee {
  calculateBonus(): number {
    return calculateBonus(
      this.annualIncome,
      this.yearsOfService,
      this.performanceRating
    );
  }
}
```

**Dead Code:**
```typescript
// BEFORE: Unused code cluttering codebase
class OrderService {
  // Used
  createOrder(data: OrderData): Order {
    return this.orderRepo.create(data);
  }

  // DEAD - never called
  createLegacyOrder(data: any): any {
    // Old implementation
  }

  // DEAD - feature removed 6 months ago
  calculateLoyaltyPoints(order: Order): number {
    return order.total * 10;
  }

  // Used
  cancelOrder(orderId: string): void {
    this.orderRepo.delete(orderId);
  }

  // DEAD - replaced by cancelOrder
  deleteOrder(orderId: string): void {
    this.orderRepo.delete(orderId);
  }
}

// AFTER: Remove dead code
class OrderService {
  createOrder(data: OrderData): Order {
    return this.orderRepo.create(data);
  }

  cancelOrder(orderId: string): void {
    this.orderRepo.delete(orderId);
  }
}

// If needed later, it's in version control!
```

**Speculative Generality:**
```typescript
// BEFORE: Over-engineered for potential future needs
abstract class AbstractDataProcessor<T, R> {
  abstract preProcess(data: T): T;
  abstract process(data: T): R;
  abstract postProcess(result: R): R;
  abstract validate(data: T): boolean;
  abstract transform(result: R): R;

  execute(data: T): R {
    if (!this.validate(data)) {
      throw new Error('Invalid data');
    }

    const preprocessed = this.preProcess(data);
    const processed = this.process(preprocessed);
    const postProcessed = this.postProcess(processed);
    const transformed = this.transform(postProcessed);

    return transformed;
  }
}

// Only one implementation exists
class UserDataProcessor extends AbstractDataProcessor<UserData, User> {
  preProcess(data: UserData): UserData {
    return data; // Does nothing
  }

  process(data: UserData): User {
    return new User(data);
  }

  postProcess(result: User): User {
    return result; // Does nothing
  }

  validate(data: UserData): boolean {
    return !!data.email;
  }

  transform(result: User): User {
    return result; // Does nothing
  }
}

// AFTER: YAGNI (You Aren't Gonna Need It)
class UserService {
  createUser(data: UserData): User {
    if (!data.email) {
      throw new Error('Email is required');
    }

    return new User(data);
  }
}

// Add abstraction when second implementation is needed
```

#### Couplers

**Feature Envy:**
```typescript
// BEFORE: Method more interested in other class
class Invoice {
  customer: Customer;
  items: InvoiceItem[];

  calculateTotal(): number {
    let total = 0;

    for (const item of this.items) {
      // Feature envy - too interested in Item's internals
      total += item.product.price * item.quantity;

      if (item.product.category === 'ELECTRONIC') {
        total += item.product.price * item.quantity * 0.05; // tax
      }

      if (item.quantity > 10) {
        total -= item.product.price * item.quantity * 0.1; // bulk discount
      }
    }

    return total;
  }
}

// AFTER: Move behavior to where data is
class InvoiceItem {
  constructor(
    public readonly product: Product,
    public readonly quantity: number
  ) {}

  calculateSubtotal(): number {
    return this.product.price * this.quantity;
  }

  calculateTax(): number {
    if (this.product.category === 'ELECTRONIC') {
      return this.calculateSubtotal() * 0.05;
    }
    return 0;
  }

  calculateDiscount(): number {
    if (this.quantity > 10) {
      return this.calculateSubtotal() * 0.1;
    }
    return 0;
  }

  calculateTotal(): number {
    return this.calculateSubtotal()
      + this.calculateTax()
      - this.calculateDiscount();
  }
}

class Invoice {
  customer: Customer;
  items: InvoiceItem[];

  calculateTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.calculateTotal(),
      0
    );
  }
}
```

**Inappropriate Intimacy:**
```typescript
// BEFORE: Classes too intimate with each other's internals
class Order {
  items: OrderItem[];
  customerId: string;

  calculateTotal(): number {
    let total = 0;

    for (const item of this.items) {
      total += item.price * item.quantity;

      // Accessing Customer's internal calculation logic
      const customer = CustomerRepository.findById(this.customerId);
      if (customer.loyaltyPoints > 1000) {
        total *= 0.95; // 5% discount
      }

      if (customer.orders.length > 10) {
        total *= 0.98; // additional 2% discount
      }
    }

    return total;
  }
}

class Customer {
  id: string;
  loyaltyPoints: number;
  orders: Order[];

  // Order accessing this directly
  calculateDiscount(orderTotal: number): number {
    let discount = 0;

    if (this.loyaltyPoints > 1000) {
      discount += orderTotal * 0.05;
    }

    if (this.orders.length > 10) {
      discount += orderTotal * 0.02;
    }

    return discount;
  }
}

// AFTER: Proper encapsulation
class Customer {
  constructor(
    public readonly id: string,
    private loyaltyPoints: number,
    private orderCount: number
  ) {}

  getDiscountRate(): number {
    let rate = 0;

    if (this.loyaltyPoints > 1000) {
      rate += 0.05;
    }

    if (this.orderCount > 10) {
      rate += 0.02;
    }

    return rate;
  }
}

class Order {
  constructor(
    private items: OrderItem[],
    private customer: Customer
  ) {}

  private calculateSubtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discountRate = this.customer.getDiscountRate();
    const discount = subtotal * discountRate;

    return subtotal - discount;
  }
}
```

## Refactoring Catalog

### Extract Method

**When to use:** Long method or duplicated code

```typescript
// BEFORE
function printOwing(invoice: Invoice): void {
  printBanner();

  // Print details
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${invoice.amount}`);
}

// AFTER
function printOwing(invoice: Invoice): void {
  printBanner();
  printDetails(invoice);
}

function printDetails(invoice: Invoice): void {
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${invoice.amount}`);
}
```

### Inline Method

**When to use:** Method body is as clear as the name

```typescript
// BEFORE
function getRating(driver: Driver): number {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(driver: Driver): boolean {
  return driver.lateDeliveries > 5;
}

// AFTER
function getRating(driver: Driver): number {
  return driver.lateDeliveries > 5 ? 2 : 1;
}
```

### Extract Variable

**When to use:** Complex expression is hard to understand

```typescript
// BEFORE
function price(order: Order): number {
  return order.quantity * order.itemPrice -
    Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
    Math.min(order.quantity * order.itemPrice * 0.1, 100);
}

// AFTER
function price(order: Order): number {
  const basePrice = order.quantity * order.itemPrice;
  const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
  const shipping = Math.min(basePrice * 0.1, 100);

  return basePrice - quantityDiscount + shipping;
}
```

### Inline Variable

**When to use:** Variable name doesn't communicate more than expression

```typescript
// BEFORE
function hasDiscount(order: Order): boolean {
  const basePrice = order.basePrice;
  return basePrice > 1000;
}

// AFTER
function hasDiscount(order: Order): boolean {
  return order.basePrice > 1000;
}
```

### Change Function Declaration

**When to use:** Function name doesn't clearly express intent

```typescript
// BEFORE
function circum(radius: number): number {
  return 2 * Math.PI * radius;
}

// AFTER
function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}
```

### Encapsulate Variable

**When to use:** Data is widely accessed and modified

```typescript
// BEFORE
let defaultOwner = { firstName: 'John', lastName: 'Doe' };

// AFTER
let _defaultOwner = { firstName: 'John', lastName: 'Doe' };

export function getDefaultOwner(): Owner {
  return { ..._defaultOwner };
}

export function setDefaultOwner(owner: Owner): void {
  _defaultOwner = { ...owner };
}
```

### Rename Variable

**When to use:** Variable name doesn't clearly express purpose

```typescript
// BEFORE
function calculateTotal(o: Order): number {
  const tp = o.items.reduce((sum, item) => sum + item.price, 0);
  return tp * 1.08;
}

// AFTER
function calculateTotal(order: Order): number {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price,
    0
  );
  return subtotal * 1.08; // Including 8% tax
}
```

### Introduce Parameter Object

**When to use:** Functions have same group of parameters

```typescript
// BEFORE
function readingsOutsideRange(
  station: Station,
  min: number,
  max: number
): Reading[] {
  return station.readings.filter(
    r => r.temp < min || r.temp > max
  );
}

// AFTER
class NumberRange {
  constructor(
    public readonly min: number,
    public readonly max: number
  ) {}

  contains(value: number): boolean {
    return value >= this.min && value <= this.max;
  }
}

function readingsOutsideRange(
  station: Station,
  range: NumberRange
): Reading[] {
  return station.readings.filter(
    r => !range.contains(r.temp)
  );
}
```

### Combine Functions into Class

**When to use:** Group of functions operate on same data

```typescript
// BEFORE
function base(reading: Reading): number {
  return reading.customer === 'industrial'
    ? reading.quantity * 0.05
    : reading.quantity * 0.1;
}

function taxableCharge(reading: Reading): number {
  return Math.max(0, base(reading) - threshold(reading));
}

function threshold(reading: Reading): number {
  return reading.customer === 'industrial' ? 2 : 1;
}

// AFTER
class Reading {
  constructor(
    public readonly customer: string,
    public readonly quantity: number
  ) {}

  get base(): number {
    return this.customer === 'industrial'
      ? this.quantity * 0.05
      : this.quantity * 0.1;
  }

  get threshold(): number {
    return this.customer === 'industrial' ? 2 : 1;
  }

  get taxableCharge(): number {
    return Math.max(0, this.base - this.threshold);
  }
}
```

### Split Phase

**When to use:** Code doing two different things

```typescript
// BEFORE
function priceOrder(product: Product, quantity: number, shippingMethod: string): number {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;

  const shippingPerCase = (basePrice > shippingMethod.discountThreshold)
    ? shippingMethod.discountedFee
    : shippingMethod.feePerCase;

  const shippingCost = quantity * shippingPerCase;
  const price = basePrice - discount + shippingCost;

  return price;
}

// AFTER
interface PriceData {
  basePrice: number;
  quantity: number;
  discount: number;
}

function priceOrder(
  product: Product,
  quantity: number,
  shippingMethod: ShippingMethod
): number {
  const priceData = calculatePricingData(product, quantity);
  return applyShipping(priceData, shippingMethod);
}

function calculatePricingData(product: Product, quantity: number): PriceData {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - product.discountThreshold, 0)
    * product.basePrice * product.discountRate;

  return { basePrice, quantity, discount };
}

function applyShipping(
  priceData: PriceData,
  shippingMethod: ShippingMethod
): number {
  const shippingPerCase = (priceData.basePrice > shippingMethod.discountThreshold)
    ? shippingMethod.discountedFee
    : shippingMethod.feePerCase;

  const shippingCost = priceData.quantity * shippingPerCase;

  return priceData.basePrice - priceData.discount + shippingCost;
}
```

### Move Function

**When to use:** Function references elements in other context more than current

```typescript
// BEFORE
class Account {
  overdraftCharge: number;

  get bankCharge(): number {
    let result = 4.5;

    if (this.daysOverdrawn > 0) {
      result += this.overdraftCharge;
    }

    return result;
  }

  private get daysOverdrawn(): number {
    // calculation
    return 10;
  }
}

// AFTER
class AccountType {
  overdraftCharge(daysOverdrawn: number): number {
    if (daysOverdrawn <= 0) {
      return 0;
    }
    // AccountType knows how to calculate this
    return daysOverdrawn * 1.5;
  }
}

class Account {
  type: AccountType;

  get bankCharge(): number {
    let result = 4.5;
    result += this.type.overdraftCharge(this.daysOverdrawn);
    return result;
  }

  private get daysOverdrawn(): number {
    return 10;
  }
}
```

### Replace Conditional with Polymorphism

**When to use:** Conditional behavior varies by type

```typescript
// BEFORE
class Bird {
  constructor(public type: string) {}

  get speed(): number {
    switch (this.type) {
      case 'european':
        return 35;
      case 'african':
        return 40;
      case 'norwegian':
        return this.isNailed ? 0 : 10;
      default:
        return null;
    }
  }
}

// AFTER
abstract class Bird {
  abstract get speed(): number;
}

class EuropeanBird extends Bird {
  get speed(): number {
    return 35;
  }
}

class AfricanBird extends Bird {
  get speed(): number {
    return 40;
  }
}

class NorwegianBird extends Bird {
  constructor(private isNailed: boolean) {
    super();
  }

  get speed(): number {
    return this.isNailed ? 0 : 10;
  }
}
```

## Refactoring Strategies

### Preparatory Refactoring

```
Make the change easy, then make the easy change.

Example:
1. Identify where new feature will go
2. Refactor surrounding code to accommodate it
3. Add new feature (now easy to add)
4. Refactor again if needed
```

**Example:**
```typescript
// Want to add: Support for discount codes

// BEFORE: Hard to add discount codes
class Order {
  items: Item[];

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

// STEP 1: Preparatory refactoring - extract pricing
class OrderPricing {
  constructor(private items: Item[]) {}

  calculateSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  calculateTotal(): number {
    return this.calculateSubtotal();
  }
}

class Order {
  items: Item[];

  calculateTotal(): number {
    const pricing = new OrderPricing(this.items);
    return pricing.calculateTotal();
  }
}

// STEP 2: Now easy to add discount
class OrderPricing {
  constructor(
    private items: Item[],
    private discountCode?: DiscountCode
  ) {}

  calculateSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  calculateDiscount(): number {
    if (!this.discountCode) {
      return 0;
    }

    const subtotal = this.calculateSubtotal();
    return this.discountCode.apply(subtotal);
  }

  calculateTotal(): number {
    return this.calculateSubtotal() - this.calculateDiscount();
  }
}
```

### Comprehension Refactoring

```
Refactor to understand code better.

When reading unfamiliar code:
1. Rename variables to understand their purpose
2. Extract methods to clarify logic
3. Add comments (then refactor to make them unnecessary)
4. Simplify conditionals
```

### Litter-Pickup Refactoring

```
Leave the code better than you found it.

During any code work:
- Fix obvious issues
- Improve naming
- Remove dead code
- Simplify expressions
- Small, safe refactorings
```

### Planned Refactoring

```
Dedicated refactoring time.

When:
- Technical debt is high
- Architecture needs improvement
- Major changes coming

How:
- Allocate dedicated time
- Document goals
- Track progress
- Communicate with stakeholders
```

### Long-Term Refactoring

```
Gradual improvement over time.

For large-scale changes:
- Define end goal
- Create incremental plan
- Use Branch by Abstraction
- Monitor progress
- Adjust as needed
```

**Branch by Abstraction Example:**
```typescript
// Goal: Replace old Payment API with new one

// STEP 1: Create abstraction
interface PaymentGateway {
  processPayment(amount: Money): Promise<PaymentResult>;
}

// STEP 2: Adapt old system
class OldPaymentGateway implements PaymentGateway {
  constructor(private oldApi: OldPaymentAPI) {}

  async processPayment(amount: Money): Promise<PaymentResult> {
    const result = await this.oldApi.charge(amount.value);
    return this.convertResult(result);
  }

  private convertResult(oldResult: any): PaymentResult {
    // Adapt old format to new
    return {
      success: oldResult.status === 'success',
      transactionId: oldResult.id
    };
  }
}

// STEP 3: Use abstraction everywhere
class CheckoutService {
  constructor(private paymentGateway: PaymentGateway) {}

  async checkout(cart: Cart): Promise<Order> {
    const total = cart.calculateTotal();
    const payment = await this.paymentGateway.processPayment(total);
    // ...
  }
}

// STEP 4: Implement new system
class NewPaymentGateway implements PaymentGateway {
  constructor(private newApi: NewPaymentAPI) {}

  async processPayment(amount: Money): Promise<PaymentResult> {
    return await this.newApi.charge(amount);
  }
}

// STEP 5: Switch implementations (single line change!)
const paymentGateway = new NewPaymentGateway(newApi);
// const paymentGateway = new OldPaymentGateway(oldApi);

// STEP 6: Remove old implementation
// Delete OldPaymentGateway class
```

## Refactoring and Tests

### The Safety Net

```
Tests enable refactoring.
Refactoring enables clean code.
Clean code enables better tests.

Cycle of improvement:
1. Comprehensive test coverage
2. Refactor with confidence
3. Cleaner, more testable code
4. Better tests
5. Repeat
```

### Test-Driven Refactoring

```
Red-Green-Refactor:

RED
├── Write failing test
└── Clarifies what code should do

GREEN
├── Make test pass quickly
└── May have duplication or poor design

REFACTOR
├── Improve code structure
├── Remove duplication
├── Clarify intent
└── Tests verify behavior preserved
```

### Refactoring Without Tests

**Risky but sometimes necessary:**

```
When you don't have tests:

1. Add characterization tests first
   └── Document current behavior (even if buggy)

2. Refactor cautiously
   └── Small, safe changes
   └── Verify manually after each change

3. Add proper tests
   └── Now that code is more testable

4. Continue refactoring
   └── With safety net in place
```

**Characterization Test Example:**
```typescript
// Legacy code without tests
class OrderProcessor {
  processOrder(order: any): any {
    // Complex, poorly understood legacy code
    // 200 lines of spaghetti code
  }
}

// STEP 1: Characterization tests
describe('OrderProcessor - Current Behavior', () => {
  it('processes order as it currently does', () => {
    const processor = new OrderProcessor();
    const order = {
      items: [{ id: 1, price: 10, qty: 2 }],
      customerId: 123
    };

    const result = processor.processOrder(order);

    // Document actual behavior (not ideal behavior)
    expect(result).toEqual({
      total: 20,
      tax: 1.6,
      // ... exact current output
    });
  });

  // More tests covering various inputs
});

// STEP 2: Now can refactor safely
// Tests will catch if behavior changes
```

## Refactoring in Practice

### IDE Support

**Automated Refactorings:**
- Rename
- Extract Method/Function
- Extract Variable
- Inline Variable
- Move to Different File
- Change Signature
- Extract Interface
- Pull Up/Push Down

**VS Code Extensions:**
- JavaScript/TypeScript Refactoring
- Abracadabra (VS Code Refactoring Tool)
- C# Refactoring Tools
- Python Refactoring

### Code Review and Refactoring

```
During Code Review:

Small Refactorings
├── Do immediately
├── Part of feature PR
└── Improves readability

Medium Refactorings
├── Note in comments
├── Create follow-up ticket
└── Don't block PR

Large Refactorings
├── Separate planning session
├── Dedicated time
└── Own initiative
```

### Continuous Refactoring

```
Make refactoring a habit:

Daily
├── Fix code smells you encounter
├── Rename unclear variables
└── Extract long methods

Weekly
├── Review code quality metrics
├── Address high-complexity areas
└── Update dependencies

Monthly
├── Review architecture
├── Plan larger refactorings
└── Technical debt review
```

### Refactoring and Performance

```
First make it work,
Then make it right,
Then make it fast.

Rules:
1. Don't optimize prematurely
2. Refactor first (clean code)
3. Profile to find bottlenecks
4. Optimize hot paths only
5. Measure improvements
```

## Metrics and Measurement

### Code Quality Metrics

```
Cyclomatic Complexity
= Number of linearly independent paths
Goal: < 10 per method

Lines of Code per Method
Goal: < 20 lines

Class Size
Goal: < 200 lines

Depth of Inheritance
Goal: < 5 levels

Coupling
Goal: Minimize dependencies

Cohesion
Goal: Maximize relatedness
```

### Refactoring Impact

**Before/After Metrics:**
```
Track improvements:
- Complexity reduction
- Test coverage increase
- Defect rate decrease
- Development velocity increase
- Code review time decrease
```

### Technical Debt

```
Technical Debt Ratio
= (Remediation Cost / Development Cost) × 100%

Goal: < 5%

Debt Trend
= Current Debt - Previous Debt

Goal: Decreasing

Refactoring Rate
= Lines refactored / Lines changed

Goal: > 20%
```

## Common Pitfalls

### Anti-Patterns

**Over-Refactoring:**
```
✗ Premature abstraction
✗ Over-engineering
✗ Too many layers
✗ Refactoring for refactoring's sake

✓ Refactor when needed
✓ YAGNI principle
✓ Simplest solution
✓ Driven by real requirements
```

**Refactoring Without Tests:**
```
✗ No safety net
✗ High risk of breaking behavior
✗ Can't verify correctness

✓ Add tests first
✓ Refactor with confidence
✓ Continuous verification
```

**Big Bang Refactoring:**
```
✗ Refactor everything at once
✗ Long-lived branch
✗ Merge conflicts
✗ High risk

✓ Incremental changes
✓ Frequent integration
✓ Small, safe steps
```

**Refactoring During Crunch Time:**
```
✗ Rushed refactoring
✗ Insufficient testing
✗ Increased risk

✓ Schedule dedicated time
✓ Proper planning
✓ Adequate testing
```

## Tools and Resources

### Static Analysis Tools

**JavaScript/TypeScript:**
- ESLint
- TSLint
- SonarQube
- Code Climate

**Java:**
- PMD
- CheckStyle
- SpotBugs
- SonarQube

**C#:**
- ReSharper
- NDepend
- SonarQube
- FxCop

**Python:**
- Pylint
- Flake8
- Radon
- SonarQube

### Refactoring Tools

**IDEs:**
- IntelliJ IDEA (excellent refactoring support)
- Visual Studio
- VS Code with extensions
- Eclipse

**Language-Specific:**
- Rope (Python)
- RuboCop (Ruby)
- php-cs-fixer (PHP)

### Learning Resources

**Books:**
- "Refactoring" by Martin Fowler (2nd Edition)
- "Working Effectively with Legacy Code" by Michael Feathers
- "Clean Code" by Robert C. Martin
- "Refactoring to Patterns" by Joshua Kerievsky

**Online:**
- Refactoring.Guru
- SourceMaking.com
- Martin Fowler's Blog
- Refactoring.com

## Related Resources

- [Test-Driven Development](../04-testing-strategy/tdd.md)
- [Code Review](code-review.md)
- [Design Patterns](design-patterns.md)
- [Code Quality Metrics](../09-metrics-monitoring/quality-metrics.md)
- [Technical Debt Management](../10-deployment/technical-debt.md)

## References

- **Martin Fowler**: "Refactoring: Improving the Design of Existing Code" (2nd Edition)
- **Michael Feathers**: "Working Effectively with Legacy Code"
- **Robert C. Martin**: "Clean Code: A Handbook of Agile Software Craftsmanship"
- **Joshua Kerievsky**: "Refactoring to Patterns"
- **Kent Beck**: "Extreme Programming Explained"
- **ISO 25010**: Software Quality Model
- **SOLID Principles**: Object-Oriented Design

---

**Part of**: [Development Practices](README.md)
