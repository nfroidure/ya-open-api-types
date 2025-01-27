import { describe, test, expect } from '@jest/globals';
import { type OpenAPI } from './index.js';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';

// TODO: Find a way to tests types
describe('JSONSchema', () => {
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
