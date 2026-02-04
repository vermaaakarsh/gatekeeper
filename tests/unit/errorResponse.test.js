import { describe, it, expect } from 'vitest';
import { errorResponse } from '../../src/lib/error.js';

describe('errorResponse', () => {
  it('creates a standard error shape', () => {
    const err = errorResponse('TEST', 'Something failed');

    expect(err).toEqual({
      error: {
        code: 'TEST',
        message: 'Something failed',
      },
    });
  });

  it('includes details when provided', () => {
    const err = errorResponse('TEST', 'Fail', { a: 1 });

    expect(err.error.details).toEqual({ a: 1 });
  });
});
