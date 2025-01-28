import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  resolveNamespace,
  relativeReferenceToNamespace,
  type OpenAPI,
  OpenAPIParameter,
  OpenAPIExtension,
  ensureResolvedObject,
  OpenAPIReference,
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
  let resolvedParameter: OpenAPIParameter<JSONSchema, OpenAPIExtension>;

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
