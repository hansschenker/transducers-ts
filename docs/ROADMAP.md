# Roadmap

## F00 — Protocol foundation — complete

- Classical `@@transducer/*` keys.
- Structural TypeScript types.
- `Reduced` helpers.
- Typed transformer constructor.

## F01 — Core transducers — complete

- `mapT`, `filterT`.
- `takeT`, `takeWhileT`.
- `dropT`, `dropWhileT`.
- `scanT`, `distinctUntilChangedT`.
- `partitionT`.
- `catT`, `mapcatT` with correct `Reduced` propagation.

## F02 — Standard JavaScript drivers — complete

- `Iterable`: `transduce`, `intoArray`, `toIterable`.
- `AsyncIterable`: `transduceAsync`, `intoArrayAsync`, `toAsyncIterable`.
- Infinite-source early termination tests.

## F03 — RxJS 7.8.2 adapter — complete

- `transducers-ts/rxjs` subpath.
- Cold/per-subscription state.
- `Reduced -> result() -> complete -> upstream cancellation`.
- Correct synchronous-source cancellation.
- Error-channel tests.

## F04 — Protocol conformance suite

- Reusable black-box test contract for third-party transducers.
- Composition laws that are meaningful for the protocol.
- Finalization and early-termination matrix.
- Iterator closing tests for nested `catT` inputs.

## F05 — Operator family expansion

Candidates that stay input-driven and protocol-appropriate:

- `removeT`.
- `keepT` / `keepIndexedT`.
- `takeNthT`.
- `interposeT`.
- `repeatT`.
- `partitionByT`.
- configurable equality variants.

## F06 — Benchmarks

Measure without turning performance claims into design assumptions:

- chained Array methods;
- Iterator Helpers where available;
- fused transducer execution;
- RxJS native operator chain vs RxJS transducer adapter for transducible families.

## F07 — Optional protocol extensions research

Keep these out of the classical compatibility core until semantics are explicit:

- source termination before first input;
- asynchronous transformer steps;
- cancellation/finalization distinction;
- resource-scoped transformers.

Higher-order reactive orchestration, temporal operators, joins, and sharing are deliberately not targets for the classical protocol.
