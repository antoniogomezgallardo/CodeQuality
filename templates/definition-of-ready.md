# Definition of Ready (DoR) Template

## User Story Information

**Story ID:** [e.g., US-123]
**Story Title:** [Brief, descriptive title]
**Sprint:** [Sprint number or name]
**Epic:** [Parent epic, if applicable]

---

## Story Details

### User Story Statement

```
As a [type of user]
I want [goal/desire]
So that [benefit/value]
```

### Description

[Detailed description of what needs to be built and why it matters]

---

## Definition of Ready Checklist

### ✅ Clarity and Understanding

- [ ] **User story follows INVEST criteria**
  - [ ] Independent (can be developed separately)
  - [ ] Negotiable (details can be discussed)
  - [ ] Valuable (delivers clear user/business value)
  - [ ] Estimable (team can estimate effort)
  - [ ] Small (can be completed in one sprint)
  - [ ] Testable (clear acceptance criteria exist)

- [ ] **Story is clearly written and understandable**
  - [ ] Uses clear, unambiguous language
  - [ ] Free from technical jargon (unless necessary)
  - [ ] Describes the "what" and "why", not the "how"

- [ ] **All team members understand the story**
  - [ ] Story has been discussed in refinement
  - [ ] Questions have been answered
  - [ ] Ambiguities have been resolved

### ✅ Acceptance Criteria

- [ ] **Acceptance criteria are defined**
  - [ ] Written in Given-When-Then format (BDD) OR
  - [ ] Written as clear, verifiable conditions
  - [ ] Cover both happy path and edge cases
  - [ ] Include negative test scenarios

- [ ] **Acceptance criteria are complete**
  - [ ] Functional requirements covered
  - [ ] Non-functional requirements specified (performance, security, etc.)
  - [ ] UI/UX requirements defined (if applicable)
  - [ ] Cross-browser/device requirements specified (if applicable)

- [ ] **Acceptance criteria are testable**
  - [ ] Each criterion can be verified
  - [ ] Test data requirements are clear
  - [ ] Expected outcomes are specific

### ✅ Dependencies

- [ ] **External dependencies identified**
  - [ ] Third-party APIs or services
  - [ ] External teams or stakeholders
  - [ ] Infrastructure requirements
  - [ ] Data dependencies

- [ ] **Internal dependencies resolved**
  - [ ] Dependent stories completed or in progress
  - [ ] Required technical components available
  - [ ] No blocking issues

- [ ] **Dependency timeline acceptable**
  - [ ] Dependencies will be available when needed
  - [ ] Risk mitigation plans exist for critical dependencies

### ✅ Technical Requirements

- [ ] **Technical approach discussed**
  - [ ] Architecture/design reviewed
  - [ ] Technical feasibility confirmed
  - [ ] Potential technical risks identified
  - [ ] Technology choices agreed upon

- [ ] **API/Integration contracts defined**
  - [ ] Request/response formats specified
  - [ ] Error handling defined
  - [ ] Authentication/authorization requirements clear

- [ ] **Performance requirements specified**
  - [ ] Response time targets
  - [ ] Throughput requirements
  - [ ] Scalability considerations
  - [ ] Resource constraints

- [ ] **Security requirements identified**
  - [ ] Authentication/authorization needs
  - [ ] Data encryption requirements
  - [ ] OWASP compliance considerations
  - [ ] Privacy/GDPR requirements

### ✅ Design and UX

- [ ] **UI/UX design completed** (if applicable)
  - [ ] Wireframes/mockups available
  - [ ] Design system components identified
  - [ ] Responsive design considerations
  - [ ] Accessibility requirements (WCAG 2.1)

- [ ] **User flows documented**
  - [ ] Happy path defined
  - [ ] Error states designed
  - [ ] Edge cases considered

- [ ] **Design assets available**
  - [ ] Images, icons ready
  - [ ] Copy/content finalized
  - [ ] Design specs accessible

### ✅ Estimation

- [ ] **Story is estimated**
  - [ ] Team has provided story points/effort estimate
  - [ ] Estimate reflects true complexity
  - [ ] Estimate includes testing time
  - [ ] Estimate includes review/documentation time

- [ ] **Story is appropriately sized**
  - [ ] Can be completed within one sprint
  - [ ] If too large, decomposition plan exists
  - [ ] Includes buffer for unknowns

