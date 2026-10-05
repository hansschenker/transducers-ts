# Design

## Purpose

This project modernizes the **protocol**, not `jlongster/transducers.js` as a package.

The old library demonstrated an important separation:

```text
how values are supplied  !=  how each value is transformed
```

That separation still fits modern JavaScript. What changed is the execution landscape: native Iterables are ubiquitous, AsyncIterable is standardized, ESM and TypeScript are normal, and RxJS 7.8.2 provides a mature push execution model.

## Three layers

### 1. Transformation

Transducers describe how a downstream reduction process is rewired.

```text
mapT
filterT
takeT
scanT
...
```

They do not subscribe, schedule, await, or own source iteration.

### 2. Driver

A driver decides when the next input becomes available and what `Reduced` means operationally.

```text
Iterable driver       -> for...of
AsyncIterable driver  -> for await...of
RxJS driver            -> Subscriber.next
```

### 3. Sink / reducer

The final Transformer decides what happens to accepted outputs: collect into an Array, add numbers, emit to an RxJS destination, etc.

## Time remains outside the transducer

For an AsyncIterable or Observable, values arrive over time. The transducer does not manufacture that time.

```text
source / scheduler
       |
       v
   value arrives
       |
       v
transducer step
```

This keeps the same transformation usable for synchronous and asynchronous sources.

## Why `mapT`, not overloaded `map`

The historical JavaScript API often supported both:

```js
map(collection, fn)
map(fn) // transducer
```

This project rejects that overload. A transducer is named explicitly:

```ts
mapT(fn)
```

This improves type inference and keeps collection helpers and process transformations distinct.

## Why higher-order RxJS operators stay outside

A classical transducer can synchronously transform one input step into zero or more downstream steps and can request normal termination.

`switchMap`, for example, needs a different machine:

```text
source next
   -> cancel previous inner subscription
   -> project to new inner Observable
   -> subscribe
   -> react to future inner next/error/complete
```

That requires subscription registries, future notifications, cancellation policy, and completion coordination. Encoding that into the classical reducer protocol would stop being a modernization and start becoming a second RxJS.

The RxJS adapter therefore handles only the part that genuinely composes with classical transducers.

## Compatibility before extensions

The core does not add new protocol keys. A future extension may be useful for concepts such as termination before the first input (`takeT(0)` without touching the source) or asynchronous transformer steps. Such features should be separately named protocols/adapters so classical interoperability remains testable.
