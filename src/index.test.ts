import { type JsonObject, type JsonValue } from 'type-fest';
import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  type OpenAPI,
  type OpenAPIParameter,
  type OpenAPIExtension,
  type OpenAPIReference,
  collectUsedReferences,
  cleanupOpenAPI,
  resolveNamespace,
  relativeReferenceToNamespace,
  ensureResolvedObject,
  pathItemToOperationMap,
} from './index.js';
import {
  type JSONSchema,
  type ExpressiveJSONSchema,
} from 'ya-json-schema-types';
import { YError } from 'yerror';

const openAPI: OpenAPI = {
  openapi: '3.1',
  info: {
    title: 'Test',
    version: '0.0.0',
  },
  paths: {
    '/test': {
      description: 'Test',
      get: {
        parameters: [
          {
            $ref: '#/components/parameters/TestParameterAlias',
          },
        ],
      },
    },
  },
  components: {
    parameters: {
      TestParameter: {
        name: 'test',
        in: 'query',
        schema: {
          $ref: '#/components/schemas/TestSchema',
        },
      },
      TestParameterAlias: {
        $ref: '#/components/parameters/TestParameter',
      },
    },
    schemas: {
      TestSchema: {
        type: 'string',
      },
    },
  },
};
const jsonSchema: JSONSchema = {
  $ref: '#/$defs/test',
  $defs: {
    testAlias: {
      $ref: '#/$defs/test',
    },
    test: true,
    fortest: {
      type: 'null',
      const: null,
    },
  },
};
const expressiveJSONSchema: ExpressiveJSONSchema = {
  $ref: '#/$defs/test',
  $defs: {
    test: {
      type: 'string',
    },
  },
};

// TODO: Find a way to tests types
describe('OpenAPI', () => {
  test('should work', () => {
    const openAPI: OpenAPI<
      ExpressiveJSONSchema,
      {
        'x-my-extension': 'plop';
      }
    > = {
      openapi: '3.1',
      info: {
        'x-my-extension': 'plop',
        title: 'Test',
        version: '0.0.0',
      },
      paths: {},
    };

    expect(openAPI);
  });
});

