# Design Patterns

## Purpose
Comprehensive guide to software design patterns—reusable solutions to commonly occurring problems in software design, providing proven approaches to create maintainable, flexible, and scalable code.

## Overview
Design patterns are:
- Proven solutions to recurring problems
- Language-independent concepts
- Best practices from experienced developers
- Communication tools for teams
- Foundation for clean architecture
- Not finished code, but templates

## What are Design Patterns?

### Definition
A design pattern is a general, reusable solution to a commonly occurring problem within a given context in software design. It is a description or template for how to solve a problem that can be used in many different situations.

### History
- **1977**: Christopher Alexander introduces patterns in architecture
- **1987**: Ward Cunningham and Kent Beck adapt patterns to programming
- **1994**: Gang of Four publish "Design Patterns: Elements of Reusable Object-Oriented Software"
- **Today**: Patterns are fundamental to software engineering

### Pattern Elements

```
Pattern Structure:

Name
├── Unique identifier
└── Vocabulary for communication

Intent
├── What problem does it solve?
└── Rationale and intent

Motivation
├── Scenario demonstrating problem
└── How pattern solves it

Applicability
├── When to use the pattern
└── Context and situations

Structure
├── UML diagram
├── Classes and objects
└── Relationships

Participants
├── Classes/objects involved
└── Responsibilities

Collaborations
├── How participants work together
└── Sequence of interactions

Consequences
├── Trade-offs
├── Benefits
└── Limitations

Implementation
├── Techniques and pitfalls
├── Language-specific considerations
└── Code examples

Known Uses
├── Real-world applications
└── Success stories

Related Patterns
├── Similar patterns
├── Differences
└── Combinations
```

## Pattern Categories

### Creational Patterns
Focus on object creation mechanisms

```
┌─────────────────────────────────────────┐
│       Creational Patterns               │
├─────────────────────────────────────────┤
│ Singleton      │ One instance only      │
│ Factory Method │ Create through method  │
│ Abstract Factory│ Families of objects   │
│ Builder        │ Complex construction   │
│ Prototype      │ Clone from prototype   │
└─────────────────────────────────────────┘
```

### Structural Patterns
Focus on composition of classes/objects

```
┌─────────────────────────────────────────┐
│       Structural Patterns               │
├─────────────────────────────────────────┤
│ Adapter        │ Interface compatibility│
│ Bridge         │ Separate abstraction   │
│ Composite      │ Tree structures        │
│ Decorator      │ Add responsibilities   │
│ Facade         │ Simplified interface   │
│ Flyweight      │ Share common state     │
│ Proxy          │ Placeholder/surrogate  │
└─────────────────────────────────────────┘
```

### Behavioral Patterns
Focus on communication between objects

```
┌─────────────────────────────────────────┐
│       Behavioral Patterns               │
├─────────────────────────────────────────┤
│ Chain of Resp. │ Pass request along     │
│ Command        │ Encapsulate request    │
│ Iterator       │ Sequential access      │
│ Mediator       │ Reduce coupling        │
│ Memento        │ Capture state          │
│ Observer       │ Notification system    │
│ State          │ Behavior by state      │
│ Strategy       │ Interchangeable algos  │
│ Template Method│ Algorithm skeleton     │
│ Visitor        │ Operations on elements │
└─────────────────────────────────────────┘
```

## Creational Patterns

### Singleton Pattern

**Intent:** Ensure a class has only one instance and provide global access to it.

**Use When:**
- Exactly one instance needed
- Global access required
- Lazy initialization desired

**Implementation:**
```typescript
// Traditional Singleton
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: any;

  private constructor() {
    // Private constructor prevents instantiation
    this.connection = this.createConnection();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private createConnection(): any {
    // Create database connection
    return { /* connection object */ };
  }

  public query(sql: string): any {
    return this.connection.execute(sql);
  }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true

// Modern approach: Module pattern (ES6)
class Database {
  private connection: any;

  constructor() {
    this.connection = this.createConnection();
  }

  private createConnection(): any {
    return { /* connection */ };
  }

  public query(sql: string): any {
    return this.connection.execute(sql);
  }
}

// Export single instance
export const database = new Database();

// Usage in other files
import { database } from './database';
database.query('SELECT * FROM users');
```

**Thread-Safe Singleton:**
```typescript
class Logger {
  private static instance: Logger;
  private static lock = new Object();
  private logs: string[] = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      // Double-checked locking
      synchronized(Logger.lock, () => {
        if (!Logger.instance) {
          Logger.instance = new Logger();
        }
      });
    }
    return Logger.instance;
  }

  public log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
  }

  public getLogs(): string[] {
    return [...this.logs];
  }
}
```

**Caution:**
- Can make testing difficult (global state)
- May violate Single Responsibility Principle
- Consider dependency injection instead

### Factory Method Pattern

**Intent:** Define an interface for creating objects, but let subclasses decide which class to instantiate.

**Use When:**
- Class can't anticipate type of objects to create
- Class wants subclasses to specify objects created
- Classes delegate responsibility to helper subclasses

