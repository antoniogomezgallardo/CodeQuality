# Component Testing

## Purpose
Comprehensive guide to component testing—testing UI components in isolation to ensure they render correctly, handle interactions properly, and maintain expected behavior.

## Overview
Component testing:
- Tests individual UI components
- Focuses on user interactions
- Validates rendering and state
- Faster than E2E tests
- More realistic than unit tests

## What is Component Testing?

### Definition
Component testing verifies that individual UI components (React, Vue, Angular, etc.) work correctly in isolation, including rendering, user interactions, and state management.

### Characteristics

```
Component Tests:

Scope
├── Single UI component
├── Component tree (parent + children)
├── User interactions
└── Visual rendering

Environment
├── Real browser or jsdom
├── Component framework
├── Mock API calls
└── Simulated user events

Speed
├── Faster than E2E
├── Slower than unit tests
├── Hundreds of ms
└── Still suitable for CI/CD
```

## React Component Testing

### React Testing Library

```javascript
// Button.jsx
export function Button({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn"
    >
      {children}
    </button>
  );
}

// Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByText('Click Me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click Me</Button>);

    fireEvent.click(screen.getByText('Click Me'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should have disabled attribute when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);

    expect(screen.getByText('Click Me')).toBeDisabled();
  });
});
```

### Testing Forms

```javascript
// LoginForm.jsx
import { useState } from 'react';

export function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Password"
        />
      </div>

      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}

      <button type="submit">Login</button>
    </form>
  );
}

// LoginForm.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm Component', () => {
  it('should render form fields', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should call onSubmit with form data when valid', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should show error when fields are empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email and password are required'
    );
  });

  it('should update input values on change', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'user@example.com');

    expect(emailInput).toHaveValue('user@example.com');
  });
});
```

### Testing with API Calls

```javascript
// UserProfile.jsx
import { useState, useEffect } from 'react';

export function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div role="alert">Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}

// UserProfile.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { UserProfile } from './UserProfile';

const server = setupServer(
  rest.get('/api/users/:userId', (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.userId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserProfile Component', () => {
  it('should display loading state initially', () => {
    render(<UserProfile userId="1" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display user data after loading', async () => {
    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Role: admin')).toBeInTheDocument();
  });

  it('should display error when API fails', async () => {
    server.use(
      rest.get('/api/users/:userId', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch user');
    });
  });

  it('should refetch when userId changes', async () => {
    const { rerender } = render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    server.use(
      rest.get('/api/users/2', (req, res, ctx) => {
        return res(
          ctx.json({
            id: '2',
            name: 'Jane Doe',
            email: 'jane@example.com',
            role: 'user'
          })
        );
      })
    );

    rerender(<UserProfile userId="2" />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });
});
```

## Vue Component Testing

### Vue Test Utils

```vue
<!-- Button.vue -->
<template>
  <button
    :disabled="disabled"
    @click="handleClick"
    class="btn"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  methods: {
    handleClick(event) {
      this.$emit('click', event);
    }
  }
};
</script>
```

```javascript
// Button.spec.js
import { mount } from '@vue/test-utils';
import Button from './Button.vue';

describe('Button Component', () => {
  it('should render slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click Me'
      }
    });

    expect(wrapper.text()).toBe('Click Me');
  });

  it('should emit click event when clicked', async () => {
    const wrapper = mount(Button);

    await wrapper.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('should not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      }
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted()).not.toHaveProperty('click');
  });

  it('should have disabled attribute when disabled', () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      }
    });

    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});
```

### Testing Vuex Store Integration

```vue
<!-- Counter.vue -->
<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'Counter',
  computed: {
    ...mapState(['count'])
  },
  methods: {
    ...mapActions(['increment', 'decrement'])
  }
};
</script>
```

