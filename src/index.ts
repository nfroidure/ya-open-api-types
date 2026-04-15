import { type JsonObject, type JsonValue } from 'type-fest';
import {
  type ExpressiveJSONSchema,
  type JSONSchema,
} from 'ya-json-schema-types';
import { YError } from 'yerror';
import {
  PATH_SEPARATOR,
  type OpenAPIPath,
  isValidOpenAPIPath,
  PATH_ITEM_METHODS,
  type OpenAPIMethod,
  isValidOpenAPIMethod,
} from './lib.js';

export {
  PATH_SEPARATOR,
  type OpenAPIPath,
  isValidOpenAPIPath,
  PATH_ITEM_METHODS,
  type OpenAPIMethod,
  isValidOpenAPIMethod,
};

/**
 * Default generic types matching specification extensions
 */
export type OpenAPIExtension = Record<`x-${string}`, JsonValue>;
/** Branded type for strings that may contain common mark syntax */
export type OpenAPIDescription = string & {
  _type?: 'oas:description';
};
/** Branded type for media types */
export type OpenAPIMediaTypeValue = string & {
  _type?: 'oas:media-type';
};
/** Branded type for path templates */
export type OpenAPIPathTemplate = string & {
  _type?: 'oas:path-template';
};
/** Branded type for urls */
export type OpenAPIURL = string & {
  _type?: 'oas:url';
};
/** Branded type for expressions */
export type OpenAPIExpression = string & {
  _type?: 'oas:expression';
};
/** Branded type for email */
export type OpenAPIEmail = string & {
  _type?: 'oas:email';
};
/** Branded type for status codes */
export type OpenAPIStatusCode = number & {
  _type?: 'oas:status-code';
};
export type OpenAPIExample<T extends JsonValue = JsonValue> = {
  summary?: string;
  description?: OpenAPIDescription;
} & (
  | {
      value: T;
    }
  | {
      externalValue: string;
    }
);
export type OpenAPIExternalDocumentation<X extends OpenAPIExtension> = {
  url: OpenAPIURL;
  description?: OpenAPIDescription;
} & X;
export type OpenAPITag<X extends OpenAPIExtension> = {
  name: string;
  description?: OpenAPIDescription;
  externalDocs?: OpenAPIExternalDocumentation<X>;
} & X;
export type OpenAPIContact<X extends OpenAPIExtension> = {
  name?: string;
  url?: OpenAPIURL;
  email?: OpenAPIEmail;
} & X;
export type OpenAPILicense<X extends OpenAPIExtension> = {
  name?: string;
  identifier?: string;
  url?: OpenAPIURL;
} & X;
export type OpenAPIInfo<X extends OpenAPIExtension> = {
  title: string;
  summary?: string;
  description?: OpenAPIDescription;
  termsOfService?: string;
  contact?: OpenAPIContact<X>;
  license?: OpenAPILicense<X>;
  version: string;
} & X;
export type OpenAPIServerVariable<X extends OpenAPIExtension> = {
  enum?: string[];
  default: string;
  description?: OpenAPIDescription;
} & X;
export type OpenAPIServer<X extends OpenAPIExtension> = {
  url: OpenAPIURL;
  description?: OpenAPIDescription;
  variables?: Record<string, OpenAPIServerVariable<X>>;
} & X;
export type OpenAPIReferenceable<D, X extends OpenAPIExtension> =
  | OpenAPIHeader<D, X>
  | OpenAPIResponse<D, X>
  | OpenAPIRequestBody<D, X>
  | OpenAPIParameter<D, X>
  | OpenAPIPathItem<D, X>
  | OpenAPIMediaType<D, X>
  | OpenAPIExample
  | OpenAPILink<X>
  | OpenAPICallback<D, X>
  | OpenAPISecurityScheme<X>
  | D;
export interface OpenAPIReference<
  T extends OpenAPIReferenceable<unknown, OpenAPIExtension>,
