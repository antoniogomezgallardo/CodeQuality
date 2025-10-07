# Industry Standards for Software Quality

## Purpose
Comprehensive reference for international and industry standards that guide software quality practices, testing, development, and security.

## Overview
Industry standards provide:
- Common terminology and definitions
- Proven best practices
- Quality benchmarks
- Compliance frameworks
- Process guidelines

## Testing Standards

### ISO/IEC/IEEE 29119 - Software Testing

The comprehensive international standard for software testing.

#### Part 1: Concepts and Definitions
**Key Concepts:**
- Test process definition
- Testing terminology
- Risk-based testing
- Test documentation
- Test organization roles

**Testing Principles:**
1. Testing shows presence of defects, not absence
2. Exhaustive testing is impossible
3. Early testing saves time and money
4. Defects cluster together
5. Tests wear out (pesticide paradox)
6. Testing is context dependent
7. Absence-of-defects fallacy

#### Part 2: Test Processes

**Organizational Test Process:**
- Test policy and strategy
- Test management
- Test monitoring and control
- Test completion

**Test Management Process:**
```
Planning → Monitoring → Control → Completion
    ↓          ↓          ↓          ↓
Resources  Metrics    Actions   Reports
```

**Dynamic Test Process:**
1. Test design and implementation
2. Test environment setup
3. Test execution
4. Test incident reporting

#### Part 3: Test Documentation

**Test Plan Template:**
```markdown
1. Test Plan Identifier
2. Introduction
3. Test Items
4. Features to be Tested
5. Features not to be Tested
6. Approach
7. Item Pass/Fail Criteria
8. Suspension and Resumption Criteria
9. Test Deliverables
10. Testing Tasks
11. Environmental Needs
12. Responsibilities
13. Staffing and Training Needs
14. Schedule
15. Risks and Contingencies
16. Approvals
```

**Test Case Specification:**
- Test case identifier
- Test objective
- Preconditions
- Test steps
- Expected results
- Postconditions
- Test data requirements

#### Part 4: Test Techniques

**Black-Box Techniques:**
- Equivalence partitioning
- Boundary value analysis
- Decision tables
- State transition testing
- Use case testing
- Classification tree method

**White-Box Techniques:**
- Statement coverage
- Decision coverage
- Condition coverage
- Modified condition/decision coverage (MC/DC)
- Path coverage

**Experience-Based Techniques:**
- Error guessing
- Exploratory testing
- Checklist-based testing

#### Part 5: Keyword-Driven Testing

**Keyword Structure:**
```
Keyword: LoginUser
Arguments: [username, password]
Description: Logs user into system
Steps:
  1. Navigate to login page
  2. Enter username
  3. Enter password
  4. Click login button
  5. Verify dashboard displayed
```

### IEEE 829 - Test Documentation

Classic standard for test documentation (now incorporated into ISO/IEC/IEEE 29119).

**Test Plan (TP)**
- Scope and objectives
- Test strategy
- Resources and schedule
- Risks and contingencies

**Test Design Specification (TDS)**
- Features to test
- Test approach refinement
- Pass/fail criteria
- Test case identification

**Test Case Specification (TCS)**
- Input specifications
- Output specifications
- Environmental needs
- Special procedural requirements

**Test Procedure Specification (TPS)**
- Step-by-step instructions
- Setup requirements
- Expected results for each step
- Cleanup procedures

**Test Item Transmittal Report (TTR)**
- Items transmitted for testing
- Location of items
- Status of items
- Approvals

**Test Log (TL)**
- Test execution chronology
- Test environment details
- Tester information
- Observations

**Test Incident Report (TIR)**
- Incident description
- Impact assessment
- Priority and severity
- Steps to reproduce

**Test Summary Report (TSR)**
- Testing summary
- Comprehensive assessment
- Evaluation against criteria
- Recommendations

### ISTQB (International Software Testing Qualifications Board)

**Foundation Level Syllabus Topics:**

1. **Fundamentals of Testing**
   - Why testing is necessary
   - Seven testing principles
   - Test process
   - Psychology of testing

2. **Testing Throughout SDLC**
   - Software development models
   - Test levels
   - Test types
   - Maintenance testing

3. **Static Testing**
   - Static techniques
   - Review process
   - Tool support

4. **Test Techniques**
   - Black-box techniques
   - White-box techniques
   - Experience-based techniques

5. **Test Management**
   - Test organization
   - Test planning and estimation
   - Test monitoring and control
   - Configuration management
   - Risk and testing
   - Defect management

6. **Tool Support for Testing**
   - Test tool considerations
   - Effective tool use

