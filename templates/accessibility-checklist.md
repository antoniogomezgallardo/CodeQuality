# Accessibility Checklist - WCAG 2.1 Level AA Compliance

## Document Information
- **Project Name**: [Project Name]
- **Component/Feature**: [Component/Feature Name]
- **Tested By**: [Name]
- **Date**: [YYYY-MM-DD]
- **WCAG Version**: 2.1
- **Conformance Level**: AA
- **Testing Tools Used**: [ ] axe DevTools [ ] WAVE [ ] Lighthouse [ ] NVDA [ ] JAWS [ ] Other: ___________

---

## Overview

This checklist ensures compliance with Web Content Accessibility Guidelines (WCAG) 2.1 Level A and AA success criteria, organized according to the four POUR principles: Perceivable, Operable, Understandable, and Robust.

**Conformance Levels:**
- **Level A**: Minimum level of accessibility (must meet)
- **Level AA**: Deals with common barriers for disabled users (must meet)
- **Level AAA**: Highest level of accessibility (optional, but recommended where possible)

---

## 1. Perceivable - Information and UI components must be presentable to users in ways they can perceive

### 1.1 Text Alternatives (Level A)

- [ ] **1.1.1** All images have appropriate alt text
  - [ ] Informative images have descriptive alt text
  - [ ] Decorative images use empty alt attribute (`alt=""`)
  - [ ] Complex images (charts, diagrams) have detailed descriptions
  - [ ] Images of text are avoided or have exact alt text
  - [ ] Functional images (buttons, links) describe their function

### 1.2 Time-based Media (Level A & AA)

- [ ] **1.2.1** Audio-only and video-only content has text alternatives or audio descriptions
- [ ] **1.2.2** Captions provided for all prerecorded audio in synchronized media (videos)
- [ ] **1.2.3** Audio description or text alternative for prerecorded video
- [ ] **1.2.4** Captions provided for all live audio content
- [ ] **1.2.5** Audio description provided for all prerecorded video content

### 1.3 Adaptable (Level A & AA)

- [ ] **1.3.1** Information, structure, and relationships can be programmatically determined
  - [ ] Semantic HTML elements used appropriately (nav, main, article, aside, header, footer)
  - [ ] Headings used in logical order (h1, h2, h3...)
  - [ ] Lists use proper list markup (ul, ol, dl)
  - [ ] Tables use proper table markup with th, thead, tbody
  - [ ] Forms use proper label associations
  - [ ] Related form inputs are grouped with fieldset/legend

- [ ] **1.3.2** Content maintains meaning when sequence is programmatically determined
  - [ ] Reading order makes sense when CSS is disabled
  - [ ] Tab order is logical and intuitive
  - [ ] Content structure is preserved without CSS

- [ ] **1.3.3** Instructions don't rely solely on sensory characteristics
  - [ ] Don't use only shape, size, position, orientation, or sound
  - [ ] Example: "Click the button on the right" should also identify the button by label

- [ ] **1.3.4** Content can be presented in portrait and landscape orientations
  - [ ] No content is locked to a single orientation unless essential

- [ ] **1.3.5** Purpose of input fields can be programmatically determined
  - [ ] Autocomplete attributes used appropriately (name, email, tel, etc.)

### 1.4 Distinguishable (Level A & AA)

- [ ] **1.4.1** Color is not the only visual means of conveying information
  - [ ] Links are distinguishable by more than color alone
  - [ ] Form errors indicated with icons/text, not just red color
  - [ ] Charts use patterns in addition to colors

- [ ] **1.4.2** User has control over audio that plays automatically
  - [ ] Auto-playing audio can be paused, stopped, or volume controlled
  - [ ] Audio that plays for more than 3 seconds has controls

- [ ] **1.4.3** Text has sufficient contrast ratio (Level AA)
  - [ ] Normal text (< 18pt): minimum 4.5:1 contrast ratio
  - [ ] Large text (≥ 18pt or 14pt bold): minimum 3:1 contrast ratio
  - [ ] UI components and graphical objects: minimum 3:1 contrast ratio
  - [ ] Contrast checked for all states (default, hover, focus, active, disabled)

- [ ] **1.4.4** Text can be resized up to 200% without loss of content or functionality
  - [ ] Tested at 200% zoom in browser
  - [ ] No horizontal scrolling required (except for tables and images)
  - [ ] All content remains visible and usable

