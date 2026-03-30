export const PATH_SEPARATOR = '/';

export function isValidOpenAPIPath(path: string): path is OpenAPIPath {
  return path.startsWith(PATH_SEPARATOR);
}

export type OpenAPIPath = `${typeof PATH_SEPARATOR}${string}`;

export const PATH_ITEM_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

export type OpenAPIMethod = (typeof PATH_ITEM_METHODS)[number];

export function isValidOpenAPIMethod(method: string): method is OpenAPIMethod {
  return PATH_ITEM_METHODS.includes(method as OpenAPIMethod);
}