describe('relativeReferenceToNamespace', () => {
  test('should work with supported refs', () => {
    expect(
      relativeReferenceToNamespace('#/components/parameters/TestParameter'),
    ).toMatchInlineSnapshot(`
[
  "components",
  "parameters",
  "TestParameter",
]
`);
    expect(relativeReferenceToNamespace('#/components/schemas/TestSchema'))
      .toMatchInlineSnapshot(`
[
  "components",
  "schemas",
  "TestSchema",
]
`);
  });

  test('should fail with unsupported refs', () => {
    try {
      relativeReferenceToNamespace(
        'http://example.com/#/components/parameters/TestParameter',
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[YError: E_UNSUPPORTED_REF (http://example.com/#/components/parameters/TestParameter): E_UNSUPPORTED_REF]`,
      );
    }
  });
});

describe('resolveNamespace', () => {
  test('should work with existing namespaces on openAPI', async () => {
    const resolved = await resolveNamespace(openAPI, [
      'components',
      'parameters',
      'TestParameter',
    ]);

    expect(resolved).toMatchInlineSnapshot(`
{
  "in": "query",
  "name": "test",
  "schema": {
    "$ref": "#/components/schemas/TestSchema",
  },
}
`);
  });

  test('should work with existing namespaces on jsonSchema', async () => {
    const resolved = await resolveNamespace(jsonSchema, ['$defs', 'test']);

    expect(resolved).toMatchInlineSnapshot(`true`);
  });
  test('should work with existing namespaces on expressiveJSONSchema', async () => {
    const resolved = await resolveNamespace(expressiveJSONSchema, [
      '$defs',
      'test',
    ]);

    expect(resolved).toMatchInlineSnapshot(`
{
  "type": "string",
}
`);
  });

  test('should fail with not existing namespace', async () => {
    try {
      await resolveNamespace(expressiveJSONSchema, ['$defs', 'test2']);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[YError: E_BAD_RESOLVE_PROP ($defs,test2, test2): E_BAD_RESOLVE_PROP]`,
      );
    }
  });

  test('should fail with bad destination', async () => {
    try {
      await resolveNamespace(expressiveJSONSchema, [
        '$defs',
        'fortest',
        'const',
      ]);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[YError: E_BAD_RESOLVE_PROP ($defs,fortest,const, fortest): E_BAD_RESOLVE_PROP]`,
      );
    }
  });
});

describe('ensureResolvedObject', () => {
  let resolvedParameter:
    | OpenAPIParameter<JSONSchema, OpenAPIExtension>
    | OpenAPIReference<OpenAPIParameter<JSONSchema, OpenAPIExtension>>;

  beforeAll(async () => {
    resolvedParameter = (await resolveNamespace(openAPI, [
      'components',
      'parameters',
      'TestParameter',
    ])) as OpenAPIParameter<JSONSchema, OpenAPIExtension>;
  });

  test('should work with existing namespaces on openAPI', async () => {
    const fullyResoved = await ensureResolvedObject(openAPI, resolvedParameter);

    expect(fullyResoved).toMatchInlineSnapshot(`
{
  "in": "query",
  "name": "test",
  "schema": {
    "$ref": "#/components/schemas/TestSchema",
  },
}
`);
  });

  test('should work with existing namespaces on openAPI 2', async () => {
    const fullyResoved = await ensureResolvedObject(openAPI, {
      $ref: '#/components/schemas/TestSchema',
    } as OpenAPIReference<JSONSchema>);

    expect(fullyResoved).toMatchInlineSnapshot(`
{
  "type": "string",
}
`);
  });

  test('should work with existing namespaces on jsonSchema', async () => {
    const fullyResoved = await ensureResolvedObject(jsonSchema, {
      $ref: '#/$defs/testAlias',
    });

    expect(fullyResoved).toMatchInlineSnapshot(`true`);
  });

  test('should fail with not existing namespace', async () => {
    try {
      await ensureResolvedObject(openAPI, {
        $ref: '#/components/schemas/NotTestSchema',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[YError: E_BAD_RESOLVE_PROP (components,schemas,NotTestSchema, NotTestSchema): E_BAD_RESOLVE_PROP]`,
      );
    }
  });

  test('should fail with bad destination', async () => {
    try {
      await ensureResolvedObject(openAPI, {
        $ref: '#/$defs/fortest/const',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[YError: E_BAD_RESOLVE_PROP ($defs,fortest,const, $defs): E_BAD_RESOLVE_PROP]`,
      );
    }
  });
});

describe('pathItemToOperationMap', () => {
  test('should work', async () => {
    const fullyResoved = await pathItemToOperationMap(
      openAPI.paths?.['/test'] || {},
    );

    expect(fullyResoved).toMatchInlineSnapshot(`
{
  "get": {
    "parameters": [
      {
        "$ref": "#/components/parameters/TestParameterAlias",
      },
    ],
  },
}
`);
  });
});

const sampleAPI: OpenAPI = {
  openapi: '3.1.0',
  info: {
    version: '8.2.0',
    title: '@whook/example',
    description: 'A basic Whook server',
  },
  servers: [{ url: 'http://localhost:8001/v8' }],
  paths: {
    '/delay': {
      get: {
        operationId: 'getDelay',
        summary: 'Answer after a given delay.',
        tags: ['example'],
        parameters: [{ $ref: '#/components/parameters/duration' }],
        responses: {
          '204': {
            description: 'Delay expired',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Recursive' },
              },
            },
          },
        },
      },
    },
  },
  webhooks: {
    echo: {
      put: {
        operationId: 'putEcho',
        summary: 'Echoes what it takes.',
        tags: ['example'],
        requestBody: {
          description: 'The input sentence',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Echo' },
              example: { echo: 'Repeat this!' },
            },
          },
        },
        responses: {
          '200': {
            description: 'The actual echo',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Echo' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TimeSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { currentDate: { type: 'string', format: 'date-time' } },
      },
      Echo: {
        type: 'object',
        required: ['echo'],
        additionalProperties: false,
        properties: { echo: { $ref: '#/components/schemas/AString' } },
      },
      Recursive: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: { child: { $ref: '#/components/schemas/Recursive' } },
      },
      AString: {
        type: 'string',
      },
    },
    parameters: {
      duration: {
        in: 'query',
        name: 'duration',
        required: true,
        description: 'Duration in milliseconds',
        schema: { type: 'number' },
      },
      pathParam1: {
        in: 'path',
        name: 'pathParam1',
        required: true,
        description: 'A number param',
        schema: { type: 'number' },
      },
      pathParam2: {
        in: 'path',
        name: 'pathParam2',
        required: true,
        description: 'A list of items',
        schema: { type: 'array', items: { type: 'string' } },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        description: 'Bearer authentication with a user API token',
        scheme: 'bearer',
      },
      fakeAuth: {
        type: 'apiKey',
        description: 'A fake authentication for development purpose.',
        name: 'Authorization',
        in: 'header',
      },
    },
  },
  tags: [{ name: 'system' }],
};