- [ ] **1.4.5** Images of text are avoided except for logos and essential cases
  - [ ] Text presented as actual text, not images
  - [ ] If images of text used, they are essential or customizable

- [ ] **1.4.10** Content reflows without horizontal scrolling at 320px width
  - [ ] Tested at 400% zoom (equivalent to 320px width)
  - [ ] Content adapts without requiring 2-dimensional scrolling

- [ ] **1.4.11** Non-text contrast meets minimum requirements
  - [ ] UI components: 3:1 contrast against adjacent colors
  - [ ] Graphical objects: 3:1 contrast for meaningful parts
  - [ ] Focus indicators: 3:1 contrast against background

- [ ] **1.4.12** Text spacing can be adjusted without loss of functionality
  - [ ] Line height at least 1.5x font size
  - [ ] Paragraph spacing at least 2x font size
  - [ ] Letter spacing at least 0.12x font size
  - [ ] Word spacing at least 0.16x font size

- [ ] **1.4.13** Hover and focus content is dismissible, hoverable, and persistent
  - [ ] Additional content triggered by hover/focus can be dismissed
  - [ ] Hover content can be hovered over without disappearing
  - [ ] Content remains visible until dismissed or no longer relevant

---

## 2. Operable - UI components and navigation must be operable

### 2.1 Keyboard Accessible (Level A)

- [ ] **2.1.1** All functionality available via keyboard
  - [ ] All interactive elements are keyboard accessible
  - [ ] Custom controls have proper keyboard support
  - [ ] All actions possible with mouse are possible with keyboard

- [ ] **2.1.2** No keyboard traps
  - [ ] Focus can move away from all components using standard navigation
  - [ ] If special keys required, user is informed
  - [ ] Modal dialogs can be closed with keyboard

- [ ] **2.1.4** Keyboard shortcuts can be turned off or remapped (if single character)
  - [ ] Single-key shortcuts can be disabled or remapped
  - [ ] Single-key shortcuts only active when component has focus

### 2.2 Enough Time (Level A)

- [ ] **2.2.1** Timing is adjustable for time limits
  - [ ] User can turn off, adjust, or extend time limits
  - [ ] User warned before time expires and given at least 20 seconds to extend

- [ ] **2.2.2** Moving, blinking, scrolling content can be paused
  - [ ] Auto-playing carousels have pause button
  - [ ] Auto-updating content can be paused, stopped, or hidden
  - [ ] Applies to content that lasts more than 5 seconds

### 2.3 Seizures and Physical Reactions (Level A & AA)

- [ ] **2.3.1** No content flashes more than 3 times per second
  - [ ] No flashing content that could cause seizures
  - [ ] Animations are safe for users with vestibular disorders

### 2.4 Navigable (Level A & AA)

- [ ] **2.4.1** Bypass blocks mechanism provided
  - [ ] "Skip to main content" link available
  - [ ] Skip navigation links work correctly
  - [ ] ARIA landmarks used (banner, navigation, main, contentinfo)

- [ ] **2.4.2** Pages have descriptive titles
  - [ ] Each page has a unique, descriptive title element
  - [ ] Title describes page topic or purpose

- [ ] **2.4.3** Focus order is logical and meaningful
  - [ ] Tab order follows visual layout
  - [ ] Focus doesn't jump unexpectedly
  - [ ] Modal dialogs trap focus appropriately

- [ ] **2.4.4** Link purpose is clear from link text or context
  - [ ] Links are descriptive (not just "click here" or "read more")
  - [ ] Link text or aria-label indicates destination

- [ ] **2.4.5** Multiple ways to find pages (Level AA)
  - [ ] Site has navigation menu, search, sitemap, or table of contents
  - [ ] At least two methods to find pages

- [ ] **2.4.6** Headings and labels are descriptive (Level AA)
  - [ ] Headings clearly describe topic or purpose
  - [ ] Labels clearly describe form fields
  - [ ] Labels are not placeholder text

- [ ] **2.4.7** Focus indicator is visible (Level AA)
  - [ ] Keyboard focus is clearly visible on all interactive elements
  - [ ] Focus indicator has sufficient contrast (3:1 minimum)
  - [ ] Focus indicator is at least 2px thick or surrounds element

### 2.5 Input Modalities (Level A)

