import { describe, expect, it } from 'vitest';
import {
  catT,
  composeT,
  distinctUntilChangedT,
  dropT,
  filterT,
  intoArray,
  mapT,
  mapcatT,
  partitionT,
  scanT,
  takeT,
  takeWhileT,
} from '../src/index.js';

describe('transducers', () => {
  it('composes map -> filter -> take without intermediate collections', () => {
    const xform = composeT(
      mapT((value: number) => value * 3),
      filterT((value) => value % 2 === 0),
      takeT(2),
    );

    expect(intoArray([1, 2, 3, 4, 5], xform)).toEqual([6, 12]);
  });

  it('keeps state per execution', () => {
    const xform = scanT((state: number, value: number) => state + value, 0);

    expect(intoArray([1, 2, 3], xform)).toEqual([1, 3, 6]);
    expect(intoArray([10, 20], xform)).toEqual([10, 30]);
  });

  it('supports stateful filtering policies', () => {
    expect(intoArray([1, 1, 2, 2, 1], distinctUntilChangedT<number>())).toEqual([
      1,
      2,
      1,
    ]);
    expect(intoArray([1, 2, 3, 4], dropT<number>(2))).toEqual([3, 4]);
    expect(
      intoArray([1, 2, 3, 2], takeWhileT<number>((value) => value < 3)),
    ).toEqual([1, 2]);
  });

  it('flushes a final partial partition during result()', () => {
    expect(intoArray([1, 2, 3, 4, 5], partitionT<number>(2))).toEqual([
      [1, 2],
      [3, 4],
      [5],
    ]);
  });

  it('cat and mapcat propagate downstream Reduced', () => {
    const flattened = composeT(catT<number>(), takeT<number>(3));
    expect(intoArray([[1, 2], [3, 4], [5]], flattened)).toEqual([1, 2, 3]);

    const mapped = composeT(
      mapcatT((value: number) => [value, value * 10]),
      takeT<number>(3),
    );
    expect(intoArray([1, 2, 3], mapped)).toEqual([1, 10, 2]);
  });
});
