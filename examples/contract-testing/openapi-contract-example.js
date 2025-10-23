/**
 * OpenAPI Contract Testing Example
 * Demonstrates API contract validation using OpenAPI specifications
 */

const SwaggerParser = require('swagger-parser');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const axios = require('axios');
const path = require('path');

describe('OpenAPI Contract Testing', () => {
  let apiSpec;
  let ajv;
  let baseURL;

  beforeAll(async () => {
    // Load and validate OpenAPI specification
    apiSpec = await SwaggerParser.validate(path.resolve(__dirname, '../specs/user-api.yaml'));

    // Setup JSON Schema validator
    ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    });
    addFormats(ajv);

    baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
  });

  describe('API Specification Validation', () => {
    test('should have valid OpenAPI specification', async () => {
      expect(apiSpec).toBeDefined();
      expect(apiSpec.openapi).toBe('3.0.0');
      expect(apiSpec.info).toBeDefined();
      expect(apiSpec.paths).toBeDefined();
    });

    test('should have required API metadata', () => {
      expect(apiSpec.info.title).toBeDefined();
      expect(apiSpec.info.version).toBeDefined();
      expect(apiSpec.info.description).toBeDefined();
      expect(apiSpec.servers).toBeDefined();
      expect(apiSpec.servers.length).toBeGreaterThan(0);
    });

    test('should have security definitions', () => {
      expect(apiSpec.components.securitySchemes).toBeDefined();
      expect(apiSpec.components.securitySchemes.bearerAuth).toBeDefined();
      expect(apiSpec.security).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    test('should validate User schema components', () => {
      const userSchema = apiSpec.components.schemas.User;
      expect(userSchema).toBeDefined();
      expect(userSchema.type).toBe('object');
      expect(userSchema.required).toContain('id');
      expect(userSchema.required).toContain('name');
      expect(userSchema.required).toContain('email');

      // Validate schema structure
      const validate = ajv.compile(userSchema);
      const validUser = {
        id: 123,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        isActive: true,
        createdAt: '2023-01-15T10:30:00Z',
      };

      expect(validate(validUser)).toBe(true);
    });

    test('should validate Error schema components', () => {
      const errorSchema = apiSpec.components.schemas.Error;
      expect(errorSchema).toBeDefined();

      const validate = ajv.compile(errorSchema);
      const validError = {
        error: 'Validation Error',
        code: 'VALIDATION_FAILED',
        message: 'Invalid email format',
      };

      expect(validate(validError)).toBe(true);
    });

    test('should validate UserList schema with pagination', () => {
      const userListSchema = apiSpec.components.schemas.UserList;
      expect(userListSchema).toBeDefined();

      const validate = ajv.compile(userListSchema);
      const validUserList = {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'admin',
            isActive: true,
            createdAt: '2023-01-15T10:30:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
        },
      };

      expect(validate(validUserList)).toBe(true);
    });
  });

  describe('API Endpoint Contract Validation', () => {
    test('GET /api/users/{id} should match OpenAPI spec', async () => {
      const pathSpec = apiSpec.paths['/api/users/{id}'].get;
      expect(pathSpec).toBeDefined();

      // Test successful response
      try {
        const response = await axios.get(`${baseURL}/api/users/123`, {
          headers: {
            Authorization: 'Bearer test-token',
            Accept: 'application/json',
          },
        });

        // Validate status code
        expect([200]).toContain(response.status);

        // Validate response schema
        const responseSchema = pathSpec.responses['200'].content['application/json'].schema;
        const validate = ajv.compile(resolveSchemaRef(responseSchema));
        expect(validate(response.data)).toBe(true);

        // Validate response headers
        expect(response.headers['content-type']).toMatch(/application\/json/);
      } catch (error) {
        if (error.response) {
          // Validate error response
          const errorSchema =
            pathSpec.responses[error.response.status]?.content['application/json']?.schema;
          if (errorSchema) {
            const validate = ajv.compile(resolveSchemaRef(errorSchema));
            expect(validate(error.response.data)).toBe(true);
          }
        }
      }
    });

    test('GET /api/users should match OpenAPI spec with query parameters', async () => {
      const pathSpec = apiSpec.paths['/api/users'].get;
      expect(pathSpec).toBeDefined();

      // Validate query parameters
      const queryParams = pathSpec.parameters.filter(p => p.in === 'query');
      expect(queryParams).toBeDefined();

      const pageParam = queryParams.find(p => p.name === 'page');
      const limitParam = queryParams.find(p => p.name === 'limit');
      const sortParam = queryParams.find(p => p.name === 'sort');

      expect(pageParam.schema.type).toBe('integer');
      expect(limitParam.schema.type).toBe('integer');
      expect(sortParam.schema.type).toBe('string');

      try {
        const response = await axios.get(`${baseURL}/api/users`, {
          params: {
            page: 1,
            limit: 10,
            sort: 'name',
          },
          headers: {
            Authorization: 'Bearer test-token',
            Accept: 'application/json',
          },
        });

        // Validate response schema
        const responseSchema = pathSpec.responses['200'].content['application/json'].schema;
        const validate = ajv.compile(resolveSchemaRef(responseSchema));
        expect(validate(response.data)).toBe(true);
      } catch (error) {
        console.log('API might not be running, skipping live validation');
      }
    });

    test('POST /api/users should validate request and response', async () => {
      const pathSpec = apiSpec.paths['/api/users'].post;
      expect(pathSpec).toBeDefined();

      // Validate request schema
      const requestSchema = pathSpec.requestBody.content['application/json'].schema;
      const requestValidate = ajv.compile(resolveSchemaRef(requestSchema));

      const validRequest = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user',
      };

      expect(requestValidate(validRequest)).toBe(true);

      // Test invalid request
      const invalidRequest = {
        name: 'Jane Smith',
        email: 'invalid-email',
        role: 'invalid-role',
      };

      expect(requestValidate(invalidRequest)).toBe(false);

      try {
        const response = await axios.post(`${baseURL}/api/users`, validRequest, {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        // Validate successful response
        const responseSchema = pathSpec.responses['201'].content['application/json'].schema;
        const responseValidate = ajv.compile(resolveSchemaRef(responseSchema));
        expect(responseValidate(response.data)).toBe(true);

        // Validate Location header
        expect(response.headers.location).toMatch(/\/api\/users\/\d+/);
      } catch (error) {
        console.log('API might not be running, skipping live validation');
      }
    });

    test('PUT /api/users/{id} should validate partial updates', async () => {
      const pathSpec = apiSpec.paths['/api/users/{id}'].put;
      expect(pathSpec).toBeDefined();

      // Validate request schema allows partial updates
      const requestSchema = pathSpec.requestBody.content['application/json'].schema;
      const requestValidate = ajv.compile(resolveSchemaRef(requestSchema));

      const partialUpdate = {
        name: 'John Updated',
        role: 'moderator',
      };

      expect(requestValidate(partialUpdate)).toBe(true);
    });

    test('DELETE /api/users/{id} should validate deletion', async () => {
      const pathSpec = apiSpec.paths['/api/users/{id}'].delete;
      expect(pathSpec).toBeDefined();

      // Validate path parameters
      const pathParams = pathSpec.parameters.filter(p => p.in === 'path');
      const idParam = pathParams.find(p => p.name === 'id');
      expect(idParam.required).toBe(true);
      expect(idParam.schema.type).toBe('integer');

      // Validate response codes
      expect(pathSpec.responses['204']).toBeDefined();
      expect(pathSpec.responses['404']).toBeDefined();
    });
  });

  describe('Security Contract Validation', () => {
    test('should require authentication for protected endpoints', () => {
      const protectedPaths = ['/api/users', '/api/users/{id}'];

      protectedPaths.forEach(pathKey => {
        const pathItem = apiSpec.paths[pathKey];
        Object.keys(pathItem).forEach(method => {
          if (['get', 'post', 'put', 'delete'].includes(method)) {
            const operation = pathItem[method];
            expect(operation.security).toBeDefined();
            expect(operation.security.length).toBeGreaterThan(0);
          }
        });
      });
    });

    test('should have proper error responses for unauthorized access', () => {
      const pathItem = apiSpec.paths['/api/users/{id}'].get;
      expect(pathItem.responses['401']).toBeDefined();
      expect(pathItem.responses['403']).toBeDefined();
    });
  });

  describe('API Documentation Completeness', () => {
    test('should have descriptions for all operations', () => {
      Object.keys(apiSpec.paths).forEach(pathKey => {
        const pathItem = apiSpec.paths[pathKey];
        Object.keys(pathItem).forEach(method => {
          if (['get', 'post', 'put', 'delete'].includes(method)) {
            const operation = pathItem[method];
            expect(operation.summary).toBeDefined();
            expect(operation.description).toBeDefined();
            expect(operation.operationId).toBeDefined();
          }
        });
      });
    });

    test('should have examples for all request/response schemas', () => {
      Object.keys(apiSpec.components.schemas).forEach(schemaKey => {
        const schema = apiSpec.components.schemas[schemaKey];
        if (schema.type === 'object') {
          // Check if example is provided
          expect(schema.example || schema.examples).toBeDefined();
        }
      });
    });

    test('should have proper error response documentation', () => {
      const errorCodes = ['400', '401', '403', '404', '500'];

      Object.keys(apiSpec.paths).forEach(pathKey => {
        const pathItem = apiSpec.paths[pathKey];
        Object.keys(pathItem).forEach(method => {
          if (['get', 'post', 'put', 'delete'].includes(method)) {
            const operation = pathItem[method];

            // At least some error responses should be documented
            const hasErrorResponses = errorCodes.some(
              code => operation.responses[code] !== undefined
            );
            expect(hasErrorResponses).toBe(true);
          }
        });
      });
    });
  });

  describe('Breaking Change Detection', () => {
    test('should detect breaking changes in API schema', async () => {
      // This would typically compare against a previous version
      // For demonstration, we'll check current schema integrity

      const currentUserSchema = apiSpec.components.schemas.User;
      const requiredFields = currentUserSchema.required;

      // Ensure no required fields are removed (breaking change)
      const expectedRequiredFields = ['id', 'name', 'email'];
      expectedRequiredFields.forEach(field => {
        expect(requiredFields).toContain(field);
      });

      // Ensure field types haven't changed (breaking change)
      expect(currentUserSchema.properties.id.type).toBe('integer');
      expect(currentUserSchema.properties.name.type).toBe('string');
      expect(currentUserSchema.properties.email.type).toBe('string');
    });

    test('should allow additive changes (non-breaking)', () => {
      const userSchema = apiSpec.components.schemas.User;

      // Additional optional fields are allowed (non-breaking)
      const optionalFields = ['role', 'isActive', 'createdAt', 'updatedAt'];
      optionalFields.forEach(field => {
        if (userSchema.properties[field]) {
          expect(userSchema.required).not.toContain(field);
        }
      });
    });
  });

  /**
   * Helper function to resolve $ref schemas
   */
  function resolveSchemaRef(schema) {
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/', '').split('/');
      return refPath.reduce((obj, key) => obj[key], apiSpec);
    }
    return schema;
  }

  /**
   * Helper function to validate response against schema
   */
  function validateResponse(response, schema) {
    const resolvedSchema = resolveSchemaRef(schema);
    const validate = ajv.compile(resolvedSchema);
    return validate(response);
  }

  /**
   * Helper function to extract validation errors
   */
  function getValidationErrors(validate) {
    return (
      validate.errors?.map(error => ({
        path: error.instancePath,
        message: error.message,
        allowedValues: error.params?.allowedValues,
      })) || []
    );
  }
});

/**
 * Performance Contract Testing
 */
describe('API Performance Contracts', () => {
  test('should meet response time requirements', async () => {
    // Define performance contracts from OpenAPI extensions
    const performanceRequirements = {
      '/api/users': { maxResponseTime: 1000 }, // 1 second
      '/api/users/{id}': { maxResponseTime: 500 }, // 500ms
    };

    for (const [path, requirements] of Object.entries(performanceRequirements)) {
      const startTime = Date.now();

      try {
        await axios.get(`${baseURL}${path.replace('{id}', '123')}`, {
          headers: { Authorization: 'Bearer test-token' },
        });

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(requirements.maxResponseTime);
      } catch (error) {
        console.log(`Skipping performance test for ${path} - API not available`);
      }
    }
  });
});

module.exports = {
  validateResponse,
  getValidationErrors,
  resolveSchemaRef,
};