- [ ] **2.5.1** All multi-point or path-based gestures have single-pointer alternative
  - [ ] Pinch-to-zoom has alternative (buttons)
  - [ ] Swipe gestures have alternative (buttons/links)

- [ ] **2.5.2** Pointer cancellation - down-event not used to execute functions
  - [ ] Click events on up-event, not down-event
  - [ ] Allows users to move pointer away before release

- [ ] **2.5.3** Label in name - accessible name contains visible label text
  - [ ] aria-label contains the visible label text
  - [ ] Voice control users can activate controls by speaking visible label

- [ ] **2.5.4** Motion actuation can be disabled
  - [ ] Functionality triggered by motion has alternative
  - [ ] Settings to disable motion actuation

---

## 3. Understandable - Information and UI operation must be understandable

### 3.1 Readable (Level A & AA)

- [ ] **3.1.1** Language of page is programmatically determined
  - [ ] HTML lang attribute set correctly on html element
  - [ ] Example: `<html lang="en">`

- [ ] **3.1.2** Language of parts is programmatically determined (Level AA)
  - [ ] Passages in different languages marked with lang attribute
  - [ ] Example: `<span lang="es">Hola</span>`

### 3.2 Predictable (Level A & AA)

- [ ] **3.2.1** On focus doesn't trigger unexpected context changes
  - [ ] Forms don't auto-submit when field receives focus
  - [ ] Receiving focus doesn't change page or open new windows

- [ ] **3.2.2** On input doesn't trigger unexpected context changes
  - [ ] Forms don't auto-submit on input
  - [ ] Changing radio buttons or dropdowns doesn't change page
  - [ ] If auto-submit is necessary, user is informed in advance

- [ ] **3.2.3** Navigation is consistent across pages (Level AA)
  - [ ] Navigation menus in same relative order across site
  - [ ] Repeated components appear in same location

- [ ] **3.2.4** Components with same functionality are identified consistently (Level AA)
  - [ ] Same icons mean the same thing throughout site
  - [ ] Same labels used for same functions

### 3.3 Input Assistance (Level A & AA)

- [ ] **3.3.1** Form errors are identified clearly
  - [ ] Error messages identify which field has error
  - [ ] Errors are announced to screen readers
  - [ ] Error summary provided at top of form (if multiple errors)

- [ ] **3.3.2** Labels or instructions provided for user input
  - [ ] All form fields have visible labels
  - [ ] Required fields are clearly marked
  - [ ] Input format requirements explained
  - [ ] Instructions provided before form, not just in placeholders

- [ ] **3.3.3** Error suggestions provided when input error detected (Level AA)
  - [ ] Error messages suggest how to fix the error
  - [ ] Provide examples of correct format
  - [ ] Don't rely solely on validation messages

- [ ] **3.3.4** Error prevention for legal/financial/data transactions (Level AA)
  - [ ] Submissions are reversible, verified, or confirmed
  - [ ] Review step before final submission
  - [ ] Confirmation page or dialog

---

## 4. Robust - Content must be robust enough for assistive technologies

### 4.1 Compatible (Level A & AA)

- [ ] **4.1.1** HTML is well-formed and valid
  - [ ] No duplicate IDs on page
  - [ ] Elements properly nested
  - [ ] Start and end tags used correctly
  - [ ] HTML validated (warnings acceptable, errors should be fixed)

- [ ] **4.1.2** Name, role, value available for UI components
  - [ ] Custom controls have appropriate ARIA roles
  - [ ] Form controls have accessible names (labels)
  - [ ] Status messages announced to screen readers
  - [ ] Dynamic content updates announced appropriately

- [ ] **4.1.3** Status messages can be programmatically determined
  - [ ] Success messages use appropriate ARIA live regions
  - [ ] Loading states announced to screen readers
  - [ ] Error messages announced automatically
  - [ ] Use role="status", role="alert", or aria-live attributes

---

## 5. Automated Testing Tools

### 5.1 axe DevTools / axe-core

- [ ] Install axe DevTools browser extension or axe-core library
- [ ] Run axe scan on all key pages/components
- [ ] Review and fix all Critical and Serious issues
- [ ] Document Moderate and Minor issues for review
- [ ] Re-scan after fixes to verify resolution