**Implementation:**
```typescript
// Product interface
interface PaymentProcessor {
  processPayment(amount: number): Promise<PaymentResult>;
  refund(transactionId: string): Promise<void>;
}

// Concrete products
class CreditCardProcessor implements PaymentProcessor {
  async processPayment(amount: number): Promise<PaymentResult> {
    console.log(`Processing credit card payment: $${amount}`);
    // Credit card specific logic
    return {
      success: true,
      transactionId: `CC-${Date.now()}`,
      amount
    };
  }

  async refund(transactionId: string): Promise<void> {
    console.log(`Refunding credit card transaction: ${transactionId}`);
  }
}

class PayPalProcessor implements PaymentProcessor {
  async processPayment(amount: number): Promise<PaymentResult> {
    console.log(`Processing PayPal payment: $${amount}`);
    // PayPal specific logic
    return {
      success: true,
      transactionId: `PP-${Date.now()}`,
      amount
    };
  }

  async refund(transactionId: string): Promise<void> {
    console.log(`Refunding PayPal transaction: ${transactionId}`);
  }
}

class CryptoProcessor implements PaymentProcessor {
  async processPayment(amount: number): Promise<PaymentResult> {
    console.log(`Processing crypto payment: $${amount}`);
    // Cryptocurrency specific logic
    return {
      success: true,
      transactionId: `BTC-${Date.now()}`,
      amount
    };
  }

  async refund(transactionId: string): Promise<void> {
    console.log(`Refunding crypto transaction: ${transactionId}`);
  }
}

// Creator abstract class
abstract class PaymentProcessorFactory {
  // Factory method
  abstract createProcessor(): PaymentProcessor;

  // Template method using factory method
  async processOrder(order: Order): Promise<PaymentResult> {
    const processor = this.createProcessor();
    const result = await processor.processPayment(order.total);

    if (result.success) {
      await this.saveTransaction(order.id, result);
    }

    return result;
  }

  private async saveTransaction(
    orderId: string,
    result: PaymentResult
  ): Promise<void> {
    // Save to database
  }
}

// Concrete creators
class CreditCardProcessorFactory extends PaymentProcessorFactory {
  createProcessor(): PaymentProcessor {
    return new CreditCardProcessor();
  }
}

class PayPalProcessorFactory extends PaymentProcessorFactory {
  createProcessor(): PaymentProcessor {
    return new PayPalProcessor();
  }
}

class CryptoProcessorFactory extends PaymentProcessorFactory {
  createProcessor(): PaymentProcessor {
    return new CryptoProcessor();
  }
}

// Usage
async function checkout(order: Order, paymentMethod: string) {
  let factory: PaymentProcessorFactory;

  switch (paymentMethod) {
    case 'credit_card':
      factory = new CreditCardProcessorFactory();
      break;
    case 'paypal':
      factory = new PayPalProcessorFactory();
      break;
    case 'crypto':
      factory = new CryptoProcessorFactory();
      break;
    default:
      throw new Error('Invalid payment method');
  }

  const result = await factory.processOrder(order);
  return result;
}

// Simple Factory (alternative)
class PaymentProcessorSimpleFactory {
  static create(type: string): PaymentProcessor {
    switch (type) {
      case 'credit_card':
        return new CreditCardProcessor();
      case 'paypal':
        return new PayPalProcessor();
      case 'crypto':
        return new CryptoProcessor();
      default:
        throw new Error('Invalid payment type');
    }
  }
}

// Usage of simple factory
const processor = PaymentProcessorSimpleFactory.create('paypal');
await processor.processPayment(100);
```

### Abstract Factory Pattern

**Intent:** Provide an interface for creating families of related objects without specifying concrete classes.

**Use When:**
- System should be independent of how products are created
- System should be configured with multiple families of products
- Family of related products designed to be used together
- You want to provide class library revealing interfaces, not implementations

**Implementation:**
```typescript
// Abstract products
interface Button {
  render(): void;
  onClick(handler: () => void): void;
}

interface Input {
  render(): void;
  getValue(): string;
  setValue(value: string): void;
}

interface Dialog {
  render(): void;
  show(): void;
  hide(): void;
}

// Concrete products - Windows family
class WindowsButton implements Button {
  render(): void {
    console.log('Rendering Windows style button');
  }

  onClick(handler: () => void): void {
    // Windows specific event handling
    console.log('Windows button clicked');
    handler();
  }
}

class WindowsInput implements Input {
  private value: string = '';

  render(): void {
    console.log('Rendering Windows style input');
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }
}

class WindowsDialog implements Dialog {
  render(): void {
    console.log('Rendering Windows style dialog');
  }

  show(): void {
    console.log('Showing Windows dialog');
  }

  hide(): void {
    console.log('Hiding Windows dialog');
  }
}

// Concrete products - macOS family
class MacButton implements Button {
  render(): void {
    console.log('Rendering macOS style button');
  }

  onClick(handler: () => void): void {
    console.log('macOS button clicked');
    handler();
  }
}

class MacInput implements Input {
  private value: string = '';

  render(): void {
    console.log('Rendering macOS style input');
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }
}

class MacDialog implements Dialog {
  render(): void {
    console.log('Rendering macOS style dialog');
  }

  show(): void {
    console.log('Showing macOS dialog');
  }

  hide(): void {
    console.log('Hiding macOS dialog');
  }
}

// Concrete products - Web family
class WebButton implements Button {
  render(): void {
    console.log('Rendering web button');
  }

  onClick(handler: () => void): void {
    console.log('Web button clicked');
    handler();
  }
}

class WebInput implements Input {
  private value: string = '';

  render(): void {
    console.log('Rendering web input');
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }
}

class WebDialog implements Dialog {
  render(): void {
    console.log('Rendering web dialog');
  }

  show(): void {
    console.log('Showing web dialog');
  }

  hide(): void {
    console.log('Hiding web dialog');
  }
}

// Abstract factory
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
  createDialog(): Dialog;
}

// Concrete factories
class WindowsUIFactory implements UIFactory {
  createButton(): Button {
    return new WindowsButton();
  }

  createInput(): Input {
    return new WindowsInput();
  }

  createDialog(): Dialog {
    return new WindowsDialog();
  }
}

class MacUIFactory implements UIFactory {
  createButton(): Button {
    return new MacButton();
  }

  createInput(): Input {
    return new MacInput();
  }

  createDialog(): Dialog {
    return new MacDialog();
  }
}

class WebUIFactory implements UIFactory {
  createButton(): Button {
    return new WebButton();
  }

  createInput(): Input {
    return new WebInput();
  }

  createDialog(): Dialog {
    return new WebDialog();
  }
}

// Client code
class Application {
  private button: Button;
  private input: Input;
  private dialog: Dialog;

  constructor(factory: UIFactory) {
    this.button = factory.createButton();
    this.input = factory.createInput();
    this.dialog = factory.createDialog();
  }

  render(): void {
    this.button.render();
    this.input.render();
    this.dialog.render();
  }

  setupEventHandlers(): void {
    this.button.onClick(() => {
      const value = this.input.getValue();
      console.log(`Input value: ${value}`);
      this.dialog.show();
    });
  }
}

// Usage
function createApplication(platform: string): Application {
  let factory: UIFactory;

  switch (platform) {
    case 'windows':
      factory = new WindowsUIFactory();
      break;
    case 'mac':
      factory = new MacUIFactory();
      break;
    case 'web':
      factory = new WebUIFactory();
      break;
    default:
      throw new Error('Unknown platform');
  }

  return new Application(factory);
}

const app = createApplication('mac');
app.render();
app.setupEventHandlers();
```

