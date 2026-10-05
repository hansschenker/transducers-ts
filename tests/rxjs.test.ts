import { describe, expect, it } from 'vitest';
import { Observable, firstValueFrom, toArray } from 'rxjs';
import { composeT, mapT, takeT } from '../src/index.js';
import { transduce } from '../src/rxjs/index.js';

describe('RxJS 7.8.2 adapter', () => {
  it('creates independent transducer state per subscription', async () => {
    const source = new Observable<number>((subscriber) => {
      subscriber.next(1);
      subscriber.next(2);
      subscriber.next(3);
      subscriber.complete();
    });

    const output = source.pipe(
      transduce(composeT(mapT((value: number) => value * 2), takeT<number>(2))),
      toArray(),
    );

    await expect(firstValueFrom(output)).resolves.toEqual([2, 4]);
    await expect(firstValueFrom(output)).resolves.toEqual([2, 4]);
  });

  it('maps Reduced to complete + synchronous upstream cancellation', async () => {
    let produced = 0;
    let teardown = 0;

    const source = new Observable<number>((subscriber) => {
      for (let value = 1; value <= 100; value += 1) {
        if (subscriber.closed) {
          break;
        }
        produced += 1;
        subscriber.next(value);
      }

      if (!subscriber.closed) {
        subscriber.complete();
      }

      return () => {
        teardown += 1;
      };
    });

    const output = source.pipe(transduce(takeT<number>(3)), toArray());

    await expect(firstValueFrom(output)).resolves.toEqual([1, 2, 3]);
    expect(produced).toBe(3);
    expect(teardown).toBe(1);
  });

  it('routes user-function errors through the Observable error channel', async () => {
    const source = new Observable<number>((subscriber) => {
      subscriber.next(1);
      subscriber.next(2);
      subscriber.next(3);
      subscriber.complete();
    });

    const output = source.pipe(
      transduce(
        mapT((value: number) => {
          if (value === 2) {
            throw new Error('boom');
          }
          return value;
        }),
      ),
      toArray(),
    );

    await expect(firstValueFrom(output)).rejects.toThrow('boom');
  });
});
