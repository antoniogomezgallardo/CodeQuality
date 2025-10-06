/**
 * Vue Test Utils Component Testing Examples
 * Demonstrates Vue.js component testing with Vue Test Utils
 */

import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import { nextTick } from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

// Example Vue components for testing
import UserProfile from '@/components/UserProfile.vue';
import UserForm from '@/components/UserForm.vue';
import UserList from '@/components/UserList.vue';
import SearchInput from '@/components/SearchInput.vue';
import Modal from '@/components/Modal.vue';
import DataTable from '@/components/DataTable.vue';

// Mock external dependencies
jest.mock('@/services/api', () => ({
  fetchUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  searchUsers: jest.fn()
}));

const mockApi = require('@/services/api');

// Test utilities
const createVueInstance = () => {
  const localVue = createLocalVue();
  localVue.use(VueRouter);
  localVue.use(Vuex);
  return localVue;
};

const createStore = (initialState = {}) => {
  return new Vuex.Store({
    state: {
      user: null,
      users: [],
      loading: false,
      ...initialState
    },
    mutations: {
      SET_USER: (state, user) => {
        state.user = user;
      },
      SET_USERS: (state, users) => {
        state.users = users;
      },
      SET_LOADING: (state, loading) => {
        state.loading = loading;
      }
    },
    actions: {
      fetchUser: ({ commit }, id) => {
        commit('SET_LOADING', true);
        return mockApi.fetchUser(id).then(user => {
          commit('SET_USER', user);
          commit('SET_LOADING', false);
        });
      },
      updateUser: ({ commit }, userData) => {
        return mockApi.updateUser(userData).then(user => {
          commit('SET_USER', user);
        });
      }
    },
    getters: {
      activeUsers: state => state.users.filter(user => user.isActive),
      userById: state => id => state.users.find(user => user.id === id)
    }
  });
};

const createRouter = () => {
  return new VueRouter({
    routes: [
      { path: '/users/:id', name: 'UserProfile', component: UserProfile },
      { path: '/users', name: 'UserList', component: UserList }
    ]
  });
};

describe('UserProfile Component', () => {
  let localVue;
  let store;
  let router;

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    avatar: 'https://example.com/avatar.jpg',
    isActive: true,
    lastLogin: '2023-01-15T10:30:00Z'
  };

  beforeEach(() => {
    localVue = createVueInstance();
    store = createStore({ user: mockUser });
    router = createRouter();
    jest.clearAllMocks();
  });

  test('should render user profile information', () => {
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: { user: mockUser }
    });

    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('john.doe@example.com');
    expect(wrapper.text()).toContain('admin');
  });

  test('should display user avatar', () => {
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: { user: mockUser }
    });

    const avatar = wrapper.find('[data-testid="user-avatar"]');
    expect(avatar.exists()).toBe(true);
    expect(avatar.attributes('src')).toBe(mockUser.avatar);
    expect(avatar.attributes('alt')).toBe(`${mockUser.name}'s avatar`);
  });

  test('should show active status badge', () => {
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: { user: mockUser }
    });

    const statusBadge = wrapper.find('[data-testid="status-badge"]');
    expect(statusBadge.exists()).toBe(true);
    expect(statusBadge.text()).toBe('Active');
    expect(statusBadge.classes()).toContain('status-active');
  });

  test('should show inactive status for inactive user', () => {
    const inactiveUser = { ...mockUser, isActive: false };
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: { user: inactiveUser }
    });

    const statusBadge = wrapper.find('[data-testid="status-badge"]');
    expect(statusBadge.text()).toBe('Inactive');
    expect(statusBadge.classes()).toContain('status-inactive');
  });

  test('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: { user: mockUser }
    });

    const editButton = wrapper.find('[data-testid="edit-button"]');
    await editButton.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0]).toEqual([mockUser]);
  });

  test('should show loading state when updating', () => {
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: {
        user: mockUser,
        isUpdating: true
      }
    });

    const loadingSpinner = wrapper.find('[data-testid="loading-spinner"]');
    expect(loadingSpinner.exists()).toBe(true);

    const editButton = wrapper.find('[data-testid="edit-button"]');
    expect(editButton.attributes('disabled')).toBe('disabled');
  });

  test('should handle missing avatar with initials fallback', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null };
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: { user: userWithoutAvatar }
    });

    const initialsAvatar = wrapper.find('[data-testid="avatar-initials"]');
    expect(initialsAvatar.exists()).toBe(true);
    expect(initialsAvatar.text()).toBe('JD');
  });

  test('should format last login date correctly', () => {
    const wrapper = mount(UserProfile, {
      localVue,
      store,
      router,
      propsData: { user: mockUser }
    });

    const lastLoginElement = wrapper.find('[data-testid="last-login"]');
    expect(lastLoginElement.text()).toContain('Jan 15, 2023');
  });
});