### Builder Pattern

**Intent:** Separate construction of complex object from its representation, allowing same construction process to create different representations.

**Use When:**
- Algorithm for creating complex object should be independent of parts
- Construction process must allow different representations
- Object has many optional parameters
- Want to avoid telescoping constructors

**Implementation:**
```typescript
// Product
class Computer {
  constructor(
    public cpu: string,
    public ram: string,
    public storage: string,
    public gpu?: string,
    public cooling?: string,
    public powerSupply?: string,
    public caseType?: string,
    public motherboard?: string,
    public wifi?: boolean,
    public bluetooth?: boolean
  ) {}

  display(): void {
    console.log(`Computer Specs:
      CPU: ${this.cpu}
      RAM: ${this.ram}
      Storage: ${this.storage}
      GPU: ${this.gpu || 'Integrated'}
      Cooling: ${this.cooling || 'Stock'}
      PSU: ${this.powerSupply || 'Standard'}
      Case: ${this.caseType || 'Standard'}
      Motherboard: ${this.motherboard || 'Standard'}
      WiFi: ${this.wifi ? 'Yes' : 'No'}
      Bluetooth: ${this.bluetooth ? 'Yes' : 'No'}
    `);
  }
}

// Builder interface
interface ComputerBuilder {
  setCPU(cpu: string): this;
  setRAM(ram: string): this;
  setStorage(storage: string): this;
  setGPU(gpu: string): this;
  setCooling(cooling: string): this;
  setPowerSupply(psu: string): this;
  setCase(caseType: string): this;
  setMotherboard(motherboard: string): this;
  setWiFi(enabled: boolean): this;
  setBluetooth(enabled: boolean): this;
  build(): Computer;
}

// Concrete builder
class GamingComputerBuilder implements ComputerBuilder {
  private cpu: string = '';
  private ram: string = '';
  private storage: string = '';
  private gpu?: string;
  private cooling?: string;
  private powerSupply?: string;
  private caseType?: string;
  private motherboard?: string;
  private wifi?: boolean;
  private bluetooth?: boolean;

  setCPU(cpu: string): this {
    this.cpu = cpu;
    return this;
  }

  setRAM(ram: string): this {
    this.ram = ram;
    return this;
  }

  setStorage(storage: string): this {
    this.storage = storage;
    return this;
  }

  setGPU(gpu: string): this {
    this.gpu = gpu;
    return this;
  }

  setCooling(cooling: string): this {
    this.cooling = cooling;
    return this;
  }

  setPowerSupply(psu: string): this {
    this.powerSupply = psu;
    return this;
  }

  setCase(caseType: string): this {
    this.caseType = caseType;
    return this;
  }

  setMotherboard(motherboard: string): this {
    this.motherboard = motherboard;
    return this;
  }

  setWiFi(enabled: boolean): this {
    this.wifi = enabled;
    return this;
  }

  setBluetooth(enabled: boolean): this {
    this.bluetooth = enabled;
    return this;
  }

  build(): Computer {
    if (!this.cpu || !this.ram || !this.storage) {
      throw new Error('CPU, RAM, and Storage are required');
    }

    return new Computer(
      this.cpu,
      this.ram,
      this.storage,
      this.gpu,
      this.cooling,
      this.powerSupply,
      this.caseType,
      this.motherboard,
      this.wifi,
      this.bluetooth
    );
  }
}

// Director (optional)
class ComputerDirector {
  buildGamingPC(builder: ComputerBuilder): Computer {
    return builder
      .setCPU('Intel i9-13900K')
      .setRAM('64GB DDR5')
      .setStorage('2TB NVMe SSD')
      .setGPU('NVIDIA RTX 4090')
      .setCooling('Liquid Cooling')
      .setPowerSupply('1000W 80+ Gold')
      .setCase('Full Tower RGB')
      .setMotherboard('Z790 Chipset')
      .setWiFi(true)
      .setBluetooth(true)
      .build();
  }

  buildOfficePC(builder: ComputerBuilder): Computer {
    return builder
      .setCPU('Intel i5-13400')
      .setRAM('16GB DDR4')
      .setStorage('512GB SSD')
      .setCase('Mini Tower')
      .setWiFi(true)
      .build();
  }

  buildServerPC(builder: ComputerBuilder): Computer {
    return builder
      .setCPU('AMD EPYC 7763')
      .setRAM('256GB ECC DDR4')
      .setStorage('8TB NVMe RAID')
      .setPowerSupply('2000W Redundant')
      .setCase('Rackmount 4U')
      .build();
  }
}

// Usage
const builder = new GamingComputerBuilder();
const director = new ComputerDirector();

// Using director
const gamingPC = director.buildGamingPC(builder);
gamingPC.display();

// Building manually
const customPC = new GamingComputerBuilder()
  .setCPU('AMD Ryzen 9 7950X')
  .setRAM('32GB DDR5')
  .setStorage('1TB NVMe SSD')
  .setGPU('AMD RX 7900 XTX')
  .setWiFi(true)
  .build();

customPC.display();

// Real-world example: HTTP Request Builder
class HttpRequest {
  constructor(
    public url: string,
    public method: string,
    public headers: Record<string, string>,
    public body?: any,
    public timeout?: number,
    public retries?: number
  ) {}
}

class HttpRequestBuilder {
  private url: string = '';
  private method: string = 'GET';
  private headers: Record<string, string> = {};
  private body?: any;
  private timeout: number = 30000;
  private retries: number = 0;

  setUrl(url: string): this {
    this.url = url;
    return this;
  }

  setMethod(method: string): this {
    this.method = method;
    return this;
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  setBody(body: any): this {
    this.body = body;
    return this;
  }

  setTimeout(timeout: number): this {
    this.timeout = timeout;
    return this;
  }

  setRetries(retries: number): this {
    this.retries = retries;
    return this;
  }

  build(): HttpRequest {
    if (!this.url) {
      throw new Error('URL is required');
    }

    return new HttpRequest(
      this.url,
      this.method,
      this.headers,
      this.body,
      this.timeout,
      this.retries
    );
  }
}

// Usage
const request = new HttpRequestBuilder()
  .setUrl('https://api.example.com/users')
  .setMethod('POST')
  .setHeader('Content-Type', 'application/json')
  .setHeader('Authorization', 'Bearer token123')
  .setBody({ name: 'John Doe', email: 'john@example.com' })
  .setTimeout(5000)
  .setRetries(3)
  .build();
```