## Development Standards

### IEEE 830 - Software Requirements Specifications (SRS)

**SRS Structure:**

```markdown
1. Introduction
   1.1 Purpose
   1.2 Scope
   1.3 Definitions, Acronyms, Abbreviations
   1.4 References
   1.5 Overview

2. Overall Description
   2.1 Product Perspective
   2.2 Product Functions
   2.3 User Characteristics
   2.4 Constraints
   2.5 Assumptions and Dependencies

3. Specific Requirements
   3.1 Functional Requirements
   3.2 External Interface Requirements
   3.3 Performance Requirements
   3.4 Design Constraints
   3.5 Software System Attributes
   3.6 Other Requirements
```

**Quality Characteristics:**
- Correct
- Unambiguous
- Complete
- Consistent
- Ranked for importance/stability
- Verifiable
- Modifiable
- Traceable

### ISO/IEC 12207 - Software Life Cycle Processes

**Process Categories:**

#### 1. Agreement Processes
- **Acquisition Process**: Obtain product/service
- **Supply Process**: Provide product/service

#### 2. Organizational Project-Enabling Processes
- **Life Cycle Model Management**: Define and maintain processes
- **Infrastructure Management**: Provide infrastructure
- **Portfolio Management**: Initiate and sustain projects
- **Human Resource Management**: Provide skilled resources
- **Quality Management**: Ensure quality products/services

#### 3. Technical Management Processes
- **Project Planning**: Establish plans
- **Project Assessment and Control**: Monitor and control
- **Decision Management**: Make informed decisions
- **Risk Management**: Manage risks
- **Configuration Management**: Manage configurations
- **Information Management**: Provide information
- **Measurement**: Collect and analyze data
- **Quality Assurance**: Provide assurance

#### 4. Technical Processes
- **Business or Mission Analysis**: Define stakeholder needs
- **Stakeholder Needs and Requirements**: Elicit requirements
- **System Requirements Definition**: Transform needs to requirements
- **Architecture Definition**: Synthesize solution
- **Design Definition**: Provide design details
- **System Analysis**: Provide analytical evidence
- **Implementation**: Realize system element
- **Integration**: Combine system elements
- **Verification**: Confirm requirements are fulfilled
- **Transition**: Install operational system
- **Validation**: Confirm system meets stakeholder needs
- **Operation**: Use system for intended purpose
- **Maintenance**: Sustain capability
- **Disposal**: End system existence

### ISO/IEC 25010 - Software Quality Models

**Product Quality Model:**

```
Functional Suitability
├── Completeness: Degree to which functions cover tasks
├── Correctness: Degree to which product provides correct results
└── Appropriateness: Degree to which functions facilitate tasks

Performance Efficiency
├── Time Behavior: Response and processing times
├── Resource Utilization: Amounts and types of resources used
└── Capacity: Maximum limits of product parameters

Compatibility
├── Co-existence: Sharing environment with other products
└── Interoperability: Exchange and use information

Usability
├── Appropriateness Recognizability: Users recognize suitability
├── Learnability: Ease of learning to use
├── Operability: Ease of operation and control
├── User Error Protection: Protection against user errors
├── User Interface Aesthetics: Pleasant user interface
└── Accessibility: Use by people with widest range of characteristics

Reliability
├── Maturity: Meets reliability needs under normal operation
├── Availability: Operational and accessible when required
├── Fault Tolerance: Operates despite faults
└── Recoverability: Recover data and re-establish desired state

Security
├── Confidentiality: Data accessible only to authorized
├── Integrity: Prevention of unauthorized modification
├── Non-repudiation: Proof of actions or events
├── Authenticity: Proof of identity
└── Accountability: Trace actions to entity

Maintainability
├── Modularity: Composed of discrete components
├── Reusability: Use in more than one system
├── Analyzability: Assess impact of changes
├── Modifiability: Modified without defects or degradation
└── Testability: Establish test criteria and conduct tests

Portability
├── Adaptability: Adapted for different environments
├── Installability: Successfully installed/uninstalled
└── Replaceability: Replace another product for same purpose
```

**Quality in Use Model:**
- Effectiveness
- Efficiency
- Satisfaction
- Freedom from risk
- Context coverage

## Security Standards

### OWASP (Open Web Application Security Project)

#### OWASP Top 10 (2021)

**A01: Broken Access Control**
- Bypassing access checks
- Viewing/editing unauthorized data
- Elevation of privilege

**A02: Cryptographic Failures**
- Transmission of data in clear text
- Use of weak cryptographic algorithms
- Missing or improper certificate validation