describe('UserForm Component', () => {
  let localVue;
  let store;

  beforeEach(() => {
    localVue = createVueInstance();
    store = createStore();
  });

  test('should render form fields', () => {
    const wrapper = mount(UserForm, {
      localVue,
      store
    });

    expect(wrapper.find('input[name="name"]').exists()).toBe(true);
    expect(wrapper.find('input[name="email"]').exists()).toBe(true);
    expect(wrapper.find('select[name="role"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  test('should populate form with initial values', () => {
    const initialValues = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin'
    };

    const wrapper = mount(UserForm, {
      localVue,
      store,
      propsData: { initialValues }
    });

    expect(wrapper.find('input[name="name"]').element.value).toBe('John Doe');
    expect(wrapper.find('input[name="email"]').element.value).toBe('john.doe@example.com');
    expect(wrapper.find('select[name="role"]').element.value).toBe('admin');
  });

  test('should validate required fields', async () => {
    const wrapper = mount(UserForm, {
      localVue,
      store
    });

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    await nextTick();

    expect(wrapper.find('[data-testid="name-error"]').text()).toContain('Name is required');
    expect(wrapper.find('[data-testid="email-error"]').text()).toContain('Email is required');
  });

  test('should validate email format', async () => {
    const wrapper = mount(UserForm, {
      localVue,
      store
    });

    const emailInput = wrapper.find('input[name="email"]');
    await emailInput.setValue('invalid-email');
    await emailInput.trigger('blur');

    await nextTick();

    expect(wrapper.find('[data-testid="email-error"]').text()).toContain('Invalid email format');
  });

  test('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    const wrapper = mount(UserForm, {
      localVue,
      store,
      listeners: {
        submit: mockSubmit
      }
    });

    await wrapper.find('input[name="name"]').setValue('Jane Smith');
    await wrapper.find('input[name="email"]').setValue('jane.smith@example.com');
    await wrapper.find('select[name="role"]').setValue('user');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'user'
    });
  });

  test('should show loading state during submission', () => {
    const wrapper = mount(UserForm, {
      localVue,
      store,
      propsData: { isSubmitting: true }
    });

    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.text()).toBe('Saving...');
    expect(submitButton.attributes('disabled')).toBe('disabled');
  });

  test('should reset form when reset button is clicked', async () => {
    const wrapper = mount(UserForm, {
      localVue,
      store
    });

    await wrapper.find('input[name="name"]').setValue('Jane Smith');
    await wrapper.find('input[name="email"]').setValue('jane.smith@example.com');

    const resetButton = wrapper.find('[data-testid="reset-button"]');
    await resetButton.trigger('click');

    expect(wrapper.find('input[name="name"]').element.value).toBe('');
    expect(wrapper.find('input[name="email"]').element.value).toBe('');
  });

  test('should watch for prop changes', async () => {
    const wrapper = mount(UserForm, {
      localVue,
      store,
      propsData: {
        initialValues: { name: 'John', email: 'john@example.com', role: 'user' }
      }
    });

    expect(wrapper.find('input[name="name"]').element.value).toBe('John');

    await wrapper.setProps({
      initialValues: { name: 'Jane', email: 'jane@example.com', role: 'admin' }
    });

    expect(wrapper.find('input[name="name"]').element.value).toBe('Jane');
    expect(wrapper.find('select[name="role"]').element.value).toBe('admin');
  });
});

