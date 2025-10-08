/**
 * Chromatic Visual Testing with Storybook
 *
 * This file demonstrates production-ready visual testing patterns using Chromatic
 * with Storybook. Chromatic provides automated visual regression testing specifically
 * designed for Storybook components with support for interaction testing.
 *
 * Prerequisites:
 * - Storybook 7+ installed and configured
 * - Chromatic account and CHROMATIC_PROJECT_TOKEN environment variable set
 * - chromatic package installed
 *
 * Run with: npm run chromatic
 * Or: npx chromatic --project-token=<your-project-token>
 *
 * @see https://www.chromatic.com/docs/
 */

import React, { useState } from 'react';

/**
 * Example Button Component
 * In production, this would be imported from your component library
 */
const Button = ({ variant = 'primary', size = 'medium', disabled = false, children, onClick }) => {
  const baseStyles = {
    padding: size === 'small' ? '8px 16px' : size === 'large' ? '16px 32px' : '12px 24px',
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontWeight: 600,
    transition: 'all 0.2s ease'
  };

  const variantStyles = {
    primary: { backgroundColor: '#007bff', color: '#ffffff' },
    secondary: { backgroundColor: '#6c757d', color: '#ffffff' },
    success: { backgroundColor: '#28a745', color: '#ffffff' },
    danger: { backgroundColor: '#dc3545', color: '#ffffff' },
    outline: { backgroundColor: 'transparent', color: '#007bff', border: '2px solid #007bff' }
  };

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

/**
 * Example Card Component
 */
const Card = ({ title, description, imageSrc, variant = 'default' }) => {
  const cardStyles = {
    default: { border: '1px solid #ddd', backgroundColor: '#fff' },
    elevated: { border: 'none', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    outlined: { border: '2px solid #007bff', backgroundColor: '#fff' }
  };

  return (
    <div style={{ ...cardStyles[variant], borderRadius: '8px', overflow: 'hidden', maxWidth: '400px' }}>
      {imageSrc && (
        <img src={imageSrc} alt={title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
      )}
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#333' }}>{title}</h3>
        <p style={{ margin: 0, color: '#666', lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  );
};

/**
 * Example Form Input Component
 */
const Input = ({ label, type = 'text', error, success, disabled = false, placeholder }) => {
  const [value, setValue] = useState('');

  const getBorderColor = () => {
    if (error) return '#dc3545';
    if (success) return '#28a745';
    return '#ced4da';
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          border: `2px solid ${getBorderColor()}`,
          borderRadius: '4px',
          fontSize: '16px',
          outline: 'none',
          opacity: disabled ? 0.6 : 1
        }}
      />
      {error && <span style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px', display: 'block' }}>{error}</span>}
      {success && <span style={{ color: '#28a745', fontSize: '14px', marginTop: '4px', display: 'block' }}>{success}</span>}
    </div>
  );
};

/**
 * Default export required by Storybook
 */
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    // Chromatic configuration for this component
    chromatic: {
      // Delay before taking snapshot (milliseconds)
      delay: 300,

      // Disable animations for consistent snapshots
      disableSnapshot: false,

      // Viewports to test
      viewports: [320, 768, 1200]
    },
    // Additional Storybook parameters
    layout: 'centered'
  },
  // Define arg types for better documentation and controls
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'outline']
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large']
    },
    disabled: {
      control: 'boolean'
    }
  }
};

/**
 * Story 1: Default Button State
 */
export const Primary = {
  args: {
    variant: 'primary',
    size: 'medium',
    children: 'Primary Button'
  }
};

/**
 * Story 2: All Button Variants
 * Demonstrates multiple variants in a single snapshot
 */
export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
  parameters: {
    chromatic: {
      // Test at multiple viewports to ensure wrapping works correctly
      viewports: [375, 768, 1200]
    }
  }
};

/**
 * Story 3: All Button Sizes
 */
export const AllSizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  )
};

/**
 * Story 4: Disabled State
 */
export const Disabled = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button'
  }
};

/**
 * Story 5: Button with Interaction Testing
 * Uses Storybook's play function to test hover and focus states
 */
