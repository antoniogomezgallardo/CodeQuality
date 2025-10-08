/**
 * GraphQL API Testing Examples
 *
 * This file demonstrates comprehensive GraphQL API testing patterns including:
 * - Queries with variables
 * - Mutations (create, update, delete)
 * - Error handling and validation
 * - Authentication and authorization
 * - Nested queries
 * - Fragments for reusable query parts
 * - Schema introspection
 * - Pagination with connections
 *
 * @requires jest
 * @requires graphql
 * @requires express-graphql or apollo-server-express
 * @requires axios
 */

const { graphql, buildSchema } = require('graphql');
const axios = require('axios');

// ============================================================================
// GraphQL Schema Definition
// ============================================================================

/**
 * GraphQL schema for testing
 * Defines types, queries, and mutations
 */
const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    posts: [Post!]!
    createdAt: String!
    updatedAt: String
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    published: Boolean!
    author: User!
    tags: [String!]!
    createdAt: String!
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type UsersConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: String
  }

  input UpdateUserInput {
    name: String
    email: String
    role: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    published: Boolean
    tags: [String!]
  }

  type Query {
    user(id: ID!): User
    users(first: Int, after: String, role: String): UsersConnection!
    me: User
    post(id: ID!): Post
    posts(authorId: ID, published: Boolean): [Post!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, title: String, content: String, published: Boolean): Post!
    deletePost(id: ID!): Boolean!
  }