describe('UserList Component', () => {
  let localVue;
  let store;

  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', isActive: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', isActive: true },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'moderator', isActive: false }
  ];

  beforeEach(() => {
    localVue = createVueInstance();
    store = createStore({ users: mockUsers });
  });

  test('should render list of users', () => {
    const wrapper = mount(UserList, {
      localVue,
      store,
      propsData: { users: mockUsers }
    });

    const userRows = wrapper.findAll('[data-testid^="user-row"]');
    expect(userRows).toHaveLength(3);

    mockUsers.forEach((user, index) => {
      const row = userRows.at(index);
      expect(row.text()).toContain(user.name);
      expect(row.text()).toContain(user.email);
      expect(row.text()).toContain(user.role);
    });
  });

  test('should show empty state when no users', () => {
    const wrapper = mount(UserList, {
      localVue,
      store,
      propsData: { users: [] }
    });

    const emptyState = wrapper.find('[data-testid="empty-state"]');
    expect(emptyState.exists()).toBe(true);
    expect(emptyState.text()).toContain('No users found');
  });

  test('should filter users by search term', async () => {
    const wrapper = mount(UserList, {
      localVue,
      store,
      propsData: { users: mockUsers }
    });

    const searchInput = wrapper.find('[data-testid="search-input"]');
    await searchInput.setValue('jane');

    await nextTick();

    const userRows = wrapper.findAll('[data-testid^="user-row"]');
    expect(userRows).toHaveLength(1);
    expect(userRows.at(0).text()).toContain('Jane Smith');
  });

  test('should sort users by column', async () => {
    const wrapper = mount(UserList, {
      localVue,
      store,
      propsData: { users: mockUsers }
    });

    const nameHeader = wrapper.find('[data-testid="header-name"]');
    await nameHeader.trigger('click');

    await nextTick();

    const userRows = wrapper.findAll('[data-testid^="user-row"]');
    expect(userRows.at(0).text()).toContain('Bob Wilson');
    expect(userRows.at(1).text()).toContain('Jane Smith');
    expect(userRows.at(2).text()).toContain('John Doe');
  });

  test('should emit user-click event when user is clicked', async () => {
    const wrapper = mount(UserList, {
      localVue,
      store,
      propsData: { users: mockUsers }
    });

    const firstUserRow = wrapper.find('[data-testid="user-row-0"]');
    await firstUserRow.trigger('click');

    expect(wrapper.emitted('user-click')).toBeTruthy();
    expect(wrapper.emitted('user-click')[0]).toEqual([mockUsers[0]]);
  });

  test('should show loading state', () => {
    const wrapper = mount(UserList, {
      localVue,
      store,
      propsData: {
        users: [],
        isLoading: true
      }
    });

    const loadingSkeleton = wrapper.find('[data-testid="loading-skeleton"]');
    expect(loadingSkeleton.exists()).toBe(true);
  });
});

describe('SearchInput Component', () => {
  let localVue;

  beforeEach(() => {
    localVue = createVueInstance();
    mockApi.searchUsers.mockResolvedValue([
      { id: 1, name: 'John Doe', email: 'john@example.com' }
    ]);
  });

  test('should render search input', () => {
    const wrapper = mount(SearchInput, {
      localVue,
      propsData: {
        placeholder: 'Search users...'
      }
    });

    const input = wrapper.find('input[type="text"]');
    expect(input.exists()).toBe(true);
    expect(input.attributes('placeholder')).toBe('Search users...');
  });

  test('should emit input event on value change', async () => {
    const wrapper = mount(SearchInput, {
      localVue
    });

    const input = wrapper.find('input');
    await input.setValue('john');

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0]).toEqual(['john']);
  });

  test('should debounce search queries', async () => {
    jest.useFakeTimers();

    const wrapper = mount(SearchInput, {
      localVue,
      propsData: {
        debounce: 300,
        onSearch: mockApi.searchUsers
      }
    });

    const input = wrapper.find('input');
    await input.setValue('john');

    // Function should not be called immediately
    expect(mockApi.searchUsers).not.toHaveBeenCalled();

    // Fast forward time
    jest.advanceTimersByTime(300);

    expect(mockApi.searchUsers).toHaveBeenCalledWith('john');

    jest.useRealTimers();
  });

  test('should show search suggestions', async () => {
    const wrapper = mount(SearchInput, {
      localVue,
      propsData: {
        showSuggestions: true,
        suggestions: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' }
        ]
      }
    });

    const suggestionsList = wrapper.find('[data-testid="suggestions-list"]');
    expect(suggestionsList.exists()).toBe(true);

    const suggestions = wrapper.findAll('[data-testid^="suggestion-"]');
    expect(suggestions).toHaveLength(2);
  });

  test('should handle keyboard navigation in suggestions', async () => {
    const wrapper = mount(SearchInput, {
      localVue,
      propsData: {
        showSuggestions: true,
        suggestions: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' }
        ]
      }
    });

    const input = wrapper.find('input');

    // Arrow down should highlight first suggestion
    await input.trigger('keydown.down');
    expect(wrapper.vm.highlightedIndex).toBe(0);

    // Arrow down again should highlight second suggestion
    await input.trigger('keydown.down');
    expect(wrapper.vm.highlightedIndex).toBe(1);

    // Arrow up should go back to first suggestion
    await input.trigger('keydown.up');
    expect(wrapper.vm.highlightedIndex).toBe(0);

    // Enter should select highlighted suggestion
    await input.trigger('keydown.enter');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0]).toEqual([{ id: 1, name: 'John Doe' }]);
  });
});