> {
  $ref: string;
  _targetType?: T;
}
export type OpenAPIEncoding<D, X extends OpenAPIExtension> = {
  contentType?: string;
  headers?: Record<
    string,
    OpenAPIReference<OpenAPIHeader<D, X>> | OpenAPIHeader<D, X>
  >;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
} & X;
export type OpenAPIMediaType<D, X extends OpenAPIExtension> = {
  schema?: D;
  example?: JsonValue;
  examples?: JsonValue[];
  encoding?: Record<string, OpenAPIEncoding<D, X>>;
} & X;
export type OpenAPIResponses<D, X extends OpenAPIExtension> = Record<
  string,
  OpenAPIResponse<D, X> | OpenAPIReference<OpenAPIResponse<D, X>>
> &
  X;
export type OpenAPIResponse<D, X extends OpenAPIExtension> = {
  description?: OpenAPIDescription;
  headers?: Record<
    string,
    OpenAPIReference<OpenAPIHeader<D, X>> | OpenAPIHeader<D, X>
  >;
  links?: Record<string, OpenAPILink<X> | OpenAPIReference<OpenAPILink<X>>>;
  content?: Record<string, OpenAPIMediaType<D, X>>;
} & X;
export type OpenAPIParameter<D, X extends OpenAPIExtension> = {
  name: string;
  description?: OpenAPIDescription;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
} & (
  | {
      in: 'path' | 'query' | 'querystring' | 'header' | 'cookie';
      required?: boolean;
    }
  | {
      in: 'path';
      required: true;
    }
) &
  (
    | {
        schema: D;
        style?:
          | 'matrix'
          | 'label'
          | 'simple'
          | 'form'
          | 'spaceDelimited'
          | 'pipeDelimited'
          | 'deepObject';
        explode?: boolean;
        allowReserved?: boolean;
        example?: JsonValue;
        examples?: Record<
          string,
          OpenAPIExample | OpenAPIReference<OpenAPIExample>
        >;
      }
    | {
        content: Record<string, OpenAPIMediaType<D, X>>;
      }
  ) &
  X;
export type OpenAPIRequestBody<D, X extends OpenAPIExtension> = {
  description?: OpenAPIDescription;
  content: Record<string, OpenAPIMediaType<D, X>>;
  required?: boolean;
} & X;
export type OpenAPIHeader<D, X extends OpenAPIExtension> = {
  description?: OpenAPIDescription;
  required?: boolean;
  deprecated?: boolean;
} & (
  | {
      schema: D;
      style?: 'simple';
      explode?: boolean;
      allowReserved?: boolean;
      example?: JsonValue;
      examples?: Record<
        string,
        OpenAPIExample | OpenAPIReference<OpenAPIExample>
      >;
    }
  | {
      content: Record<string, OpenAPIMediaType<D, X>>;
    }
) &
  X;
export type OpenAPIOAuthFlow<X extends OpenAPIExtension, F extends string> = {
  refreshUrl?: OpenAPIURL;
  scopes: Record<string, string>;
} & (F extends 'implicit' | 'authorizationCode'
  ? {
      authorizationUrl: OpenAPIURL;
    }
  : {
      authorizationUrl?: OpenAPIURL;
    }) &
  (F extends 'password' | 'clientCredentials' | 'authorizationCode'
    ? {
        tokenUrl: OpenAPIURL;
      }
    : {
        tokenUrl?: OpenAPIURL;
      }) &
  X;
export interface OpenAPIOAuthFlows<X extends OpenAPIExtension> {
  implicit?: OpenAPIOAuthFlow<X, 'implicit'>;
  password?: OpenAPIOAuthFlow<X, 'password'>;
  clientCredentials?: OpenAPIOAuthFlow<X, 'clientCredentials'>;
  authorizationCode?: OpenAPIOAuthFlow<X, 'authorizationCode'>;
}
export type OpenAPISecurityRequirement = Record<string, string[]>;
export type OpenAPISecurityScheme<X extends OpenAPIExtension> = {
  description?: OpenAPIDescription;
  type: string;
} & (
  | {
      type: 'apiKey';
      name: string;
      in: 'query' | 'header' | 'cookie';
    }
  | ({
      type: 'http';
    } & (
      | {
          scheme: 'bearer';
          bearerFormat?: string;
        }
      | {
          scheme: string;
        }
    ))
  | {
      type: 'mutualTLS';
    }
  | {
      type: 'oauth2';
      flows: OpenAPIOAuthFlows<X>;
    }
  | {
      type: 'openIdConnect';
      openIdConnectUrl: string;
    }
) &
  X;
