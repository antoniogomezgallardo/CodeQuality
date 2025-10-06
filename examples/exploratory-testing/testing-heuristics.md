# Exploratory Testing Heuristics

Testing heuristics are rules of thumb, educated guesses, or mental shortcuts that help guide exploratory testing sessions. They provide structure while maintaining the flexibility that makes exploratory testing valuable.

## 🧠 General Testing Heuristics

### CRUD Operations (Create, Read, Update, Delete)
Every data entity should be tested for:
- **Create:** Can new records be added correctly?
- **Read:** Can existing records be retrieved and displayed?
- **Update:** Can records be modified accurately?
- **Delete:** Can records be removed safely?

#### CRUD Testing Questions
- What happens when you create duplicate records?
- Can you read records with special characters?
- What if you update a record that another user is editing?
- What if you try to delete a record that's referenced elsewhere?
- How does the system handle concurrent CRUD operations?

### Goldilocks Testing (Too Little, Too Much, Just Right)
Test with three levels of input:
- **Too Little:** Minimum values, empty fields, null data
- **Too Much:** Maximum values, oversized inputs, flood testing
- **Just Right:** Normal, expected values within valid ranges

#### Examples
- **Text Fields:** Empty string, single character, maximum length + 1
- **Numbers:** Zero, negative, maximum integer values
- **Files:** Empty file, extremely large file, normal-sized file
- **Lists:** Empty list, single item, thousands of items

### Boundary Value Exploration
Focus on the edges and boundaries of input domains:
- **Numeric Boundaries:** -1, 0, 1, MAX_INT, MIN_INT
- **String Boundaries:** Empty, single char, max length
- **Date Boundaries:** Past dates, future dates, leap years
- **Time Boundaries:** Midnight, noon, timezone changes

## 🎯 Feature-Specific Heuristics

### Form Testing Heuristics

#### Input Field Testing
- **Data Types:** Text, numbers, dates, emails, URLs
- **Length Limits:** Too short, too long, exactly at limit
- **Character Sets:** ASCII, Unicode, emojis, special symbols
- **Case Sensitivity:** Uppercase, lowercase, mixed case
- **Leading/Trailing:** Spaces, tabs, newlines

#### Form Behavior Testing
- **Navigation:** Tab order, Enter key behavior, mouse vs. keyboard
- **Validation:** Client-side vs. server-side, real-time vs. submit
- **State Management:** Form memory, auto-save, session timeouts
- **Accessibility:** Screen reader compatibility, keyboard navigation

### User Interface Testing Heuristics

#### Visual Testing
- **Layout:** Responsive design, element alignment, overflow
- **Typography:** Font sizes, readability, text truncation
- **Colors:** Contrast ratios, color blindness considerations
- **Images:** Loading, alt text, broken image handling

#### Interaction Testing
- **Click Targets:** Size, spacing, hover states, active states
- **Gestures:** Swipe, pinch, zoom (mobile testing)
- **Drag and Drop:** Valid/invalid drop zones, visual feedback
- **Keyboard Shortcuts:** Common shortcuts, accessibility shortcuts

### Authentication Testing Heuristics

#### Login Testing
- **Credentials:** Valid, invalid, expired, locked accounts
- **Session Management:** Timeouts, concurrent sessions, remember me
- **Security:** Brute force protection, password policies
- **Social Login:** Third-party authentication, account linking

#### Permission Testing
- **Role-Based Access:** Different user roles and permissions
- **Privilege Escalation:** Attempting unauthorized actions
- **Data Isolation:** Users seeing only their own data
- **Administrative Functions:** Admin-only features and controls

## 🔍 Technical Testing Heuristics

### Performance Testing Heuristics

#### Load Testing Ideas
- **Gradual Load:** Slowly increase user activity
- **Spike Testing:** Sudden increases in load
- **Stress Testing:** Push beyond normal capacity
- **Endurance Testing:** Sustained load over time

#### Performance Observation Points
- **Response Times:** Page loads, API calls, database queries
- **Resource Usage:** Memory, CPU, network bandwidth
- **User Experience:** Loading indicators, progressive loading
- **Bottlenecks:** Slow queries, large file downloads

### Error Handling Heuristics

#### Error Condition Testing
- **Network Issues:** Timeouts, connection drops, slow networks
- **Server Errors:** 500 errors, database unavailable, API failures
- **Client Errors:** JavaScript errors, browser compatibility issues
- **Data Corruption:** Invalid data, encoding issues, format problems

#### Error Message Evaluation
- **Clarity:** Are error messages understandable?
- **Actionability:** Do they tell users what to do next?
- **Security:** Do they reveal sensitive information?
- **Consistency:** Are similar errors handled similarly?

### Security Testing Heuristics

#### Input Validation Testing
- **Injection Attacks:** SQL, XSS, command injection attempts
- **File Upload Security:** Malicious files, oversized files
- **URL Manipulation:** Parameter tampering, path traversal
- **Data Exposure:** Information leakage in error messages

#### Authentication Security
- **Password Security:** Weak passwords, password reuse
- **Session Security:** Session hijacking, fixation attacks
- **Account Security:** Brute force, account enumeration
- **Transport Security:** HTTPS enforcement, SSL/TLS validation

## 🎨 Creative Testing Heuristics