### Prototype Pattern

**Intent:** Specify kinds of objects to create using prototypical instance, and create new objects by copying this prototype.

**Use When:**
- System should be independent of how products created
- Classes to instantiate specified at runtime
- Avoid building class hierarchies of factories
- Instances of class have few state combinations

**Implementation:**
```typescript
// Prototype interface
interface Prototype {
  clone(): Prototype;
}

// Concrete prototypes
class Monster implements Prototype {
  constructor(
    public name: string,
    public health: number,
    public attack: number,
    public defense: number,
    public abilities: string[],
    public position: { x: number; y: number }
  ) {}

  clone(): Monster {
    // Deep clone
    return new Monster(
      this.name,
      this.health,
      this.attack,
      this.defense,
      [...this.abilities],
      { ...this.position }
    );
  }

  display(): void {
    console.log(`${this.name} - HP: ${this.health}, ATK: ${this.attack}, DEF: ${this.defense}`);
    console.log(`Abilities: ${this.abilities.join(', ')}`);
    console.log(`Position: (${this.position.x}, ${this.position.y})`);
  }
}

// Prototype registry
class MonsterRegistry {
  private prototypes: Map<string, Monster> = new Map();

  register(key: string, prototype: Monster): void {
    this.prototypes.set(key, prototype);
  }

  create(key: string): Monster {
    const prototype = this.prototypes.get(key);

    if (!prototype) {
      throw new Error(`Prototype ${key} not found`);
    }

    return prototype.clone();
  }
}

// Usage
const registry = new MonsterRegistry();

// Register prototypes
const goblin = new Monster(
  'Goblin',
  50,
  10,
  5,
  ['Quick Strike', 'Dodge'],
  { x: 0, y: 0 }
);

const dragon = new Monster(
  'Dragon',
  500,
  100,
  50,
  ['Fire Breath', 'Fly', 'Tail Swipe'],
  { x: 0, y: 0 }
);

registry.register('goblin', goblin);
registry.register('dragon', dragon);

// Create monsters from prototypes
const goblin1 = registry.create('goblin');
goblin1.position = { x: 10, y: 20 };
goblin1.display();

const goblin2 = registry.create('goblin');
goblin2.position = { x: 30, y: 40 };
goblin2.display();

const dragon1 = registry.create('dragon');
dragon1.position = { x: 100, y: 200 };
dragon1.display();

// Modern JavaScript approach
const documentPrototype = {
  title: '',
  content: '',
  author: '',
  createdAt: new Date(),

  clone() {
    return Object.create(
      Object.getPrototypeOf(this),
      Object.getOwnPropertyDescriptors(this)
    );
  }
};

const doc1 = Object.create(documentPrototype);
doc1.title = 'Document 1';
doc1.content = 'Content here';

const doc2 = doc1.clone();
doc2.title = 'Document 2';
```

## Structural Patterns

### Adapter Pattern

**Intent:** Convert interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.

**Use When:**
- Want to use existing class with incompatible interface
- Create reusable class cooperating with unrelated classes
- Need to use several existing subclasses but impractical to adapt by subclassing