export type OpenAPILink<X extends OpenAPIExtension> = (
  | {
      operationRef?: string;
    }
  | {
      operationId?: string;
    }
) & {
  parameters?: Record<string, JsonValue | OpenAPIExpression>;
  requestBody?: JsonValue | OpenAPIExpression;
  description?: OpenAPIDescription;
  server?: OpenAPIServer<X>;
} & X;
export type OpenAPICallback<D, X extends OpenAPIExtension> = Record<
  OpenAPIExpression,
  OpenAPIPathItem<D, X>
> &
  X;
export type OpenAPIPathItem<D, X extends OpenAPIExtension> = {
  $ref?: string;
  summary?: string;
  description?: string;
  additionalOperations?: Record<string, OpenAPIOperation<D, X>>;
  servers?: OpenAPIServer<X>[];
  parameters?: (
    | OpenAPIParameter<D, X>
    | OpenAPIReference<OpenAPIParameter<D, X>>
  )[];
} & Partial<Record<OpenAPIMethod, OpenAPIOperation<D, X>>> &
  X;
export type OpenAPIOperation<D, X extends OpenAPIExtension> = {
  tags?: string[];
  summary?: string;
  description?: OpenAPIDescription;
  externalDocs?: OpenAPIExternalDocumentation<X>;
  operationId?: string;
  parameters?: (
    | OpenAPIParameter<D, X>
    | OpenAPIReference<OpenAPIParameter<D, X>>
  )[];
  requestBody?:
    | OpenAPIRequestBody<D, X>
    | OpenAPIReference<OpenAPIRequestBody<D, X>>;
  responses?: OpenAPIResponses<D, X>;
  callbacks?: Record<
    string,
    OpenAPICallback<D, X> | OpenAPIReference<OpenAPICallback<D, X>>
  >;
  deprecated?: boolean;
  security?: OpenAPISecurityRequirement[];
  servers?: OpenAPIServer<X>[];
} & X;
export type OpenAPIComponents<D, X extends OpenAPIExtension> = {
  schemas?: Record<string, D>;
  responses?: Record<
    string,
    OpenAPIResponse<D, X> | OpenAPIReference<OpenAPIResponse<D, X>>
  >;
  parameters?: Record<
    string,
    OpenAPIParameter<D, X> | OpenAPIReference<OpenAPIParameter<D, X>>
  >;
  examples?: Record<string, OpenAPIExample | OpenAPIReference<OpenAPIExample>>;
  requestBodies?: Record<
    string,
    OpenAPIRequestBody<D, X> | OpenAPIReference<OpenAPIRequestBody<D, X>>
  >;
  headers?: Record<
    string,
    OpenAPIHeader<D, X> | OpenAPIReference<OpenAPIHeader<D, X>>
  >;
  securitySchemes?: Record<
    string,
    OpenAPISecurityScheme<X> | OpenAPIReference<OpenAPISecurityScheme<X>>
  >;
  links?: Record<string, OpenAPILink<X> | OpenAPIReference<OpenAPILink<X>>>;
  callbacks?: Record<
    string,
    OpenAPICallback<D, X> | OpenAPIReference<OpenAPICallback<D, X>>
  >;
  pathItems?: Record<string, OpenAPIPathItem<D, X>>;
} & X;

export type OpenAPIPaths<D, X extends OpenAPIExtension> = Record<
  OpenAPIPath,
  OpenAPIPathItem<D, X>
>;

/** Open API types for the 3.2 specification */
export interface OpenAPI<
  D = JSONSchema,
  X extends OpenAPIExtension = OpenAPIExtension,
> {
  openapi: '3.1' | '3.1.0' | '3.1.1' | '3.2';
  info: OpenAPIInfo<X>;
  jsonSchemaDialect?: string;
  servers?: OpenAPIServer<X>[];
  paths?: OpenAPIPaths<D, X>;
  webhooks?: Record<string, OpenAPIPathItem<D, X>>;
  components?: OpenAPIComponents<D, X>;
  security?: OpenAPISecurityRequirement[];
  tags?: OpenAPITag<X>[];
  externalDocs?: OpenAPIComponents<D, X>;
}

