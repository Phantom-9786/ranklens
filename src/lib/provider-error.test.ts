import { expect, it } from 'vitest';
import { providerErrorMessage } from './provider-error';
it('categorizes quota, access, model and invalid-request failures without exposing metadata', () => {
  expect(providerErrorMessage({ statusCode: 429, responseBody: 'secret' })).toContain('quota');
  expect(providerErrorMessage({ cause: { statusCode: 403 } })).toContain('permissions');
  expect(providerErrorMessage({ lastError: { statusCode: 404 } })).toContain('model');
  expect(providerErrorMessage({ statusCode: 400 })).toContain('configuration');
  expect(providerErrorMessage(new Error('secret'))).not.toContain('secret');
});