### Persona-Based Testing
Think like different user types:
- **The Novice:** First-time user, needs guidance
- **The Expert:** Power user, wants efficiency
- **The Skeptic:** Cautious user, worried about security
- **The Impatient:** Wants everything to be fast
- **The Accessible:** Uses assistive technologies

### Scenario-Based Testing
Create realistic user scenarios:
- **Happy Path:** Everything goes as planned
- **Interruption:** User is interrupted mid-task
- **Multi-tasking:** User switches between applications
- **Return User:** User comes back after time away
- **Mobile Context:** User on-the-go with distractions

### Time-Based Testing
Consider timing factors:
- **Rush Testing:** User in a hurry, makes quick decisions
- **Careful Testing:** User takes time, reads everything
- **Peak Hours:** System under high load
- **Off-Hours:** System with minimal load
- **Timezone Testing:** Different time zones and locales

## 📊 Heuristic Application Framework

### FEW HICCUPS Heuristic
A comprehensive framework for remembering key testing areas:
- **F**unctionality
- **E**rror handling
- **W**orkflow

- **H**istory (browser history, undo/redo)
- **I**nterruptions
- **C**ompliance (standards, regulations)
- **C**ustomer feedback
- **U**sability
- **P**erformance
- **S**ecurity

### SFDPOT Heuristic
For touring the application:
- **S**tructure (how is it built?)
- **F**unction (what does it do?)
- **D**ata (what data does it handle?)
- **P**latform (what environment does it run on?)
- **O**perations (how do people use it?)
- **T**ime (timing and sequence issues)

### Touring Heuristics
Different ways to explore an application:
- **Business District Tour:** Focus on core functionality
- **Historic District Tour:** Look at legacy features
- **Tourist District Tour:** Features new users see first
- **Entertainment District Tour:** Fun, engaging features
- **Hotel District Tour:** Where users spend most time
- **Seedy District Tour:** Error conditions and edge cases

## 🔧 Practical Heuristic Application

### Session Planning with Heuristics
1. **Choose Primary Heuristics:** Select 2-3 relevant heuristics
2. **Generate Test Ideas:** Use heuristics to brainstorm
3. **Prioritize Ideas:** Focus on highest-risk areas
4. **Execute with Flexibility:** Let discoveries guide exploration
5. **Document Patterns:** Note which heuristics were most valuable

### Heuristic Evaluation Questions
- **Relevance:** Is this heuristic applicable to the current context?
- **Coverage:** Does this heuristic help explore important risk areas?
- **Efficiency:** Does this heuristic help find issues quickly?
- **Completeness:** Are there gaps this heuristic doesn't address?

### Common Heuristic Combinations
- **CRUD + Boundary:** Test data operations at limits
- **Persona + Scenario:** Role-playing realistic user journeys
- **Error + Security:** Focus on attack vectors through error conditions
- **Performance + Load:** Observe behavior under stress
- **Accessibility + Usability:** Inclusive design evaluation

## 📝 Custom Heuristic Development

### Creating Domain-Specific Heuristics
1. **Analyze Your Domain:** What are common failure patterns?
2. **Study User Behavior:** How do real users interact?
3. **Review Past Issues:** What problems have occurred before?
4. **Identify Risk Patterns:** Where are vulnerabilities likely?
5. **Formalize Patterns:** Create memorable heuristics

### Example: E-commerce Heuristics
- **Shopping Cart States:** Empty, single item, multiple items, full cart
- **Payment Flow:** Multiple payment methods, failed payments, retries
- **Inventory Management:** In stock, out of stock, limited quantity
- **Price Calculations:** Taxes, shipping, discounts, currency conversion
- **Order States:** Pending, processing, shipped, delivered, returned

### Example: Mobile App Heuristics
- **Device Orientations:** Portrait, landscape, rotation during use
- **Network Conditions:** WiFi, cellular, offline, poor signal
- **Interruptions:** Phone calls, notifications, app switching
- **Device States:** Low battery, low storage, memory pressure
- **Platform Differences:** iOS vs. Android behaviors

## 🎯 Heuristic Effectiveness Tips

### Making Heuristics Memorable
- **Use Acronyms:** FEW HICCUPS, SFDPOT
- **Create Mnemonics:** "Every Good Boy Does Fine"
- **Visual Associations:** Mind maps, diagrams
- **Story-Based:** Create narratives around heuristics
- **Practice Regularly:** Use heuristics consistently

### Avoiding Heuristic Pitfalls
- **Don't Over-Rely:** Heuristics guide, don't dictate
- **Stay Curious:** Let observations lead exploration
- **Adapt to Context:** Some heuristics won't apply
- **Document Exceptions:** Note when heuristics don't help
- **Update Regularly:** Refine heuristics based on experience

### Team Heuristic Practices
- **Shared Vocabulary:** Ensure team understands common heuristics
- **Heuristic Reviews:** Discuss effectiveness in retrospectives
- **Custom Development:** Create team-specific heuristics
- **Knowledge Sharing:** Share successful heuristic applications
- **Training Sessions:** Teach heuristics to new team members

---

*Heuristics provide the structure and mental models that make exploratory testing both efficient and thorough. They help testers ask the right questions and explore the right areas while maintaining the flexibility to follow interesting discoveries.*