**Test Results:**
- Critical Issues: [ ] 0 [ ] ___ found
- Serious Issues: [ ] 0 [ ] ___ found
- Moderate Issues: [ ] 0 [ ] ___ found
- Minor Issues: [ ] 0 [ ] ___ found

### 5.2 WAVE (Web Accessibility Evaluation Tool)

- [ ] Run WAVE browser extension on all pages
- [ ] Review all Errors (red icons)
- [ ] Review all Alerts (yellow icons)
- [ ] Check Contrast tab for all contrast errors
- [ ] Verify proper use of ARIA in Structure tab

**Test Results:**
- Errors: [ ] 0 [ ] ___ found
- Contrast Errors: [ ] 0 [ ] ___ found
- Alerts: [ ] 0 [ ] ___ found

### 5.3 Lighthouse Accessibility Audit

- [ ] Run Lighthouse audit in Chrome DevTools
- [ ] Achieve score of 90+ (100 preferred)
- [ ] Fix all identified accessibility issues
- [ ] Document any issues that can't be automatically detected

**Lighthouse Score:** _____ / 100

### 5.4 Additional Automated Tools

- [ ] **pa11y**: Automated testing in CI/CD pipeline
- [ ] **HTML Validator**: W3C Markup Validation Service
- [ ] **ANDI**: Accessibility testing bookmarklet
- [ ] **IBM Equal Access Checker**: Additional automated checks
- [ ] **Accessibility Insights**: Microsoft's automated and manual testing tool

---

## 6. Manual Testing Procedures

### 6.1 Keyboard Navigation Testing

- [ ] Disconnect mouse or don't use mouse during testing
- [ ] Tab through all interactive elements
  - [ ] All interactive elements receive visible focus
  - [ ] Tab order is logical (follows reading order)
  - [ ] No keyboard traps (can tab out of all components)
- [ ] Test all functionality with keyboard
  - [ ] Enter/Space activates buttons and links
  - [ ] Arrow keys work in custom controls (tabs, menus, sliders)
  - [ ] Escape closes modals and dropdowns
  - [ ] Home/End work in appropriate controls
- [ ] Test forms with keyboard only
  - [ ] Can complete entire form without mouse
  - [ ] Error messages accessible via keyboard
  - [ ] Can submit form with keyboard

### 6.2 Screen Magnification Testing

- [ ] Test at 200% browser zoom
  - [ ] All content visible and usable
  - [ ] No horizontal scrolling (except tables/images)
  - [ ] Text doesn't overlap or get cut off
- [ ] Test at 400% browser zoom
  - [ ] Content reflows appropriately
  - [ ] Functionality remains intact
  - [ ] Navigation still accessible

### 6.3 Mobile/Touch Device Testing

- [ ] Test on actual mobile devices (iOS and Android)
- [ ] Verify touch targets are at least 44x44 CSS pixels
- [ ] Test with screen reader (VoiceOver on iOS, TalkBack on Android)
- [ ] Verify zoom functionality works
- [ ] Test in both portrait and landscape orientations

### 6.4 Color and Contrast Testing

- [ ] Use color contrast analyzer tool for all text
- [ ] Test with grayscale filter or color blindness simulator
  - [ ] Information conveyed by color is also conveyed another way
  - [ ] Color-blind users can distinguish UI elements
- [ ] Verify focus indicators have sufficient contrast
- [ ] Check all states (default, hover, focus, active, disabled)

---

## 7. Screen Reader Testing

### 7.1 Screen Reader Setup

**Test with multiple screen readers:**
- [ ] NVDA (Windows, free) - Primary testing
- [ ] JAWS (Windows, commercial) - Secondary testing
- [ ] VoiceOver (macOS/iOS, built-in) - Mobile testing
- [ ] TalkBack (Android, built-in) - Mobile testing
- [ ] ORCA (Linux, free) - Optional

### 7.2 Screen Reader Testing Checklist

#### General Navigation
- [ ] All content can be accessed with screen reader
- [ ] Headings are announced and navigable
- [ ] Landmarks are announced and navigable
- [ ] Lists are announced as lists with item counts
- [ ] Tables are announced with row/column info

#### Images and Media
- [ ] All images have appropriate alt text read aloud
- [ ] Decorative images are ignored (empty alt)
- [ ] Complex images have detailed descriptions available
- [ ] Video captions are accessible

