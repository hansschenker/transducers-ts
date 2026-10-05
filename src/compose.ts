import type { Transducer, Transformer } from './protocol.js';

export function composeT<A>(): Transducer<A, A>;
export function composeT<A, B>(ab: Transducer<A, B>): Transducer<A, B>;
export function composeT<A, B, C>(
  ab: Transducer<A, B>,
  bc: Transducer<B, C>,
): Transducer<A, C>;
export function composeT<A, B, C, D>(
  ab: Transducer<A, B>,
  bc: Transducer<B, C>,
  cd: Transducer<C, D>,
): Transducer<A, D>;
export function composeT<A, B, C, D, E>(
  ab: Transducer<A, B>,
  bc: Transducer<B, C>,
  cd: Transducer<C, D>,
  de: Transducer<D, E>,
): Transducer<A, E>;
export function composeT<A, B, C, D, E, F>(
  ab: Transducer<A, B>,
  bc: Transducer<B, C>,
  cd: Transducer<C, D>,
  de: Transducer<D, E>,
  ef: Transducer<E, F>,
): Transducer<A, F>;
export function composeT<A, B, C, D, E, F, G>(
  ab: Transducer<A, B>,
  bc: Transducer<B, C>,
  cd: Transducer<C, D>,
  de: Transducer<D, E>,
  ef: Transducer<E, F>,
  fg: Transducer<F, G>,
): Transducer<A, G>;
export function composeT(
  ...transducers: readonly Transducer<unknown, unknown>[]
): Transducer<unknown, unknown> {
  return <Result>(downstream: Transformer<Result, unknown>) => {
    let current: Transformer<unknown, unknown> = downstream as Transformer<
      unknown,
      unknown
    >;

    for (let index = transducers.length - 1; index >= 0; index -= 1) {
      const transducer = transducers[index];
      if (transducer) {
        current = transducer(current);
      }
    }

    return current as Transformer<Result, unknown>;
  };
}
