# Screen Reader Testing Guide

This guide provides comprehensive manual testing scenarios for popular screen readers to ensure your application is accessible to users who rely on assistive technology.

## Overview

Screen readers announce page content and allow users to navigate using keyboard shortcuts. Automated tools cannot fully test screen reader compatibility, making manual testing essential.

### Supported Screen Readers

| Screen Reader | Platform  | Market Share | Free           |
| ------------- | --------- | ------------ | -------------- |
| JAWS          | Windows   | ~40%         | No ($95+/year) |
| NVDA          | Windows   | ~30%         | Yes            |
| VoiceOver     | macOS/iOS | ~20%         | Yes (built-in) |
| TalkBack      | Android   | ~5%          | Yes (built-in) |
| Narrator      | Windows   | ~5%          | Yes (built-in) |

**Recommendation**: Test with NVDA (Windows) and VoiceOver (macOS) as they are free and cover ~50% of users.

## NVDA Testing (Windows)

### Installation and Setup

1. Download from: https://www.nvaccess.org/download/
2. Install and restart computer
3. NVDA will auto-start (disable in preferences if needed)

### Essential NVDA Commands

| Action              | Command                       |
| ------------------- | ----------------------------- |
| Start/Stop NVDA     | `Ctrl + Alt + N`              |
| Toggle speech       | `Insert + S`                  |
| Read from cursor    | `Insert + Down Arrow`         |
| Read entire page    | `Insert + Down Arrow` (twice) |
| Stop speaking       | `Control`                     |
| Next heading        | `H`                           |
| Previous heading    | `Shift + H`                   |
| Next link           | `K`                           |
| Previous link       | `Shift + K`                   |
| Next button         | `B`                           |
| Previous button     | `Shift + B`                   |
| Next form field     | `F`                           |
| Previous form field | `Shift + F`                   |
| Next landmark       | `D`                           |
| Previous landmark   | `Shift + D`                   |
| Elements list       | `Insert + F7`                 |
| Next table          | `T`                           |
| Previous table      | `Shift + T`                   |
| Browse mode         | `Insert + Space`              |
| Forms mode          | `Insert + Space`              |

### NVDA Test Scenarios

#### Test 1: Page Structure and Landmarks

**Objective**: Verify page structure is properly announced

**Steps**:

1. Navigate to homepage
2. Press `Insert + Down Arrow` twice to hear entire page
3. Press `D` to navigate through landmarks
4. Press `Insert + F7` to open elements list, select "Landmarks"

**Expected Results**:

- [ ] Page title is announced when page loads
- [ ] Main heading (H1) is announced and meaningful
- [ ] Landmarks are present: banner, navigation, main, contentinfo
- [ ] Landmark labels are descriptive (not just "navigation")
- [ ] Main content landmark is announced
- [ ] All content is within appropriate landmarks

**Common Issues**:

- Missing or duplicate H1
- No landmarks defined
- Content outside landmarks
- Generic landmark labels

---

#### Test 2: Heading Hierarchy

**Objective**: Verify logical heading structure

**Steps**:

1. Navigate to page
2. Press `Insert + F7`, select "Headings"
3. Review heading list
4. Navigate using `H` key through document

**Expected Results**:

- [ ] H1 exists and is unique
- [ ] Headings follow logical order (H1 → H2 → H3, not H1 → H4)
- [ ] Headings accurately describe following content
- [ ] No heading levels are skipped
- [ ] Section headings are present for major sections

**Common Issues**:

- Missing H1
- Multiple H1s
- Skipped heading levels (H2 → H4)
- Decorative text styled as headings
- Headings out of order

---

#### Test 3: Link Text

**Objective**: Verify links have descriptive text

**Steps**:

1. Navigate to page
2. Press `Insert + F7`, select "Links"
3. Review link list out of context
4. Navigate using `K` key through links

**Expected Results**:

