/**
 * React Testing Library Component Testing Examples
 * Demonstrates modern React component testing practices
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Example components for testing
import UserProfile from '../src/components/UserProfile';
import UserForm from '../src/components/UserForm';
import UserList from '../src/components/UserList';
import SearchableDropdown from '../src/components/SearchableDropdown';
import Modal from '../src/components/Modal';
import DataTable from '../src/components/DataTable';

// Mock external dependencies
jest.mock('../src/services/api', () => ({
  fetchUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  searchUsers: jest.fn(),
}));

const mockApi = require('../src/services/api');

// Test utilities
const createWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const renderWithProviders = (ui, options = {}) => {
  return render(ui, { wrapper: createWrapper, ...options });
};

describe('UserProfile Component', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    avatar: 'https://example.com/avatar.jpg',
    isActive: true,
    lastLogin: '2023-01-15T10:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render user profile with correct information', () => {
    renderWithProviders(<UserProfile user={mockUser} />);

    // Test basic rendering
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();

    // Test avatar rendering
    const avatar = screen.getByAltText("John Doe's avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', mockUser.avatar);
  });

  test('should show active status badge when user is active', () => {
    renderWithProviders(<UserProfile user={mockUser} />);

    const statusBadge = screen.getByText('Active');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('status-active');
  });

  test('should show inactive status badge when user is inactive', () => {
    const inactiveUser = { ...mockUser, isActive: false };
    renderWithProviders(<UserProfile user={inactiveUser} />);

    const statusBadge = screen.getByText('Inactive');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('status-inactive');
  });

  test('should format last login date correctly', () => {
    renderWithProviders(<UserProfile user={mockUser} />);

    expect(screen.getByText(/Last login:/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2023/)).toBeInTheDocument();
  });

  test('should handle missing avatar gracefully', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null };
    renderWithProviders(<UserProfile user={userWithoutAvatar} />);

    const defaultAvatar = screen.getByText('JD'); // Initials fallback
    expect(defaultAvatar).toBeInTheDocument();
    expect(defaultAvatar).toHaveClass('avatar-initials');
  });

  test('should call onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn();
    renderWithProviders(<UserProfile user={mockUser} onEdit={mockOnEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  test('should show loading state when updating', () => {
    renderWithProviders(<UserProfile user={mockUser} isUpdating={true} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
  });
});

describe('UserForm Component', () => {
  test('should render form with all required fields', () => {
    renderWithProviders(<UserForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  test('should populate form with initial values', () => {
    const initialValues = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
    };

    renderWithProviders(<UserForm initialValues={initialValues} />);

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    const mockOnSubmit = jest.fn();
    renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    // Check for validation messages
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('should validate email format', async () => {
    renderWithProviders(<UserForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  test('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    renderWithProviders(<UserForm onSubmit={mockOnSubmit} />);

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/name/i), 'Jane Smith');
    await userEvent.type(screen.getByLabelText(/email/i), 'jane.smith@example.com');
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'user');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user',
      });
    });
  });

  test('should show loading state during submission', async () => {
    renderWithProviders(<UserForm isSubmitting={true} />);

    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('should reset form when reset button is clicked', async () => {
    renderWithProviders(<UserForm />);

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/name/i), 'Jane Smith');
    await userEvent.type(screen.getByLabelText(/email/i), 'jane.smith@example.com');

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
  });
});

describe('UserList Component', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'moderator' },
  ];

  test('should render list of users', () => {
    renderWithProviders(<UserList users={mockUsers} />);

    mockUsers.forEach(user => {
      expect(screen.getByText(user.name)).toBeInTheDocument();
      expect(screen.getByText(user.email)).toBeInTheDocument();
      expect(screen.getByText(user.role)).toBeInTheDocument();
    });
  });

  test('should show empty state when no users', () => {
    renderWithProviders(<UserList users={[]} />);

    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
  });

  test('should filter users by search term', async () => {
    renderWithProviders(<UserList users={mockUsers} />);

    const searchInput = screen.getByPlaceholderText(/search users/i);
    await userEvent.type(searchInput, 'jane');

    // Should show only Jane Smith
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
  });

  test('should sort users by name', async () => {
    renderWithProviders(<UserList users={mockUsers} />);

    const sortButton = screen.getByRole('button', { name: /sort by name/i });
    await userEvent.click(sortButton);

    const userRows = screen.getAllByTestId('user-row');
    expect(within(userRows[0]).getByText('Bob Wilson')).toBeInTheDocument();
    expect(within(userRows[1]).getByText('Jane Smith')).toBeInTheDocument();
    expect(within(userRows[2]).getByText('John Doe')).toBeInTheDocument();
  });

  test('should call onUserClick when user is clicked', async () => {
    const mockOnUserClick = jest.fn();
    renderWithProviders(<UserList users={mockUsers} onUserClick={mockOnUserClick} />);

    const firstUserRow = screen.getByTestId('user-row-1');
    await userEvent.click(firstUserRow);

    expect(mockOnUserClick).toHaveBeenCalledWith(mockUsers[0]);
  });

  test('should show loading state', () => {
    renderWithProviders(<UserList users={[]} isLoading={true} />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(5);
  });
});

describe('SearchableDropdown Component', () => {
  const mockOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' },
  ];

  beforeEach(() => {
    mockApi.searchUsers.mockResolvedValue(mockOptions);
  });

  test('should render dropdown with placeholder', () => {
    renderWithProviders(<SearchableDropdown options={mockOptions} placeholder="Select role" />);

    expect(screen.getByText('Select role')).toBeInTheDocument();
  });

  test('should show options when clicked', async () => {
    renderWithProviders(<SearchableDropdown options={mockOptions} />);

    const dropdown = screen.getByRole('combobox');
    await userEvent.click(dropdown);

    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  test('should filter options by search term', async () => {
    renderWithProviders(<SearchableDropdown options={mockOptions} searchable />);

    const dropdown = screen.getByRole('combobox');
    await userEvent.click(dropdown);
    await userEvent.type(dropdown, 'admin');

    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.queryByText('User')).not.toBeInTheDocument();
    expect(screen.queryByText('Moderator')).not.toBeInTheDocument();
  });

  test('should call onChange when option is selected', async () => {
    const mockOnChange = jest.fn();
    renderWithProviders(<SearchableDropdown options={mockOptions} onChange={mockOnChange} />);

    const dropdown = screen.getByRole('combobox');
    await userEvent.click(dropdown);

    const adminOption = screen.getByText('Administrator');
    await userEvent.click(adminOption);

    expect(mockOnChange).toHaveBeenCalledWith('admin');
  });

  test('should support async option loading', async () => {
    renderWithProviders(
      <SearchableDropdown loadOptions={mockApi.searchUsers} placeholder="Search users..." />
    );

    const dropdown = screen.getByRole('combobox');
    await userEvent.type(dropdown, 'john');

    await waitFor(() => {
      expect(mockApi.searchUsers).toHaveBeenCalledWith('john');
    });
  });
});

describe('Modal Component', () => {
  test('should not render when not open', () => {
    renderWithProviders(
      <Modal isOpen={false}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  test('should render when open', () => {
    renderWithProviders(
      <Modal isOpen={true}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('should call onClose when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should call onClose when escape key is pressed', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    await userEvent.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should call onClose when overlay is clicked', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    const overlay = screen.getByTestId('modal-overlay');
    await userEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should trap focus within modal', async () => {
    renderWithProviders(
      <Modal isOpen={true}>
        <button>First button</button>
        <input placeholder="Text input" />
        <button>Last button</button>
      </Modal>
    );

    const firstButton = screen.getByText('First button');
    const lastButton = screen.getByText('Last button');

    // Focus should start on first focusable element
    firstButton.focus();
    expect(firstButton).toHaveFocus();

    // Tab to next element
    await userEvent.tab();
    expect(screen.getByPlaceholderText('Text input')).toHaveFocus();

    // Tab to last element
    await userEvent.tab();
    expect(lastButton).toHaveFocus();

    // Tab should wrap to first element
    await userEvent.tab();
    expect(firstButton).toHaveFocus();
  });

  test('should render with custom title', () => {
    renderWithProviders(
      <Modal isOpen={true} title="Custom Modal Title">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Custom Modal Title')).toBeInTheDocument();
  });
});

describe('DataTable Component', () => {
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'inactive' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'moderator', status: 'active' },
  ];

  const mockColumns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'role', title: 'Role', sortable: false },
    { key: 'status', title: 'Status', sortable: true },
  ];

  test('should render table with data and columns', () => {
    renderWithProviders(<DataTable data={mockData} columns={mockColumns} />);

    // Check headers
    mockColumns.forEach(column => {
      expect(screen.getByText(column.title)).toBeInTheDocument();
    });

    // Check data
    mockData.forEach(row => {
      expect(screen.getByText(row.name)).toBeInTheDocument();
      expect(screen.getByText(row.email)).toBeInTheDocument();
      expect(screen.getByText(row.role)).toBeInTheDocument();
      expect(screen.getByText(row.status)).toBeInTheDocument();
    });
  });

  test('should sort data when sortable column header is clicked', async () => {
    renderWithProviders(<DataTable data={mockData} columns={mockColumns} />);

    const nameHeader = screen.getByText('Name');
    await userEvent.click(nameHeader);

    // Data should be sorted by name (ascending)
    const rows = screen.getAllByTestId('table-row');
    expect(within(rows[0]).getByText('Bob Wilson')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Jane Smith')).toBeInTheDocument();
    expect(within(rows[2]).getByText('John Doe')).toBeInTheDocument();

    // Click again for descending sort
    await userEvent.click(nameHeader);

    const rowsDesc = screen.getAllByTestId('table-row');
    expect(within(rowsDesc[0]).getByText('John Doe')).toBeInTheDocument();
    expect(within(rowsDesc[1]).getByText('Jane Smith')).toBeInTheDocument();
    expect(within(rowsDesc[2]).getByText('Bob Wilson')).toBeInTheDocument();
  });

  test('should show pagination when enabled', () => {
    renderWithProviders(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{ page: 1, pageSize: 2, total: 10 }}
      />
    );

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  test('should call onRowClick when row is clicked', async () => {
    const mockOnRowClick = jest.fn();
    renderWithProviders(
      <DataTable data={mockData} columns={mockColumns} onRowClick={mockOnRowClick} />
    );

    const firstRow = screen.getByTestId('table-row-0');
    await userEvent.click(firstRow);

    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0], 0);
  });

  test('should show empty state when no data', () => {
    renderWithProviders(<DataTable data={[]} columns={mockColumns} />);

    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  test('should show loading state', () => {
    renderWithProviders(<DataTable data={[]} columns={mockColumns} loading={true} />);

    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(5);
  });
});

// Custom hooks testing
describe('Custom Hooks', () => {
  const useCounter = (initialValue = 0) => {
    const [count, setCount] = React.useState(initialValue);

    const increment = React.useCallback(() => {
      setCount(c => c + 1);
    }, []);

    const decrement = React.useCallback(() => {
      setCount(c => c - 1);
    }, []);

    const reset = React.useCallback(() => {
      setCount(initialValue);
    }, [initialValue]);

    return { count, increment, decrement, reset };
  };

  test('should increment counter', () => {
    let result;

    const TestComponent = () => {
      result = useCounter(5);
      return null;
    };

    render(<TestComponent />);

    expect(result.count).toBe(5);

    // Test increment
    result.increment();
    expect(result.count).toBe(6);

    // Test decrement
    result.decrement();
    expect(result.count).toBe(5);

    // Test reset
    result.reset();
    expect(result.count).toBe(5);
  });
});

// Accessibility testing
describe('Accessibility Tests', () => {
  test('UserProfile should be accessible', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
    };

    renderWithProviders(<UserProfile user={mockUser} />);

    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

    // Check for alt text on images
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('alt');

    // Check for proper button labels
    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  test('UserForm should have proper labels and ARIA attributes', () => {
    renderWithProviders(<UserForm />);

    // Check for associated labels
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const roleSelect = screen.getByLabelText(/role/i);

    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(roleSelect).toBeRequired();

    // Check for ARIA attributes
    expect(nameInput).toHaveAttribute('aria-required', 'true');
    expect(emailInput).toHaveAttribute('aria-required', 'true');
  });
});

export { renderWithProviders, createWrapper };