#### Forms
- [ ] All form fields have accessible labels announced
- [ ] Required fields indicated in announcement
- [ ] Field instructions read before entering field
- [ ] Error messages announced and associated with fields
- [ ] Fieldset/legend groups announced correctly
- [ ] Autocomplete suggestions announced

#### Interactive Elements
- [ ] Buttons announced as buttons with clear labels
- [ ] Links announced as links with descriptive text
- [ ] Current state of toggles/switches announced
- [ ] Expanded/collapsed state of accordions announced
- [ ] Selected state of tabs announced
- [ ] Disabled state announced

#### Dynamic Content
- [ ] Live regions announce updates appropriately
- [ ] Loading states announced
- [ ] Success/error messages announced automatically
- [ ] New content loaded via AJAX is announced
- [ ] Modal dialogs announced when opened

#### Custom Components
- [ ] Custom controls have appropriate ARIA roles
- [ ] States and properties announced correctly
- [ ] Keyboard instructions provided if non-standard
- [ ] Complex widgets (date pickers, comboboxes) usable

### 7.3 Screen Reader Testing Scenarios

- [ ] Complete a form from start to submission
- [ ] Navigate to specific content using headings
- [ ] Find content using landmark navigation
- [ ] Complete a purchase/transaction flow
- [ ] Read an article from start to finish
- [ ] Interact with all custom components

---

## 8. Specific Component Testing

### 8.1 Forms and Input Fields

- [ ] All fields have visible, persistent labels (not just placeholders)
- [ ] Labels properly associated with inputs (for/id or aria-labelledby)
- [ ] Required fields marked with asterisk AND text/aria-required
- [ ] Input format instructions provided before field
- [ ] Autocomplete attributes used for personal info fields
- [ ] Error messages specific and helpful
- [ ] Error summary at top of form (if multiple errors)
- [ ] Success messages announced to screen readers
- [ ] Multi-step forms indicate current step and total steps

### 8.2 Buttons and Links

- [ ] Buttons and links clearly distinguishable
- [ ] Button text describes action ("Save Changes" not "Submit")
- [ ] Link text describes destination (not "Click Here")
- [ ] Icon-only buttons have aria-label or visually-hidden text
- [ ] Disabled buttons have aria-disabled and visual indication
- [ ] Focus indicator visible on all buttons and links

### 8.3 Modals and Dialogs

- [ ] Modal opens with keyboard (Enter/Space)
- [ ] Focus moves to modal when opened
- [ ] Focus trapped within modal while open
- [ ] Modal can be closed with Escape key
- [ ] Modal can be closed with visible close button
- [ ] Focus returns to trigger element when closed
- [ ] Background content inert (aria-hidden or inert attribute)
- [ ] Modal has role="dialog" or role="alertdialog"
- [ ] Modal has aria-labelledby pointing to title

### 8.4 Menus and Dropdowns

- [ ] Keyboard accessible (Arrow keys, Enter, Escape)
- [ ] Expanded/collapsed state indicated (aria-expanded)
- [ ] Current selection indicated (aria-current or aria-selected)
- [ ] Submenus navigable with keyboard
- [ ] Focus managed appropriately
- [ ] Screen reader announces menu structure

### 8.5 Tabs

- [ ] Tab list has role="tablist"
- [ ] Tabs have role="tab"
- [ ] Tab panels have role="tabpanel"
- [ ] Arrow keys navigate between tabs
- [ ] Home/End keys go to first/last tab
- [ ] aria-selected indicates active tab
- [ ] Inactive tab panels hidden or aria-hidden="true"
- [ ] Tab panels have aria-labelledby pointing to tab

### 8.6 Accordions

- [ ] Keyboard accessible (Enter/Space to toggle)
- [ ] aria-expanded indicates state
- [ ] Collapsed panels hidden or aria-hidden="true"
- [ ] Heading buttons have descriptive labels
- [ ] Focus management when expanding/collapsing

### 8.7 Tables

- [ ] Tables used for tabular data only (not layout)
- [ ] Table has caption or aria-label
- [ ] Header cells use th element
- [ ] scope attribute used (col/row) for simple tables
- [ ] Complex tables use id/headers attributes
- [ ] No merged cells if possible, or properly marked up

### 8.8 Carousels and Sliders

- [ ] Carousel can be paused
- [ ] Previous/Next buttons keyboard accessible
- [ ] Current slide indicated (aria-current="true")
- [ ] Auto-rotation pauses on hover or focus
- [ ] Slide indicators keyboard accessible
- [ ] Sufficient time to read content before rotation