**A03: Injection**
- SQL, NoSQL, OS command injection
- LDAP injection
- Expression language injection

**A04: Insecure Design**
- Missing or ineffective control design
- Lack of threat modeling
- Insecure design patterns

**A05: Security Misconfiguration**
- Missing security hardening
- Unnecessary features enabled
- Default accounts and passwords

**A06: Vulnerable and Outdated Components**
- Unsupported/outdated software
- Unknown component versions
- Unpatched vulnerabilities

**A07: Identification and Authentication Failures**
- Permits automated attacks
- Weak passwords
- Missing or ineffective MFA

**A08: Software and Data Integrity Failures**
- Unverified CI/CD pipeline
- Auto-update without integrity verification
- Insecure deserialization

**A09: Security Logging and Monitoring Failures**
- Missing logging of critical events
- Inadequate log monitoring
- Delayed incident detection

**A10: Server-Side Request Forgery (SSRF)**
- Fetching remote resources without validation
- URL manipulation
- Firewall bypass

#### OWASP ASVS (Application Security Verification Standard)

**Verification Levels:**
- **Level 1**: Basic security (all applications)
- **Level 2**: Standard security (most applications)
- **Level 3**: Advanced security (critical applications)

**Requirements Categories:**
1. Architecture, Design and Threat Modeling
2. Authentication
3. Session Management
4. Access Control
5. Validation, Sanitization and Encoding
6. Cryptography
7. Error Handling and Logging
8. Data Protection
9. Communication
10. Malicious Code
11. Business Logic
12. Files and Resources
13. API and Web Service
14. Configuration

#### OWASP Testing Guide

**Testing Categories:**
1. Information Gathering
2. Configuration and Deployment Management
3. Identity Management
4. Authentication
5. Authorization
6. Session Management
7. Input Validation
8. Error Handling
9. Cryptography
10. Business Logic
11. Client-Side Testing

### ISO/IEC 27001 - Information Security Management

**ISMS Framework:**

```
Plan
├── Establish ISMS scope
├── Define security policy
├── Conduct risk assessment
└── Select controls

Do
├── Implement controls
├── Manage operations
├── Provide resources
└── Train personnel

Check
├── Monitor and measure
├── Conduct internal audit
├── Management review
└── Evaluate effectiveness

Act
├── Take corrective actions
├── Implement improvements
├── Adapt to changes
└── Update ISMS
```

**Control Categories (Annex A):**

**Organizational Controls:**
- Information security policies
- Organization of information security
- Human resource security
- Asset management

**People Controls:**
- Access control
- Cryptography
- Physical and environmental security

**Physical Controls:**
- Secure areas
- Equipment security
- Media handling

**Technological Controls:**
- System acquisition, development and maintenance
- Supplier relationships
- Incident management
- Business continuity
- Compliance

## Accessibility Standards

### WCAG 2.1 (Web Content Accessibility Guidelines)

**Four Principles (POUR):**

#### 1. Perceivable
**Guideline 1.1: Text Alternatives**
- Provide text alternatives for non-text content

**Guideline 1.2: Time-based Media**
- Provide alternatives for time-based media

**Guideline 1.3: Adaptable**
- Create content in different ways without losing information

**Guideline 1.4: Distinguishable**
- Make it easier to see and hear content

#### 2. Operable
**Guideline 2.1: Keyboard Accessible**
- All functionality available from keyboard

**Guideline 2.2: Enough Time**
- Provide users enough time to read and use content

**Guideline 2.3: Seizures and Physical Reactions**
- Do not design content known to cause seizures

**Guideline 2.4: Navigable**
- Help users navigate and find content

**Guideline 2.5: Input Modalities**
- Make it easier to operate functionality through various inputs

#### 3. Understandable
**Guideline 3.1: Readable**
- Make text content readable and understandable

**Guideline 3.2: Predictable**
- Make web pages appear and operate in predictable ways

**Guideline 3.3: Input Assistance**
- Help users avoid and correct mistakes

#### 4. Robust
**Guideline 4.1: Compatible**
- Maximize compatibility with current and future tools

**Conformance Levels:**
- **Level A**: Minimum level (must satisfy)
- **Level AA**: Recommended level (should satisfy)
- **Level AAA**: Enhanced level (may satisfy)

## Code Quality Standards

### ISO/IEC 25023 - Quality Measurement

**Code Metrics:**

**Maintainability Metrics:**
- Cyclomatic complexity
- Lines of code
- Comment density
- Coupling between objects
- Depth of inheritance tree

**Reliability Metrics:**
- Defect density
- Mean time between failures
- Error handling coverage