export function relativeReferenceToNamespace(ref: string): string[] {
  if (!ref.startsWith('#/')) {
    throw new YError('E_UNSUPPORTED_REF', [ref]);
  }

  const namespace = ref.replace(/^#\//, '').split('/');

  if (namespace.some((name) => name === '')) {
    throw new YError('E_BAD_REF', [ref, namespace]);
  }

  return namespace;
}

export async function resolveNamespace<T extends OpenAPI>(
  root: T,
  namespace: string[],
): Promise<
  T extends OpenAPI<infer D, infer X>
    ? OpenAPIReferenceable<D, X> | OpenAPIReference<OpenAPIReferenceable<D, X>>
    : never
>;
export async function resolveNamespace<T extends ExpressiveJSONSchema>(
  root: T,
  namespace: string[],
): Promise<ExpressiveJSONSchema>;
export async function resolveNamespace<T extends JSONSchema>(
  root: T,
  namespace: string[],
): Promise<JSONSchema>;
export async function resolveNamespace<T extends object>(
  root: T,
  namespace: string[],
): Promise<unknown>;
export async function resolveNamespace<T extends object>(
  root: T,
  namespace: string[],
): Promise<unknown> {
  let resolved = root;

  for (const name of namespace) {
    if (typeof resolved !== 'object' || !resolved) {
      throw new YError('E_BAD_RESOLVE_BASE', [namespace, name]);
    }
    if (!(name in resolved)) {
      throw new YError('E_BAD_RESOLVE_PROP', [namespace, name]);
    }

    resolved = (resolved as Record<string, T>)[name];
  }

  if (typeof resolved === 'undefined' || resolved === null) {
    throw new YError('E_BAD_RESOLVE_LEAF', [namespace]);
  }

  return resolved as T extends OpenAPI<infer D, infer X>
    ? OpenAPIReferenceable<D, X>
    : T;
}

export async function ensureResolvedObject<
  T extends OpenAPI<unknown, OpenAPIExtension>,
  U extends
    | OpenAPIReference<unknown>
    | OpenAPIReferenceable<unknown, OpenAPIExtension>,
>(root: T, object: U): Promise<U extends OpenAPIReference<infer R> ? R : U>;
export async function ensureResolvedObject<
  T extends OpenAPI<unknown, OpenAPIExtension>,
  U,
>(
  root: T,
  object: U,
): Promise<
  T extends OpenAPI<infer D, infer X> ? OpenAPIReferenceable<D, X> : never
>;
export async function ensureResolvedObject<
  T extends ExpressiveJSONSchema,
  U extends ExpressiveJSONSchema,
>(root: T, object: U): Promise<ExpressiveJSONSchema>;
export async function ensureResolvedObject<
  T extends JSONSchema,
  U extends JSONSchema,
>(root: T, object: U): Promise<JSONSchema>;
export async function ensureResolvedObject<T extends object, U extends object>(
  root: T,
  object: U,
): Promise<unknown>;
export async function ensureResolvedObject<T extends object, U extends object>(
  root: T,
  object: U,
): Promise<unknown> {
  let resolvedObject = object;

  while (
    typeof resolvedObject === 'object' &&
    resolvedObject &&
    '$ref' in resolvedObject
  ) {
    resolvedObject = (await resolveNamespace(
      root,
      relativeReferenceToNamespace(resolvedObject.$ref as string),
    )) as unknown as U;
  }

  return resolvedObject;
}

export function pathItemToOperationMap<
  T extends OpenAPIPathItem<unknown, OpenAPIExtension>,
>(
  pathItem: T,
): Partial<
  Record<
    OpenAPIMethod,
    T extends OpenAPIPathItem<infer D, infer X> ? OpenAPIOperation<D, X> : never
  >
> {
  const operationMap: Partial<
    Record<
      OpenAPIMethod,
      T extends OpenAPIPathItem<infer D, infer X>
        ? OpenAPIOperation<D, X>
        : never
    >
  > = {};

  for (const method of PATH_ITEM_METHODS) {
    if (method in pathItem && pathItem[method]) {
      operationMap[method] = pathItem[method] as T extends OpenAPIPathItem<
        infer D,
        infer X
      >
        ? OpenAPIOperation<D, X>
        : never;
    }
  }

  return operationMap;
}

type ComponentType = keyof NonNullable<OpenAPI['components']>;

export const COMPONENTS_TYPES: ComponentType[] = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'requestBodies',
  'headers',
];

