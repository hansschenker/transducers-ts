import { describe, expect, it } from 'vitest';
import { composeT, mapT, takeT, toIterable } from '../src/index.js';

describe('Iterable adapter', () => {
  it('terminates an infinite generator exactly when Reduced is produced', () => {
    let pulled = 0;
    let closed = false;

    function* source(): Generator<number> {
      try {
        let value = 0;
        while (true) {
          pulled += 1;
          yield value;
          value += 1;
        }
      } finally {
        closed = true;
      }
    }

    const output = [
      ...toIterable(
        source(),
        composeT(
          mapT((value: number) => value * 2),
          takeT<number>(5),
        ),
      ),
    ];

    expect(output).toEqual([0, 2, 4, 6, 8]);
    expect(pulled).toBe(5);
    expect(closed).toBe(true);
  });
});