### 8.9 Videos and Audio

- [ ] Captions provided for all videos
- [ ] Captions accurate and synchronized
- [ ] Audio descriptions provided
- [ ] Player controls keyboard accessible
- [ ] Player controls clearly labeled
- [ ] Transcript provided for audio content

### 8.10 Charts and Data Visualizations

- [ ] Text alternative or data table provided
- [ ] Colors don't convey meaning alone (use patterns/labels)
- [ ] Interactive elements keyboard accessible
- [ ] Screen reader can access data points
- [ ] Long descriptions for complex visualizations

---

## 9. Color Contrast Requirements

### 9.1 Text Contrast Ratios

| Element Type | Minimum Ratio (AA) | Enhanced Ratio (AAA) |
|--------------|-------------------|---------------------|
| Normal text (< 18pt or < 14pt bold) | 4.5:1 | 7:1 |
| Large text (≥ 18pt or ≥ 14pt bold) | 3:1 | 4.5:1 |
| Incidental text (inactive, pure decoration) | No requirement | No requirement |

### 9.2 Non-Text Contrast Ratios

| Element Type | Minimum Ratio (AA) |
|--------------|-------------------|
| UI components (buttons, inputs, focus indicators) | 3:1 |
| Graphical objects (icons, charts, meaningful graphics) | 3:1 |
| Active UI components vs adjacent colors | 3:1 |
| UI component states (hover, focus, active) | 3:1 |

### 9.3 Contrast Testing

- [ ] Use WebAIM Contrast Checker or similar tool
- [ ] Test all color combinations used on site
- [ ] Test all states (default, hover, focus, active, disabled)
- [ ] Check focus indicators against all possible backgrounds
- [ ] Verify contrast of error messages and success messages
- [ ] Test link colors in body text

---

## 10. Focus Management

### 10.1 Focus Indicator Requirements

- [ ] Visible on all interactive elements
- [ ] Minimum 3:1 contrast ratio against background
- [ ] Not hidden or removed with CSS (outline: none without replacement)
- [ ] Thickness of at least 2 CSS pixels or outline around element
- [ ] Clearly distinguishable from non-focused state

### 10.2 Focus Order

- [ ] Focus order follows reading order (top to bottom, left to right)
- [ ] Focus doesn't jump unexpectedly between sections
- [ ] Skip links allow bypassing repetitive content
- [ ] Focus moves into modals when opened
- [ ] Focus trapped in modal until closed
- [ ] Focus returns to trigger after modal closes

### 10.3 Focus States to Test

- [ ] Default focus (no interaction)
- [ ] Keyboard focus (:focus)
- [ ] Mouse/touch focus
- [ ] Focus within (:focus-within for containers)
- [ ] Focus visible (:focus-visible for keyboard-only indication)

---

## 11. ARIA Usage

### 11.1 ARIA Roles

- [ ] Roles only used when semantic HTML insufficient
- [ ] Roles accurately describe component type
- [ ] No conflicting roles (e.g., button with role="link")
- [ ] Required owned elements present (e.g., tab requires tabpanel)

**Common roles to verify:**
- [ ] role="navigation" on main navigation
- [ ] role="main" on main content area (or use main element)
- [ ] role="banner" on site header (or use header element)
- [ ] role="contentinfo" on footer (or use footer element)
- [ ] role="button" on clickable divs/spans (or use button element)
- [ ] role="dialog" on modals
- [ ] role="alert" for important error messages
- [ ] role="status" for status updates

### 11.2 ARIA States and Properties

- [ ] aria-expanded on toggleable elements
- [ ] aria-selected on selectable items
- [ ] aria-current on current page/step
- [ ] aria-checked on checkboxes (if not input element)
- [ ] aria-disabled on disabled elements
- [ ] aria-hidden on decorative or duplicate content
- [ ] aria-label on elements without visible labels
- [ ] aria-labelledby for associating labels
- [ ] aria-describedby for additional descriptions
- [ ] aria-required on required form fields
- [ ] aria-invalid on fields with errors

### 11.3 ARIA Live Regions

- [ ] aria-live="polite" for non-critical updates
- [ ] aria-live="assertive" for critical alerts
- [ ] aria-atomic="true" to announce entire region
- [ ] role="status" for status messages (polite)
- [ ] role="alert" for error messages (assertive)
- [ ] Loading states announced appropriately