`);

// ============================================================================
// Mock Data Store
// ============================================================================

class DataStore {
  constructor() {
    this.users = [
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'user',
        createdAt: '2025-01-02T00:00:00Z'
      },
      {
        id: '3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        role: 'user',
        createdAt: '2025-01-03T00:00:00Z'
      }
    ];

    this.posts = [
      {
        id: '1',
        title: 'First Post',
        content: 'This is the first post content',
        published: true,
        authorId: '1',
        tags: ['graphql', 'api'],
        createdAt: '2025-01-05T00:00:00Z'
      },
      {
        id: '2',
        title: 'Second Post',
        content: 'This is the second post content',
        published: false,
        authorId: '1',
        tags: ['testing'],
        createdAt: '2025-01-06T00:00:00Z'
      },
      {
        id: '3',
        title: 'Third Post',
        content: 'This is the third post content',
        published: true,
        authorId: '2',
        tags: ['javascript', 'nodejs'],
        createdAt: '2025-01-07T00:00:00Z'
      }
    ];

    this.nextUserId = 4;
    this.nextPostId = 4;
  }

  reset() {
    this.users = [
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'user',
        createdAt: '2025-01-02T00:00:00Z'
      },
      {
        id: '3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        role: 'user',
        createdAt: '2025-01-03T00:00:00Z'
      }
    ];

    this.posts = [
      {
        id: '1',
        title: 'First Post',
        content: 'This is the first post content',
        published: true,
        authorId: '1',
        tags: ['graphql', 'api'],
        createdAt: '2025-01-05T00:00:00Z'
      },
      {
        id: '2',
        title: 'Second Post',
        content: 'This is the second post content',
        published: false,
        authorId: '1',
        tags: ['testing'],
        createdAt: '2025-01-06T00:00:00Z'
      },
      {
        id: '3',
        title: 'Third Post',
        content: 'This is the third post content',
        published: true,
        authorId: '2',
        tags: ['javascript', 'nodejs'],
        createdAt: '2025-01-07T00:00:00Z'
      }
    ];

    this.nextUserId = 4;
    this.nextPostId = 4;
  }

  findUser(id) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  findPost(id) {
    return this.posts.find(p => p.id === id);
  }

  getUserPosts(userId) {
    return this.posts.filter(p => p.authorId === userId);
  }

  createUser(input) {
    const user = {
      id: String(this.nextUserId++),
      name: input.name,
      email: input.email,
      role: input.role || 'user',
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  updateUser(id, input) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...input,
      updatedAt: new Date().toISOString()
    };

    return this.users[userIndex];
  }

  deleteUser(id) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    // Also delete user's posts
    this.posts = this.posts.filter(p => p.authorId !== id);
    return true;
  }

  createPost(authorId, input) {
    const post = {
      id: String(this.nextPostId++),
      title: input.title,
      content: input.content,
      published: input.published || false,
      authorId,
      tags: input.tags || [],
      createdAt: new Date().toISOString()
    };
    this.posts.push(post);
    return post;
  }

  updatePost(id, updates) {
    const postIndex = this.posts.findIndex(p => p.id === id);
    if (postIndex === -1) return null;

    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.posts[postIndex];
  }

  deletePost(id) {
    const postIndex = this.posts.findIndex(p => p.id === id);
    if (postIndex === -1) return false;

    this.posts.splice(postIndex, 1);
    return true;
  }
}

const dataStore = new DataStore();

// ============================================================================
// GraphQL Resolvers
// ============================================================================

/**
 * Root resolver functions
 */
const root = {
  // Queries
  user: ({ id }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }
    return dataStore.findUser(id);
  },

  users: ({ first = 10, after, role }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    let users = dataStore.users;

    // Filter by role
    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Pagination
    let startIndex = 0;
    if (after) {
      const afterIndex = users.findIndex(u => u.id === after);
      startIndex = afterIndex + 1;
    }

    const paginatedUsers = users.slice(startIndex, startIndex + first);
    const hasNextPage = startIndex + first < users.length;
    const hasPreviousPage = startIndex > 0;

    return {
      edges: paginatedUsers.map(user => ({
        node: user,
        cursor: user.id
      })),
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: paginatedUsers[0]?.id || null,
        endCursor: paginatedUsers[paginatedUsers.length - 1]?.id || null
      },
      totalCount: users.length
    };
  },

  me: (args, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }
    return dataStore.findUser(context.user.id);
  },

  post: ({ id }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }
    return dataStore.findPost(id);
  },

  posts: ({ authorId, published }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    let posts = dataStore.posts;

    if (authorId) {
      posts = posts.filter(p => p.authorId === authorId);
    }

    if (published !== undefined) {
      posts = posts.filter(p => p.published === published);
    }

    return posts;
  },

  // Mutations
  login: ({ email, password }) => {
    // Mock authentication
    if (email === 'alice@example.com' && password === 'password123') {
      const user = dataStore.findUserByEmail(email);
      return {
        token: 'mock-jwt-token-admin',
        user
      };
    }

    if (email === 'bob@example.com' && password === 'password123') {
      const user = dataStore.findUserByEmail(email);
      return {
        token: 'mock-jwt-token-user',
        user
      };
    }

    throw new Error('Invalid credentials');
  },

  createUser: ({ input }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    if (context.user.role !== 'admin') {
      throw new Error('Forbidden: Admin access required');
    }

    // Validation
    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error('Invalid email format');
    }

    if (dataStore.findUserByEmail(input.email)) {
      throw new Error('Email already exists');
    }

    if (!input.name || input.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (!input.password || input.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    return dataStore.createUser(input);
  },

  updateUser: ({ id, input }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    // Users can update themselves, admins can update anyone
    if (context.user.role !== 'admin' && context.user.id !== id) {
      throw new Error('Forbidden: You can only update your own profile');
    }

    const user = dataStore.findUser(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Validation
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error('Invalid email format');
    }

    if (input.email && dataStore.findUserByEmail(input.email)?.id !== id) {
      throw new Error('Email already exists');
    }

    if (input.role && context.user.role !== 'admin') {
      throw new Error('Forbidden: Only admins can change roles');
    }

    return dataStore.updateUser(id, input);
  },

  deleteUser: ({ id }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    if (context.user.role !== 'admin') {
      throw new Error('Forbidden: Admin access required');
    }

    if (context.user.id === id) {
      throw new Error('Cannot delete your own account');
    }

    return dataStore.deleteUser(id);
  },

  createPost: ({ input }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    if (!input.title || input.title.length < 3) {
      throw new Error('Title must be at least 3 characters');
    }

    if (!input.content || input.content.length < 10) {
      throw new Error('Content must be at least 10 characters');
    }

    return dataStore.createPost(context.user.id, input);
  },

  updatePost: ({ id, ...updates }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    const post = dataStore.findPost(id);
    if (!post) {
      throw new Error('Post not found');
    }

    // Only author or admin can update
    if (post.authorId !== context.user.id && context.user.role !== 'admin') {
      throw new Error('Forbidden: You can only update your own posts');
    }

    return dataStore.updatePost(id, updates);
  },

  deletePost: ({ id }, context) => {
    if (!context.user) {
      throw new Error('Unauthorized: Authentication required');
    }

    const post = dataStore.findPost(id);
    if (!post) {
      throw new Error('Post not found');
    }

    // Only author or admin can delete
    if (post.authorId !== context.user.id && context.user.role !== 'admin') {
      throw new Error('Forbidden: You can only delete your own posts');
    }

    return dataStore.deletePost(id);
  }
};

// Add nested resolvers
const User = {
  posts: (user) => {
    return dataStore.getUserPosts(user.id);
  }
};

const Post = {
  author: (post) => {
    return dataStore.findUser(post.authorId);
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Execute a GraphQL query
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @param {Object} context - Context object (e.g., authenticated user)
 * @returns {Promise<Object>} Query result
 */
const executeQuery = async (query, variables = {}, context = {}) => {
  const result = await graphql({
    schema,
    source: query,
    rootValue: {
      ...root,
      User,
      Post
    },
    variableValues: variables,
    contextValue: context
  });

  // Resolve nested fields manually for User.posts and Post.author
  if (result.data) {
    // Resolve User.posts
    if (result.data.user) {
      result.data.user.posts = User.posts(result.data.user);
      // Resolve nested Post.author
      result.data.user.posts = result.data.user.posts.map(post => ({
        ...post,
        author: Post.author(post)
      }));
    }

    if (result.data.users?.edges) {
      result.data.users.edges = result.data.users.edges.map(edge => ({
        ...edge,
        node: {
          ...edge.node,
          posts: User.posts(edge.node).map(post => ({
            ...post,
            author: Post.author(post)
          }))
        }
      }));
    }

    if (result.data.me) {
      result.data.me.posts = User.posts(result.data.me);
      result.data.me.posts = result.data.me.posts.map(post => ({
        ...post,
        author: Post.author(post)
      }));
    }

    // Resolve Post.author
    if (result.data.post) {
      result.data.post.author = Post.author(result.data.post);
    }

    if (result.data.posts) {
      result.data.posts = result.data.posts.map(post => ({
        ...post,
        author: Post.author(post)
      }));
    }

    if (result.data.createPost) {
      result.data.createPost.author = Post.author(result.data.createPost);
    }

    if (result.data.updatePost) {
      result.data.updatePost.author = Post.author(result.data.updatePost);
    }
  }

  return result;
};

/**
 * Create authenticated context
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Object} Context object
 */
const createAuthContext = (userId = '1', role = 'admin') => {
  return {
    user: {
      id: userId,
      role: role
    }
  };
};

// ============================================================================
// Test Suite
// ============================================================================

describe('GraphQL API Testing', () => {
  beforeEach(() => {
    // Reset data store before each test
    dataStore.reset();
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Queries', () => {
    describe('user query', () => {
      it('should fetch a user by ID', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
              email
              role
              createdAt
            }
          }
        `;

        const result = await executeQuery(
          query,
          { id: '1' },
          createAuthContext()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.user).toBeDefined();
        expect(result.data.user.id).toBe('1');
        expect(result.data.user.name).toBe('Alice Johnson');
        expect(result.data.user.email).toBe('alice@example.com');
        expect(result.data.user.role).toBe('admin');
      });

      it('should fetch user with nested posts', async () => {
        const query = `
          query GetUserWithPosts($id: ID!) {
            user(id: $id) {
              id
              name
              posts {
                id
                title
                published
              }
            }
          }
        `;

        const result = await executeQuery(
          query,
          { id: '1' },
          createAuthContext()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.user.posts).toBeDefined();
        expect(Array.isArray(result.data.user.posts)).toBe(true);
        expect(result.data.user.posts.length).toBeGreaterThan(0);
      });

      it('should return null for non-existent user', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
            }
          }
        `;

        const result = await executeQuery(
          query,
          { id: '9999' },
          createAuthContext()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.user).toBeNull();
      });

      it('should require authentication', async () => {
        const query = `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
            }
          }
        `;

        const result = await executeQuery(query, { id: '1' }, {});

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Unauthorized');
      });
    });

    describe('users query with pagination', () => {
      it('should fetch paginated users', async () => {
        const query = `
          query GetUsers($first: Int, $after: String) {
            users(first: $first, after: $after) {
              edges {
                node {
                  id
                  name
                  email
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
              totalCount
            }
          }
        `;

        const result = await executeQuery(
          query,
          { first: 2 },
          createAuthContext()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.users.edges).toHaveLength(2);
        expect(result.data.users.pageInfo.hasNextPage).toBe(true);
        expect(result.data.users.totalCount).toBe(3);
      });

      it('should filter users by role', async () => {
        const query = `
          query GetUsers($role: String) {
            users(role: $role) {
              edges {
                node {
                  id
                  name
                  role
                }
              }
              totalCount
            }
          }
        `;

        const result = await executeQuery(
          query,
          { role: 'user' },
          createAuthContext()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.users.edges.every(edge => edge.node.role === 'user')).toBe(true);
      });

      it('should support cursor-based pagination', async () => {
        const query = `
          query GetUsers($first: Int, $after: String) {
            users(first: $first, after: $after) {
              edges {
                node {
                  id
                  name
                }
                cursor
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `;

        // First page
        const firstPage = await executeQuery(
          query,
          { first: 1 },
          createAuthContext()
        );

        expect(firstPage.data.users.edges).toHaveLength(1);
        const cursor = firstPage.data.users.pageInfo.endCursor;

        // Second page
        const secondPage = await executeQuery(
          query,
          { first: 1, after: cursor },
          createAuthContext()
        );

        expect(secondPage.data.users.edges).toHaveLength(1);
        expect(secondPage.data.users.edges[0].node.id).not.toBe(
          firstPage.data.users.edges[0].node.id
        );
      });
    });

    describe('me query', () => {
      it('should return current authenticated user', async () => {
        const query = `
          query GetMe {
            me {
              id
              name
              email
              role
            }
          }
        `;

        const result = await executeQuery(
          query,
          {},
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.me).toBeDefined();
        expect(result.data.me.id).toBe('1');
      });

      it('should require authentication', async () => {
        const query = `
          query GetMe {
            me {
              id
              name
            }
          }
        `;

        const result = await executeQuery(query, {}, {});

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Unauthorized');
      });
    });

    describe('posts query', () => {
      it('should fetch all posts', async () => {
        const query = `
          query GetPosts {
            posts {
              id
              title
              content
              published
              author {
                id
                name
              }
            }
          }
        `;

        const result = await executeQuery(query, {}, createAuthContext());

        expect(result.errors).toBeUndefined();
        expect(Array.isArray(result.data.posts)).toBe(true);
        expect(result.data.posts.length).toBeGreaterThan(0);
        expect(result.data.posts[0].author).toBeDefined();
      });

      it('should filter posts by author', async () => {
        const query = `
          query GetPosts($authorId: ID) {
            posts(authorId: $authorId) {
              id
              title
              author {
                id
              }
            }
          }
        `;

        const result = await executeQuery(
          query,
          { authorId: '1' },
          createAuthContext()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.posts.every(post => post.author.id === '1')).toBe(true);
      });

      it('should filter posts by published status', async () => {
        const query = `
          query GetPosts($published: Boolean) {
            posts(published: $published) {
              id
              title
              published
            }
          }
        `;

        const result = await executeQuery(
          query,
          { published: true },
          createAuthContext()
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.posts.every(post => post.published === true)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Mutation Tests
  // ==========================================================================

  describe('Mutations', () => {
    describe('login mutation', () => {
      it('should authenticate with valid credentials', async () => {
        const mutation = `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              token
              user {
                id
                name
                email
                role
              }
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            email: 'alice@example.com',
            password: 'password123'
          },
          {} // No auth context needed for login
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.login.token).toBeDefined();
        expect(result.data.login.user.email).toBe('alice@example.com');
        expect(result.data.login.user.role).toBe('admin');
      });

      it('should reject invalid credentials', async () => {
        const mutation = `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              token
              user {
                id
              }
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            email: 'alice@example.com',
            password: 'wrongpassword'
          },
          {}
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Invalid credentials');
      });
    });

    describe('createUser mutation', () => {
      it('should create a new user with admin role', async () => {
        const mutation = `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              name
              email
              role
              createdAt
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              name: 'New User',
              email: 'newuser@example.com',
              password: 'password123',
              role: 'user'
            }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.createUser).toBeDefined();
        expect(result.data.createUser.name).toBe('New User');
        expect(result.data.createUser.email).toBe('newuser@example.com');
        expect(result.data.createUser.id).toBeDefined();
      });

      it('should require admin role to create users', async () => {
        const mutation = `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              name
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              name: 'New User',
              email: 'newuser@example.com',
              password: 'password123'
            }
          },
          createAuthContext('2', 'user') // Regular user
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Forbidden');
      });

      it('should validate email format', async () => {
        const mutation = `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              name: 'Test User',
              email: 'invalid-email',
              password: 'password123'
            }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Invalid email format');
      });

      it('should reject duplicate email', async () => {
        const mutation = `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              name: 'Duplicate',
              email: 'alice@example.com', // Already exists
              password: 'password123'
            }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Email already exists');
      });

      it('should validate password length', async () => {
        const mutation = `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              name: 'Test User',
              email: 'test@example.com',
              password: 'short'
            }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Password must be at least 8 characters');
      });
    });

    describe('updateUser mutation', () => {
      it('should update user profile', async () => {
        const mutation = `
          mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
            updateUser(id: $id, input: $input) {
              id
              name
              email
              updatedAt
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '2',
            input: {
              name: 'Updated Name'
            }
          },
          createAuthContext('2', 'user') // User updating themselves
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.updateUser.name).toBe('Updated Name');
        expect(result.data.updateUser.updatedAt).toBeDefined();
      });

      it('should prevent users from updating others', async () => {
        const mutation = `
          mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
            updateUser(id: $id, input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '1',
            input: { name: 'Hacker' }
          },
          createAuthContext('2', 'user') // User trying to update another user
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Forbidden');
      });

      it('should allow admin to update any user', async () => {
        const mutation = `
          mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
            updateUser(id: $id, input: $input) {
              id
              role
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '2',
            input: { role: 'admin' }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.updateUser.role).toBe('admin');
      });

      it('should prevent non-admin from changing roles', async () => {
        const mutation = `
          mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
            updateUser(id: $id, input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '2',
            input: { role: 'admin' }
          },
          createAuthContext('2', 'user')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Only admins can change roles');
      });

      it('should return error for non-existent user', async () => {
        const mutation = `
          mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
            updateUser(id: $id, input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '9999',
            input: { name: 'Test' }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('User not found');
      });
    });

    describe('deleteUser mutation', () => {
      it('should delete a user with admin role', async () => {
        const mutation = `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id)
          }
        `;

        const result = await executeQuery(
          mutation,
          { id: '2' },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.deleteUser).toBe(true);

        // Verify user is deleted
        expect(dataStore.findUser('2')).toBeUndefined();
      });

      it('should prevent non-admin from deleting users', async () => {
        const mutation = `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id)
          }
        `;

        const result = await executeQuery(
          mutation,
          { id: '3' },
          createAuthContext('2', 'user')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Forbidden');
      });

      it('should prevent deleting own account', async () => {
        const mutation = `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id)
          }
        `;

        const result = await executeQuery(
          mutation,
          { id: '1' },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Cannot delete your own account');
      });
    });

    describe('createPost mutation', () => {
      it('should create a new post', async () => {
        const mutation = `
          mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
              id
              title
              content
              published
              tags
              author {
                id
                name
              }
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              title: 'New Post',
              content: 'This is new post content',
              published: true,
              tags: ['test', 'new']
            }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.createPost.title).toBe('New Post');
        expect(result.data.createPost.author.id).toBe('1');
        expect(result.data.createPost.tags).toEqual(['test', 'new']);
      });

      it('should validate title length', async () => {
        const mutation = `
          mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              title: 'No',
              content: 'Valid content here'
            }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Title must be at least 3 characters');
      });

      it('should validate content length', async () => {
        const mutation = `
          mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            input: {
              title: 'Valid Title',
              content: 'Short'
            }
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Content must be at least 10 characters');
      });
    });

    describe('updatePost mutation', () => {
      it('should update own post', async () => {
        const mutation = `
          mutation UpdatePost($id: ID!, $title: String) {
            updatePost(id: $id, title: $title) {
              id
              title
              updatedAt
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '1',
            title: 'Updated Title'
          },
          createAuthContext('1', 'admin') // Author of post 1
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.updatePost.title).toBe('Updated Title');
        expect(result.data.updatePost.updatedAt).toBeDefined();
      });

      it('should prevent updating others posts', async () => {
        const mutation = `
          mutation UpdatePost($id: ID!, $title: String) {
            updatePost(id: $id, title: $title) {
              id
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '1',
            title: 'Hacked'
          },
          createAuthContext('2', 'user') // Not the author
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Forbidden');
      });

      it('should allow admin to update any post', async () => {
        const mutation = `
          mutation UpdatePost($id: ID!, $published: Boolean) {
            updatePost(id: $id, published: $published) {
              id
              published
            }
          }
        `;

        const result = await executeQuery(
          mutation,
          {
            id: '3',
            published: false
          },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.updatePost.published).toBe(false);
      });
    });

    describe('deletePost mutation', () => {
      it('should delete own post', async () => {
        const mutation = `
          mutation DeletePost($id: ID!) {
            deletePost(id: $id)
          }
        `;

        const result = await executeQuery(
          mutation,
          { id: '3' },
          createAuthContext('2', 'user') // Author of post 3
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.deletePost).toBe(true);
        expect(dataStore.findPost('3')).toBeUndefined();
      });

      it('should prevent deleting others posts', async () => {
        const mutation = `
          mutation DeletePost($id: ID!) {
            deletePost(id: $id)
          }
        `;

        const result = await executeQuery(
          mutation,
          { id: '1' },
          createAuthContext('2', 'user')
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('Forbidden');
      });

      it('should allow admin to delete any post', async () => {
        const mutation = `
          mutation DeletePost($id: ID!) {
            deletePost(id: $id)
          }
        `;

        const result = await executeQuery(
          mutation,
          { id: '3' },
          createAuthContext('1', 'admin')
        );

        expect(result.errors).toBeUndefined();
        expect(result.data.deletePost).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Fragments
  // ==========================================================================

  describe('Fragments', () => {
    it('should use fragments for reusable fields', async () => {
      const query = `
        fragment UserFields on User {
          id
          name
          email
          role
        }

        query GetUsers {
          users {
            edges {
              node {
                ...UserFields
              }
            }
          }
        }
      `;

      const result = await executeQuery(query, {}, createAuthContext());

      expect(result.errors).toBeUndefined();
      expect(result.data.users.edges[0].node).toHaveProperty('id');
      expect(result.data.users.edges[0].node).toHaveProperty('name');
      expect(result.data.users.edges[0].node).toHaveProperty('email');
    });

    it('should use nested fragments', async () => {
      const query = `
        fragment AuthorFields on User {
          id
          name
        }

        fragment PostFields on Post {
          id
          title
          author {
            ...AuthorFields
          }
        }

        query GetPosts {
          posts {
            ...PostFields
          }
        }
      `;

      const result = await executeQuery(query, {}, createAuthContext());

      expect(result.errors).toBeUndefined();
      expect(result.data.posts[0]).toHaveProperty('id');
      expect(result.data.posts[0]).toHaveProperty('title');
      expect(result.data.posts[0].author).toHaveProperty('id');
      expect(result.data.posts[0].author).toHaveProperty('name');
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      const result = await executeQuery(
        mutation,
        {
          input: {
            name: 'T',
            email: 'invalid',
            password: 'short'
          }
        },
        createAuthContext('1', 'admin')
      );

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle authorization errors', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      const result = await executeQuery(
        mutation,
        {
          input: {
            name: 'Test',
            email: 'test@example.com',
            password: 'password123'
          }
        },
        createAuthContext('2', 'user')
      );

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Forbidden');
    });

    it('should handle authentication errors', async () => {
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
          }
        }
      `;

      const result = await executeQuery(query, { id: '1' }, {});

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Unauthorized');
    });
  });
});