- [ ] All links have descriptive text
- [ ] Link purpose is clear from link text alone
- [ ] No "click here" or "read more" without context
- [ ] Duplicate link text goes to same destination
- [ ] Images in links have appropriate alt text

**Common Issues**:

- Generic link text ("click here", "more")
- URL as link text
- Empty links
- Icon links without text
- Ambiguous duplicate links

---

#### Test 4: Form Controls and Labels

**Objective**: Verify all form controls are properly labeled

**Steps**:

1. Navigate to form page
2. Press `F` to navigate through form fields
3. Fill out form using only keyboard and NVDA
4. Submit form and verify error handling

**Expected Results**:

- [ ] Each input has a clear, descriptive label
- [ ] Required fields are announced as required
- [ ] Field type is announced (text, email, password, etc.)
- [ ] Radio button groups are properly announced
- [ ] Checkboxes announce their state (checked/unchecked)
- [ ] Select dropdowns announce options
- [ ] Error messages are announced immediately
- [ ] Error messages are associated with fields

**Common Issues**:

- Placeholder text used instead of label
- Missing labels
- Generic labels ("input", "field")
- Required fields not announced
- Errors not announced
- Errors not associated with fields

---

#### Test 5: Images and Alternative Text

**Objective**: Verify images have appropriate alt text

**Steps**:

1. Navigate to page with images
2. Use arrow keys to navigate through content
3. Listen to how images are announced
4. Press `Insert + F7`, select "Links" (for linked images)

**Expected Results**:

- [ ] Content images have descriptive alt text
- [ ] Decorative images are ignored (alt="")
- [ ] Alt text doesn't repeat surrounding text
- [ ] Alt text describes image purpose, not "image of"
- [ ] Complex images (charts, diagrams) have extended descriptions
- [ ] Linked images describe link destination

**Common Issues**:

- Missing alt text
- Generic alt text ("image", "photo")
- File names as alt text ("IMG_1234.jpg")
- Decorative images with alt text
- Alt text starting with "image of"

---

#### Test 6: Tables

**Objective**: Verify data tables are properly structured

**Steps**:

1. Navigate to page with data table
2. Press `T` to jump to table
3. Use `Ctrl + Alt + Arrow Keys` to navigate cells
4. Listen to header announcements

**Expected Results**:

- [ ] Table is announced as a table
- [ ] Row and column headers are announced with cells
- [ ] Table has `<caption>` or `aria-label`
- [ ] Headers use `<th>` elements with `scope` attribute
- [ ] Complex tables have proper `id`/`headers` associations
- [ ] Layout tables are not announced as tables

**Common Issues**:

- Missing table headers
- Headers not marked with `<th>`
- Missing `scope` attribute
- Layout tables announced as data tables
- Missing table caption
- Complex tables without proper associations

---

#### Test 7: Modal Dialogs

**Objective**: Verify modal accessibility

**Steps**:

1. Open modal dialog
2. Verify focus moves to modal
3. Navigate modal with `Tab` key
4. Attempt to navigate outside modal
5. Close modal and verify focus return

**Expected Results**:

- [ ] Modal announces as dialog when opened
- [ ] Focus moves to modal (heading or close button)
- [ ] Modal has descriptive `aria-label` or `aria-labelledby`
- [ ] Tab key cycles only within modal
- [ ] Escape key closes modal
- [ ] Focus returns to trigger element when closed
- [ ] Background content is not accessible while modal is open

**Common Issues**:

- Focus not moved to modal
- Background content still accessible
- No keyboard trap within modal
- Escape doesn't close modal
- Focus not returned after closing

---

#### Test 8: Dynamic Content Updates

**Objective**: Verify dynamic content is announced

**Steps**:

1. Trigger content updates (load more, filters, etc.)
2. Listen for announcements
3. Navigate to new content

**Expected Results**:

- [ ] Status messages announced automatically
- [ ] Loading states announced
- [ ] Error messages announced immediately
- [ ] Success messages announced
- [ ] Live regions use appropriate `aria-live` values
- [ ] Updates don't interrupt current reading