export async function cleanupOpenAPI<T extends OpenAPI>(api: T): Promise<T> {
  const usedReferences = [
    ...new Set([
      ...(await collectUsedReferences(
        api as unknown as JsonObject,
        (api.paths || {}) as JsonValue,
      )),
      ...(await collectUsedReferences(
        api as unknown as JsonObject,
        (api.webhooks || {}) as JsonValue,
      )),
    ]),
  ];

  return {
    ...api,
    components: {
      ...(Object.keys(api?.components || {}) as ComponentType[]).reduce(
        (cleanedComponents, componentType) => ({
          ...cleanedComponents,
          [componentType]: COMPONENTS_TYPES.includes(componentType)
            ? Object.keys(api?.components?.[componentType] || {})
                .filter((key) =>
                  usedReferences.includes(
                    `#/components/${componentType}/${key}`,
                  ),
                )
                .reduce(
                  (cleanedComponents, key) => ({
                    ...cleanedComponents,
                    [key]: (
                      api.components?.[componentType] as Record<string, string>
                    )?.[key],
                  }),
                  {},
                )
            : api.components?.[componentType],
        }),
        {},
      ),
    },
  };
}

/** Collect all really used references in a JSON
 * using references */
export async function collectUsedReferences(
  rootNode: JsonObject,
  node: JsonValue,
  usedReferences: string[] = [],
) {
  if (
    typeof node === 'boolean' ||
    typeof node === 'string' ||
    typeof node === 'number'
  ) {
    return usedReferences;
  }

  if (node instanceof Array) {
    for (const item of node) {
      usedReferences = await collectUsedReferences(
        rootNode,
        item,
        usedReferences,
      );
    }
    return usedReferences;
  }

  if (typeof node === 'object') {
    if (node === null) {
      return usedReferences;
    }
    const keys = Object.keys(node);

    if (
      '$ref' in node &&
      typeof node.$ref === 'string' &&
      !usedReferences.includes(node.$ref)
    ) {
      const referencedObject = (await resolveNamespace(
        rootNode,
        relativeReferenceToNamespace(node.$ref),
      )) as JsonValue;

      usedReferences.push(node.$ref);
      usedReferences = await collectUsedReferences(
        rootNode,
        referencedObject,
        usedReferences,
      );
    }

    for (const key of keys) {
      if (key === '$ref') {
        continue;
      }
      usedReferences = await collectUsedReferences(
        rootNode,
        node[key] || null,
        usedReferences,
      );
    }
    return usedReferences;
  }

  return usedReferences;
}

export type SchemaPathItemLocation =
  | {
      path: OpenAPIPath;
    }
  | {
      webhookName: string;
    };
export type SchemaOperationLocation = SchemaPathItemLocation &
  (
    | {
        customMethod: string;
      }
    | {
        method: OpenAPIMethod;
      }
  ) & {
    callbacks?: {
      callbackName: string;
      callbackExpression: string;
    }[];
  };
export type SchemaSchemaLocation = (
  | SchemaOperationLocation
  | {
      components: 'schemas';
    }
) & { schemaName: string };
export type SchemaParameterLocation = (
  | SchemaPathItemLocation
  | SchemaOperationLocation
  | {
      components: 'parameters';
    }
) & {
  parameterName: string;
};
export type SchemaHeaderLocation = (
  | SchemaOperationLocation
  | {
      components: 'headers';
    }
) & {
  headerName: string;
};
export type SchemaResponseLocation = (
  | SchemaOperationLocation
  | {
      components: 'responses';
    }
) & {
  responseName: string;
  responseType: string;
};
export type SchemaRequestBodyLocation = (
  | SchemaOperationLocation
  | {
      components: 'requestBodies';
    }
) & {
  requestBodyName: string;
  requestBodyType: string;
};
export type SchemaLocation =
  | SchemaSchemaLocation
  | SchemaParameterLocation
  | SchemaHeaderLocation
  | SchemaResponseLocation
  | SchemaRequestBodyLocation;