### ✅ Testing Strategy

- [ ] **Test approach defined**
  - [ ] Unit test requirements
  - [ ] Integration test requirements
  - [ ] E2E test requirements
  - [ ] Manual test scenarios

- [ ] **Test data requirements identified**
  - [ ] Test data available or can be created
  - [ ] Test environment requirements
  - [ ] Test user accounts/permissions

- [ ] **Quality gates defined**
  - [ ] Code coverage targets
  - [ ] Performance benchmarks
  - [ ] Security scan requirements

### ✅ Documentation

- [ ] **Technical documentation needs identified**
  - [ ] API documentation requirements
  - [ ] Code comments expectations
  - [ ] Architecture decision records (if needed)

- [ ] **User documentation requirements**
  - [ ] User guides (if applicable)
  - [ ] Help text/tooltips
  - [ ] Release notes content

### ✅ Stakeholder Alignment

- [ ] **Product Owner approval**
  - [ ] Story reviewed and approved
  - [ ] Priority confirmed
  - [ ] Value clearly articulated

- [ ] **Stakeholder input gathered**
  - [ ] Key stakeholders consulted
  - [ ] Concerns addressed
  - [ ] Expectations aligned

### ✅ Compliance and Risk

- [ ] **Compliance requirements identified**
  - [ ] Legal/regulatory requirements
  - [ ] Data protection (GDPR, CCPA, etc.)
  - [ ] Industry standards (PCI, HIPAA, etc.)
  - [ ] Audit trail requirements

- [ ] **Risks identified and mitigated**
  - [ ] Technical risks documented
  - [ ] Business risks assessed
  - [ ] Mitigation strategies defined

---

## Additional Context

### Related Stories/Epics

- [List related user stories]
- [Reference parent epic]
- [Note any follow-up stories]

### Assumptions

- [List any assumptions made]
- [Document constraints]
- [Note any temporary solutions]

### Out of Scope

- [Clearly define what is NOT included]
- [List features for future iterations]
- [Document deferred requirements]

### Reference Materials

- [ ] Design files: [Link]
- [ ] Technical specs: [Link]
- [ ] API documentation: [Link]
- [ ] Business requirements: [Link]
- [ ] Relevant research: [Link]

---

## DoR Sign-off

### Team Review

- [ ] **Reviewed in refinement meeting**
  - Date: [Date]
  - Attendees: [List]

- [ ] **Team agrees story is ready**
  - [ ] Developers ready to implement
  - [ ] Testers ready to verify
  - [ ] No blocking questions remain

### Product Owner Approval

- [ ] **Product Owner confirms ready for sprint**
  - Approved by: [Name]
  - Date: [Date]
  - Priority: [High/Medium/Low]

---

## Notes and Comments

[Space for additional notes, clarifications, or discussion points]

---

## Checklist Summary

**Total Criteria:** [Count]
**Criteria Met:** [Count]
**Readiness Score:** [Met/Total = %]

**Status:**

- ✅ READY - All critical criteria met (>90%)
- ⚠️ NEARLY READY - Most criteria met (70-90%), minor items pending
- ❌ NOT READY - Significant gaps remain (<70%)

---

## Version History

| Version | Date   | Author | Changes                |
| ------- | ------ | ------ | ---------------------- |
| 1.0     | [Date] | [Name] | Initial DoR assessment |

---

## DoR Variants

### For Bugs/Defects

Additional criteria for defect stories:

- [ ] Bug is reproducible
- [ ] Steps to reproduce documented
- [ ] Expected vs actual behavior clear
- [ ] Severity/priority assigned
- [ ] Screenshots/logs attached
- [ ] Environment details provided
- [ ] Root cause analyzed (if known)

### For Technical Debt

Additional criteria for technical debt stories:

- [ ] Current pain points documented
- [ ] Business impact quantified
- [ ] Refactoring approach outlined
- [ ] Risk of not addressing assessed
- [ ] Test coverage strategy defined
- [ ] Rollback plan exists

### For Spikes/Research

Additional criteria for spike stories:

- [ ] Research questions clearly defined
- [ ] Success criteria established
- [ ] Time-boxed (typically 1-2 days)
- [ ] Expected deliverables specified
- [ ] Decision criteria outlined
- [ ] Follow-up action plan

---

_This template should be customized based on your team's specific needs and context._