**Implementation:**
```typescript
// Target interface (what client expects)
interface MediaPlayer {
  play(filename: string): void;
}

// Adaptee (existing incompatible interface)
class VLCPlayer {
  playVLC(filename: string): void {
    console.log(`Playing VLC file: ${filename}`);
  }
}

class MP4Player {
  playMP4(filename: string): void {
    console.log(`Playing MP4 file: ${filename}`);
  }
}

// Adapter
class VLCAdapter implements MediaPlayer {
  private vlcPlayer: VLCPlayer;

  constructor() {
    this.vlcPlayer = new VLCPlayer();
  }

  play(filename: string): void {
    this.vlcPlayer.playVLC(filename);
  }
}

class MP4Adapter implements MediaPlayer {
  private mp4Player: MP4Player;

  constructor() {
    this.mp4Player = new MP4Player();
  }

  play(filename: string): void {
    this.mp4Player.playMP4(filename);
  }
}

// Client
class AudioPlayer implements MediaPlayer {
  play(filename: string): void {
    const extension = filename.split('.').pop()?.toLowerCase();

    let player: MediaPlayer;

    switch (extension) {
      case 'vlc':
        player = new VLCAdapter();
        break;
      case 'mp4':
        player = new MP4Adapter();
        break;
      case 'mp3':
        console.log(`Playing MP3 file: ${filename}`);
        return;
      default:
        console.log(`Unsupported format: ${extension}`);
        return;
    }

    player.play(filename);
  }
}

// Usage
const player = new AudioPlayer();
player.play('song.mp3');
player.play('video.mp4');
player.play('movie.vlc');

// Real-world example: Third-party API adapter
interface PaymentGateway {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
  refund(transactionId: string): Promise<void>;
}

// Third-party payment service (incompatible interface)
class StripeAPI {
  async charge(amountInCents: number, currency: string): Promise<any> {
    // Stripe-specific implementation
    return {
      id: `stripe_${Date.now()}`,
      status: 'succeeded',
      amount: amountInCents
    };
  }

  async createRefund(chargeId: string): Promise<void> {
    // Stripe-specific refund
  }
}

// Adapter for Stripe
class StripeAdapter implements PaymentGateway {
  private stripe: StripeAPI;

  constructor() {
    this.stripe = new StripeAPI();
  }

  async processPayment(
    amount: number,
    currency: string
  ): Promise<PaymentResult> {
    // Convert dollars to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    const result = await this.stripe.charge(amountInCents, currency);

    // Convert Stripe response to standard format
    return {
      success: result.status === 'succeeded',
      transactionId: result.id,
      amount: result.amount / 100
    };
  }

  async refund(transactionId: string): Promise<void> {
    await this.stripe.createRefund(transactionId);
  }
}

// Another third-party service
class PayPalAPI {
  async makePayment(data: any): Promise<any> {
    return {
      transaction_id: `paypal_${Date.now()}`,
      state: 'approved',
      total: data.amount
    };
  }

  async refundTransaction(txnId: string): Promise<void> {
    // PayPal-specific refund
  }
}

// Adapter for PayPal
class PayPalAdapter implements PaymentGateway {
  private paypal: PayPalAPI;

  constructor() {
    this.paypal = new PayPalAPI();
  }

  async processPayment(
    amount: number,
    currency: string
  ): Promise<PaymentResult> {
    const result = await this.paypal.makePayment({
      amount,
      currency
    });

    return {
      success: result.state === 'approved',
      transactionId: result.transaction_id,
      amount: result.total
    };
  }

  async refund(transactionId: string): Promise<void> {
    await this.paypal.refundTransaction(transactionId);
  }
}

// Usage - client code doesn't know about specific implementations
async function checkout(
  gateway: PaymentGateway,
  amount: number
): Promise<void> {
  try {
    const result = await gateway.processPayment(amount, 'USD');

    if (result.success) {
      console.log(`Payment successful: ${result.transactionId}`);
    } else {
      console.log('Payment failed');
    }
  } catch (error) {
    console.error('Payment error:', error);
  }
}

const stripeGateway = new StripeAdapter();
const paypalGateway = new PayPalAdapter();

await checkout(stripeGateway, 100);
await checkout(paypalGateway, 50);
```

### Decorator Pattern

**Intent:** Attach additional responsibilities to object dynamically. Decorators provide flexible alternative to subclassing for extending functionality.

**Use When:**
- Add responsibilities to individual objects dynamically
- Responsibilities can be withdrawn
- Extension by subclassing is impractical

**Implementation:**
```typescript
// Component interface
interface Coffee {
  cost(): number;
  description(): string;
}

// Concrete component
class SimpleCoffee implements Coffee {
  cost(): number {
    return 2.0;
  }

  description(): string {
    return 'Simple coffee';
  }
}

// Decorator base class
abstract class CoffeeDecorator implements Coffee {
  constructor(protected coffee: Coffee) {}

  cost(): number {
    return this.coffee.cost();
  }

  description(): string {
    return this.coffee.description();
  }
}

// Concrete decorators
class MilkDecorator extends CoffeeDecorator {
  cost(): number {
    return this.coffee.cost() + 0.5;
  }

  description(): string {
    return this.coffee.description() + ', milk';
  }
}

class SugarDecorator extends CoffeeDecorator {
  cost(): number {
    return this.coffee.cost() + 0.2;
  }

  description(): string {
    return this.coffee.description() + ', sugar';
  }
}

class WhipCreamDecorator extends CoffeeDecorator {
  cost(): number {
    return this.coffee.cost() + 0.7;
  }

  description(): string {
    return this.coffee.description() + ', whipped cream';
  }
}

class CaramelDecorator extends CoffeeDecorator {
  cost(): number {
    return this.coffee.cost() + 0.6;
  }

  description(): string {
    return this.coffee.description() + ', caramel';
  }
}

// Usage
let coffee: Coffee = new SimpleCoffee();
console.log(`${coffee.description()} - $${coffee.cost()}`);
// Simple coffee - $2.0

coffee = new MilkDecorator(coffee);
console.log(`${coffee.description()} - $${coffee.cost()}`);
// Simple coffee, milk - $2.5

coffee = new SugarDecorator(coffee);
console.log(`${coffee.description()} - $${coffee.cost()}`);
// Simple coffee, milk, sugar - $2.7

coffee = new WhipCreamDecorator(new CaramelDecorator(coffee));
console.log(`${coffee.description()} - $${coffee.cost()}`);
// Simple coffee, milk, sugar, caramel, whipped cream - $4.0

// Real-world example: Logging decorator
interface DataSource {
  writeData(data: string): void;
  readData(): string;
}

class FileDataSource implements DataSource {
  constructor(private filename: string) {}

  writeData(data: string): void {
    console.log(`Writing to file: ${this.filename}`);
    // Write to file
  }

  readData(): string {
    console.log(`Reading from file: ${this.filename}`);
    return 'data from file';
  }
}

class DataSourceDecorator implements DataSource {
  constructor(protected wrappee: DataSource) {}

  writeData(data: string): void {
    this.wrappee.writeData(data);
  }

  readData(): string {
    return this.wrappee.readData();
  }
}

class EncryptionDecorator extends DataSourceDecorator {
  writeData(data: string): void {
    const encrypted = this.encrypt(data);
    this.wrappee.writeData(encrypted);
  }

  readData(): string {
    const data = this.wrappee.readData();
    return this.decrypt(data);
  }

  private encrypt(data: string): string {
    console.log('Encrypting data');
    return `encrypted(${data})`;
  }

  private decrypt(data: string): string {
    console.log('Decrypting data');
    return data.replace('encrypted(', '').replace(')', '');
  }
}

class CompressionDecorator extends DataSourceDecorator {
  writeData(data: string): void {
    const compressed = this.compress(data);
    this.wrappee.writeData(compressed);
  }

  readData(): string {
    const data = this.wrappee.readData();
    return this.decompress(data);
  }

  private compress(data: string): string {
    console.log('Compressing data');
    return `compressed(${data})`;
  }

  private decompress(data: string): string {
    console.log('Decompressing data');
    return data.replace('compressed(', '').replace(')', '');
  }
}

class LoggingDecorator extends DataSourceDecorator {
  writeData(data: string): void {
    console.log(`[LOG] Writing data: ${data.substring(0, 50)}...`);
    this.wrappee.writeData(data);
    console.log('[LOG] Write completed');
  }

  readData(): string {
    console.log('[LOG] Reading data');
    const data = this.wrappee.readData();
    console.log(`[LOG] Read completed: ${data.substring(0, 50)}...`);
    return data;
  }
}

// Usage - stack decorators
let dataSource: DataSource = new FileDataSource('data.txt');
dataSource = new EncryptionDecorator(dataSource);
dataSource = new CompressionDecorator(dataSource);
dataSource = new LoggingDecorator(dataSource);

dataSource.writeData('Sensitive data');
const data = dataSource.readData();
```