/**
 * In order to build validators from all schemas,
 * we often need to collect each schemas of an API.
 */
export function collectAPISchemas<T extends JSONSchema>(
  API: OpenAPI<T>,
): {
  schema: T;
  location: SchemaLocation;
}[] {
  return [
    ...(API?.components?.schemas
      ? Object.keys(API.components.schemas).map((schemaName) => ({
          schema: API.components?.schemas?.[schemaName] as T,
          location: {
            components: 'schemas',
            schemaName,
          } as SchemaLocation,
        }))
      : []),
    ...collectHeadersSchemas(
      { components: 'headers' },
      API?.components?.headers,
    ),
    ...collectParametersSchemas(
      { components: 'parameters' },
      Object.values(API?.components?.parameters || {}),
    ),
    ...collectRequestBodiesSchemas(
      { components: 'requestBodies' },
      API?.components?.requestBodies,
    ),
    ...collectResponsesSchemas(
      { components: 'responses' },
      API?.components?.responses,
    ),
    ...collectPathsSchemas(API?.paths || {}),
    ...collectWebHooksSchemas(API?.webhooks || {}),
  ];
}

export function collectPathsSchemas<T extends JSONSchema>(
  paths: NonNullable<OpenAPI<T>['paths']>,
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const path in paths) {
    if (!isValidOpenAPIPath(path)) {
      throw new YError('E_BAD_PATH', [path]);
    }

    schemas.push(
      ...collectParametersSchemas(
        {
          path,
        },
        paths[path].parameters,
      ),
    );

    schemas.push(
      ...collectPathItemSchemas(
        {
          path,
        },
        paths[path],
      ),
    );
  }

  return schemas;
}

export function collectWebHooksSchemas<T extends JSONSchema>(
  webhooks: NonNullable<OpenAPI<T>['webhooks']>,
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const webhookName in webhooks) {
    schemas.push(
      ...collectParametersSchemas(
        {
          webhookName,
        },
        webhooks[webhookName].parameters,
      ),
    );

    schemas.push(
      ...collectPathItemSchemas(
        {
          webhookName,
        },
        webhooks[webhookName],
      ),
    );
  }

  return schemas;
}

export function collectPathItemSchemas<T extends JSONSchema>(
  location: SchemaPathItemLocation,
  pathItem: NonNullable<NonNullable<OpenAPI<T>['paths']>[OpenAPIPath]>,
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const method in pathItemToOperationMap(pathItem)) {
    if (!isValidOpenAPIMethod(method)) {
      throw new YError('E_BAD_METHOD', [
        'path' in location ? location.path : location.webhookName,
        method,
      ]);
    }

    const operation = pathItem[method];
    const operationId = operation?.operationId;

    if (!operationId) {
      throw new YError('E_NO_OPERATION_ID', [
        'path' in location ? location.path : location.webhookName,
        method,
      ]);
    }

    schemas.push(
      ...collectOperationSchemas<T>({ ...location, method }, operation),
    );
  }

  if (pathItem.additionalOperations) {
    for (const customMethod in pathItem.additionalOperations) {
      const operation = pathItem.additionalOperations[customMethod];
      const operationId = operation?.operationId;

      if (!operationId) {
        throw new YError('E_NO_OPERATION_ID', [
          'path' in location ? location.path : location.webhookName,
          customMethod,
        ]);
      }

      schemas.push(
        ...collectOperationSchemas<T>({ ...location, customMethod }, operation),
      );
    }
  }

  return schemas;
}

