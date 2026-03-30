import { describe, test, expect } from '@jest/globals';
import { isValidOpenAPIMethod, isValidOpenAPIPath } from './lib.js';

describe('isValidOpenAPIPath', () => {
  test('should work with good paths', () => {
    expect(isValidOpenAPIPath('/yop/ee')).toBeTruthy();
    expect(isValidOpenAPIPath('/')).toBeTruthy();
  });
  test('should work with bad paths', () => {
    expect(isValidOpenAPIPath('yop/ee')).toBeFalsy();
    expect(isValidOpenAPIPath('')).toBeFalsy();
  });
});

describe('isValidOpenAPIMethod', () => {
  test('should work with good methods', () => {
    expect(isValidOpenAPIMethod('post')).toBeTruthy();
  });
  test('should work with bad methods', () => {
    expect(isValidOpenAPIMethod('ost')).toBeFalsy();
    expect(isValidOpenAPIMethod('')).toBeFalsy();
    expect(isValidOpenAPIMethod('POST')).toBeFalsy();
  });
});