**Common Issues**:

- No announcement of updates
- Missing `aria-live` regions
- Updates interrupt user
- Loading states not announced

---

## JAWS Testing (Windows)

### Essential JAWS Commands

| Action            | Command               |
| ----------------- | --------------------- |
| Start/Stop JAWS   | `Insert + J`          |
| Say all           | `Insert + Down Arrow` |
| Next heading      | `H`                   |
| Forms list        | `Insert + F5`         |
| Links list        | `Insert + F7`         |
| Headings list     | `Insert + F6`         |
| Virtual PC cursor | `NumPad Plus`         |

### JAWS-Specific Tests

Most tests are identical to NVDA, but note these JAWS-specific behaviors:

1. **Forms Mode**: JAWS automatically switches to forms mode in form fields
2. **Table Navigation**: `Ctrl + Alt + Arrow Keys` for cell navigation
3. **List Items**: JAWS announces list position (e.g., "item 1 of 5")

---

## VoiceOver Testing (macOS)

### Installation and Setup

VoiceOver is built into macOS.

**Enable**: `Cmd + F5` or System Preferences → Accessibility → VoiceOver

### Essential VoiceOver Commands

| Action               | Command                       |
| -------------------- | ----------------------------- |
| Start/Stop VoiceOver | `Cmd + F5`                    |
| VoiceOver modifier   | `Control + Option` (VO)       |
| Next item            | `VO + Right Arrow`            |
| Previous item        | `VO + Left Arrow`             |
| Interact with item   | `VO + Shift + Down Arrow`     |
| Stop interacting     | `VO + Shift + Up Arrow`       |
| Rotor                | `VO + U`                      |
| Next heading         | Rotor → Headings → Down Arrow |
| Web spots menu       | `VO + U`                      |
| Read all             | `VO + A`                      |

### VoiceOver Test Scenarios

#### Test 1: Basic Navigation

**Steps**:

1. Enable VoiceOver
2. Navigate to page
3. Use `VO + Right Arrow` to navigate through content
4. Listen to announcements

**Expected Results**:

- [ ] Page elements are announced logically
- [ ] Interactive elements are identified
- [ ] Content structure is clear

---

#### Test 2: Rotor Navigation

**Steps**:

1. Open page
2. Press `VO + U` to open rotor
3. Select different navigation methods (Headings, Links, Forms)
4. Navigate using arrow keys

**Expected Results**:

- [ ] All headings appear in rotor
- [ ] All links appear in rotor
- [ ] Form controls appear in rotor
- [ ] Landmarks appear in rotor

---

## VoiceOver Testing (iOS)

### Enable VoiceOver

Settings → Accessibility → VoiceOver → Toggle On

**Quick Toggle**: Triple-click home button (if enabled in settings)

### Essential iOS VoiceOver Gestures

| Action            | Gesture                      |
| ----------------- | ---------------------------- |
| Next item         | Swipe right                  |
| Previous item     | Swipe left                   |
| Activate          | Double tap                   |
| Rotor             | Rotate two fingers           |
| Read from current | Swipe down with 2 fingers    |
| Read all          | Swipe up with 2 fingers      |
| Scroll            | Swipe up/down with 3 fingers |

### iOS-Specific Tests

**Test Mobile Navigation**:

- [ ] All interactive elements are reachable via swipe
- [ ] Element labels are clear on mobile
- [ ] Gestures work correctly (pinch, swipe)
- [ ] Form inputs work with VoiceOver keyboard
- [ ] Modal dialogs trap focus correctly

---

## Common Accessibility Issues

### Critical Issues (Block users)

1. **Missing labels on form controls**
   - Impact: Users cannot identify input purpose
   - Fix: Add `<label>` or `aria-label`

2. **Keyboard traps**
   - Impact: Users cannot navigate away
   - Fix: Ensure Tab key can exit all components

3. **Missing alt text on images**
   - Impact: Users miss critical content
   - Fix: Add descriptive `alt` attribute