(Continuing in next part due to length...)

## Behavioral Patterns

### Observer Pattern

**Intent:** Define one-to-many dependency between objects so when one object changes state, all dependents are notified automatically.

**Use When:**
- Abstraction has two aspects, one dependent on other
- Change to one object requires changing others
- Object should notify other objects without assumptions about those objects

**Implementation:**
```typescript
// Subject interface
interface Subject {
  attach(observer: Observer): void;
  detach(observer: Observer): void;
  notify(): void;
}

// Observer interface
interface Observer {
  update(subject: Subject): void;
}

// Concrete subject
class Stock implements Subject {
  private observers: Observer[] = [];
  private _price: number = 0;
  private _symbol: string;

  constructor(symbol: string, initialPrice: number) {
    this._symbol = symbol;
    this._price = initialPrice;
  }

  get price(): number {
    return this._price;
  }

  set price(value: number) {
    console.log(`${this._symbol}: price changed from $${this._price} to $${value}`);
    this._price = value;
    this.notify();
  }

  get symbol(): string {
    return this._symbol;
  }

  attach(observer: Observer): void {
    const exists = this.observers.includes(observer);
    if (!exists) {
      this.observers.push(observer);
      console.log(`Observer attached to ${this._symbol}`);
    }
  }

  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
      console.log(`Observer detached from ${this._symbol}`);
    }
  }

  notify(): void {
    console.log(`Notifying ${this.observers.length} observers...`);
    for (const observer of this.observers) {
      observer.update(this);
    }
  }
}

// Concrete observers
class StockDisplay implements Observer {
  constructor(private name: string) {}

  update(subject: Subject): void {
    if (subject instanceof Stock) {
      console.log(`[${this.name}] ${subject.symbol} is now $${subject.price}`);
    }
  }
}

class StockAlert implements Observer {
  constructor(
    private threshold: number,
    private type: 'above' | 'below'
  ) {}

  update(subject: Subject): void {
    if (subject instanceof Stock) {
      if (this.type === 'above' && subject.price > this.threshold) {
        console.log(`[ALERT] ${subject.symbol} exceeded $${this.threshold}!`);
      } else if (this.type === 'below' && subject.price < this.threshold) {
        console.log(`[ALERT] ${subject.symbol} dropped below $${this.threshold}!`);
      }
    }
  }
}

class StockLogger implements Observer {
  private log: string[] = [];

  update(subject: Subject): void {
    if (subject instanceof Stock) {
      const entry = `${new Date().toISOString()} - ${subject.symbol}: $${subject.price}`;
      this.log.push(entry);
      console.log(`[LOGGER] ${entry}`);
    }
  }

  getLog(): string[] {
    return [...this.log];
  }
}

// Usage
const appleStock = new Stock('AAPL', 150);

const display = new StockDisplay('Main Display');
const highAlert = new StockAlert(160, 'above');
const lowAlert = new StockAlert(140, 'below');
const logger = new StockLogger();

appleStock.attach(display);
appleStock.attach(highAlert);
appleStock.attach(lowAlert);
appleStock.attach(logger);

appleStock.price = 155; // All observers notified
appleStock.price = 165; // Triggers high alert
appleStock.price = 135; // Triggers low alert

// Modern JavaScript approach: EventEmitter
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
}

class Order extends EventEmitter {
  constructor(public id: string) {
    super();
  }

  confirm(): void {
    console.log(`Order ${this.id} confirmed`);
    this.emit('confirmed', this);
  }

  ship(): void {
    console.log(`Order ${this.id} shipped`);
    this.emit('shipped', this);
  }

  deliver(): void {
    console.log(`Order ${this.id} delivered`);
    this.emit('delivered', this);
  }
}

// Usage
const order = new Order('ORD-123');

order.on('confirmed', (o: Order) => {
  console.log(`Email sent: Order ${o.id} confirmed`);
});

order.on('shipped', (o: Order) => {
  console.log(`SMS sent: Order ${o.id} is on the way`);
});

order.on('delivered', (o: Order) => {
  console.log(`Push notification: Order ${o.id} delivered`);
});

order.confirm();
order.ship();
order.deliver();
```

### Strategy Pattern

**Intent:** Define family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets algorithm vary independently from clients that use it.