```javascript
// Counter.spec.js
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Counter from './Counter.vue';

describe('Counter Component', () => {
  let store;
  let actions;

  beforeEach(() => {
    actions = {
      increment: jest.fn(),
      decrement: jest.fn()
    };

    store = createStore({
      state: {
        count: 5
      },
      actions
    });
  });

  it('should display count from store', () => {
    const wrapper = mount(Counter, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.text()).toContain('Count: 5');
  });

  it('should call increment action on button click', async () => {
    const wrapper = mount(Counter, {
      global: {
        plugins: [store]
      }
    });

    await wrapper.find('button').trigger('click');

    expect(actions.increment).toHaveBeenCalled();
  });

  it('should call decrement action on button click', async () => {
    const wrapper = mount(Counter, {
      global: {
        plugins: [store]
      }
    });

    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');

    expect(actions.decrement).toHaveBeenCalled();
  });
});
```

## Angular Component Testing

### Angular Testing Module

```typescript
// button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `
    <button
      [disabled]="disabled"
      (click)="handleClick()"
      class="btn"
    >
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() disabled = false;
  @Output() onClick = new EventEmitter<void>();

  handleClick() {
    this.onClick.emit();
  }
}

// button.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit onClick event when clicked', () => {
    spyOn(component.onClick, 'emit');

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(component.onClick.emit).toHaveBeenCalled();
  });

  it('should not emit onClick when disabled', () => {
    spyOn(component.onClick, 'emit');
    component.disabled = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(component.onClick.emit).not.toHaveBeenCalled();
  });

  it('should have disabled attribute when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });
});
```

## Cypress Component Testing

```javascript
// Button.cy.jsx
import Button from './Button';

describe('Button Component', () => {
  it('should render and handle click', () => {
    const onClickSpy = cy.spy().as('onClickSpy');

    cy.mount(<Button onClick={onClickSpy}>Click Me</Button>);

    cy.contains('Click Me').should('be.visible');
    cy.contains('Click Me').click();
    cy.get('@onClickSpy').should('have.been.calledOnce');
  });

  it('should be disabled when disabled prop is true', () => {
    cy.mount(<Button disabled>Click Me</Button>);

    cy.contains('Click Me').should('be.disabled');
  });

  it('should apply custom class', () => {
    cy.mount(<Button className="custom-btn">Click Me</Button>);

    cy.contains('Click Me').should('have.class', 'custom-btn');
  });
});
```

## Testing Component State

```javascript
// Counter.jsx
import { useState } from 'react';

export function Counter({ initialCount = 0, min = 0, max = 10 }) {
  const [count, setCount] = useState(initialCount);

  const increment = () => {
    if (count < max) {
      setCount(count + 1);
    }
  };

  const decrement = () => {
    if (count > min) {
      setCount(count - 1);
    }
  };

  const reset = () => {
    setCount(initialCount);
  };

  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={decrement} disabled={count <= min}>
        -
      </button>
      <button onClick={increment} disabled={count >= max}>
        +
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// Counter.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter Component State', () => {
  it('should start with initial count', () => {
    render(<Counter initialCount={5} />);

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 5');
  });

  it('should increment count', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} />);

    await user.click(screen.getByText('+'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
  });

  it('should decrement count', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);

    await user.click(screen.getByText('-'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 4');
  });

  it('should not increment beyond max', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={10} max={10} />);

    await user.click(screen.getByText('+'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 10');
    expect(screen.getByText('+')).toBeDisabled();
  });

  it('should not decrement below min', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} min={0} />);

    await user.click(screen.getByText('-'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
    expect(screen.getByText('-')).toBeDisabled();
  });

  it('should reset to initial count', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);

    await user.click(screen.getByText('+'));
    await user.click(screen.getByText('+'));
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 7');

    await user.click(screen.getByText('Reset'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 5');
  });
});
```

## Accessibility Testing

```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Button onClick={() => {}}>Click Me</Button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible name', () => {
    render(<Button>Submit Form</Button>);

    expect(screen.getByRole('button', { name: 'Submit Form' }))
      .toBeInTheDocument();
  });

  it('should indicate disabled state', () => {
    render(<Button disabled>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
```

## Visual Regression Testing

```javascript
// With Storybook and Chromatic
// Button.stories.jsx
export default {
  title: 'Components/Button',
  component: Button
};

export const Primary = () => <Button>Primary Button</Button>;
export const Disabled = () => <Button disabled>Disabled Button</Button>;
export const WithIcon = () => (
  <Button>
    <Icon name="check" /> With Icon
  </Button>
);

// With Percy
import { render } from '@testing-library/react';
import percySnapshot from '@percy/playwright';

it('should match visual snapshot', async () => {
  const { container } = render(<Button>Click Me</Button>);
  await percySnapshot('Button - Default');
});
```

## Best Practices

### 1. Query Priority

```javascript
// ✅ Accessible to everyone
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email address')
screen.getByPlaceholderText('Enter email')

// ⚠️ Use only if no better option
screen.getByTestId('submit-button')

// ❌ Avoid - implementation details
screen.getByClassName('btn-primary')
container.querySelector('.submit-button')
```

### 2. User-Centric Testing

```javascript
// ✅ Test like a user
it('should allow user to submit form', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: 'Login' }));

  expect(screen.getByText('Welcome')).toBeInTheDocument();
});