export const InteractionStates = {
  render: () => <Button variant="primary">Hover or Focus Me</Button>,
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/testing-library');
    const canvas = within(canvasElement);

    // Find the button
    const button = canvas.getByRole('button');

    // Test hover state
    await userEvent.hover(button);

    // Wait for hover effects
    await new Promise(resolve => setTimeout(resolve, 200));

    // Test focus state
    await userEvent.tab();
  },
  parameters: {
    chromatic: {
      // Increase delay to capture interaction state
      delay: 500
    }
  }
};

/**
 * Story 6: Dark Mode Theme
 */
export const DarkMode = {
  render: () => (
    <div style={{ backgroundColor: '#1a1a1a', padding: '32px', borderRadius: '8px' }}>
      <Button variant="primary" style={{ backgroundColor: '#0d6efd' }}>Dark Mode Button</Button>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
};

/**
 * Card Component Stories
 */
export const CardStories = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    chromatic: {
      viewports: [375, 768, 1200]
    }
  }
};

/**
 * Card Story: Default Card
 */
export const DefaultCard = {
  render: () => (
    <Card
      title="Sample Card"
      description="This is a sample card component with default styling."
      imageSrc="https://via.placeholder.com/400x200"
    />
  )
};

/**
 * Card Story: All Card Variants
 */
export const AllCardVariants = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1200px' }}>
      <Card
        variant="default"
        title="Default Card"
        description="This card uses default styling with a simple border."
        imageSrc="https://via.placeholder.com/400x200"
      />
      <Card
        variant="elevated"
        title="Elevated Card"
        description="This card has an elevated appearance with shadow."
        imageSrc="https://via.placeholder.com/400x200"
      />
      <Card
        variant="outlined"
        title="Outlined Card"
        description="This card has a prominent colored outline."
        imageSrc="https://via.placeholder.com/400x200"
      />
    </div>
  ),
  parameters: {
    chromatic: {
      // Test responsive grid layout
      viewports: [768, 1200, 1920]
    }
  }
};

/**
 * Card Story: Card without Image
 */
export const CardWithoutImage = {
  render: () => (
    <Card
      title="Text-Only Card"
      description="This card demonstrates the layout when no image is provided."
    />
  )
};

/**
 * Form Input Stories
 */
export const InputStories = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    chromatic: {
      viewports: [375, 768]
    }
  }
};

/**
 * Input Story: Default Input
 */
export const DefaultInput = {
  render: () => (
    <div style={{ width: '400px' }}>
      <Input label="Email Address" type="email" placeholder="Enter your email" />
    </div>
  )
};

/**
 * Input Story: All Input States
 */
export const AllInputStates = {
  render: () => (
    <div style={{ width: '400px' }}>
      <Input label="Default Input" placeholder="Enter text" />
      <Input label="Error State" error="This field is required" placeholder="Enter text" />
      <Input label="Success State" success="Looks good!" placeholder="Enter text" />
      <Input label="Disabled State" disabled placeholder="Cannot edit" />
    </div>
  )
};

/**
 * Input Story: Input with Interaction
 */
export const InputWithFocus = {
  render: () => (
    <div style={{ width: '400px' }}>
      <Input label="Focus Me" placeholder="Click to focus" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/testing-library');
    const canvas = within(canvasElement);

    // Find and focus the input
    const input = canvas.getByPlaceholderText('Click to focus');
    await userEvent.click(input);

    // Type some text
    await userEvent.type(input, 'Test input');
  },
  parameters: {
    chromatic: {
      delay: 500
    }
  }
};

/**
 * Complex Component Story: Login Form
 * Demonstrates testing a complete form component
 */
export const LoginForm = {
  title: 'Components/Forms/LoginForm',
  render: () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setTimeout(() => setIsSubmitting(false), 2000);
    };

    return (
      <div style={{
        width: '400px',
        padding: '32px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff'
      }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Password" type="password" placeholder="Enter password" />
          <Button
            variant="primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '16px' }}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    );
  },
  parameters: {
    chromatic: {
      viewports: [375, 768]
    }
  }
};

/**
 * Complex Story: Login Form with Validation Errors
 */