**Use When:**
- Many related classes differ only in behavior
- Need different variants of algorithm
- Algorithm uses data clients shouldn't know about
- Class defines many behaviors as multiple conditional statements

**Implementation:**
```typescript
// Strategy interface
interface PaymentStrategy {
  pay(amount: number): void;
  refund(transactionId: string): void;
}

// Concrete strategies
class CreditCardStrategy implements PaymentStrategy {
  constructor(
    private cardNumber: string,
    private cvv: string,
    private expiryDate: string
  ) {}

  pay(amount: number): void {
    console.log(`Paying $${amount} using Credit Card ****${this.cardNumber.slice(-4)}`);
    // Credit card payment logic
  }

  refund(transactionId: string): void {
    console.log(`Refunding credit card transaction: ${transactionId}`);
  }
}

class PayPalStrategy implements PaymentStrategy {
  constructor(private email: string) {}

  pay(amount: number): void {
    console.log(`Paying $${amount} using PayPal account: ${this.email}`);
    // PayPal payment logic
  }

  refund(transactionId: string): void {
    console.log(`Refunding PayPal transaction: ${transactionId}`);
  }
}

class CryptocurrencyStrategy implements PaymentStrategy {
  constructor(private walletAddress: string) {}

  pay(amount: number): void {
    console.log(`Paying $${amount} using Crypto wallet: ${this.walletAddress}`);
    // Cryptocurrency payment logic
  }

  refund(transactionId: string): void {
    console.log(`Refunding crypto transaction: ${transactionId}`);
  }
}

// Context
class ShoppingCart {
  private items: Array<{ name: string; price: number }> = [];
  private paymentStrategy?: PaymentStrategy;

  addItem(name: string, price: number): void {
    this.items.push({ name, price });
  }

  setPaymentStrategy(strategy: PaymentStrategy): void {
    this.paymentStrategy = strategy;
  }

  calculateTotal(): number {
    return this.items.reduce((total, item) => total + item.price, 0);
  }

  checkout(): void {
    if (!this.paymentStrategy) {
      throw new Error('Payment method not set');
    }

    const total = this.calculateTotal();
    this.paymentStrategy.pay(total);
  }
}

// Usage
const cart = new ShoppingCart();
cart.addItem('Laptop', 1200);
cart.addItem('Mouse', 25);
cart.addItem('Keyboard', 75);

// Pay with credit card
cart.setPaymentStrategy(
  new CreditCardStrategy('1234567890123456', '123', '12/25')
);
cart.checkout();

// Change payment method to PayPal
cart.setPaymentStrategy(new PayPalStrategy('user@example.com'));
cart.checkout();

// Real-world example: Sorting strategies
interface SortStrategy<T> {
  sort(data: T[]): T[];
}

class QuickSort<T> implements SortStrategy<T> {
  sort(data: T[]): T[] {
    console.log('Sorting using QuickSort');
    // QuickSort implementation
    return [...data].sort();
  }
}

class MergeSort<T> implements SortStrategy<T> {
  sort(data: T[]): T[] {
    console.log('Sorting using MergeSort');
    // MergeSort implementation
    return [...data].sort();
  }
}

class BubbleSort<T> implements SortStrategy<T> {
  sort(data: T[]): T[] {
    console.log('Sorting using BubbleSort');
    // BubbleSort implementation
    return [...data].sort();
  }
}

class DataProcessor<T> {
  constructor(private sortStrategy: SortStrategy<T>) {}

  setSortStrategy(strategy: SortStrategy<T>): void {
    this.sortStrategy = strategy;
  }

  processData(data: T[]): T[] {
    console.log('Processing data...');
    const sorted = this.sortStrategy.sort(data);
    console.log('Processing complete');
    return sorted;
  }
}

// Usage
const processor = new DataProcessor(new QuickSort<number>());
processor.processData([5, 2, 8, 1, 9]);

processor.setSortStrategy(new MergeSort<number>());
processor.processData([5, 2, 8, 1, 9]);
```

### Command Pattern

**Intent:** Encapsulate request as object, allowing parameterization of clients with different requests, queue or log requests, and support undoable operations.

**Use When:**
- Parameterize objects by action to perform
- Specify, queue, and execute requests at different times
- Support undo
- Support logging changes
- Structure system around high-level operations built on primitive operations

**Implementation:**
```typescript
// Command interface
interface Command {
  execute(): void;
  undo(): void;
}

// Receiver
class TextEditor {
  private content: string = '';

  getContent(): string {
    return this.content;
  }

  write(text: string): void {
    this.content += text;
  }

  delete(length: number): void {
    this.content = this.content.slice(0, -length);
  }

  clear(): void {
    this.content = '';
  }
}

// Concrete commands
class WriteCommand implements Command {
  constructor(
    private editor: TextEditor,
    private text: string
  ) {}

  execute(): void {
    this.editor.write(this.text);
  }

  undo(): void {
    this.editor.delete(this.text.length);
  }
}

class DeleteCommand implements Command {
  private deletedText: string = '';

  constructor(
    private editor: TextEditor,
    private length: number
  ) {}

  execute(): void {
    const content = this.editor.getContent();
    this.deletedText = content.slice(-this.length);
    this.editor.delete(this.length);
  }

  undo(): void {
    this.editor.write(this.deletedText);
  }
}

class ClearCommand implements Command {
  private previousContent: string = '';

  constructor(private editor: TextEditor) {}

  execute(): void {
    this.previousContent = this.editor.getContent();
    this.editor.clear();
  }

  undo(): void {
    this.editor.write(this.previousContent);
  }
}

// Invoker
class CommandManager {
  private history: Command[] = [];
  private currentIndex: number = -1;

  execute(command: Command): void {
    command.execute();

    // Remove commands after current index (for redo functionality)
    this.history = this.history.slice(0, this.currentIndex + 1);

    this.history.push(command);
    this.currentIndex++;
  }

  undo(): void {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
    } else {
      console.log('Nothing to undo');
    }
  }

  redo(): void {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      command.execute();
    } else {
      console.log('Nothing to redo');
    }
  }

  getHistory(): string[] {
    return this.history.map((cmd, index) => {
      const marker = index === this.currentIndex ? '>' : ' ';
      return `${marker} ${cmd.constructor.name}`;
    });
  }
}

// Usage
const editor = new TextEditor();
const manager = new CommandManager();

manager.execute(new WriteCommand(editor, 'Hello '));
console.log(editor.getContent()); // "Hello "

manager.execute(new WriteCommand(editor, 'World'));
console.log(editor.getContent()); // "Hello World"

manager.execute(new WriteCommand(editor, '!'));
console.log(editor.getContent()); // "Hello World!"

manager.undo();
console.log(editor.getContent()); // "Hello World"

manager.undo();
console.log(editor.getContent()); // "Hello "

manager.redo();
console.log(editor.getContent()); // "Hello World"

manager.execute(new ClearCommand(editor));
console.log(editor.getContent()); // ""

manager.undo();
console.log(editor.getContent()); // "Hello World"

console.log(manager.getHistory());
```