describe('collectUsedReferences', () => {
  test('should collect all refs in an OpenAPI document', async () => {
    expect(
      await collectUsedReferences(
        sampleAPI as unknown as JsonObject,
        sampleAPI.paths as unknown as JsonValue,
      ),
    ).toMatchInlineSnapshot(`
[
  "#/components/parameters/duration",
  "#/components/schemas/Recursive",
]
`);
    expect(
      await collectUsedReferences(
        sampleAPI as unknown as JsonObject,
        sampleAPI.webhooks as unknown as JsonValue,
      ),
    ).toMatchInlineSnapshot(`
[
  "#/components/schemas/Echo",
  "#/components/schemas/AString",
]
`);
  });
});

describe('cleanupOpenAPI', () => {
  test('should remove unused refs in an OpenAPI document', async () => {
    expect(await cleanupOpenAPI(sampleAPI)).toMatchInlineSnapshot(`
{
  "components": {
    "parameters": {
      "duration": {
        "description": "Duration in milliseconds",
        "in": "query",
        "name": "duration",
        "required": true,
        "schema": {
          "type": "number",
        },
      },
    },
    "schemas": {
      "AString": {
        "type": "string",
      },
      "Echo": {
        "additionalProperties": false,
        "properties": {
          "echo": {
            "$ref": "#/components/schemas/AString",
          },
        },
        "required": [
          "echo",
        ],
        "type": "object",
      },
      "Recursive": {
        "additionalProperties": false,
        "properties": {
          "child": {
            "$ref": "#/components/schemas/Recursive",
          },
        },
        "required": [],
        "type": "object",
      },
    },
    "securitySchemes": {
      "bearerAuth": {
        "description": "Bearer authentication with a user API token",
        "scheme": "bearer",
        "type": "http",
      },
      "fakeAuth": {
        "description": "A fake authentication for development purpose.",
        "in": "header",
        "name": "Authorization",
        "type": "apiKey",
      },
    },
  },
  "info": {
    "description": "A basic Whook server",
    "title": "@whook/example",
    "version": "8.2.0",
  },
  "openapi": "3.1.0",
  "paths": {
    "/delay": {
      "get": {
        "operationId": "getDelay",
        "parameters": [
          {
            "$ref": "#/components/parameters/duration",
          },
        ],
        "responses": {
          "204": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Recursive",
                },
              },
            },
            "description": "Delay expired",
          },
        },
        "summary": "Answer after a given delay.",
        "tags": [
          "example",
        ],
      },
    },
  },
  "servers": [
    {
      "url": "http://localhost:8001/v8",
    },
  ],
  "tags": [
    {
      "name": "system",
    },
  ],
  "webhooks": {
    "echo": {
      "put": {
        "operationId": "putEcho",
        "requestBody": {
          "content": {
            "application/json": {
              "example": {
                "echo": "Repeat this!",
              },
              "schema": {
                "$ref": "#/components/schemas/Echo",
              },
            },
          },
          "description": "The input sentence",
          "required": true,
        },
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Echo",
                },
              },
            },
            "description": "The actual echo",
          },
        },
        "summary": "Echoes what it takes.",
        "tags": [
          "example",
        ],
      },
    },
  },
}
`);
  });
});
