# Component Testing Examples

Component testing focuses on testing individual components in isolation, ensuring they work correctly with various inputs, props, and state changes.

## 🎯 What is Component Testing?

Component testing verifies that individual UI components behave correctly in isolation. It tests the component's logic, rendering, user interactions, and integration with external dependencies while mocking out complex dependencies.

## 📋 Examples Included

### React Component Testing

- React Testing Library examples
- Jest snapshot testing
- User interaction simulation
- Props and state testing
- Custom hooks testing

### Vue Component Testing

- Vue Test Utils examples
- Component lifecycle testing
- Event handling verification
- Slot and scoped slot testing

### Angular Component Testing

- Angular Testing Utilities
- Component DOM testing
- Service injection testing
- Input/Output testing

## 🛠️ Tools Demonstrated

- **React Testing Library**: Modern React component testing
- **Jest**: JavaScript testing framework
- **Vue Test Utils**: Vue.js component testing utilities
- **Angular Testing Utilities**: Angular component testing
- **Enzyme**: React component testing (legacy)

## 🚀 Quick Start

### React Component Testing

```bash
npm install @testing-library/react @testing-library/jest-dom
npm run test:components
```

### Vue Component Testing

```bash
npm install @vue/test-utils jest
npm run test:vue-components
```

### Angular Component Testing

```bash
ng test
```

## 📊 Component Testing Benefits

- **Isolation**: Test components independently
- **Fast Feedback**: Quick test execution
- **Regression Prevention**: Catch component-level bugs
- **Documentation**: Tests serve as component usage examples
- **Refactoring Safety**: Ensure component behavior during changes

## 🎯 Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does
2. **User-Centric Tests**: Test from user perspective
3. **Minimal Mocking**: Mock only external dependencies
4. **Accessible Testing**: Use accessible selectors
5. **Snapshot Testing**: Use sparingly for complex UI

---

_Component testing ensures your UI components work correctly in isolation, providing fast feedback and preventing regressions at the component level._