## Design Principles

### SOLID Principles

**Single Responsibility Principle (SRP):**
```typescript
// BAD: Multiple responsibilities
class User {
  constructor(public name: string, public email: string) {}

  save(): void {
    // Database logic
  }

  sendEmail(message: string): void {
    // Email logic
  }

  generateReport(): string {
    // Report logic
    return '';
  }
}

// GOOD: Single responsibility
class User {
  constructor(public name: string, public email: string) {}
}

class UserRepository {
  save(user: User): void {
    // Database logic
  }

  findById(id: string): User | null {
    return null;
  }
}

class UserEmailService {
  sendEmail(user: User, message: string): void {
    // Email logic
  }
}

class UserReportGenerator {
  generate(user: User): string {
    // Report logic
    return '';
  }
}
```

**Open/Closed Principle (OCP):**
```typescript
// BAD: Need to modify for new shape
class AreaCalculator {
  calculate(shapes: any[]): number {
    let area = 0;

    for (const shape of shapes) {
      if (shape.type === 'circle') {
        area += Math.PI * shape.radius ** 2;
      } else if (shape.type === 'rectangle') {
        area += shape.width * shape.height;
      }
      // Need to add new if-else for each shape
    }

    return area;
  }
}

// GOOD: Open for extension, closed for modification
interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number
  ) {}

  area(): number {
    return this.width * this.height;
  }
}

class Triangle implements Shape {
  constructor(
    private base: number,
    private height: number
  ) {}

  area(): number {
    return (this.base * this.height) / 2;
  }
}

class AreaCalculator {
  calculate(shapes: Shape[]): number {
    return shapes.reduce((total, shape) => total + shape.area(), 0);
  }
}
```

**Liskov Substitution Principle (LSP):**
```typescript
// BAD: Violates LSP
class Bird {
  fly(): void {
    console.log('Flying');
  }
}

class Penguin extends Bird {
  fly(): void {
    throw new Error('Penguins cannot fly');
  }
}

// GOOD: Follows LSP
abstract class Bird {
  abstract move(): void;
}

class FlyingBird extends Bird {
  move(): void {
    this.fly();
  }

  private fly(): void {
    console.log('Flying');
  }
}

class Penguin extends Bird {
  move(): void {
    this.swim();
  }

  private swim(): void {
    console.log('Swimming');
  }
}
```

**Interface Segregation Principle (ISP):**
```typescript
// BAD: Fat interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Human implements Worker {
  work(): void { console.log('Working'); }
  eat(): void { console.log('Eating'); }
  sleep(): void { console.log('Sleeping'); }
}

class Robot implements Worker {
  work(): void { console.log('Working'); }
  eat(): void { throw new Error('Robots do not eat'); }
  sleep(): void { throw new Error('Robots do not sleep'); }
}

// GOOD: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work(): void { console.log('Working'); }
  eat(): void { console.log('Eating'); }
  sleep(): void { console.log('Sleeping'); }
}

class Robot implements Workable {
  work(): void { console.log('Working'); }
}
```

**Dependency Inversion Principle (DIP):**
```typescript
// BAD: High-level depends on low-level
class MySQLDatabase {
  save(data: string): void {
    console.log('Saving to MySQL');
  }
}

class UserService {
  private database = new MySQLDatabase();

  saveUser(user: User): void {
    this.database.save(JSON.stringify(user));
  }
}

// GOOD: Both depend on abstraction
interface Database {
  save(data: string): void;
}

class MySQLDatabase implements Database {
  save(data: string): void {
    console.log('Saving to MySQL');
  }
}

class MongoDatabase implements Database {
  save(data: string): void {
    console.log('Saving to MongoDB');
  }
}

class UserService {
  constructor(private database: Database) {}

  saveUser(user: User): void {
    this.database.save(JSON.stringify(user));
  }
}

// Usage - dependency injection
const mysqlDb = new MySQLDatabase();
const userService = new UserService(mysqlDb);
```

## Related Resources

- [Refactoring](refactoring.md)
- [SOLID Principles](solid-principles.md)
- [Clean Code](clean-code.md)
- [Code Review](code-review.md)
- [Test-Driven Development](../04-testing-strategy/tdd.md)

## References

- **Gang of Four**: "Design Patterns: Elements of Reusable Object-Oriented Software"
- **Martin Fowler**: "Patterns of Enterprise Application Architecture"
- **Robert C. Martin**: "Clean Architecture"
- **Eric Freeman & Elisabeth Robson**: "Head First Design Patterns"
- **Refactoring.Guru**: Design Patterns
- **SourceMaking.com**: Design Patterns
- **ISO/IEC 25010**: Software Quality Standards

---

**Part of**: [Development Practices](README.md)
