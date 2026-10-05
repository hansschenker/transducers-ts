# transducers-ts

A modern TypeScript implementation of the **classical JavaScript transducer protocol**.

The goal is not to modernize one old package. The goal is to preserve the small, interoperable `@@transducer/*` protocol and put it behind a modern, typed API that can run over today's JavaScript execution models.

```text
                        Transducer
                  process transformation
                           |
              +------------+------------+
              |            |            |
          Iterable    AsyncIterable   Observable
              |            |            |
            pull        async pull    push + time
```

**The machine stays the same. The driver changes.**

## Why

A transducer is independent of the collection or stream that supplies values. It rewires a reducing process:

```text
Transformer<Result, Output>
            ->
Transformer<Result, Input>
```

That lets one transformation be reused across synchronous iteration, asynchronous iteration, and an RxJS Observable adapter without turning the transducer core into an RxJS-specific abstraction.

## Design principles

- Preserve the classical `@@transducer/init`, `@@transducer/step`, `@@transducer/result`, `@@transducer/reduced`, and `@@transducer/value` protocol keys.
- Type the protocol structurally with TypeScript; no class hierarchy is required.
- Use explicit transducer names such as `mapT` and `filterT`. No overloaded `map(collection, fn)` / `map(fn)` API.
- Standard JavaScript protocols first: `Iterable` and `AsyncIterable`.
- Keep transformation synchronous. Time comes from the source/driver.
- Treat `Reduced` as a portable early-termination signal.
- Keep RxJS concerns in the RxJS adapter: subscription, cancellation, `next`, `error`, and `complete`.
- Do not force temporal, higher-order, sharing, or join behavior into the classical reducer protocol.

## Install

```bash
npm install transducers-ts
```

For the optional RxJS adapter:

```bash
npm install transducers-ts rxjs@7.8.2
```

## Core example

```ts
import {
  composeT,
  filterT,
  intoArray,
  mapT,
  takeT,
} from 'transducers-ts';

const xform = composeT(
  mapT((value: number) => value * 3),
  filterT((value) => value % 2 === 0),
  takeT<number>(2),
);

intoArray([1, 2, 3, 4, 5], xform);
// [6, 12]
```

There are no intermediate mapped/filtered collections. `takeT(2)` returns `Reduced` on the same step that emits the second accepted value.

## Same transducer, AsyncIterable

```ts
import { intoArrayAsync } from 'transducers-ts';

async function* values() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
}

await intoArrayAsync(values(), xform);
// [6, 12]
```

The transducer itself did not become asynchronous. The `AsyncIterable` supplies values over asynchronous time.

## Same transducer, RxJS 7.8.2

```ts
import { of } from 'rxjs';
import { composeT, filterT, mapT, takeT } from 'transducers-ts';
import { transduce } from 'transducers-ts/rxjs';

const xform = composeT(
  mapT((value: number) => value * 3),
  filterT((value) => value % 2 === 0),
  takeT<number>(2),
);

const result$ = of(1, 2, 3, 4, 5).pipe(
  transduce(xform),
);
```

Nothing runs until `result$` is subscribed. Every subscription creates fresh transducer state.

For the RxJS adapter:

```text
Transducer Reduced
       |
       +--> result() finalization
       +--> downstream complete()
       +--> upstream unsubscribe()
```

The adapter creates the source `Subscriber` *before* source execution begins, so `Reduced` can cancel synchronous RxJS sources correctly as well as asynchronous ones.

## Scope boundary

Classical transducers are a strong fit for input-driven transformations such as:

```text
map
filter
take / takeWhile
drop / dropWhile
scan
distinctUntilChanged
partition
cat / mapcat over synchronous Iterables
```

They are **not** a replacement for RxJS's reactive orchestration machinery:

```text
delay / debounce / throttle
mergeMap / concatMap / switchMap / exhaustMap
combineLatest / zip / race
share / shareReplay
retry / repeat
schedulers
```

Those operations need time, multiple subscriptions, concurrency, cancellation policies, sharing, or multiple input channels. They remain the responsibility of the host reactive system.

## Public API

Core protocol:

- `Transformer<Result, Input>`
- `Transducer<Input, Output>`
- `transformer(...)`
- `reduced(...)`, `isReduced(...)`, `unreduced(...)`, `ensureReduced(...)`

Composition and transducers:

- `composeT`
- `identityT`
- `mapT`
- `filterT`
- `takeT`, `takeWhileT`
- `dropT`, `dropWhileT`
- `scanT`
- `distinctUntilChangedT`
- `partitionT`
- `catT`, `mapcatT`

Execution adapters:

- `transduce`, `intoArray`, `toIterable`
- `transduceAsync`, `intoArrayAsync`, `toAsyncIterable`
- `transduce` from `transducers-ts/rxjs`

## One classical limitation we keep explicit

The classical protocol can signal `Reduced` only from `step`. It has no pre-subscription/pre-iteration termination signal. Therefore a transducer such as `takeT(0)` cannot tell a generic driver to avoid touching the source altogether; it terminates when the first input reaches `step`.

We keep that behavior explicit rather than silently adding a non-classical protocol extension. Any future extension should live beside the classical compatibility layer, not mutate it.

## Status

`0.1.0` is the semantic foundation: protocol, representative stateless/stateful transducers, Iterable and AsyncIterable drivers, and an RxJS 7.8.2 adapter with early-cancellation tests.

See [docs/DESIGN.md](docs/DESIGN.md), [docs/PROTOCOL.md](docs/PROTOCOL.md), and [docs/ROADMAP.md](docs/ROADMAP.md).
