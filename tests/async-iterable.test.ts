import { describe, expect, it } from 'vitest';
import {
  composeT,
  filterT,
  intoArrayAsync,
  mapT,
  takeT,
} from '../src/index.js';

describe('AsyncIterable adapter', () => {
  it('lets the source own time while the transducer remains synchronous', async () => {
    let closed = false;

    async function* source(): AsyncGenerator<number> {
      try {
        for (let value = 1; value <= 100; value += 1) {
          await Promise.resolve();
          yield value;
        }
      } finally {
        closed = true;
      }
    }

    const xform = composeT(
      mapT((value: number) => value * 2),
      filterT((value) => value % 4 === 0),
      takeT<number>(3),
    );

    await expect(intoArrayAsync(source(), xform)).resolves.toEqual([4, 8, 12]);
    expect(closed).toBe(true);
  });
});