describe('Modal Component', () => {
  let localVue;

  beforeEach(() => {
    localVue = createVueInstance();
  });

  test('should not render when not visible', () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: { visible: false }
    });

    expect(wrapper.find('[data-testid="modal-overlay"]').exists()).toBe(false);
  });

  test('should render when visible', () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: { visible: true },
      slots: {
        default: '<div>Modal content</div>'
      }
    });

    expect(wrapper.find('[data-testid="modal-overlay"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Modal content');
  });

  test('should emit close event when close button is clicked', async () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: { visible: true }
    });

    const closeButton = wrapper.find('[data-testid="close-button"]');
    await closeButton.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  test('should emit close event when overlay is clicked', async () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: { visible: true }
    });

    const overlay = wrapper.find('[data-testid="modal-overlay"]');
    await overlay.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  test('should not close when modal content is clicked', async () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: { visible: true }
    });

    const modalContent = wrapper.find('[data-testid="modal-content"]');
    await modalContent.trigger('click');

    expect(wrapper.emitted('close')).toBeFalsy();
  });

  test('should handle escape key to close modal', async () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: { visible: true },
      attachTo: document.body
    });

    await wrapper.trigger('keydown.esc');

    expect(wrapper.emitted('close')).toBeTruthy();

    wrapper.destroy();
  });

  test('should render custom title', () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: {
        visible: true,
        title: 'Custom Modal Title'
      }
    });

    expect(wrapper.find('[data-testid="modal-title"]').text()).toBe('Custom Modal Title');
  });

  test('should render custom footer', () => {
    const wrapper = mount(Modal, {
      localVue,
      propsData: { visible: true },
      slots: {
        footer: '<button>Custom Footer Button</button>'
      }
    });

    expect(wrapper.find('[data-testid="modal-footer"]').html()).toContain('Custom Footer Button');
  });
});

describe('DataTable Component', () => {
  let localVue;
  let store;

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'moderator' }
  ];

  const mockColumns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'role', title: 'Role', sortable: false }
  ];

  beforeEach(() => {
    localVue = createVueInstance();
    store = createStore();
  });

  test('should render table with data and columns', () => {
    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: mockData,
        columns: mockColumns
      }
    });

    // Check headers
    mockColumns.forEach(column => {
      expect(wrapper.text()).toContain(column.title);
    });

    // Check data rows
    mockData.forEach(row => {
      expect(wrapper.text()).toContain(row.name);
      expect(wrapper.text()).toContain(row.email);
      expect(wrapper.text()).toContain(row.role);
    });
  });

  test('should sort data when sortable column is clicked', async () => {
    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: mockData,
        columns: mockColumns
      }
    });

    const nameHeader = wrapper.find('[data-testid="header-name"]');
    await nameHeader.trigger('click');

    await nextTick();

    // Data should be sorted by name
    const rows = wrapper.findAll('[data-testid^="table-row"]');
    expect(rows.at(0).text()).toContain('Bob Wilson');
    expect(rows.at(1).text()).toContain('Jane Smith');
    expect(rows.at(2).text()).toContain('John Doe');
  });

  test('should not sort when column is not sortable', async () => {
    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: mockData,
        columns: mockColumns
      }
    });

    const roleHeader = wrapper.find('[data-testid="header-role"]');
    expect(roleHeader.classes()).not.toContain('sortable');

    await roleHeader.trigger('click');

    // Data should remain in original order
    const rows = wrapper.findAll('[data-testid^="table-row"]');
    expect(rows.at(0).text()).toContain('John Doe');
    expect(rows.at(1).text()).toContain('Jane Smith');
    expect(rows.at(2).text()).toContain('Bob Wilson');
  });

  test('should emit row-click event when row is clicked', async () => {
    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: mockData,
        columns: mockColumns
      }
    });

    const firstRow = wrapper.find('[data-testid="table-row-0"]');
    await firstRow.trigger('click');

    expect(wrapper.emitted('row-click')).toBeTruthy();
    expect(wrapper.emitted('row-click')[0]).toEqual([mockData[0], 0]);
  });

  test('should show pagination when enabled', () => {
    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: mockData,
        columns: mockColumns,
        pagination: {
          page: 1,
          pageSize: 2,
          total: 10
        }
      }
    });

    const pagination = wrapper.find('[data-testid="pagination"]');
    expect(pagination.exists()).toBe(true);
    expect(pagination.text()).toContain('Page 1 of 5');
  });

  test('should show empty state when no data', () => {
    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: [],
        columns: mockColumns
      }
    });

    const emptyState = wrapper.find('[data-testid="empty-state"]');
    expect(emptyState.exists()).toBe(true);
    expect(emptyState.text()).toContain('No data available');
  });

  test('should show loading state', () => {
    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: [],
        columns: mockColumns,
        loading: true
      }
    });

    const loadingState = wrapper.find('[data-testid="loading-state"]');
    expect(loadingState.exists()).toBe(true);
  });

  test('should render custom cell content', () => {
    const columnsWithCustom = [
      ...mockColumns,
      {
        key: 'actions',
        title: 'Actions',
        render: (value, row) => `<button data-id="${row.id}">Edit</button>`
      }
    ];

    const wrapper = mount(DataTable, {
      localVue,
      store,
      propsData: {
        data: mockData,
        columns: columnsWithCustom
      }
    });

    const actionButtons = wrapper.findAll('button[data-id]');
    expect(actionButtons).toHaveLength(3);
    expect(actionButtons.at(0).attributes('data-id')).toBe('1');
  });
});