export const LoginFormWithErrors = {
  title: 'Components/Forms/LoginForm',
  render: () => (
    <div style={{
      width: '400px',
      padding: '32px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <form>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error="Please enter a valid email address"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          error="Password must be at least 8 characters"
        />
        <Button variant="primary" style={{ width: '100%', marginTop: '16px' }}>
          Login
        </Button>
      </form>
    </div>
  )
};

/**
 * Responsive Layout Story
 * Tests component behavior across different viewport sizes
 */
export const ResponsiveLayout = {
  title: 'Layouts/Dashboard',
  render: () => (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <header style={{
        backgroundColor: '#fff',
        padding: '16px',
        marginBottom: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <Card
          variant="elevated"
          title="Total Users"
          description="1,234 active users this month"
        />
        <Card
          variant="elevated"
          title="Revenue"
          description="$45,678 in sales this month"
        />
        <Card
          variant="elevated"
          title="Conversions"
          description="23% conversion rate this month"
        />
      </div>
    </div>
  ),
  parameters: {
    chromatic: {
      // Test how layout adapts to different screen sizes
      viewports: [375, 768, 1024, 1920]
    },
    layout: 'fullscreen'
  }
};

/**
 * Theme Variations Story
 * Tests component across light and dark themes
 */
export const ThemeVariations = {
  title: 'Themes/Comparison',
  render: () => (
    <div style={{ display: 'flex', gap: '32px' }}>
      {/* Light Theme */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '24px' }}>
        <h3>Light Theme</h3>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary" style={{ marginLeft: '8px' }}>Secondary</Button>
        <div style={{ marginTop: '16px' }}>
          <Card
            variant="elevated"
            title="Light Theme Card"
            description="This card is rendered in light theme"
          />
        </div>
      </div>

      {/* Dark Theme */}
      <div style={{ flex: 1, backgroundColor: '#1a1a1a', padding: '24px' }}>
        <h3 style={{ color: '#fff' }}>Dark Theme</h3>
        <Button variant="primary" style={{ backgroundColor: '#0d6efd' }}>Primary</Button>
        <Button variant="secondary" style={{ marginLeft: '8px', backgroundColor: '#6c757d' }}>Secondary</Button>
        <div style={{ marginTop: '16px' }}>
          <Card
            variant="elevated"
            title="Dark Theme Card"
            description="This card is rendered in dark theme"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    chromatic: {
      viewports: [1200]
    },
    layout: 'fullscreen'
  }
};

/**
 * Pseudo States Story
 * Tests hover, focus, and active states using Storybook's play function
 */
export const PseudoStates = {
  title: 'Components/Button/PseudoStates',
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button variant="primary" data-testid="hover-button">Hover</Button>
      <Button variant="secondary" data-testid="focus-button">Focus</Button>
      <Button variant="success" data-testid="active-button">Active</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/testing-library');
    const canvas = within(canvasElement);

    // Hover on first button
    const hoverButton = canvas.getByTestId('hover-button');
    await userEvent.hover(hoverButton);

    // Wait for hover effect
    await new Promise(resolve => setTimeout(resolve, 200));
  },
  parameters: {
    chromatic: {
      delay: 500
    }
  }
};

/**
 * Chromatic Configuration Tips:
 *
 * 1. Use chromatic.delay to wait for animations/transitions
 * 2. Use chromatic.viewports to test responsive behavior
 * 3. Use chromatic.disableSnapshot to skip certain stories
 * 4. Use play functions to test interactive states
 * 5. Name stories descriptively for easy identification in Chromatic UI
 * 6. Group related stories under common title prefixes
 * 7. Use parameters.backgrounds for theme testing
 * 8. Test edge cases (empty states, loading states, error states)
 */

/**
 * Global Chromatic Configuration
 * Add to .storybook/main.js or .storybook/preview.js
 *
 * export const parameters = {
 *   chromatic: {
 *     // Global delay for all stories
 *     delay: 300,
 *
 *     // Viewports to test all stories at
 *     viewports: [320, 768, 1200],
 *
 *     // Pause animations globally
 *     pauseAnimationAtEnd: true
 *   }
 * };
 */