export function collectOperationSchemas<T extends JSONSchema>(
  location: SchemaOperationLocation,
  operation: NonNullable<
    NonNullable<NonNullable<OpenAPI<T>['paths']>[OpenAPIPath]>[OpenAPIMethod]
  >,
): {
  schema: T;
  location: SchemaLocation;
}[] {
  return [
    ...collectParametersSchemas(location, operation.parameters),
    ...(operation.requestBody
      ? collectRequestBodiesSchemas(location, {
          body: operation.requestBody,
        })
      : []),
    ...collectResponsesSchemas(location, operation.responses),
  ];
}

export function collectOperationCallbacksSchemas<T extends JSONSchema>(
  location: SchemaOperationLocation,
  callbacks: NonNullable<
    NonNullable<
      NonNullable<NonNullable<OpenAPI<T>['paths']>[OpenAPIPath]>[OpenAPIMethod]
    >['callbacks']
  >,
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const callbackName in callbacks) {
    const callback = callbacks[callbackName];

    if ('$ref' in callback) {
      continue;
    }
    for (const callbackExpression in callback) {
      schemas.push(
        ...collectPathItemSchemas(
          {
            ...location,
            callbacks: [
              {
                callbackName,
                callbackExpression,
              },
            ],
          } as SchemaOperationLocation,
          callback[callbackExpression],
        ),
      );
    }
  }

  return schemas;
}

export function collectParametersSchemas<T extends JSONSchema>(
  location: Omit<SchemaParameterLocation, 'parameterName'>,
  parameters: NonNullable<
    NonNullable<OpenAPI<T>['components']>['parameters']
  >[string][] = [],
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const parameter of parameters) {
    if ('$ref' in parameter) {
      continue;
    }

    if ('schema' in parameter) {
      schemas.push({
        location: {
          ...location,
          parameterName: parameter.name,
        } as SchemaParameterLocation,
        schema: parameter.schema,
      });
    }
  }

  return schemas;
}

export function collectHeadersSchemas<T extends JSONSchema>(
  location: Omit<SchemaHeaderLocation, 'headerName'>,
  headers: NonNullable<NonNullable<OpenAPI<T>['components']>['headers']> = {},
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const headerName in headers) {
    const header = headers[headerName];

    if ('$ref' in header) {
      continue;
    }

    if ('schema' in header) {
      schemas.push({
        location: {
          ...location,
          headerName,
        } as SchemaHeaderLocation,
        schema: header.schema,
      });
    }
  }

  return schemas;
}

export function collectRequestBodiesSchemas<T extends JSONSchema>(
  location: Omit<
    SchemaRequestBodyLocation,
    'requestBodyName' | 'requestBodyType'
  >,
  requestBodies: NonNullable<
    NonNullable<OpenAPI<T>['components']>['requestBodies']
  > = {},
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const requestBodyName in requestBodies) {
    const requestBody = requestBodies[requestBodyName];

    if ('$ref' in requestBody) {
      continue;
    }

    for (const requestBodyType in requestBody.content) {
      const requestBodyContent = requestBody.content[requestBodyType];

      if (
        !requestBodyContent ||
        !('schema' in requestBodyContent) ||
        typeof requestBodyContent.schema === 'undefined'
      ) {
        continue;
      }

      schemas.push({
        location: {
          ...location,
          requestBodyName,
          requestBodyType,
        } as SchemaRequestBodyLocation,
        schema: requestBodyContent.schema,
      });
    }
  }
  return schemas;
}

export function collectResponsesSchemas<T extends JSONSchema>(
  location: Omit<SchemaResponseLocation, 'responseName' | 'responseType'>,
  responses: NonNullable<
    NonNullable<OpenAPI<T>['components']>['responses']
  > = {},
) {
  const schemas: {
    schema: T;
    location: SchemaLocation;
  }[] = [];

  for (const responseName in responses) {
    const response = responses[responseName];

    if ('$ref' in response) {
      continue;
    }

    for (const responseType in response.content) {
      const responseContent = response.content[responseType];

      if (
        !responseContent ||
        !('schema' in responseContent) ||
        typeof responseContent.schema === 'undefined'
      ) {
        continue;
      }

      schemas.push({
        location: {
          ...location,
          responseName,
          responseType,
        } as SchemaResponseLocation,
        schema: responseContent.schema,
      });
    }
  }
  return schemas;
}