### 11.4 ARIA Best Practices

- [ ] First rule: Use native HTML when possible
- [ ] Don't override native semantics
- [ ] All interactive ARIA controls keyboard accessible
- [ ] Required states and properties present
- [ ] Values updated dynamically when state changes
- [ ] No redundant ARIA (e.g., aria-label on input with label)

---

## 12. Common Accessibility Issues

### 12.1 Critical Issues (Must Fix)

- [ ] Missing alt text on informative images
- [ ] Insufficient color contrast (< 4.5:1 for text)
- [ ] Keyboard traps
- [ ] Form fields without labels
- [ ] Missing skip navigation link
- [ ] Empty headings or links
- [ ] No visible focus indicator
- [ ] Missing lang attribute
- [ ] Duplicate IDs
- [ ] Auto-playing audio without controls

### 12.2 Serious Issues (Should Fix)

- [ ] Illogical heading order
- [ ] Non-descriptive link text ("click here")
- [ ] Placeholder as label
- [ ] Insufficient touch target size (< 44x44px)
- [ ] Error messages not associated with fields
- [ ] Redundant or unhelpful alt text ("image of...")
- [ ] Missing ARIA attributes on custom controls
- [ ] Poor color contrast on UI components
- [ ] Content that doesn't reflow at 400% zoom

### 12.3 Moderate Issues (Good to Fix)

- [ ] Inconsistent navigation across pages
- [ ] Missing page titles or non-unique titles
- [ ] Images of text (when actual text could be used)
- [ ] Time limits without ability to extend
- [ ] Missing breadcrumb navigation
- [ ] Ambiguous icon buttons without labels
- [ ] Missing field instructions for complex inputs

---

## 13. Testing Documentation

### 13.1 Issues Found

| # | Severity | WCAG Criterion | Issue Description | Location | Recommended Fix | Status |
|---|----------|----------------|-------------------|----------|-----------------|--------|
| 1 | Critical | 1.1.1 | | | | Open/Fixed |
| 2 | Serious | 1.4.3 | | | | Open/Fixed |
| 3 | Moderate | 2.4.4 | | | | Open/Fixed |

### 13.2 Browser/AT Testing Matrix

| Page/Feature | Chrome + NVDA | Firefox + NVDA | Safari + VO | Edge + JAWS | Mobile Safari + VO | Android + TalkBack |
|--------------|---------------|----------------|-------------|-------------|-------------------|-------------------|
| Homepage | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |
| Navigation | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |
| Forms | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |
| Checkout | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass | [ ] Pass |

### 13.3 Notes and Observations

**Positive Findings:**
- [List what's working well]

**Areas for Improvement:**
- [List areas that need work]

**Known Limitations:**
- [List any known limitations or third-party issues]

**Next Steps:**
- [List planned improvements or next testing phase]

---

## 14. Accessibility Statement

After completing this checklist, consider creating an accessibility statement for your website that includes:

- [ ] Commitment to accessibility
- [ ] Conformance level achieved (WCAG 2.1 Level AA)
- [ ] Date of last accessibility review
- [ ] Known limitations
- [ ] Contact information for accessibility feedback
- [ ] Alternative formats available
- [ ] Assistive technologies tested with

---

## 15. Resources and References

### Official Guidelines
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **WAI-ARIA**: https://www.w3.org/WAI/ARIA/apg/
- **Section 508**: https://www.section508.gov/

### Testing Tools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/
- **Lighthouse**: Chrome DevTools
- **Color Contrast Analyzer**: https://www.tpgi.com/color-contrast-checker/
- **NVDA Screen Reader**: https://www.nvaccess.org/

### Learning Resources
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **Inclusive Components**: https://inclusive-components.design/
- **Deque University**: https://dequeuniversity.com/

---

## Sign-off

**Tester Name**: ___________________________
**Date**: ___________________________
**Overall Status**: [ ] Pass [ ] Pass with Minor Issues [ ] Fail
**Conformance Level**: [ ] WCAG 2.1 Level A [ ] WCAG 2.1 Level AA [ ] WCAG 2.1 Level AAA

**Signature**: ___________________________

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Date] | [Name] | Initial version |
| | | | |
| | | | |