// Vuex integration testing
describe('Vuex Integration', () => {
  let localVue;
  let store;

  beforeEach(() => {
    localVue = createVueInstance();
    store = createStore();
  });

  test('should update store when user is updated', async () => {
    const updatedUser = {
      id: 1,
      name: 'John Updated',
      email: 'john.updated@example.com',
      role: 'admin'
    };

    mockApi.updateUser.mockResolvedValue(updatedUser);

    await store.dispatch('updateUser', updatedUser);

    expect(store.state.user).toEqual(updatedUser);
    expect(mockApi.updateUser).toHaveBeenCalledWith(updatedUser);
  });

  test('should use getters correctly', () => {
    const users = [
      { id: 1, name: 'John', isActive: true },
      { id: 2, name: 'Jane', isActive: false },
      { id: 3, name: 'Bob', isActive: true }
    ];

    store.commit('SET_USERS', users);

    const activeUsers = store.getters.activeUsers;
    expect(activeUsers).toHaveLength(2);
    expect(activeUsers.map(u => u.name)).toEqual(['John', 'Bob']);

    const userById = store.getters.userById(2);
    expect(userById.name).toBe('Jane');
  });
});

// Vue Router integration testing
describe('Vue Router Integration', () => {
  let localVue;
  let router;

  beforeEach(() => {
    localVue = createVueInstance();
    router = createRouter();
  });

  test('should navigate to user profile', async () => {
    const wrapper = mount(UserList, {
      localVue,
      router,
      propsData: {
        users: [{ id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' }]
      }
    });

    const userRow = wrapper.find('[data-testid="user-row-0"]');
    await userRow.trigger('click');

    expect(router.currentRoute.name).toBe('UserProfile');
    expect(router.currentRoute.params.id).toBe('1');
  });

  test('should handle route parameters', () => {
    router.push('/users/123');

    const wrapper = mount(UserProfile, {
      localVue,
      router
    });

    expect(wrapper.vm.$route.params.id).toBe('123');
  });
});

// Component lifecycle testing
describe('Component Lifecycle', () => {
  let localVue;

  beforeEach(() => {
    localVue = createVueInstance();
  });

  test('should call mounted hook', () => {
    const mountedSpy = jest.fn();

    const TestComponent = {
      template: '<div>Test</div>',
      mounted: mountedSpy
    };

    mount(TestComponent, { localVue });

    expect(mountedSpy).toHaveBeenCalled();
  });

  test('should call destroyed hook', () => {
    const destroyedSpy = jest.fn();

    const TestComponent = {
      template: '<div>Test</div>',
      destroyed: destroyedSpy
    };

    const wrapper = mount(TestComponent, { localVue });
    wrapper.destroy();

    expect(destroyedSpy).toHaveBeenCalled();
  });

  test('should react to prop changes', async () => {
    const TestComponent = {
      template: '<div>{{ message }}</div>',
      props: ['message']
    };

    const wrapper = mount(TestComponent, {
      localVue,
      propsData: { message: 'Hello' }
    });

    expect(wrapper.text()).toBe('Hello');

    await wrapper.setProps({ message: 'World' });

    expect(wrapper.text()).toBe('World');
  });
});

export {
  createVueInstance,
  createStore,
  createRouter
};