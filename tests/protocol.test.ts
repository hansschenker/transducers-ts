import { describe, expect, it } from 'vitest';
import {
  INIT,
  REDUCED,
  RESULT,
  STEP,
  VALUE,
  ensureReduced,
  isReduced,
  reduced,
  transformer,
  unreduced,
} from '../src/index.js';

describe('classical protocol', () => {
  it('uses the established @@transducer protocol keys', () => {
    expect(INIT).toBe('@@transducer/init');
    expect(STEP).toBe('@@transducer/step');
    expect(RESULT).toBe('@@transducer/result');
    expect(REDUCED).toBe('@@transducer/reduced');
    expect(VALUE).toBe('@@transducer/value');
  });

  it('represents early termination structurally', () => {
    const stop = reduced(42);
    expect(isReduced(stop)).toBe(true);
    expect(stop[VALUE]).toBe(42);
    expect(unreduced(stop)).toBe(42);
    expect(ensureReduced(stop)).toBe(stop);
  });

  it('builds protocol-compatible transformers from functions', () => {
    const sum = transformer<number, number>({
      init: () => 0,
      step: (result, value) => result + value,
    });

    expect(sum[INIT]()).toBe(0);
    expect(sum[STEP](2, 3)).toBe(5);
    expect(sum[RESULT](5)).toBe(5);
  });
});