4. **Unlabeled buttons and links**
   - Impact: Users don't know what action will occur
   - Fix: Add visible text or `aria-label`

### Serious Issues (Difficult to use)

1. **Poor heading structure**
   - Impact: Users cannot efficiently navigate
   - Fix: Use proper heading hierarchy

2. **Missing landmarks**
   - Impact: Difficult to navigate page sections
   - Fix: Add ARIA landmarks or HTML5 semantic elements

3. **Unclear link text**
   - Impact: Users cannot determine link purpose
   - Fix: Use descriptive link text

4. **Inaccessible modals**
   - Impact: Users may lose context
   - Fix: Implement proper focus management

---

## Test Case Template

Use this template for systematic testing:

```markdown
### Test Case: [Feature Name]

**Page**: [URL or page description]
**Screen Reader**: [NVDA/JAWS/VoiceOver]
**Browser**: [Chrome/Firefox/Safari]
**Date**: [Date tested]
**Tester**: [Name]

#### Test Steps:

1. [Step]
2. [Step]
3. [Step]

#### Expected Behavior:

- [Expected result]
- [Expected result]

#### Actual Behavior:

- [Actual result]

#### Result:

- [ ] Pass
- [ ] Fail

#### Issues Found:

- [Description]
- Severity: [Critical/Serious/Moderate/Minor]
- WCAG: [Criterion number, e.g., 1.3.1]

#### Screenshots/Video:

[Attach evidence]

#### Notes:

[Additional observations]
```

---

## Testing Checklist

Use this checklist for comprehensive screen reader testing:

### Page Structure

- [ ] Page title is descriptive and unique
- [ ] Landmarks are present (header, nav, main, footer)
- [ ] Heading hierarchy is logical (H1 → H2 → H3)
- [ ] Skip links are present and functional
- [ ] Document language is specified

### Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Tab order matches visual order

### Content

- [ ] Headings describe following content
- [ ] Links have descriptive text
- [ ] Images have appropriate alt text
- [ ] Tables have headers and captions
- [ ] Lists are properly structured

### Forms

- [ ] All inputs have labels
- [ ] Required fields are indicated
- [ ] Error messages are clear and associated with fields
- [ ] Field types are appropriate
- [ ] Fieldsets group related inputs

### Dynamic Content

- [ ] Status messages are announced
- [ ] Live regions work correctly
- [ ] Loading states are announced
- [ ] Errors are announced immediately

### Custom Components

- [ ] Widgets have appropriate ARIA roles
- [ ] State changes are announced
- [ ] Keyboard interactions work correctly
- [ ] Modals trap focus appropriately

---

## Resources

### Official Documentation

- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [JAWS Documentation](https://www.freedomscientific.com/training/jaws/)
- [VoiceOver User Guide](https://help.apple.com/voiceover/mac/)

### Testing Guides

- [WebAIM: Testing with Screen Readers](https://webaim.org/articles/screenreader_testing/)
- [W3C: Using ARIA](https://www.w3.org/TR/using-aria/)
- [Deque: Screen Reader Support](https://dequeuniversity.com/screenreaders/)

### Practice Sites

- [NVDA Training](https://www.nvaccess.org/training/)
- [WebAIM: Screen Reader Demo](https://webaim.org/simulations/screenreader)

---

## Tips for Effective Testing

1. **Test frequently**: Don't wait until the end
2. **Test early**: Start with page structure
3. **Use real screen readers**: Simulators are not sufficient
4. **Test multiple browsers**: Screen readers behave differently per browser
5. **Learn screen reader shortcuts**: Efficient testing requires proficiency
6. **Document everything**: Record issues with steps to reproduce
7. **Involve real users**: Nothing beats testing with actual screen reader users
8. **Test on real devices**: Mobile screen readers differ from desktop

---

_Screen reader testing is essential for ensuring your application is truly accessible. Automated tools can only catch ~30% of accessibility issues - manual testing with screen readers is required for full WCAG compliance._