// ❌ Avoid implementation testing
it('should update state on input', () => {
  const { result } = renderHook(() => useState(''));
  act(() => result.current[1]('test'));
  expect(result.current[0]).toBe('test');
});
```

### 3. Avoid Testing Implementation Details

```javascript
// ❌ Testing internal state
it('should set loading state', () => {
  const { result } = renderComponent();
  expect(result.state.isLoading).toBe(false);
});

// ✅ Test user-visible behavior
it('should show loading indicator', () => {
  render(<Component />);
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

## Common Pitfalls

```javascript
// ❌ Don't use waitFor for everything
await waitFor(() => {
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

// ✅ Use findBy for async elements
expect(await screen.findByText('Hello')).toBeInTheDocument();

// ❌ Don't query before rendering completes
render(<Component />);
expect(screen.getByText('Loaded')).toBeInTheDocument(); // May fail

// ✅ Wait for async rendering
render(<Component />);
await screen.findByText('Loaded'); // Waits for element

// ❌ Don't use container queries
const { container } = render(<Component />);
const button = container.querySelector('.btn');

// ✅ Use accessible queries
const button = screen.getByRole('button');
```

## Checklist

### Component Test Quality Checklist

**Test Design:**
- [ ] Tests user-visible behavior
- [ ] Uses accessible queries
- [ ] Simulates real user interactions
- [ ] Tests different component states
- [ ] Tests error conditions

**Coverage:**
- [ ] Rendering tested
- [ ] User interactions tested
- [ ] State changes verified
- [ ] Props variations tested
- [ ] Accessibility validated

**Best Practices:**
- [ ] No implementation details tested
- [ ] Proper async handling
- [ ] Clear test names
- [ ] Isolated tests
- [ ] Proper cleanup

## References

### Documentation
- [React Testing Library](https://testing-library.com/react)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Angular Testing](https://angular.io/guide/testing)
- [Cypress Component Testing](https://docs.cypress.io/guides/component-testing/overview)

### Tools
- **React**: React Testing Library, Enzyme (legacy)
- **Vue**: Vue Test Utils, Vue Testing Library
- **Angular**: TestBed, Jasmine, Karma
- **Cross-framework**: Cypress, Playwright Component Testing

## Related Topics

- [Unit Testing](unit-testing.md)
- [E2E Testing](e2e-testing.md)
- [Accessibility Testing](../06-quality-attributes/accessibility.md)
- [Visual Regression Testing](visual-regression-testing.md)

---

*Part of: [Test Levels](README.md)*