**Security Metrics:**
- Known vulnerability density
- Security test coverage
- Cryptographic strength

### MISRA (Motor Industry Software Reliability Association)

**For Safety-Critical Systems:**
- C/C++ coding standards
- Mandatory/required/advisory rules
- Static analysis compliance
- Exception handling

## Compliance and Regulatory Standards

### GDPR (General Data Protection Regulation)

**Key Principles:**
1. Lawfulness, fairness and transparency
2. Purpose limitation
3. Data minimization
4. Accuracy
5. Storage limitation
6. Integrity and confidentiality
7. Accountability

**Technical Requirements:**
- Privacy by design
- Data protection impact assessment
- Data breach notification
- Right to erasure
- Data portability

### HIPAA (Health Insurance Portability and Accountability Act)

**Security Rule Requirements:**

**Administrative Safeguards:**
- Security management process
- Assigned security responsibility
- Workforce security
- Information access management

**Physical Safeguards:**
- Facility access controls
- Workstation use and security
- Device and media controls

**Technical Safeguards:**
- Access control
- Audit controls
- Integrity controls
- Transmission security

### SOC 2 (Service Organization Control 2)

**Trust Service Criteria:**
- **Security**: Protection against unauthorized access
- **Availability**: System available for operation and use
- **Processing Integrity**: Complete, valid, accurate, timely
- **Confidentiality**: Protected as committed or agreed
- **Privacy**: Personal information collected, used, retained, disclosed, and disposed

## Agile and DevOps Standards

### SAFe (Scaled Agile Framework)

**Core Values:**
1. Alignment
2. Built-in Quality
3. Transparency
4. Program Execution

**Quality Practices:**
- Continuous Integration
- Test-Driven Development
- Pair Programming
- Code Reviews
- Automated Testing
- Definition of Done

### DevOps Standards

**DORA Metrics (State of DevOps):**
- Deployment Frequency
- Lead Time for Changes
- Time to Restore Service
- Change Failure Rate

**The Three Ways:**
1. **Flow**: Optimize delivery from dev to ops
2. **Feedback**: Amplify feedback loops
3. **Continual Learning**: Experimentation and learning

## Practical Application

### Standards Selection Matrix

| Project Type | Core Standards | Optional Standards |
|-------------|---------------|-------------------|
| Web Application | ISO/IEC 25010, OWASP Top 10 | WCAG 2.1, SOC 2 |
| Mobile App | ISO/IEC 25010, OWASP Mobile | IEEE 829, WCAG 2.1 |
| Enterprise System | ISO/IEC 12207, ISO 27001 | SAFe, CMMI |
| Medical Device | IEC 62304, ISO 14971 | MISRA, DO-178C |
| Safety-Critical | ISO 26262, MISRA | DO-178C, IEC 61508 |

### Implementation Checklist

**Planning Phase:**
- [ ] Identify applicable standards
- [ ] Understand compliance requirements
- [ ] Assess current compliance level
- [ ] Create compliance roadmap
- [ ] Allocate resources

**Implementation Phase:**
- [ ] Train team on standards
- [ ] Update processes and procedures
- [ ] Implement required documentation
- [ ] Configure tools and automation
- [ ] Establish verification process

**Verification Phase:**
- [ ] Conduct internal audits
- [ ] Review documentation completeness
- [ ] Verify process compliance
- [ ] Address gaps and issues
- [ ] Prepare for external audit

**Maintenance Phase:**
- [ ] Monitor standard updates
- [ ] Update processes accordingly
- [ ] Conduct regular reviews
- [ ] Continuous improvement
- [ ] Maintain certifications

## References

### Standards Organizations
- [ISO](https://www.iso.org) - International Organization for Standardization
- [IEC](https://www.iec.ch) - International Electrotechnical Commission
- [IEEE](https://www.ieee.org) - Institute of Electrical and Electronics Engineers
- [W3C](https://www.w3.org) - World Wide Web Consortium
- [OWASP](https://owasp.org) - Open Web Application Security Project
- [ISTQB](https://www.istqb.org) - International Software Testing Qualifications Board

### Standard Documents
- ISO/IEC/IEEE 29119 (Software Testing)
- ISO/IEC 25010 (Software Quality Models)
- ISO/IEC 12207 (Software Life Cycle Processes)
- ISO/IEC 27001 (Information Security Management)
- WCAG 2.1 (Web Content Accessibility Guidelines)

## Related Topics

- [Software Quality Models](software-quality-models.md)
- [Quality Frameworks](quality-frameworks.md)
- [Testing Strategy](../04-testing-strategy/README.md)

---

*Part of: [Foundations of Software Quality](README.md)*
